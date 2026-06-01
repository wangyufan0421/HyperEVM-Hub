import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildHip4DashboardData } from "./loris-hip4";

describe("buildHip4DashboardData", () => {
  it("normalizes Loris HIP-4 analytics for the dashboard", () => {
    const data = buildHip4DashboardData(
      {
        success: true,
        period: "all",
        summary: {
          volume: 1000,
          fill_count: 20,
          trade_count: 15,
          unique_traders: 7,
          total_fees: 2.5,
          liquidation_count: 1,
        },
        settlement_total: {
          volume: 400,
          fill_count: 6,
          trade_count: 3,
          unique_traders: 5,
          total_fees: 0,
        },
        by_outcome: [
          { outcome_id: 2, volume: 300, trade_count: 5, fill_count: 8, unique_traders: 3, total_priority_gas: 0 },
          { outcome_id: 1, volume: 600, trade_count: 9, fill_count: 10, unique_traders: 5, total_priority_gas: 0 },
        ],
        by_coin: [
          { coin: "#10", outcome_id: 1, outcome_side: 0, volume: 400, trade_count: 6, fill_count: 7, unique_traders: 4 },
          { coin: "#11", outcome_id: 1, outcome_side: 1, volume: 200, trade_count: 3, fill_count: 3, unique_traders: 2 },
        ],
        timeseries: [
          { date: "2026-05-01", volume: 100, trade_count: 2, fill_count: 3, unique_traders: 1, total_fees: 0.5, liquidation_count: 0 },
          { date: "2026-05-02", volume: 200, trade_count: 3, fill_count: 4, unique_traders: 2, total_fees: 0.8, liquidation_count: 1 },
        ],
        settlement_timeseries: [
          { date: "2026-05-01", volume: 30, trade_count: 1, fill_count: 2, unique_traders: 1, total_fees: 0, liquidation_count: 0 },
          { date: "2026-05-02", volume: 50, trade_count: 2, fill_count: 3, unique_traders: 2, total_fees: 0, liquidation_count: 0 },
        ],
      },
      {
        success: true,
        period: "1d",
        summary: {
          volume: 100,
          fill_count: 4,
          trade_count: 3,
          unique_traders: 2,
          total_fees: 0.8,
          liquidation_count: 0,
        },
        settlement_total: {
          volume: 25,
          fill_count: 1,
          trade_count: 1,
          unique_traders: 1,
          total_fees: 0,
        },
        by_outcome: [{ outcome_id: 1, volume: 90, trade_count: 2, fill_count: 3, unique_traders: 2, total_priority_gas: 0 }],
        by_coin: [],
        timeseries: [],
      },
      {
        success: true,
        data: [
          { day: "2026-05-01", oi_contracts: 10, oi_usd: 100, oi_change_contracts: 10, oi_change_usd: 100 },
          { day: "2026-05-02", oi_contracts: 15, oi_usd: 150, oi_change_contracts: 5, oi_change_usd: 50 },
        ],
      },
      {
        outcomes: [
          { outcome: 1, name: "BTC Direction", description: "class:priceBinary|underlying:BTC|expiry:20260502-0600|targetPrice:80000|period:1d", sideSpecs: [{ name: "Yes" }, { name: "No" }] },
          { outcome: 2, name: "ETH Direction", description: "class:priceBinary|underlying:ETH|expiry:20260502-0600|targetPrice:3000|period:1d", sideSpecs: [{ name: "Yes" }, { name: "No" }] },
        ],
        questions: [{ question: 1, name: "BTC Group", description: "class:priceBucket|underlying:BTC", namedOutcomes: [1], fallbackOutcome: 2 }],
      },
    );

    assert.equal(data.overview.totalVolume, 1400);
    assert.equal(data.overview.volume24h, 125);
    assert.ok(Date.parse(data.cacheExpiresAt) > Date.parse(data.updatedAt));
    assert.equal(data.overview.totalTrades, 18);
    assert.equal(data.overview.totalFills, 26);
    assert.equal(data.overview.fills24h, 5);
    assert.equal(data.overview.outcomesCount, 2);
    assert.equal(data.overview.questionsCount, 1);
    assert.equal(data.volumeSeries.values[1], 250);
    assert.equal(data.tradesSeries.values[1], 5);
    assert.equal(data.oiSeries.values[1], 150);
    assert.equal(data.topOutcomes[0].outcomeId, 1);
    assert.equal(data.topOutcomes[0].title, "BTC 80000 1d");
    assert.equal(data.topOutcomeSides[0].sideName, "YES");
  });
});
