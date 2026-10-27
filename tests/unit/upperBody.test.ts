import { expect, test } from 'vitest';
import { UpperBodyPreparation, UpperBodyStream } from '../../src/pose/upperBody.js';
import type { PoseFrame } from '../../src/pose/types.js';
import { createRecognitionConfig } from '../../src/config/recognitionConfig.js';

type Pose = 'lowered' | 'raised' | 'hold';
function frame(time = 0, pose: Pose = 'lowered'): PoseFrame {
  const points = Array.from({ length: 33 }, () => ({ x: -2, y: 3, z: 0, visibility: .01, presence: .01 }));
  const xy = pose === 'lowered' ? [[230, 160], [410, 160], [230, 225], [410, 225], [230, 300], [410, 300]]
    : pose === 'raised' ? [[230, 160], [410, 160], [220, 115], [420, 115], [220, 65], [420, 65]]
    : [[230, 160], [410, 160], [235, 210], [405, 210], [280, 220], [360, 220]];
  xy.forEach(([x, y], i) => { points[11 + i] = { x: x / 640, y: y / 480, z: 0, visibility: .99, presence: .99 }; });
  return { frameId: time + 1, capturedAtMs: time, width: 640, height: 480, landmarks: points, valid: true, inferenceMs: 0 };
}
function observe(preparation: UpperBodyPreparation, pose: Pose, start = 0, duration = 1300, dt = 100): number {
  for (let t = start; t <= start + duration; t += dt) preparation.accept(frame(t, pose), t);
  return start + duration + dt;
}

test('upper-body observation accepts only six usable points and uses shoulder-width coordinates', () => {
  const stream = new UpperBodyStream(), sample = stream.read(frame(50), 50);
  expect(sample).not.toBeNull(); expect(sample!.raw.scalePx).toBeCloseTo(180);
  expect(sample!.raw.left).toMatchObject({ x: 0 }); expect(sample!.raw.left.y).toBeCloseTo(140 / 180);
  expect(sample!.raw.right.y).toBeCloseTo(140 / 180); expect(sample!.raw.left.elbowDeg).toBeCloseTo(180);
  expect(sample!.smooth).toEqual(sample!.raw);
});

test('normalization preserves image aspect ratio, anatomical sides and confidence validity', () => {
  const original = frame(50), resized = { ...original, width: 1280, landmarks: original.landmarks.map(p => ({ ...p, x: p.x / 2 })) };
  const a = new UpperBodyStream().read(original, 50)!, b = new UpperBodyStream().read(resized, 50)!;
  expect(b.raw.left).toEqual(a.raw.left); expect(b.raw.right).toEqual(a.raw.right);
  for (const bad of [.59, -1, 2, NaN]) {
    const invalid = frame(50); invalid.landmarks = invalid.landmarks.map((p, i) => i === 16 ? { ...p, presence: bad } : p);
    expect(new UpperBodyStream().read(invalid, 50)).toBeNull();
  }
});

test('unobserved lower-body coordinates are ignored and valid temporal boundaries remain inclusive', () => {
  const six = frame(50); six.landmarks = six.landmarks.map((p, i) => i >= 11 && i <= 16 ? p : { ...p, x: NaN, y: Infinity, z: NaN });
  expect(new UpperBodyStream().read(six, 50)).not.toBeNull();
  expect(new UpperBodyStream().read(frame(50), 350)).not.toBeNull();
  expect(new UpperBodyStream().read(frame(50), 0)).not.toBeNull();
  const stream = new UpperBodyStream(); stream.read(frame(0), 0); expect(stream.read(frame(200), 200)).not.toBeNull();
});

