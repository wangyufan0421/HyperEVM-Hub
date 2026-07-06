import test from "node:test";
import assert from "node:assert/strict";
import { buildPrjxDashboardData } from "./prjx";

test("builds PRJX TVL history and top LP rows", () => {
  const data = buildPrjxDashboardData(
    {
      category: "Dexs",
      chain: "Hyperliquid L1",
      chainTvls: {
        "Hyperliquid L1": {
          tvl: [
            { date: 1, totalLiquidityUSD: 100 },
            { date: 2, totalLiquidityUSD: 150 },
            { date: 3, totalLiquidityUSD: 120 },
          ],
        },
      },
      currentChainTvls: { "Hyperliquid L1": 120 },
      name: "Project X",
      url: "https://www.prjx.com",
    },
    {
      pools: [
        { id: "a", name: "A/B", tvlUSD: "10", token0: { symbol: "A" }, token1: { symbol: "B" } },
        { id: "b", name: "B/C", tvlUSD: "20", token0: { symbol: "B" }, token1: { symbol: "C" } },
      ],
    },
    {
      total24h: 70,
      totalDataChart: [
        [1, 40],
        [2, 60],
        [3, 70],
      ],
    },
    {
      count: 1234,
      helper: "PRJX V3 LP position NFTs",
    },
  );

  assert.equal(data.info.currentTvl, 120);
  assert.equal(data.info.currentDexVolume24h, 70);
  assert.equal(data.stats.lpDepositors, 1234);
  assert.equal(data.stats.lpDepositorsHelper, "PRJX V3 LP position NFTs");
  assert.equal(data.stats.peakTvl, 150);
  assert.equal(data.tvlHistory.length, 3);
  assert.deepEqual(data.dexVolumeHistory, [
    { date: 1, volume: 40 },
    { date: 2, volume: 60 },
    { date: 3, volume: 70 },
  ]);
  assert.deepEqual(
    data.lpPools.map((pool) => [pool.rank, pool.name, pool.tvlUsd]),
    [
      [1, "B/C", 20],
      [2, "A/B", 10],
    ],
  );
});
