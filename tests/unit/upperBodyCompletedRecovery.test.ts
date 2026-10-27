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
  expect(p.getSnapshot()).toMatchObject({ step: 'complete', completedSteps: 3 });
  return { p, time, saved: p.getProfile()! };
}
type Soft = 'low-confidence' | 'out-of-frame' | 'missing-points' | 'degenerate-arm' | 'gap' | 'stale' | 'no-person';
function bad(time: number, fault: Soft): { frame: PoseFrame; now: number } {
  let frame = upperFrame(time, 'hold'), now = time;
  if (fault === 'low-confidence') frame.landmarks = frame.landmarks.map((p, i) => i === 16 ? { ...p, visibility: .59 } : p);
  if (fault === 'out-of-frame') frame.landmarks = frame.landmarks.map((p, i) => i === 16 ? { ...p, x: .99 } : p);
  if (fault === 'missing-points') frame.landmarks = frame.landmarks.slice(0, 15);
  if (fault === 'degenerate-arm') frame.landmarks = frame.landmarks.map((p, i) => i === 16 ? { ...frame.landmarks[14] } : p);
  if (fault === 'gap') { frame = upperFrame(time + 201, 'hold'); now = frame.capturedAtMs; }
  if (fault === 'stale') now += 301;
  if (fault === 'no-person') frame = { ...frame, valid: false, landmarks: [] };
  return { frame, now };
}

test.each(['low-confidence', 'out-of-frame', 'missing-points', 'degenerate-arm', 'gap', 'stale', 'no-person'] as const)('completed %s loss retains the exact template but immediately removes readiness and feedback', fault => {
  const { p, time, saved } = completed(), broken = bad(time, fault); p.accept(broken.frame, broken.now);
  expect(p.getSnapshot()).toMatchObject({ step: 'complete', completedSteps: 3, available: false, ready: false, revalidating: true, recovering: false, progress: 0 });
  expect(p.getProfile()).toBeNull(); expect(p.getFeedback()).toBeNull(); expect(p.getSavedProfile()).toEqual(saved);
  expect(p.getDiagnostics().lastReset).toBeNull();
  p.tick(broken.now + 60_000); expect(p.getSnapshot()).toMatchObject({ step: 'complete', ready: false, revalidating: true });
  expect(p.getSavedProfile()).toEqual(saved); expect(p.getProfile()).toBeNull();
});

test('revalidation accepts any stable upper-body pose with twelve fresh samples and never relearns its saved targets', () => {
  const { p, time, saved } = completed(), broken = bad(time, 'out-of-frame'); p.accept(broken.frame, broken.now);
  let next = sample(p, 'lowered', time + 100, 600);
  expect(p.getSnapshot()).toMatchObject({ step: 'complete', available: false, ready: false, revalidating: true });
  expect(p.getSnapshot().progress).toBeGreaterThan(0); expect(p.getProfile()).toBeNull(); expect(p.getFeedback()).toBeNull();
  next = sample(p, 'lowered', next, 600);
  expect(p.getSnapshot()).toMatchObject({ step: 'complete', available: true, ready: true, revalidating: false, progress: 1 });
  expect(p.getProfile()).toEqual(saved); expect(p.getSavedProfile()).toEqual(saved);
  const clone = p.getSavedProfile()!; clone.hold.left.y = 900; expect(p.getSavedProfile()).toEqual(saved);
  p.tick(next + 201); expect(p.getSnapshot().ready).toBe(false); expect(p.getSavedProfile()).toEqual(saved);
});

test('repeated absence never expires complete targets, and returning after a gap still requires a full fresh window', () => {
  const { p, time, saved } = completed();
  for (const at of [time, time + 100, time + 3100, time + 60_000]) {
    const broken = bad(at, 'no-person'); p.accept(broken.frame, broken.now); p.tick(at + 50);
    expect(p.getSnapshot()).toMatchObject({ step: 'complete', ready: false, revalidating: true }); expect(p.getSavedProfile()).toEqual(saved);
  }
  const start = time + 60_100; sample(p, 'lowered', start, 600); expect(p.getProfile()).toBeNull();
  sample(p, 'lowered', start + 700, 600); expect(p.getProfile()).toEqual(saved);
});

test('a lost frame clears the entire partial revalidation window instead of joining the two halves', () => {
  const { p, time, saved } = completed(); p.suspendTracking('window-blur');
  sample(p, 'lowered', time, 600); const broken = bad(time + 700, 'low-confidence'); p.accept(broken.frame, broken.now);
  expect(p.getDiagnostics()).toMatchObject({ sampleCount: 0, observedMs: 0 });
  let next = sample(p, 'lowered', time + 800, 600); expect(p.getProfile()).toBeNull(); expect(p.getSavedProfile()).toEqual(saved);
  sample(p, 'lowered', next, 600); expect(p.getProfile()).toEqual(saved);
});

