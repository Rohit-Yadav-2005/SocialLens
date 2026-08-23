import { describe, expect, it } from "vitest";

import { scoreLabel } from "./score-utils";

describe("scoreLabel", () => {
  it("labels 85+ as Excellent", () => {
    expect(scoreLabel(85).label).toBe("Excellent");
    expect(scoreLabel(100).label).toBe("Excellent");
  });

  it("labels 70-84 as Good", () => {
    expect(scoreLabel(70).label).toBe("Good");
    expect(scoreLabel(84).label).toBe("Good");
  });

  it("labels 50-69 as Fair", () => {
    expect(scoreLabel(50).label).toBe("Fair");
    expect(scoreLabel(69).label).toBe("Fair");
  });

  it("labels below 50 as Needs work", () => {
    expect(scoreLabel(49).label).toBe("Needs work");
    expect(scoreLabel(0).label).toBe("Needs work");
  });
});
