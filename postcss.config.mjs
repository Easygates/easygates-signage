import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * PostCSS configuration for Tailwind CSS v4.
 *
 * `base` is derived from this file's own location instead of `process.cwd()`, so
 * class detection always scans this project. Tailwind defaults `base` to the
 * working directory, which goes wrong whenever the server is started from
 * somewhere else (a Windows shortcut, a service wrapper, `next dev <folder>`).
 *
 * Note: Next.js only accepts PostCSS plugins *by module name* here, so all
 * workarounds for module resolution have to live in `next.config.ts`
 * (`turbopack.root`) rather than in this file.
 */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const postcssConfig = {
  plugins: {
    "@tailwindcss/postcss": { base: projectRoot },
  },
};

export default postcssConfig;
