// The shop-PC launcher (start-server.cmd): production server, rebuilds when the code changed, restarts itself
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

describe("start-server.cmd", () => {
  const cmd = read("start-server.cmd");
  it("runs the production server, not the dev server", () => {
    assert.match(cmd, /call npm start/);
    assert.doesNotMatch(cmd.replace(/^rem .*$/gim, ""), /npm run dev/);
  });
  it("builds when there is no build or the commit changed since the last one", () => {
    assert.match(cmd, /\.next\\BUILD_ID/);
    assert.match(cmd, /git rev-parse HEAD/);
    assert.match(cmd, /built-commit\.txt/);
    assert.match(cmd, /call npm run build/);
  });
  it("starts the server again by itself when it stops", () => {
    assert.match(cmd, /:run\r?\ncall npm start[\s\S]*goto :run/);
  });
  it("every goto has a label", () => {
    for (const m of cmd.matchAll(/goto :(\w+)/g)) assert.match(cmd, new RegExp(`^:${m[1]}\\s*$`, "m"), `missing label :${m[1]}`);
  });
  it("does not put brackets in echo text inside a block (they end the block early in cmd)", () => {
    // any line between an opening "(" block and its ")" that echoes text containing ( or )
    let depth = 0;
    for (const line of cmd.split(/\r?\n/)) {
      const t = line.trim();
      if (/^rem /i.test(t)) continue;
      if (depth > 0 && /^echo\b/i.test(t)) assert.doesNotMatch(t.replace(/^echo\s*/i, ""), /[()]/, `bracket in echo inside a block: ${t}`);
      if (/\($/.test(t)) depth++;
      if (t === ")") depth--;
    }
  });
});

describe("Windows line endings", () => {
  it("batch files are checked out with CRLF", () => {
    assert.match(read(".gitattributes"), /\*\.cmd text eol=crlf/);
  });
});

describe("the guide", () => {
  it("README and /docs explain start at sign-in, auto sign-in and power-on after a cut", () => {
    for (const src of [read("README.md"), read("src/app/docs/page.tsx")]) {
      assert.match(src, /shell:startup/);
      assert.match(src, /netplwiz/);
      assert.match(src, /Restore on AC Power Loss/);
      assert.match(src, /start-server\.cmd/);
    }
  });
});
