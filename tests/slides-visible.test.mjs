// Guard: in a slide, an element with class "sg-anim" starts at opacity 0 and only becomes visible
// through an entrance animation class. "sg-anim" on its own = content that never appears.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const ENTRANCE = ["sg-fade-up", "sg-fade-down", "sg-fade", "sg-scale-in", "sg-pop", "sg-price", "sg-slide-l", "sg-slide-r", "sg-wipe-x", "sg-float"];
const dirs = ["src/components/scene/templates", "src/components/scene"];
const files = [
  "src/components/SceneRenderer.tsx",
  ...dirs.flatMap((d) => readdirSync(d).filter((f) => f.endsWith(".tsx")).map((f) => `${d}/${f}`)),
];

describe("slides never leave content invisible", () => {
  for (const file of [...new Set(files)]) {
    it(file, () => {
      const src = readFileSync(file, "utf8");
      const bad = [];
      for (const m of src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
        const cls = m[1] ?? m[2] ?? "";
        const tokens = cls.split(/\s+/);
        if (!tokens.includes("sg-anim")) continue;
        if (!ENTRANCE.some((e) => cls.includes(e))) {
          bad.push(src.slice(0, m.index).split("\n").length + ": " + cls.slice(0, 90));
        }
      }
      assert.deepEqual(bad, [], "sg-anim without an entrance class:\n" + bad.join("\n"));
    });
  }
});
