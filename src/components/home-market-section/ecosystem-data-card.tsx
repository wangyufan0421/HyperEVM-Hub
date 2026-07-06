import type { HyperEvmEcosystemMetrics } from "@/lib/defillama-ecosystem";

type MetricItem = {
  label: string;
  value: number | null;
};

function formatUsdCompact(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "--";
  }

  return Intl.NumberFormat("en-US", {
    compactDisplay: "short",
    currency: "USD",
    maximumFractionDigits: value >= 1_000_000 ? 2 : 0,
    notation: "compact",
    style: "currency",
  }).format(value);
}

function MetricTile({ label, value }: MetricItem) {
  return (
    <div className="ui-card-quiet p-4">
      <p className="eyebrow text-[10px]">{label}</p>
      <p className="num mt-3 text-[24px] font-semibold leading-none text-[color:var(--text)] sm:text-[26px]">
        {formatUsdCompact(value)}
      </p>
    </div>
  );
}

export function EcosystemDataCard({ metrics }: { metrics: HyperEvmEcosystemMetrics | null }) {
  const items: MetricItem[] = [
    { label: "24h Chain Fees", value: metrics?.chainFees24h ?? null },
    { label: "24h Chain Revenue", value: metrics?.chainRevenue24h ?? null },
    { label: "24h App Fees", value: metrics?.appFees24h ?? null },
    { label: "24h App Revenue", value: metrics?.appRevenue24h ?? null },
    { label: "24h DEX Volume", value: metrics?.dexVolume24h ?? null },
  ];

  return (
    <section className="ui-card min-h-[390px] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">生态数据</p>
          <h2 className="mt-2 text-[24px] font-semibold leading-tight text-[color:var(--text)]">生态数据</h2>
          <p className="mt-2 text-[13px] font-medium text-[color:var(--text-mute)]">
            聚合公开市场数据中的费用、收入和交易量信号。
          </p>
        </div>
        <span className="ui-button h-8 text-[12px]">DefiLlama</span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <MetricTile key={item.label} {...item} />
        ))}
      </div>
    </section>
  );
}
