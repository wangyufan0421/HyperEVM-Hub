import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatHypeCandleTooltip, getHypeRangeConfig, normalizeHyperliquidCandles } from "./hype-market";

describe("getHypeRangeConfig", () => {
  it("maps homepage range buttons to Hyperliquid intervals and lookback windows", () => {
    assert.deepEqual(getHypeRangeConfig("15m"), {
      interval: "15m",
      lookbackMs: 3 * 24 * 60 * 60 * 1000,
    });
    assert.deepEqual(getHypeRangeConfig("1h"), {
      interval: "1h",
      lookbackMs: 14 * 24 * 60 * 60 * 1000,
    });
    assert.deepEqual(getHypeRangeConfig("1D"), {
      interval: "1d",
      lookbackMs: 180 * 24 * 60 * 60 * 1000,
    });
  });
});

describe("normalizeHyperliquidCandles", () => {
  it("converts Hyperliquid candle strings into chart-ready numbers", () => {
    const candles = normalizeHyperliquidCandles([
      {
        t: 1_779_631_200_000,
        T: 1_779_634_799_999,
        s: "HYPE",
        i: "1h",
        o: "63.083",
        c: "62.802",
        h: "63.531",
        l: "61.556",
        v: "1257812.34",
        n: 38144,
      },
    ]);

    assert.deepEqual(candles, [
      {
        time: 1_779_631_200,
        open: 63.083,
        high: 63.531,
        low: 61.556,
        close: 62.802,
        volume: 1_257_812.34,
      },
    ]);
  });
});

describe("formatHypeCandleTooltip", () => {
  it("formats a candle date and close price for chart hover", () => {
    assert.deepEqual(
      formatHypeCandleTooltip({
        time: 1_779_631_200,
        open: 63.083,
        high: 63.531,
        low: 61.556,
        close: 62.802,
        volume: 1_257_812.34,
      }),
      {
        date: "May 24, 2026, 14:00 UTC",
        price: "$62.802",
      },
    );
  });
});
