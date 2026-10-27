import { expect, test } from 'vitest';
import { UpperBodyRecognizer } from '../../src/pose/recognizers/upperBodyRecognizer.js';
import { createRecognitionConfig } from '../../src/config/recognitionConfig.js';
import { createLeniencyConfig } from '../../src/config/recognitionTolerance.js';
import type { RecognitionEvent } from '../../src/pose/recognizers/types.js';
import type { TaskKind } from '../../src/domain/types.js';
import { upperFrame, upperProfile, upperProgress, type UpperPose } from '../helpers/upperBodyPose.js';
import { replacePoint } from '../helpers/syntheticPose.js';

function replay(task: TaskKind = 'chop', level = 3) {
  const recognizer = new UpperBodyRecognizer(upperProfile(), task, createLeniencyConfig(level));
  let time = 0;const events: RecognitionEvent[] = [];
  const pose = (kind: UpperPose, duration = 600) => {
    for (let elapsed = 0; elapsed < duration; elapsed += 50) { time += 50;events.push(...recognizer.update(upperFrame(time, kind))); }
  };
  const progress = (left: number, right = left, duration = 600) => {
    for (let elapsed = 0; elapsed < duration; elapsed += 50) { time += 50;events.push(...recognizer.update(upperProgress(time, left, right))); }
  };
  return { recognizer, events, pose, progress, get time() { return time; }, get reps() { return events.filter(event => event.kind === 'rep-completed'); } };
}
function carryProgress(time: number, ratio: number) {
  const profile = upperProfile(), frame = upperFrame(time, 'hold');
  const landmarks = frame.landmarks.map(point => ({ ...point }));
  for (const side of ['left', 'right'] as const) {
    const shoulderIndex = side === 'left' ? 11 : 12, hold = profile.hold[side], low = profile.lowered[side];
    const shoulder = { x: landmarks[shoulderIndex].x * 640, y: landmarks[shoulderIndex].y * 480 };
    const wrist = { x: shoulder.x + (hold.x + ratio * (low.x - hold.x)) * 180,
      y: shoulder.y + (hold.y + ratio * (low.y - hold.y)) * 180 };
    const angle = (hold.elbowDeg + ratio * (low.elbowDeg - hold.elbowDeg)) * Math.PI / 180;
    const dx = wrist.x - shoulder.x, dy = wrist.y - shoulder.y, length = Math.hypot(dx, dy);
    const height = length / (2 * Math.tan(angle / 2)), sign = side === 'left' ? 1 : -1;
    const elbow = { x: (shoulder.x + wrist.x) / 2 - sign * dy / length * height,
      y: (shoulder.y + wrist.y) / 2 + sign * dx / length * height };
    Object.assign(landmarks[shoulderIndex + 2], { x: elbow.x / 640, y: elbow.y / 480 });
    Object.assign(landmarks[shoulderIndex + 4], { x: wrist.x / 640, y: wrist.y / 480 });
  }
  return { ...frame, landmarks };
}

test.each(['chop', 'load'] as const)('%s emits the original legal phases, one impact and one count after both arms return', task => {
  const r = replay(task);r.pose('lowered');r.pose('raised', 1200);expect(r.reps).toHaveLength(0);
  r.pose('lowered');expect(r.reps).toHaveLength(1);
  const phases = r.events.filter(event => event.kind === 'phase').map(event => event.phase);
  expect(phases.slice(0, task === 'chop' ? 3 : 5)).toEqual(task === 'chop' ? ['ready', 'chop-down', 'chop-return']
    : ['ready', 'squat-down', 'stand-up', 'press-up', 'load-return']);
  expect(r.events.filter(event => event.kind === 'impact')).toHaveLength(1);
  expect(r.events.findIndex(event => event.kind === 'impact')).toBeLessThan(r.events.findIndex(event => event.kind === 'rep-completed'));
  expect(r.events.some(event => event.kind === 'tracking' && event.status === 'lost')).toBe(false);
});

test.each(['chop', 'load'] as const)('%s cannot count one arm, a half loop, only raised or a missing reset', task => {
  for (const kind of ['one-left', 'one-right', 'half', 'only-raised', 'no-return'] as const) {
    const r = replay(task);
    if (kind !== 'only-raised') r.pose('lowered');
    if (kind === 'one-left') r.progress(1, 0, 1200);
    else if (kind === 'one-right') r.progress(0, 1, 1200);
    else if (kind === 'half') r.progress(.5, .5, 1200);
    else r.pose('raised', 1200);
    if (kind !== 'no-return') r.pose('lowered', 1200);
    expect(r.reps, kind).toHaveLength(0);
  }
});