test('revalidation requires both duration and sample count and getters cannot make it ready', () => {
  const { p, time, saved } = completed(); p.suspendTracking('page-hidden');
  for (let i = 0; i < 7; i++) p.accept(upperFrame(time + i * 200), time + i * 200);
  expect(p.getDiagnostics()).toMatchObject({ sampleCount: 7, observedMs: 1200 }); expect(p.getProfile()).toBeNull();
  const snapshot = p.getSnapshot(); for (let i = 0; i < 30; i++) { p.getProfile(); p.getSavedProfile(); p.getDiagnostics(); }
  expect(p.getSnapshot()).toEqual(snapshot);
  for (let i = 0; i < 5; i++) p.accept(upperFrame(time + 1300 + i * 100), time + 1300 + i * 100);
  expect(p.getProfile()).toEqual(saved);
});

test('unstable recovery poses keep the template unavailable until a new stable window succeeds', () => {
  const { p, time, saved } = completed(); p.suspendTracking('tracking'); p.accept(upperFrame(time), time);
  p.accept(upperFrame(time + 100, 'raised'), time + 100);
  expect(p.getSnapshot()).toMatchObject({ step: 'complete', ready: false, revalidating: true, progress: 0, reason: 'unstable' });
  expect(p.getSavedProfile()).toEqual(saved); expect(p.getProfile()).toBeNull();
  sample(p, 'raised', time + 200); expect(p.getProfile()).toEqual(saved);
});

test.each(['duplicate', 'late-duplicate', 'future', 'invalid-clock', 'invalid-time', 'invalid-id', 'resized', 'height', 'moved', 'scale', 'absent-resized', 'absent-future'] as const)('%s fault removes live readiness and only recoverable anchor movement retains complete targets', fault => {
  const { p, time, saved } = completed(); p.suspendTracking('tracking');
  let frame = upperFrame(time), now = time;
  if (fault === 'duplicate' || fault === 'late-duplicate') { frame = upperFrame(time - 100); now = fault === 'late-duplicate' ? time + 20_000 : time; }
  if (fault === 'future' || fault === 'absent-future') frame.capturedAtMs += 51;
  if (fault === 'invalid-clock') now = NaN;
  if (fault === 'invalid-time') frame.capturedAtMs = NaN;
  if (fault === 'invalid-id') frame.frameId = .5;
  if (fault === 'resized' || fault === 'absent-resized') frame.width *= 2;
  if (fault === 'height') frame.height *= 2;
  if (fault === 'moved') frame.landmarks = frame.landmarks.map((p, i) => i >= 11 && i <= 16 ? { ...p, x: p.x + .25 } : p);
  if (fault === 'scale') frame.landmarks = frame.landmarks.map((p, i) => i >= 11 && i <= 16 ? { ...p, x: .5 + (p.x - .5) * 1.6 } : p);
  if (fault.startsWith('absent-')) frame = { ...frame, valid: false, landmarks: [] };
  p.accept(frame, now);
  if (fault === 'moved' || fault === 'scale') {
    expect(p.getSnapshot()).toMatchObject({ step: 'complete', ready: false, revalidating: true, completedSteps: 3, progress: 0 });
    expect(p.getSavedProfile()).toEqual(saved); expect(p.getProfile()).toBeNull(); expect(p.getFeedback()).toBeNull();
    return;
  }
  expect(p.getSnapshot()).toMatchObject({ step: 'lowered', ready: false, revalidating: false, completedSteps: 0 });
  expect(p.getSavedProfile()).toBeNull(); expect(p.getProfile()).toBeNull(); expect(p.getFeedback()).toBeNull();
});

test('explicit reset always clears retained targets, while suspension preserves only opted-in completed templates', () => {
  for (const retain of [false, true]) {
    const { p, saved } = completed(retain); p.suspendTracking('window-blur');
    expect(p.getSavedProfile()).toEqual(retain ? saved : null); expect(p.getProfile()).toBeNull();
    p.reset('camera-stop'); expect(p.getSavedProfile()).toBeNull(); expect(p.getSnapshot()).toMatchObject({ step: 'lowered', ready: false, revalidating: false });
  }
  const p = new UpperBodyPreparation(undefined, 3000, true); sample(p, 'lowered', 0); p.suspendTracking('page-hidden');
  expect(p.getSnapshot()).toMatchObject({ step: 'lowered', completedSteps: 0 }); expect(p.getSavedProfile()).toBeNull();
});

test('complete-template retention works without enabling incomplete-step recovery or weakening strict defaults', () => {
  const { p, time, saved } = completed(true, 0), broken = bad(time, 'low-confidence'); p.accept(broken.frame, broken.now);
  expect(p.getSavedProfile()).toEqual(saved); expect(p.getProfile()).toBeNull();
  const incomplete = new UpperBodyPreparation(undefined, 0, true); const next = sample(incomplete, 'lowered', 0), invalid = bad(next, 'low-confidence'); incomplete.accept(invalid.frame, invalid.now);
  expect(incomplete.getSnapshot()).toMatchObject({ step: 'lowered', completedSteps: 0 });
});
