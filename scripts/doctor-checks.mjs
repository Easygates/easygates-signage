/**
 * Pure helpers for scripts/doctor.mjs, split out so the test suite
 * (tests/setup-guards.test.mjs) can exercise the version logic without
 * running the doctor's filesystem checks.
 *
 * Only plain `x.y.z` versions are handled — enough for the exact pins this
 * project keeps in package.json. Anything fancier parses to `null` and the
 * doctor skips the check rather than guessing.
 */

const SEMVER = /^(?:v)?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/;

/**
 * "16.2.6" / "v22.22.3" / "1.2.3-canary.4" → [16, 2, 6]-style triple,
 * or null for anything that is not a plain semantic version.
 */
export function parseSemver(version) {
  const match = SEMVER.exec(String(version ?? "").trim());
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * -1 / 0 / 1 comparing two versions, or null when either side is not a
 * plain x.y.z. Prerelease suffixes are ignored ("16.2.6-rc.1" equals
 * "16.2.6"), which is the conservative choice for an advisory check.
 */
export function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  }
  return 0;
}

/**
 * True only for exact pins ("16.2.6"). Ranges ("^16.2.6", "~4.1", "*", …)
 * return false so the doctor leaves range resolution to npm itself.
 */
export function isExactPin(range) {
  return /^\d+\.\d+\.\d+$/.test(String(range ?? "").trim());
}