test.each([1, 2, 3, 4, 5])('level %s requires both arms to cross its current range gates', level => {
  const config = createLeniencyConfig(level);
  for (const task of ['chop', 'load'] as const) {
    const r = replay(task, level);r.pose('lowered');r.progress(config.repEnterRatio + .025, config.repEnterRatio + .025, 1400);r.pose('lowered');
    expect(r.reps).toHaveLength(1);
    const partial = replay(task, level);partial.pose('lowered');partial.progress(config.repEnterRatio - .025, 1, 1400);partial.pose('lowered');
    expect(partial.reps).toHaveLength(0);
    const noReset = replay(task, level);noReset.pose('lowered');noReset.pose('raised', 1400);noReset.progress(config.repReturnRatio + .025, 0, 800);
    expect(noReset.reps).toHaveLength(0);
  }
});

test.each([1, 2, 3, 4, 5])('level %s rejects any low-quality shoulder/elbow/wrist without judging invisible legs', level => {
  for (const index of [11, 12, 13, 14, 15, 16]) {
    const r = replay('chop', level);r.pose('lowered');r.pose('raised', 1200);
    expect(r.recognizer.getFeedback()).not.toBeNull();
    const events = r.recognizer.update(replacePoint(upperFrame(r.time + 50, 'raised'), index, { visibility: .59 }));
    expect(events).toContainEqual(expect.objectContaining({ kind: 'tracking', status: 'lost' }));
    expect(r.recognizer.getFeedback()).toBeNull();
    for (let elapsed = 100; elapsed <= 900; elapsed += 50) r.events.push(...r.recognizer.update(upperFrame(r.time + elapsed, 'lowered')));
    expect(r.reps).toHaveLength(0);
  }
});

test.each(['gap', 'stale', 'future', 'duplicate', 'reset', 'timeout'] as const)('%s cannot bridge an upper-body half loop', fault => {
  const r = replay();r.pose('lowered');r.pose('raised', 1200);
  let time = r.time + 50, now = time;
  if (fault === 'gap') { time = r.time + 201;now = time; }
  if (fault === 'stale') now += 301;
  if (fault === 'future') now -= 51;
  if (fault === 'duplicate') time = r.time;
  if (fault === 'reset') r.recognizer.reset();
  if (fault === 'timeout') { for (let elapsed = 50; elapsed <= 6500; elapsed += 50) r.recognizer.update(upperFrame(r.time + elapsed, 'raised'));time = r.time + 6550;now = time; }
  const events = r.recognizer.update(upperFrame(time, 'lowered'), now);
  if (!['reset', 'timeout'].includes(fault)) expect(events).toContainEqual(expect.objectContaining({ kind: 'tracking', status: 'lost' }));
  expect(events.filter(event => event.kind === 'rep-completed')).toHaveLength(0);
  for (let elapsed = 50; elapsed < 600; elapsed += 50) expect(r.recognizer.update(upperFrame(time + elapsed, 'lowered')).some(event => event.kind === 'rep-completed')).toBe(false);
});

test('minimum cycle time is retained even when samples are valid and phase confirmation is quick', () => {
  for (const task of ['chop', 'load'] as const) {
    const r = new UpperBodyRecognizer(upperProfile(), task, createRecognitionConfig({ smoothingTauMs: .001, phaseConfirmMs: 1 }));
    const events: RecognitionEvent[] = [];
    for (const [time, pose] of [[0, 'lowered'], [10, 'lowered'], [20, 'raised'], [30, 'raised'], [40, 'lowered'], [50, 'lowered']] as const)
      events.push(...r.update(upperFrame(time, pose)));
    expect(events.some(event => event.kind === 'impact')).toBe(true);
    expect(events.some(event => event.kind === 'rep-completed')).toBe(false);
  }
});

test('Carry requires continuous confirmation, releases immediately and uses only new observations on return', () => {
  const r = replay('carry');r.pose('hold', 500);expect(r.events.at(-1)).toMatchObject({ kind: 'hold-sample', holding: false, valid: true });
  r.pose('hold', 100);expect(r.events.at(-1)).toMatchObject({ holding: true, valid: true });
  r.pose('lowered', 50);expect(r.events.at(-1)).toMatchObject({ holding: false, valid: true });
  expect(r.recognizer.getFeedback()?.status).toBe('adjust');
  r.pose('hold', 400);expect(r.events.at(-1)).toMatchObject({ holding: false });
  expect(r.events.some(event => event.kind === 'rep-completed')).toBe(false);
});

