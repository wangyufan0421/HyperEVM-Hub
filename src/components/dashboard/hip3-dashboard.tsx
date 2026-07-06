"use client";

import type { Hip3BuilderRank, Hip3DashboardData, Hip3DexShare, Hip3MarketRank, Hip3TimeSeries } from "@/lib/flowscan-hip3";
import { useState } from "react";
import type { ReactNode } from "react";
import { RefreshCountdown } from "./refresh-countdown";

const DEX_COLORS = ["#0d9c89", "#73cbbc", "#ff8f6c", "#f2c85b", "#75a7ff", "#d66ac2", "#8f82ff"];

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
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
    notation: "compact",
    style: "currency",
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function SvgTooltip({ tooltip, width }: { tooltip: ChartTooltip | null; width: number }) {
  if (!tooltip) return null;

  const tooltipWidth = 236;
  const tooltipHeight = 30 + tooltip.lines.length * 20;
  const x = Math.min(Math.max(tooltip.x - tooltipWidth / 2, 8), width - tooltipWidth - 8);
  const y = Math.max(8, tooltip.y - tooltipHeight - 12);

  return (
    <g pointerEvents="none">
      <rect fill="#062d29" height={tooltipHeight} opacity="0.96" rx="8" width={tooltipWidth} x={x} y={y} />
      {tooltip.lines.map((line, index) => (
        <text
          fill={index === 0 ? "#b8efe4" : "#ffffff"}
          fontFamily="monospace"
          fontSize={index === 0 ? "13" : "15"}
          fontWeight="700"
          key={`${line}-${index}`}
          x={x + 14}
          y={y + 22 + index * 20}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function InlineTooltip({ lines }: { lines: string[] }) {
  return (
    <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden min-w-[200px] -translate-x-1/2 rounded-[8px] bg-[#062d29] px-3.5 py-2.5 text-left text-[13px] font-semibold text-white shadow-[0_12px_30px_rgba(6,45,41,0.24)] group-hover:block">
      {lines.map((line, index) => (
        <span className={index === 0 ? "block text-[12px] text-[#b8efe4]" : "mt-1.5 block"} key={`${line}-${index}`}>
          {line}
        </span>
      ))}
    </span>
  );
}

function sumSeriesValues(timeSeries: Hip3TimeSeries) {
  return timeSeries.dates.map((_, index) => timeSeries.series.reduce((total, series) => total + (series.values[index] ?? 0), 0));
}

function ChartFrame(props: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="ui-card p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {props.eyebrow ? <p className="eyebrow">{props.eyebrow}</p> : null}
          <h2 className="mt-1 text-[20px] font-semibold leading-tight text-[color:var(--text)] sm:text-[22px]">{props.title}</h2>
          <p className="mt-1 max-w-[620px] text-[12px] font-medium leading-5 text-[color:var(--text-mute)]">{props.subtitle}</p>
        </div>
        <span className="ui-button h-8 text-[12px]">ALL</span>
      </div>
      {props.children}
      {props.footer ? <div className="mt-4 border-t border-[color:var(--line)] pt-4">{props.footer}</div> : null}
    </section>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="ui-card-quiet p-4">
      <p className="eyebrow text-[10px]">{label}</p>
      <p className="num mt-3 text-[24px] font-semibold leading-none text-[color:var(--text)] sm:text-[26px]">{value}</p>
      <p className="mt-2 text-[11px] font-medium text-[color:var(--text-mute)]">{helper}</p>
    </div>
  );
}

function AreaChart({ money = true, timeSeries }: { money?: boolean; timeSeries: Hip3TimeSeries }) {
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);
  const values = sumSeriesValues(timeSeries);
  const dates = timeSeries.dates;
  const width = 860;
  const height = 390;
  const padding = { top: 12, right: 18, bottom: 30, left: 42 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values.map((value, index) => {
    const x = padding.left + (values.length <= 1 ? 0 : (index / (values.length - 1)) * innerWidth);
    const y = padding.top + innerHeight - ((value - min) / range) * innerHeight;
    return { x, y, value };
  });
  const line = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const area =
    points.length > 0
      ? `M ${points[0].x.toFixed(2)} ${padding.top + innerHeight} L ${line} L ${points[points.length - 1].x.toFixed(2)} ${padding.top + innerHeight} Z`
      : "";
  const labelIndexes = [0, Math.floor((dates.length - 1) / 2), dates.length - 1].filter((index, offset, list) => index >= 0 && list.indexOf(index) === offset);
  const formatValue = money ? formatUsdCompact : formatCompact;
  const formatAxisValue = money ? formatUsdCompact : formatCompact;

  return (
    <svg aria-label="HIP-3 area chart" className="h-[410px] w-full overflow-visible" role="img" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="hip3-area-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(13,156,137,0.22)" />
          <stop offset="100%" stopColor="rgba(13,156,137,0)" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((tick) => {
        const y = padding.top + tick * innerHeight;
        const value = max - tick * range;
        return (
          <g key={tick}>
            <line stroke="rgba(8,54,49,0.12)" strokeDasharray="4 8" strokeWidth="1" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text fill="rgba(8,43,40,0.54)" fontSize="11" fontWeight="700" x="0" y={y + 4}>
              {formatAxisValue(value)}
            </text>
          </g>
        );
      })}
      <path d={area} fill="url(#hip3-area-fill)" />
      <polyline fill="none" points={line} stroke="#0d9c89" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
      {points.map((point, index) => (
        <circle
          cx={point.x}
          cy={point.y}
          fill="transparent"
          key={`hover-${dates[index]}-${index}`}
          onMouseEnter={() => setTooltip({ lines: [dates[index], formatValue(point.value)], x: point.x, y: point.y })}
          onMouseLeave={() => setTooltip(null)}
          r="10"
          stroke="transparent"
        />
      ))}
      {points.length > 0 ? <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} fill="white" r="4" stroke="#0d9c89" strokeWidth="2.4" /> : null}
      {labelIndexes.map((index) => (
        <text fill="rgba(8,43,40,0.58)" fontSize="11" fontWeight="700" key={`${dates[index]}-${index}`} x={padding.left + (dates.length <= 1 ? 0 : (index / (dates.length - 1)) * innerWidth)} y={height - 6}>
          {formatDateLabel(dates[index])}
        </text>
      ))}
      <SvgTooltip tooltip={tooltip} width={width} />
    </svg>
  );
}

function StackedBarChart({ timeSeries }: { timeSeries: Hip3TimeSeries }) {
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);
  const width = 860;
  const height = 390;
  const padding = { top: 12, right: 18, bottom: 30, left: 44 };
  const dateCount = timeSeries.dates.length;
  const valuesByDate = sumSeriesValues(timeSeries);
  const max = Math.max(...valuesByDate, 1);
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const barWidth = Math.max(3, innerWidth / Math.max(dateCount, 1) - 2);
  const labelIndexes = [0, Math.floor((dateCount - 1) / 2), dateCount - 1].filter((index, offset, list) => index >= 0 && list.indexOf(index) === offset);

  return (
    <svg aria-label="HIP-3 daily volume stacked bar chart" className="h-[410px] w-full overflow-visible" role="img" viewBox={`0 0 ${width} ${height}`}>
      {[0, 0.5, 1].map((tick) => {
        const y = padding.top + tick * innerHeight;
        const value = max - tick * max;
        return (
          <g key={tick}>
            <line stroke="rgba(8,54,49,0.12)" strokeDasharray="4 8" strokeWidth="1" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text fill="rgba(8,43,40,0.54)" fontSize="11" fontWeight="700" x="0" y={y + 4}>
              {formatUsdCompact(value)}
            </text>
          </g>
        );
      })}
      {timeSeries.dates.map((date, dateIndex) => {
        const x = padding.left + (dateIndex / Math.max(dateCount, 1)) * innerWidth;
        let stackY = padding.top + innerHeight;

        return (
          <g key={date}>
            {timeSeries.series.map((series, seriesIndex) => {
              const value = series.values[dateIndex] ?? 0;
              const barHeight = (value / max) * innerHeight;
              stackY -= barHeight;
              if (barHeight <= 0) return null;

              return (
                <rect
                  fill={DEX_COLORS[seriesIndex % DEX_COLORS.length]}
                  height={Math.max(barHeight, 1)}
                  key={series.name}
                  onMouseEnter={() => setTooltip({ lines: [date, `${series.name} ${formatUsdCompact(value)}`, `Total ${formatUsdCompact(valuesByDate[dateIndex] ?? 0)}`], x: x + barWidth / 2, y: stackY })}
                  onMouseLeave={() => setTooltip(null)}
                  opacity={seriesIndex === 0 ? 0.96 : 0.84}
                  rx="2"
                  width={barWidth}
                  x={x}
                  y={stackY}
                />
              );
            })}
          </g>
        );
      })}
      {labelIndexes.map((index) => (
        <text fill="rgba(8,43,40,0.58)" fontSize="11" fontWeight="700" key={`${timeSeries.dates[index]}-${index}`} x={padding.left + (index / Math.max(dateCount - 1, 1)) * innerWidth} y={height - 6}>
          {formatDateLabel(timeSeries.dates[index])}
        </text>
      ))}
      <SvgTooltip tooltip={tooltip} width={width} />
    </svg>
  );
}

function ChartLegend({ series }: { series: Hip3TimeSeries["series"] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-semibold text-[color:var(--text-mute)]">
      {series.slice(0, DEX_COLORS.length).map((item, index) => (
        <span className="inline-flex items-center gap-1.5" key={item.name}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DEX_COLORS[index % DEX_COLORS.length] }} />
          {item.name}
        </span>
      ))}
    </div>
  );
}

