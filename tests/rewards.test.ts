import { describe, it, expect } from "vitest";
import {
  earnedSecondsFromAttempts,
  availableSecondsToday,
  starsForSubject,
} from "@/lib/rewards";
import { attempt, correct } from "./helpers";

describe("earnedSecondsFromAttempts", () => {
  it("gives a minute per correct answer", () => {
    expect(earnedSecondsFromAttempts(correct(3))).toBe(180);
  });

  it("gives 30s for a partial answer", () => {
    expect(earnedSecondsFromAttempts([attempt({ verdict: "partial" })])).toBe(30);
  });

  it("penalises a wrong answer on an easy question", () => {
    const list = [
      ...correct(2), // +120
      attempt({ verdict: "incorrect", difficulty: 1 }), // -30
    ];
    expect(earnedSecondsFromAttempts(list)).toBe(90);
  });

  it("does not penalise a wrong answer on a harder question", () => {
    const list = [...correct(1), attempt({ verdict: "incorrect", difficulty: 6 })];
    expect(earnedSecondsFromAttempts(list)).toBe(60);
  });

  it("never goes below zero", () => {
    const list = [attempt({ verdict: "incorrect", difficulty: 1 })];
    expect(earnedSecondsFromAttempts(list)).toBe(0);
  });

  it("respects a custom per-correct rate and daily cap", () => {
    // 10 correct at 2 min each = 20 min, but cap is 5 min.
    const list = correct(10);
    expect(earnedSecondsFromAttempts(list, { perCorrectMin: 2, capMin: 5 })).toBe(300);
  });
});

describe("availableSecondsToday", () => {
  it("subtracts what has already been watched", () => {
    expect(availableSecondsToday(600, 200)).toBe(400);
  });

  it("adds parent bonus on top of the cap", () => {
    // earned over the cap is clamped to the cap (1800s), then bonus is added.
    expect(availableSecondsToday(3000, 0, { capMin: 30, bonusSeconds: 300 })).toBe(2100);
  });

  it("never returns a negative amount", () => {
    expect(availableSecondsToday(120, 1000)).toBe(0);
  });
});

describe("starsForSubject", () => {
  it("awards 3 stars for all correct", () => {
    expect(starsForSubject(correct(4))).toBe(3);
  });

  it("awards 2 stars for a solid majority", () => {
    const rows = [...correct(3), attempt({ verdict: "incorrect" })]; // 75%
    expect(starsForSubject(rows)).toBe(2);
  });

  it("awards 1 star for some success", () => {
    const rows = [...correct(1), ...Array(4).fill(0).map(() => attempt({ verdict: "incorrect" }))];
    expect(starsForSubject(rows)).toBe(1);
  });

  it("awards 0 stars for none correct or no attempts", () => {
    expect(starsForSubject([])).toBe(0);
    expect(starsForSubject([attempt({ verdict: "incorrect" })])).toBe(0);
  });
});
