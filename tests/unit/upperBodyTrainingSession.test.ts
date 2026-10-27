import { expect, test } from 'vitest';
import { UpperBodyPreparation } from '../../src/pose/upperBody.js';
import { createRecognitionConfig, type RecognitionConfig } from '../../src/config/recognitionConfig.js';
import { upperFrame, type UpperPose } from '../helpers/upperBodyPose.js';
import type { PoseFrame } from '../../src/pose/types.js';

function sample(p: UpperBodyPreparation, pose: UpperPose, start: number): number {
  for (let time = start; time <= start + 1200; time += 100) p.accept(upperFrame(time, pose), time);
  return start + 1300;
}
function completed(retain = true, config?: RecognitionConfig) {
  const p = new UpperBodyPreparation(config, 3000, retain);
  let time = sample(p, 'lowered', 0); time = sample(p, 'raised', time); time = sample(p, 'hold', time);
  expect(p.getSnapshot().ready).toBe(true);
  return { p, time, saved: p.getProfile()! };
}
function training(config?: RecognitionConfig) {
  const result = completed(true, config);
  expect(result.p.startTraining()).toBe(true);
  return result;
}
type Fault = 'low-confidence' | 'missing' | 'absent' | 'gap' | 'stale' | 'future' | 'invalid-clock' |
  'invalid-id' | 'invalid-time' | 'duplicate' | 'resized' | 'invalid-size' | 'moved';
function broken(at: number, fault: Fault): { frame: PoseFrame; now: number } {
  let frame = upperFrame(at, 'hold'), now = at;
  if (fault === 'low-confidence') frame.landmarks[16] = { ...frame.landmarks[16], visibility: .59 };
  if (fault === 'missing') frame.landmarks = frame.landmarks.slice(0, 15);
  if (fault === 'absent') frame = { ...frame, valid: false, landmarks: [] };
  if (fault === 'gap') { frame = upperFrame(at + 201, 'hold'); now = frame.capturedAtMs; }
  if (fault === 'stale') now += 301;
  if (fault === 'future') frame.capturedAtMs += 51;
  if (fault === 'invalid-clock') now = NaN;
  if (fault === 'invalid-id') frame.frameId = .5;
  if (fault === 'invalid-time') frame.capturedAtMs = NaN;
  if (fault === 'duplicate') frame = upperFrame(at - 100, 'hold');
  if (fault === 'resized') frame.width *= 2;
  if (fault === 'invalid-size') frame.height = 0;
  if (fault === 'moved') frame.landmarks = frame.landmarks.map((point, index) =>
    index >= 11 && index <= 16 ? { ...point, x: point.x + .25 } : point);
  return { frame, now };
}

test('only an opted-in complete and currently ready preparation can enter the training session', () => {
  const p = new UpperBodyPreparation(undefined, 3000, true);
  expect(p.startTraining()).toBe(false);
  const time = sample(p, 'lowered', 0); expect(p.startTraining()).toBe(false);
  sample(p, 'raised', time); expect(p.startTraining()).toBe(false);
  expect(p.getSnapshot()).toMatchObject({ training: false, completedSteps: 2 });
  const strict = completed(false); expect(strict.p.startTraining()).toBe(false);
  const ready = completed(); ready.p.suspendTracking('tracking'); expect(ready.p.startTraining()).toBe(false);
  expect(ready.p.getSnapshot()).toMatchObject({ training: false, ready: false, completedSteps: 3 });
});

test.each(['low-confidence', 'missing', 'absent', 'gap', 'stale', 'future', 'invalid-clock', 'invalid-id',
  'invalid-time', 'duplicate', 'resized', 'invalid-size', 'moved'] as const)('training %s loss keeps the original template while revoking live readiness', fault => {
  const { p, time, saved } = training(), bad = broken(time, fault);
  p.accept(bad.frame, bad.now);
  expect(p.getSnapshot()).toMatchObject({ training: true, step: 'complete', completedSteps: 3, ready: false, progress: 0 });
  expect(p.getProfile()).toBeNull(); expect(p.getFeedback()).toBeNull(); expect(p.getSavedProfile()).toEqual(saved);
  expect(p.getDiagnostics()).toMatchObject({ sampleCount: 0, observedMs: 0, lastReset: null });
  p.tick(time + 60_000); expect(p.getSavedProfile()).toEqual(saved); expect(p.getProfile()).toBeNull();
});

