import { expect, test } from 'vitest';
import { recognitionConfig } from '../../src/config/recognitionConfig.js';
import { createLeniencyConfig, defaultRecognitionLeniency, isRecognitionLeniency, recognitionLeniencyLabel } from '../../src/config/recognitionTolerance.js';
import { ChopRecognizer } from '../../src/pose/recognizers/chopRecognizer.js';
import { LoadRecognizer } from '../../src/pose/recognizers/loadRecognizer.js';
import { CarryRecognizer } from '../../src/pose/recognizers/carryRecognizer.js';
import { syntheticProfile, PoseReplay } from '../helpers/recognizerReplay.js';
import { syntheticFrame, replacePoint } from '../helpers/syntheticPose.js';
import type { RecognitionEvent } from '../../src/pose/recognizers/types.js';

test('five named integer levels preserve the exact standard configuration', () => {
  expect(defaultRecognitionLeniency).toBe(3);
  expect([1, 2, 3, 4, 5].map(recognitionLeniencyLabel)).toEqual(['严格', '偏严格', '标准', '偏宽松', '宽松']);
  expect([1, 2, 3, 4, 5].every(isRecognitionLeniency)).toBe(true);
  expect(createLeniencyConfig(3)).toBe(recognitionConfig);
  for (const bad of [0, 6, 2.5, NaN, Infinity, '3', null, undefined]) expect(isRecognitionLeniency(bad)).toBe(false);
  for (const bad of [0, 6, 2.5, NaN, Infinity]) {
    expect(() => createLeniencyConfig(bad)).toThrow(RangeError);
    expect(() => recognitionLeniencyLabel(bad)).toThrow(RangeError);
  }
});

test('leniency widens only the five runtime pose gates and retains separate regions', () => {
  const adjustable = new Set(['repEnterRatio', 'repReturnRatio', 'returnWristTolerance', 'holdEnterRatio', 'holdExitRatio']);
  const strict = createLeniencyConfig(1), loose = createLeniencyConfig(5);
  expect(strict.repEnterRatio).toBeCloseTo(.78); expect(loose.repEnterRatio).toBeCloseTo(.62);
  expect(strict.repReturnRatio).toBeCloseTo(.22); expect(loose.repReturnRatio).toBeCloseTo(.38);
  expect(strict.returnWristTolerance).toBeCloseTo(.24); expect(loose.returnWristTolerance).toBeCloseTo(.36);
  expect(strict.holdEnterRatio).toBeCloseTo(.27); expect(loose.holdEnterRatio).toBeCloseTo(.43);
  expect(strict.holdExitRatio).toBeCloseTo(.47); expect(loose.holdExitRatio).toBeCloseTo(.63);
  for (const level of [1, 2, 3, 4, 5]) {
    const config = createLeniencyConfig(level);
    expect(Object.isFrozen(config)).toBe(true);
    expect(config.repEnterRatio - config.repReturnRatio).toBeGreaterThanOrEqual(.23);
    expect(config.holdExitRatio - config.holdEnterRatio).toBeCloseTo(.2);
    for (const key of Object.keys(recognitionConfig) as (keyof typeof recognitionConfig)[]) {
      if (!adjustable.has(key)) expect(config[key], key).toBe(recognitionConfig[key]);
    }
  }
});

test('a complete reduced-range chop counts on loose while standard still requires its original range', () => {
  const run = (level: number) => {
    const recognizer = new ChopRecognizer(syntheticProfile(), createLeniencyConfig(level)), events: RecognitionEvent[] = [];
    for (let t = 50; t <= 2400; t += 50) {
      const raised = syntheticFrame(t, 'raised'), down = syntheticFrame(t, 'down');
      const frame = t <= 800 || t > 1600 ? raised : {
        ...raised, landmarks: raised.landmarks.map((p, i) => ({ ...p,
          x: p.x + .65 * (down.landmarks[i].x - p.x), y: p.y + .65 * (down.landmarks[i].y - p.y),
        })),
      };
      events.push(...recognizer.update(frame));
    }
    return events;
  };
  expect(run(3).filter(e => e.kind === 'rep-completed')).toHaveLength(0);
  const loose = run(5);
  expect(loose.filter(e => e.kind === 'rep-completed')).toHaveLength(1);
  expect(loose.filter(e => e.kind === 'impact')).toHaveLength(1);
  expect(loose.filter(e => e.kind === 'phase').map(e => e.phase)).toEqual(['ready', 'chop-down', 'chop-return', 'ready']);
});

