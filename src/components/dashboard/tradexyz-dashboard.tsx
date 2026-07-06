"use client";

import { RefreshCountdown } from "@/components/dashboard/refresh-countdown";
import { TRADE_XYZ_DASHBOARD_COPY } from "@/lib/tradexyz-copy";
import type {
  TradeXyzDashboardData,
  TradeXyzFeePoint,
  TradeXyzHip3DexComparisonRow,
  TradeXyzHip3MarketShareRow,
  TradeXyzPerpVolumePoint,
  TradeXyzTopMarket,
} from "@/lib/tradexyz";
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

function formatDate(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "--";
  return Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(value * 1000));
}

function formatInt(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "--";
  return Intl.NumberFormat("en-US", {
    compactDisplay: "short",
    maximumFractionDigits: 2,
    notation: "compact",
  }).format(value);
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
      <p className="eyebrow">{TRADE_XYZ_DASHBOARD_COPY.displayName}</p>
      <h2 className="mt-2 text-[24px] font-semibold text-[color:var(--text)]">{TRADE_XYZ_DASHBOARD_COPY.errorHeading}</h2>
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

type ComparisonMetric = {
  format: (value: number | null) => string;
  key: keyof Pick<TradeXyzHip3DexComparisonRow, "oi" | "trades" | "traders" | "volume">;
  label: string;
};

type MarketShareMetric = {
  key: keyof Pick<TradeXyzHip3MarketShareRow, "oiPct" | "tradesPct" | "tradersPct" | "volumePct">;
  label: string;
};

const COMPARISON_METRICS: ComparisonMetric[] = [
  { format: formatUsd, key: "volume", label: "Volume" },
  { format: formatUsd, key: "oi", label: "Open Interest" },
  { format: formatInt, key: "trades", label: "Trades" },
  { format: formatInt, key: "traders", label: "Traders" },
];

const MARKET_SHARE_METRICS: MarketShareMetric[] = [
  { key: "volumePct", label: "Volume" },
  { key: "oiPct", label: "Open Interest" },
  { key: "tradesPct", label: "Trades" },
  { key: "tradersPct", label: "Traders" },
];

function chartButtonClass(active: boolean) {
  return active
    ? "ui-button border-[#1e78ff] bg-[#1e78ff] text-white shadow-[0_8px_20px_rgba(30,120,255,0.22)] hover:border-[#1e78ff] hover:bg-[#1e78ff] hover:text-white"
    : "ui-button";
}

function dexDisplayName(dex: string) {
  const normalized = dex.toUpperCase();
  if (normalized === "XYZ") return "trade XYZ";
  if (normalized === "KM") return "KINETIQ market";
  return dex;
}

function FeesVolumeChart({ feePoints, volumePoints }: { feePoints: TradeXyzFeePoint[]; volumePoints: TradeXyzPerpVolumePoint[] }) {
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);
  const width = 980;
  const height = 360;
  const padding = { bottom: 38, left: 64, right: 76, top: 18 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const feesByDate = new Map(feePoints.map((point) => [point.date, point.fees]));
  const volumeByDate = new Map(volumePoints.map((point) => [point.date, point.volume]));
  const dates = [...new Set([...feesByDate.keys(), ...volumeByDate.keys()])].sort((a, b) => a - b);
  const minDate = dates[0] ?? 0;
  const maxDate = dates.at(-1) ?? minDate;
  const feesMax = Math.max(...feePoints.map((point) => point.fees), 1) * 1.08;
  const volumeMax = Math.max(...volumePoints.map((point) => point.volume), 1) * 1.08;
  const xForDate = (date: number) => padding.left + (maxDate === minDate ? innerWidth / 2 : ((date - minDate) / (maxDate - minDate)) * innerWidth);
  const barWidth = Math.max(1.6, Math.min(7, innerWidth / Math.max(volumePoints.length, 1) * 0.58));
  const chartPoints = dates.map((date) => ({
    date,
    fees: feesByDate.get(date) ?? null,
    volume: volumeByDate.get(date) ?? null,
    x: xForDate(date),
  }));
  const feeLinePoints = chartPoints
    .filter((point): point is typeof point & { fees: number } => point.fees !== null)
    .map((point) => ({
      ...point,
      y: padding.top + innerHeight - (point.fees / feesMax) * innerHeight,
    }));
  const line = feeLinePoints.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const area =
    feeLinePoints.length > 0
      ? `${feeLinePoints[0].x.toFixed(2)},${height - padding.bottom} ${line} ${feeLinePoints[feeLinePoints.length - 1].x.toFixed(2)},${height - padding.bottom}`
      : "";
  const labelIndexes = [0, Math.floor((dates.length - 1) / 4), Math.floor((dates.length - 1) / 2), Math.floor(((dates.length - 1) * 3) / 4), dates.length - 1].filter(
    (index, offset, list) => index >= 0 && list.indexOf(index) === offset,
  );

  return (
    <svg aria-label={TRADE_XYZ_DASHBOARD_COPY.chartLabel} className="h-[360px] w-full overflow-visible" role="img" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="tradexyz-fees-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1e78ff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#1e78ff" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
        const y = padding.top + tick * innerHeight;
        const feesValue = feesMax - tick * feesMax;
        const volumeValue = volumeMax - tick * volumeMax;
        return (
          <g key={tick}>
            <line stroke="#dceee8" strokeDasharray="4 8" strokeWidth="1" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text fill="#1e78ff" fontSize="11" fontWeight="700" x="0" y={y + 4}>
              {formatUsd(feesValue, 0)}
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
      {area ? <polygon fill="url(#tradexyz-fees-fill)" points={area} /> : null}
      {line ? <polyline fill="none" points={line} stroke="#1e78ff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.6" /> : null}
      {chartPoints.map((chartPoint) => (
        <rect
          fill="transparent"
          height={innerHeight}
          key={`hover-${chartPoint.date}`}
          onMouseEnter={() =>
            setTooltip({
              lines: [formatDate(chartPoint.date), `Fees ${formatUsd(chartPoint.fees)}`, `Perp Volume ${formatUsd(chartPoint.volume)}`],
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
      {feeLinePoints.length > 0 ? (
        <circle cx={feeLinePoints[feeLinePoints.length - 1].x} cy={feeLinePoints[feeLinePoints.length - 1].y} fill="#062d29" r="4" stroke="#8dbdff" strokeWidth="3" />
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

function Hip3DexComparisonChart({ rows }: { rows: TradeXyzHip3DexComparisonRow[] }) {
  const [metricKey, setMetricKey] = useState<ComparisonMetric["key"]>("volume");
  const metric = COMPARISON_METRICS.find((item) => item.key === metricKey) ?? COMPARISON_METRICS[0];
  const chartRows = [...rows].sort((a, b) => b[metric.key] - a[metric.key]).slice(0, 8);
  const maxValue = Math.max(...chartRows.map((row) => row[metric.key]), 1);

  if (chartRows.length === 0) {
    return (
      <section className="ui-card p-5 sm:p-6">
        <p className="eyebrow">Flowscan HIP-3</p>
        <h2 className="mt-1 text-[20px] font-semibold text-[color:var(--text)]">HIP-3 DEX Comparison</h2>
        <p className="mt-4 text-[13px] font-medium text-[color:var(--text-mute)]">No HIP-3 comparison data is available.</p>
      </section>
    );
  }

  return (
    <section className="ui-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Flowscan HIP-3</p>
          <h2 className="mt-1 text-[20px] font-semibold text-[color:var(--text)]">HIP-3 DEX Comparison</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {COMPARISON_METRICS.map((item) => (
            <button
              aria-pressed={item.key === metric.key}
              className={chartButtonClass(item.key === metric.key)}
              key={item.key}
              onClick={() => setMetricKey(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {chartRows.map((row) => {
          const value = row[metric.key];
          const width = `${Math.max(2, (value / maxValue) * 100)}%`;
          const name = dexDisplayName(row.dex);
          return (
            <div className="grid grid-cols-[96px_minmax(0,1fr)_92px] items-center gap-3 sm:grid-cols-[150px_minmax(0,1fr)_120px]" key={row.dex}>
              <div className="min-w-0">
                <p className={`truncate text-[13px] font-semibold ${row.isTradeXyz ? "text-[#1e78ff]" : "text-[color:var(--text)]"}`} title={name}>
                  {name}
                </p>
              </div>
              <div className="h-8 overflow-hidden rounded-[6px] bg-[color:var(--surface-soft)]">
                <div
                  className="flex h-full items-center justify-end rounded-[6px] px-2 text-[11px] font-bold text-white transition-[width]"
                  style={{
                    background: row.isTradeXyz ? "#1e78ff" : "#f5a000",
                    width,
                  }}
                >
                  {row.isTradeXyz ? "trade XYZ" : ""}
                </div>
              </div>
              <p className="num text-right text-[13px] font-semibold text-[color:var(--text)]">{metric.format(value)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TopMarketsTable({ rows }: { rows: TradeXyzTopMarket[] }) {
  const maxVolume = Math.max(...rows.map((row) => row.volume), 1);

  if (rows.length === 0) {
    return (
      <section className="ui-card p-5 sm:p-6">
        <p className="eyebrow">Flowscan HIP-3</p>
        <h2 className="mt-1 text-[20px] font-semibold text-[color:var(--text)]">Top 10 Markets</h2>
        <p className="mt-4 text-[13px] font-medium text-[color:var(--text-mute)]">No market data is available.</p>
      </section>
    );
  }

  return (
    <section className="ui-card p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Flowscan HIP-3</p>
          <h2 className="mt-1 text-[20px] font-semibold text-[color:var(--text)]">Top 10 Markets</h2>
        </div>
        <p className="text-[12px] font-semibold text-[color:var(--text-mute)]">Sorted by cumulative volume</p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-[color:var(--text-dim)]">
              <th className="w-[72px] px-2 py-1 font-bold">Rank</th>
              <th className="px-2 py-1 font-bold">Market</th>
              <th className="px-2 py-1 font-bold">Volume</th>
              <th className="w-[120px] px-2 py-1 text-right font-bold">Traders</th>
              <th className="w-[140px] px-2 py-1 text-right font-bold">Open Interest</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const width = `${Math.max(4, (row.volume / maxVolume) * 100)}%`;

              return (
                <tr className="rounded-[6px] bg-[color:var(--surface-soft)] text-[13px]" key={`${row.rank}-${row.symbol}`}>
                  <td className="rounded-l-[6px] px-2 py-3">
                    <span className="num inline-grid h-7 w-7 place-items-center rounded-[6px] border border-[color:var(--line)] bg-white text-[12px] font-bold text-[color:var(--text)]">
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-[color:var(--text)]">{row.symbol}</p>
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-[color:var(--text-mute)]">{row.canonical}</p>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 min-w-[160px] flex-1 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-[#f5a000]" style={{ width }} />
                      </div>
                      <span className="num w-[92px] text-right text-[13px] font-semibold text-[color:var(--text)]">{formatUsd(row.volume)}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <span className="num font-semibold text-[color:var(--text)]">{formatInt(row.traders)}</span>
                  </td>
                  <td className="rounded-r-[6px] px-2 py-3 text-right">
                    <span className="num font-semibold text-[color:var(--text)]">{formatUsd(row.oi)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MarketShareChart({ rows }: { rows: TradeXyzHip3MarketShareRow[] }) {
  const [metricKey, setMetricKey] = useState<MarketShareMetric["key"]>("volumePct");
  const metric = MARKET_SHARE_METRICS.find((item) => item.key === metricKey) ?? MARKET_SHARE_METRICS[0];
  const chartRows = [...rows].sort((a, b) => b[metric.key] - a[metric.key]).slice(0, 8);
  const colors = ["#1e78ff", "#f5a000", "#13a88a", "#d64f7f", "#6c7a89", "#8b5cf6", "#0f9fca", "#a15c38"];
  const donutGradient = chartRows
    .reduce<{ cursor: number; segments: string[] }>(
      (acc, row, index) => {
        const start = acc.cursor;
        const end = start + row[metric.key];
        const color = row.isTradeXyz ? colors[0] : (colors[(index % (colors.length - 1)) + 1] ?? "#6c7a89");

        return {
          cursor: end,
          segments: [...acc.segments, `${color} ${start}% ${end}%`],
        };
      },
      { cursor: 0, segments: [] },
    )
    .segments.join(", ");

  if (chartRows.length === 0) {
    return (
      <section className="ui-card p-5 sm:p-6">
        <p className="eyebrow">Flowscan HIP-3</p>
        <h2 className="mt-1 text-[20px] font-semibold text-[color:var(--text)]">Market Share</h2>
        <p className="mt-4 text-[13px] font-medium text-[color:var(--text-mute)]">No market share data is available.</p>
      </section>
    );
  }

  return (
    <section className="ui-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Flowscan HIP-3</p>
          <h2 className="mt-1 text-[20px] font-semibold text-[color:var(--text)]">Market Share</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {MARKET_SHARE_METRICS.map((item) => (
            <button
              aria-pressed={item.key === metric.key}
              className={chartButtonClass(item.key === metric.key)}
              key={item.key}
              onClick={() => setMetricKey(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          {chartRows.map((row) => {
            const value = row[metric.key];
            const width = `${Math.max(2, Math.min(100, value))}%`;
            const name = dexDisplayName(row.dex);
            return (
              <div className="grid grid-cols-[96px_minmax(0,1fr)_64px] items-center gap-3 sm:grid-cols-[150px_minmax(0,1fr)_80px]" key={row.dex}>
                <p className={`truncate text-[13px] font-semibold ${row.isTradeXyz ? "text-[#1e78ff]" : "text-[color:var(--text)]"}`} title={name}>
                  {name}
                </p>
                <div className="h-8 overflow-hidden rounded-[6px] bg-[color:var(--surface-soft)]">
                  <div
                    className="h-full rounded-[6px] transition-[width]"
                    style={{
                      background: row.isTradeXyz ? "#1e78ff" : "#f5a000",
                      width,
                    }}
                  />
                </div>
                <p className="num text-right text-[13px] font-semibold text-[color:var(--text)]">{value.toFixed(value >= 10 ? 1 : 2)}%</p>
              </div>
            );
          })}
        </div>

        <div className="grid min-h-[220px] place-items-center">
          <div
            className="relative aspect-square w-full max-w-[220px] rounded-full border border-[color:var(--line)] p-4"
            style={{
              background: `conic-gradient(${donutGradient})`,
            }}
          >
            <div className="grid h-full w-full place-items-center rounded-full border border-white/80 bg-white/95 text-center">
              <div>
                <p className="eyebrow">trade XYZ</p>
                <p className="num mt-2 text-[30px] font-semibold text-[#1e78ff]">
                  {(chartRows.find((row) => row.isTradeXyz)?.[metric.key] ?? 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TradeXyzDashboard({ data, error }: { data: TradeXyzDashboardData | null; error?: string }) {
  if (!data) {
    return <ErrorState message={error ?? TRADE_XYZ_DASHBOARD_COPY.dataUnavailable} />;
  }

  return (
    <div className="space-y-4">
      <section className="ui-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Project detail</p>
            <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-[color:var(--text)] sm:text-[36px]">
              {TRADE_XYZ_DASHBOARD_COPY.displayName}
            </h1>
            <p className="mt-2 max-w-[720px] text-[13px] font-medium leading-6 text-[color:var(--text-mute)]">
              {TRADE_XYZ_DASHBOARD_COPY.summary}
            </p>
          </div>
          <RefreshCountdown cacheExpiresAt={data.cacheExpiresAt} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper={data.info.chain} label="24H Fees" value={formatUsd(data.info.currentFees24h)} />
        <MetricCard helper="Flowscan cumulative traders" label="Total Traders" value={formatInt(data.stats.totalTraders)} />
        <MetricCard helper="Flowscan HIP-3 perps" label="24H Perp Volume" value={formatUsd(data.info.currentPerpVolume24h)} />
        <MetricCard helper="Rolling perp volume" label="30D Volume" value={formatUsd(data.stats.volume30d)} />
      </section>

      <section className="ui-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">DefiLlama Fees + Flowscan Volume</p>
            <h2 className="mt-1 text-[20px] font-semibold text-[color:var(--text)]">Fees / Perp Volume</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="ui-button border-[#1e78ff] text-[#1e78ff]">Fees</span>
            <span className="ui-button border-[#f5a000] text-[#a96800]">Perp Volume</span>
          </div>
        </div>
        <div className="mt-4">
          <FeesVolumeChart feePoints={data.feeHistory} volumePoints={data.perpVolumeHistory} />
        </div>
      </section>

      <TopMarketsTable rows={data.topMarkets} />

      <Hip3DexComparisonChart rows={data.hip3DexComparison} />

      <MarketShareChart rows={data.hip3MarketShare} />

      <p className="text-[11px] font-medium text-[color:var(--text-dim)]">数据来源：{data.source}。更新时间：{new Date(data.updatedAt).toLocaleString("en-US")}。</p>
    </div>
  );
}
