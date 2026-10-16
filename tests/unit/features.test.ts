import { expect, test } from 'vitest';
import { extractFeatures } from '../../src/pose/features.js';
import type { Calibration } from '../../src/pose/calibration.js';
import { syntheticFrame, replacePoint } from '../helpers/syntheticPose.js';
const baseline: Calibration = { torsoScalePx: 130, standingKnee: { left: 180, right: 180 }, usableSides: ['left', 'right'], primarySide: 'right' };

test('angles use pixel units before geometry, regardless of image aspect ratio', () => {
  for (const width of [640, 1280]) {
    let frame = syntheticFrame(0, 'standing', width);
    frame = replacePoint(frame, 12, { x: 320 / width, y: 110 / 480 });
    frame = replacePoint(frame, 14, { x: 400 / width, y: 190 / 480 });
    frame = replacePoint(frame, 16, { x: 480 / width, y: 110 / 480 });
    expect(extractFeatures(frame, baseline)?.sides.right?.elbowDeg).toBeCloseTo(90, 6);
  }
});
test('body translation and uniform scaling preserve normalized features', () => {
  const frame = syntheticFrame(0, 'raised');
  const transformed = { ...frame, landmarks: frame.landmarks.map(p => ({ ...p, x: p.x * .6 + .2, y: p.y * .6 + .15 })) };
  const a = extractFeatures(frame, baseline), b = extractFeatures(transformed, baseline);
  expect(a).not.toBeNull();expect(b).not.toBeNull();
  expect(b?.sides.right?.wrist.x).toBeCloseTo(a!.sides.right!.wrist.x, 6);
  expect(b?.sides.right?.wrist.y).toBeCloseTo(a!.sides.right!.wrist.y, 6);
  expect(b?.hipHeight).toBeCloseTo(a!.hipHeight, 6);
});
test('anatomical sides stay independent; display mirroring never swaps indices', () => {
  const frame = replacePoint(syntheticFrame(), 15, { y: .1 });
  const features = extractFeatures(frame, baseline);
  expect(features?.sides.left?.wrist.y).toBeLessThan(-1);
  expect(features?.sides.right?.wrist.y).toBeGreaterThan(0);
});
test.each(['nan', 'missing', 'confidence', 'presence', 'infinite-confidence', 'confidence-out-of-range', 'zero', 'tiny', 'cropped'] as const)('rejects %s input instead of substituting angles', kind => {
  let frame = syntheticFrame();
  if (kind === 'nan') frame = replacePoint(frame, 16, { x: NaN });
  if (kind === 'missing') frame = { ...frame, landmarks: frame.landmarks.slice(0, 20) };
  if (kind === 'confidence') frame = replacePoint(frame, 16, { visibility: .59 });
  if (kind === 'presence') frame = replacePoint(frame, 16, { presence: .1 });
  if (kind === 'infinite-confidence') frame = replacePoint(frame, 16, { visibility: Infinity });
  if (kind === 'confidence-out-of-range') frame = replacePoint(frame, 16, { visibility: 1.1 });
  if (kind === 'zero') frame = replacePoint(frame, 16, frame.landmarks[14]!);
  if (kind === 'tiny') frame = { ...frame, landmarks: frame.landmarks.map(p => ({ ...p, x: .5 + p.x * .001, y: .5 + p.y * .001 })) };
  if (kind === 'cropped') frame = replacePoint(frame, 28, { y: 1.02 });
  expect(extractFeatures(frame, baseline)).toBeNull();
});
