"use client";

import { RefreshCountdown } from "@/components/dashboard/refresh-countdown";
import type { HypeFundingDashboardData, HypeFundingHistoryRow, HypeFundingVenueRow } from "@/lib/hype-funding";
import type { ReactNode } from "react";
import { useState } from "react";

type ChartTooltip = {
  lines: string[];
  x: number;
  y: number;
};

function formatPercent(value: number | null, decimals = 4) {
  if (value === null || !Number.isFinite(value)) return "--";
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(decimals)}%`;
}

function formatAnnualized(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "--";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatUsd(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "--";
  return Intl.NumberFormat("en-US", {
    compactDisplay: "short",
    currency: "USD",
    maximumFractionDigits: 2,
    notation: "compact",
    style: "currency",
  }).format(value);
}

function formatTime(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "--";
  return Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
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

function ErrorState({ message }: { message: string }) {
  return (
    <section className="ui-card p-6">
      <p className="eyebrow">HYPE Funding</p>
      <h2 className="mt-2 text-[24px] font-semibold text-[color:var(--text)]">暂时无法加载 HYPE Funding 数据</h2>
      <p className="mt-2 text-[13px] font-medium text-[color:var(--text-mute)]">{message}</p>
    </section>
  );
}

function SvgTooltip({ tooltip, width }: { tooltip: ChartTooltip | null; width: number }) {
  if (!tooltip) return null;

  const tooltipWidth = 242;
  const tooltipHeight = 30 + tooltip.lines.length * 20;
  const x = Math.min(Math.max(tooltip.x - tooltipWidth / 2, 8), width - tooltipWidth - 8);
  const y = Math.max(8, tooltip.y - tooltipHeight - 12);

  return (
    <g pointerEvents="none">
      <rect fill="#062d29" height={tooltipHeight} opacity="0.96" rx="8" width={tooltipWidth} x={x} y={y} />
      {tooltip.lines.map((line, index) => (
        <text fill={index === 0 ? "#b8efe4" : "#ffffff"} fontFamily="monospace" fontSize={index === 0 ? "13" : "15"} fontWeight="800" key={`${line}-${index}`} x={x + 14} y={y + 22 + index * 20}>
          {line}
        </text>
      ))}
    </g>
  );
}

function FundingLineChart({ rows, valueKey }: { rows: HypeFundingHistoryRow[]; valueKey: "fundingRate" | "premium" }) {
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);
  const width = 760;
  const height = 280;
  const padding = { bottom: 34, left: 54, right: 18, top: 18 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const values = rows.map((row) => row[valueKey]).filter((value): value is number => value !== null && Number.isFinite(value));
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const span = max - min || 1;
  const points = rows
    .map((row, index) => {
      const value = row[valueKey];
      if (value === null || !Number.isFinite(value)) return null;
      return {
        row,
        value,
        x: padding.left + (rows.length <= 1 ? 0 : (index / (rows.length - 1)) * innerWidth),
        y: padding.top + innerHeight - ((value - min) / span) * innerHeight,
      };
    })
    .filter((point): point is NonNullable<typeof point> => point !== null);
  const line = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const zeroY = padding.top + innerHeight - ((0 - min) / span) * innerHeight;
  const labelIndexes = [0, Math.floor((rows.length - 1) / 2), rows.length - 1].filter((index, offset, list) => index >= 0 && list.indexOf(index) === offset);

  return (
    <svg aria-label={`HYPE ${valueKey} line chart`} className="h-[290px] w-full overflow-visible" role="img" viewBox={`0 0 ${width} ${height}`}>
      {[0, 0.5, 1].map((tick) => {
        const y = padding.top + tick * innerHeight;
        const value = max - tick * span;
        return (
          <g key={tick}>
            <line stroke="#dceee8" strokeDasharray="4 8" strokeWidth="1" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text fill="#78918b" fontSize="11" fontWeight="700" x="0" y={y + 4}>
              {formatPercent(value, 3)}
            </text>
          </g>
        );
      })}
      <line stroke="rgba(8,43,40,0.22)" strokeWidth="1" x1={padding.left} x2={width - padding.right} y1={zeroY} y2={zeroY} />
      <polyline fill="none" points={line} stroke="#0d9c89" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
      {points.map((point) => (
        <circle
          cx={point.x}
          cy={point.y}
          fill="transparent"
          key={`${point.row.time}-${valueKey}`}
          onMouseEnter={() =>
            setTooltip({
              lines: [formatTime(point.row.time), `${valueKey === "fundingRate" ? "Funding" : "Premium"} ${formatPercent(point.value)}`],
              x: point.x,
              y: point.y,
            })
          }
          onMouseLeave={() => setTooltip(null)}
          r="9"
          stroke="transparent"
        />
      ))}
      {points.length > 0 ? <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} fill="#062d29" r="4" stroke="#9adfd3" strokeWidth="3" /> : null}
      {labelIndexes.map((index) => (
        <text fill="#667d78" fontSize="11" fontWeight="700" key={`${rows[index]?.time}-label`} x={padding.left + (index / Math.max(rows.length - 1, 1)) * innerWidth} y={height - 6}>
          {formatTime(rows[index]?.time ?? null)}
        </text>
      ))}
      <SvgTooltip tooltip={tooltip} width={width} />
    </svg>
  );
}

function ChartCard({ children, subtitle, title }: { children: ReactNode; subtitle: string; title: string }) {
  return (
    <section className="ui-card p-5 sm:p-6">
      <p className="eyebrow">Funding signal</p>
      <h2 className="mt-1 text-[20px] font-semibold text-[color:var(--text)]">{title}</h2>
      <p className="mt-1 text-[12px] font-medium leading-5 text-[color:var(--text-mute)]">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function VenueTable({ venues }: { venues: HypeFundingVenueRow[] }) {
  return (
    <section className="ui-card overflow-hidden">
      <div className="border-b border-[color:var(--line)] p-5 sm:p-6">
        <p className="eyebrow">Venue comparison</p>
        <h2 className="mt-1 text-[20px] font-semibold text-[color:var(--text)]">预测资金费率对比</h2>
        <p className="mt-1 text-[12px] font-medium leading-5 text-[color:var(--text-mute)]">
          来自 Hyperliquid 官方 predictedFundings，按年化资金费率排序。
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[color:var(--line)] bg-[color:var(--surface-soft)] text-[11px] font-semibold uppercase text-[color:var(--text-dim)]">
              <th className="px-5 py-3">Venue</th>
              <th className="px-5 py-3 text-right">Funding</th>
              <th className="px-5 py-3 text-right">Interval</th>
              <th className="px-5 py-3 text-right">Annualized</th>
              <th className="px-5 py-3 text-right">Next funding</th>
            </tr>
          </thead>
          <tbody>
            {venues.map((venue) => (
              <tr className="border-b border-[color:var(--line)] text-[13px] font-medium text-[color:var(--text-soft)] last:border-b-0 hover:bg-white/72" key={venue.venue}>
                <td className="px-5 py-4 font-semibold text-[color:var(--text)]">{venue.venue}</td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--mint)]">{formatPercent(venue.fundingRate)}</td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--text)]">
                  {venue.fundingIntervalHours ? `${venue.fundingIntervalHours}h` : "--"}
                </td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--text)]">{formatAnnualized(venue.annualizedPct)}</td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--text)]">{formatTime(venue.nextFundingTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function HypeFundingDashboard({ data, error }: { data: HypeFundingDashboardData | null; error?: string }) {
  if (!data) {
    return <ErrorState message={error ?? "HYPE funding data is temporarily unavailable."} />;
  }

  return (
    <div className="space-y-4">
      <section className="ui-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Hyperliquid dashboard</p>
            <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-[color:var(--text)] sm:text-[36px]">
              HYPE Funding
            </h1>
            <p className="mt-2 max-w-[680px] text-[13px] font-medium leading-6 text-[color:var(--text-mute)]">
              追踪 HYPE 当前资金费率、预测资金费率对比、历史 funding 与 premium 变化。
            </p>
          </div>
          <RefreshCountdown cacheExpiresAt={data.cacheExpiresAt} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper="Hyperliquid current funding" label="当前 Funding" value={formatPercent(data.current.fundingRate)} />
        <MetricCard helper="按 1h funding 年化" label="当前年化" value={formatAnnualized(data.current.annualizedPct)} />
        <MetricCard helper="HYPE perp open interest" label="Open Interest" value={formatUsd(data.current.openInterest)} />
        <MetricCard helper="HYPE mark price" label="Mark Price" value={formatUsd(data.current.markPrice)} />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper={`${data.stats.samples} hourly samples`} label="7D 平均 Funding" value={formatPercent(data.stats.averageFundingRate)} />
        <MetricCard helper="7D funding high" label="7D 最高 Funding" value={formatPercent(data.stats.highestFundingRate)} />
        <MetricCard helper="7D funding low" label="7D 最低 Funding" value={formatPercent(data.stats.lowestFundingRate)} />
        <MetricCard helper="24h notional volume" label="24H Volume" value={formatUsd(data.current.dayVolumeUsd)} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard subtitle="最近 7 天 HYPE 每小时资金费率。" title="Funding history">
          <FundingLineChart rows={data.history} valueKey="fundingRate" />
        </ChartCard>
        <ChartCard subtitle="最近 7 天 HYPE premium 偏离变化。" title="Premium history">
          <FundingLineChart rows={data.history} valueKey="premium" />
        </ChartCard>
      </section>

      <VenueTable venues={data.venues} />

      <p className="text-[11px] font-medium text-[color:var(--text-dim)]">数据来源：{data.source}。</p>
    </div>
  );
}
