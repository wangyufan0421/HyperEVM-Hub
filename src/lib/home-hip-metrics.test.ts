import assert from "node:assert/strict";
import test from "node:test";
import { buildHomeHipMetrics } from "./home-hip-metrics";

test("builds homepage HIP-3 and HIP-4 24h volume metrics", () => {
  const metrics = buildHomeHipMetrics(
    {
      daily_volume: {
        dates: ["2026-07-05", "2026-07-06"],
        series: {
          KM: [10, 20],
          XYZ: ["30", "40"],
        },
      },
    },
    [
      {},
      [
        { coin: "#1010", dayNtlVlm: "100", markPx: "0.4", circulatingSupply: "1000" },
        { coin: "#1011", dayNtlVlm: 200, midPx: "0.6", circulatingSupply: "500" },
        { coin: "@1", dayNtlVlm: 999, markPx: "1", circulatingSupply: "999" },
      ],
    ],
  );

  assert.equal(metrics.hip3Volume24h, 60);
  assert.equal(metrics.hip4Volume24h, 300);
  assert.equal(metrics.hip4MarketSize, 700);
});
