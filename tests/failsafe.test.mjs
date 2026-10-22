// Failsafe behaviour: what a screen shows when the CMS can't be reached, and
// whether an animation preset's entrance geometry is genuinely distinct.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_FAILSAFE, FAILSAFE_MODES, normalizeFailsafe, resolveFailsafe } from "../src/lib/failsafe.ts";
import { ALL_DEMO_SCENES, ANIMATION_PRESETS, FAILSAFE_SCENES, presetVars } from "../src/lib/signage.ts";

const installPack = ["a", "b", "c"];

describe("failsafe settings", () => {
  it("defaults to keeping the last playlist the screen played", () => {
    assert.equal(DEFAULT_FAILSAFE.mode, "cache");
    assert.equal(DEFAULT_FAILSAFE.playlistId, "");
    assert.equal(normalizeFailsafe(undefined).mode, "cache");
    assert.equal(normalizeFailsafe(null).mode, "cache");
  });

  it("has exactly three documented modes", () => {
    assert.deepEqual(
      FAILSAFE_MODES.map((m) => m.id),
      ["cache", "playlist", "install"]
    );
    for (const m of FAILSAFE_MODES) assert.ok(m.name && m.blurb, `${m.id} needs UI copy`);
  });

  it("rejects an unknown mode instead of trusting stored JSON", () => {
    assert.equal(normalizeFailsafe({ mode: "something-else" }).mode, "cache");
    assert.equal(normalizeFailsafe({ mode: "INSTALL" }).mode, "cache");
  });

  it("never leaves 'playlist' mode without a playlist to play", () => {
    assert.equal(normalizeFailsafe({ mode: "playlist" }).mode, "cache");
    assert.equal(normalizeFailsafe({ mode: "playlist", playlistId: "   " }).mode, "cache");
    assert.deepEqual(normalizeFailsafe({ mode: "playlist", playlistId: " pl-1 " }), {
      mode: "playlist",
      playlistId: "pl-1",
    });
  });

  it("trims and caps a stored playlist id", () => {
    const long = "x".repeat(200);
    assert.equal(normalizeFailsafe({ playlistId: long }).playlistId.length, 64);
  });
});

describe("failsafe resolution", () => {
  it("cache mode plays the last playlist this screen actually played", () => {
    const r = resolveFailsafe({ mode: "cache", playlistId: "" }, {
      lastPlayed: ["live-1", "live-2"],
      pinned: { playlistId: "p1", scenes: ["pinned"] },
      installPack,
    });
    assert.equal(r.source, "last-played");
    assert.deepEqual(r.scenes, ["live-1", "live-2"]);
  });

  it("playlist mode prefers the pre-downloaded copy of the pinned playlist", () => {
    const r = resolveFailsafe({ mode: "playlist", playlistId: "p1" }, {
      lastPlayed: ["live"],
      pinned: { playlistId: "p1", scenes: ["pinned-1", "pinned-2"] },
      installPack,
    });
    assert.equal(r.source, "pinned-playlist");
    assert.deepEqual(r.scenes, ["pinned-1", "pinned-2"]);
  });

  it("ignores a downloaded copy of a different playlist", () => {
    const r = resolveFailsafe({ mode: "playlist", playlistId: "p2" }, {
      lastPlayed: ["live"],
      pinned: { playlistId: "p1", scenes: ["stale"] },
      installPack,
    });
    assert.equal(r.source, "last-played");
    assert.deepEqual(r.scenes, ["live"]);
  });

  it("falls back to the last played set if the download never completed", () => {
    const r = resolveFailsafe({ mode: "playlist", playlistId: "p1" }, {
      lastPlayed: ["live"],
      pinned: null,
      installPack,
    });
    assert.equal(r.source, "last-played");
  });

  it("install mode always shows the bundled pack, even when a cache exists", () => {
    const r = resolveFailsafe({ mode: "install", playlistId: "" }, {
      lastPlayed: ["live"],
      pinned: { playlistId: "p1", scenes: ["pinned"] },
      installPack,
    });
    assert.equal(r.source, "install-pack");
    assert.deepEqual(r.scenes, installPack);
  });

  it("never returns an empty slide list — a screen is never blank", () => {
    for (const mode of ["cache", "playlist", "install"]) {
      const r = resolveFailsafe({ mode, playlistId: mode === "playlist" ? "p1" : "" }, {
        lastPlayed: null,
        pinned: null,
        installPack,
      });
      assert.equal(r.source, "install-pack");
      assert.deepEqual(r.scenes, installPack);
    }
  });

  it("accepts a bare mode string (the player passes what the API sent)", () => {
    assert.deepEqual(resolveFailsafe("install", { installPack }).scenes, installPack);
    assert.equal(resolveFailsafe(null, { lastPlayed: ["x"], installPack }).source, "last-played");
  });
});

describe("animation presets have a distinct entrance style", () => {
  const ids = Object.keys(ANIMATION_PRESETS);

  it("keeps the five documented presets", () => {
    assert.deepEqual(ids, ["launch", "smooth", "cinematic", "snap", "elegant"]);
  });

  it("each preset defines rise, scale and pop geometry", () => {
    for (const id of ids) {
      const p = ANIMATION_PRESETS[id];
      assert.equal(typeof p.rise, "number", `${id}.rise`);
      assert.ok(p.rise >= 0, `${id}.rise must not be negative`);
      assert.ok(p.scaleFrom > 0, `${id}.scaleFrom`);
      assert.ok(p.popFrom > 0 && p.popFrom <= 1, `${id}.popFrom`);
    }
  });

  it("no two presets share the same entrance geometry", () => {
    const shapes = ids.map((id) => {
      const p = ANIMATION_PRESETS[id];
      return `${p.rise}|${p.scaleFrom}|${p.popFrom}`;
    });
    assert.equal(new Set(shapes).size, ids.length);
  });

  it("cinematic settles from over-scale while elegant barely travels", () => {
    assert.ok(ANIMATION_PRESETS.cinematic.scaleFrom > 1);
    assert.ok(ANIMATION_PRESETS.elegant.rise < ANIMATION_PRESETS.launch.rise);
    assert.equal(ANIMATION_PRESETS.elegant.scaleFrom, 1);
  });

  it("publishes the geometry as CSS variables", () => {
    for (const id of ids) {
      const v = presetVars(ANIMATION_PRESETS[id]);
      assert.equal(v["--sg-rise"], `${ANIMATION_PRESETS[id].rise}px`);
      assert.equal(v["--sg-scale-from"], String(ANIMATION_PRESETS[id].scaleFrom));
      assert.equal(v["--sg-pop-from"], String(ANIMATION_PRESETS[id].popFrom));
    }
  });
});

describe("built-in failsafe pack", () => {
  it("is the offline-safe part of the library, so an outage doesn't loop eight slides", () => {
    assert.ok(FAILSAFE_SCENES.length >= 20);
    assert.ok(FAILSAFE_SCENES.length < ALL_DEMO_SCENES.length, "scenes with hosted photos are excluded");
  });

  it("uses bundled media only — it has to work with no internet", () => {
    for (const sc of FAILSAFE_SCENES) {
      assert.ok(
        !sc.imageUrl || sc.imageUrl.startsWith("/") || sc.imageUrl.startsWith("data:"),
        `${sc.id} points at ${sc.imageUrl}`
      );
    }
  });

  it("has no duplicate ids (a playlist keyed by id must not collide)", () => {
    assert.equal(new Set(FAILSAFE_SCENES.map((s) => s.id)).size, FAILSAFE_SCENES.length);
  });
});
