#!/usr/bin/env node
/**
 * Pre-flight check for this project ("npm run doctor", also runs before
 * "npm run dev").
 *
 * It catches the handful of machine-setup problems that otherwise surface as
 * confusing compiler errors, in particular:
 *
 *   Error: Can't resolve 'tailwindcss' in 'C:\Users\TV-Serve\Documents'
 *
 * which happens when Next.js infers its workspace root from a stray lockfile in
 * a *parent* folder and then resolves CSS imports from there
 * (vercel/next.js#92978). `next.config.ts` now pins the root, so that specific
 * failure cannot come back — but the stray files are still worth cleaning up,
 * and this script reports where they are.
 *
 * It also catches the two ways a machine ends up running yesterday's code
 * after a `git pull`: a Node.js older than Next.js 16 supports, and
 * node_modules still holding the dependency versions from the last install
 * instead of the ones package.json now pins.
 *
 * Exits 1 only for problems that certainly break the dev server; everything
 * else is a warning, so a working setup is never blocked.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { compareSemver, isExactPin } from "./doctor-checks.mjs";


const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const problems = [];
const warnings = [];
const notes = [];

const OK = "\u2714";
const WARN = "\u26a0";
const BAD = "\u2716";

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function installedVersion(pkg) {
  const pkgJson = readJson(path.join(projectRoot, "node_modules", pkg, "package.json"));
  return pkgJson?.version ?? null;
}

function mtime(file) {
  try {
    return statSync(file).mtimeMs;
  } catch {
    return 0;
  }
}

// ── 0. Node.js version ────────────────────────────────────────────────────
// next@16 declares engines ">=20.9.0". An older Node (18.x is the common one
// on a shop PC installed years ago) crashes somewhere inside Next with errors
// that look like anything but an old runtime, so name it here instead.
// (compareSemver returns null for unparseable input, which compares false —
// the doctor never blocks on something it cannot read.)
if (compareSemver(process.version, "20.9.0") < 0) {
  problems.push(
    `Node ${process.version} is too old for Next.js 16 (needs 20.9.0 or newer). ` +
      "Install the current LTS from https://nodejs.org, reopen the terminal, then run this check again.",
  );
}

// ── 1. Dependencies ────────────────────────────────────────────────────────
const required = ["next", "react", "react-dom"];
const buildOnly = ["tailwindcss", "@tailwindcss/postcss"];

if (!existsSync(path.join(projectRoot, "node_modules"))) {
  problems.push("node_modules is missing. Run  npm install  in " + projectRoot);
} else {
  const missing = required.filter((pkg) => !installedVersion(pkg));
  if (missing.length) {
    problems.push(`node_modules is incomplete (missing ${missing.join(", ")}). Run  npm install`);
  }

  const missingBuild = buildOnly.filter((pkg) => !installedVersion(pkg));
  if (missingBuild.length) {
    problems.push(
      `missing ${missingBuild.join(", ")} — Tailwind is a devDependency, so it is ` +
        "skipped by `npm install --omit=dev` / `npm ci --production`. Run  npm install  " +
        "(without --omit=dev) on this machine.",
    );
  }

  // 1b. Installed versions match package.json. `git pull` can change
  // package.json without touching node_modules, and the dev server then runs
  // a mix of old and new code that fails in ways that look like anything but
  // a stale install. Exact pins only — ranges are npm's business.
  const rootPkg = readJson(path.join(projectRoot, "package.json")) ?? {};
  const pinned = { ...(rootPkg.dependencies ?? {}), ...(rootPkg.devDependencies ?? {}) };
  const drifted = Object.entries(pinned)
    .filter(([, wanted]) => isExactPin(wanted))
    .map(([pkg, wanted]) => [pkg, wanted, installedVersion(pkg)])
    .filter(([, wanted, installed]) => installed !== null && compareSemver(installed, wanted) !== 0);
  if (drifted.length) {
    warnings.push(
      `node_modules is out of date: ${drifted.map(([p, w, i]) => `${p} ${i} (package.json pins ${w})`).join(", ")}. ` +
        "Run  npm install  — after a git pull the dev server still loads the versions from the last install.",
    );
  }
}

// ── 2. Working directory ──────────────────────────────────────────────────
const cwd = path.resolve(process.cwd());
if (cwd !== projectRoot) {
  warnings.push(
    `started from ${cwd}, but the project is ${projectRoot}. Next's config loading, ` +
      "Tailwind's class scanning and the .next cache all assume the project folder. " +
      "cd into it first (or run start-cms.cmd on Windows).",
  );
}

// ── 3. Stray lockfiles above the project ──────────────────────────────────
// Next.js picks a workspace root by walking up until it finds a lockfile. An
// orphaned package-lock.json in C:\Users\<you> or C:\Users\<you>\Documents —
// the usual damage from running `npm install` in the wrong folder on Windows —
// makes Next resolve everything from that folder instead of the project.
const STRAY_MARKERS = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb", "bun.lock"];
const strays = [];
let dir = path.dirname(projectRoot);
for (let depth = 0; depth < 6; depth += 1) {
  for (const marker of STRAY_MARKERS) {
    const candidate = path.join(dir, marker);
    if (existsSync(candidate)) strays.push(candidate);
  }
  const parent = path.dirname(dir);
  if (parent === dir) break;
  dir = parent;
}
if (strays.length) {
  warnings.push(
    `lockfile(s) in a parent folder: ${strays.join(", ")}. Next.js normally treats that ` +
      "folder as the workspace root and then cannot find tailwindcss from the project " +
      "(vercel/next.js#92978). next.config.ts now pins turbopack.root, so it no longer " +
      "breaks this app, but delete those files if they are orphans.",
  );
}

// ── 4. Stale build cache ──────────────────────────────────────────────────
const nextDir = path.join(projectRoot, ".next");
if (!existsSync(nextDir)) {
  notes.push("no .next cache yet — the first compile takes a little longer.");
} else if (mtime(path.join(projectRoot, "package-lock.json")) > mtime(nextDir)) {
  warnings.push(
    "dependencies were installed after the .next cache was written. If the dev server " +
      "throws odd module or CSS errors, stop it and delete .next so it rebuilds from scratch.",
  );
}

// ── Report ────────────────────────────────────────────────────────────────
const nextVersion = installedVersion("next");
const tailwindVersion = installedVersion("tailwindcss");

console.log("NovaSign pre-flight check");
console.log(`  project  ${projectRoot}`);
console.log(`  node     ${process.version}`);
console.log(`  next     ${nextVersion ?? "not installed"}`);
if (tailwindVersion) console.log(`  tailwind ${tailwindVersion}`);
console.log("");

if (!problems.length && !warnings.length) {
  console.log(`${OK} everything looks good.`);
}
for (const note of notes) console.log(`${OK} ${note}`);
for (const warning of warnings) console.log(`${WARN} ${warning}`);
for (const problem of problems) console.log(`${BAD} ${problem}`);
console.log("");

if (problems.length) {
  console.log("Fix the problem(s) above, then try again.");
  process.exit(1);
}

console.log("Ready.");