function DexShareBars({ shares }: { shares: Hip3DexShare[] }) {
  return (
    <div className="space-y-3">
      {shares.slice(0, 7).map((share) => (
        <div className="group relative grid grid-cols-[76px_1fr_58px] items-center gap-3 text-[12px] font-semibold" key={share.dex}>
          <span className="text-[color:var(--text-soft)]">{share.dex}</span>
          <span className="h-2.5 rounded-full bg-[color:var(--surface-soft)]">
            <span className="block h-2.5 rounded-full bg-[color:var(--mint)]" style={{ width: `${Math.min(share.volumePct, 100)}%` }} />
          </span>
          <span className="num text-right text-[color:var(--text)]">{formatPercent(share.volumePct)}</span>
          <InlineTooltip lines={[share.dex, `Share ${formatPercent(share.volumePct)}`]} />
        </div>
      ))}
    </div>
  );
}

function TopMarkets({ markets }: { markets: Hip3MarketRank[] }) {
  const max = Math.max(...markets.map((market) => market.oi), 1);

  return (
    <div className="space-y-2">
      {markets.map((market) => (
        <div className="group relative grid grid-cols-[44px_76px_1fr_74px] items-center gap-2 text-[12px] font-semibold" key={`${market.dex}-${market.symbol}`}>
          <span className="rounded-[6px] bg-[color:var(--mint-soft)] px-2 py-1 text-center text-[11px] text-[color:var(--mint)]">{market.dex}</span>
          <span className="truncate text-[color:var(--text-soft)]">{market.symbol}</span>
          <span className="h-2.5 rounded-full bg-[color:var(--surface-soft)]">
            <span className="block h-2.5 rounded-full bg-[color:var(--mint)]" style={{ width: `${Math.max(4, (market.oi / max) * 100)}%` }} />
          </span>
          <span className="num text-right text-[color:var(--text)]">{formatUsdCompact(market.oi)}</span>
          <InlineTooltip lines={[`${market.dex} ${market.symbol}`, `OI ${formatUsdCompact(market.oi)}`, `Volume ${formatUsdCompact(market.volume)}`]} />
        </div>
      ))}
    </div>
  );
}

