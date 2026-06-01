import { RefreshCountdown } from "@/components/dashboard/refresh-countdown";
import type { HyperEvmTvlDashboardData, HyperEvmTvlRow } from "@/lib/defillama-hyperevm-tvl";

function formatUsdCompact(value: number | null) {
  if (value === null) {
    return "--";
  }

  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(3)}b`;
  }
  if (abs >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}m`;
  }
  if (abs >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}k`;
  }

  return `$${value.toFixed(2)}`;
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "--";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function ChangeValue({ value }: { value: number | null }) {
  const color = value === null ? "text-[#8ba29d]" : value >= 0 ? "text-[#087b6d]" : "text-[#b6413b]";
  return <span className={`font-mono text-[15px] font-black ${color}`}>{formatPercent(value)}</span>;
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[10px] border border-[#0e3f3a20] bg-[#fbfffd]/86 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <p className="text-[11px] font-black uppercase tracking-normal text-[#6b837e]">{label}</p>
      <p className="mt-3 font-mono text-[24px] font-black leading-none text-[#063934] sm:text-[26px]">{value}</p>
      <p className="mt-2 text-[11px] font-bold text-[#7a9690]">{helper}</p>
    </div>
  );
}

function ProjectCell({ row }: { row: HyperEvmTvlRow }) {
  return (
    <div className="flex min-w-[220px] items-center gap-3">
      {row.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="h-9 w-9 rounded-[8px] border border-[#0e3f3a1a] bg-white object-contain p-1" src={row.logo} />
      ) : (
        <span className="grid h-9 w-9 place-items-center rounded-[8px] bg-[#dff8f2] text-[12px] font-black text-[#087b6d]">
          {row.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-[16px] font-black text-[#063934]">{row.name}</p>
        <p className="mt-1 truncate text-[13px] font-bold text-[#6b837e]">{row.slug}</p>
      </div>
    </div>
  );
}

function TvlTable({ rows }: { rows: HyperEvmTvlRow[] }) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-[#0e3f3a22] bg-[#f8fffc]/88 shadow-[0_18px_44px_rgba(7,43,40,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#0e3f3a14] p-5 sm:p-6">
        <div>
          <h2 className="text-[22px] font-black leading-tight text-[#062d29] sm:text-[24px]">HyperEVM 项目 TVL 排行</h2>
          <p className="mt-1 text-[12px] font-bold leading-5 text-[#66817c]">按 Hyperliquid L1 当前 TVL 排序，展示前 20 个项目的 TVL 变化和费用数据。</p>
        </div>
        <span className="rounded-[8px] border border-[#0e3f3a20] bg-white/70 px-2.5 py-1 text-[11px] font-black text-[#53746e]">
          TOP 20
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#0e3f3a10] bg-[#eefbf7]/74 text-[13px] font-black uppercase tracking-normal text-[#6b837e]">
              <th className="px-5 py-4">#</th>
              <th className="px-5 py-4">项目</th>
              <th className="px-5 py-4">类型</th>
              <th className="px-5 py-4 text-right">当前 TVL</th>
              <th className="px-5 py-4 text-right">24h TVL</th>
              <th className="px-5 py-4 text-right">7D TVL</th>
              <th className="px-5 py-4 text-right">30D TVL</th>
              <th className="px-5 py-4 text-right">24H App Fee</th>
              <th className="px-5 py-4 text-right">7D Fee</th>
              <th className="px-5 py-4 text-right">30D Fee</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-[#0e3f3a0f] text-[14px] font-bold text-[#244d48] last:border-b-0 hover:bg-[#effbf7]/70" key={row.slug}>
                <td className="px-5 py-5 font-mono text-[15px] font-black text-[#087b6d]">{row.rank}</td>
                <td className="px-5 py-4">
                  <ProjectCell row={row} />
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-[7px] bg-[#e0fbf4] px-2.5 py-1.5 text-[13px] font-black text-[#087b6d]">{row.category}</span>
                </td>
                <td className="px-5 py-4 text-right font-mono text-[15px] font-black text-[#063934]">{formatUsdCompact(row.currentTvl)}</td>
                <td className="px-5 py-4 text-right">
                  <ChangeValue value={row.tvlChange24h} />
                </td>
                <td className="px-5 py-4 text-right">
                  <ChangeValue value={row.tvlChange7d} />
                </td>
                <td className="px-5 py-4 text-right">
                  <ChangeValue value={row.tvlChange30d} />
                </td>
                <td className="px-5 py-4 text-right font-mono text-[15px] font-black text-[#063934]">{formatUsdCompact(row.fees24h)}</td>
                <td className="px-5 py-4 text-right font-mono text-[15px] font-black text-[#063934]">{formatUsdCompact(row.fees7d)}</td>
                <td className="px-5 py-4 text-right font-mono text-[15px] font-black text-[#063934]">{formatUsdCompact(row.fees30d)}</td>
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
    <section className="rounded-[10px] border border-[#0e3f3a22] bg-[#f8fffc]/88 p-6 text-[#063934]">
      <p className="text-[12px] font-black uppercase text-[#0b9482]">HyperEVM TVL</p>
      <h2 className="mt-2 text-[24px] font-black">暂时无法加载 HyperEVM TVL 数据</h2>
      <p className="mt-2 text-[13px] font-bold text-[#66817c]">{message}</p>
    </section>
  );
}

export function HyperEvmTvlDashboard({ data, error }: { data: HyperEvmTvlDashboardData | null; error?: string }) {
  if (!data) {
    return <ErrorState message={error ?? "DefiLlama data is temporarily unavailable."} />;
  }

  return (
    <div className="space-y-4 text-[#063934]">
      <section className="rounded-[10px] border border-[#0e3f3a22] bg-[linear-gradient(135deg,#ffffffd9,#e8fbf5)] p-5 shadow-[0_18px_48px_rgba(7,43,40,0.08)] sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-normal text-[#0a8f7d]">HyperEVM 数据看板</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-black leading-tight text-[#052c28] sm:text-[34px]">HyperEVM TVL 排行</h1>
          </div>
          <RefreshCountdown cacheExpiresAt={data.cacheExpiresAt} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper="按当前 TVL 排序" label="追踪项目" value={`${data.totals.protocols}`} />
        <MetricCard helper="前 20 项目合计" label="当前 TVL" value={formatUsdCompact(data.totals.currentTvl)} />
        <MetricCard helper="对应 DefiLlama App Fees (24h)" label="24H App Fee" value={formatUsdCompact(data.totals.fees24h)} />
        <MetricCard helper="有 revenue adapter 的项目合计" label="24H Revenue" value={formatUsdCompact(data.totals.revenue24h)} />
      </section>

      <TvlTable rows={data.rows} />

      <p className="text-[11px] font-bold text-[#6b837e]">
        数据来源：{data.source}。TVL 变化基于 DefiLlama 协议历史 TVL 计算；没有 fee adapter 的项目显示为 --。
      </p>
    </div>
  );
}