test('smoothing uses observed intervals and returned objects cannot mutate later observations', () => {
  const stream = new UpperBodyStream(), first = stream.read(frame(0), 0)!;
  const changed = stream.read(frame(60, 'raised'), 60)!, alpha = 1 - Math.exp(-1);
  expect(changed.smooth.left.y).toBeCloseTo(first.raw.left.y + alpha * (changed.raw.left.y - first.raw.left.y));
  changed.smooth.left.y = 123; changed.raw.center.x = 0;
  const next = stream.read(frame(120, 'raised'), 120)!; expect(next.smooth.left.y).toBeLessThan(1);
  const invalid = frame(170); invalid.landmarks = invalid.landmarks.map((p, i) => i === 15 ? { ...p, visibility: .1 } : p);
  expect(stream.read(invalid, 170)).toBeNull();
  const fresh = stream.read(frame(220, 'raised'), 220)!; expect(fresh.smooth).toEqual(fresh.raw);
});

test.each(['stale', 'future', 'duplicate', 'gap', 'resize', 'moved', 'scale', 'missing', 'degenerate'] as const)('stream rejects %s and cannot filter an invalid arm into validity', fault => {
  const stream = new UpperBodyStream(); expect(stream.read(frame(50), 50)).not.toBeNull();
  let next = frame(100), now = 100;
  if (fault === 'stale') now = 401;
  if (fault === 'future') now = 49;
  if (fault === 'duplicate') next = frame(50);
  if (fault === 'gap') { next = frame(251); now = 251; }
  if (fault === 'resize') next.width = 1280;
  if (fault === 'moved') next.landmarks = next.landmarks.map((p, i) => i >= 11 && i <= 16 ? { ...p, x: p.x + .25 } : p);
  if (fault === 'scale') next.landmarks = next.landmarks.map((p, i) => i >= 11 && i <= 16 ? { ...p, x: .5 + (p.x - .5) * 1.6 } : p);
  if (fault === 'missing') next.landmarks = next.landmarks.map((p, i) => i === 14 ? { ...p, visibility: .1 } : p);
  if (fault === 'degenerate') next.landmarks = next.landmarks.map((p, i) => i === 15 ? { ...next.landmarks[13] } : p);
  expect(stream.read(next, now)).toBeNull(); expect(stream.reason).not.toBeNull();
});

test('a reference rejects slow retreat and movement despite locally normalized poses staying identical', () => {
  const first = new UpperBodyStream().read(frame(0), 0)!.raw;
  const reference = { width: first.width, height: first.height, center: first.center, scalePx: first.scalePx };
  const stream = new UpperBodyStream(undefined, reference); reference.scalePx = 1;
  expect(stream.read(frame(50), 50)).not.toBeNull();
  for (let i = 1; i <= 10; i++) {
    const next = frame(50 + i * 50), factor = 1 - i * .04;
    next.landmarks = next.landmarks.map((p, j) => j >= 11 && j <= 16 ? { ...p, x: .5 + factor * (p.x - .5), y: 1 / 3 + factor * (p.y - 1 / 3) } : p);
    const sample = stream.read(next, next.capturedAtMs);
    if (i === 10) { expect(sample).toBeNull(); expect(stream.reason).toBe('person-moved'); }
  }
});

test('automatic preparation collects three distinct stable references using real samples and copies its profile', () => {
  const preparation = new UpperBodyPreparation(); let time = observe(preparation, 'lowered');
  expect(preparation.getSnapshot().step).toBe('raised'); expect(preparation.getProfile()).toBeNull();
  time = observe(preparation, 'raised', time); expect(preparation.getSnapshot().step).toBe('hold');
  observe(preparation, 'hold', time); expect(preparation.getSnapshot()).toMatchObject({ step: 'complete', available: true });
  const profile = preparation.getProfile()!; expect(profile).not.toBeNull(); profile.lowered.left.y = 123; profile.reference.center.x = 0;
  expect(preparation.getProfile()!.lowered.left.y).not.toBe(123); expect(preparation.getProfile()!.reference.center.x).toBeCloseTo(320);
});

