import { expect, test } from 'vitest';
import { ChopRecognizer } from '../../src/pose/recognizers/chopRecognizer.js';
import { LoadRecognizer } from '../../src/pose/recognizers/loadRecognizer.js';
import { CarryRecognizer } from '../../src/pose/recognizers/carryRecognizer.js';
import { syntheticProfile } from '../helpers/recognizerReplay.js';
import { extractFeatures, type PoseFeatures } from '../../src/pose/features.js';
import { replacePoint, syntheticFrame, type SyntheticPose } from '../helpers/syntheticPose.js';
import { createRecognitionConfig, recognitionConfig } from '../../src/config/recognitionConfig.js';
import { createLeniencyConfig } from '../../src/config/recognitionTolerance.js';
import { assessRecognitionFeedback, type RecognitionFeedbackInput } from '../../src/pose/recognitionFeedback.js';

const profile = syntheticProfile();
function features(pose: SyntheticPose = 'standing'): PoseFeatures {
  return extractFeatures(syntheticFrame(0, pose), profile.calibration)!;
}
function assess(task: RecognitionFeedbackInput['task'], phase: string, f: PoseFeatures, extra: Partial<RecognitionFeedbackInput> = {}) {
  return assessRecognitionFeedback({ task, phase, features: f, profile, config: recognitionConfig, ...extra });
}
function chop(progress: number): PoseFeatures {
  const f = features('raised');
  f.sides.right!.wrist.y = profile.examples['chop-raised']!.wrist.y + progress *
    (profile.examples['chop-down']!.wrist.y - profile.examples['chop-raised']!.wrist.y);
  return f;
}
function load(flex: number, hip: number, press = 0): PoseFeatures {
  const f = features(), stand = profile.examples['load-stand']!, squat = profile.examples['load-squat']!;
  f.sides.right!.kneeDeg = stand.kneeDeg - flex * (stand.kneeDeg - squat.kneeDeg);
  f.hipHeight = stand.hipHeight - hip * (stand.hipHeight - squat.hipHeight);
  f.sides.right!.wrist.y = stand.wrist.y - press * (stand.wrist.y - profile.examples['load-press']!.wrist.y);
  return f;
}
function carry(progress: number): PoseFeatures {
  const f = features('hold'), hold = profile.examples['carry-hold']!, release = profile.examples['carry-release']!;
  const s = f.sides.right!;
  s.wrist.x = hold.wrist.x + progress * (release.wrist.x - hold.wrist.x);
  s.wrist.y = hold.wrist.y + progress * (release.wrist.y - hold.wrist.y);
  s.elbowDeg = hold.elbowDeg + progress * (release.elbowDeg - hold.elbowDeg);
  s.kneeDeg = hold.kneeDeg + progress * (release.kneeDeg - hold.kneeDeg);
  f.hipHeight = hold.hipHeight + progress * (release.hipHeight - hold.hipHeight);
  return f;
}
const rightArm = { 12: 'matched', 14: 'matched', 16: 'matched' };

test.each([['chop', ChopRecognizer], ['load', LoadRecognizer], ['carry', CarryRecognizer]] as const)('recognizers expose unknown feedback before valid observations: %s', (_task, Recognizer) => {
  const recognizer = new Recognizer(syntheticProfile());
  const feedback = recognizer as unknown as { getFeedback?: () => unknown };
  expect(typeof feedback.getFeedback).toBe('function');
  expect(feedback.getFeedback?.()).toBeNull();
});

test('chop compares only the measured primary arm with the required starting step', () => {
  expect(assess('chop', 'unready', features('raised'))).toMatchObject({ status: 'matched', joints: rightArm });
  const wrong = assess('chop', 'unready', features('down'));
  expect(wrong.status).toBe('adjust');
  expect(wrong.joints).toEqual({ 12: 'adjust', 14: 'adjust', 16: 'adjust' });
  expect(wrong.joints[11]).toBeUndefined();
  expect(wrong.message.length).toBeLessThanOrEqual(16);
});

test.each(['ready', 'chop-down', 'chop-return'])('chop transition bands stay neutral in %s', phase => {
  expect(assess('chop', phase, chop(.5))).toMatchObject({ status: 'moving', joints: {} });
});

