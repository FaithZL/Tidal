import { expect, test } from 'vitest';
import { UpperBodyPreparation } from '../../src/pose/upperBody.js';
import { upperFrame, type UpperPose } from '../helpers/upperBodyPose.js';
import type { PoseFrame } from '../../src/pose/types.js';

function sample(p: UpperBodyPreparation, pose: UpperPose, start: number, duration = 1200): number {
  for (let time = start; time <= start + duration; time += 100) p.accept(upperFrame(time, pose), time);
  return start + duration + 100;
}
function completed(retain = true, window = 3000) {
  const p = new UpperBodyPreparation(undefined, window, retain);
  let time = sample(p, 'lowered', 0); time = sample(p, 'raised', time); time = sample(p, 'hold', time);
  expect(p.getSnapshot().ready).toBe(true);
  return { p, time, saved: p.getProfile()! };
}
type Move = 'translation' | 'larger' | 'smaller';
function moved(time: number, kind: Move = 'translation'): PoseFrame {
  const frame = upperFrame(time, 'hold');
  frame.landmarks = frame.landmarks.map((point, index) => index < 11 || index > 16 ? point : {
    ...point, x: kind === 'translation' ? point.x + .25 : .5 + (point.x - .5) * (kind === 'larger' ? 1.6 : .6),
  });
  return frame;
}

test.each(['translation', 'larger', 'smaller'] as const)('completed %s suspends live tracking while retaining the immutable original calibration', kind => {
  const { p, time, saved } = completed();
  for (let offset = 0; offset <= 5000; offset += 100) {
    p.accept(moved(time + offset, kind), time + offset);
    expect(p.getSnapshot()).toMatchObject({ step: 'complete', completedSteps: 3, available: false, ready: false,
      revalidating: true, progress: 0, reason: 'person-moved' });
    expect(p.getDiagnostics()).toMatchObject({ sampleCount: 0, observedMs: 0, lastReset: null });
    expect(p.getProfile()).toBeNull(); expect(p.getFeedback()).toBeNull(); expect(p.getSavedProfile()).toEqual(saved);
  }
  p.tick(time + 65_000); expect(p.getSavedProfile()).toEqual(saved); expect(p.getSnapshot().ready).toBe(false);
});

test.each(['translation', 'larger', 'smaller'] as const)('returning from %s requires a wholly fresh stable window at the original anchor', kind => {
  const { p, time, saved } = completed(); p.accept(moved(time, kind), time);
  const start = time + 100; sample(p, 'hold', start, 1100);
  expect(p.getDiagnostics()).toMatchObject({ sampleCount: 12, observedMs: 1100 });
  expect(p.getSnapshot()).toMatchObject({ step: 'complete', ready: false, revalidating: true });
  expect(p.getSavedProfile()).toEqual(saved); expect(p.getProfile()).toBeNull();
  p.accept(upperFrame(start + 1200, 'hold'), start + 1200);
  expect(p.getSnapshot()).toMatchObject({ step: 'complete', ready: true, revalidating: false });
  expect(p.getProfile()).toEqual(saved);
});

test('leaving the original anchor again discards partial recovery samples instead of joining windows', () => {
  const { p, time, saved } = completed(); p.accept(moved(time), time);
  const next = sample(p, 'hold', time + 100, 600); expect(p.getSnapshot().progress).toBeGreaterThan(0);
  p.accept(moved(next), next); expect(p.getDiagnostics()).toMatchObject({ sampleCount: 0, observedMs: 0 });
  const start = next + 100; sample(p, 'hold', start, 600); expect(p.getProfile()).toBeNull();
  sample(p, 'hold', start + 700, 500); expect(p.getProfile()).toEqual(saved);
});

test.each(['duplicate', 'same-id', 'same-time'] as const)('a rejected moved frame advances metadata watermarks against %s replay', fault => {
  const { p, time } = completed(); const original = moved(time); p.accept(original, time);
  expect(p.getSavedProfile()).not.toBeNull();
  const replay = upperFrame(time + 100, 'hold');
  if (fault !== 'same-time') replay.frameId = original.frameId;
  if (fault !== 'same-id') replay.capturedAtMs = original.capturedAtMs;
  p.accept(replay, time + 100);
  expect(p.getSnapshot()).toMatchObject({ step: 'lowered', completedSteps: 0, ready: false, reason: 'out-of-order' });
  expect(p.getSavedProfile()).toBeNull();
});

test('a sudden movement between two positions inside the original anchor also suspends without deleting calibration', () => {
  const { p, time, saved } = completed();
  const shifted = (at: number, sign: number) => {
    const frame = upperFrame(at, 'hold');
    frame.landmarks = frame.landmarks.map((point, index) => index >= 11 && index <= 16
      ? { ...point, x: point.x + sign * .65 * 180 / 640 } : point);
    return frame;
  };
  p.accept(shifted(time, -1), time); expect(p.getSnapshot().ready).toBe(true);
  p.accept(shifted(time + 100, 1), time + 100);
  expect(p.getSnapshot()).toMatchObject({ step: 'complete', ready: false, revalidating: true, reason: 'person-moved' });
  expect(p.getSavedProfile()).toEqual(saved); expect(p.getDiagnostics().sampleCount).toBe(0);
  sample(p, 'hold', time + 200); expect(p.getProfile()).toEqual(saved);
});

test.each(['translation', 'larger', 'smaller'] as const)('strict completed preparations still invalidate their template after %s', kind => {
  for (const window of [0, 3000]) {
    const { p, time } = completed(false, window); p.accept(moved(time, kind), time);
    expect(p.getSnapshot()).toMatchObject({ step: 'lowered', completedSteps: 0, ready: false, reason: 'person-moved' });
    expect(p.getSavedProfile()).toBeNull();
  }
});

test.each(['raised', 'hold'] as const)('incomplete %s calibration still resets after moving away', step => {
  const p = new UpperBodyPreparation(undefined, 3000, true); let time = sample(p, 'lowered', 0);
  if (step === 'hold') time = sample(p, 'raised', time);
  expect(p.getSnapshot().step).toBe(step); p.accept(moved(time), time);
  expect(p.getSnapshot()).toMatchObject({ step: 'lowered', completedSteps: 0, ready: false, reason: 'person-moved' });
  expect(p.getSavedProfile()).toBeNull();
});

test.each(['future', 'resized', 'invalid-id'] as const)('moving cannot hide a hard %s fault', fault => {
  const { p, time } = completed(); const frame = moved(time);
  if (fault === 'future') frame.capturedAtMs += 51;
  if (fault === 'resized') frame.width *= 2;
  if (fault === 'invalid-id') frame.frameId = .5;
  p.accept(frame, time); expect(p.getSavedProfile()).toBeNull();
  expect(p.getSnapshot()).toMatchObject({ step: 'lowered', completedSteps: 0, ready: false });
});