test('a repeated pose cannot pass the next step, including raised held as carry posture', () => {
  const preparation = new UpperBodyPreparation(); let time = observe(preparation, 'lowered', 0, 4000);
  expect(preparation.getSnapshot().step).toBe('raised');
  time = observe(preparation, 'raised', time, 4000); expect(preparation.getSnapshot().step).toBe('hold'); expect(preparation.getProfile()).toBeNull();
  observe(preparation, 'hold', time); expect(preparation.getProfile()).not.toBeNull();
});

test.each(['lowered', 'raised'] as const)('hold preparation requires each arm to differ from its %s reference', unchanged => {
  const preparation = new UpperBodyPreparation(); let time = observe(preparation, 'lowered'); time = observe(preparation, 'raised', time);
  for (let t = time; t <= time + 1500; t += 100) {
    const mixed = frame(t, 'hold'), old = frame(t, unchanged);
    mixed.landmarks = mixed.landmarks.map((p, i) => [12, 14, 16].includes(i) ? { ...old.landmarks[i] } : p);
    preparation.accept(mixed, t);
  }
  expect(preparation.getSnapshot().step).toBe('hold'); expect(preparation.getProfile()).toBeNull();
  observe(preparation, 'hold', time + 1600); expect(preparation.getProfile()).not.toBeNull();
});

test('unstable candidates wait for a new stable window and completed preparation expires without fresh input', () => {
  const preparation = new UpperBodyPreparation();
  for (let t = 0; t <= 2000; t += 100) {
    const moving = frame(t); moving.landmarks = moving.landmarks.map((p, i) => t % 200 === 0 && (i === 15 || i === 16) ? { ...p, x: p.x + .15 } : p);
    preparation.accept(moving, t);
  }
  expect(preparation.getSnapshot()).toMatchObject({ step: 'lowered', reason: 'unstable' });
  let time = observe(preparation, 'lowered', 2100); time = observe(preparation, 'raised', time); time = observe(preparation, 'hold', time);
  expect(preparation.getProfile()).not.toBeNull(); preparation.tick(time + 301);
  expect(preparation.getProfile()).toBeNull(); expect(preparation.getSnapshot()).toMatchObject({ step: 'lowered', available: false, progress: 0, reason: 'stale' });
});

test('lowered and raised preparation require both arms, shoulder height and comfortable configured travel', () => {
  const preparation = new UpperBodyPreparation();
  for (let t = 0; t <= 1500; t += 100) {
    const invalid = frame(t); invalid.landmarks = invalid.landmarks.map((p, i) => i === 15 ? { ...p, y: 180 / 480 } : p);
    preparation.accept(invalid, t);
  }
  expect(preparation.getSnapshot().step).toBe('lowered');
  let time = observe(preparation, 'lowered', 1600);
  for (let t = time; t <= time + 1500; t += 100) {
    const oneArm = frame(t, 'raised'); oneArm.landmarks = oneArm.landmarks.map((p, i) => i === 16 ? { ...p, y: 200 / 480 } : p);
    preparation.accept(oneArm, t);
  }
  expect(preparation.getSnapshot().step).toBe('raised'); time += 1600;
  observe(preparation, 'raised', time); expect(preparation.getSnapshot().step).toBe('hold');
});

test('tick cannot collect samples or fill unobserved time and sparse samples cannot finish preparation', () => {
  const preparation = new UpperBodyPreparation(); preparation.accept(frame(0), 0); preparation.tick(200);
  expect(preparation.getSnapshot().progress).toBe(0); expect(preparation.getSnapshot().step).toBe('lowered');
  preparation.tick(301); expect(preparation.getSnapshot()).toMatchObject({ available: false, progress: 0 });
  let time = observe(preparation, 'lowered', 400, 1200, 200);
  expect(preparation.getSnapshot().step).toBe('lowered');
  time = observe(preparation, 'lowered', time, 1200, 200); expect(preparation.getSnapshot().step).toBe('raised');
  preparation.reset(); observe(preparation, 'lowered', 0, 500, 25); expect(preparation.getSnapshot().step).toBe('lowered');
});