test('chop accepts observed endpoints but requires returning after the down phase', () => {
  expect(assess('chop', 'ready', features('down')).status).toBe('matched');
  expect(assess('chop', 'chop-down', features('down')).status).toBe('matched');
  expect(assess('chop', 'chop-return', features('raised')).status).toBe('matched');
  expect(assess('chop', 'chop-return', features('down')).status).toBe('adjust');
});

test('left-primary calibration colors the left arm without borrowing right-side data', () => {
  const p = structuredClone(profile);p.calibration = { ...p.calibration, primarySide: 'left' };
  const f = features('raised');f.sides.left!.wrist = { ...p.examples['chop-raised']!.wrist };
  expect(assess('chop', 'unready', f, { profile: p }).joints).toEqual({ 11: 'matched', 13: 'matched', 15: 'matched' });
});

test('load before its squat flags an early press on the primary arm only', () => {
  const feedback = assess('load', 'ready', load(0, 0, 1));
  expect(feedback.status).toBe('adjust');
  expect(feedback.joints).toMatchObject({ 12: 'adjust', 14: 'adjust', 16: 'adjust', 26: 'matched', 23: 'matched', 24: 'matched' });
  expect(feedback.joints[25]).toBeUndefined();
});

test.each([
  [1, 0, { 26: 'matched', 23: 'adjust', 24: 'adjust' }],
  [0, 1, { 26: 'adjust', 23: 'matched', 24: 'matched' }],
] as const)('load squat localizes missing knee or hip evidence (%s,%s)', (flex, hip, joints) => {
  const feedback = assess('load', 'ready', load(flex, hip));
  expect(feedback.status).toBe('adjust');expect(feedback.joints).toMatchObject(joints);
});

test('load permits matched endpoints and neutral transitions while standing back up', () => {
  expect(assess('load', 'ready', load(0, 0)).status).toBe('matched');
  expect(assess('load', 'ready', load(1, 1)).status).toBe('matched');
  expect(assess('load', 'squat-down', load(.5, .5))).toMatchObject({ status: 'moving', joints: {} });
  expect(assess('load', 'squat-down', load(0, 0, 1)).status).toBe('matched');
});

test('load press identifies a missing arm target without blaming the upright knee or hips', () => {
  const feedback = assess('load', 'stand-up', load(0, 0));
  expect(feedback.status).toBe('adjust');
  expect(feedback.joints).toMatchObject({ 12: 'adjust', 14: 'adjust', 16: 'adjust', 26: 'matched', 23: 'matched', 24: 'matched' });
  expect(assess('load', 'stand-up', load(0, 0, .5)).status).toBe('moving');
  expect(assess('load', 'stand-up', load(0, 0, 1)).status).toBe('matched');
});

test('load return accepts the top or restored endpoint but rejects leaving the legs bent', () => {
  expect(assess('load', 'press-up', load(0, 0, 1)).status).toBe('matched');
  expect(assess('load', 'press-up', load(0, 0)).status).toBe('matched');
  const feedback = assess('load', 'press-up', load(1, 1, 1));
  expect(feedback.status).toBe('adjust');expect(feedback.joints).toMatchObject({ 26: 'adjust', 23: 'adjust', 24: 'adjust' });
});

test.each([1, 2, 3, 4, 5])('feedback reads the actual current leniency configuration at level %s', level => {
  const config = createLeniencyConfig(level);
  expect(assess('chop', 'ready', chop(config.repEnterRatio + .001), { config }).status).toBe('matched');
  expect(assess('chop', 'ready', chop(config.repEnterRatio - .001), { config }).status).toBe('moving');
  expect(assess('load', 'ready', load(config.repEnterRatio + .001, config.repEnterRatio + .001), { config }).status).toBe('matched');
  expect(assess('load', 'ready', load(config.repEnterRatio - .001, config.repEnterRatio - .001), { config }).status).toBe('moving');
  expect(assess('carry', 'released', carry(config.holdEnterRatio - .001), { config }).status).toBe('matched');
  expect(assess('carry', 'released', carry(config.holdEnterRatio + .001), { config }).status).toBe('moving');
});

test('carry feedback uses raw and smooth hold gates and the nearest personal center', () => {
  expect(assess('carry', 'confirming', carry(0)).status).toBe('matched');
  expect(assess('carry', 'holding', carry(.45)).status).toBe('matched');
  expect(assess('carry', 'released', carry(.45))).toMatchObject({ status: 'moving', joints: {} });
  expect(assess('carry', 'holding', carry(0), { rawFeatures: carry(1) }).status).toBe('adjust');
  expect(assess('carry', 'holding', carry(.55), { config: createRecognitionConfig({ holdEnterRatio: .6, holdExitRatio: .8 }) }).status).toBe('adjust');
  expect(assess('carry', 'released', features('standing')).status).toBe('adjust');
});

