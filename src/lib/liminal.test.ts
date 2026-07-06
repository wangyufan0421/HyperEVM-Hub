import assert from "node:assert/strict";
import test from "node:test";
import { buildLiminalDashboardData } from "./liminal";

test("builds Liminal TVL focus metrics and tokenized product rows", () => {
  const data = buildLiminalDashboardData(
    {
      chainTvls: {
        "Hyperliquid L1": {
          tvl: [
            { date: 86400, totalLiquidityUSD: 1000 },
            { date: 172800, totalLiquidityUSD: 1100 },
            { date: 2678400, totalLiquidityUSD: 1500 },
            { date: 2764800, totalLiquidityUSD: 1800 },
          ],
        },
      },
      currentChainTvls: {
        "Hyperliquid L1": 1800,
      },
      description: "Automated yield strategies",
      name: "Liminal",
      twitter: "liminalmoney",
      url: "https://liminal.money/join/DEFILLAMA",
    },
    {
      total24h: 8,
      total7d: 28,
      total30d: 549,
      totalAllTime: 232608,
    },
    {
      total24h: 8,
      total7d: 28,
      total30d: 549,
      totalAllTime: 232608,
    },
    [
      {
        depositPipes: [
          {
            ofts: [
              { symbol: "USDC" },
              { symbol: "USDT0" },
            ],
          },
        ],
        icon: "https://liminal.money/icons/xtokens/lim-usd.svg",
        isActive: true,
        leverage: 1,
        name: "limUSD",
        navOracleAddress: "0xnav",
        shareManagerAddress: "0xshare",
        shareOFTs: [
          { chainId: { name: "HyperEVM" }, symbol: "LIMUSD" },
          { chainId: { name: "Arbitrum" }, symbol: "LIMUSD" },
        ],
        underlyingAssetAddress: "0xunderlying",
        vaultType: "limUSD",
      },
      {
        depositPipes: [{ ofts: [{ symbol: "USDC" }] }],
        isActive: true,
        leverage: 10,
        name: "xHYPE",
        navOracleAddress: "0xhype-nav",
        shareManagerAddress: "0xhype-share",
        shareOFTs: [{ chainId: { name: "HyperEVM" }, symbol: "XHYPE" }],
        underlyingAssetAddress: "0xhype-underlying",
        vaultType: "basisTrade",
      },
    ],
    {
      limUSD: [
        { timestamp: 1000, trailing3d: 5, trailing7d: 6, trailing30d: 7 },
        { timestamp: 2000, trailing3d: 8, trailing7d: 9, trailing30d: 10 },
      ],
      xHYPE: [{ timestamp: 3000, trailing3d: 11, trailing7d: 12, trailing30d: 13 }],
    },
    {
      success: true,
      data: {
        customized: {
          summary: {
            avgDailyVolume: 200,
            totalTrades: 60,
            totalVolume: 600,
          },
          data: [
            { date: "1970-02-01T00:00:00.000Z", totalTrades: 30, totalVolume: 300 },
            { date: "1970-01-31T00:00:00.000Z", totalTrades: 20, totalVolume: 200 },
            { date: "1970-01-02T00:00:00.000Z", totalTrades: 10, totalVolume: 100 },
          ],
        },
      },
    },
    {
      success: true,
      data: {
        customized: [
          { timestamp: "1970-01-02T09:00:00.000Z", totalValueLocked: 25 },
          { timestamp: "1970-01-01T09:00:00.000Z", totalValueLocked: 10 },
        ],
        tokenized: [
          {
            xTokenName: "limUSD",
            data: [
              { timestamp: "1970-01-01T23:00:00.000Z", totalAssets: "100" },
              { timestamp: "1970-01-02T23:00:00.000Z", totalAssets: "120" },
            ],
          },
          {
            xTokenName: "xHYPE",
            data: [
              { timestamp: "1970-01-01T23:00:00.000Z", totalAssets: "50" },
              { timestamp: "1970-01-02T23:00:00.000Z", totalAssets: "55" },
            ],
          },
        ],
      },
    },
    {
      success: true,
      data: {
        customized: {
          summary: {
            currentCumulativeUsers: 18,
            totalNewUsers: 18,
          },
          data: [
            { date: "1970-01-01T00:00:00.000Z", newUsers: 1, cumulativeUsers: 1 },
            { date: "1970-01-02T00:00:00.000Z", newUsers: 2, cumulativeUsers: 3 },
            { date: "1970-01-31T00:00:00.000Z", newUsers: 5, cumulativeUsers: 15 },
            { date: "1970-02-01T00:00:00.000Z", newUsers: 3, cumulativeUsers: 18 },
          ],
        },
      },
    },
  );

  assert.equal(data.info.currentTvl, 1800);
  assert.equal(data.stats.tvl24hChangeUsd, 300);
  assert.equal(data.stats.tvl24hChangePct, 20);
  assert.equal(data.stats.tvl30dChangeUsd, 700);
  assert.equal(data.stats.tvl30dChangePct, 63.6364);
  assert.equal(data.stats.fees24h, 8);
  assert.equal(data.stats.revenue30d, 549);
  assert.equal(data.stats.depositorsCurrent, 18);
  assert.equal(data.stats.depositors24hGrowth, 3);
  assert.equal(data.stats.depositors30dGrowth, 15);
  assert.equal(data.stats.volume24h, 300);
  assert.equal(data.stats.volumeAvgDaily, 200);
  assert.equal(data.stats.volumeLifetime, 600);
  assert.equal(data.stats.tokenizedTvl, 175);
  assert.equal(data.stats.customizedTvl, 25);
  assert.deepEqual(data.splitTvlHistory, [
    { date: 0, customizedTvl: 10, tokenizedTvl: 150, totalTvl: 160 },
    { date: 86400, customizedTvl: 25, tokenizedTvl: 175, totalTvl: 200 },
  ]);
  assert.deepEqual(data.volumeHistory, [
    { date: 86400, trades: 10, volume: 100 },
    { date: 2592000, trades: 20, volume: 200 },
    { date: 2678400, trades: 30, volume: 300 },
  ]);
  assert.deepEqual(data.depositorHistory, [
    { date: 0, newUsers: 1, cumulativeUsers: 1 },
    { date: 86400, newUsers: 2, cumulativeUsers: 3 },
    { date: 2592000, newUsers: 5, cumulativeUsers: 15 },
    { date: 2678400, newUsers: 3, cumulativeUsers: 18 },
  ]);
  assert.deepEqual(data.tvlHistory, [
    { date: 86400, tvl: 1000 },
    { date: 172800, tvl: 1100 },
    { date: 2678400, tvl: 1500 },
    { date: 2764800, tvl: 1800 },
  ]);
  assert.deepEqual(data.tokens, [
    {
      active: true,
      apyHistory: [
        { timestamp: 1000, trailing3d: 5, trailing7d: 6, trailing30d: 7 },
        { timestamp: 2000, trailing3d: 8, trailing7d: 9, trailing30d: 10 },
      ],
      chains: ["HyperEVM", "Arbitrum"],
      depositAssets: ["USDC", "USDT0"],
      icon: "https://liminal.money/icons/xtokens/lim-usd.svg",
      leverage: 1,
      name: "limUSD",
      navOracleAddress: "0xnav",
      shareManagerAddress: "0xshare",
      shareSymbols: ["LIMUSD"],
      trailing3dApy: 8,
      trailing7dApy: 9,
      trailing30dApy: 10,
      underlyingAssetAddress: "0xunderlying",
      vaultType: "limUSD",
    },
    {
      active: true,
      apyHistory: [{ timestamp: 3000, trailing3d: 11, trailing7d: 12, trailing30d: 13 }],
      chains: ["HyperEVM"],
      depositAssets: ["USDC"],
      icon: "",
      leverage: 10,
      name: "xHYPE",
      navOracleAddress: "0xhype-nav",
      shareManagerAddress: "0xhype-share",
      shareSymbols: ["XHYPE"],
      trailing3dApy: 11,
      trailing7dApy: 12,
      trailing30dApy: 13,
      underlyingAssetAddress: "0xhype-underlying",
      vaultType: "basisTrade",
    },
  ]);
});