function TopBuilders({ builders }: { builders: Hip3BuilderRank[] }) {
  const max = Math.max(...builders.map((builder) => builder.totalVolume), 1);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {builders.map((builder) => (
        <div className="group ui-card-quiet relative p-3" key={builder.address || builder.name}>
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-[13px] font-semibold text-[color:var(--text)]">{builder.name}</p>
            <span className="num text-[12px] font-semibold text-[color:var(--mint)]">{formatPercent(builder.builderShare)}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-[color:var(--surface-soft)]">
            <div className="h-2 rounded-full bg-[color:var(--mint)]" style={{ width: `${Math.max(5, (builder.totalVolume / max) * 100)}%` }} />
          </div>
          <InlineTooltip lines={[builder.name, `Volume ${formatUsdCompact(builder.totalVolume)}`, `Share ${formatPercent(builder.builderShare)}`]} />
          <p className="mt-2 text-[11px] font-medium text-[color:var(--text-mute)]">{formatUsdCompact(builder.totalVolume)} routed volume</p>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="ui-card p-6">
      <p className="eyebrow">HIP-3 Dashboard</p>
      <h2 className="mt-2 text-[24px] font-semibold text-[color:var(--text)]">暂时无法加载 HIP-3 数据</h2>
      <p className="mt-2 text-[13px] font-medium text-[color:var(--text-mute)]">{message}</p>
    </section>
  );
}

export function Hip3Dashboard({ data, error }: { data: Hip3DashboardData | null; error?: string }) {
  if (!data) {
    return <ErrorState message={error ?? "Flowscan data is temporarily unavailable."} />;
  }

  return (
    <div className="space-y-4 text-[color:var(--text)]">
      <section className="ui-card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Hyperliquid dashboard</p>
            <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-[color:var(--text)] sm:text-[36px]">HIP-3 生态总览</h1>
            <p className="mt-2 max-w-[620px] text-[13px] font-medium leading-6 text-[color:var(--text-mute)]">
              聚合 HIP-3 DEX 成交、未平仓量、市场排名和 Builder 路由数据。
            </p>
          </div>
          <RefreshCountdown cacheExpiresAt={data.cacheExpiresAt} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper={`覆盖 ${data.overview.marketsCount} 个市场`} label="累计成交量" value={formatUsdCompact(data.overview.totalVolume)} />
        <MetricCard helper="HIP-3 累计交易笔数" label="累计交易数" value={formatCompact(data.overview.totalTrades)} />
        <MetricCard helper={`${formatCompact(data.overview.totalNewUsers)} 新用户`} label="独立交易用户" value={formatCompact(data.overview.totalTraders)} />
        <MetricCard helper={`${data.overview.dexCount} 个活跃 DEX`} label="未平仓量" value={formatUsdCompact(data.overview.totalOi)} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartFrame subtitle="按 DEX 拆分的 HIP-3 每日名义成交量。" title="HIP-3 每日成交量">
          <StackedBarChart timeSeries={data.dailyVolume} />
          <ChartLegend series={data.dailyVolume.series} />
        </ChartFrame>

        <ChartFrame subtitle="按当前美元计价未平仓量排序的 HIP-3 市场。" title="未平仓量市场排行">
          <TopMarkets markets={data.topMarketsByOi} />
        </ChartFrame>

        <ChartFrame subtitle="所有 HIP-3 DEX 的美元计价未平仓量变化。" title="HIP-3 未平仓量">
          <div className="mb-2 flex flex-wrap items-baseline gap-3">
            <span className="num text-[26px] font-semibold text-[color:var(--text)]">{formatUsdCompact(data.overview.totalOi)}</span>
            <span className="text-[12px] font-semibold text-[color:var(--mint)]">{formatUsdCompact(data.builderTotals.volume30d)} 30 日 Builder 成交量</span>
          </div>
          <AreaChart timeSeries={data.dailyOi} />
        </ChartFrame>

        <ChartFrame subtitle="各 Builder 在 HIP-3 市场中的路由成交量占比。" title="Builder 成交量占比">
          <TopBuilders builders={data.topBuilders} />
        </ChartFrame>

        <ChartFrame subtitle="各 DEX 对 HIP-3 总成交量的贡献占比。" title="DEX 成交量占比">
          <DexShareBars shares={data.dexShares} />
        </ChartFrame>

        <ChartFrame subtitle="HIP-3 DEX 的每日交易笔数变化。" title="HIP-3 每日交易数">
          <AreaChart money={false} timeSeries={data.dailyTrades} />
        </ChartFrame>
      </section>

      <p className="text-[11px] font-medium text-[color:var(--text-mute)]">数据来源：{data.source}</p>
    </div>
  );
}
