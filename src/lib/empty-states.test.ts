import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getAdminEmptyStateMessage, getFrontendEmptyStateMessage } from "./empty-states";

describe("empty states", () => {
  it("前台无项目和筛选无结果文案正确", () => {
    assert.equal(getFrontendEmptyStateMessage("no-projects"), "暂无项目，等待管理员添加。");
    assert.equal(getFrontendEmptyStateMessage("no-results"), "没有找到匹配结果，请清除筛选后重试。");
  });

  it("后台空状态文案包含建议操作", () => {
    const msg = getAdminEmptyStateMessage("import-invalid");
    assert.equal(msg.includes("重新上传文件"), true);
  });
});