import { expect, test } from 'vitest';
import { PoseSmoother } from '../../src/pose/smoothing.js';
import { syntheticFrame, replacePoint } from '../helpers/syntheticPose.js';

test('low-pass alpha depends on elapsed time and never changes confidence', () => {
  const filter = new PoseSmoother();const first = syntheticFrame(0);filter.update(first);
  const next = replacePoint(syntheticFrame(60), 16, { x: .7, visibility: .7 });
  const result = filter.update(next);
  expect(result.frame?.landmarks[16].x).toBeCloseTo(first.landmarks[16].x + (1 - Math.exp(-1)) * (.7 - first.landmarks[16].x));
  expect(result.frame?.landmarks[16].visibility).toBe(.7);
});
test('invalid and out-of-order samples clear history, recovery starts from observed points', () => {
  const filter = new PoseSmoother();filter.update(syntheticFrame(100));
  expect(filter.update(syntheticFrame(99)).reason).toBe('out-of-order');
  expect(filter.update({ ...syntheticFrame(200), valid: false }).frame).toBeNull();
  const recovered = syntheticFrame(300, 'raised');expect(filter.update(recovered).frame).toEqual(recovered);
});
test.each(['gap', 'resized', 'person-moved'] as const)('%s reinitializes without interpolating old subject', kind => {
  const filter = new PoseSmoother();filter.update(syntheticFrame());
  let next = syntheticFrame(kind === 'gap' ? 201 : 100, 'raised', kind === 'resized' ? 1280 : 640);
  if (kind === 'person-moved') next = { ...next, landmarks: next.landmarks.map(p => ({ ...p, x: p.x + .16 })) };
  const result = filter.update(next);expect(result.reason).toBe(kind);expect(result.discontinuity).toBe(true);
  expect(result.frame).toEqual(next);
});
test('reset and low-confidence joints are never reconstructed from old coordinates', () => {
  const filter = new PoseSmoother();filter.update(syntheticFrame());
  const missing = replacePoint(syntheticFrame(100), 16, { x: .8, visibility: .1 });
  expect(filter.update(missing).frame?.landmarks[16]).toEqual(missing.landmarks[16]);
  filter.reset();const next = syntheticFrame(200, 'raised');expect(filter.update(next).frame).toEqual(next);
});
