"use client";

import { RefreshCountdown } from "@/components/dashboard/refresh-countdown";
import type { HypeBuybackDashboardData, HypeBuybackRow } from "@/lib/hype-buyback";
import type { ReactNode } from "react";
import { useState } from "react";

type ChartTooltip = {
  lines: string[];
  x: number;
  y: number;
};

function formatUsd(value: number) {
  return Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
    notation: value >= 1_000_000 ? "compact" : "standard",
    style: "currency",
  }).format(value);
}

function formatUsdMillions(value: number) {
  return `$${(value / 1_000_000).toFixed(2)}M`;
}

function formatHype(value: number) {
  return Intl.NumberFormat("en-US", {
    compactDisplay: "short",
    maximumFractionDigits: value >= 1_000_000 ? 2 : 0,
    notation: value >= 1_000_000 ? "compact" : "standard",
  }).format(value);
}

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(date);
}

function SvgTooltip({ tooltip, width }: { tooltip: ChartTooltip | null; width: number }) {
  if (!tooltip) return null;

  const tooltipWidth = 228;
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
      <p className="eyebrow">Hyper buyback</p>
      <h2 className="mt-2 text-[24px] font-semibold text-[color:var(--text)]">暂时无法加载 Hyper 回购数据</h2>
      <p className="mt-2 text-[13px] font-medium text-[color:var(--text-mute)]">{message}</p>
    </section>
  );
}

function DailyBuybackBars({ rows }: { rows: HypeBuybackRow[] }) {
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);
  const chartRows = rows.slice(-90);
  const width = 720;
  const height = 260;
  const padding = { bottom: 34, left: 54, right: 18, top: 16 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const max = Math.max(...chartRows.map((row) => row.usdAmount), 1);
  const barWidth = Math.max(2, innerWidth / Math.max(chartRows.length, 1) - 2);
  const labelIndexes = [0, Math.floor((chartRows.length - 1) / 2), chartRows.length - 1].filter((index, offset, list) => index >= 0 && list.indexOf(index) === offset);

  return (
    <svg aria-label="Hyper daily buyback bar chart" className="h-[270px] w-full overflow-visible" role="img" viewBox={`0 0 ${width} ${height}`}>
      {[0, 0.5, 1].map((tick) => {
        const y = padding.top + tick * innerHeight;
        const value = max - tick * max;
        return (
          <g key={tick}>
            <line stroke="#dceee8" strokeDasharray="4 8" strokeWidth="1" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text fill="#78918b" fontSize="11" fontWeight="700" x="0" y={y + 4}>{formatUsd(value)}</text>
          </g>
        );
      })}
      {chartRows.map((row, index) => {
        const heightValue = (row.usdAmount / max) * innerHeight;
        const x = padding.left + (index / Math.max(chartRows.length, 1)) * innerWidth;
        const y = padding.top + innerHeight - Math.max(heightValue, 1);
        return (
          <rect fill="#15bfa9" height={Math.max(heightValue, 1)} key={row.date} onMouseEnter={() => setTooltip({ lines: [row.date, formatUsdMillions(row.usdAmount)], x: x + barWidth / 2, y })} onMouseLeave={() => setTooltip(null)} rx="2" width={barWidth} x={x} y={y} />
        );
      })}
      {labelIndexes.map((index) => (
        <text fill="#667d78" fontSize="11" fontWeight="700" key={chartRows[index].date} x={padding.left + (index / Math.max(chartRows.length - 1, 1)) * innerWidth} y={height - 6}>
          {formatDateLabel(chartRows[index].date)}
        </text>
      ))}
      <SvgTooltip tooltip={tooltip} width={width} />
    </svg>
  );
}

function CumulativeLine({ rows }: { rows: HypeBuybackRow[] }) {
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);
  const chartRows = rows.slice(-180);
  const width = 720;
  const height = 260;
  const padding = { bottom: 34, left: 54, right: 18, top: 16 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const max = Math.max(...chartRows.map((row) => row.cumulativeUsd), 1);
  const points = chartRows.map((row, index) => ({
    x: padding.left + (chartRows.length <= 1 ? 0 : (index / (chartRows.length - 1)) * innerWidth),
    y: padding.top + innerHeight - (row.cumulativeUsd / max) * innerHeight,
  }));
  const line = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const area = points.length > 0 ? `M ${points[0].x.toFixed(2)} ${padding.top + innerHeight} L ${line} L ${points[points.length - 1].x.toFixed(2)} ${padding.top + innerHeight} Z` : "";

  return (
    <svg aria-label="Hyper cumulative buyback line chart" className="h-[270px] w-full overflow-visible" role="img" viewBox={`0 0 ${width} ${height}`}>
      {[0, 0.5, 1].map((tick) => {
        const y = padding.top + tick * innerHeight;
        const value = max - tick * max;
        return (
          <g key={tick}>
            <line stroke="#dceee8" strokeDasharray="4 8" strokeWidth="1" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text fill="#78918b" fontSize="11" fontWeight="700" x="0" y={y + 4}>{formatUsd(value)}</text>
          </g>
        );
      })}
      <path d={area} fill="rgba(21,191,169,0.14)" />
      <polyline fill="none" points={line} stroke="#0d9c89" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
      {points.map((point, index) => (
        <circle cx={point.x} cy={point.y} fill="transparent" key={`hover-${chartRows[index].date}`} onMouseEnter={() => setTooltip({ lines: [chartRows[index].date, formatUsdMillions(chartRows[index].cumulativeUsd)], x: point.x, y: point.y })} onMouseLeave={() => setTooltip(null)} r="10" stroke="transparent" />
      ))}
      {points.length > 0 ? <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} fill="#062d29" r="4" stroke="#9adfd3" strokeWidth="3" /> : null}
      <SvgTooltip tooltip={tooltip} width={width} />
    </svg>
  );
}

