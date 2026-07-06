"use client";

import { RefreshCountdown } from "@/components/dashboard/refresh-countdown";
import type { LiminalDashboardData, LiminalSplitTvlPoint, LiminalTokenRow } from "@/lib/liminal";
import { useState } from "react";

type ChartTooltip = {
  lines: string[];
  x: number;
  y: number;
};

const LIMINAL_COPY = {
  dataUnavailable: "Liminal dashboard data is unavailable right now.",
  displayName: "Liminal",
  errorHeading: "Unable to load Liminal",
  loadError: "Unable to load Liminal dashboard data",
  summary: "Tokenized yield-bearing assets on Hyperliquid, sourced from DefiLlama and Liminal's public tokenized API.",
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

function formatInteger(value: number | null, compact = false) {
  if (value === null || !Number.isFinite(value)) return "--";
  return Intl.NumberFormat("en-US", {
    compactDisplay: "short",
    maximumFractionDigits: compact ? 2 : 0,
    notation: compact ? "compact" : "standard",
  }).format(value);
}

function formatLeverage(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "--";
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}x`;
}

function formatDate(value: number) {
  return new Date(value * 1000).toLocaleDateString("en-US", { day: "2-digit", month: "short", timeZone: "UTC" });
}

function shortAddress(value: string) {
  if (!value) return "--";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
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
      <p className="eyebrow">{LIMINAL_COPY.displayName}</p>
      <h2 className="mt-2 text-[24px] font-semibold text-[color:var(--text)]">{LIMINAL_COPY.errorHeading}</h2>
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

function SplitTvlChart({ points }: { points: LiminalSplitTvlPoint[] }) {
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);
  const width = 980;
  const height = 360;
  const padding = { bottom: 38, left: 64, right: 28, top: 18 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const chartPoints = points.slice(-460);
  const minDate = chartPoints[0]?.date ?? 0;
  const maxDate = chartPoints.at(-1)?.date ?? minDate;
  const maxTvl = Math.max(...chartPoints.map((point) => point.totalTvl), 1) * 1.08;
  const xForDate = (date: number) => padding.left + (maxDate === minDate ? innerWidth / 2 : ((date - minDate) / (maxDate - minDate)) * innerWidth);
  const yForTvl = (value: number) => padding.top + innerHeight - (value / maxTvl) * innerHeight;
  const positionedPoints = chartPoints.map((point) => ({
    ...point,
    totalY: yForTvl(point.totalTvl),
    tokenizedY: yForTvl(point.tokenizedTvl),
    x: xForDate(point.date),
  }));
  const tokenizedLine = positionedPoints.map((point) => `${point.x.toFixed(2)},${point.tokenizedY.toFixed(2)}`).join(" ");
  const totalLine = positionedPoints.map((point) => `${point.x.toFixed(2)},${point.totalY.toFixed(2)}`).join(" ");
  const tokenizedArea =
    positionedPoints.length > 0 ? `${positionedPoints[0].x.toFixed(2)},${height - padding.bottom} ${tokenizedLine} ${positionedPoints[positionedPoints.length - 1].x.toFixed(2)},${height - padding.bottom}` : "";
  const customizedArea =
    positionedPoints.length > 0
      ? `${totalLine} ${positionedPoints
          .slice()
          .reverse()
          .map((point) => `${point.x.toFixed(2)},${point.tokenizedY.toFixed(2)}`)
          .join(" ")}`
      : "";
  const labelIndexes = [0, Math.floor((chartPoints.length - 1) / 4), Math.floor((chartPoints.length - 1) / 2), Math.floor(((chartPoints.length - 1) * 3) / 4), chartPoints.length - 1].filter(
    (index, offset, list) => index >= 0 && list.indexOf(index) === offset,
  );
  const latest = chartPoints.at(-1);

  return (
    <section className="ui-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Liminal TVL</p>
          <h2 className="mt-1 text-[20px] font-semibold text-[color:var(--text)]">TVL {"\u00b7"} Tokenized vs Customized</h2>
        </div>
        <div className="flex flex-wrap gap-4 text-[12px] font-semibold text-[color:var(--text-dim)]">
          <span>
            Tokenized: <span className="num text-[#a96800]">{formatUsd(latest?.tokenizedTvl ?? null)}</span>
          </span>
          <span>
            Customized: <span className="num text-[#1e78ff]">{formatUsd(latest?.customizedTvl ?? null)}</span>
          </span>
        </div>
      </div>
      <div className="mt-4">
        <svg aria-label="Liminal tokenized and customized TVL chart" className="h-[360px] w-full overflow-visible" role="img" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="liminal-tokenized-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f5a000" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#f5a000" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="liminal-customized-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#1e78ff" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#1e78ff" stopOpacity="0.03" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const y = padding.top + tick * innerHeight;
            const tvlValue = maxTvl - tick * maxTvl;
            return (
              <g key={tick}>
                <line stroke="#dceee8" strokeDasharray="4 8" strokeWidth="1" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
                <text fill="#87918e" fontSize="11" fontWeight="700" x="0" y={y + 4}>
                  {formatUsd(tvlValue, 0)}
                </text>
              </g>
            );
          })}
          {customizedArea ? <polygon fill="url(#liminal-customized-fill)" points={customizedArea} /> : null}
          {tokenizedArea ? <polygon fill="url(#liminal-tokenized-fill)" points={tokenizedArea} /> : null}
          {tokenizedLine ? <polyline fill="none" points={tokenizedLine} stroke="#f5a000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" /> : null}
          {totalLine ? <polyline fill="none" points={totalLine} stroke="#1e78ff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" /> : null}
          {positionedPoints.map((chartPoint) => (
            <rect
              fill="transparent"
              height={innerHeight}
              key={`hover-${chartPoint.date}`}
              onMouseEnter={() =>
                setTooltip({
                  lines: [
                    formatDate(chartPoint.date),
                    `Tokenized ${formatUsd(chartPoint.tokenizedTvl)}`,
                    `Customized ${formatUsd(chartPoint.customizedTvl)}`,
                    `Total ${formatUsd(chartPoint.totalTvl)}`,
                  ],
                  x: chartPoint.x,
                  y: padding.top + innerHeight / 2,
                })
              }
              onMouseLeave={() => setTooltip(null)}
              width="8"
              x={chartPoint.x - 4}
              y={padding.top}
            />
          ))}
          {positionedPoints.length > 0 ? (
            <circle cx={positionedPoints[positionedPoints.length - 1].x} cy={positionedPoints[positionedPoints.length - 1].totalY} fill="#062d29" r="4" stroke="#8dbdff" strokeWidth="3" />
          ) : null}
          {labelIndexes.map((index) => (
            <text
              fill="#667d78"
              fontSize="11"
              fontWeight="700"
              key={`${chartPoints[index]?.date}-label`}
              textAnchor={index === chartPoints.length - 1 ? "end" : "middle"}
              x={xForDate(chartPoints[index]?.date ?? 0)}
              y={height - 8}
            >
              {formatDate(chartPoints[index]?.date ?? 0)}
            </text>
          ))}
          <SvgTooltip tooltip={tooltip} width={width} />
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-[12px] font-medium text-[color:var(--text-mute)]">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f5a000]" />
          Tokenized (xTokens)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#1e78ff]" />
          Customized (user delta-neutral)
        </span>
      </div>
    </section>
  );
}

function TokenTable({ rows }: { rows: LiminalTokenRow[] }) {
  return (
    <section className="ui-card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--line)] p-5 sm:p-6">
        <div>
          <p className="eyebrow">Liminal Tokenized</p>
          <h2 className="mt-1 text-[20px] font-semibold text-[color:var(--text)]">limUSD and xToken Details</h2>
        </div>
        <span className="ui-button">4 Products</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[color:var(--line)] bg-[color:var(--surface-soft)] text-[11px] font-semibold uppercase text-[color:var(--text-dim)]">
              <th className="px-5 py-3">Token</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3 text-right">Leverage</th>
              <th className="px-5 py-3 text-right">3D APY</th>
              <th className="px-5 py-3 text-right">7D APY</th>
              <th className="px-5 py-3 text-right">30D APY</th>
              <th className="px-5 py-3">Deposit Assets</th>
              <th className="px-5 py-3">Chains</th>
              <th className="px-5 py-3">Share Manager</th>
              <th className="px-5 py-3">NAV Oracle</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-[color:var(--line)] text-[13px] font-medium text-[color:var(--text-soft)] last:border-b-0 hover:bg-white/72" key={row.name}>
                <td className="px-5 py-4">
                  <div>
                    <p className="text-[14px] font-semibold text-[color:var(--text)]">{row.name}</p>
                    <p className="mt-1 text-[12px] text-[color:var(--text-mute)]">{row.shareSymbols.join(", ") || "--"}</p>
                  </div>
                </td>
                <td className="px-5 py-4">{row.vaultType}</td>
                <td className="num px-5 py-4 text-right font-semibold text-[color:var(--text)]">{formatLeverage(row.leverage)}</td>
                <td className="num px-5 py-4 text-right font-semibold text-[color:var(--text)]">{formatPercent(row.trailing3dApy)}</td>
                <td className="num px-5 py-4 text-right font-semibold text-[color:var(--text)]">{formatPercent(row.trailing7dApy)}</td>
                <td className="num px-5 py-4 text-right font-semibold text-[color:var(--text)]">{formatPercent(row.trailing30dApy)}</td>
                <td className="px-5 py-4">{row.depositAssets.join(", ") || "--"}</td>
                <td className="px-5 py-4">{row.chains.join(", ") || "--"}</td>
                <td className="num px-5 py-4">{shortAddress(row.shareManagerAddress)}</td>
                <td className="num px-5 py-4">{shortAddress(row.navOracleAddress)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function LiminalDashboard({ data, error }: { data: LiminalDashboardData | null; error?: string }) {
  if (!data) {
    return <ErrorState message={error ?? LIMINAL_COPY.dataUnavailable} />;
  }

  const limUsd = data.tokens.find((token) => token.name.toLowerCase() === "limusd");

  return (
    <div className="space-y-4">
      <section className="ui-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Project detail</p>
            <h1 className="mt-2 text-[30px] font-semibold leading-tight text-[color:var(--text)] sm:text-[36px]">{LIMINAL_COPY.displayName}</h1>
            <p className="mt-2 max-w-[760px] text-[13px] font-medium leading-6 text-[color:var(--text-mute)]">{data.info.description || LIMINAL_COPY.summary}</p>
          </div>
          <RefreshCountdown cacheExpiresAt={data.cacheExpiresAt} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper={data.info.chain} label="Parent TVL" value={formatUsd(data.info.currentTvl)} />
        <MetricCard helper={`${formatPercent(data.stats.tvl30dChangePct)} vs 30D ago`} label="30D TVL" value={formatUsd(data.stats.tvl30dChangeUsd)} />
        <MetricCard helper="Liminal unique depositors API" label="Depositors" value={formatInteger(data.stats.depositorsCurrent)} />
        <MetricCard helper="limUSD trailing 30D APY" label="limUSD APY" value={formatPercent(limUsd?.trailing30dApy ?? null)} />
      </section>

      <SplitTvlChart points={data.splitTvlHistory} />

      <TokenTable rows={data.tokens} />

      <p className="text-[11px] font-medium text-[color:var(--text-dim)]">数据来源：{data.source}。更新时间：{new Date(data.updatedAt).toLocaleString("en-US")}。</p>
    </div>
  );
}
