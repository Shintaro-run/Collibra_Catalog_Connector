# Collibra Catalog Connector

An anatomy-first front-end and Python connector for a Collibra-governed R&D data catalogue. Designed to be published to a static host (SharePoint document library, GitHub Pages, internal CDN) so colleagues who are *authorised* to know about R&D data assets but do not have a Collibra licence can still discover them.

The interface ships with:

- A 3D anatomical map (react-three-fiber) for navigating therapeutic areas
- Bilingual UI (English / 日本語) with one-click toggle
- Cmd/Ctrl-K instant search
- Collibra-style asset detail pages (Status, Certified flag, Classification, PHI/PII/GxP, regulatory frameworks, CDISC SDTM mapping, upstream lineage, column-level schema)
- Click any data steward or owner name to file a structured access request
- A Settings page to configure Collibra OAuth, Microsoft Entra ID + SharePoint, sync schedule, and content filters

> **Live demo:** https://shintaro-run.github.io/Collibra_Catalog_Connector/
>
> The demo is served from realistic but fully fictional pharma metadata. No connection to a real Collibra tenant or SharePoint site is configured.

---

## What's in the repo

```
.
├── scripts/                # Python connector — pulls from Collibra REST API
│   └── fetch_from_collibra.py
├── config/                 # Sync configuration (selected domains, asset types)
│   └── sync_config.json
├── site-src/               # Next.js 14 static catalogue UI
│   ├── app/                # Pages: home, /domain/[slug], /asset/[id], /settings
│   ├── components/         # BodyMap, SearchPalette, StatusBadge, etc.
│   ├── lib/                # Catalog loader and types
│   └── public/catalog.json # Demo dataset (replaced at build time by the connector)
└── .github/workflows/      # GitHub Pages deployment
```

## Front-end features

- **3D anatomical landing page** — rotate, zoom, and click any body region. Therapeutic areas highlight; cross-system programmes (Oncology, Pharmacovigilance, Immunology) light up multiple regions at once with connecting paths.
- **Cmd/Ctrl-K search palette** — instant client-side search across asset display names (English and Japanese), physical names, descriptions, and tags.
- **Asset detail** — Collibra-style status badges (Approved · Under Review · Candidate · Obsolete), Certified flag, classification (Public / Internal / Confidential / Restricted), PHI / PII / GxP indicators, regulatory framework chips (21 CFR Part 11, ICH E6 R3, EU CTR, GDPR, GVP, ICH E2B R3 …), CDISC SDTM / ADaM mapping, source system, physical location, upstream lineage, and column-level schema with CDISC variable annotation.
- **Domain detail** — average quality, certified asset counts, source-system inventory, common-tag distribution.
- **Access request workflow** — clicking any steward or owner name opens a structured access request form (compliance attestation, intended use, manager approval).
- **Settings page** — connection parameters for Collibra OAuth and Microsoft Entra ID, sync schedule (daily / hourly / cron / manual), domain and asset-type filters, quality gates. Stored in browser local storage; secrets are never transmitted from the page.
- **Bilingual UI**, light / dark themes, glassmorphism surfaces, top-of-page progress indicator, smooth Framer-Motion transitions.

## Architecture

```
┌────────────┐   OAuth (Client      ┌─────────────────┐   Microsoft Graph    ┌───────────────┐
│  Collibra  │ ──Credentials)─────▶│  Python (here)  │ ────(SharePoint API)─▶│  SharePoint   │
└────────────┘                      │  + Next.js build │                       │ (or GH Pages) │
                                    └─────────────────┘                       └───────────────┘
                                            │
                                            ▼ catalog.json (server-side fetch)
                                       ┌─────────────┐
                                       │  Static UI  │
                                       └─────────────┘
```

1. The Python connector authenticates against Collibra (Application type **Integration**, grant type **Client Credentials**) and writes a normalised `catalog.json`.
2. `next build` consumes that file and emits a fully static site under `site-src/out/`.
3. The output can be uploaded to a SharePoint document library (set as the site's home page) or hosted on any static host. This repository deploys it to GitHub Pages on every push to `main`.

## Local development

Prerequisites: Node 20+ and Python 3.12+.

```bash
# Front-end
cd site-src
npm install
npm run dev            # http://localhost:3000

# Back-end (optional — only when connecting to a real Collibra tenant)
cd ..
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in COLLIBRA_BASE_URL, CLIENT_ID, CLIENT_SECRET
python scripts/fetch_from_collibra.py
```

## Configuration

### Collibra

In Collibra: **Settings → Manage OAuth applications → Add**, choose **Type: Integration** and **Grant type: Client Credentials**. Use the resulting Client ID and Secret in `.env` (for the Python connector) or in the in-app Settings page (for documentation).

### Microsoft Entra ID + SharePoint (optional)

Required only when publishing to SharePoint. Register an application in Microsoft Entra with the **`Sites.ReadWrite.All`** application permission (admin consent required), then provide the Tenant ID, Client ID, and Client Secret on the Settings page.

### Sync schedule

Configurable from the Settings page (daily, hourly, cron, or manual-only). The bundled GitHub Actions workflow rebuilds the static site on every push; for a recurring Collibra → SharePoint sync, run the Python connector via a scheduled GitHub Actions workflow or any cron host.

## Status

This is a working PoC. It is *not* connected to any production Collibra tenant or SharePoint site by default — the demo data ships with the repository so the UI can be reviewed in isolation.

## Licence

Internal use within the maintaining organisation. Distribution to third parties is subject to that organisation's data-sharing policy.
