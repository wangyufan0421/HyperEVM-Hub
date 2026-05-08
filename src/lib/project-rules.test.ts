import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateProjectSlug,
  normalizeManualSlug,
  resolveProjectLogo,
} from "@/lib/project-rules";

describe("project rules", () => {
  it("根据项目名生成符合规则的 slug", () => {
    assert.equal(generateProjectSlug("Hyper Swap 2.0"), "hyper-swap-20");
  });

  it("手动 slug 只保留小写字母数字和连字符", () => {
    assert.equal(normalizeManualSlug(" Hyper_SWAP@V1 "), "hyperswapv1");
  });

  it("logo 优先使用上传文件", () => {
    assert.equal(
      resolveProjectLogo({
        logoFile: "/uploads/project-logo.png",
        logoUrl: "https://cdn.example.com/logo.png",
      }),
      "/uploads/project-logo.png",
    );
  });

  it("没有上传文件时使用 logoUrl", () => {
    assert.equal(
      resolveProjectLogo({
        logoFile: "",
        logoUrl: "https://cdn.example.com/logo.png",
      }),
      "https://cdn.example.com/logo.png",
    );
  });

  it("都没有时返回默认占位 logo", () => {
    assert.equal(resolveProjectLogo({ logoFile: "", logoUrl: "" }), "/images/logo-placeholder.svg");
  });

  it("logoFile 非法相对路径时回退默认占位 logo", () => {
    assert.equal(resolveProjectLogo({ logoFile: "uploads/logo.png", logoUrl: "" }), "/images/logo-placeholder.svg");
  });
});