test('Carry does not let smooth history conceal an immediately released or invalid arm', () => {
  const r = replay('carry');r.pose('hold', 900);
  const released = upperFrame(r.time + 50, 'hold'), lower = upperFrame(r.time + 50);
  const oneArm = { ...released, landmarks: released.landmarks.map((point, index) => [13, 15].includes(index) ? lower.landmarks[index] : point) };
  expect(r.recognizer.update(oneArm).at(-1)).toMatchObject({ kind: 'hold-sample', holding: false, valid: true });
  expect(r.recognizer.getFeedback()?.joints[15]).toBe('adjust');
  expect(r.recognizer.update(replacePoint(upperFrame(r.time + 100, 'hold'), 12, { presence: .1 }))).toContainEqual(expect.objectContaining({ kind: 'tracking', status: 'lost' }));
  expect(r.recognizer.getFeedback()).toBeNull();
});

test('Carry hysteresis accepts a bounded established drift but cannot start from that band or the released center', () => {
  const profile = upperProfile(), warm = new UpperBodyRecognizer(profile, 'carry'), cold = new UpperBodyRecognizer(profile, 'carry');
  for (let time = 0; time <= 800; time += 50) warm.update(upperFrame(time, 'hold'));
  for (let time = 850; time <= 1800; time += 50) {
    // Construct the observed elbow as well: landmark interpolation does not linearly interpolate angles.
    const frame = carryProgress(time, .43);
    expect(warm.update(frame).at(-1)).toMatchObject({ holding: true, valid: true });
    expect(cold.update(frame).at(-1)).toMatchObject({ holding: false, valid: true });
  }
  expect(warm.update(upperFrame(1850)).at(-1)).toMatchObject({ holding: false, valid: true });
});

test('Carry keeps both nearest-center gates even when configured distance tolerances overlap', () => {
  const profile = upperProfile(), r = new UpperBodyRecognizer(profile, 'carry', createRecognitionConfig({ holdEnterRatio: .6, holdExitRatio: .8 }));
  for (let time = 0; time <= 1000; time += 50) {
    const frame = carryProgress(time, .55);
    expect(r.update(frame).at(-1)).toMatchObject({ holding: false, valid: true });
  }
});

test.each(['chop', 'load'] as const)('%s alternating arm endpoints cannot build the stable confirmation window', task => {
  const r = replay(task);r.pose('lowered');
  for (let i = 0; i < 30; i++) r.progress(i % 2, i % 2, 50);
  r.pose('lowered', 1200);expect(r.reps).toHaveLength(0);
});

test('upper profiles with only one arm separated for Carry are rejected', () => {
  for (const side of ['left', 'right'] as const) {
    const profile = upperProfile();profile.hold[side] = { ...profile.lowered[side] };
    expect(() => new UpperBodyRecognizer(profile, 'carry')).toThrow('hold calibration');
  }
});

test('feedback marks only observed shoulder/elbow/wrist targets and reads cannot create counts', () => {
  const r = replay();expect(r.recognizer.getFeedback()).toBeNull();r.pose('raised');
  expect(r.recognizer.getFeedback()?.status).toBe('adjust');
  r.pose('lowered');r.progress(1, 0, 1200);
  const f = r.recognizer.getFeedback()!;
  expect(f.status).toBe('adjust');expect(f.joints[15]).toBe('matched');expect(f.joints[16]).toBe('adjust');
  expect(Object.keys(f.joints).every(key => Number(key) >= 11 && Number(key) <= 16)).toBe(true);
  const count = r.events.length;for (let i = 0; i < 20; i++) r.recognizer.getFeedback();expect(r.events).toHaveLength(count);expect(r.reps).toHaveLength(0);
  r.recognizer.reset();expect(r.recognizer.getFeedback()).toBeNull();
});

test.each(['non-finite', 'left-travel', 'right-travel', 'identical-hold', 'width', 'height', 'center', 'scale'] as const)('invalid upper calibration %s is rejected before training', fault => {
  const p = upperProfile();
  if (fault === 'non-finite') p.hold.left.elbowDeg = NaN;
  if (fault === 'left-travel') p.raised.left.y = p.lowered.left.y;
  if (fault === 'right-travel') p.raised.right.y = p.lowered.right.y + 1;
  if (fault === 'identical-hold') p.hold = structuredClone(p.lowered);
  if (fault === 'width') p.reference.width = 0;
  if (fault === 'height') p.reference.height = Infinity;
  if (fault === 'center') p.reference.center.x = NaN;
  if (fault === 'scale') p.reference.scalePx = 0;
  expect(() => new UpperBodyRecognizer(p, 'chop')).toThrow();
});
