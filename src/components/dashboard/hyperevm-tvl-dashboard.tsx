import { RefreshCountdown } from "@/components/dashboard/refresh-countdown";
import type { HyperEvmTvlDashboardData, HyperEvmTvlRow } from "@/lib/defillama-hyperevm-tvl";

function formatUsdCompact(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "--";
  return Intl.NumberFormat("en-US", {
    compactDisplay: "short",
    currency: "USD",
    maximumFractionDigits: 2,
    notation: "compact",
    style: "currency",
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "--";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function MetricCard({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <div className="ui-card-quiet px-4 py-3">
      <p className="eyebrow">{label}</p>
      <p className="num mt-2 text-[24px] font-semibold leading-none text-[color:var(--text)]">{value}</p>
      <p className="mt-2 text-[12px] font-medium text-[color:var(--text-mute)]">{helper}</p>
    </div>
  );
}

function ChangeValue({ value }: { value: number | null }) {
  const tone = value === null ? "text-[color:var(--text-dim)]" : value >= 0 ? "text-[color:var(--mint)]" : "text-[#b4534f]";
  return <span className={`num text-[13px] font-semibold ${tone}`}>{formatPercent(value)}</span>;
}

function ProjectCell({ row }: { row: HyperEvmTvlRow }) {
  return (
    <div className="flex min-w-[220px] items-center gap-3">
      {row.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="h-9 w-9 rounded-[8px] border border-[color:var(--line)] bg-white object-contain p-1" src={row.logo} />
      ) : (
        <span className="grid h-9 w-9 place-items-center rounded-[8px] border border-[color:var(--line)] bg-[color:var(--surface-soft)] text-[12px] font-semibold text-[color:var(--mint)]">
          {row.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold text-[color:var(--text)]">{row.name}</p>
        <p className="mt-1 truncate text-[12px] font-medium text-[color:var(--text-mute)]">{row.slug}</p>
      </div>
    </div>
  );
}

function TvlTable({ rows }: { rows: HyperEvmTvlRow[] }) {
  return (
    <section className="ui-card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--line)] p-5 sm:p-6">
        <div>
          <p className="eyebrow">DefiLlama ranking</p>
          <h2 className="mt-1 text-[20px] font-semibold text-[color:var(--text)]">HyperEVM TVL 排行</h2>
          <p className="mt-1 text-[12px] font-medium leading-5 text-[color:var(--text-mute)]">
            按 Hyperliquid L1 当前 TVL 排序，展示前 20 个协议的 TVL 变化和费用数据。
          </p>
        </div>
        <span className="ui-button">Top 20</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[color:var(--line)] bg-[color:var(--surface-soft)] text-[11px] font-semibold uppercase text-[color:var(--text-dim)]">
              <th className="px-5 py-3">#</th>
              <th className="px-5 py-3">项目</th>
              <th className="px-5 py-3">类型</th>
              <th className="px-5 py-3 text-right">当前 TVL</th>
              <th className="px-5 py-3 text-right">24h</th>
              <th className="px-5 py-3 text-right">7D</th>
              <th className="px-5 py-3 text-right">30D</th>
              <th className="px-5 py-3 text-right">24H Fee</th>
              <th className="px-5 py-3 text-right">7D Fee</th>
              <th className="px-5 py-3 text-right">30D Fee</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-[color:var(--line)] text-[13px] font-medium text-[color:var(--text-soft)] last:border-b-0 hover:bg-white/72" key={row.slug}>
                <td className="px-5 py-4">
                  <span className="num text-[13px] font-semibold text-[color:var(--mint)]">{row.rank}</span>
                </td>
                <td className="px-5 py-4">
                  <ProjectCell row={row} />
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-[7px] border border-[color:var(--line)] bg-white/62 px-2 py-1 text-[12px] font-semibold text-[color:var(--text-soft)]">
                    {row.category}
                  </span>
                </td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--text)]">{formatUsdCompact(row.currentTvl)}</td>
                <td className="px-5 py-4 text-right"><ChangeValue value={row.tvlChange24h} /></td>
                <td className="px-5 py-4 text-right"><ChangeValue value={row.tvlChange7d} /></td>
                <td className="px-5 py-4 text-right"><ChangeValue value={row.tvlChange30d} /></td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--text)]">{formatUsdCompact(row.fees24h)}</td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--text)]">{formatUsdCompact(row.fees7d)}</td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--text)]">{formatUsdCompact(row.fees30d)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="ui-card p-6">
      <p className="eyebrow">HyperEVM TVL</p>
      <h2 className="mt-2 text-[24px] font-semibold text-[color:var(--text)]">暂时无法加载 HyperEVM TVL 数据</h2>
      <p className="mt-2 text-[13px] font-medium text-[color:var(--text-mute)]">{message}</p>
    </section>
  );
}

export function HyperEvmTvlDashboard({ data, error }: { data: HyperEvmTvlDashboardData | null; error?: string }) {
  if (!data) {
    return <ErrorState message={error ?? "DefiLlama data is temporarily unavailable."} />;
  }

  return (
    <div className="space-y-4">
      <section className="ui-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">HyperEVM dashboard</p>
            <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-[color:var(--text)] sm:text-[36px]">
              HyperEVM TVL
            </h1>
            <p className="mt-2 max-w-[620px] text-[13px] font-medium leading-6 text-[color:var(--text-mute)]">
              追踪 Hyperliquid L1 上主要协议的 TVL、费用和收入变化。
            </p>
          </div>
          <RefreshCountdown cacheExpiresAt={data.cacheExpiresAt} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper="按当前 TVL 排序" label="追踪项目" value={`${data.totals.protocols}`} />
        <MetricCard helper="前 20 项目合计" label="当前 TVL" value={formatUsdCompact(data.totals.currentTvl)} />
        <MetricCard helper="DefiLlama App Fees 24h" label="24H App Fee" value={formatUsdCompact(data.totals.fees24h)} />
        <MetricCard helper="有 revenue adapter 的项目合计" label="24H Revenue" value={formatUsdCompact(data.totals.revenue24h)} />
      </section>

      <TvlTable rows={data.rows} />

      <p className="text-[11px] font-medium text-[color:var(--text-dim)]">
        数据来源：{data.source}。TVL 变化基于 DefiLlama 协议历史 TVL 计算；没有 fee adapter 的项目显示为 --。
      </p>
    </div>
  );
}
