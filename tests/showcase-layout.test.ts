import test from "node:test";
import assert from "node:assert/strict";
import {
  PANEL_MIN_RATIO,
  clampPanelRatio,
  getPanelRatioFromPointer,
} from "../src/lib/showcase-layout.js";

test("clampPanelRatio keeps values within the safe panel range", () => {
  assert.equal(clampPanelRatio(0.01), PANEL_MIN_RATIO);
  assert.equal(clampPanelRatio(0.5), 0.5);
  assert.equal(clampPanelRatio(0.99), 1 - PANEL_MIN_RATIO);
});

test("getPanelRatioFromPointer derives a clamped ratio from the pointer position", () => {
  assert.equal(getPanelRatioFromPointer(480, 1000), 0.48);
});

test("getPanelRatioFromPointer never collapses the left or top panel", () => {
  assert.equal(getPanelRatioFromPointer(20, 1000), PANEL_MIN_RATIO);
});

test("getPanelRatioFromPointer never collapses the right or bottom panel", () => {
  assert.equal(getPanelRatioFromPointer(980, 1000), 1 - PANEL_MIN_RATIO);
});