test.each(['low', 'gap', 'duplicate', 'stale', 'future', 'resize'] as const)('preparation invalidates all completed evidence on %s', fault => {
  const preparation = new UpperBodyPreparation(); const time = observe(preparation, 'lowered');
  expect(preparation.getSnapshot().step).toBe('raised'); let next = frame(time, 'raised'), now = time;
  if (fault === 'low') next.landmarks = next.landmarks.map((p, i) => i === 11 ? { ...p, visibility: .1 } : p);
  if (fault === 'gap') { next = frame(time + 201, 'raised'); now = next.capturedAtMs; }
  if (fault === 'duplicate') next = frame(time - 100, 'raised');
  if (fault === 'stale') now += 301;
  if (fault === 'future') now -= 51;
  if (fault === 'resize') next.height = 960;
  preparation.accept(next, now); expect(preparation.getSnapshot()).toMatchObject({ step: 'lowered', available: false, progress: 0 }); expect(preparation.getProfile()).toBeNull();
});

test('preparation feedback immediately judges the lowered target and repeated reads cannot sample or mutate it', () => {
  const preparation = new UpperBodyPreparation(); expect(preparation.getFeedback()).toBeNull();
  const sample = frame(50), before = JSON.stringify(sample); preparation.accept(sample, 50);
  const snapshot = preparation.getSnapshot();
  expect(preparation.getFeedback()).toMatchObject({ status: 'matched', joints: { 11: 'matched', 12: 'matched', 13: 'matched', 14: 'matched', 15: 'matched', 16: 'matched' } });
  for (let i = 0; i < 50; i++) {
    const feedback = preparation.getFeedback()!; feedback.joints = { 15: 'adjust' };
  }
  expect(preparation.getFeedback()!.joints[15]).toBe('matched');
  expect(preparation.getSnapshot()).toEqual(snapshot); expect(preparation.getProfile()).toBeNull(); expect(JSON.stringify(sample)).toBe(before);
});

test('lowered feedback uses the inclusive shoulder-width boundary independently for each arm', () => {
  const preparation = new UpperBodyPreparation(), short = frame(50);
  short.landmarks = short.landmarks.map((p, i) => i === 15 ? { ...p, y: 204.8 / 480 } : p); preparation.accept(short, 50);
  expect(preparation.getFeedback()).toMatchObject({ status: 'adjust', joints: { 11: 'adjust', 13: 'adjust', 15: 'adjust', 12: 'matched', 14: 'matched', 16: 'matched' } });
  expect(preparation.getSnapshot()).toMatchObject({ step: 'lowered', progress: 0, reason: 'not-lowered' });
  const boundary = frame(100); boundary.landmarks = boundary.landmarks.map((p, i) => i === 15 ? { ...p, y: 205 / 480 } : p); preparation.accept(boundary, 100);
  expect(preparation.getFeedback()!.status).toBe('matched'); expect(preparation.getSnapshot().progress).toBe(0);
});

test('raised feedback requires both shoulder height and the configured personal range per arm', () => {
  const preparation = new UpperBodyPreparation(createRecognitionConfig({ minPressTravelTorso: .8 }));
  const time = observe(preparation, 'lowered'); expect(preparation.getSnapshot().step).toBe('raised');
  const mixed = frame(time, 'raised'); mixed.landmarks = mixed.landmarks.map((p, i) => i === 15 ? { ...p, y: 140 / 480 } : i === 16 ? { ...p, y: 160 / 480 } : p);
  preparation.accept(mixed, time);
  expect(preparation.getFeedback()).toMatchObject({ status: 'adjust', joints: { 11: 'matched', 13: 'matched', 15: 'matched', 12: 'adjust', 14: 'adjust', 16: 'adjust' } });
  expect(preparation.getSnapshot()).toMatchObject({ step: 'raised', progress: 0, reason: 'insufficient-raise-range' });
  preparation.accept(frame(time + 100, 'raised'), time + 100); expect(preparation.getFeedback()!.status).toBe('matched');
});

