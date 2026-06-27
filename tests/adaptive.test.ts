import { describe, it, expect } from "vitest";
import {
  startDifficulty,
  nextDifficulty,
  updateAbility,
  checkObjective,
} from "@/lib/adaptive";
import type { Question } from "@/lib/types";

function q(partial: Partial<Question>): Question {
  return {
    type: "numeric",
    topic: "",
    skill: "",
    difficulty: 3,
    prompt: "",
    options: [],
    answer: "",
    acceptable: [],
    tolerance: 0,
    hint: "",
    solution: "",
    source: "ai",
    ...partial,
  } as Question;
}

describe("startDifficulty", () => {
  it("uses the default when there is no history or strength", () => {
    expect(startDifficulty("maths", {}, {})).toBe(3);
  });

  it("leans on demonstrated ability when present", () => {
    // 70% of 8 + 30% of 3 = 5.6 + 0.9 = 6.5 -> rounds to 7 (or 6)
    const d = startDifficulty("maths", {}, { maths: 8 });
    expect(d).toBeGreaterThanOrEqual(6);
    expect(d).toBeLessThanOrEqual(7);
  });

  it("stays within 1..10", () => {
    expect(startDifficulty("maths", {}, { maths: 99 })).toBeLessThanOrEqual(10);
    expect(startDifficulty("maths", {}, { maths: -5 })).toBeGreaterThanOrEqual(1);
  });
});

describe("nextDifficulty", () => {
  it("steps up on correct, down on wrong, holds on partial", () => {
    expect(nextDifficulty(5, "correct")).toBe(6);
    expect(nextDifficulty(5, "incorrect")).toBe(4);
    expect(nextDifficulty(5, "partial")).toBe(5);
  });

  it("clamps at the boundaries", () => {
    expect(nextDifficulty(10, "correct")).toBe(10);
    expect(nextDifficulty(1, "incorrect")).toBe(1);
  });
});

describe("updateAbility", () => {
  it("drifts up after a correct answer", () => {
    expect(updateAbility(5, 5, "correct")).toBeGreaterThan(5);
  });

  it("drifts down after a wrong answer", () => {
    expect(updateAbility(5, 5, "incorrect")).toBeLessThan(5);
  });

  it("seeds from the difficulty when ability is undefined", () => {
    // ability defaults to difficulty (5), correct target 5.6 -> moves up slightly
    expect(updateAbility(undefined, 5, "correct")).toBeGreaterThan(5);
  });

  it("stays within 1..10", () => {
    expect(updateAbility(10, 10, "correct")).toBeLessThanOrEqual(10);
    expect(updateAbility(1, 1, "incorrect")).toBeGreaterThanOrEqual(1);
  });
});

describe("checkObjective", () => {
  it("marks a numeric answer within tolerance correct", () => {
    expect(checkObjective(q({ type: "numeric", answer: "12", tolerance: 0 }), "12")).toBe("correct");
    expect(checkObjective(q({ type: "numeric", answer: "12", tolerance: 1 }), "13")).toBe("correct");
    expect(checkObjective(q({ type: "numeric", answer: "12", tolerance: 0 }), "13")).toBe("incorrect");
  });

  it("matches a multiple-choice option case-insensitively", () => {
    const question = q({ type: "multiple_choice", answer: "Diamond", options: ["Gold", "Diamond"] });
    expect(checkObjective(question, "diamond")).toBe("correct");
    expect(checkObjective(question, "gold")).toBe("incorrect");
  });

  it("fuzzy-matches a short text answer", () => {
    const question = q({ type: "short_text", answer: "elephant" });
    expect(checkObjective(question, "elephant")).toBe("correct");
    expect(checkObjective(question, "banana")).toBe("incorrect");
  });

  it("defers open writing to the AI (returns null)", () => {
    expect(checkObjective(q({ type: "short_text", answer: "", acceptable: [] }), "anything")).toBeNull();
  });
});
