import { expect, test } from 'vitest';
import { UpperBodyPreparation } from '../../src/pose/upperBody.js';
import { upperFrame, type UpperPose } from '../helpers/upperBodyPose.js';
import type { PoseFrame } from '../../src/pose/types.js';

function sample(p: UpperBodyPreparation, pose: UpperPose, start: number, duration = 1200): number {
  for (let time = start; time <= start + duration; time += 100) p.accept(upperFrame(time, pose), time);
  return start + duration + 100;
}
function ready(step: 'raised' | 'hold', window = 3000) {
  const p = new UpperBodyPreparation(undefined, window); let time = sample(p, 'lowered', 0);
  if (step === 'hold') time = sample(p, 'raised', time);
  time = sample(p, step, time, 500);
  return { p, time, last: time - 100 };
}
type Soft = 'low-confidence' | 'out-of-frame' | 'missing-points' | 'degenerate-arm' | 'gap' | 'stale';
function bad(time: number, fault: Soft): { frame: PoseFrame; now: number } {
  let frame = upperFrame(time, 'raised'), now = time;
  if (fault === 'low-confidence') frame.landmarks = frame.landmarks.map((p, i) => i === 16 ? { ...p, visibility: .59 } : p);
  if (fault === 'out-of-frame') frame.landmarks = frame.landmarks.map((p, i) => i === 16 ? { ...p, x: .99 } : p);
  if (fault === 'missing-points') frame.landmarks = frame.landmarks.slice(0, 15);
  if (fault === 'degenerate-arm') frame.landmarks = frame.landmarks.map((p, i) => i === 16 ? { ...frame.landmarks[14] } : p);
  if (fault === 'gap') { frame = upperFrame(time + 201, 'raised'); now = frame.capturedAtMs; }
  if (fault === 'stale') now += 301;
  return { frame, now };
}

test.each(['raised', 'hold'] as const)('opt-in %s preparation preserves only completed steps and recollects the entire interrupted window', step => {
  const { p, time } = ready(step), broken = bad(time, 'low-confidence'); p.accept(broken.frame, broken.now);
  expect(p.getSnapshot()).toMatchObject({ step, completedSteps: step === 'raised' ? 1 : 2, recovering: true, available: false, progress: 0 });
  expect(p.getFeedback()).toBeNull(); expect(p.getProfile()).toBeNull();
  const snapshot = p.getSnapshot(); for (let i = 0; i < 20; i++) { p.getSnapshot(); p.getFeedback(); }
  expect(p.getSnapshot()).toEqual(snapshot);
  let next = sample(p, step, time + 100, 600);
  expect(p.getSnapshot()).toMatchObject({ step, recovering: false }); expect(p.getSnapshot().progress).toBeLessThan(1);
  sample(p, step, next, 600);
  expect(p.getSnapshot()).toMatchObject({ step: step === 'raised' ? 'hold' : 'complete', completedSteps: step === 'raised' ? 2 : 3, recovering: false });
  next += 700; if (step === 'raised') sample(p, 'hold', next);
  expect(p.getProfile()).not.toBeNull();
});

test.each(['low-confidence', 'out-of-frame', 'missing-points', 'degenerate-arm', 'gap', 'stale'] as const)('%s may pause incomplete preparation, with no loss-time sampling', fault => {
  const { p, time } = ready('raised'), broken = bad(time, fault); p.accept(broken.frame, broken.now);
  expect(p.getSnapshot()).toMatchObject({ step: 'raised', completedSteps: 1, recovering: true, progress: 0, available: false });
  expect(p.getFeedback()).toBeNull(); p.tick(broken.now + 50); expect(p.getSnapshot().progress).toBe(0);
  const start = broken.now + 100; sample(p, 'raised', start, 600); expect(p.getSnapshot().step).toBe('raised');
  sample(p, 'raised', start + 700, 700); expect(p.getSnapshot().step).toBe('hold');
});

test('bad frames and ticks cannot extend the original three-second deadline', () => {
  const { p, time, last } = ready('raised');
  for (const now of [time, time + 100, last + 1000, last + 2000, last + 3000]) {
    const broken = bad(now, 'low-confidence'); p.accept(broken.frame, broken.now); p.tick(now);
    expect(p.getSnapshot()).toMatchObject({ step: 'raised', recovering: true, completedSteps: 1, progress: 0 });
  }
  p.tick(last + 3001); expect(p.getSnapshot()).toMatchObject({ step: 'lowered', recovering: false, completedSteps: 0, available: false });
});

