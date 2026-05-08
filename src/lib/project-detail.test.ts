import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildProjectDetailOverview, buildProjectDetailSections, getVisibleProjectLinks } from "./project-detail";

const project = {
  id: "1",
  name: "HyperLend",
  slug: "hyperlend",
  category: "DeFi",
  status: "Live",
  shortDescription: "借贷协议",
  longDescription: "一个提供借贷市场的项目。",
  coreFeatures: ["借贷", "抵押"],
  targetUsers: ["普通用户"],
  riskNotes: ["智能合约风险"],
  websiteUrl: "https://example.com",
  twitterUrl: "https://x.com/hyperlend",
  discordUrl: null,
  docsUrl: null,
  logoFile: null,
  logoUrl: null,
  createdAt: new Date("2026-04-01T00:00:00.000Z"),
  updatedAt: new Date("2026-04-02T00:00:00.000Z"),
};

describe("project detail page", () => {
  it("空 longDescription 时隐藏项目简介卡", () => {
    const sections = buildProjectDetailSections({ ...project, longDescription: "" });
    assert.equal(sections.some((section) => section.key === "description"), false);
  });

  it("空 coreFeatures 时隐藏核心功能卡", () => {
    const sections = buildProjectDetailSections({ ...project, coreFeatures: [] });
    assert.equal(sections.some((section) => section.key === "core-features"), false);
  });

  it("空 targetUsers 时隐藏适合用户卡", () => {
    const sections = buildProjectDetailSections({ ...project, targetUsers: [] });
    assert.equal(sections.some((section) => section.key === "target-users"), false);
  });

  it("空 riskNotes 时隐藏风险提示卡", () => {
    const sections = buildProjectDetailSections({ ...project, riskNotes: [] });
    assert.equal(sections.some((section) => section.key === "risk-notes"), false);
  });

  it("即使存在 targetUsers 和 riskNotes 也不生成对应区块", () => {
    const sections = buildProjectDetailSections(project);
    assert.equal(sections.some((section) => section.key === "target-users"), false);
    assert.equal(sections.some((section) => section.key === "risk-notes"), false);
  });

  it("项目详情页只保留核心功能区块", () => {
    const sections = buildProjectDetailSections(project);
    assert.deepEqual(sections.map((section) => section.key), ["description", "core-features"]);
  });

  it("相关链接只展示已填写链接", () => {
    const links = getVisibleProjectLinks(project);
    assert.deepEqual(
      links.map((item) => item.label),
      ["官网", "Twitter / X"],
    );
  });

  it("websiteUrl 为空时不展示官网链接", () => {
    const links = getVisibleProjectLinks({ ...project, websiteUrl: "" });
    assert.equal(links.some((item) => item.label === "官网"), false);
  });

  it("longDescription 为空时项目概览回退 shortDescription", () => {
    const overview = buildProjectDetailOverview({ ...project, longDescription: "" });
    assert.equal(overview, "借贷协议");
  });
});
