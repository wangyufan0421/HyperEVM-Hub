import {
  getCandleStats,
  getHypeRangeConfig,
  normalizeHyperliquidCandles,
  type HypeRange,
  type HyperliquidCandle,
} from "./hype-market";

const HYPERLIQUID_INFO_URL = "https://api.hyperliquid.xyz/info";

export type HypeMarketData = {
  range: HypeRange;
  interval: string;
  price: number | null;
  candles: ReturnType<typeof normalizeHyperliquidCandles>;
  stats: ReturnType<typeof getCandleStats>;
  updatedAt: string;
};

async function postHyperliquidInfo<T>(body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(HYPERLIQUID_INFO_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Hyperliquid API responded with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getHypeMarketData(range: HypeRange, signal?: AbortSignal): Promise<HypeMarketData> {
  const config = getHypeRangeConfig(range);
  const now = Date.now();
  const startTime = now - config.lookbackMs;
  const [mids, rawCandles] = await Promise.all([
    postHyperliquidInfo<Record<string, string>>({ type: "allMids" }, signal),
    postHyperliquidInfo<HyperliquidCandle[]>(
      {
        type: "candleSnapshot",
        req: {
          coin: "HYPE",
          interval: config.interval,
          startTime,
          endTime: now,
        },
      },
      signal,
    ),
  ]);

  const candles = normalizeHyperliquidCandles(rawCandles);
  const price = Number(mids.HYPE);

  return {
    range,
    interval: config.interval,
    price: Number.isFinite(price) ? price : null,
    candles,
    stats: getCandleStats(candles),
    updatedAt: new Date().toISOString(),
  };
}

export async function getHypePrice(signal?: AbortSignal) {
  const mids = await postHyperliquidInfo<Record<string, string>>({ type: "allMids" }, signal);
  const price = Number(mids.HYPE);

  return {
    price: Number.isFinite(price) ? price : null,
    updatedAt: new Date().toISOString(),
  };
}