test('tick-only staleness clears partial samples, and a valid frame after the deadline cannot revive references', () => {
  const { p, last } = ready('hold'); p.tick(last + 301);
  expect(p.getSnapshot()).toMatchObject({ step: 'hold', recovering: true, completedSteps: 2, progress: 0 }); expect(p.getFeedback()).toBeNull();
  p.tick(last + 3000); expect(p.getSnapshot().step).toBe('hold');
  p.accept(upperFrame(last + 3001, 'hold'), last + 3001);
  expect(p.getSnapshot()).toMatchObject({ step: 'lowered', completedSteps: 0, recovering: false }); expect(p.getProfile()).toBeNull();
});

test.each(['duplicate', 'late-duplicate', 'future', 'invalid-time', 'invalid-id', 'invalid-data', 'resized', 'gap-resized', 'moved', 'scale'] as const)('hard fault %s discards completed references even during recovery', fault => {
  const { p, time, last } = ready('hold'); const soft = bad(time, 'low-confidence'); p.accept(soft.frame, soft.now);
  let frame = upperFrame(time + 100, 'hold'), now = frame.capturedAtMs;
  if (fault === 'duplicate' || fault === 'late-duplicate') { frame = upperFrame(last); now = fault === 'late-duplicate' ? last + 1000 : time + 100; }
  if (fault === 'future') frame.capturedAtMs = now + 51;
  if (fault === 'invalid-time') now = NaN;
  if (fault === 'invalid-id') frame.frameId = 1.5;
  if (fault === 'invalid-data') frame.valid = false;
  if (fault === 'resized' || fault === 'gap-resized') { frame.width = 1280; if (fault === 'gap-resized') now = frame.capturedAtMs += 500; }
  if (fault === 'moved') frame.landmarks = frame.landmarks.map((p, i) => i >= 11 && i <= 16 ? { ...p, x: p.x + .25 } : p);
  if (fault === 'scale') frame.landmarks = frame.landmarks.map((p, i) => i >= 11 && i <= 16 ? { ...p, x: .5 + (p.x - .5) * 1.6 } : p);
  p.accept(frame, now);
  expect(p.getSnapshot()).toMatchObject({ step: 'lowered', recovering: false, completedSteps: 0, available: false }); expect(p.getFeedback()).toBeNull(); expect(p.getProfile()).toBeNull();
});

test('explicit reset and bad clocks always cancel recovery', () => {
  for (const reset of [true, false]) {
    const { p, time } = ready('raised'), broken = bad(time, 'low-confidence'); p.accept(broken.frame, broken.now);
    if (reset) p.reset(); else p.tick(-1);
    expect(p.getSnapshot()).toMatchObject({ step: 'lowered', completedSteps: 0, recovering: false }); expect(p.getFeedback()).toBeNull();
  }
});

test('completed profiles and default strict preparations never use recovery', () => {
  const strict = ready('raised', 0), broken = bad(strict.time, 'low-confidence'); strict.p.accept(broken.frame, broken.now);
  expect(strict.p.getSnapshot()).toMatchObject({ step: 'lowered', completedSteps: 0, recovering: false });
  const p = new UpperBodyPreparation(undefined, 3000); let time = sample(p, 'lowered', 0); time = sample(p, 'raised', time); time = sample(p, 'hold', time);
  expect(p.getSnapshot()).toMatchObject({ step: 'complete', completedSteps: 3 });
  const invalid = bad(time, 'low-confidence'); p.accept(invalid.frame, invalid.now);
  expect(p.getSnapshot()).toMatchObject({ step: 'lowered', completedSteps: 0, recovering: false }); expect(p.getProfile()).toBeNull();
});

test('initial lowered sampling cannot preserve uncompleted evidence, and recovery windows are bounded', () => {
  const p = new UpperBodyPreparation(undefined, 3000); sample(p, 'lowered', 0, 500); const invalid = bad(600, 'low-confidence'); p.accept(invalid.frame, invalid.now);
  expect(p.getSnapshot()).toMatchObject({ step: 'lowered', completedSteps: 0, recovering: false, progress: 0 });
  for (const value of [-1, 3001, NaN, Infinity]) expect(() => new UpperBodyPreparation(undefined, value)).toThrow(RangeError);
});
