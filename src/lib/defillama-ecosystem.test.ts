import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractHyperEvmMetrics } from "./defillama-ecosystem";

describe("extractHyperEvmMetrics", () => {
  it("separates chain fees and revenue from app fees and revenue", () => {
    const metrics = extractHyperEvmMetrics({
      feesOverview: {
        protocols: [
          {
            name: "Hyperliquid L1",
            protocolType: "chain",
            total24h: 100,
          },
          {
            name: "App A",
            protocolType: "protocol",
            total24h: 25,
          },
          {
            name: "App B",
            protocolType: "protocol",
            total24h: 75,
          },
        ],
      },
      revenueOverview: {
        protocols: [
          {
            name: "Hyperliquid L1",
            protocolType: "chain",
            total24h: 40,
          },
          {
            name: "App A",
            protocolType: "protocol",
            total24h: 8,
          },
          {
            name: "App B",
            protocolType: "protocol",
            total24h: 12,
          },
        ],
      },
      dexOverview: {
        total24h: 5000,
      },
    });

    assert.equal(metrics.chainFees24h, 100);
    assert.equal(metrics.chainRevenue24h, 40);
    assert.equal(metrics.appFees24h, 100);
    assert.equal(metrics.appRevenue24h, 20);
    assert.equal(metrics.dexVolume24h, 5000);
  });

  it("falls back to overview totals when a chain row is missing", () => {
    const metrics = extractHyperEvmMetrics({
      feesOverview: {
        total24h: 300,
        protocols: [
          {
            name: "App A",
            protocolType: "protocol",
            total24h: 25,
          },
        ],
      },
      revenueOverview: {
        total24h: 120,
        protocols: [
          {
            name: "App A",
            protocolType: "protocol",
            total24h: 12,
          },
        ],
      },
      dexOverview: {},
    });

    assert.equal(metrics.chainFees24h, 300);
    assert.equal(metrics.chainRevenue24h, 120);
    assert.equal(metrics.appFees24h, 25);
    assert.equal(metrics.appRevenue24h, 12);
    assert.equal(metrics.dexVolume24h, null);
  });
});
