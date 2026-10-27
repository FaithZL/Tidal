import { expect, test } from 'vitest';
import { UpperBodyPreparation } from '../../src/pose/upperBody.js';
import { upperFrame, type UpperPose } from '../helpers/upperBodyPose.js';
import type { PoseFrame } from '../../src/pose/types.js';

function sample(p: UpperBodyPreparation, pose: UpperPose, start: number, duration = 1300): number {
  for (let time = start; time <= start + duration; time += 100) p.accept(upperFrame(time, pose), time);
  return start + duration + 100;
}
function holdStep(p: UpperBodyPreparation): number { return sample(p, 'raised', sample(p, 'lowered', 0)); }

test('diagnostics begin with six named missing joints and no invented sample or failure data', () => {
  const p = new UpperBodyPreparation(), d = p.getDiagnostics();
  expect(d).toMatchObject({ sampleCount: 0, observedMs: 0, lastReset: null, lastSampleRejection: null, hold: null });
  expect(d.joints).toEqual([
    { index: 11, label: '左肩', confidence: null, state: 'missing' }, { index: 12, label: '右肩', confidence: null, state: 'missing' },
    { index: 13, label: '左肘', confidence: null, state: 'missing' }, { index: 14, label: '右肘', confidence: null, state: 'missing' },
    { index: 15, label: '左手腕', confidence: null, state: 'missing' }, { index: 16, label: '右手腕', confidence: null, state: 'missing' },
  ]);
});

test('all six quality summaries explain the current frame even when the stream rejects its first bad joint', () => {
  const p = new UpperBodyPreparation(), frame = upperFrame(50);
  frame.landmarks = frame.landmarks.map((point, index) => index === 11 ? { ...point, visibility: .59 }
    : index === 12 ? { ...point, presence: .42 } : index === 13 ? { ...point, x: .99 }
      : index === 14 ? { ...point, y: NaN } : index === 15 ? { ...point, visibility: NaN } : point).slice(0, 16);
  p.accept(frame, 50);
  expect(p.getDiagnostics().joints).toEqual([
    { index: 11, label: '左肩', confidence: .59, state: 'low-confidence' }, { index: 12, label: '右肩', confidence: .42, state: 'low-confidence' },
    { index: 13, label: '左肘', confidence: .99, state: 'out-of-frame' }, { index: 14, label: '右肘', confidence: .99, state: 'invalid' },
    { index: 15, label: '左手腕', confidence: null, state: 'invalid' }, { index: 16, label: '右手腕', confidence: null, state: 'missing' },
  ]);
  expect(p.getSnapshot()).toMatchObject({ available: false, reason: 'low-confidence' });
});

test('sample summaries use observed frames and ticks mark stale quality without filling sampling time', () => {
  const p = new UpperBodyPreparation(); sample(p, 'lowered', 0, 500);
  expect(p.getDiagnostics()).toMatchObject({ sampleCount: 6, observedMs: 500 });
  p.tick(800); expect(p.getDiagnostics().joints.every(j => j.state === 'usable')).toBe(true);
  expect(p.getDiagnostics()).toMatchObject({ sampleCount: 6, observedMs: 500 });
  p.tick(801); expect(p.getDiagnostics().joints.every(j => j.state === 'stale')).toBe(true);
  expect(p.getDiagnostics()).toMatchObject({ sampleCount: 0, observedMs: 0 }); expect(p.getDiagnostics().lastReset).toBeNull();
});

test('last reset preserves the lost completed stage across later empty bad frames and sequences new resets', () => {
  const p = new UpperBodyPreparation(); const time = holdStep(p), bad = upperFrame(time, 'hold');
  bad.landmarks = bad.landmarks.map((point, i) => i === 16 ? { ...point, visibility: .1 } : point); p.accept(bad, time);
  expect(p.getDiagnostics().lastReset).toEqual({ sequence: 1, fromStep: 'hold', completedSteps: 2, reason: 'low-confidence' });
  const resetCopy = p.getDiagnostics(); resetCopy.lastReset!.reason = 'reader mutation';
  expect(p.getDiagnostics().lastReset!.reason).toBe('low-confidence');
  const out = upperFrame(time + 100); out.landmarks = out.landmarks.map((point, i) => i === 15 ? { ...point, x: .999 } : point); p.accept(out, time + 100);
  expect(p.getDiagnostics().lastReset).toEqual({ sequence: 1, fromStep: 'hold', completedSteps: 2, reason: 'low-confidence' });
  sample(p, 'lowered', time + 200); p.reset('mode-change');
  expect(p.getDiagnostics().lastReset).toEqual({ sequence: 2, fromStep: 'raised', completedSteps: 1, reason: 'mode-change' });
  expect(p.getSnapshot()).toMatchObject({ step: 'lowered', reason: null });
});

