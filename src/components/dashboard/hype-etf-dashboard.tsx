"use client";

import { RefreshCountdown } from "@/components/dashboard/refresh-countdown";
import type { HypeEtfDashboardData, HypeEtfFlowRow } from "@/lib/hype-etf";
import { useState } from "react";
import type { ReactNode } from "react";

type ChartTooltip = {
  lines: string[];
  x: number;
  y: number;
};

function formatFlow(value: number | null) {
  if (value === null) {
    return "--";
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(1)}M`;
}

function formatPlainFlow(value: number) {
  return `$${value.toFixed(1)}M`;
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

  const tooltipWidth = 174;
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
      <p className="text-[12px] font-black uppercase text-[#0b9482]">HYPE ETF</p>
      <h2 className="mt-2 text-[24px] font-black">暂时无法加载 HYPE ETF 数据</h2>
      <p className="mt-2 text-[13px] font-bold text-[#66817c]">{message}</p>
    </section>
  );
}

function FlowBars({ rows }: { rows: HypeEtfFlowRow[] }) {
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);
  const width = 720;
  const height = 260;
  const padding = { bottom: 34, left: 46, right: 18, top: 16 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const max = Math.max(...rows.map((row) => Math.max(Math.abs(row.bhyp ?? 0), Math.abs(row.thyp ?? 0), Math.abs(row.total))), 1);
  const barGroupWidth = innerWidth / Math.max(rows.length, 1);
  const barWidth = Math.max(6, Math.min(18, barGroupWidth / 3));
  const zeroY = padding.top + innerHeight;
  const labelIndexes = [0, Math.floor((rows.length - 1) / 2), rows.length - 1].filter((index, offset, list) => index >= 0 && list.indexOf(index) === offset);

  return (
    <svg aria-label="HYPE ETF 每日资金流柱状图" className="h-[270px] w-full overflow-visible" role="img" viewBox={`0 0 ${width} ${height}`}>
      {[0, 0.5, 1].map((tick) => {
        const y = padding.top + tick * innerHeight;
        const value = max - tick * max;
        return (
          <g key={tick}>
            <line stroke="#dceee8" strokeDasharray="4 8" strokeWidth="1" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text fill="#7a9690" fontSize="11" fontWeight="800" x="0" y={y + 4}>
              ${value.toFixed(0)}M
            </text>
          </g>
        );
      })}

      {rows.map((row, index) => {
        const x = padding.left + index * barGroupWidth + Math.max(0, (barGroupWidth - barWidth * 2 - 3) / 2);
        const bhypHeight = ((row.bhyp ?? 0) / max) * innerHeight;
        const thypHeight = ((row.thyp ?? 0) / max) * innerHeight;
        const bhypY = zeroY - Math.max(0, bhypHeight);
        const thypY = zeroY - Math.max(0, thypHeight);

        return (
          <g key={row.isoDate}>
            <rect
              fill="#27c7b4"
              height={Math.max(1, bhypHeight)}
              onMouseEnter={() => setTooltip({ lines: [row.date, `BHYP ${formatFlow(row.bhyp)}`], x: x + barWidth / 2, y: bhypY })}
              onMouseLeave={() => setTooltip(null)}
              rx="2"
              width={barWidth}
              x={x}
              y={bhypY}
            />
            <rect
              fill="#8fdccb"
              height={Math.max(1, thypHeight)}
              onMouseEnter={() => setTooltip({ lines: [row.date, `THYP ${formatFlow(row.thyp)}`], x: x + barWidth + 3 + barWidth / 2, y: thypY })}
              onMouseLeave={() => setTooltip(null)}
              rx="2"
              width={barWidth}
              x={x + barWidth + 3}
              y={thypY}
            />
          </g>
        );
      })}

      {labelIndexes.map((index) => (
        <text fill="#55756f" fontSize="11" fontWeight="900" key={rows[index].isoDate} x={padding.left + index * barGroupWidth} y={height - 6}>
          {formatDateLabel(rows[index].isoDate)}
        </text>
      ))}
      <SvgTooltip tooltip={tooltip} width={width} />
    </svg>
  );
}

function CumulativeLine({ rows }: { rows: HypeEtfFlowRow[] }) {
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);
  const width = 720;
  const height = 260;
  const padding = { bottom: 34, left: 46, right: 18, top: 16 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const values = rows.map((row) => row.cumulativeTotal);
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => ({
    x: padding.left + (rows.length <= 1 ? 0 : (index / (rows.length - 1)) * innerWidth),
    y: padding.top + innerHeight - (value / max) * innerHeight,
  }));
  const line = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const area =
    points.length > 0
      ? `M ${points[0].x.toFixed(2)} ${padding.top + innerHeight} L ${line} L ${points[points.length - 1].x.toFixed(2)} ${padding.top + innerHeight} Z`
      : "";

  return (
    <svg aria-label="HYPE ETF 累计资金流图表" className="h-[270px] w-full overflow-visible" role="img" viewBox={`0 0 ${width} ${height}`}>
      {[0, 0.5, 1].map((tick) => {
        const y = padding.top + tick * innerHeight;
        const value = max - tick * max;
        return (
          <g key={tick}>
            <line stroke="#dceee8" strokeDasharray="4 8" strokeWidth="1" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text fill="#7a9690" fontSize="11" fontWeight="800" x="0" y={y + 4}>
              ${value.toFixed(0)}M
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
          key={`hover-${rows[index].isoDate}`}
          onMouseEnter={() => setTooltip({ lines: [rows[index].date, `合计 ${formatPlainFlow(rows[index].cumulativeTotal)}`], x: point.x, y: point.y })}
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

function ChartCard({ children, subtitle, title }: { children: ReactNode; subtitle?: string; title: string }) {
  return (
    <section className="rounded-[10px] border border-[#0e3f3a22] bg-[#f8fffc]/88 p-5 shadow-[0_18px_44px_rgba(7,43,40,0.08)] sm:p-6">
      <h2 className="text-[22px] font-black leading-tight text-[#062d29] sm:text-[24px]">{title}</h2>
      {subtitle ? <p className="mt-1 text-[12px] font-bold leading-5 text-[#66817c]">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FlowTable({ rows }: { rows: HypeEtfFlowRow[] }) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-[#0e3f3a22] bg-[#f8fffc]/88 shadow-[0_18px_44px_rgba(7,43,40,0.08)]">
      <div className="border-b border-[#0e3f3a14] p-5 sm:p-6">
        <h2 className="text-[22px] font-black leading-tight text-[#062d29] sm:text-[24px]">每日 ETF 资金流</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#0e3f3a10] bg-[#eefbf7]/74 text-[13px] font-black uppercase tracking-normal text-[#6b837e]">
              <th className="px-5 py-4">日期</th>
              <th className="px-5 py-4 text-right">BHYP</th>
              <th className="px-5 py-4 text-right">THYP</th>
              <th className="px-5 py-4 text-right">合计</th>
              <th className="px-5 py-4 text-right">累计合计</th>
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().map((row) => (
              <tr className="border-b border-[#0e3f3a0f] text-[14px] font-bold text-[#244d48] last:border-b-0 hover:bg-[#effbf7]/70" key={row.isoDate}>
                <td className="px-5 py-4 font-black text-[#063934]">{row.date}</td>
                <td className="px-5 py-4 text-right font-mono text-[15px] font-black text-[#087b6d]">{formatFlow(row.bhyp)}</td>
                <td className="px-5 py-4 text-right font-mono text-[15px] font-black text-[#087b6d]">{formatFlow(row.thyp)}</td>
                <td className="px-5 py-4 text-right font-mono text-[15px] font-black text-[#063934]">{formatFlow(row.total)}</td>
                <td className="px-5 py-4 text-right font-mono text-[15px] font-black text-[#063934]">{formatPlainFlow(row.cumulativeTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function HypeEtfDashboard({ data, error }: { data: HypeEtfDashboardData | null; error?: string }) {
  if (!data) {
    return <ErrorState message={error ?? "HYPE ETF data is temporarily unavailable."} />;
  }

  return (
    <div className="space-y-4 text-[#063934]">
      <section className="rounded-[10px] border border-[#0e3f3a22] bg-[linear-gradient(135deg,#ffffffd9,#e8fbf5)] p-5 shadow-[0_18px_48px_rgba(7,43,40,0.08)] sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-normal text-[#0a8f7d]">HYPE ETF</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-black leading-tight text-[#052c28] sm:text-[34px]">HYPE ETF 资金流数据</h1>
          </div>
          <RefreshCountdown cacheExpiresAt={data.cacheExpiresAt} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper={data.totals.latestDate} label="最新单日资金流" tone="positive" value={formatFlow(data.totals.latestTotal)} />
        <MetricCard helper={`${data.rows.length} 个交易日`} label="累计资金流" tone="positive" value={formatPlainFlow(data.totals.cumulativeFlow)} />
        <MetricCard helper={`BHYP ${formatPlainFlow(data.totals.bhypFlow)}`} label="BHYP 累计" value={formatPlainFlow(data.totals.bhypFlow)} />
        <MetricCard helper={`THYP ${formatPlainFlow(data.totals.thypFlow)}`} label="THYP 累计" value={formatPlainFlow(data.totals.thypFlow)} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="每日资金流">
          <FlowBars rows={data.rows} />
        </ChartCard>
        <ChartCard title="累计资金流">
          <CumulativeLine rows={data.rows} />
        </ChartCard>
      </section>

      <FlowTable rows={data.rows} />

      <p className="text-[11px] font-bold text-[#6b837e]">
        Source: {data.source}. Static cache fetched at {new Date(data.fetchedAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC.
      </p>
    </div>
  );
}
