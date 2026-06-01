"use client";

import { RefreshCountdown } from "@/components/dashboard/refresh-countdown";
import type { HypeBuybackDashboardData, HypeBuybackRow } from "@/lib/hype-buyback";
import { useState } from "react";
import type { ReactNode } from "react";

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

function MetricCard({ helper, label, tone = "default", value }: { helper: string; label: string; tone?: "default" | "positive"; value: string }) {
  return (
    <div className="rounded-[10px] border border-[#0e3f3a20] bg-[#fbfffd]/88 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
      <p className="text-[11px] font-black uppercase tracking-normal text-[#6b837e]">{label}</p>
      <p className={`mt-3 font-mono text-[25px] font-black leading-none sm:text-[27px] ${tone === "positive" ? "text-[#087b6d]" : "text-[#063934]"}`}>
        {value}
      </p>
      <p className="mt-2 text-[11px] font-bold text-[#7a9690]">{helper}</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-[10px] border border-[#0e3f3a22] bg-[#f8fffc]/88 p-6 text-[#063934]">
      <p className="text-[12px] font-black uppercase text-[#0b9482]">HYPE 回购</p>
      <h2 className="mt-2 text-[24px] font-black">暂时无法加载 HYPE 回购数据</h2>
      <p className="mt-2 text-[13px] font-bold text-[#66817c]">{message}</p>
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
    <svg aria-label="HYPE daily buyback chart" className="h-[270px] w-full overflow-visible" role="img" viewBox={`0 0 ${width} ${height}`}>
      {[0, 0.5, 1].map((tick) => {
        const y = padding.top + tick * innerHeight;
        const value = max - tick * max;
        return (
          <g key={tick}>
            <line stroke="#dceee8" strokeDasharray="4 8" strokeWidth="1" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text fill="#7a9690" fontSize="11" fontWeight="800" x="0" y={y + 4}>
              {formatUsd(value)}
            </text>
          </g>
        );
      })}
      {chartRows.map((row, index) => {
        const heightValue = (row.usdAmount / max) * innerHeight;
        const x = padding.left + (index / Math.max(chartRows.length, 1)) * innerWidth;
        const y = padding.top + innerHeight - Math.max(heightValue, 1);
        return (
          <rect
            fill="#27c7b4"
            height={Math.max(heightValue, 1)}
            key={row.date}
            onMouseEnter={() => setTooltip({ lines: [row.date, formatUsdMillions(row.usdAmount)], x: x + barWidth / 2, y })}
            onMouseLeave={() => setTooltip(null)}
            rx="2"
            width={barWidth}
            x={x}
            y={y}
          />
        );
      })}
      {labelIndexes.map((index) => (
        <text fill="#55756f" fontSize="11" fontWeight="900" key={chartRows[index].date} x={padding.left + (index / Math.max(chartRows.length - 1, 1)) * innerWidth} y={height - 6}>
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
  const area =
    points.length > 0
      ? `M ${points[0].x.toFixed(2)} ${padding.top + innerHeight} L ${line} L ${points[points.length - 1].x.toFixed(2)} ${padding.top + innerHeight} Z`
      : "";

  return (
    <svg aria-label="HYPE cumulative buyback chart" className="h-[270px] w-full overflow-visible" role="img" viewBox={`0 0 ${width} ${height}`}>
      {[0, 0.5, 1].map((tick) => {
        const y = padding.top + tick * innerHeight;
        const value = max - tick * max;
        return (
          <g key={tick}>
            <line stroke="#dceee8" strokeDasharray="4 8" strokeWidth="1" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text fill="#7a9690" fontSize="11" fontWeight="800" x="0" y={y + 4}>
              {formatUsd(value)}
            </text>
          </g>
        );
      })}
      <path d={area} fill="#d7f4ed" />
      <polyline fill="none" points={line} stroke="#087b6d" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      {points.map((point, index) => (
        <circle
          cx={point.x}
          cy={point.y}
          fill="transparent"
          key={`hover-${chartRows[index].date}`}
          onMouseEnter={() => setTooltip({ lines: [chartRows[index].date, formatUsdMillions(chartRows[index].cumulativeUsd)], x: point.x, y: point.y })}
          onMouseLeave={() => setTooltip(null)}
          r="10"
          stroke="transparent"
        />
      ))}
      {points.length > 0 ? <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} fill="#063934" r="4" stroke="#8ef5dc" strokeWidth="3" /> : null}
      <SvgTooltip tooltip={tooltip} width={width} />
    </svg>
  );
}

function ChartCard({ children, subtitle, title }: { children: ReactNode; subtitle: string; title: string }) {
  return (
    <section className="rounded-[10px] border border-[#0e3f3a22] bg-[#f8fffc]/88 p-5 shadow-[0_18px_44px_rgba(7,43,40,0.08)] sm:p-6">
      <h2 className="text-[22px] font-black leading-tight text-[#062d29] sm:text-[24px]">{title}</h2>
      <p className="mt-1 text-[12px] font-bold leading-5 text-[#66817c]">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function BuybackTable({ rows }: { rows: HypeBuybackRow[] }) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-[#0e3f3a22] bg-[#f8fffc]/88 shadow-[0_18px_44px_rgba(7,43,40,0.08)]">
      <div className="border-b border-[#0e3f3a14] p-5 sm:p-6">
        <h2 className="text-[22px] font-black leading-tight text-[#062d29] sm:text-[24px]">每日回购明细</h2>
        <p className="mt-1 text-[12px] font-bold leading-5 text-[#66817c]">按最新日期倒序展示。</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#0e3f3a10] bg-[#eefbf7]/74 text-[13px] font-black uppercase tracking-normal text-[#6b837e]">
              <th className="px-5 py-4">日期</th>
              <th className="px-5 py-4 text-right">HYPE 数量</th>
              <th className="px-5 py-4 text-right">回购金额</th>
              <th className="px-5 py-4 text-right">均价</th>
              <th className="px-5 py-4 text-right">累计 HYPE</th>
              <th className="px-5 py-4 text-right">累计金额</th>
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().slice(0, 90).map((row) => (
              <tr className="border-b border-[#0e3f3a0f] text-[14px] font-bold text-[#244d48] last:border-b-0 hover:bg-[#effbf7]/70" key={row.date}>
                <td className="px-5 py-4 font-black text-[#063934]">{row.date}</td>
                <td className="px-5 py-4 text-right font-mono text-[15px] font-black text-[#087b6d]">{formatHype(row.hypeAmount)}</td>
                <td className="px-5 py-4 text-right font-mono text-[15px] font-black text-[#063934]">{formatUsd(row.usdAmount)}</td>
                <td className="px-5 py-4 text-right font-mono text-[15px] font-black text-[#063934]">{formatPrice(row.avgPrice)}</td>
                <td className="px-5 py-4 text-right font-mono text-[15px] font-black text-[#063934]">{formatHype(row.cumulativeHype)}</td>
                <td className="px-5 py-4 text-right font-mono text-[15px] font-black text-[#063934]">{formatUsd(row.cumulativeUsd)}</td>
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
    return <ErrorState message={error ?? "HYPE buyback data is temporarily unavailable."} />;
  }

  return (
    <div className="space-y-4 text-[#063934]">
      <section className="rounded-[10px] border border-[#0e3f3a22] bg-[linear-gradient(135deg,#ffffffd9,#e8fbf5)] p-5 shadow-[0_18px_48px_rgba(7,43,40,0.08)] sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-normal text-[#0a8f7d]">HYPE 回购</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[28px] font-black leading-tight text-[#052c28] sm:text-[34px]">HYPE 回购数据</h1>
          <RefreshCountdown cacheExpiresAt={data.cacheExpiresAt} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper={data.totals.latestDate} label="最新单日回购" tone="positive" value={formatUsd(data.totals.latestUsd)} />
        <MetricCard helper={`${data.totals.records} 天记录`} label="累计回购金额" tone="positive" value={formatUsd(data.totals.cumulativeUsd)} />
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

      <p className="text-[11px] font-bold text-[#6b837e]">Source: {data.source}.</p>
    </div>
  );
}
