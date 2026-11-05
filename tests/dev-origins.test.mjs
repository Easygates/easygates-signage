import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import nextConfig from "../next.config.ts";
import {
  normalizeDevOrigin,
  resolveAllowedDevOrigins,
} from "../src/lib/devOrigins.ts";

const require = createRequire(import.meta.url);
const { blockCrossSiteDEV } = require("next/dist/server/lib/router-utils/block-cross-site-dev.js");

function makeRes() {
  return {
    statusCode: 200,
    endedWith: null,
    end(body) {
      this.endedWith = body;
    },
  };
}

describe("next.config.ts allowedDevOrigins", () => {
  it("configures allowedDevOrigins including tv-serv", () => {
    assert.ok(Array.isArray(nextConfig.allowedDevOrigins));
    assert.ok(nextConfig.allowedDevOrigins.includes("tv-serv"));
    assert.ok(nextConfig.allowedDevOrigins.includes("tv-serv.local"));
  });

  it("normalizes hostnames, URLs, ports, and IPv6 loopback", () => {
    assert.equal(normalizeDevOrigin("TV-SERV"), "tv-serv");
    assert.equal(normalizeDevOrigin("http://tv-serv:3000/display?id=1"), "tv-serv");
    assert.equal(normalizeDevOrigin("https://cms.tailnet.ts.net:8443/admin"), "cms.tailnet.ts.net");
    assert.equal(normalizeDevOrigin("192.168.1.50:3000"), "192.168.1.50");
    assert.equal(normalizeDevOrigin("http://[::1]:3000/"), "[::1]");
    assert.equal(normalizeDevOrigin("::1"), "[::1]");
    assert.equal(normalizeDevOrigin("   "), "");
  });

  it("includes machine hostname, LAN IPs, and ALLOWED_DEV_ORIGINS entries", () => {
    const origins = resolveAllowedDevOrigins({
      env: { ALLOWED_DEV_ORIGINS: "http://shop-box:3000, cms.example.internal" },
      hostname: "Signage-Server.lan",
      lanAddresses: ["100.88.12.34"],
    });
    assert.ok(origins.includes("tv-serv"));
    assert.ok(origins.includes("signage-server.lan"));
    assert.ok(origins.includes("signage-server"));
    assert.ok(origins.includes("signage-server.local"));
    assert.ok(origins.includes("100.88.12.34"));
    assert.ok(origins.includes("shop-box"));
    assert.ok(origins.includes("cms.example.internal"));
    assert.ok(!origins.includes("*.e2b.app"));
  });

  it("does not split IPv4 hostnames into bogus numeric short labels", () => {
    const origins = resolveAllowedDevOrigins({
      env: {},
      hostname: "192.168.1.50",
      lanAddresses: [],
    });
    assert.ok(origins.includes("192.168.1.50"));
    assert.ok(!origins.includes("192"));
    assert.ok(!origins.includes("192.local"));
  });

  it("allows /_next/webpack-hmr from tv-serv and LAN hosts while blocking untrusted external origins", () => {
    const allowed = resolveAllowedDevOrigins({
      env: {},
      hostname: "tv-serv",
      lanAddresses: ["100.90.1.2"],
    });

    for (const origin of [
      "http://tv-serv:3000",
      "http://TV-SERV:3000",
      "http://tv-serv.local:3000",
      "http://showroom-pi.local:3000",
      "http://office-pc.lan:3000",
      "http://127.0.0.1:3000",
      "http://[::1]:3000",
      "http://192.168.1.50:3000",
      "http://10.0.0.12:3000",
      "http://172.20.4.8:3000",
      "http://100.90.1.2:3000",
    ]) {
      const res = makeRes();
      const blocked = blockCrossSiteDEV(
        { url: "/_next/webpack-hmr", headers: { origin } },
        res,
        allowed,
        undefined,
      );
      assert.equal(blocked, false, `expected ${origin} to be allowed`);
      assert.equal(res.statusCode, 200);
    }

    for (const badOrigin of [
      "https://evil.example.com",
      "http://attacker.org:3000",
      "http://172.32.0.1:3000",
    ]) {
      const res = makeRes();
      const blocked = blockCrossSiteDEV(
        { url: "/_next/webpack-hmr", headers: { origin: badOrigin } },
        res,
        allowed,
        undefined,
      );
      assert.equal(blocked, true, `expected ${badOrigin} to be blocked`);
      assert.equal(res.statusCode, 403);
    }
  });
});