test('loose Carry accepts bounded drift while the released pose always ends it', () => {
  const strict = new CarryRecognizer(syntheticProfile(), createLeniencyConfig(3));
  const loose = new CarryRecognizer(syntheticProfile(), createLeniencyConfig(5));
  let standard: readonly RecognitionEvent[] = [], tolerant: readonly RecognitionEvent[] = [];
  for (let t = 50; t <= 1000; t += 50) {
    const hold = syntheticFrame(t, 'hold'), release = syntheticFrame(t, 'standing');
    // Joint angles are nonlinear: 36% landmark interpolation is about .394 of the feature-center distance.
    const middle = { ...hold, landmarks: hold.landmarks.map((p, i) => ({ ...p,
      x: p.x + .36 * (release.landmarks[i].x - p.x), y: p.y + .36 * (release.landmarks[i].y - p.y),
    })) };
    standard = strict.update(middle); tolerant = loose.update(middle);
  }
  expect(standard.at(-1)).toMatchObject({ holding: false, valid: true });
  expect(tolerant.at(-1)).toMatchObject({ holding: true, valid: true });
  expect(loose.update(syntheticFrame(1050, 'standing')).at(-1)).toMatchObject({ holding: false, valid: true });
});

test.each([1, 2, 3, 4, 5])('level %i keeps full compound actions, invalid samples and Carry separation guards', level => {
  const config = createLeniencyConfig(level), profile = syntheticProfile();
  const load = new PoseReplay(new LoadRecognizer(profile, config));
  load.pose('standing', 600).pose('squat', 600).pose('press', 600).pose('standing', 800);
  expect(load.reps).toHaveLength(1);
  for (const only of ['squat', 'press'] as const) {
    const partial = new PoseReplay(new LoadRecognizer(profile, config));
    partial.pose('standing').pose(only, 800).pose('standing', 1000);
    expect(partial.reps).toHaveLength(0);
  }
  const chopped = new PoseReplay(new ChopRecognizer(profile, config));
  chopped.pose('raised', 600).pose('down', 600);
  expect(chopped.reps).toHaveLength(0);
  const invalid = replacePoint(syntheticFrame(chopped.time + 50, 'raised'), 16, { visibility: .59 });
  expect(chopped.recognizer.update(invalid)).toContainEqual(expect.objectContaining({ kind: 'tracking', status: 'lost' }));
  chopped.time += 50; chopped.pose('raised', 800);
  expect(chopped.reps).toHaveLength(0);
  const carry = new PoseReplay(new CarryRecognizer(profile, config));
  carry.pose('hold', 500); expect(carry.events.at(-1)).toMatchObject({ holding: false });
  carry.pose('hold', 300); expect(carry.events.at(-1)).toMatchObject({ holding: true });
  carry.pose('standing', 50); expect(carry.events.at(-1)).toMatchObject({ holding: false, valid: true });
  const inseparable = syntheticProfile(); inseparable.examples['carry-release'] = inseparable.examples['carry-hold'];
  expect(() => new CarryRecognizer(inseparable, config)).toThrow('Carry calibration is not separable');
  const noisy = syntheticProfile(); noisy.examples['carry-hold']!.radius = 1;
  expect(() => new CarryRecognizer(noisy, config)).toThrow('Carry calibration is not separable');
  const noHip = syntheticProfile(); noHip.examples['load-squat']!.hipHeight = noHip.examples['load-stand']!.hipHeight;
  expect(() => new LoadRecognizer(noHip, config)).toThrow('Load calibration is not separable');
});

test.each([1, 2, 3, 4, 5])('level %i cannot bridge stale, future, duplicate or missing observation intervals', level => {
  for (const fault of ['stale', 'future', 'gap', 'duplicate'] as const) {
    const recognizer = new ChopRecognizer(syntheticProfile(), createLeniencyConfig(level)), replay = new PoseReplay(recognizer);
    replay.pose('raised', 600).pose('down', 600);
    let captured = replay.time + 50, arrival = captured;
    if (fault === 'stale') arrival += 301;
    if (fault === 'future') arrival -= 51;
    if (fault === 'gap') { captured = replay.time + 201; arrival = captured; }
    if (fault === 'duplicate') captured = replay.time;
    expect(recognizer.update(syntheticFrame(captured, 'raised'), arrival)).toContainEqual(expect.objectContaining({ kind: 'tracking', status: 'lost' }));
    replay.time = arrival; replay.pose('raised', 800); expect(replay.reps).toHaveLength(0);
  }
  const jitter = new PoseReplay(new ChopRecognizer(syntheticProfile(), createLeniencyConfig(level)));
  jitter.pose('raised'); for (let i = 0; i < 20; i++) jitter.pose(i % 2 ? 'raised' : 'down', 50);
  expect(jitter.reps).toHaveLength(0);
});
