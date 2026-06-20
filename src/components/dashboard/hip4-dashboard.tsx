"use client";

import type { Hip4DashboardData, Hip4OutcomePrice, Hip4PriceSide } from "@/lib/loris-hip4";
import type { ReactNode } from "react";
import { RefreshCountdown } from "./refresh-countdown";

function formatCompact(value: number) {
  return Intl.NumberFormat("en-US", {
    compactDisplay: "short",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
    notation: "compact",
  }).format(value);
}

function formatPrice(value: number) {
  return value.toFixed(value >= 0.1 ? 4 : 6);
}

function formatPercent(value: number) {
  return `${value.toFixed(value >= 10 ? 2 : 3)}%`;
}

function InlineTooltip({ lines }: { lines: string[] }) {
  return (
    <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden min-w-[190px] -translate-x-1/2 rounded-[8px] bg-[#062d29] px-3 py-2 text-left font-mono text-[12px] font-black text-white shadow-[0_12px_30px_rgba(6,45,41,0.24)] group-hover:block">
      {lines.map((line, index) => (
        <span className={index === 0 ? "block text-[11px] text-[#b8efe4]" : "mt-1 block"} key={`${line}-${index}`}>
          {line}
        </span>
      ))}
    </span>
  );
}

function ChartFrame({ title, subtitle, children, badge = "FREE API" }: { title: string; subtitle: string; children: ReactNode; badge?: string }) {
  return (
    <section className="rounded-[10px] border border-[#0e3f3a22] bg-[#f8fffc]/88 p-5 shadow-[0_18px_44px_rgba(7,43,40,0.08)] sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-black leading-tight text-[#062d29] sm:text-[24px]">{title}</h2>
          <p className="mt-1 text-[12px] font-bold leading-5 text-[#66817c]">{subtitle}</p>
        </div>
        <span className="rounded-[8px] border border-[#0e3f3a20] bg-white/70 px-2.5 py-1 text-[11px] font-black text-[#53746e]">{badge}</span>
      </div>
      {children}
    </section>
  );
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

function sideFor(outcome: Hip4OutcomePrice, side: number) {
  return outcome.sides.find((item) => item.side === side);
}

function PriceRank({ outcomes, side }: { outcomes: Hip4OutcomePrice[]; side: number }) {
  const rows = outcomes
    .map((outcome) => ({ outcome, sideData: sideFor(outcome, side) }))
    .filter((row): row is { outcome: Hip4OutcomePrice; sideData: Hip4PriceSide } => Boolean(row.sideData))
    .slice(0, 12);

  const max = Math.max(...rows.map((row) => row.sideData.price), 1);

  return (
    <div className="space-y-3">
      {rows.map(({ outcome, sideData }) => (
        <div className="group relative grid grid-cols-[64px_1fr_96px] items-center gap-3 text-[12px] font-black" key={`${outcome.outcomeId}-${sideData.side}`}>
          <span className="rounded-[6px] bg-[#e0fbf4] px-2 py-1 text-center text-[11px] text-[#087b6d]">{sideData.name}</span>
          <span className="min-w-0">
            <span className="block truncate text-[#244d48]">#{outcome.outcomeId} {outcome.title}</span>
            <span className="mt-1 block h-3 rounded-full bg-[#e3f3ef]">
              <span className="block h-3 rounded-full bg-[#73cbbc]" style={{ width: `${Math.max(4, (sideData.price / max) * 100)}%` }} />
            </span>
          </span>
          <span className="text-right font-mono text-[#063934]">{formatPercent(sideData.probabilityPct)}</span>
          <InlineTooltip lines={[`#${outcome.outcomeId} ${outcome.title}`, `${sideData.name} ${formatPrice(sideData.price)}`, `概率 ${formatPercent(sideData.probabilityPct)}`]} />
        </div>
      ))}
    </div>
  );
}

function MarketList({ outcomes }: { outcomes: Hip4OutcomePrice[] }) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-[#0e3f3a22] bg-[#f8fffc]/88 shadow-[0_18px_44px_rgba(7,43,40,0.08)]">
      <div className="border-b border-[#0e3f3a14] p-5 sm:p-6">
        <h2 className="text-[22px] font-black leading-tight text-[#062d29] sm:text-[24px]">HIP-4 实时市场列表</h2>
        <p className="mt-1 text-[12px] font-bold leading-5 text-[#66817c]">直接读取 Hyperliquid 官方 allMids，展示当前 YES / NO 价格。</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#0e3f3a10] bg-[#eefbf7]/74 text-[13px] font-black uppercase tracking-normal text-[#6b837e]">
              <th className="px-5 py-4">Outcome</th>
              <th className="px-5 py-4">名称</th>
              <th className="px-5 py-4">Quote</th>
              <th className="px-5 py-4 text-right">YES</th>
              <th className="px-5 py-4 text-right">NO</th>
              <th className="px-5 py-4 text-right">YES 概率</th>
              <th className="px-5 py-4 text-right">NO 概率</th>
            </tr>
          </thead>
          <tbody>
            {outcomes.map((outcome) => {
              const yes = sideFor(outcome, 0);
              const no = sideFor(outcome, 1);

              return (
                <tr className="border-b border-[#0e3f3a0f] text-[14px] font-bold text-[#244d48] last:border-b-0 hover:bg-[#effbf7]/70" key={outcome.outcomeId}>
                  <td className="px-5 py-4 font-mono text-[15px] font-black text-[#087b6d]">#{outcome.outcomeId}</td>
                  <td className="max-w-[360px] px-5 py-4 font-black text-[#063934]">
                    <span className="block truncate">{outcome.title}</span>
                    {outcome.description ? <span className="mt-1 block truncate text-[11px] font-bold text-[#7a9690]">{outcome.description}</span> : null}
                  </td>
                  <td className="px-5 py-4 text-[12px] font-black text-[#53746e]">{outcome.quoteToken}</td>
                  <td className="px-5 py-4 text-right font-mono text-[15px] font-black text-[#063934]">{yes ? formatPrice(yes.price) : "--"}</td>
                  <td className="px-5 py-4 text-right font-mono text-[15px] font-black text-[#063934]">{no ? formatPrice(no.price) : "--"}</td>
                  <td className="px-5 py-4 text-right font-mono text-[15px] font-black text-[#087b6d]">{yes ? formatPercent(yes.probabilityPct) : "--"}</td>
                  <td className="px-5 py-4 text-right font-mono text-[15px] font-black text-[#087b6d]">{no ? formatPercent(no.probabilityPct) : "--"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-[10px] border border-[#0e3f3a22] bg-[#f8fffc]/88 p-6 text-[#063934]">
      <p className="text-[12px] font-black uppercase text-[#0b9482]">HIP-4 Dashboard</p>
      <h2 className="mt-2 text-[24px] font-black">暂时无法加载 HIP-4 实时价格</h2>
      <p className="mt-2 text-[13px] font-bold text-[#66817c]">{message}</p>
    </section>
  );
}

export function Hip4Dashboard({ data, error }: { data: Hip4DashboardData | null; error?: string }) {
  if (!data) {
    return <ErrorState message={error ?? "Hyperliquid official API data is temporarily unavailable."} />;
  }

  return (
    <div className="space-y-4 text-[#063934]">
      <section className="rounded-[10px] border border-[#0e3f3a22] bg-[linear-gradient(135deg,#ffffffd9,#e8fbf5)] p-5 shadow-[0_18px_48px_rgba(7,43,40,0.08)] sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-normal text-[#0a8f7d]">Hyperliquid 数据看板</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-black leading-tight text-[#052c28] sm:text-[34px]">HIP-4 实时价格面板</h1>
          </div>
          <RefreshCountdown cacheExpiresAt={data.cacheExpiresAt} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard helper="官方 outcomeMeta" label="Outcome 市场" value={formatCompact(data.overview.outcomesCount)} />
        <MetricCard helper="allMids 已返回价格" label="已定价合约" value={formatCompact(data.overview.pricedSidesCount)} />
        <MetricCard helper={`${data.overview.quoteTokensCount} 个 Quote Token`} label="平均 YES" value={formatPercent(data.overview.averageYesPrice * 100)} />
        <MetricCard helper="实时 mid price 均值" label="平均 NO" value={formatPercent(data.overview.averageNoPrice * 100)} />
        <MetricCard helper={`YES ${formatPercent(data.overview.highestYesPrice * 100)} / NO ${formatPercent(data.overview.highestNoPrice * 100)}`} label="最高价格" value="Live" />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartFrame subtitle="按 YES 实时价格从高到低排序。" title="YES 概率排行">
          <PriceRank outcomes={data.topYesPrices} side={0} />
        </ChartFrame>

        <ChartFrame subtitle="按 NO 实时价格从高到低排序。" title="NO 概率排行">
          <PriceRank outcomes={data.topNoPrices} side={1} />
        </ChartFrame>
      </section>

      <MarketList outcomes={data.outcomes} />

      <p className="text-[11px] font-bold text-[#6b837e]">
        数据来源：{data.source}。免费版不包含 Loris Pro 聚合的成交量、手续费、独立用户和历史 OI。
      </p>
    </div>
  );
}
