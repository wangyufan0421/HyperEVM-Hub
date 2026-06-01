"use client";

import type { Hip4DashboardData, Hip4SingleSeries, Hip4TopOutcome, Hip4TopOutcomeSide } from "@/lib/loris-hip4";
import { useState } from "react";
import type { ReactNode } from "react";
import { RefreshCountdown } from "./refresh-countdown";

type ChartTooltip = {
  lines: string[];
  x: number;
  y: number;
};

function formatCompact(value: number) {
  return Intl.NumberFormat("en-US", {
    compactDisplay: "short",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
    notation: "compact",
  }).format(value);
}

function formatUsdCompact(value: number) {
  return Intl.NumberFormat("en-US", {
    compactDisplay: "short",
    currency: "USD",
    maximumFractionDigits: value >= 1_000_000 ? 1 : value >= 1_000 ? 1 : 2,
    notation: "compact",
    style: "currency",
  }).format(value);
}

function formatDateLabel(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(date);
}

function SvgTooltip({ tooltip, width }: { tooltip: ChartTooltip | null; width: number }) {
  if (!tooltip) {
    return null;
  }

  const tooltipWidth = 188;
  const tooltipHeight = 24 + tooltip.lines.length * 16;
  const x = Math.min(Math.max(tooltip.x - tooltipWidth / 2, 8), width - tooltipWidth - 8);
  const y = Math.max(8, tooltip.y - tooltipHeight - 12);

  return (
    <g pointerEvents="none">
      <rect fill="#062d29" height={tooltipHeight} opacity="0.96" rx="8" width={tooltipWidth} x={x} y={y} />
      {tooltip.lines.map((line, index) => (
        <text
          fill={index === 0 ? "#b8efe4" : "#ffffff"}
          fontFamily="monospace"
          fontSize={index === 0 ? "11" : "13"}
          fontWeight="900"
          key={`${line}-${index}`}
          x={x + 12}
          y={y + 18 + index * 16}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function InlineTooltip({ lines }: { lines: string[] }) {
  return (
    <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden min-w-[180px] -translate-x-1/2 rounded-[8px] bg-[#062d29] px-3 py-2 text-left font-mono text-[12px] font-black text-white shadow-[0_12px_30px_rgba(6,45,41,0.24)] group-hover:block">
      {lines.map((line, index) => (
        <span className={index === 0 ? "block text-[11px] text-[#b8efe4]" : "mt-1 block"} key={`${line}-${index}`}>
          {line}
        </span>
      ))}
    </span>
  );
}

function ChartFrame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-[10px] border border-[#0e3f3a22] bg-[#f8fffc]/88 p-5 shadow-[0_18px_44px_rgba(7,43,40,0.08)] sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-black leading-tight text-[#062d29] sm:text-[24px]">{title}</h2>
          <p className="mt-1 text-[12px] font-bold leading-5 text-[#66817c]">{subtitle}</p>
        </div>
        <span className="rounded-[8px] border border-[#0e3f3a20] bg-white/70 px-2.5 py-1 text-[11px] font-black text-[#53746e]">
          Both
        </span>
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

function LineAreaChart({ series, money = true }: { series: Hip4SingleSeries; money?: boolean }) {
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);
  const width = 860;
  const height = 430;
  const padding = { top: 10, right: 18, bottom: 30, left: 46 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const max = Math.max(...series.values, 1);
  const min = Math.min(...series.values, 0);
  const range = Math.max(max - min, 1);
  const points = series.values.map((value, index) => {
    const x = padding.left + (series.values.length <= 1 ? 0 : (index / (series.values.length - 1)) * innerWidth);
    const y = padding.top + innerHeight - ((value - min) / range) * innerHeight;
    return { x, y };
  });
  const line = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const area =
    points.length > 0
      ? `M ${points[0].x.toFixed(2)} ${padding.top + innerHeight} L ${line} L ${points[points.length - 1].x.toFixed(2)} ${padding.top + innerHeight} Z`
      : "";
  const labelIndexes = [0, Math.floor((series.dates.length - 1) / 2), series.dates.length - 1].filter((index, offset, list) => index >= 0 && list.indexOf(index) === offset);
  const format = money ? formatUsdCompact : formatCompact;
  const formatTooltipValue = money ? formatUsdCompact : formatCompact;

  return (
    <svg aria-label="HIP-4 line area chart" className="h-[460px] w-full overflow-visible" role="img" viewBox={`0 0 ${width} ${height}`}>
      {[0, 0.5, 1].map((tick) => {
        const y = padding.top + tick * innerHeight;
        const value = max - tick * range;
        return (
          <g key={tick}>
            <line stroke="#dceee8" strokeDasharray="4 8" strokeWidth="1" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text fill="#7a9690" fontSize="11" fontWeight="800" x="0" y={y + 4}>
              {format(value)}
            </text>
          </g>
        );
      })}
      <path d={area} fill="#d9f5ee" />
      <polyline fill="none" points={line} stroke="#43bcae" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      {points.map((point, index) => (
        <circle
          cx={point.x}
          cy={point.y}
          fill="transparent"
          key={`hover-${series.dates[index]}-${index}`}
          onMouseEnter={() => setTooltip({ lines: [series.dates[index], formatTooltipValue(series.values[index] ?? 0)], x: point.x, y: point.y })}
          onMouseLeave={() => setTooltip(null)}
          r="10"
          stroke="transparent"
        />
      ))}
      {points.length > 0 ? <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} fill="#063934" r="4" stroke="#8ef5dc" strokeWidth="3" /> : null}
      {labelIndexes.map((index) => (
        <text fill="#55756f" fontSize="11" fontWeight="900" key={`${series.dates[index]}-${index}`} x={padding.left + (series.dates.length <= 1 ? 0 : (index / (series.dates.length - 1)) * innerWidth)} y={height - 6}>
          {formatDateLabel(series.dates[index])}
        </text>
      ))}
      <SvgTooltip tooltip={tooltip} width={width} />
    </svg>
  );
}

function BarChart({ series, money = true }: { series: Hip4SingleSeries; money?: boolean }) {
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);
  const width = 860;
  const height = 430;
  const padding = { top: 10, right: 18, bottom: 30, left: 46 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const max = Math.max(...series.values, 1);
  const barWidth = Math.max(6, innerWidth / Math.max(series.values.length, 1) - 5);
  const format = money ? formatUsdCompact : formatCompact;
  const formatTooltipValue = money ? formatUsdCompact : formatCompact;

  return (
    <svg aria-label="HIP-4 bar chart" className="h-[460px] w-full overflow-visible" role="img" viewBox={`0 0 ${width} ${height}`}>
      {[0, 0.5, 1].map((tick) => {
        const y = padding.top + tick * innerHeight;
        const value = max - tick * max;
        return (
          <g key={tick}>
            <line stroke="#dceee8" strokeDasharray="4 8" strokeWidth="1" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text fill="#7a9690" fontSize="11" fontWeight="800" x="0" y={y + 4}>
              {format(value)}
            </text>
          </g>
        );
      })}
      {series.values.map((value, index) => {
        const heightValue = (value / max) * innerHeight;
        const x = padding.left + (index / Math.max(series.values.length, 1)) * innerWidth;
        const y = padding.top + innerHeight - Math.max(heightValue, 1);
        return (
          <rect
            fill="#54c8ba"
            height={Math.max(heightValue, 1)}
            key={`${series.dates[index]}-${index}`}
            onMouseEnter={() => setTooltip({ lines: [series.dates[index], formatTooltipValue(value)], x: x + barWidth / 2, y })}
            onMouseLeave={() => setTooltip(null)}
            rx="3"
            width={barWidth}
            x={x}
            y={y}
          />
        );
      })}
      {[0, Math.floor((series.dates.length - 1) / 2), series.dates.length - 1].map((index) =>
        index >= 0 ? (
          <text fill="#55756f" fontSize="11" fontWeight="900" key={`${series.dates[index]}-${index}`} x={padding.left + (index / Math.max(series.dates.length - 1, 1)) * innerWidth} y={height - 6}>
            {formatDateLabel(series.dates[index])}
          </text>
        ) : null,
      )}
      <SvgTooltip tooltip={tooltip} width={width} />
    </svg>
  );
}

function OutcomeRank({ outcomes }: { outcomes: Hip4TopOutcome[] }) {
  const max = Math.max(...outcomes.map((outcome) => outcome.volume), 1);

  return (
    <div className="space-y-2">
      {outcomes.map((outcome) => (
        <div className="group relative grid grid-cols-[56px_1fr_86px] items-center gap-3 text-[12px] font-black" key={outcome.outcomeId}>
          <span className="rounded-[6px] bg-[#e0fbf4] px-2 py-1 text-center text-[11px] text-[#087b6d]">#{outcome.outcomeId}</span>
          <span className="min-w-0">
            <span className="block truncate text-[#244d48]">{outcome.title}</span>
            <span className="mt-1 block h-3 rounded-full bg-[#e3f3ef]">
              <span className="block h-3 rounded-full bg-[#73cbbc]" style={{ width: `${Math.max(4, (outcome.volume / max) * 100)}%` }} />
            </span>
          </span>
          <span className="text-right font-mono text-[#063934]">{formatUsdCompact(outcome.volume)}</span>
          <InlineTooltip lines={[`#${outcome.outcomeId} ${outcome.title}`, `Volume ${formatUsdCompact(outcome.volume)}`, `Trades ${formatCompact(outcome.trades)}`]} />
        </div>
      ))}
    </div>
  );
}

function SideRank({ sides }: { sides: Hip4TopOutcomeSide[] }) {
  const max = Math.max(...sides.map((side) => side.volume), 1);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sides.map((side) => (
        <div className="group relative rounded-[8px] border border-[#0e3f3a16] bg-[#effbf7]/82 p-3" key={`${side.outcomeId}-${side.side}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-[13px] font-black text-[#063934]">
              #{side.outcomeId} {side.sideName}
            </p>
            <span className="font-mono text-[12px] font-black text-[#087b6d]">{formatUsdCompact(side.volume)}</span>
          </div>
          <p className="mt-1 truncate text-[11px] font-bold text-[#6b837e]">{side.title}</p>
          <div className="mt-3 h-2 rounded-full bg-[#deeee9]">
            <div className="h-2 rounded-full bg-[#43bcae]" style={{ width: `${Math.max(5, (side.volume / max) * 100)}%` }} />
          </div>
          <InlineTooltip lines={[`#${side.outcomeId} ${side.sideName}`, `Volume ${formatUsdCompact(side.volume)}`, `Trades ${formatCompact(side.trades)}`]} />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-[10px] border border-[#0e3f3a22] bg-[#f8fffc]/88 p-6 text-[#063934]">
      <p className="text-[12px] font-black uppercase text-[#0b9482]">HIP-4 Dashboard</p>
      <h2 className="mt-2 text-[24px] font-black">暂时无法加载 HIP-4 数据</h2>
      <p className="mt-2 text-[13px] font-bold text-[#66817c]">{message}</p>
    </section>
  );
}

export function Hip4Dashboard({ data, error }: { data: Hip4DashboardData | null; error?: string }) {
  if (!data) {
    return <ErrorState message={error ?? "Loris Tools data is temporarily unavailable."} />;
  }

  return (
    <div className="space-y-4 text-[#063934]">
      <section className="rounded-[10px] border border-[#0e3f3a22] bg-[linear-gradient(135deg,#ffffffd9,#e8fbf5)] p-5 shadow-[0_18px_48px_rgba(7,43,40,0.08)] sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-normal text-[#0a8f7d]">Hyperliquid 数据看板</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-black leading-tight text-[#052c28] sm:text-[34px]">HIP-4 预测市场总览</h1>
            <p className="mt-2 max-w-3xl text-[13px] font-bold leading-6 text-[#567973]">
              汇总 Hyperliquid HIP-4 outcome markets 的成交量、交易用户、手续费、Fill 数、未平仓量和 Outcome 排行。
            </p>
          </div>
          <RefreshCountdown cacheExpiresAt={data.cacheExpiresAt} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard helper={`24h ${formatUsdCompact(data.overview.volume24h)}`} label="累计成交量" value={formatUsdCompact(data.overview.totalVolume)} />
        <MetricCard helper={`24h ${formatCompact(data.overview.uniqueTraders24h)} 人`} label="独立交易用户" value={formatCompact(data.overview.uniqueTraders)} />
        <MetricCard helper={`24h ${formatUsdCompact(data.overview.fees24h)}`} label="累计手续费" value={formatUsdCompact(data.overview.totalFees)} />
        <MetricCard helper={`24h ${formatCompact(data.overview.trades24h)} 笔`} label="累计交易数" value={formatCompact(data.overview.totalTrades)} />
        <MetricCard helper={`24h ${formatCompact(data.overview.fills24h)} 次`} label="Fill 数" value={formatCompact(data.overview.totalFills)} />
        <MetricCard helper={`${data.overview.outcomesCount} 个 Outcome`} label="未平仓量" value={formatUsdCompact(data.overview.openInterestUsd)} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartFrame subtitle="Trading + settlement 的每日名义成交量变化。" title="HIP-4 每日成交量">
          <BarChart series={data.volumeSeries} />
        </ChartFrame>

        <ChartFrame subtitle="按累计成交量排序的 Outcome 市场。" title="Outcome 成交量排行">
          <OutcomeRank outcomes={data.topOutcomes} />
        </ChartFrame>

        <ChartFrame subtitle="HIP-4 每日美元计价未平仓量。" title="HIP-4 未平仓量">
          <div className="mb-2 flex items-baseline gap-3">
            <span className="font-mono text-[26px] font-black text-[#063934]">{formatUsdCompact(data.overview.openInterestUsd)}</span>
            <span className="text-[12px] font-black text-[#0a8f7d]">{data.overview.outcomesCount} 个 Outcome</span>
          </div>
          <LineAreaChart series={data.oiSeries} />
        </ChartFrame>

        <ChartFrame subtitle="按 Outcome 侧别拆分的最高成交量市场。" title="YES / NO 侧成交排行">
          <SideRank sides={data.topOutcomeSides} />
        </ChartFrame>

        <ChartFrame subtitle="Trading + settlement 的每日交易笔数变化。" title="HIP-4 每日交易数">
          <LineAreaChart money={false} series={data.tradesSeries} />
        </ChartFrame>

        <ChartFrame subtitle="Outcome 交易产生的每日手续费。" title="HIP-4 每日手续费">
          <LineAreaChart series={data.feesSeries} />
        </ChartFrame>
      </section>

      <p className="text-[11px] font-bold text-[#6b837e]">
        数据来源：{data.source}。页面采用 Loris Summary 的 Both 口径；遇到 429 时优先使用上一次成功缓存。
      </p>
    </div>
  );
}