function ChartCard({ children, subtitle, title }: { children: ReactNode; subtitle: string; title: string }) {
  return (
    <section className="ui-card p-5 sm:p-6">
      <p className="eyebrow">Buyback signal</p>
      <h2 className="mt-1 text-[20px] font-semibold text-[color:var(--text)]">{title}</h2>
      <p className="mt-1 text-[12px] font-medium leading-5 text-[color:var(--text-mute)]">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function BuybackTable({ rows }: { rows: HypeBuybackRow[] }) {
  return (
    <section className="ui-card overflow-hidden">
      <div className="border-b border-[color:var(--line)] p-5 sm:p-6">
        <p className="eyebrow">Daily records</p>
        <h2 className="mt-1 text-[20px] font-semibold text-[color:var(--text)]">每日回购明细</h2>
        <p className="mt-1 text-[12px] font-medium leading-5 text-[color:var(--text-mute)]">按最新日期倒序展示。</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[color:var(--line)] bg-[color:var(--surface-soft)] text-[11px] font-semibold uppercase text-[color:var(--text-dim)]">
              <th className="px-5 py-3">日期</th>
              <th className="px-5 py-3 text-right">HYPE 数量</th>
              <th className="px-5 py-3 text-right">回购金额</th>
              <th className="px-5 py-3 text-right">均价</th>
              <th className="px-5 py-3 text-right">累计 HYPE</th>
              <th className="px-5 py-3 text-right">累计金额</th>
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().slice(0, 90).map((row) => (
              <tr className="border-b border-[color:var(--line)] text-[13px] font-medium text-[color:var(--text-soft)] last:border-b-0 hover:bg-white/72" key={row.date}>
                <td className="px-5 py-4 font-semibold text-[color:var(--text)]">{row.date}</td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--mint)]">{formatHype(row.hypeAmount)}</td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--text)]">{formatUsd(row.usdAmount)}</td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--text)]">{formatPrice(row.avgPrice)}</td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--text)]">{formatHype(row.cumulativeHype)}</td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--text)]">{formatUsd(row.cumulativeUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function HypeBuybackDashboard({ data, error }: { data: HypeBuybackDashboardData | null; error?: string }) {
  if (!data) {
    return <ErrorState message={error ?? "Hyper buyback data is temporarily unavailable."} />;
  }

  return (
    <div className="space-y-4">
      <section className="ui-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Hyper dashboard</p>
            <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-[color:var(--text)] sm:text-[36px]">
              Hyper 回购
            </h1>
            <p className="mt-2 max-w-[620px] text-[13px] font-medium leading-6 text-[color:var(--text-mute)]">
              追踪 HYPE 回购金额、买入数量和累计回购趋势。
            </p>
          </div>
          <RefreshCountdown cacheExpiresAt={data.cacheExpiresAt} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper={data.totals.latestDate} label="最新单日回购" value={formatUsd(data.totals.latestUsd)} />
        <MetricCard helper={`${data.totals.records} 天记录`} label="累计回购金额" value={formatUsd(data.totals.cumulativeUsd)} />
        <MetricCard helper="累计买入 HYPE" label="累计 HYPE" value={formatHype(data.totals.cumulativeHype)} />
        <MetricCard helper={`最新均价 ${formatPrice(data.totals.latestAvgPrice)}`} label="日均回购金额" value={formatUsd(data.totals.averageDailyUsd)} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard subtitle="最近 90 天每日回购金额。" title="每日回购金额">
          <DailyBuybackBars rows={data.rows} />
        </ChartCard>
        <ChartCard subtitle="最近 180 天累计回购金额。" title="累计回购金额">
          <CumulativeLine rows={data.rows} />
        </ChartCard>
      </section>

      <BuybackTable rows={data.rows} />

      <p className="text-[11px] font-medium text-[color:var(--text-dim)]">数据来源：{data.source}。</p>
    </div>
  );
}
