import assert from "node:assert/strict";
import test from "node:test";
import { buildTradeXyzDashboardData } from "./tradexyz";

test("builds tradeXYZ fee, revenue, and perp volume history", () => {
  const data = buildTradeXyzDashboardData(
    {
      category: "Interface",
      chain: "Hyperliquid L1",
      description: "XYZ perpetual futures trade",
      name: "tradeXYZ",
      url: "https://app.trade.xyz/",
    },
    {
      total24h: 300,
      total7d: 1200,
      total30d: 4000,
      totalDataChart: [
        [1, 100],
        [2, 200],
        [3, 300],
      ],
    },
    {
      total24h: 90,
      total7d: 300,
      total30d: 900,
      totalDataChart: [
        [1, 30],
        [2, 60],
        [3, 90],
      ],
    },
    {
      CASH: {
        total: {
          oi: 1000,
          trades: 2,
          traders: 1,
          volume: 1000,
        },
      },
      FLX: {
        total: {
          oi: 3000,
          trades: 6,
          traders: 3,
          volume: 3000,
        },
      },
      XYZ: {
        daily_totals: {
          dates: ["1970-01-01", "1970-01-02", "1970-01-03"],
          volume: [1000, 2000, 3000],
        },
        markets: [
          { symbol: "OIL", canonical: "OIL", volume: 9000, traders: 90, oi: 900 },
          { symbol: "NDX", canonical: "NDX", volume: 12000, traders: 120, oi: 1200 },
          { symbol: "SILVER", canonical: "SILVER", volume: 11000, traders: 110, oi: 1100 },
          { symbol: "ZERO", canonical: "ZERO", volume: 0, traders: 0, oi: 0 },
          { symbol: "GOLD", canonical: "GOLD", volume: 10000, traders: 100, oi: 1000 },
          { symbol: "MU", canonical: "MU", volume: 8000, traders: 80, oi: 800 },
          { symbol: "SPCX", canonical: "SPCX", volume: 7000, traders: 70, oi: 700 },
          { symbol: "SNDK", canonical: "SNDK", volume: 6000, traders: 60, oi: 600 },
          { symbol: "NVDA", canonical: "NVDA", volume: 5000, traders: 50, oi: 500 },
          { symbol: "AAPL", canonical: "AAPL", volume: 4000, traders: 40, oi: 400 },
          { symbol: "TSLA", canonical: "TSLA", volume: 3000, traders: 30, oi: 300 },
          { symbol: "META", canonical: "META", volume: 2000, traders: 20, oi: 200 },
        ],
        total: {
          oi: 6000,
          trades: 12,
          traders: 6,
          volume: 6000,
        },
      },
    },
  );

  assert.equal(data.info.name, "tradeXYZ");
  assert.equal(data.info.currentFees24h, 300);
  assert.equal(data.info.currentRevenue24h, 90);
  assert.equal(data.info.currentPerpVolume24h, 3000);
  assert.equal(data.stats.fees7d, 1200);
  assert.equal(data.stats.volume30d, 6000);
  assert.equal(data.stats.revenue30d, 900);
  assert.equal(data.stats.totalTraders, 6);
  assert.deepEqual(data.feeHistory, [
    { date: 1, fees: 100 },
    { date: 2, fees: 200 },
    { date: 3, fees: 300 },
  ]);
  assert.deepEqual(data.revenueHistory, [
    { date: 1, revenue: 30 },
    { date: 2, revenue: 60 },
    { date: 3, revenue: 90 },
  ]);
  assert.deepEqual(data.perpVolumeHistory, [
    { date: 0, volume: 1000 },
    { date: 86400, volume: 2000 },
    { date: 172800, volume: 3000 },
  ]);
  assert.deepEqual(data.hip3DexComparison, [
    { dex: "XYZ", isTradeXyz: true, oi: 6000, trades: 12, traders: 6, volume: 6000 },
    { dex: "FLX", isTradeXyz: false, oi: 3000, trades: 6, traders: 3, volume: 3000 },
    { dex: "CASH", isTradeXyz: false, oi: 1000, trades: 2, traders: 1, volume: 1000 },
  ]);
  assert.deepEqual(data.hip3MarketShare, [
    { dex: "XYZ", isTradeXyz: true, oiPct: 60, tradesPct: 60, tradersPct: 60, volumePct: 60 },
    { dex: "FLX", isTradeXyz: false, oiPct: 30, tradesPct: 30, tradersPct: 30, volumePct: 30 },
    { dex: "CASH", isTradeXyz: false, oiPct: 10, tradesPct: 10, tradersPct: 10, volumePct: 10 },
  ]);
  assert.deepEqual(data.topMarkets, [
    { canonical: "NDX", oi: 1200, rank: 1, symbol: "NDX", traders: 120, volume: 12000 },
    { canonical: "SILVER", oi: 1100, rank: 2, symbol: "SILVER", traders: 110, volume: 11000 },
    { canonical: "GOLD", oi: 1000, rank: 3, symbol: "GOLD", traders: 100, volume: 10000 },
    { canonical: "OIL", oi: 900, rank: 4, symbol: "OIL", traders: 90, volume: 9000 },
    { canonical: "MU", oi: 800, rank: 5, symbol: "MU", traders: 80, volume: 8000 },
    { canonical: "SPCX", oi: 700, rank: 6, symbol: "SPCX", traders: 70, volume: 7000 },
    { canonical: "SNDK", oi: 600, rank: 7, symbol: "SNDK", traders: 60, volume: 6000 },
    { canonical: "NVDA", oi: 500, rank: 8, symbol: "NVDA", traders: 50, volume: 5000 },
    { canonical: "AAPL", oi: 400, rank: 9, symbol: "AAPL", traders: 40, volume: 4000 },
    { canonical: "TSLA", oi: 300, rank: 10, symbol: "TSLA", traders: 30, volume: 3000 },
  ]);
});
