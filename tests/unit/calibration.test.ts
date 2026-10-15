import { expect, test } from 'vitest';
import { calibrate } from '../../src/pose/calibration.js';
import { replacePoint, standingFrames, syntheticFrame } from '../helpers/syntheticPose.js';

test('stable two-second standing calibrates scale, natural knees and available sides', () => {
  const result = calibrate(standingFrames());
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.calibration.torsoScalePx).toBeCloseTo(130);
  expect(result.calibration.standingKnee.right).toBeCloseTo(180);
  expect(result.calibration.usableSides).toEqual(['left', 'right']);
});
test('an occluded unused arm does not prevent calibrating the requested usable side', () => {
  const frames = standingFrames().map(f => replacePoint(f, 15, { visibility: .2 }));
  expect(calibrate(frames, undefined, 'left').ok).toBe(false);
  const result = calibrate(frames, undefined, 'right');expect(result.ok).toBe(true);
  if (result.ok) expect(result.calibration.usableSides).toEqual(['right']);
});
test.each(['short', 'sparse', 'reverse', 'invalid', 'unstable', 'resize'] as const)('rejects %s calibration sequence', kind => {
  let frames = standingFrames();
  if (kind === 'short') frames = frames.slice(0, -1);
  if (kind === 'sparse') frames = [frames[0]!, frames.at(-1)!];
  if (kind === 'reverse') frames[10] = syntheticFrame(850);
  if (kind === 'invalid') frames[10] = replacePoint(frames[10]!, 16, { visibility: 0 });
  if (kind === 'unstable') frames = frames.map((f, i) => ({ ...f, landmarks: f.landmarks.map(p => ({ ...p, x: p.x + (i % 2) * .1 })) }));
  if (kind === 'resize') frames[10] = syntheticFrame(1000, 'standing', 1280);
  expect(calibrate(frames).ok).toBe(false);
});
