import { hostname as osHostname, networkInterfaces } from "node:os";

const PRIVATE_172_PATTERNS = Array.from(
  { length: 16 },
  (_, i) => `172.${16 + i}.*.*`,
);

/**
 * Default hostnames and LAN wildcard patterns allowed to load Next.js `/_next/*`
 * dev resources (including `/_next/webpack-hmr`) when `next dev` is opened via
 * a shop/LAN hostname or IP instead of `localhost`.
 */
export const DEFAULT_DEV_ORIGINS: readonly string[] = [
  "tv-serv",
  "tv-serv.local",
  "127.0.0.1",
  "[::1]",
  "*.local",
  "*.lan",
  "*.home.arpa",
  "192.168.*.*",
  "10.*.*.*",
  ...PRIVATE_172_PATTERNS,
];

const VALID_LABEL = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const IPV4 = /^\d+(?:\.\d+){3}$/;

export interface ResolveDevOriginsOptions {
  env?: NodeJS.ProcessEnv;
  hostname?: string;
  lanAddresses?: string[];
}

/**
 * Normalize an origin URL or host entry into the bare lowercase hostname
 * pattern expected by Next.js `allowedDevOrigins` (no scheme, port, or path).
 */
export function normalizeDevOrigin(raw: string): string {
  let s = raw.trim().toLowerCase();
  if (!s) return "";
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  s = s.replace(/[/?#].*$/, "");
  if (s.startsWith("[")) {
    const end = s.indexOf("]");
    return end !== -1 ? s.slice(0, end + 1) : "";
  }
  if (s === "::1") return "[::1]";
  return s.replace(/:\d+$/, "");
}

function detectLanAddresses(): string[] {
  const found: string[] = [];
  try {
    for (const addrs of Object.values(networkInterfaces())) {
      for (const a of addrs || []) {
        if (a.family === "IPv4" && !a.internal && a.address) {
          found.push(a.address);
        }
      }
    }
  } catch {
    // Locked-down containers may disallow enumerating network interfaces.
  }
  return found;
}

function safeOsHostname(): string {
  try {
    return osHostname();
  } catch {
    return "";
  }
}

export function resolveAllowedDevOrigins(
  opts: ResolveDevOriginsOptions = {},
): string[] {
  const env = opts.env ?? process.env;
  const origins = new Set<string>(DEFAULT_DEV_ORIGINS);

  const machineHost = normalizeDevOrigin(opts.hostname ?? safeOsHostname());
  if (machineHost && machineHost !== "localhost") {
    origins.add(machineHost);
    if (
      !IPV4.test(machineHost) &&
      !machineHost.startsWith("[") &&
      !machineHost.includes(":")
    ) {
      const short = machineHost.split(".")[0];
      if (
        short &&
        short !== "localhost" &&
        !/^\d+$/.test(short) &&
        VALID_LABEL.test(short)
      ) {
        origins.add(short);
        origins.add(`${short}.local`);
      }
    }
  }

  for (const ip of opts.lanAddresses ?? detectLanAddresses()) {
    const clean = normalizeDevOrigin(ip);
    if (clean) origins.add(clean);
  }

  if (env.E2B_SANDBOX_ID) {
    origins.add("*.e2b.app");
  }

  const extra = env.ALLOWED_DEV_ORIGINS ?? "";
  for (const part of extra.split(/[,\s]+/)) {
    const clean = normalizeDevOrigin(part);
    if (clean) origins.add(clean);
  }

  return [...origins];
}
