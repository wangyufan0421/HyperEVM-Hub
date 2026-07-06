import type { HyperEvmEcosystemMetrics } from "@/lib/defillama-ecosystem";

const HYPERLIQUID_BAR_COLOR = "#86efd9";
const BAR_COLORS = ["#c465df", "#a9aba9", "#5272f8", "#f4bd68", "#df6fba", "#9b9a00", "#5ac9c9", "#5fc780", "#7fb243", "#b67bff"];

function formatUsdCompact(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";

  return Intl.NumberFormat("en-US", {
    compactDisplay: "short",
    currency: "USD",
    maximumFractionDigits: 2,
    notation: "compact",
    style: "currency",
  }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "--";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "--";
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function DexChainRankingCard({ metrics }: { metrics: HyperEvmEcosystemMetrics | null }) {
  const rows = metrics?.dexChainRankings ?? [];
  const maxVolume = Math.max(...rows.map((row) => row.volume24h), 1);
  const hyperliquidRank = metrics?.hyperliquidDexRank ?? null;

  return (
    <section className="ui-card overflow-hidden p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">DefiLlama DEX volume</p>
          <h2 className="mt-1 text-[24px] font-semibold leading-tight text-[color:var(--text)] sm:text-[30px]">24h DEX TVL TOP10 排行榜</h2>
          <p className="mt-2 text-[13px] font-medium text-[color:var(--text-mute)]">Update: {formatDate(metrics?.updatedAt)}</p>
        </div>
        <div className="ui-card-quiet min-w-[132px] px-4 py-3 text-right">
          <p className="eyebrow text-[10px]">Hyperliquid L1</p>
          <p className="num mt-1 text-[24px] font-semibold text-[color:var(--mint)]">{hyperliquidRank ? `#${hyperliquidRank}` : "--"}</p>
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="mt-6 grid gap-3">
          {rows.map((row, index) => {
            const width = `${Math.max(4, (row.volume24h / maxVolume) * 100)}%`;
            const color = row.isHyperliquid ? HYPERLIQUID_BAR_COLOR : BAR_COLORS[index % BAR_COLORS.length];

            return (
              <div className="grid grid-cols-[34px_minmax(92px,145px)_minmax(0,1fr)_82px] items-center gap-3 sm:grid-cols-[42px_minmax(140px,190px)_minmax(0,1fr)_112px]" key={row.name}>
                <span className="num text-right text-[12px] font-semibold text-[color:var(--text-dim)]">#{row.rank}</span>
                <span className={`truncate text-[14px] font-semibold ${row.isHyperliquid ? "text-[color:var(--mint)]" : "text-[color:var(--text-soft)]"}`}>{row.name}</span>
                <div className="h-9 overflow-hidden rounded-[8px] border border-[color:var(--line)] bg-white/58">
                  <div
                    className="h-full min-w-8 rounded-[7px] transition-[width]"
                    style={{ backgroundColor: color, width }}
                  />
                </div>
                <span className="num text-right text-[12px] font-semibold text-[color:var(--text)] sm:text-[13px]">{formatUsdCompact(row.volume24h)}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-[8px] border border-[color:var(--line)] bg-white/58 px-4 py-8 text-center text-[13px] font-semibold text-[color:var(--text-mute)]">
          DefiLlama DEX ranking data is unavailable.
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--line)] pt-4 text-[12px] font-semibold text-[color:var(--text-mute)]">
        <span>Source: DefiLlama DEX overview</span>
        <span>{formatUsdCompact(metrics?.dexVolume24h)} Hyperliquid L1 24h volume</span>
      </div>
    </section>
  );
}
