#!/usr/bin/env python3
"""Fetch metadata from Collibra and save it as a JSON catalog file.

Usage:
    python scripts/fetch_from_collibra.py
    python scripts/fetch_from_collibra.py --config config/sync_config.json
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG_PATH = PROJECT_ROOT / "config" / "sync_config.json"


def load_env() -> dict[str, str]:
    load_dotenv(PROJECT_ROOT / ".env")
    required = ["COLLIBRA_BASE_URL", "COLLIBRA_CLIENT_ID", "COLLIBRA_CLIENT_SECRET"]
    env: dict[str, str] = {}
    missing: list[str] = []
    for key in required:
        value = os.environ.get(key)
        if not value:
            missing.append(key)
        else:
            env[key] = value.rstrip("/") if key == "COLLIBRA_BASE_URL" else value
    if missing:
        sys.exit(
            f"Missing environment variables: {', '.join(missing)}\n"
            f"Copy .env.example to .env and fill in real values."
        )
    env["COLLIBRA_TIMEOUT"] = os.environ.get("COLLIBRA_TIMEOUT", "30")
    return env


def get_access_token(base_url: str, client_id: str, client_secret: str, timeout: int) -> str:
    token_url = f"{base_url}/rest/oauth/v2/token"
    resp = requests.post(
        token_url,
        data={
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
        },
        timeout=timeout,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def api_get(base_url: str, path: str, token: str, params: dict[str, Any], timeout: int) -> dict:
    url = f"{base_url}{path}"
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    resp = requests.get(url, headers=headers, params=params, timeout=timeout)
    resp.raise_for_status()
    return resp.json()


def resolve_domain_ids(
    base_url: str,
    token: str,
    timeout: int,
    explicit_ids: list[str],
    domain_names: list[str],
) -> list[dict]:
    """Combine explicit domain IDs and name-based lookups into a unique domain list."""
    domains: dict[str, dict] = {}

    if explicit_ids:
        for domain_id in explicit_ids:
            data = api_get(base_url, f"/rest/2.0/domains/{domain_id}", token, {}, timeout)
            domains[data["id"]] = {"id": data["id"], "name": data.get("name", "")}

    if domain_names:
        page = 0
        while True:
            data = api_get(
                base_url,
                "/rest/2.0/domains",
                token,
                {"offset": page * 100, "limit": 100},
                timeout,
            )
            results = data.get("results", [])
            if not results:
                break
            for d in results:
                if d.get("name") in domain_names:
                    domains[d["id"]] = {"id": d["id"], "name": d["name"]}
            if len(results) < 100:
                break
            page += 1

    return list(domains.values())


def fetch_assets_for_domain(
    base_url: str,
    token: str,
    timeout: int,
    domain_id: str,
    asset_types: list[str],
    max_assets: int,
    page_size: int,
) -> list[dict]:
    """Page through assets in a single domain, optionally filtered by asset type names."""
    collected: list[dict] = []
    offset = 0
    while len(collected) < max_assets:
        params: dict[str, Any] = {
            "domainId": domain_id,
            "offset": offset,
            "limit": min(page_size, max_assets - len(collected)),
        }
        if asset_types:
            params["typeNames"] = asset_types
        data = api_get(base_url, "/rest/2.0/assets", token, params, timeout)
        results = data.get("results", [])
        if not results:
            break
        collected.extend(results)
        if len(results) < params["limit"]:
            break
        offset += len(results)
    return collected


def build_catalog(config: dict, env: dict[str, str]) -> dict:
    base_url = env["COLLIBRA_BASE_URL"]
    timeout = int(env["COLLIBRA_TIMEOUT"])
    token = get_access_token(
        base_url, env["COLLIBRA_CLIENT_ID"], env["COLLIBRA_CLIENT_SECRET"], timeout
    )

    domains = resolve_domain_ids(
        base_url,
        token,
        timeout,
        config.get("selected_domains", []),
        config.get("selected_domain_names", []),
    )

    if not domains:
        print("WARNING: no domains matched the configuration. Output will be empty.")

    catalog_domains = []
    total_assets = 0
    for domain in domains:
        print(f"Fetching domain: {domain['name']} ({domain['id']})")
        assets = fetch_assets_for_domain(
            base_url,
            token,
            timeout,
            domain["id"],
            config.get("asset_types", []),
            config.get("max_assets_per_domain", 500),
            config.get("page_size", 100),
        )
        catalog_domains.append({**domain, "assets": assets, "asset_count": len(assets)})
        total_assets += len(assets)
        print(f"  → {len(assets)} assets")

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": base_url,
        "domain_count": len(catalog_domains),
        "asset_count": total_assets,
        "domains": catalog_domains,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch Collibra metadata into a JSON catalog.")
    parser.add_argument(
        "--config",
        type=Path,
        default=DEFAULT_CONFIG_PATH,
        help=f"Path to sync config JSON (default: {DEFAULT_CONFIG_PATH})",
    )
    args = parser.parse_args()

    config = json.loads(args.config.read_text())
    env = load_env()

    catalog = build_catalog(config, env)

    output_path = PROJECT_ROOT / config.get("output_path", "data/catalog.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False))
    print(
        f"\nWrote {catalog['asset_count']} assets across "
        f"{catalog['domain_count']} domains → {output_path}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
