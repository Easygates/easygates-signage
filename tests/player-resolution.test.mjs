// Resolution priority: schedule override > display playlist > first playlist > demo
import { describe, it } from "node:test";
import assert from "node:assert/strict";

function resolve({ displayPlaylist, schedules, firstPlaylist, now }) {
  const day = String(now.getDay());
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
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
});
