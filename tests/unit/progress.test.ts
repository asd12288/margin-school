import { describe, expect, it } from "vitest";

import { isComplete, toPercent } from "@/lib/progress";
import { coverGradient, coverSeriesPath, hashId } from "@/lib/cover";
import { sampleBlocks, sampleChapters } from "@/lib/fixtures/content";

describe("toPercent", () => {
  it("rounds to whole percentages", () => {
    expect(toPercent(11, 18)).toBe(61);
    expect(toPercent(1, 3)).toBe(33);
  });

  it("returns 0 for an empty unit rather than NaN", () => {
    // A chapter with no lessons is a real state while a course is being
    // authored. NaN would reach the DOM as aria-valuenow="NaN" and a
    // width: NaN% that the browser silently drops.
    expect(toPercent(0, 0)).toBe(0);
    expect(toPercent(5, 0)).toBe(0);
  });

  it("clamps above 100", () => {
    // Happens the moment an editor deletes a lesson someone had completed.
    expect(toPercent(20, 18)).toBe(100);
  });

  it("clamps below 0", () => {
    expect(toPercent(-3, 18)).toBe(0);
  });

  it("survives non-finite input", () => {
    expect(toPercent(Number.NaN, 10)).toBe(0);
    expect(toPercent(1, Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("isComplete", () => {
  it("is true only when everything is done", () => {
    expect(isComplete(18, 18)).toBe(true);
    expect(isComplete(17, 18)).toBe(false);
  });

  it("treats an over-count as complete", () => {
    expect(isComplete(20, 18)).toBe(true);
  });

  it("is never true for an empty unit", () => {
    // 0 of 0 is not an achievement.
    expect(isComplete(0, 0)).toBe(false);
  });
});

describe("cover derivation", () => {
  it("is deterministic for the same id", () => {
    // The whole feature rests on this: if a course's cover changed between
    // renders, the catalog would reshuffle its own artwork on every deploy.
    expect(hashId("co1")).toBe(hashId("co1"));
    expect(coverGradient("co1")).toEqual(coverGradient("co1"));
    expect(coverSeriesPath("co1")).toBe(coverSeriesPath("co1"));
  });

  it("differs across ids", () => {
    expect(coverSeriesPath("co1")).not.toBe(coverSeriesPath("co2"));
  });

  it("stays inside the documented ranges", () => {
    for (const id of ["co1", "co2", "co3", "co4", "co5", "co6", ""]) {
      const { angle, mixFrom, mixTo } = coverGradient(id);
      expect(angle).toBeGreaterThanOrEqual(120);
      expect(angle).toBeLessThanOrEqual(180);
      expect(mixFrom).toBeGreaterThanOrEqual(0);
      expect(mixFrom).toBeLessThanOrEqual(66);
      expect(mixTo).toBeGreaterThanOrEqual(0);
      expect(mixTo).toBeLessThanOrEqual(66);
    }
  });

  it("produces a well-formed SVG path", () => {
    const d = coverSeriesPath("co1");
    expect(d.startsWith("M")).toBe(true);
    expect(d).not.toContain("NaN");
  });
});

describe("fixtures honour the content model invariants", () => {
  it("orders lessons by an explicit, unique position within each chapter", () => {
    // docs/content-model.md: ordering uses an explicit integer position,
    // never array index or created_at.
    for (const chapter of sampleChapters) {
      const positions = chapter.lessons.map((l) => l.position);
      expect(new Set(positions).size).toBe(positions.length);
      expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    }
  });

  it("gives every block a unique position and a schema version", () => {
    const positions = sampleBlocks.map((b) => b.position);
    expect(new Set(positions).size).toBe(positions.length);
    for (const block of sampleBlocks) {
      expect(block.schemaVersion).toBeGreaterThanOrEqual(1);
    }
  });

  it("keeps ids unique across lessons", () => {
    const ids = sampleChapters.flatMap((c) => c.lessons.map((l) => l.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("carries at least one lesson that is published in FR but not EN", () => {
    // The state that bites hardest, per content-model.md. If the fixtures stop
    // covering it, the UnavailableInLocale path goes untested by eye.
    const all = sampleChapters.flatMap((c) => c.lessons);
    expect(all.some((l) => !l.availableLocales.includes("en"))).toBe(true);
  });

  it("carries a mandatory risk callout", () => {
    // Educational content is legally required to disclaim risk.
    expect(
      sampleBlocks.some((b) => b.type === "callout" && b.tone === "risk")
    ).toBe(true);
  });
});
