// Resolution priority: schedule override > display playlist > first playlist > demo
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const pad = (n) => String(n).padStart(2, "0");

// Wall-clock day / HH:MM in the business time zone (default Europe/London),
// mirroring /api/player's scheduleNow().
function zoned(now, timezone = "Europe/London") {
  let tz = timezone;
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
  } catch {
    tz = "Europe/London"; // mirror of normalizeBrand() sanitising bad zones
  }
  const local = new Date(now.toLocaleString("en-US", { timeZone: tz }));
  return { day: String(local.getDay()), hhmm: `${pad(local.getHours())}:${pad(local.getMinutes())}` };
}

function resolve({ displayPlaylist, schedules, firstPlaylist, now, timezone }) {
  const { day, hhmm } = zoned(now, timezone);
  const cands = (schedules || []).filter((s) => {
    if (!s.enabled) return false;
    if (s.days && !s.days.split(",").includes(day)) return false;
    if (s.startTime && hhmm < s.startTime) return false;
    if (s.endTime && hhmm > s.endTime) return false;
    return true;
  });
  cands.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  if (cands[0]) return { mode: "schedule", playlist: cands[0].playlistId };
  if (displayPlaylist) return { mode: "playlist", playlist: displayPlaylist };
  if (firstPlaylist) return { mode: "playlist", playlist: firstPlaylist };
  return { mode: "demo" };
}

describe("player resolution", () => {
  it("prefers enabled schedule in its window", () => {
    const now = new Date("2026-05-12T12:00:00"); // a Tuesday
    const r = resolve({ displayPlaylist: "A", firstPlaylist: "B", now, schedules: [{ playlistId: "LUNCH", enabled: true, days: "2", startTime: "11:00", endTime: "14:00", priority: 5 }] });
    assert.equal(r.playlist, "LUNCH");
  });

  it("ignores schedules outside their window", () => {
    const now = new Date("2026-05-12T18:00:00");
    const r = resolve({ displayPlaylist: "A", firstPlaylist: "B", now, schedules: [{ playlistId: "LUNCH", enabled: true, days: "2", startTime: "11:00", endTime: "14:00", priority: 5 }] });
    assert.equal(r.playlist, "A");
  });

  it("falls back to demo with nothing configured", () => {
    const r = resolve({ now: new Date(), schedules: [] });
    assert.equal(r.mode, "demo");
  });

  it("evaluates schedule windows in the business time zone (default Europe/London)", () => {
    // 2026-06-15T08:00Z = 09:00 BST Monday. In server UTC it is 08:00 and
    // would fall outside a 09:00-17:00 window; in London time it matches.
    const now = new Date("2026-06-15T08:00:00Z");
    const r = resolve({
      now,
      timezone: "Europe/London",
      schedules: [{ playlistId: "LUNCH", enabled: true, days: "1", startTime: "09:00", endTime: "17:00", priority: 5 }],
    });
    assert.equal(r.playlist, "LUNCH");
  });

  it("keeps GMT right in winter", () => {
    // 2026-01-12T09:00Z = 09:00 GMT Monday.
    const now = new Date("2026-01-12T09:00:00Z");
    const r = resolve({
      now,
      timezone: "Europe/London",
      schedules: [{ playlistId: "LUNCH", enabled: true, days: "1", startTime: "09:00", endTime: "17:00", priority: 5 }],
    });
    assert.equal(r.playlist, "LUNCH");
  });

  it("falls back to the default time zone for an unknown zone", () => {
    const now = new Date("2026-06-15T08:00:00Z"); // 09:00 BST
    const r = resolve({
      now,
      timezone: "Not/AZone",
      schedules: [{ playlistId: "LUNCH", enabled: true, days: "1", startTime: "09:00", endTime: "17:00", priority: 5 }],
    });
    assert.equal(r.playlist, "LUNCH");
  });

  it("ignores the schedule outside the zoned window", () => {
    const now = new Date("2026-06-15T16:30:00Z"); // 17:30 BST → outside 09:00-17:00
    const r = resolve({
      now,
      schedules: [{ playlistId: "LUNCH", enabled: true, days: "1", startTime: "09:00", endTime: "17:00", priority: 5 }],
    });
    assert.equal(r.mode, "demo");
  });
});
