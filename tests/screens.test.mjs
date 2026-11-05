// Screen numbers: ?displayId=1 / 2 / 3 as a short alias for a screen's long id
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_SCREEN_NUMBER, nextScreenNumber, parseScreenNumber, parseScreenRef, screenRefFor } from "../src/lib/screens.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const ID = "61248b2e-6f09-4dbf-841f-bb50daf05acc";

describe("parseScreenRef", () => {
  it("reads a long id, case-insensitively", () => {
    assert.deepEqual(parseScreenRef(ID), { kind: "id", id: ID });
    assert.deepEqual(parseScreenRef(ID.toUpperCase()), { kind: "id", id: ID });
  });
  it("reads a screen number", () => {
    assert.deepEqual(parseScreenRef("1"), { kind: "number", number: 1 });
    assert.deepEqual(parseScreenRef(" 12 "), { kind: "number", number: 12 });
    assert.deepEqual(parseScreenRef("9999"), { kind: "number", number: 9999 });
  });
  it("refuses anything else instead of reaching the database", () => {
    for (const bad of ["", "  ", null, undefined, "0", "-1", "10000", "1.5", "abc", "1;drop", "61248b2e", `${ID}x`]) {
      assert.equal(parseScreenRef(bad), null, `${JSON.stringify(bad)} should not parse`);
    }
  });
});

describe("parseScreenNumber", () => {
  it("accepts whole numbers 1–9999, as numbers or text", () => {
    assert.equal(parseScreenNumber(3), 3);
    assert.equal(parseScreenNumber("7"), 7);
    assert.equal(parseScreenNumber(" 42 "), 42);
    assert.equal(parseScreenNumber(MAX_SCREEN_NUMBER), MAX_SCREEN_NUMBER);
  });
  it("treats empty as 'no number'", () => {
    assert.equal(parseScreenNumber(""), null);
    assert.equal(parseScreenNumber(null), null);
  });
  it("rejects everything else", () => {
    for (const bad of [0, -2, 1.5, 10000, "abc", "1e3", "4 5", NaN, {}, [], true]) {
      assert.equal(parseScreenNumber(bad), undefined, `${JSON.stringify(bad)} should be invalid`);
    }
  });
});

describe("nextScreenNumber", () => {
  it("starts at 1 and counts up", () => {
    assert.equal(nextScreenNumber([]), 1);
    assert.equal(nextScreenNumber([1, 2, 3]), 4);
  });
  it("reuses the lowest gap, and ignores missing numbers", () => {
    assert.equal(nextScreenNumber([1, 3, 4]), 2);
    assert.equal(nextScreenNumber([null, undefined, 2]), 1);
  });
});

describe("screenRefFor", () => {
  it("uses the number when there is one, else the long id", () => {
    assert.equal(screenRefFor({ id: ID, screenNumber: 2 }), "2");
    assert.equal(screenRefFor({ id: ID, screenNumber: null }), ID);
    assert.equal(screenRefFor({ id: ID }), ID);
  });
});

describe("wiring", () => {
  it("the database has a unique screen_number, backfilled once", () => {
    const sql = read("supabase/schema.sql");
    assert.match(sql, /ADD COLUMN IF NOT EXISTS screen_number integer/);
    assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS idx_displays_screen_number/);
    assert.match(sql, /WHERE screen_number IS NULL/, "the backfill must only number screens that have no number");
    assert.match(read("src/db/schema.ts"), /uniqueIndex\("idx_displays_screen_number"\)/);
  });
  it("the player and heartbeat resolve screens through findDisplay (number or long id)", () => {
    assert.match(read("src/app/api/player/route.ts"), /findDisplay\(displayId\)/);
    assert.match(read("src/app/api/displays/[id]/heartbeat/route.ts"), /findDisplay\(id\)/);
  });
  it("a schedule bound to a screen still matches when the screen is addressed by number", () => {
    // the comparison must use the screen's real id, not the raw ?displayId= text
    assert.match(read("src/app/api/player/route.ts"), /s\.displayId !== screenId/);
  });
  it("new screens get the lowest free number, and a duplicate number is refused", () => {
    assert.match(read("src/app/api/displays/route.ts"), /nextScreenNumber/);
    assert.match(read("src/app/api/displays/[id]/route.ts"), /already used by/);
    assert.match(read("src/app/api/seed/route.ts"), /nextScreenNumber/);
  });
  it("the admin copies and opens the short address", () => {
    assert.match(read("src/app/admin/page.tsx"), /displayId=\$\{screenRefFor\(x\)\}/);
  });
});
