import { describe, it, expect } from "vitest";
import {
  earnedSecondsFromAttempts,
  availableSecondsToday,
  lifetimeAvailableSeconds,
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

describe("lifetimeAvailableSeconds (carry-over across days)", () => {
  const T = "2026-06-28";

  it("carries unused minutes from previous days into the balance", () => {
    const sessions = [
      { day: "2026-06-26", earned_minutes: 20, minutes_used: 5, bonus_minutes: 0 }, // +15
      { day: "2026-06-27", earned_minutes: 10, minutes_used: 0, bonus_minutes: 0 }, // +10
    ];
    // today earns 4 min, watched 0 -> +4. Total = 15 + 10 + 4 = 29 min.
    expect(lifetimeAvailableSeconds(sessions, T, 4 * 60, { capMin: 30 })).toBe(29 * 60);
  });

  it("subtracts what was watched, including today's watching", () => {
    const sessions = [
      { day: "2026-06-27", earned_minutes: 10, minutes_used: 0, bonus_minutes: 0 },
      { day: T, earned_minutes: 0, minutes_used: 6, bonus_minutes: 0 }, // today's row with 6 watched
    ];
    // past +10, today earns 4 live, today watched 6 -> 10 + 4 - 6 = 8.
    expect(lifetimeAvailableSeconds(sessions, T, 4 * 60, { capMin: 30 })).toBe(8 * 60);
  });

  it("caps each day's earning but lets the balance accumulate beyond the cap", () => {
    const sessions = [
      { day: "2026-06-26", earned_minutes: 50, minutes_used: 0, bonus_minutes: 0 }, // capped to 30
      { day: "2026-06-27", earned_minutes: 50, minutes_used: 0, bonus_minutes: 0 }, // capped to 30
    ];
    // 30 + 30 + 0 today = 60 (above the 30 daily cap, by design).
    expect(lifetimeAvailableSeconds(sessions, T, 0, { capMin: 30 })).toBe(60 * 60);
  });

  it("never goes below zero", () => {
    const sessions = [{ day: "2026-06-27", earned_minutes: 2, minutes_used: 99, bonus_minutes: 0 }];
    expect(lifetimeAvailableSeconds(sessions, T, 0, { capMin: 30 })).toBe(0);
  });
});
