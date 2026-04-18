import test from "node:test";
import assert from "node:assert/strict";
import {
  formatDaysRemainingLabel,
  getDaysRemainingFontScale,
} from "../src/lib/days-remaining.js";

test("formatDaysRemainingLabel keeps the J- prefix and supports four digits", () => {
  assert.equal(formatDaysRemainingLabel(1234), "J-1234");
});

test("getDaysRemainingFontScale reduces the scale for long labels", () => {
  assert.equal(getDaysRemainingFontScale("J-12"), 0.94);
  assert.equal(getDaysRemainingFontScale("J-1234"), 0.8);
});