test('small shoulder geometry revokes training readiness without deleting the session template', () => {
  const { p, time, saved } = training(createRecognitionConfig({ minTorsoHeightFraction: .3 }));
  const frame = upperFrame(time, 'hold');
  frame.landmarks = frame.landmarks.map((point, index) => index >= 11 && index <= 16
    ? { ...point, x: .5 + (point.x - .5) * (140 / 180) } : point);
  p.accept(frame, time);
  expect(p.getSnapshot()).toMatchObject({ training: true, ready: false, reason: 'small-shoulders' });
  expect(p.getSavedProfile()).toEqual(saved); expect(p.getProfile()).toBeNull();
});

test.each(['resized', 'moved'] as const)('continuous %s frames never reanchor or authorize training', fault => {
  const { p, time, saved } = training();
  for (let at = time; at <= time + 3000; at += 100) {
    const bad = broken(at, fault); p.accept(bad.frame, bad.now);
    expect(p.getSnapshot().ready).toBe(false); expect(p.getSavedProfile()).toEqual(saved);
  }
  p.accept(upperFrame(time + 3100, 'lowered'), time + 3100);
  expect(p.getSnapshot()).toMatchObject({ ready: true, training: true, completedSteps: 3 });
  expect(p.getProfile()).toEqual(saved);
});

test('fresh valid tracking restores a training session without recollecting a 1200ms pose window', () => {
  const { p, time, saved } = training(); const bad = broken(time, 'low-confidence'); p.accept(bad.frame, bad.now);
  p.accept(upperFrame(time + 100, 'raised'), time + 100);
  expect(p.getSnapshot()).toMatchObject({ training: true, ready: true, revalidating: false, progress: 1 });
  expect(p.getDiagnostics()).toMatchObject({ sampleCount: 0, observedMs: 0 }); expect(p.getProfile()).toEqual(saved);
  p.accept(upperFrame(time + 200, 'lowered'), time + 200);
  expect(p.getProfile()).toEqual(saved); expect(p.getSavedProfile()).toEqual(saved);
});

test.each(['invalid-clock', 'invalid-id', 'invalid-time', 'future'] as const)('a rejected %s frame cannot poison training time or ID watermarks', fault => {
  const { p, time, saved } = training(); const bad = broken(time, fault);
  if (fault !== 'invalid-id') bad.frame.frameId = 1_000_000;
  p.accept(bad.frame, bad.now); expect(p.getProfile()).toBeNull();
  p.accept(upperFrame(time + 100, 'lowered'), time + 100);
  expect(p.getSnapshot().ready).toBe(true); expect(p.getProfile()).toEqual(saved);
});

test.each(['resized', 'moved'] as const)('a rejected %s frame still prevents replay of its valid timestamp or ID', fault => {
  for (const same of ['id', 'time', 'both'] as const) {
    const { p, time, saved } = training(); const bad = broken(time, fault); p.accept(bad.frame, bad.now);
    const replay = upperFrame(time + 100, 'lowered');
    if (same !== 'time') replay.frameId = bad.frame.frameId;
    if (same !== 'id') replay.capturedAtMs = bad.frame.capturedAtMs;
    p.accept(replay, time + 100);
    expect(p.getSnapshot()).toMatchObject({ ready: false, reason: 'out-of-order' }); expect(p.getSavedProfile()).toEqual(saved);
    const older = upperFrame(time - 50, 'lowered'); p.accept(older, time + 100);
    expect(p.getSnapshot()).toMatchObject({ ready: false, reason: 'out-of-order' });
    p.accept(upperFrame(time + 200, 'lowered'), time + 200); expect(p.getProfile()).toEqual(saved);
  }
});

test('training staleness and invalid clocks revoke readiness, and explicit suspension retains the session', () => {
  for (const clock of [NaN, -1, 100_000]) {
    const { p, time, saved } = training(); p.tick(clock);
    expect(p.getSnapshot()).toMatchObject({ training: true, ready: false, completedSteps: 3 });
    expect(p.getSavedProfile()).toEqual(saved); expect(p.getProfile()).toBeNull();
    p.accept(upperFrame(time + 100), time + 100); expect(p.getProfile()).toEqual(saved);
    p.suspendTracking('window-blur'); expect(p.getProfile()).toBeNull(); expect(p.getSavedProfile()).toEqual(saved);
    p.accept(upperFrame(time + 200), time + 200); expect(p.getProfile()).toEqual(saved);
  }
});

test('explicit reset clears the training session and its saved targets', () => {
  const { p } = training(); p.reset('camera-stop');
  expect(p.getSnapshot()).toMatchObject({ training: false, ready: false, step: 'lowered', completedSteps: 0 });
  expect(p.getProfile()).toBeNull(); expect(p.getSavedProfile()).toBeNull(); expect(p.startTraining()).toBe(false);
});
