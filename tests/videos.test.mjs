// The videos folder (public/videos) and the two EasyGates Direct video templates
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cleanVideoPath, parseRange, prettySize, videoMime, videoUrlFor } from "../src/lib/videoFiles.ts";
import { scrimStrength, shapeRatio, windowShape, windowSize } from "../src/components/scene/templates/videoKit.ts";
import { TEMPLATE_FIELDS, templateRows, templateUses } from "../src/lib/templateFields.ts";
import { EASYGATES_DEMO_SCENES } from "../src/lib/signage.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

describe("videoMime", () => {
  it("serves mp4, m4v and webm, in any case, and nothing else", () => {
    assert.equal(videoMime("a.mp4"), "video/mp4");
    assert.equal(videoMime("A B.MP4"), "video/mp4");
    assert.equal(videoMime("a.m4v"), "video/mp4");
    assert.equal(videoMime("a.webm"), "video/webm");
    for (const bad of ["a.exe", "a.js", "a.txt", "a.mov", "a", "mp4", "a.mp4.exe", ".mp4x"]) assert.equal(videoMime(bad), null, bad);
  });
});

describe("cleanVideoPath (what a request may ask for)", () => {
  it("accepts a file and files in sub-folders, decoding %20", () => {
    assert.equal(cleanVideoPath(["showroom.mp4"]), "showroom.mp4");
    assert.equal(cleanVideoPath(["clips", "gate%20demo.mp4"]), "clips/gate demo.mp4");
  });
  it("refuses anything that could leave the folder or is not a video", () => {
    const bad = [
      [],
      [".."],
      ["..", "secret.mp4"],
      ["a", "..", "b.mp4"],
      ["%2e%2e", "x.mp4"],
      ["..%2Fx.mp4"],
      ["a%5Cb.mp4"],
      ["C:", "x.mp4"],
      [".hidden.mp4"],
      ["a", ".git", "x.mp4"],
      ["notes.txt"],
      ["x.mp4\0"],
      ["%"],
      ["", "x.mp4"],
      ["a", "b", "c", "d", "e", "f", "g.mp4"],
    ];
    for (const segs of bad) assert.equal(cleanVideoPath(segs), null, JSON.stringify(segs));
  });
});

describe("videoUrlFor", () => {
  it("builds the address a screen uses, escaping each part", () => {
    assert.equal(videoUrlFor("clips/gate demo #1.mp4"), "/api/videos/clips/gate%20demo%20%231.mp4");
    // …and cleanVideoPath reads it back
    const url = videoUrlFor("clips/gate demo #1.mp4");
    assert.equal(cleanVideoPath(url.replace("/api/videos/", "").split("/")), "clips/gate demo #1.mp4");
  });
});

describe("parseRange (so TVs can start playing at once and loop)", () => {
  it("reads open, closed and tail ranges", () => {
    assert.deepEqual(parseRange("bytes=0-", 1000), { start: 0, end: 999 });
    assert.deepEqual(parseRange("bytes=100-199", 1000), { start: 100, end: 199 });
    assert.deepEqual(parseRange("bytes=-200", 1000), { start: 800, end: 999 });
    assert.deepEqual(parseRange("bytes=900-5000", 1000), { start: 900, end: 999 }, "the end is clamped to the file");
    assert.deepEqual(parseRange("bytes=-5000", 1000), { start: 0, end: 999 }, "a tail longer than the file is the whole file");
  });
  it("sends the whole file when there is no usable header", () => {
    assert.equal(parseRange(null, 1000), null);
    assert.equal(parseRange("", 1000), null);
    assert.equal(parseRange("items=0-5", 1000), null);
    assert.equal(parseRange("bytes=0-5,10-20", 1000), null, "multi-range is ignored");
    assert.equal(parseRange("bytes=-", 1000), null);
  });
  it("says 416 when the range cannot be satisfied", () => {
    for (const h of ["bytes=1000-", "bytes=2000-3000", "bytes=500-100", "bytes=-0"]) assert.equal(parseRange(h, 1000), "invalid", h);
    assert.equal(parseRange("bytes=0-", 0), "invalid", "an empty file has no ranges");
  });
});

describe("prettySize", () => {
  it("reads naturally", () => {
    assert.equal(prettySize(512), "512 B");
    assert.equal(prettySize(139392), "136 KB");
    assert.equal(prettySize(5.5 * 1024 * 1024), "5.5 MB");
    assert.equal(prettySize(2 * 1024 ** 3), "2.00 GB");
    assert.equal(prettySize(-1), "");
  });
});

