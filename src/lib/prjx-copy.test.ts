import assert from "node:assert/strict";
import test from "node:test";
import { PRJX_DASHBOARD_COPY } from "./prjx-copy";

test("Project X dashboard copy avoids the PRJX display name", () => {
  const visibleCopy = Object.values(PRJX_DASHBOARD_COPY).join(" ");

  assert.equal(PRJX_DASHBOARD_COPY.displayName, "Project X");
  assert.equal(PRJX_DASHBOARD_COPY.lpTableTitle, "LP Pool");
  assert.equal(PRJX_DASHBOARD_COPY.lpTableDescription, "");
  assert.equal(PRJX_DASHBOARD_COPY.tvlDescription, "");
  assert.equal(visibleCopy.includes("PRJX"), false);
  assert.equal(visibleCopy.includes("按 Project X pools API 当前 TVL 排序。"), false);
  assert.equal(visibleCopy.includes("Hyperliquid L1 上 Project X 的日级 TVL。"), false);
});
