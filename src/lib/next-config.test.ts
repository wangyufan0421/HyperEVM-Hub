import assert from "node:assert/strict";
import { describe, it } from "node:test";
import nextConfig from "../../next.config";

describe("next image remote patterns", () => {
  it("包含项目需要的远程 logo 域名", () => {
    const patterns = nextConfig.images?.remotePatterns ?? [];
    const hosts = patterns.map((item) => item.hostname);

    assert.ok(hosts.includes("icons.llama.fi"));
    assert.ok(hosts.includes("coin-images.coingecko.com"));
    assert.ok(hosts.includes("assets.coingecko.com"));
    assert.ok(hosts.includes("raw.githubusercontent.com"));
    assert.ok(hosts.includes("github.com"));
    assert.ok(hosts.includes("pbs.twimg.com"));
    assert.ok(hosts.includes("abs.twimg.com"));
  });
});
