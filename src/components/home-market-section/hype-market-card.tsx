"use client";

import { formatHypeCandleTooltip, HYPE_RANGES, type HypeCandle, type HypeRange } from "@/lib/hype-market";
import type { HypeMarketData } from "@/lib/hype-market-service";
import Script from "next/script";
import { useState } from "react";

function formatUsd(value: number | null | undefined, digits = 3) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "--";
  }

  return `$${value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })}`;
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "--";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatCompact(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "--";
  }

  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function livePriceScript(initialPrice: number | null) {
  return `
(() => {
  const priceNode = document.getElementById("hype-live-price");
  if (!priceNode || priceNode.__hypeLiveStarted) return;
  priceNode.__hypeLiveStarted = true;

  const formatUsd = (value) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "--";
    return "$" + value.toLocaleString("en-US", {
      maximumFractionDigits: 3,
      minimumFractionDigits: 3
    });
  };

  let lastPrice = ${JSON.stringify(initialPrice)};
  if (typeof lastPrice === "number") priceNode.textContent = formatUsd(lastPrice);

  const loadPrice = async () => {
    try {
      const response = await fetch("/api/market/hype/price", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      if (typeof data.price === "number") {
        lastPrice = data.price;
        priceNode.textContent = formatUsd(data.price);
      }
    } catch {}
  };

  loadPrice();
  window.setInterval(loadPrice, 1000);
})();
`;
}

function rangeHref(range: HypeRange) {
  return `/?hypeRange=${encodeURIComponent(range)}#market-overview`;
}

function TrendChart({ candles }: { candles: HypeCandle[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (candles.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] font-semibold text-[color:var(--text-mute)]">
        No HYPE trend data available.
      </div>
    );
  }

  const pointsSource = candles.map((candle) => candle.close);
  const width = 720;
  const height = 250;
  const padding = { top: 14, right: 14, bottom: 26, left: 14 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const high = Math.max(...pointsSource);
  const low = Math.min(...pointsSource);
  const span = Math.max(high - low, 0.0001);
  const points = pointsSource.map((value, index) => {
    const x = padding.left + (pointsSource.length <= 1 ? 0 : (index / (pointsSource.length - 1)) * innerWidth);
    const y = padding.top + innerHeight - ((value - low) / span) * innerHeight;
    return { candle: candles[index], x, y, value };
  });
  const line = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const area =
    points.length > 0
      ? `M ${points[0].x.toFixed(2)} ${padding.top + innerHeight} L ${line} L ${points[points.length - 1].x.toFixed(2)} ${padding.top + innerHeight} Z`
      : "";
  const latest = points[points.length - 1];
  const active = activeIndex === null ? null : points[activeIndex];
  const tooltip = active?.candle ? formatHypeCandleTooltip(active.candle) : null;
  const tooltipWidth = 210;
  const tooltipHeight = 62;
  const tooltipX = active ? Math.min(Math.max(active.x - tooltipWidth / 2, 8), width - tooltipWidth - 8) : 0;
  const tooltipY = active ? Math.max(8, active.y - tooltipHeight - 14) : 0;
  const hitWidth = Math.max(8, innerWidth / Math.max(points.length, 1));

  return (
    <svg aria-label="HYPE trend line chart" className="h-full w-full overflow-visible" onMouseLeave={() => setActiveIndex(null)} preserveAspectRatio="none" role="img" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="hype-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(21,191,169,0.24)" />
          <stop offset="100%" stopColor="rgba(21,191,169,0)" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((tick) => {
        const y = padding.top + tick * innerHeight;
        return <line key={tick} stroke="rgba(8,54,49,0.10)" strokeDasharray="4 8" strokeWidth="1" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />;
      })}
      <path d={area} fill="url(#hype-area)" />
      <polyline fill="none" points={line} stroke="var(--mint)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
      {latest ? <circle cx={latest.x} cy={latest.y} fill="white" r="4" stroke="var(--mint)" strokeWidth="2.2" /> : null}
      {active && tooltip ? (
        <g pointerEvents="none">
          <line stroke="rgba(8,54,49,0.18)" strokeDasharray="4 6" strokeWidth="1.2" x1={active.x} x2={active.x} y1={padding.top} y2={padding.top + innerHeight} />
          <circle cx={active.x} cy={active.y} fill="#062d29" r="4.5" stroke="var(--mint)" strokeWidth="2.4" />
          <rect fill="#062d29" height={tooltipHeight} opacity="0.96" rx="9" width={tooltipWidth} x={tooltipX} y={tooltipY} />
          <text fill="#b8efe4" fontFamily="monospace" fontSize="13" fontWeight="800" x={tooltipX + 14} y={tooltipY + 23}>
            {tooltip.date}
          </text>
          <text fill="#ffffff" fontFamily="monospace" fontSize="17" fontWeight="900" x={tooltipX + 14} y={tooltipY + 47}>
            {tooltip.price}
          </text>
        </g>
      ) : null}
      {points.map((point, index) => (
        <rect
          fill="transparent"
          height={innerHeight}
          key={`hype-hover-${point.candle?.time ?? index}`}
          onMouseEnter={() => setActiveIndex(index)}
          width={hitWidth}
          x={point.x - hitWidth / 2}
          y={padding.top}
        />
      ))}
    </svg>
  );
}

export function HypeMarketCard({
  initialData,
  selectedRange,
}: {
  initialData: HypeMarketData | null;
  selectedRange: HypeRange;
}) {
  const stats = initialData?.stats ?? null;
  const isPositive = (stats?.changePercent ?? 0) >= 0;

  return (
    <section className="ui-card min-h-[390px] overflow-hidden p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">$HYPE market</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="num text-[34px] font-semibold leading-none tracking-[-0.02em] text-[color:var(--text)]">
              <span id="hype-live-price" suppressHydrationWarning>
                {formatUsd(initialData?.price ?? null)}
              </span>
            </h2>
            <Script id="hype-live-price-updater" strategy="afterInteractive">
              {livePriceScript(initialData?.price ?? null)}
            </Script>
            <span
              className={`rounded-[7px] border px-2.5 py-1 text-[12px] font-semibold ${
                isPositive
                  ? "border-emerald-300/70 bg-emerald-50 text-emerald-700"
                  : "border-red-300/70 bg-red-50 text-red-600"
              }`}
            >
              {formatPercent(stats?.changePercent)} · {selectedRange}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[12px] font-semibold text-[color:var(--text-mute)]">
            <span>High <span className="num">{formatUsd(stats?.high)}</span></span>
            <span>Low <span className="num">{formatUsd(stats?.low)}</span></span>
            <span>Vol <span className="num">{formatCompact(stats?.volume)}</span></span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {HYPE_RANGES.map((range) => (
            <a
              key={range}
              className={`ui-button h-8 min-w-12 px-3 text-[12px] ${selectedRange === range ? "ui-button-active" : ""}`}
              href={rangeHref(range)}
            >
              {range}
            </a>
          ))}
        </div>
      </div>

      <div className="mt-5 h-[250px] rounded-[10px] border border-[color:var(--line)] bg-white/45 p-3">
        <TrendChart candles={initialData?.candles ?? []} />
      </div>
    </section>
  );
}
