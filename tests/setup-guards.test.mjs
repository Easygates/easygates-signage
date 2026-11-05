import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

import nextConfig from "../next.config.ts";
import postcssConfig from "../postcss.config.mjs";

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

  it("pre-flight check passes from a healthy checkout", () => {
    const output = execFileSync(process.execPath, [path.join(projectRoot, "scripts", "doctor.mjs")], {
      cwd: projectRoot,
      encoding: "utf8",
    });
    assert.match(output, /NovaSign pre-flight check/);
    assert.match(output, /Ready\./);
  });

  it("Windows launcher starts from its own folder", () => {
    const launcher = readFileSync(path.join(projectRoot, "start-cms.cmd"), "utf8");
    assert.match(launcher, /cd \/d "%~dp0"/i);
  });
});
