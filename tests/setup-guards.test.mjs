import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

import nextConfig from "../next.config.ts";
import postcssConfig from "../postcss.config.mjs";
import { compareSemver, isExactPin } from "../scripts/doctor-checks.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

/**
 * Guards for the setup bugs that made `next dev` fail on Windows with
 *
 *   Error: Can't resolve 'tailwindcss' in 'C:\Users\TV-Serve\Documents'
 *
 * Next.js inferred the workspace root from a stray lockfile in a parent folder
 * (here: Documents) and resolved CSS imports from there; Tailwind's own
 * `base` option defaults to the working directory and had the same problem.
 * See vercel/next.js#92978.
 */
describe("build setup guards", () => {
  it("pins the Next.js workspace root to the project, never a parent folder", () => {
    const values = [
      ["turbopack.root", nextConfig.turbopack?.root],
      ["outputFileTracingRoot", nextConfig.outputFileTracingRoot],
    ];
    for (const [name, value] of values) {
      assert.equal(typeof value, "string", `${name} must be set`);
      assert.ok(path.isAbsolute(value), `${name} must be an absolute path, got ${value}`);
      assert.notEqual(
        path.resolve(value),
        path.dirname(projectRoot),
        `${name} must not be the parent of the project folder`,
      );
    }
  });

  it("pins Tailwind's base directory to the project", () => {
    const options = postcssConfig.plugins["@tailwindcss/postcss"];
    assert.equal(options.base, projectRoot);
    assert.equal(path.dirname(options.base), path.dirname(projectRoot));
  });

  it("resolves the tailwindcss package from the project's node_modules", () => {
    // The exact module Tailwind's `@import "tailwindcss"` needs at build time.
    assert.ok(require.resolve("tailwindcss", { paths: [projectRoot] }));
  });

  it("compiles globals.css with the configured plugins", async () => {
    const options = postcssConfig.plugins["@tailwindcss/postcss"];
    const from = path.join(projectRoot, "src", "app", "globals.css");
    const result = await postcss([tailwind(options)]).process(
      `${readFileSync(from, "utf8")}\n.sg-guard-probe { color: var(--color-white); }\n`,
      { from },
    );

    assert.ok(result.css.length > 10_000, "Tailwind should emit its full layer set");
    assert.match(result.css, /--tw-/);
    assert.match(result.css, /\.sg-guard-probe/);
  });

  /**
   * Tailwind v4's automatic source detection walks up from globals.css, so in
   * `next dev` it also read files inside .next — including the compiled copy
   * of globals.css itself. Junk candidates found there were emitted as real
   * rules (`.[key:\e !4ng] { key: !4ng; }`), the next scan read those back,
   * and the stylesheet eventually stopped parsing:
   *
   *   ./src/app/globals.css:222:11  Parsing CSS source code failed
   *   Unexpected token Delim('!')
   *
   * which 500s every route. Pinning the sources stops the feedback loop.
   */
  it("scans only hand-written sources, so the generated CSS cannot feed back in", async () => {
    const css = readFileSync(path.join(projectRoot, "src", "app", "globals.css"), "utf8");
    assert.match(css, /@import\s+"tailwindcss"\s+source\(none\)/, "auto source detection must be off");
    assert.match(css, /@source\s+"\.\.\/\*\*\/\*\.\{ts,tsx\}"/, "explicit @source list must cover src/**/*.{ts,tsx}");
    assert.doesNotMatch(css, /@source[^;]*\.next/, "never scan the build output");

    const options = postcssConfig.plugins["@tailwindcss/postcss"];
    const from = path.join(projectRoot, "src", "app", "globals.css");
    const result = await postcss([tailwind(options)]).process(css, { from });

    // No candidate may contain control characters or non-ASCII text: those are
    // the fingerprints of a binary/generated file being scanned.
    const escaped = result.css.match(/^[ \t]*\.\\\\\[[^\]]*\][^{]*\{/gm) ?? [];
    for (const rule of escaped) {
      assert.doesNotMatch(rule, /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffd]/, `junk candidate in ${rule}`);
    }
    assert.doesNotMatch(result.css, /key:\s*!4ng/, "the poisoned .[key:!4ng] rule must never be emitted");
  });

  it("pre-flight check passes from a healthy checkout", () => {
    const output = execFileSync(process.execPath, [path.join(projectRoot, "scripts", "doctor.mjs")], {
      cwd: projectRoot,
      encoding: "utf8",
    });
    assert.match(output, /NovaSign pre-flight check/);
    assert.match(output, /Ready\./);
    assert.doesNotMatch(output, /out of date/, "a fresh install must not report version drift");
  });

  it("Windows launcher starts from its own folder", () => {
    const launcher = readFileSync(path.join(projectRoot, "start-cms.cmd"), "utf8");
    assert.match(launcher, /cd \/d "%~dp0"/i);
  });

  /**
   * Next.js 16 renamed the `middleware` file convention to `proxy` and prints
   *   ⚠ The "middleware" file convention is deprecated.
   * on every dev-server start. Keeping both files around is worse: Next warns
   * that only one to the app root is used, and the auth checks would silently
   * run from whichever copy it picked. This guard pins the new convention.
   */
  it("uses the Next.js 16 proxy convention, not the deprecated middleware one", () => {
    const hasMiddlewareFile = ["middleware.ts", "middleware.js", "middleware.tsx", "middleware.jsx"].some(
      (file) => existsSync(path.join(projectRoot, "src", file)) || existsSync(path.join(projectRoot, file)),
    );
    assert.equal(hasMiddlewareFile, false, "src/middleware.ts is deprecated in Next.js 16 — use src/proxy.ts");
    assert.ok(existsSync(path.join(projectRoot, "src", "proxy.ts")), "src/proxy.ts must exist");

    const proxy = readFileSync(path.join(projectRoot, "src", "proxy.ts"), "utf8");
    assert.match(proxy, /export async function proxy\(/, "src/proxy.ts must export a function named `proxy`");
  });
});

/**
 * The doctor's version checks: a shop PC that pulls new code without
 * reinstalling (or with a Node.js from before Next.js 16) must be told so by
 * name, because the failure modes look like anything but a stale machine.
 */
describe("doctor version checks", () => {
  it("compares plain semantic versions", () => {
    assert.equal(compareSemver("v22.22.3", "20.9.0"), 1);
    assert.equal(compareSemver("18.20.4", "20.9.0"), -1);
    assert.equal(compareSemver("20.9.0", "v20.9.0"), 0);
    assert.equal(compareSemver("16.2.6-rc.1", "16.2.6"), 0); // prerelease tolerated
    assert.equal(compareSemver("not-a-version", "1.0.0"), null);
  });

  it("recognises exact pins only", () => {
    assert.equal(isExactPin("16.2.6"), true);
    assert.equal(isExactPin("^16.2.6"), false);
    assert.equal(isExactPin("~4.1"), false);
    assert.equal(isExactPin("*"), false);
    assert.equal(isExactPin("workspace:*"), false);
    assert.equal(isExactPin(undefined), false);
  });

  it("warns — without blocking — when node_modules lags behind package.json", () => {
    // Simulates `git pull` bumping a pin while node_modules keeps the version
    // from the last install. The doctor runs from a throwaway copy of itself
    // so the real checkout is untouched.
    const dir = mkdtempSync(path.join(tmpdir(), "novasign-doctor-"));
    try {
      mkdirSync(path.join(dir, "scripts"));
      cpSync(path.join(projectRoot, "scripts", "doctor.mjs"), path.join(dir, "scripts", "doctor.mjs"));
      cpSync(path.join(projectRoot, "scripts", "doctor-checks.mjs"), path.join(dir, "scripts", "doctor-checks.mjs"));
      writeFileSync(
        path.join(dir, "package.json"),
        JSON.stringify({
          name: "drift-sim",
          dependencies: { next: "16.9.0", react: "19.2.6", "react-dom": "19.2.6" },
          devDependencies: { tailwindcss: "4.1.17", "@tailwindcss/postcss": "4.1.17" },
        }),
      );
      const installed = [
        ["next", "16.2.6"], // stale — the point of the test
        ["react", "19.2.6"],
        ["react-dom", "19.2.6"],
        ["tailwindcss", "4.1.17"],
        ["@tailwindcss/postcss", "4.1.17"],
      ];
      for (const [pkg, version] of installed) {
        mkdirSync(path.join(dir, "node_modules", pkg), { recursive: true });
        writeFileSync(
          path.join(dir, "node_modules", pkg, "package.json"),
          JSON.stringify({ name: pkg, version }),
        );
      }

      const output = execFileSync(process.execPath, [path.join(dir, "scripts", "doctor.mjs")], {
        cwd: dir,
        encoding: "utf8",
      });

      assert.match(output, /node_modules is out of date: next 16\.2\.6 \(package\.json pins 16\.9\.0\)/);
      assert.match(output, /npm install/);
      assert.match(output, /Ready\./); // a warning never blocks the dev server
      assert.doesNotMatch(output, /react 19\.2\.6 \(package\.json pins/); // matching pins stay silent
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
