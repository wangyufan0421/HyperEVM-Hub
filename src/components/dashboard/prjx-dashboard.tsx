"use client";

import { RefreshCountdown } from "@/components/dashboard/refresh-countdown";
import { PRJX_DASHBOARD_COPY } from "@/lib/prjx-copy";
import type { PrjxDashboardData, PrjxDexVolumePoint, PrjxLpPoolRow, PrjxTvlPoint } from "@/lib/prjx";
import { useState } from "react";

type ChartTooltip = {
  lines: string[];
  x: number;
  y: number;
};

function formatUsd(value: number | null, maximumFractionDigits = 2) {
  if (value === null || !Number.isFinite(value)) return "--";
  return Intl.NumberFormat("en-US", {
    compactDisplay: "short",
    currency: "USD",
    maximumFractionDigits,
    notation: "compact",
    style: "currency",
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "--";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatInteger(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "--";
  return Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatFeeTier(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "--";
  return `${(value / 10000).toFixed(value < 1000 ? 2 : 1)}%`;
}

function formatDate(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "--";
  return Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(value * 1000));
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
      <p className="eyebrow">{PRJX_DASHBOARD_COPY.displayName}</p>
      <h2 className="mt-2 text-[24px] font-semibold text-[color:var(--text)]">{PRJX_DASHBOARD_COPY.errorHeading}</h2>
      <p className="mt-2 text-[13px] font-medium text-[color:var(--text-mute)]">{message}</p>
    </section>
  );
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

function TvlVolumeChart({ tvlPoints, volumePoints }: { tvlPoints: PrjxTvlPoint[]; volumePoints: PrjxDexVolumePoint[] }) {
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);
  const width = 980;
  const height = 360;
  const padding = { bottom: 38, left: 64, right: 76, top: 18 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const tvlByDate = new Map(tvlPoints.map((point) => [point.date, point.tvl]));
  const volumeByDate = new Map(volumePoints.map((point) => [point.date, point.volume]));
  const dates = [...new Set([...tvlByDate.keys(), ...volumeByDate.keys()])].sort((a, b) => a - b);
  const minDate = dates[0] ?? 0;
  const maxDate = dates.at(-1) ?? minDate;
  const tvlMax = Math.max(...tvlPoints.map((point) => point.tvl), 1) * 1.08;
  const volumeMax = Math.max(...volumePoints.map((point) => point.volume), 1) * 1.08;
  const xForDate = (date: number) => padding.left + (maxDate === minDate ? innerWidth / 2 : ((date - minDate) / (maxDate - minDate)) * innerWidth);
  const barWidth = Math.max(1.6, Math.min(7, innerWidth / Math.max(volumePoints.length, 1) * 0.58));
  const chartPoints = dates.map((date) => ({
    date,
    tvl: tvlByDate.get(date) ?? null,
    volume: volumeByDate.get(date) ?? null,
    x: xForDate(date),
  }));
  const tvlLinePoints = chartPoints
    .filter((point): point is typeof point & { tvl: number } => point.tvl !== null)
    .map((point) => ({
      ...point,
      y: padding.top + innerHeight - (point.tvl / tvlMax) * innerHeight,
    }));
  const line = tvlLinePoints.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const area =
    tvlLinePoints.length > 0
      ? `${tvlLinePoints[0].x.toFixed(2)},${height - padding.bottom} ${line} ${tvlLinePoints[tvlLinePoints.length - 1].x.toFixed(2)},${height - padding.bottom}`
      : "";
  const labelIndexes = [0, Math.floor((dates.length - 1) / 4), Math.floor((dates.length - 1) / 2), Math.floor(((dates.length - 1) * 3) / 4), dates.length - 1].filter(
    (index, offset, list) => index >= 0 && list.indexOf(index) === offset,
  );

  return (
    <svg aria-label={PRJX_DASHBOARD_COPY.chartLabel} className="h-[360px] w-full overflow-visible" role="img" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="prjx-tvl-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#15a38f" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#15a38f" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
        const y = padding.top + tick * innerHeight;
        const tvlValue = tvlMax - tick * tvlMax;
        const volumeValue = volumeMax - tick * volumeMax;
        return (
          <g key={tick}>
            <line stroke="#dceee8" strokeDasharray="4 8" strokeWidth="1" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text fill="#78918b" fontSize="11" fontWeight="700" x="0" y={y + 4}>
              {formatUsd(tvlValue, 0)}
            </text>
            <text fill="#b77912" fontSize="11" fontWeight="700" textAnchor="end" x={width} y={y + 4}>
              {formatUsd(volumeValue, 0)}
            </text>
          </g>
        );
      })}
      {chartPoints.map((point) => {
        const volume = point.volume ?? 0;
        const barHeight = Math.max(0, (volume / volumeMax) * innerHeight);
        return (
          <rect
            fill="#f5a000"
            height={barHeight}
            key={`volume-${point.date}`}
            opacity="0.86"
            rx="1"
            width={barWidth}
            x={point.x - barWidth / 2}
            y={padding.top + innerHeight - barHeight}
          />
        );
      })}
      <polygon fill="url(#prjx-tvl-fill)" points={area} />
      <polyline fill="none" points={line} stroke="#1e78ff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.6" />
      {chartPoints.map((chartPoint) => (
        <rect
          fill="transparent"
          height={innerHeight}
          key={`hover-${chartPoint.date}`}
          onMouseEnter={() =>
            setTooltip({
              lines: [formatDate(chartPoint.date), `TVL ${formatUsd(chartPoint.tvl)}`, `DEX Volume ${formatUsd(chartPoint.volume)}`],
              x: chartPoint.x,
              y: padding.top + innerHeight / 2,
            })
          }
          onMouseLeave={() => setTooltip(null)}
          width={Math.max(barWidth, 8)}
          x={chartPoint.x - Math.max(barWidth, 8) / 2}
          y={padding.top}
        />
      ))}
      {tvlLinePoints.length > 0 ? (
        <circle cx={tvlLinePoints[tvlLinePoints.length - 1].x} cy={tvlLinePoints[tvlLinePoints.length - 1].y} fill="#062d29" r="4" stroke="#8dbdff" strokeWidth="3" />
      ) : null}
      {labelIndexes.map((index) => (
        <text fill="#667d78" fontSize="11" fontWeight="700" key={`${dates[index]}-label`} textAnchor={index === dates.length - 1 ? "end" : "middle"} x={xForDate(dates[index] ?? 0)} y={height - 8}>
          {formatDate(dates[index] ?? null)}
        </text>
      ))}
      <SvgTooltip tooltip={tooltip} width={width} />
    </svg>
  );
}

