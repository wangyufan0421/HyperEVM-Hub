import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildImportPreview,
  parseImportContent,
  summarizeImportResult,
} from "./import-projects";

describe("admin import", () => {
  it("可以解析 JSON 导入文件", () => {
    const rows = parseImportContent({
      format: "json",
      content: JSON.stringify([{ name: "Alpha", category: "DEX", shortDescription: "desc", websiteUrl: "a.com" }]),
    });
    assert.equal(rows.length, 1);
  });

  it("项目名或官网任一相同即视为重复", () => {
    const preview = buildImportPreview({
      rows: [
        { name: "Alpha", category: "DEX", status: "Live", shortDescription: "desc", websiteUrl: "https://x.com" },
        { name: "Gamma", category: "DEX", status: "Live", shortDescription: "desc", websiteUrl: "https://b.com" },
        { name: "Delta", category: "DEX", status: "Live", shortDescription: "desc", websiteUrl: "https://d.com" },
      ],
      existingProjects: [
        { name: "Alpha", websiteUrl: "https://a.com", slug: "alpha" },
        { name: "Beta", websiteUrl: "https://b.com", slug: "beta" },
      ],
    });

    assert.equal(preview.rows[0].duplicate, true);
    assert.equal(preview.rows[1].duplicate, true);
    assert.equal(preview.rows[2].canImport, true);
  });

  it("可以统计导入结果", () => {
    const preview = buildImportPreview({
      rows: [
        { name: "A", category: "DEX", status: "Live", shortDescription: "desc", websiteUrl: "https://a.com" },
      ],
      existingProjects: [],
    });

    const summary = summarizeImportResult(preview.rows, []);
    assert.equal(summary.success, 1);
    assert.equal(summary.failed, 0);
    assert.equal(summary.skipped, 0);
  });
});