test.each(['lowered', 'raised'] as const)('hold feedback marks the arm still at its %s reference without blaming the other arm', unchanged => {
  const preparation = new UpperBodyPreparation(); let time = observe(preparation, 'lowered'); time = observe(preparation, 'raised', time);
  const mixed = frame(time, 'hold'), old = frame(time, unchanged);
  mixed.landmarks = mixed.landmarks.map((p, i) => [12, 14, 16].includes(i) ? { ...old.landmarks[i] } : p); preparation.accept(mixed, time);
  expect(preparation.getFeedback()).toMatchObject({ status: 'adjust', joints: { 11: 'matched', 13: 'matched', 15: 'matched', 12: 'adjust', 14: 'adjust', 16: 'adjust' } });
  expect(preparation.getSnapshot()).toMatchObject({ step: 'hold', progress: 0, reason: 'hold-not-separable' });
  preparation.accept(frame(time + 100, 'hold'), time + 100); expect(preparation.getFeedback()!.status).toBe('matched');
});

test('hold feedback retains the stored reference-noise separation gate', () => {
  const preparation = new UpperBodyPreparation(createRecognitionConfig({ carryNoiseMultiplier: 1000 }));
  for (let time = 0; time <= 1300; time += 100) {
    const jittered = frame(time); jittered.landmarks = jittered.landmarks.map((p, i) => i === 15 || i === 16 ? { ...p, x: p.x + (time % 200 === 0 ? .001 : -.001) } : p);
    preparation.accept(jittered, time);
  }
  const time = observe(preparation, 'raised', 1400); preparation.accept(frame(time, 'hold'), time);
  expect(preparation.getSnapshot()).toMatchObject({ step: 'hold', reason: 'hold-not-separable', progress: 0 });
  expect(preparation.getFeedback()).toMatchObject({ status: 'adjust', joints: { 11: 'adjust', 12: 'adjust', 13: 'adjust', 14: 'adjust', 15: 'adjust', 16: 'adjust' } });
});

test.each(['low', 'stale', 'gap', 'duplicate', 'future', 'out-of-frame', 'reset'] as const)('preparation feedback is unknown immediately on %s', fault => {
  const preparation = new UpperBodyPreparation(); preparation.accept(frame(50), 50); expect(preparation.getFeedback()).not.toBeNull();
  let next = frame(100), now = 100;
  if (fault === 'low') next.landmarks = next.landmarks.map((p, i) => i === 13 ? { ...p, visibility: .59 } : p);
  if (fault === 'gap') { next = frame(251); now = 251; }
  if (fault === 'duplicate') next = frame(50);
  if (fault === 'future') now = 49;
  if (fault === 'out-of-frame') next.landmarks = next.landmarks.map((p, i) => i === 15 ? { ...p, x: .001 } : p);
  if (fault === 'stale') preparation.tick(351);
  else if (fault === 'reset') preparation.reset();
  else preparation.accept(next, now);
  expect(preparation.getFeedback()).toBeNull(); expect(preparation.getProfile()).toBeNull();
});

test('completed preparation feedback stays neutral instead of judging arbitrary subsequent poses green', () => {
  const preparation = new UpperBodyPreparation(); let time = observe(preparation, 'lowered'); time = observe(preparation, 'raised', time); time = observe(preparation, 'hold', time);
  expect(preparation.getFeedback()).toMatchObject({ status: 'moving', joints: {} }); expect(preparation.getFeedback()!.message).toContain('准备完成');
  preparation.accept(frame(time, 'lowered'), time);
  expect(preparation.getFeedback()).toMatchObject({ status: 'moving', joints: {} }); expect(preparation.getProfile()).not.toBeNull();
});
