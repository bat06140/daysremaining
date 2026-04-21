import test from "node:test";
import assert from "node:assert/strict";
import {
  findLargestFittingFontSize,
  getSharedFittingFontSize,
  stabilizeFontSize,
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

test("stabilizeFontSize keeps the current size when the jitter is within one pixel", () => {
  const size = stabilizeFontSize(72, 73);

  assert.equal(size, 72);
});

test("stabilizeFontSize accepts the new size when the change is larger than one pixel", () => {
  const size = stabilizeFontSize(72, 75);

  assert.equal(size, 75);
});
