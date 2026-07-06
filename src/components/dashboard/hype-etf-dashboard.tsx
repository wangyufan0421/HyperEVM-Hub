"use client";

import { RefreshCountdown } from "@/components/dashboard/refresh-countdown";
import type { HypeEtfDashboardData, HypeEtfFlowRow } from "@/lib/hype-etf";
import type { ReactNode } from "react";
import { useState } from "react";

type ChartTooltip = {
  lines: string[];
  x: number;
  y: number;
};

function formatFlow(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "--";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(1)}M`;
}

function formatPlainFlow(value: number) {
  return `$${value.toFixed(1)}M`;
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(date);
}

function SvgTooltip({ tooltip, width }: { tooltip: ChartTooltip | null; width: number }) {
  if (!tooltip) return null;

  const tooltipWidth = 216;
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
      <p className="eyebrow">Hyper ETF</p>
      <h2 className="mt-2 text-[24px] font-semibold text-[color:var(--text)]">暂时无法加载 Hyper ETF 数据</h2>
      <p className="mt-2 text-[13px] font-medium text-[color:var(--text-mute)]">{message}</p>
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
    <svg aria-label="Hyper ETF daily flow bar chart" className="h-[270px] w-full overflow-visible" role="img" viewBox={`0 0 ${width} ${height}`}>
      {[0, 0.5, 1].map((tick) => {
        const y = padding.top + tick * innerHeight;
        const value = max - tick * max;
        return (
          <g key={tick}>
            <line stroke="#dceee8" strokeDasharray="4 8" strokeWidth="1" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text fill="#78918b" fontSize="11" fontWeight="700" x="0" y={y + 4}>${value.toFixed(0)}M</text>
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
            <rect fill="#15bfa9" height={Math.max(1, bhypHeight)} onMouseEnter={() => setTooltip({ lines: [row.date, `BHYP ${formatFlow(row.bhyp)}`], x: x + barWidth / 2, y: bhypY })} onMouseLeave={() => setTooltip(null)} rx="2" width={barWidth} x={x} y={bhypY} />
            <rect fill="#9adfd3" height={Math.max(1, thypHeight)} onMouseEnter={() => setTooltip({ lines: [row.date, `THYP ${formatFlow(row.thyp)}`], x: x + barWidth + 3 + barWidth / 2, y: thypY })} onMouseLeave={() => setTooltip(null)} rx="2" width={barWidth} x={x + barWidth + 3} y={thypY} />
          </g>
        );
      })}

      {labelIndexes.map((index) => (
        <text fill="#667d78" fontSize="11" fontWeight="700" key={rows[index].isoDate} x={padding.left + index * barGroupWidth} y={height - 6}>
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
  const area = points.length > 0 ? `M ${points[0].x.toFixed(2)} ${padding.top + innerHeight} L ${line} L ${points[points.length - 1].x.toFixed(2)} ${padding.top + innerHeight} Z` : "";

  return (
    <svg aria-label="Hyper ETF cumulative flow line chart" className="h-[270px] w-full overflow-visible" role="img" viewBox={`0 0 ${width} ${height}`}>
      {[0, 0.5, 1].map((tick) => {
        const y = padding.top + tick * innerHeight;
        const value = max - tick * max;
        return (
          <g key={tick}>
            <line stroke="#dceee8" strokeDasharray="4 8" strokeWidth="1" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text fill="#78918b" fontSize="11" fontWeight="700" x="0" y={y + 4}>${value.toFixed(0)}M</text>
          </g>
        );
      })}
      <path d={area} fill="rgba(21,191,169,0.14)" />
      <polyline fill="none" points={line} stroke="#0d9c89" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
      {points.map((point, index) => (
        <circle cx={point.x} cy={point.y} fill="transparent" key={`hover-${rows[index].isoDate}`} onMouseEnter={() => setTooltip({ lines: [rows[index].date, `累计 ${formatPlainFlow(rows[index].cumulativeTotal)}`], x: point.x, y: point.y })} onMouseLeave={() => setTooltip(null)} r="10" stroke="transparent" />
      ))}
      {points.length > 0 ? <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} fill="#062d29" r="4" stroke="#9adfd3" strokeWidth="3" /> : null}
      <SvgTooltip tooltip={tooltip} width={width} />
    </svg>
  );
}

function ChartCard({ children, subtitle, title }: { children: ReactNode; subtitle?: string; title: string }) {
  return (
    <section className="ui-card p-5 sm:p-6">
      <p className="eyebrow">Flow signal</p>
      <h2 className="mt-1 text-[20px] font-semibold text-[color:var(--text)]">{title}</h2>
      {subtitle ? <p className="mt-1 text-[12px] font-medium leading-5 text-[color:var(--text-mute)]">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FlowTable({ rows }: { rows: HypeEtfFlowRow[] }) {
  return (
    <section className="ui-card overflow-hidden">
      <div className="border-b border-[color:var(--line)] p-5 sm:p-6">
        <p className="eyebrow">Daily records</p>
        <h2 className="mt-1 text-[20px] font-semibold text-[color:var(--text)]">每日 ETF 资金流</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[color:var(--line)] bg-[color:var(--surface-soft)] text-[11px] font-semibold uppercase text-[color:var(--text-dim)]">
              <th className="px-5 py-3">日期</th>
              <th className="px-5 py-3 text-right">BHYP</th>
              <th className="px-5 py-3 text-right">THYP</th>
              <th className="px-5 py-3 text-right">合计</th>
              <th className="px-5 py-3 text-right">累计合计</th>
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().map((row) => (
              <tr className="border-b border-[color:var(--line)] text-[13px] font-medium text-[color:var(--text-soft)] last:border-b-0 hover:bg-white/72" key={row.isoDate}>
                <td className="px-5 py-4 font-semibold text-[color:var(--text)]">{row.date}</td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--mint)]">{formatFlow(row.bhyp)}</td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--mint)]">{formatFlow(row.thyp)}</td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--text)]">{formatFlow(row.total)}</td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--text)]">{formatPlainFlow(row.cumulativeTotal)}</td>
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
    return <ErrorState message={error ?? "Hyper ETF data is temporarily unavailable."} />;
  }

  return (
    <div className="space-y-4">
      <section className="ui-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Hyper dashboard</p>
            <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-[color:var(--text)] sm:text-[36px]">
              Hyper ETF
            </h1>
            <p className="mt-2 max-w-[620px] text-[13px] font-medium leading-6 text-[color:var(--text-mute)]">
              追踪 BHYP / THYP 的每日资金流和累计流入变化。
            </p>
          </div>
          <RefreshCountdown cacheExpiresAt={data.cacheExpiresAt} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper={data.totals.latestDate} label="最新单日资金流" value={formatFlow(data.totals.latestTotal)} />
        <MetricCard helper={`${data.rows.length} 个交易日`} label="累计资金流" value={formatPlainFlow(data.totals.cumulativeFlow)} />
        <MetricCard helper="BHYP total flow" label="BHYP 累计" value={formatPlainFlow(data.totals.bhypFlow)} />
        <MetricCard helper="THYP total flow" label="THYP 累计" value={formatPlainFlow(data.totals.thypFlow)} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard subtitle="BHYP 与 THYP 的每日资金流拆分。" title="每日资金流">
          <FlowBars rows={data.rows} />
        </ChartCard>
        <ChartCard subtitle="全部 ETF 资金流的累计变化。" title="累计资金流">
          <CumulativeLine rows={data.rows} />
        </ChartCard>
      </section>

      <FlowTable rows={data.rows} />

      <p className="text-[11px] font-medium text-[color:var(--text-dim)]">
        数据来源：{data.source}。Static cache fetched at {new Date(data.fetchedAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC.
      </p>
    </div>
  );
}
