import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDeleteConfirmationMessage, isProtectedAdminPath, verifyAdminPassword } from "./admin-auth";

describe("admin auth", () => {
  it("受保护的后台路径会被识别", () => {
    assert.equal(isProtectedAdminPath("/admin/projects"), true);
    assert.equal(isProtectedAdminPath("/admin/settings"), true);
    assert.equal(isProtectedAdminPath("/admin"), false);
  });

  it("密码校验依赖环境变量", () => {
    process.env.ADMIN_PASSWORD = "secret";
    assert.equal(verifyAdminPassword("secret"), true);
    assert.equal(verifyAdminPassword("wrong"), false);
  });

  it("删除确认文案清晰说明软删除行为", () => {
    const message = buildDeleteConfirmationMessage();
    assert.equal(message.includes("前台不再展示"), true);
    assert.equal(message.includes("不会被永久删除"), true);
    assert.equal(message.includes("后台可恢复"), true);
  });
});
