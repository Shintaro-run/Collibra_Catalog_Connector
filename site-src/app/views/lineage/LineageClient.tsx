'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
  Handle,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { Catalog, Domain } from '@/lib/types';
import { useT, pickField } from '@/lib/i18n';
import { StatTile } from '@/components/StatTile';

type AssetNodeData = {
  displayName: string;
  name: string;
  type: string;
  status: string;
  certified: boolean;
  domainName: string;
  color: string;
  href: string;
  qualityScore: number;
};

function AssetNode({ data }: NodeProps<AssetNodeData>) {
  return (
    <Link
      href={data.href}
      className="block w-[210px] group"
      style={{ filter: 'drop-shadow(0 0 12px rgba(45,212,191,0.18))' }}
    >
      <div
        className="rounded-xl border bg-[color-mix(in_oklab,#020617_82%,transparent)] backdrop-blur px-3 py-2 transition-colors group-hover:border-mint-400"
        style={{ borderColor: `${data.color}44` }}
      >
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: data.color, width: 8, height: 8 }}
        />
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: data.color, width: 8, height: 8 }}
        />
        <div className="flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: data.color }}
          />
          <span className="text-[10px] uppercase tracking-[0.16em] text-ink-400">
            {data.domainName}
          </span>
          {data.certified && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-mint-500" />
          )}
        </div>
        <div className="text-[12px] font-medium text-ink-50 truncate mt-0.5">
          {data.displayName}
        </div>
        <div className="text-[10px] text-ink-400 truncate font-mono">{data.name}</div>
        <div className="flex items-center justify-between mt-1.5 text-[10px] text-ink-400">
          <span>{data.type}</span>
          <span className="font-mono tabular-nums" style={{ color: data.color }}>
            Q{data.qualityScore}
          </span>
        </div>
      </div>
    </Link>
  );
}

const nodeTypes = { asset: AssetNode };

export function LineageClient({ catalog }: { catalog: Catalog }) {
  const { t, lang } = useT();

  const { nodes, edges, isolatedCount, edgeCount } = useMemo(() => {
    const allAssets = catalog.domains.flatMap((d) =>
      d.assets.map((a) => ({ asset: a, domain: d })),
    );
    const byId = new Map(allAssets.map((x) => [x.asset.id, x]));
    const incoming = new Map<string, number>();
    const outgoing = new Map<string, number>();
    for (const { asset } of allAssets) {
      for (const upId of asset.upstreamAssetIds ?? []) {
        if (!byId.has(upId)) continue;
        outgoing.set(upId, (outgoing.get(upId) ?? 0) + 1);
        incoming.set(asset.id, (incoming.get(asset.id) ?? 0) + 1);
      }
    }

    const connectedIds = new Set<string>();
    const eds: Edge[] = [];
    for (const { asset, domain } of allAssets) {
      for (const upId of asset.upstreamAssetIds ?? []) {
        if (!byId.has(upId)) continue;
        connectedIds.add(asset.id);
        connectedIds.add(upId);
        eds.push({
          id: `${upId}-${asset.id}`,
          source: upId,
          target: asset.id,
          animated: true,
          style: { stroke: domain.color, strokeWidth: 1.5, opacity: 0.6 },
          markerEnd: { type: MarkerType.ArrowClosed, color: domain.color, width: 14, height: 14 },
        });
      }
    }

    const connectedAssets = allAssets.filter(({ asset }) => connectedIds.has(asset.id));

    const byDomain = new Map<Domain, typeof connectedAssets>();
    for (const item of connectedAssets) {
      if (!byDomain.has(item.domain)) byDomain.set(item.domain, []);
      byDomain.get(item.domain)!.push(item);
    }

    const domains = [...byDomain.keys()];
    const colCount = Math.max(1, Math.ceil(Math.sqrt(domains.length)));
    const COL_WIDTH = 360;
    const ROW_HEIGHT = 130;
    const ns: Node<AssetNodeData>[] = [];
    domains.forEach((domain, i) => {
      const col = i % colCount;
      const row = Math.floor(i / colCount);
      const items = byDomain.get(domain)!;
      items.forEach((item, j) => {
        const x = col * COL_WIDTH * 1.2 + (j % 2) * 240;
        const y = row * ROW_HEIGHT * 6 + Math.floor(j / 2) * (ROW_HEIGHT + 18);
        ns.push({
          id: item.asset.id,
          type: 'asset',
          position: { x, y },
          data: {
            displayName: pickField(item.asset as never, 'displayName', lang),
            name: item.asset.name,
            type: item.asset.type,
            status: item.asset.status,
            certified: item.asset.certified,
            domainName: pickField(item.domain as never, 'name', lang),
            color: item.domain.color,
            href: `/asset/${item.asset.id}/`,
            qualityScore: item.asset.qualityScore,
          },
        });
      });
    });

    return {
      nodes: ns,
      edges: eds,
      isolatedCount: allAssets.length - connectedAssets.length,
      edgeCount: eds.length,
    };
  }, [catalog, lang]);

  return (
    <div className="space-y-8">
      <Link
        href="/views/"
        className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-mint-500 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        {t.views.title}
      </Link>

      <header className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-mint-500">
          {t.views.kicker}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{t.lineage.title}</h1>
        <p className="text-ink-500 dark:text-ink-400 max-w-2xl text-sm leading-relaxed">
          {t.lineage.desc}
        </p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          label={lang === 'ja' ? '接続アセット' : 'Connected assets'}
          value={nodes.length}
        />
        <StatTile
          label={lang === 'ja' ? 'リネージ辺' : 'Lineage edges'}
          value={edgeCount}
        />
        <StatTile label={t.lineage.isolated} value={isolatedCount} />
        <StatTile
          label={lang === 'ja' ? '治療領域' : 'Therapeutic areas'}
          value={catalog.domainCount}
        />
      </section>

      <section className="rounded-2xl border border-ink-200 dark:border-ink-800 bg-gradient-to-br from-ink-950 via-ink-900/60 to-ink-950 h-[640px] overflow-hidden">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            className="bg-transparent"
          >
            <Background color="#334155" gap={32} size={1} />
            <Controls
              position="bottom-right"
              showInteractive={false}
              className="!bg-ink-900/80 !border-ink-800 !rounded-lg"
            />
            <MiniMap
              pannable
              zoomable
              nodeColor={(n) => (n.data as AssetNodeData).color}
              maskColor="rgba(2,6,23,0.6)"
              className="!bg-ink-900/70 !rounded-lg !border !border-ink-800"
            />
          </ReactFlow>
        </ReactFlowProvider>
      </section>

      <div className="text-[11px] text-ink-400">{t.lineage.controls}</div>
    </div>
  );
}
