import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildProjectSeo, buildSiteSeo } from "./seo";

describe("seo helpers", () => {
  it("首页 SEO 为空时回退到网站名称和网站描述", () => {
    const seo = buildSiteSeo({
      siteName: "HyperEVM Hub",
      siteDescription: "中文 HyperEVM 生态项目目录站",
      seoTitle: "",
      seoDescription: "",
    });

    assert.equal(seo.title, "HyperEVM Hub");
    assert.equal(seo.description, "中文 HyperEVM 生态项目目录站");
    assert.equal(seo.ogTitle, "HyperEVM Hub");
  });

  it("项目详情页 SEO 使用项目名、分类和简介", () => {
    const seo = buildProjectSeo({
      name: "HyperLend",
      category: "DeFi",
      shortDescription: "借贷协议",
      logoUrl: null,
    });

    assert.equal(seo.title.includes("HyperLend"), true);
    assert.equal(seo.description.includes("借贷协议"), true);
    assert.equal(seo.ogImage, "/images/seo-default-og.png");
  });
});