function TokenPairCell({ row }: { row: PrjxLpPoolRow }) {
  return (
    <div className="flex min-w-[220px] items-center gap-3">
      <div className="flex -space-x-2">
        {row.token0Logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="h-8 w-8 rounded-full border border-white bg-white object-contain" src={row.token0Logo} />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full border border-white bg-[color:var(--surface-soft)] text-[10px] font-semibold text-[color:var(--mint)]">
            {row.token0Symbol.slice(0, 2)}
          </span>
        )}
        {row.token1Logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="h-8 w-8 rounded-full border border-white bg-white object-contain" src={row.token1Logo} />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full border border-white bg-[color:var(--surface-soft)] text-[10px] font-semibold text-[color:var(--mint)]">
            {row.token1Symbol.slice(0, 2)}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold text-[color:var(--text)]">{row.name}</p>
        <p className="mt-1 truncate text-[12px] font-medium text-[color:var(--text-mute)]">
          {row.version} · {row.id.slice(0, 6)}...{row.id.slice(-4)}
        </p>
      </div>
    </div>
  );
}

function LpTable({ rows }: { rows: PrjxLpPoolRow[] }) {
  return (
    <section className="ui-card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--line)] p-5 sm:p-6">
        <div>
          <p className="eyebrow">{PRJX_DASHBOARD_COPY.lpEyebrow}</p>
          <h2 className="mt-1 text-[20px] font-semibold text-[color:var(--text)]">{PRJX_DASHBOARD_COPY.lpTableTitle}</h2>
          {PRJX_DASHBOARD_COPY.lpTableDescription ? (
            <p className="mt-1 text-[12px] font-medium leading-5 text-[color:var(--text-mute)]">{PRJX_DASHBOARD_COPY.lpTableDescription}</p>
          ) : null}
        </div>
        <span className="ui-button">Top 10</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[color:var(--line)] bg-[color:var(--surface-soft)] text-[11px] font-semibold uppercase text-[color:var(--text-dim)]">
              <th className="px-5 py-3">#</th>
              <th className="px-5 py-3">Pool</th>
              <th className="px-5 py-3 text-right">Fee</th>
              <th className="px-5 py-3 text-right">TVL</th>
              <th className="px-5 py-3 text-right">24H Volume</th>
              <th className="px-5 py-3 text-right">24H Fee</th>
              <th className="px-5 py-3 text-right">APR</th>
              <th className="px-5 py-3 text-right">Base APR</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-[color:var(--line)] text-[13px] font-medium text-[color:var(--text-soft)] last:border-b-0 hover:bg-white/72" key={row.id}>
                <td className="px-5 py-4">
                  <span className="num text-[13px] font-semibold text-[color:var(--mint)]">{row.rank}</span>
                </td>
                <td className="px-5 py-4">
                  <TokenPairCell row={row} />
                </td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--text)]">{formatFeeTier(row.feeTier)}</td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--text)]">{formatUsd(row.tvlUsd)}</td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--text)]">{formatUsd(row.volume24h)}</td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--text)]">{formatUsd(row.fee24h)}</td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--mint)]">{formatPercent(row.apr)}</td>
                <td className="px-5 py-4 text-right num text-[13px] font-semibold text-[color:var(--text)]">{formatPercent(row.baseApr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function PrjxDashboard({ data, error }: { data: PrjxDashboardData | null; error?: string }) {
  if (!data) {
    return <ErrorState message={error ?? PRJX_DASHBOARD_COPY.dataUnavailable} />;
  }

  return (
    <div className="space-y-4">
      <section className="ui-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Project detail</p>
            <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-[color:var(--text)] sm:text-[36px]">
              {PRJX_DASHBOARD_COPY.displayName}
            </h1>
            <p className="mt-2 max-w-[720px] text-[13px] font-medium leading-6 text-[color:var(--text-mute)]">
              {PRJX_DASHBOARD_COPY.summary}
            </p>
          </div>
          <RefreshCountdown cacheExpiresAt={data.cacheExpiresAt} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper={data.info.chain} label="当前 TVL" value={formatUsd(data.info.currentTvl)} />
        <MetricCard helper="DefiLlama historical high" label="历史峰值" value={formatUsd(data.stats.peakTvl)} />
        <MetricCard helper={data.stats.lpDepositorsHelper} label="LP depositors" value={formatInteger(data.stats.lpDepositors)} />
        <MetricCard helper="DEX volume 24h" label="DEX Volume" value={formatUsd(data.info.currentDexVolume24h)} />
      </section>

      <section className="ui-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">DefiLlama TVL + DEX Volume</p>
            <h2 className="mt-1 text-[20px] font-semibold text-[color:var(--text)]">TVL / DEX Volume</h2>
            {PRJX_DASHBOARD_COPY.tvlDescription ? (
              <p className="mt-1 text-[12px] font-medium leading-5 text-[color:var(--text-mute)]">{PRJX_DASHBOARD_COPY.tvlDescription}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="ui-button border-[#1e78ff] text-[#1e78ff]">TVL</span>
            <span className="ui-button border-[#f5a000] text-[#a96800]">DEX Volume</span>
          </div>
        </div>
        <div className="mt-4">
          <TvlVolumeChart tvlPoints={data.tvlHistory} volumePoints={data.dexVolumeHistory} />
        </div>
      </section>

      <LpTable rows={data.lpPools} />

      <p className="text-[11px] font-medium text-[color:var(--text-dim)]">数据来源：{data.source}。更新时间：{new Date(data.updatedAt).toLocaleString("en-US")}。</p>
    </div>
  );
}
