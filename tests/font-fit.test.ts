import test from "node:test";
import assert from "node:assert/strict";
import { findLargestFittingFontSize } from "../src/lib/font-fit.js";

test("findLargestFittingFontSize keeps the maximum size when it already fits", () => {
  const size = findLargestFittingFontSize({
    minSize: 12,
    maxSize: 96,
    fits: () => true,
  });

  assert.equal(size, 96);
});

test("findLargestFittingFontSize returns the largest size that still fits", () => {
  const size = findLargestFittingFontSize({
    minSize: 12,
    maxSize: 96,
    fits: (candidate) => candidate <= 41,
  });

  assert.equal(size, 41);
});

test("findLargestFittingFontSize honors the minimum when nothing larger fits", () => {
  const size = findLargestFittingFontSize({
    minSize: 12,
    maxSize: 96,
    fits: (candidate) => candidate <= 8,
  });

  assert.equal(size, 12);
});
