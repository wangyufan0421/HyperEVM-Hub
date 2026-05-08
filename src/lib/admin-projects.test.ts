import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDeleteConfirmationMessage, filterAdminProjects, restoreProject, softDeleteProject, validateAdminProjectInput, type AdminProjectRecord, } from "./admin-projects";

const records: AdminProjectRecord[] = [
  {
    id: "1",
    name: "Alpha",
    slug: "alpha",
    category: "DeFi",
    status: "Live",
    shortDescription: "desc",
    websiteUrl: "https://a.com",
    isDeleted: false,
    deletedAt: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-02"),
  },
  {
    id: "2",
    name: "Beta",
    slug: "beta",
    category: "DEX",
    status: "Beta",
    shortDescription: "desc",
    websiteUrl: "https://b.com",
    isDeleted: true,
    deletedAt: new Date("2026-01-03"),
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-03"),
  },
];

describe("admin projects", () => {
  it("必填字段缺失时返回校验错误", () => {
    const result = validateAdminProjectInput({
      name: "",
      slug: "",
      category: "",
      status: "",
      shortDescription: "",
      websiteUrl: "",
    });

    assert.equal(result.valid, false);
    assert.equal(result.errors.length > 0, true);
  });

  it("默认隐藏已删除项目", () => {
    const result = filterAdminProjects(records, { query: "", category: "all", status: "all", showDeleted: false });
    assert.deepEqual(result.map((item) => item.id), ["1"]);
  });

  it("可切换查看已删除项目", () => {
    const result = filterAdminProjects(records, { query: "", category: "all", status: "all", showDeleted: true });
    assert.deepEqual(result.map((item) => item.id), ["2"]);
  });

  it("软删除设置 isDeleted 和 deletedAt", () => {
    const next = softDeleteProject(records[0]);
    assert.equal(next.isDeleted, true);
    assert.equal(next.deletedAt instanceof Date, true);
  });

  it("恢复清空 deletedAt", () => {
    const next = restoreProject(records[1]);
    assert.equal(next.isDeleted, false);
    assert.equal(next.deletedAt, null);
  });

  it("删除确认文案包含软删除说明", () => {
    const message = buildDeleteConfirmationMessage();
    assert.equal(message.includes("前台不再展示"), true);
    assert.equal(message.includes("不会被永久删除"), true);
    assert.equal(message.includes("后台可恢复"), true);
  });
});