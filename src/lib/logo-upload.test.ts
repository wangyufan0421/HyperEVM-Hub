import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildLogoFilePath, shouldKeepExistingLogoFile, validateLogoFile } from "./logo-upload";

describe("logo upload", () => {
  it("生成安全且可预测的 logo 文件路径", () => {
    const path = buildLogoFilePath({
      slug: "Hyper Lend 中文",
      originalName: "my logo.PNG",
      now: 1710000000000,
    });

    assert.equal(path, "/uploads/logos/hyper-lend-1710000000000.png");
  });

  it("拒绝非允许格式", () => {
    const result = validateLogoFile({
      size: 1024,
      type: "application/pdf",
      name: "logo.pdf",
    });

    assert.equal(result.ok, false);
    assert.equal(result.error, "仅支持 png、jpg、jpeg、webp、svg 格式图片");
  });

  it("拒绝超过 2MB 文件", () => {
    const result = validateLogoFile({
      size: 2 * 1024 * 1024 + 1,
      type: "image/png",
      name: "logo.png",
    });

    assert.equal(result.ok, false);
    assert.equal(result.error, "图片大小不能超过 2MB");
  });

  it("未上传新文件时保留原 logoFile", () => {
    assert.equal(shouldKeepExistingLogoFile({ size: 0, name: "", type: "application/octet-stream" }), true);
  });
});