test.each(['arm', 'knee', 'hip'] as const)('carry localizes a dominant %s deviation without coloring the opposite limb', part => {
  const f = features('hold');
  if (part === 'arm') f.sides.right!.wrist.x += 2;
  if (part === 'knee') f.sides.right!.kneeDeg -= 180;
  if (part === 'hip') f.hipHeight += 2;
  const feedback = assess('carry', 'holding', f);
  expect(feedback.status).toBe('adjust');
  expect(feedback.joints).toMatchObject({
    12: part === 'arm' ? 'adjust' : 'matched',
    14: part === 'arm' ? 'adjust' : 'matched',
    16: part === 'arm' ? 'adjust' : 'matched',
    26: part === 'knee' ? 'adjust' : 'matched',
    23: part === 'hip' ? 'adjust' : 'matched',
    24: part === 'hip' ? 'adjust' : 'matched',
  });
  expect(feedback.joints[11]).toBeUndefined();expect(feedback.joints[25]).toBeUndefined();
});

test.each([['chop', ChopRecognizer, 'raised'], ['load', LoadRecognizer, 'standing'], ['carry', CarryRecognizer, 'hold']] as const)(
  '%s drops judgments immediately after invalid data or reset', (_task, Recognizer, pose) => {
    const r = new Recognizer(profile);r.update(syntheticFrame(50, pose));expect(r.getFeedback()).not.toBeNull();
    r.update(replacePoint(syntheticFrame(100, pose), 16, { visibility: .1 }));expect(r.getFeedback()).toBeNull();
    r.update(syntheticFrame(150, pose));expect(r.getFeedback()).not.toBeNull();
    r.reset();expect(r.getFeedback()).toBeNull();
  },
);

test('completed feedback is green for one observation and repeated reads cannot produce events or counts', () => {
  const observed = new ChopRecognizer(profile), control = new ChopRecognizer(profile);
  let time = 0, completed = 0;
  for (const pose of ['raised', 'down', 'raised'] as const) {
    for (let i = 0; i < 8; i++) {
      time += 50;const frame = syntheticFrame(time, pose), before = JSON.stringify(frame);
      const events = observed.update(frame), expectedEvents = control.update(frame);
      for (let repeat = 0; repeat < 5; repeat++) observed.getFeedback();
      expect(events).toEqual(expectedEvents);expect(JSON.stringify(frame)).toBe(before);
      if (events.some(event => event.kind === 'rep-completed')) {
        completed++;expect(observed.getFeedback()).toMatchObject({ status: 'matched', joints: rightArm });
        expect(observed.getFeedback()!.message).toContain('完成');
      }
    }
  }
  expect(completed).toBe(1);
  expect(observed.getFeedback()!.message).not.toContain('完成');
  const result = observed.getFeedback()!;result.joints = { 16: 'adjust' };
  expect(observed.getFeedback()!.joints[16]).toBe('matched');
});

test.each(['stale', 'future', 'gap', 'duplicate', 'resized'] as const)('feedback is unknown after %s observations', kind => {
  const r = new ChopRecognizer(profile);r.update(syntheticFrame(50, 'raised'));
  let frame = syntheticFrame(100, 'raised'), now = 100;
  if (kind === 'stale') now = 401;
  if (kind === 'future') now = 0;
  if (kind === 'gap') { frame = syntheticFrame(351, 'raised');now = 351; }
  if (kind === 'duplicate') { frame = syntheticFrame(50, 'raised');now = 50; }
  if (kind === 'resized') frame = syntheticFrame(100, 'raised', 1280, 960);
  expect(r.update(frame, now)).toContainEqual(expect.objectContaining({ kind: 'tracking', status: 'lost' }));
  expect(r.getFeedback()).toBeNull();
});

test('feedback does not mutate personal examples or observed features', () => {
  const f = load(1, 0), before = JSON.stringify({ f, profile });
  for (let i = 0; i < 4; i++) assess('load', 'ready', f);
  expect(JSON.stringify({ f, profile })).toBe(before);
});