test('manual reset keeps original reset semantics and only records a causal event after progress', () => {
  const p = new UpperBodyPreparation(); p.reset(); expect(p.getDiagnostics().lastReset).toBeNull();
  sample(p, 'lowered', 0); p.reset();
  expect(p.getDiagnostics().lastReset).toEqual({ sequence: 1, fromStep: 'raised', completedSteps: 1, reason: 'manual-reset' });
  expect(p.getSnapshot()).toMatchObject({ reason: null, completedSteps: 0, recovering: false });
});

test('a temporary recovery is not misreported as a full reset, but its expiration is', () => {
  const p = new UpperBodyPreparation(undefined, 3000); let time = sample(p, 'lowered', 0); time = sample(p, 'raised', time, 500);
  const lastValid = time - 100, bad = upperFrame(time); bad.landmarks = bad.landmarks.map((point, i) => i === 16 ? { ...point, visibility: .1 } : point); p.accept(bad, time);
  expect(p.getSnapshot().recovering).toBe(true); expect(p.getDiagnostics().lastReset).toBeNull();
  p.tick(lastValid + 3001);
  expect(p.getDiagnostics().lastReset).toEqual({ sequence: 1, fromStep: 'raised', completedSteps: 1, reason: 'recovery-timeout' });
});

test('diagnostics distinguish a completed profile immediately lost to low confidence from a rejected hold', () => {
  const p = new UpperBodyPreparation(undefined, 3000); const time = sample(p, 'hold', holdStep(p));
  expect(p.getSnapshot().step).toBe('complete'); const bad = upperFrame(time, 'hold');
  bad.landmarks = bad.landmarks.map((point, i) => i === 16 ? { ...point, visibility: .1 } : point); p.accept(bad, time);
  expect(p.getSnapshot()).toMatchObject({ step: 'lowered', completedSteps: 0, recovering: false });
  expect(p.getDiagnostics().lastReset).toEqual({ sequence: 1, fromStep: 'complete', completedSteps: 3, reason: 'low-confidence' });
});

test('hold diagnostics expose a raised-center rejection before a sampling window exists', () => {
  const p = new UpperBodyPreparation(), time = holdStep(p); p.accept(upperFrame(time, 'raised'), time);
  expect(p.getSnapshot()).toMatchObject({ step: 'hold', reason: 'hold-not-separable' });
  const d = p.getDiagnostics(); expect(d).toMatchObject({ sampleCount: 0, observedMs: 0, lastReset: null, lastSampleRejection: null });
  expect(d.hold!.left.toRaised).toBeCloseTo(0); expect(d.hold!.right.raisedLimit).toBe(.15);
  expect(d.hold!.left.toLowered).toBeGreaterThan(d.hold!.left.loweredLimit);
});

test('unstable-window rejection records the discarded sample set and survives blank frames and new candidates', () => {
  const p = new UpperBodyPreparation(); p.accept(upperFrame(0), 0);
  const moved = upperFrame(100); moved.landmarks = moved.landmarks.map((point, i) => i === 15 || i === 16 ? { ...point, x: point.x + .2 } : point); p.accept(moved, 100);
  const rejected = p.getDiagnostics().lastSampleRejection!;
  expect(rejected).toMatchObject({ step: 'lowered', reason: 'unstable', sampleCount: 2, observedMs: 100, limit: .15 });
  expect(rejected.radius).toBeGreaterThan(.15); expect(p.getDiagnostics()).toMatchObject({ sampleCount: 1, observedMs: 0 });
  const rejectionCopy = p.getDiagnostics(); rejectionCopy.lastSampleRejection!.radius = 0;
  expect(p.getDiagnostics().lastSampleRejection).toEqual(rejected);
  const blank = upperFrame(200); blank.landmarks = []; p.accept(blank, 200); p.accept(upperFrame(300), 300);
  expect(p.getDiagnostics().lastSampleRejection).toEqual(rejected);
  sample(p, 'lowered', 400, 1200); expect(p.getSnapshot().step).toBe('raised'); expect(p.getDiagnostics().lastSampleRejection).toBeNull();
});

