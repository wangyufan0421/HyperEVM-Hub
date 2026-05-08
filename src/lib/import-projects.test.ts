import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildImportPreview,
  parseImportContent,
  summarizeImportResult,
} from "./import-projects";

describe("import projects", () => {
  it("CSV 解析成功", () => {
    const rows = parseImportContent({
      format: "csv",
      content: "name,categories,status,shortDescription,websiteUrl\nAlpha,DEX,Live,desc,https://a.com",
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, "Alpha");
  });

  it("JSON 解析成功", () => {
    const rows = parseImportContent({
      format: "json",
      content: JSON.stringify([{ name: "Alpha", categories: ["DEX"], shortDescription: "desc", websiteUrl: "a.com" }]),
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, "Alpha");
  });

  it("缺少必填字段会报错", () => {
    const preview = buildImportPreview({
      rows: [{ name: "", category: "DEX", status: "Live", shortDescription: "", websiteUrl: "" }],
      existingProjects: [],
    });

    assert.equal(preview.rows[0].valid, false);
    assert.equal(preview.rows[0].errors.some((item) => item.includes("name")), true);
  });

  it("旧分类会自动映射到新分类", () => {
    const preview = buildImportPreview({
      rows: [{ name: "Alpha", category: "Lending", status: "Live", shortDescription: "desc", websiteUrl: "https://a.com" }],
      existingProjects: [],
    });

    assert.equal(preview.rows[0].valid, true);
    assert.deepEqual(preview.rows[0].normalized?.categories, ["DeFi"]);
    assert.equal(preview.rows[0].normalized?.category, "DeFi");
  });

  it("旧模板 category 可兼容为多分类", () => {
    const preview = buildImportPreview({
      rows: [{ name: "Alpha", category: "DEX", status: "Live", shortDescription: "desc", websiteUrl: "https://a.com" }],
      existingProjects: [],
    });

    assert.equal(preview.rows[0].valid, true);
    assert.deepEqual(preview.rows[0].normalized?.categories, ["DEX"]);
    assert.equal(preview.rows[0].normalized?.category, "DEX");
  });

  it("status 不合法会报错", () => {
    const preview = buildImportPreview({
      rows: [{ name: "Alpha", category: "DEX", status: "Wrong", shortDescription: "desc", websiteUrl: "https://a.com" }],
      existingProjects: [],
    });

    assert.equal(preview.rows[0].valid, false);
    assert.equal(preview.rows[0].errors.includes("状态不存在"), true);
  });

  it("URL 自动补 https", () => {
    const preview = buildImportPreview({
      rows: [{ name: "Alpha", category: "DEX", status: "Live", shortDescription: "desc", websiteUrl: "a.com", twitterUrl: "x.com/a" }],
      existingProjects: [],
    });

    assert.equal(preview.rows[0].normalized?.websiteUrl, "https://a.com");
    assert.equal(preview.rows[0].normalized?.twitterUrl, "https://x.com/a");
  });

  it("slug 自动生成", () => {
    const preview = buildImportPreview({
      rows: [{ name: "Alpha Dex", category: "DEX", status: "Live", shortDescription: "desc", websiteUrl: "https://a.com", slug: "" }],
      existingProjects: [],
    });

    assert.equal(preview.rows[0].normalized?.slug, "alpha-dex");
  });

  it("slug 重复自动追加后缀", () => {
    const preview = buildImportPreview({
      rows: [
        { name: "Alpha Dex", category: "DEX", status: "Live", shortDescription: "desc", websiteUrl: "https://a.com", slug: "alpha" },
      ],
      existingProjects: [{ name: "Existing", websiteUrl: "https://e.com", slug: "alpha" }],
    });

    assert.equal(preview.rows[0].normalized?.slug, "alpha-2");
  });

  it("name 或 websiteUrl 重复会跳过", () => {
    const preview = buildImportPreview({
      rows: [
        { name: "Alpha", category: "DEX", status: "Live", shortDescription: "desc", websiteUrl: "https://new.com" },
        { name: "Beta", category: "DEX", status: "Live", shortDescription: "desc", websiteUrl: "https://dup.com" },
      ],
      existingProjects: [
        { name: "Alpha", websiteUrl: "https://a.com", slug: "alpha" },
        { name: "X", websiteUrl: "https://dup.com", slug: "x" },
      ],
    });

    assert.equal(preview.rows[0].duplicate, true);
    assert.equal(preview.rows[1].duplicate, true);
    assert.equal(preview.summary.importable, 0);
  });

  it("导入结果统计正确", () => {
    const preview = buildImportPreview({
      rows: [
        { name: "A", category: "DEX", status: "Live", shortDescription: "desc", websiteUrl: "https://a.com" },
        { name: "B", category: "DEX", status: "Wrong", shortDescription: "desc", websiteUrl: "https://b.com" },
      ],
      existingProjects: [],
    });

    const summary = summarizeImportResult(preview.rows, []);
    assert.equal(summary.success, 1);
    assert.equal(summary.failed, 1);
    assert.equal(summary.skipped, 0);
  });

  it("soft deleted projects do not block re-import", () => {
    const preview = buildImportPreview({
      rows: [
        { name: "Alpha", category: "DEX", status: "Live", shortDescription: "new desc", websiteUrl: "https://a.com", slug: "alpha" },
      ],
      existingProjects: [
        { name: "Alpha", websiteUrl: "https://a.com", slug: "alpha", isDeleted: true },
      ],
    });

    assert.equal(preview.rows[0].duplicate, false);
    assert.equal(preview.rows[0].canImport, true);
    assert.equal(preview.rows[0].normalized?.slug, "alpha");
    assert.equal(preview.summary.importable, 1);
  });
});
