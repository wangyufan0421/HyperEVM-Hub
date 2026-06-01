import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildHypeEtfDashboardData } from "./hype-etf";

describe("buildHypeEtfDashboardData", () => {
  it("normalizes HYPE ETF flow rows and totals", () => {
    const data = buildHypeEtfDashboardData({
      data: [
        { Date: "13 May 2026", BHYP: "-", THYP: "1.4", Total: "1.4" },
        { Date: "12 May 2026", BHYP: "-", THYP: "1.2", Total: "1.2" },
        { Date: "14 May 2026", BHYP: "0.7", THYP: "4.9", Total: "5.6" },
      ],
      fetchedAt: "2026-05-31T11:01:27.315Z",
      headers: ["Date", "BHYP", "THYP", "Total"],
      type: "hype",
    });

    assert.equal(data.rows.length, 3);
    assert.equal(data.rows[0].isoDate, "2026-05-12");
    assert.equal(data.rows[2].date, "14 May 2026");
    assert.equal(data.rows[2].bhyp, 0.7);
    assert.equal(data.rows[2].thyp, 4.9);
    assert.equal(data.rows[2].cumulativeTotal, 8.2);
    assert.equal(data.totals.latestDate, "14 May 2026");
    assert.equal(data.totals.latestTotal, 5.6);
    assert.equal(data.totals.cumulativeFlow, 8.2);
    assert.equal(data.totals.bhypFlow, 0.7);
    assert.equal(data.totals.thypFlow, 7.5);
    assert.equal(data.totals.positiveDays, 3);
    assert.ok(Date.parse(data.cacheExpiresAt) > Date.parse(data.updatedAt));
  });
});
