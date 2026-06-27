import { describe, it, expect } from "vitest";
import { xpFromAttempts, levelFromXp, levelFromAttempts, badges } from "@/lib/levels";
import { attempt, correct } from "./helpers";

describe("xpFromAttempts", () => {
  it("rewards correct answers more than misses, but misses still earn effort XP", () => {
    expect(xpFromAttempts(correct(1, 0))).toBe(10); // 10 + difficulty(0)
    expect(xpFromAttempts([attempt({ verdict: "correct", difficulty: 5 })])).toBe(15);
    expect(xpFromAttempts([attempt({ verdict: "partial" })])).toBe(6);
    expect(xpFromAttempts([attempt({ verdict: "incorrect" })])).toBe(1);
  });

  it("sums across attempts", () => {
    const list = [
      attempt({ verdict: "correct", difficulty: 5 }), // 15
      attempt({ verdict: "partial" }), // 6
      attempt({ verdict: "incorrect" }), // 1
    ];
    expect(xpFromAttempts(list)).toBe(22);
  });
});

describe("levelFromXp", () => {
  it("starts at level 1 with the first title", () => {
    const info = levelFromXp(0);
    expect(info.level).toBe(1);
    expect(info.title).toBe("Dirt Digger");
    expect(info.progressPct).toBe(0);
  });

  it("advances to level 2 after enough XP", () => {
    // level 2 begins at 60 XP
    expect(levelFromXp(60).level).toBe(2);
    expect(levelFromXp(59).level).toBe(1);
  });

  it("keeps progress within 0..100", () => {
    const info = levelFromXp(75);
    expect(info.progressPct).toBeGreaterThanOrEqual(0);
    expect(info.progressPct).toBeLessThanOrEqual(100);
  });

  it("monotonically increases level with XP", () => {
    let prev = 0;
    for (const xp of [0, 60, 150, 300, 600, 1200]) {
      const lv = levelFromXp(xp).level;
      expect(lv).toBeGreaterThanOrEqual(prev);
      prev = lv;
    }
  });
});

describe("levelFromAttempts", () => {
  it("matches levelFromXp on the computed XP", () => {
    const list = correct(10, 5); // 10 * 15 = 150 XP
    expect(levelFromAttempts(list).level).toBe(levelFromXp(150).level);
  });
});

describe("badges", () => {
  it("returns a list with an earned flag on each", () => {
    const result = badges(correct(5), 2);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    for (const b of result) {
      expect(typeof b.earned).toBe("boolean");
      expect(b.id).toBeTruthy();
    }
  });

  it("earns nothing problematic with an empty history", () => {
    const result = badges([], 1);
    // No throw, every badge present but unearned.
    expect(result.every((b) => b.earned === false)).toBe(true);
  });
});
