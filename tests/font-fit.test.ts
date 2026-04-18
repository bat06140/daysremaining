import test from "node:test";
import assert from "node:assert/strict";
import {
  findLargestFittingFontSize,
  getSharedFittingFontSize,
} from "../src/lib/font-fit.js";

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

test("getSharedFittingFontSize uses the smallest measured size across a group", () => {
  const size = getSharedFittingFontSize([38, 41, 35]);

  assert.equal(size, 35);
});

test("getSharedFittingFontSize returns undefined until every panel has reported a size", () => {
  const size = getSharedFittingFontSize([38, undefined, 35]);

  assert.equal(size, undefined);
});
