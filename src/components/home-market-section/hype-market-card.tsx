import { HYPE_RANGES, type HypeCandle, type HypeRange } from "@/lib/hype-market";
import type { HypeMarketData } from "@/lib/hype-market-service";
import Script from "next/script";

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

function draggableChartScript() {
  return `
(() => {
  const scroller = document.getElementById("hype-candle-scroll");
  if (!scroller || scroller.__hypeDragReady) return;
  scroller.__hypeDragReady = true;

  const scrollToLatest = () => {
    scroller.scrollLeft = scroller.scrollWidth - scroller.clientWidth;
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scrollToLatest, { once: true });
  } else {
    scrollToLatest();
  }

  let isDragging = false;
  let startX = 0;
  let startScrollLeft = 0;

  scroller.addEventListener("pointerdown", (event) => {
    isDragging = true;
    startX = event.clientX;
    startScrollLeft = scroller.scrollLeft;
    scroller.classList.add("is-dragging");
    scroller.setPointerCapture?.(event.pointerId);
  });

  scroller.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    event.preventDefault();
    scroller.scrollLeft = startScrollLeft - (event.clientX - startX);
  });

  const stopDrag = (event) => {
    if (!isDragging) return;
    isDragging = false;
    scroller.classList.remove("is-dragging");
    scroller.releasePointerCapture?.(event.pointerId);
  };

  scroller.addEventListener("pointerup", stopDrag);
  scroller.addEventListener("pointercancel", stopDrag);
  scroller.addEventListener("pointerleave", stopDrag);
})();
`;
}

function rangeHref(range: HypeRange) {
  return `/?hypeRange=${encodeURIComponent(range)}#market-overview`;
}

