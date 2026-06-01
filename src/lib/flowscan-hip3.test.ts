import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildHip3DashboardData } from "./flowscan-hip3";

describe("buildHip3DashboardData", () => {
  it("normalizes Flowscan HIP-3 payloads for the dashboard", () => {
    const data = buildHip3DashboardData(
      {
        overview: {
          total_volume: 1000,
          total_trades: 50,
          total_traders: 12,
          total_new_users: 10,
          total_oi: 300,
        },
        daily_volume: {
          dates: ["2026-05-26", "2026-05-27"],
          series: {
            XYZ: [100, 200],
            FLX: [10, 20],
          },
        },
        daily_trades: {
          dates: ["2026-05-26", "2026-05-27"],
          series: {
            XYZ: [5, 6],
          },
        },
        daily_oi: {
          dates: ["2026-05-26", "2026-05-27"],
          series: {
            XYZ: [250, 300],
          },
        },
        market_share: {
          XYZ: { volume: 900, volume_pct: 90, oi: 270, oi_pct: 90 },
          FLX: { volume: 100, volume_pct: 10, oi: 30, oi_pct: 10 },
        },
        markets: {
          all: [{ symbol: "BTC" }, { symbol: "GOLD" }],
        },
        dexes: ["XYZ", "FLX"],
        generated_at: "2026-05-28T02:49:07.307606",
      },
      {
        XYZ: {
          markets: [
            { symbol: "BTC", canonical: "BTC", oi: 100, volume: 500, traders: 3 },
            { symbol: "GOLD", canonical: "GOLD", oi: 200, volume: 400, traders: 2 },
          ],
        },
        FLX: {
          markets: [{ symbol: "ETH", canonical: "ETH", oi: 50, volume: 100, traders: 1 }],
        },
      },
      {
        totals: {
          total: 700,
          "30d": 300,
          "90d": 500,
          total_pct: 12,
          "30d_pct": 8,
          "90d_pct": 10,
        },
        summary: [
          { address: "0x1", name: "Builder A", total: 100, "30d": 40, "90d": 80, share_builder_total: 10, share_dex_total: 1 },
          { address: "0x2", name: "Builder B", total: 200, "30d": 50, "90d": 90, share_builder_total: 20, share_dex_total: 2 },
        ],
      },
    );

    assert.equal(data.overview.totalVolume, 1000);
    assert.ok(Date.parse(data.cacheExpiresAt) > Date.parse(data.updatedAt));
    assert.equal(data.overview.marketsCount, 2);
    assert.equal(data.dailyVolume.series.length, 2);
    assert.equal(data.topMarketsByOi[0].symbol, "GOLD");
    assert.equal(data.topBuilders[0].name, "Builder B");
    assert.deepEqual(
      data.dexShares.map((share) => share.dex),
      ["XYZ", "FLX"],
    );
    assert.equal(data.builderTotals.volume30d, 300);
  });
});
