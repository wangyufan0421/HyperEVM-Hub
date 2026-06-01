export const HYPE_RANGES = ["15m", "1h", "1D"] as const;

export type HypeRange = (typeof HYPE_RANGES)[number];

export type HypeRangeConfig = {
  interval: "15m" | "1h" | "1d" | "1M";
  lookbackMs: number;
};

export type HyperliquidCandle = {
  t: number;
  T: number;
  s: string;
  i: string;
  o: string;
  c: string;
  h: string;
  l: string;
  v: string;
  n: number;
};

export type HypeCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const RANGE_CONFIGS: Record<HypeRange, HypeRangeConfig> = {
  "15m": {
    interval: "15m",
    lookbackMs: 3 * 24 * 60 * 60 * 1000,
  },
  "1h": {
    interval: "1h",
    lookbackMs: 14 * 24 * 60 * 60 * 1000,
  },
  "1D": {
    interval: "1d",
    lookbackMs: 180 * 24 * 60 * 60 * 1000,
  },
};

export function isHypeRange(value: string | null): value is HypeRange {
  return HYPE_RANGES.includes(value as HypeRange);
}

export function getHypeRangeConfig(range: HypeRange): HypeRangeConfig {
  return RANGE_CONFIGS[range];
}

export function normalizeHyperliquidCandles(candles: HyperliquidCandle[]): HypeCandle[] {
  return candles
    .map((candle) => ({
      time: Math.floor(candle.t / 1000),
      open: Number(candle.o),
      high: Number(candle.h),
      low: Number(candle.l),
      close: Number(candle.c),
      volume: Number(candle.v),
    }))
    .filter((candle) =>
      [candle.time, candle.open, candle.high, candle.low, candle.close, candle.volume].every(Number.isFinite),
    );
}

export function getCandleStats(candles: HypeCandle[]) {
  if (candles.length === 0) {
    return {
      high: null,
      low: null,
      volume: null,
      changePercent: null,
    };
  }

  const first = candles[0];
  const last = candles[candles.length - 1];
  const high = Math.max(...candles.map((candle) => candle.high));
  const low = Math.min(...candles.map((candle) => candle.low));
  const volume = candles.reduce((total, candle) => total + candle.volume, 0);
  const changePercent = first.open === 0 ? null : ((last.close - first.open) / first.open) * 100;

  return {
    high,
    low,
    volume,
    changePercent,
  };
}
