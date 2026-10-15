import { expect, test } from 'vitest';
import { createRecognitionConfig } from '../../src/config/recognitionConfig.js';
test('experimental defaults match guide timing, confidence and smoothing', () => {
  expect(createRecognitionConfig()).toMatchObject({ smoothingTauMs: 60, minConfidence: .6, maxPoseGapMs: 200, trackingMaxAgeMs: 300, standingDurationMs: 2000, carryDurationMs: 2000 });
  expect(Object.isFrozen(createRecognitionConfig())).toBe(true);
});
test.each([{ smoothingTauMs: 0 }, { minConfidence: 1.01 }, { maxPoseGapMs: NaN }, { minStandingSamples: 1.2 }, { framingMargin: .5 }, { maxScaleRatio: 1 }])('rejects invalid experiment configuration %o', overrides => {
  expect(() => createRecognitionConfig(overrides)).toThrow(RangeError);
});