/** Each arm has the desired vector and 150-degree elbow; only wrist x jitters. */
function vectorFrame(time: number, y: number, offset: number): PoseFrame {
  const frame = upperFrame(time), points = [...frame.landmarks];
  for (const [s, e, w, x] of [[11, 13, 15, 230], [12, 14, 16, 410]]) {
    const shoulder = { x, y: 150 }, wrist = { x: x + offset * 180, y: 150 + y * 180 };
    const dx = wrist.x - shoulder.x, dy = wrist.y - shoulder.y, length = Math.hypot(dx, dy), height = length / 2 / Math.tan(75 * Math.PI / 180);
    const elbow = { x: (shoulder.x + wrist.x) / 2 - dy / length * height, y: (shoulder.y + wrist.y) / 2 + dx / length * height };
    for (const [index, point] of [[s, shoulder], [e, elbow], [w, wrist]] as const) points[index] = { x: point.x / 640, y: point.y / 480, z: 0, visibility: .99, presence: .99 };
  }
  return { ...frame, landmarks: points };
}

test('diagnostics preserve the existing six-dimensional noise rule and expose why a green pose fails its full window', () => {
  const p = new UpperBodyPreparation(), delta = .12 / Math.sqrt(2);
  for (const [start, y] of [[0, .8], [1440, -.4], [2880, .2]]) for (let i = 0; i < 12; i++) {
    // Two center observations keep every running-window radius below .15 before the balanced jitter pairs.
    const time = start + i * 120; p.accept(vectorFrame(time, y, i < 2 ? 0 : i % 2 ? delta : -delta), time);
  }
  expect(p.getSnapshot()).toMatchObject({ step: 'hold', reason: 'hold-not-separable', progress: 0 }); expect(p.getFeedback()!.status).toBe('matched');
  const d = p.getDiagnostics(), rejected = d.lastSampleRejection!;
  expect(d).toMatchObject({ sampleCount: 0, observedMs: 0 });
  expect(rejected).toMatchObject({ step: 'hold', reason: 'hold-not-separable', sampleCount: 12, observedMs: 1320 });
  expect(rejected.radius).toBeCloseTo(.12); expect(rejected.limit).toBeCloseTo(3 * (.12 + .12) / Math.sqrt(3));
  expect(d.hold!.left.toLowered).toBeCloseTo(Math.hypot(delta, .6) / Math.sqrt(3));
  expect(d.hold!.left.loweredLimit).toBeCloseTo(3 * .12 / Math.sqrt(3));
  expect(d.hold!.right.raisedLimit).toBeCloseTo(3 * .12 / Math.sqrt(3));
  const next = upperFrame(4320); next.landmarks = next.landmarks.map((point, i) => i === 16 ? { ...point, visibility: .1 } : point); p.accept(next, 4320);
  expect(p.getDiagnostics().lastSampleRejection).toEqual(rejected);
});

test('diagnostic reads are copied, keep no coordinates and cannot advance preparation', () => {
  const p = new UpperBodyPreparation(), time = holdStep(p); p.accept(upperFrame(time, 'hold'), time);
  const snapshot = p.getSnapshot(), before = p.getDiagnostics();
  for (let i = 0; i < 20; i++) {
    const copy = p.getDiagnostics(); copy.joints[0].state = 'invalid'; copy.hold!.left.toLowered = 123;
  }
  expect(p.getDiagnostics()).toEqual(before); expect(p.getSnapshot()).toEqual(snapshot);
  for (const joint of before.joints) expect(Object.keys(joint).sort()).toEqual(['confidence', 'index', 'label', 'state']);
});