function formatClockLabel(date: Date) {
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDayLabel(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatMonthLabel(date: Date) {
  return `${date.getMonth() + 1}月`;
}

function formatYearLabel(date: Date) {
  return String(date.getFullYear());
}

function formatTimeAxisLabel(timestamp: number, range: HypeRange, previousTimestamp?: number) {
  const date = new Date(timestamp * 1000);
  const previousDate = typeof previousTimestamp === "number" ? new Date(previousTimestamp * 1000) : null;
  const isNewDay =
    !previousDate ||
    date.getFullYear() !== previousDate.getFullYear() ||
    date.getMonth() !== previousDate.getMonth() ||
    date.getDate() !== previousDate.getDate();
  const isNewMonth =
    !previousDate || date.getFullYear() !== previousDate.getFullYear() || date.getMonth() !== previousDate.getMonth();
  const isNewYear = !previousDate || date.getFullYear() !== previousDate.getFullYear();

  if (range === "15m" || range === "1h") {
    return isNewDay ? formatDayLabel(date) : formatClockLabel(date);
  }

  if (range === "1D") {
    return isNewMonth ? formatMonthLabel(date) : formatDayLabel(date);
  }

  return isNewYear ? formatYearLabel(date) : formatMonthLabel(date);
}

function shouldShowTimeAxisTick(candle: HypeCandle, index: number, range: HypeRange) {
  const date = new Date(candle.time * 1000);
  const minute = date.getMinutes();
  const hour = date.getHours();
  const day = date.getDate();
  const month = date.getMonth();

  if (index === 0) {
    return true;
  }

  if (range === "15m") {
    return minute === 0 && hour % 3 === 0;
  }

  if (range === "1h") {
    return hour === 0 || hour === 12;
  }

  if (range === "1D") {
    return day === 1 || day === 15;
  }

  return month === 0 || month === 3 || month === 6 || month === 9;
}

function CandleChart({ candles, selectedRange }: { candles: HypeCandle[]; selectedRange: HypeRange }) {
  if (candles.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] font-black text-[#5f7d77]">
        No HYPE candle data available.
      </div>
    );
  }

  const candleSpacingByRange: Record<HypeRange, number> = {
    "15m": 8,
    "1h": 7,
    "1D": 8,
  };
  const minWidthByRange: Record<HypeRange, number> = {
    "15m": 900,
    "1h": 900,
    "1D": 900,
  };
  const minWidth = minWidthByRange[selectedRange];
  const candleSpacing = candleSpacingByRange[selectedRange];
  const width = Math.max(minWidth, Math.round(candles.length * candleSpacing + 120));
  const height = 330;
  const padding = { top: 18, right: 58, bottom: 34, left: 18 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const high = Math.max(...candles.map((candle) => candle.high));
  const low = Math.min(...candles.map((candle) => candle.low));
  const span = Math.max(high - low, 0.0001);
  const xStep = plotWidth / Math.max(candles.length - 1, 1);
  const bodyWidth = Math.max(3, Math.min(8, xStep * 0.72));
  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const xFor = (index: number) => padding.left + index * xStep;
  const yFor = (price: number) => padding.top + ((high - price) / span) * plotHeight;
  const formatAxis = (value: number) => value.toFixed(value >= 100 ? 1 : 2);
  const timeTicks = candles
    .map((candle, candleIndex) => ({ candle, candleIndex }))
    .filter(({ candle, candleIndex }) => shouldShowTimeAxisTick(candle, candleIndex, selectedRange))
    .map(({ candle, candleIndex }, tickIndex, ticks) => ({
      candleIndex,
      label: formatTimeAxisLabel(candle.time, selectedRange, ticks[tickIndex - 1]?.candle.time),
      x: xFor(candleIndex),
    }));

  return (
    <>
      <div
        className="h-full cursor-grab overflow-x-auto overflow-y-hidden select-none [-ms-overflow-style:none] [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
        id="hype-candle-scroll"
      >
        <svg
          aria-label="HYPE candlestick chart"
          className="h-full max-w-none"
          preserveAspectRatio="none"
          role="img"
          style={{ width }}
          viewBox={`0 0 ${width} ${height}`}
        >
          <rect fill="#ecfbf7" height={height} width={width} />
          {gridLines.map((ratio) => {
            const y = padding.top + ratio * plotHeight;
            const value = high - ratio * span;

            return (
              <g key={ratio}>
                <line
                  stroke="rgba(20,92,82,0.13)"
                  strokeWidth="1"
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                />
                <text
                  fill="#54746e"
                  fontFamily="monospace"
                  fontSize="12"
                  fontWeight="700"
                  x={width - padding.right + 12}
                  y={y + 4}
                >
                  {formatAxis(value)}
                </text>
              </g>
            );
          })}

          {candles.map((candle, index) => {
            const x = xFor(index);
            const openY = yFor(candle.open);
            const closeY = yFor(candle.close);
            const highY = yFor(candle.high);
            const lowY = yFor(candle.low);
            const isUp = candle.close >= candle.open;
            const color = isUp ? "#00bfae" : "#ef514c";
            const bodyY = Math.min(openY, closeY);
            const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));

            return (
              <g key={`${candle.time}-${index}`}>
                <line stroke={color} strokeLinecap="round" strokeWidth="1.6" x1={x} x2={x} y1={highY} y2={lowY} />
                <rect fill={color} height={bodyHeight} rx="0.8" width={bodyWidth} x={x - bodyWidth / 2} y={bodyY} />
              </g>
            );
          })}

          <line
            stroke="rgba(20,92,82,0.18)"
            strokeWidth="1"
            x1={padding.left}
            x2={width - padding.right}
            y1={height - padding.bottom + 8}
            y2={height - padding.bottom + 8}
          />
          {timeTicks.map((tick, index) => (
            <g key={`${tick.candleIndex}-${tick.label}`}>
              <line
                stroke="rgba(20,92,82,0.24)"
                strokeWidth="1"
                x1={tick.x}
                x2={tick.x}
                y1={height - padding.bottom + 8}
                y2={height - padding.bottom + 13}
              />
              <text
                fill="#4d716b"
                fontFamily="monospace"
                fontSize="12"
                fontWeight="800"
                textAnchor={index === 0 ? "start" : index === timeTicks.length - 1 ? "end" : "middle"}
                x={tick.x}
                y={height - 9}
              >
                {tick.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <Script id="hype-candle-drag" strategy="afterInteractive">
        {draggableChartScript()}
      </Script>
    </>
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
    <section className="min-h-[420px] overflow-hidden rounded-[8px] border border-[#0e3f3a24] bg-[#f1fffb]/88 text-[#063934] shadow-[0_18px_50px_rgba(7,43,40,0.10)] backdrop-blur-md">
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-black uppercase tracking-normal text-[#0a8f7d]">$HYPE</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h2 className="font-mono text-[34px] font-black leading-none tracking-normal text-[#062d29]">
                <span id="hype-live-price" suppressHydrationWarning>
                  {formatUsd(initialData?.price ?? null)}
                </span>
              </h2>
              <Script id="hype-live-price-updater" strategy="afterInteractive">
                {livePriceScript(initialData?.price ?? null)}
              </Script>
              <span
                className={`rounded-[4px] border px-2.5 py-1 text-[12px] font-black ${
                  isPositive
                    ? "border-[#00bfae44] bg-[#dcfff7] text-[#007e72]"
                    : "border-[#ef514c44] bg-[#fff0ee] text-[#c93131]"
                }`}
              >
                {formatPercent(stats?.changePercent)} · {selectedRange}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 font-mono text-[12px] font-bold text-[#58726d]">
              <span>High {formatUsd(stats?.high)}</span>
              <span>Low {formatUsd(stats?.low)}</span>
              <span>Vol {formatCompact(stats?.volume)}</span>
            </div>
          </div>

        </div>

        <div className="flex flex-wrap gap-1.5">
          {HYPE_RANGES.map((range) => (
            <a
              key={range}
              className={`inline-flex h-8 min-w-12 items-center justify-center rounded-[4px] border px-3 text-[12px] font-black transition ${
                selectedRange === range
                  ? "border-[#0a8f7d66] bg-[#0a6f64] text-white shadow-[0_8px_20px_rgba(10,111,100,0.18)]"
                  : "border-[#0e3f3a24] bg-white/72 text-[#4f6f69] hover:border-[#0a8f7d55] hover:text-[#063934]"
              }`}
              href={rangeHref(range)}
            >
              {range}
            </a>
          ))}
        </div>
      </div>

      <div className="relative h-[300px] px-2 pb-4 sm:h-[330px] sm:px-5">
        <CandleChart candles={initialData?.candles ?? []} selectedRange={selectedRange} />
      </div>
    </section>
  );
}