describe("window shapes", () => {
  it("knows its four shapes, and treats anything else (even the editor's default 'A') as wide", () => {
    assert.equal(windowShape("cinema"), "cinema");
    assert.equal(windowShape(" Square "), "square");
    assert.equal(windowShape("PORTRAIT"), "portrait");
    for (const v of ["A", "", undefined, null, "left", "wide "]) assert.equal(windowShape(v), "wide", String(v));
  });
  it("fits the biggest window of the shape into the space, never stretched", () => {
    const wide = windowSize(shapeRatio("wide"), 1800, 700);
    assert.ok(wide.w <= 1800 && wide.h <= 700);
    assert.ok(Math.abs(wide.w / wide.h - 16 / 9) < 0.02, "keeps 16:9");
    const sq = windowSize(1, 1800, 700);
    assert.deepEqual(sq, { w: 700, h: 700 });
    const tall = windowSize(shapeRatio("portrait"), 1800, 700);
    assert.ok(tall.h === 700 && Math.abs(tall.w / tall.h - 0.75) < 0.01);
    const strip = windowSize(shapeRatio("cinema"), 1000, 900);
    assert.ok(strip.w === 1000 && strip.h < 500, "a cinema strip is limited by width");
  });
  it("gives nothing when there is no room", () => {
    assert.deepEqual(windowSize(16 / 9, 0, 500), { w: 0, h: 0 });
    assert.deepEqual(windowSize(0, 500, 500), { w: 0, h: 0 });
  });
  it("keeps the caption scrim readable but not solid", () => {
    assert.ok(scrimStrength(0) >= 0.35);
    assert.ok(scrimStrength(100) <= 0.92);
    assert.ok(scrimStrength(undefined) > 0.5);
  });
});

describe("the two templates are wired in", () => {
  it("the editor offers the video field and no rows, and the slide image is not used", () => {
    for (const id of ["eg-video-full", "eg-video-window"]) {
      assert.ok(TEMPLATE_FIELDS[id], id);
      assert.equal(templateUses(id, "videoUrl"), true, `${id} draws the video`);
      assert.equal(templateRows(id).length, 0, `${id} has no rows`);
      assert.equal(templateUses(id, "imageUrl"), false, `${id} does not draw the slide image`);
    }
    assert.equal(templateUses("eg-video-window", "productName"), true, "the corner label");
    assert.equal(templateUses("eg-video-full", "description"), false);
  });
  it("both have a sample slide that plays the bundled demo clip", () => {
    for (const t of ["eg-video-full", "eg-video-window"]) {
      const scene = EASYGATES_DEMO_SCENES.find((s) => s.template === t);
      assert.ok(scene, `${t} needs a demo slide`);
      assert.equal(scene.videoUrl, "/api/videos/demo-easygates-loop.mp4");
    }
    assert.ok(existsSync(join(root, "public/videos/demo-easygates-loop.mp4")), "the demo clip must ship with the app");
    assert.ok(statSync(join(root, "public/videos/demo-easygates-loop.mp4")).size < 2_000_000, "keep the demo clip small");
  });
  it("the player draws them, and loops them muted so autoplay is allowed", () => {
    const renderer = read("src/components/SceneRenderer.tsx");
    assert.match(renderer, /t === "eg-video-full"/);
    assert.match(renderer, /t === "eg-video-window"/);
    const parts = read("src/components/scene/templates/videoParts.tsx");
    for (const attr of ["autoPlay", "muted", "loop", "playsInline"]) assert.match(parts, new RegExp(`\\b${attr}\\b`), attr);
    assert.match(parts, /objectFit/, "the video is cropped with object-fit, not stretched");
  });
  it("the videos folder ships with a readme and keeps users' videos out of git", () => {
    assert.ok(existsSync(join(root, "public/videos/README.txt")));
    const ignore = read(".gitignore");
    assert.match(ignore, /^\/public\/videos\/\*$/m);
    assert.match(ignore, /^!\/public\/videos\/README\.txt$/m);
  });
  it("the editor lists the folder, offers the shape and can match the slide length to the video", () => {
    const admin = read("src/app/admin/page.tsx");
    assert.match(admin, /fetch\("\/api\/videos"/);
    assert.match(admin, /VIDEOS FOLDER/);
    assert.match(admin, /Window shape/);
    assert.match(admin, /Set slide length to/);
  });
  it("the video route streams with Range and cannot be pointed outside the folder", () => {
    const route = read("src/app/api/videos/[...path]/route.ts");
    assert.match(route, /cleanVideoPath/);
    assert.match(route, /parseRange/);
    assert.match(route, /Content-Range/);
    assert.match(route, /path\.relative\(root, file\)/);
  });
});
