import { expect, test } from 'vitest';
import { CalibrationSession } from '../../src/pose/calibrationSession.js';
import { syntheticFrame, replacePoint, type SyntheticPose } from '../helpers/syntheticPose.js';
function capture(session: CalibrationSession, pose: SyntheticPose, start: number, duration: number): number {
  session.ingest(syntheticFrame(start, pose), start);expect(session.beginCapture()).toBe(true);
  for (let t = start + 100; t <= start + duration + 100; t += 100) session.ingest(syntheticFrame(t, pose), t);
  return start + duration + 200;
}
function allExamples(session: CalibrationSession): number {
  let time = capture(session, 'standing', 0, 2000);
  for (const pose of ['raised', 'down', 'squat', 'standing', 'press', 'standing'] as const) time = capture(session, pose, time, 600);
  return capture(session, 'hold', time, 2000);
}
test('guided calibration collects all examples, reports per-task readiness and never counts reps', () => {
  const session = new CalibrationSession();const time = allExamples(session);
  expect(session.getSnapshot().readyFor).toEqual({ chop: true, load: true, carry: false });
  capture(session, 'standing', time, 2000);
  expect(session.getSnapshot()).toMatchObject({ complete: true, readyFor: { chop: true, load: true, carry: true }, capturing: false });
  expect(session.getSnapshot().calibration?.primarySide).toBe('right');
});
test('identical carry hold/release is refused without discarding successful chop/load calibration', () => {
  const session = new CalibrationSession();const time = allExamples(session);capture(session, 'hold', time, 2000);
  expect(session.getSnapshot()).toMatchObject({ step: 'carry-release', reason: 'carry-not-separable', readyFor: { chop: true, load: true, carry: false } });
});
test('a no-motion chop example cannot become ready', () => {
  const session = new CalibrationSession();let time = capture(session, 'standing', 0, 2000);
  time = capture(session, 'raised', time, 600);capture(session, 'raised', time, 600);
  expect(session.getSnapshot()).toMatchObject({ step: 'chop-down', reason: 'insufficient-chop-range', readyFor: { chop: false, load: false, carry: false } });
});
test.each(['stale', 'future', 'order', 'gap', 'low', 'jump', 'resize'] as const)('%s invalidates prior readiness and requires new preparation', kind => {
  const session = new CalibrationSession();const time = capture(session, 'standing', 0, 2000);
  expect(session.getSnapshot().calibration).not.toBeNull();
  let frame = syntheticFrame(time), now = time;
  if (kind === 'stale') now += 301;
  if (kind === 'future') frame = syntheticFrame(time + 51);
  if (kind === 'order') frame = syntheticFrame(1000);
  if (kind === 'gap') { frame = syntheticFrame(time + 201);now += 201; }
  if (kind === 'low') frame = replacePoint(frame, 16, { visibility: .1 });
  if (kind === 'jump') frame = { ...frame, landmarks: frame.landmarks.map(p => ({ ...p, x: p.x + .16 })) };
  if (kind === 'resize') frame = syntheticFrame(time, 'standing', 1280);
  session.ingest(frame, now);
  expect(session.getSnapshot()).toMatchObject({ calibration: null, step: 'standing', readyFor: { chop: false, load: false, carry: false } });
});
test('sample timeout, side change and reset cancel captures and clear prototypes', () => {
  const session = new CalibrationSession();session.ingest(syntheticFrame(0), 0);session.beginCapture();
  session.tick(301);expect(session.getSnapshot()).toMatchObject({ capturing: false, reason: 'stale' });
  const time = capture(session, 'standing', 400, 2000);session.setPrimarySide('left');
  expect(session.getSnapshot()).toMatchObject({ calibration: null, primarySide: 'left', step: 'standing' });
  session.ingest(syntheticFrame(time), time);session.beginCapture();session.reset();
  for (let t = time + 100; t < time + 2500; t += 100) session.ingest(syntheticFrame(t), t);
  expect(session.getSnapshot()).toMatchObject({ calibration: null, capturing: false, step: 'standing' });
});
test('calibration exposes named immutable-by-copy examples for later recognizers, then reset clears them', () => {
  const session = new CalibrationSession();const time = allExamples(session);capture(session, 'standing', time, 2000);
  const examples = session.getSnapshot().examples;
  expect(examples['carry-hold']?.wrist.y).toBeLessThan(examples['carry-release']!.wrist.y);
  expect(examples['load-squat']?.kneeDeg).toBeLessThan(examples['load-stand']!.kneeDeg);
  examples['carry-hold']!.wrist.y = 123;
  expect(session.getSnapshot().examples['carry-hold']!.wrist.y).not.toBe(123);
  session.reset();expect(session.getSnapshot().examples).toEqual({});
});
test('negative arrival time cannot start preparation', () => {
  const session = new CalibrationSession();session.ingest(syntheticFrame(), -1);expect(session.getSnapshot().available).toBe(false);
});
test('degenerate smoothed geometry cannot remain calibrated', () => {
  const session = new CalibrationSession();
  const time = capture(session, 'standing', 100, 2000);
  const frame = syntheticFrame(time), alpha = 1 - Math.exp(-100 / 60), elbow = frame.landmarks[14]!, wrist = frame.landmarks[16]!;
  const collapse = replacePoint(frame, 16, { x: elbow.x + (elbow.x - wrist.x) * (1 - alpha) / alpha, y: elbow.y + (elbow.y - wrist.y) * (1 - alpha) / alpha });
  session.ingest(collapse, time);expect(session.getSnapshot().calibration).toBeNull();
});
test.each([
  [2, 'standing', 'insufficient-squat-range'], [3, 'squat', 'not-returned'],
  [4, 'standing', 'insufficient-press-range'], [5, 'press', 'not-returned'],
] as const)('load example %i rejects an incomplete demonstration', (index, badPose, reason) => {
  const session = new CalibrationSession();let time = capture(session, 'standing', 0, 2000);
  const poses = ['raised', 'down', 'squat', 'standing', 'press', 'standing'] as const;
  for (let i = 0; i < index; i++) time = capture(session, poses[i], time, 600);
  capture(session, badPose, time, 600);expect(session.getSnapshot().reason).toBe(reason);
  expect(session.getSnapshot().readyFor).toEqual({ chop: true, load: false, carry: false });
});
