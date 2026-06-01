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
    <div className="rounded-[8px] border border-[#0e3f3a18] bg-[#f8fffc]/86 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <p className="text-[11px] font-black uppercase tracking-normal text-[#6b837e]">{label}</p>
      <p className="mt-3 font-mono text-[24px] font-black leading-none text-[#063934] sm:text-[26px]">
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
    <section className="min-h-[420px] rounded-[8px] border border-[#0e3f3a24] bg-[#f1fffb]/88 p-5 text-[#063934] shadow-[0_18px_50px_rgba(7,43,40,0.10)] backdrop-blur-md sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-black uppercase tracking-normal text-[#0a8f7d]">HyperEVM 生态</p>
          <h2 className="mt-2 text-[24px] font-black leading-tight text-[#062d29]">HyperEVM 生态数据</h2>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <MetricTile key={item.label} {...item} />
        ))}
      </div>

      <div className="mt-4 border-t border-[#0e3f3a14] pt-4 text-[12px] font-bold text-[#6b837e]">
        <span>Source: DefiLlama free API</span>
      </div>
    </section>
  );
}
