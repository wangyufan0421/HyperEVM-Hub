import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveSidebarBrand } from "./site-brand";

describe("site brand", () => {
  it("sidebar logo 优先使用 sidebarLogoFile", () => {
    const brand = resolveSidebarBrand({
      siteName: "HyperEVM Hub",
      sidebarLogoFile: "/uploads/site/sidebar-logo-1.svg",
      sidebarLogoUrl: "https://cdn.example.com/logo.svg",
    });

    assert.equal(brand.logoSrc, "/uploads/site/sidebar-logo-1.svg");
  });

  it("未上传文件时使用 sidebarLogoUrl", () => {
    const brand = resolveSidebarBrand({
      siteName: "HyperEVM Hub",
      sidebarLogoFile: "",
      sidebarLogoUrl: "https://cdn.example.com/logo.svg",
    });

    assert.equal(brand.logoSrc, "https://cdn.example.com/logo.svg");
  });

  it("都没有时回退默认 sidebar logo", () => {
    const brand = resolveSidebarBrand({
      siteName: "",
      sidebarLogoFile: "",
      sidebarLogoUrl: "",
    });

    assert.equal(brand.logoSrc, "/sidebar-logo.png");
    assert.equal(brand.siteName, "HyperEVM Hub");
  });
});
