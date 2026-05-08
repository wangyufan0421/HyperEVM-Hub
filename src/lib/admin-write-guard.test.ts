import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canWriteAdminData } from "./admin-write-guard";

describe("admin write guard", () => {
  it("未登录会被拒绝", () => {
    process.env.ADMIN_SESSION_TOKEN = "token";
    assert.equal(canWriteAdminData(undefined), false);
    assert.equal(canWriteAdminData("wrong"), false);
  });

  it("登录后允许写操作", () => {
    process.env.ADMIN_SESSION_TOKEN = "token";
    assert.equal(canWriteAdminData("token"), true);
  });
});