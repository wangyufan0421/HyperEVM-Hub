import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildHypeFundingDashboardData } from "./hype-funding";

describe("buildHypeFundingDashboardData", () => {
  it("normalizes HYPE funding history, venue comparison, and current context", () => {
    const data = buildHypeFundingDashboardData({
      fetchedAt: new Date("2026-06-29T00:00:00.000Z"),
      fundingHistory: [
        { coin: "BTC", fundingRate: "0.2", premium: "0", time: 10 },
        { coin: "HYPE", fundingRate: "0.00001", premium: "-0.0002", time: 2 },
        { coin: "HYPE", fundingRate: "-0.00002", premium: "0.0001", time: 1 },
      ],
      metaAndAssetCtxs: [
        {
          universe: [{ name: "BTC" }, { name: "HYPE" }],
        },
        [
          { funding: "0.0001", markPx: "100" },
          {
            dayNtlVlm: "1200000",
            funding: "0.0000125",
            markPx: "40.12",
            openInterest: "12345",
            oraclePx: "40.10",
            premium: "-0.00005",
          },
        ],
      ],
      predictedFundings: [
        ["BTC", [["HlPerp", { fundingRate: "0.1", fundingIntervalHours: 1, nextFundingTime: 1 }]]],
        [
          "HYPE",
          [
            ["HlPerp", { fundingRate: "0.0000125", fundingIntervalHours: 1, nextFundingTime: 100 }],
            ["BinPerp", { fundingRate: "0.00008", fundingIntervalHours: 8, nextFundingTime: 200 }],
            ["BybitPerp", null],
          ],
        ],
      ],
    });

    assert.equal(data.history.length, 2);
    assert.deepEqual(
      data.history.map((row) => row.time),
      [1, 2],
    );
    assert.equal(data.current.markPrice, 40.12);
    assert.equal(data.current.openInterest, 12345);
    assert.equal(data.current.annualizedPct?.toFixed(2), "10.95");
    assert.equal(data.stats.lowestFundingRate, -0.00002);
    assert.equal(data.stats.highestFundingRate, 0.00001);
    assert.deepEqual(
      data.venues.map((row) => row.venue),
      ["Hyperliquid", "Binance", "Bybit"],
    );
    assert.equal(data.venues[0].annualizedPct?.toFixed(2), "10.95");
    assert.equal(data.venues[2].fundingRate, null);
    assert.equal(data.venues[2].annualizedPct, null);
  });
});
