import { expect, test } from 'vitest';
import { CameraActionSource } from '../../src/input/cameraActionSource.js';
import { createRecognitionConfig, recognitionConfig } from '../../src/config/recognitionConfig.js';
import { createLeniencyConfig } from '../../src/config/recognitionTolerance.js';
import { syntheticProfile } from '../helpers/recognizerReplay.js';
import { syntheticFrame, type SyntheticPose } from '../helpers/syntheticPose.js';
import type { ExerciseSignal, InputContext } from '../../src/domain/types.js';

const context: InputContext = { sessionId: 'session', taskRunId: 'chop', sourceEpoch: 1, task: 'chop' };
function harness(config = recognitionConfig) {
  let now = 0;
  const events: ExerciseSignal[] = [], source = new CameraActionSource(() => now, config);
  const pose = (kind: SyntheticPose, duration = 600) => {
    for (let elapsed = 0; elapsed < duration; elapsed += 50) {
      now += 50; source.accept(syntheticFrame(now, kind));
    }
  };
  return { source, events, pose, advance: (ms: number) => { now += ms; }, now: () => now };
}

test('equal configuration is a no-op and invalid configuration cannot interrupt an active cycle', async () => {
  const h = harness(); h.source.setProfile(syntheticProfile()); await h.source.start(context, e => h.events.push(e));
  h.pose('raised'); h.pose('down');
  expect(() => h.source.setRecognitionConfig({ ...recognitionConfig, minConfidence: 2 })).toThrow(RangeError);
  h.source.setRecognitionConfig({ ...recognitionConfig });
  h.pose('raised');
  expect(h.events.filter(e => e.kind === 'rep-completed')).toHaveLength(1);
});

test('an actual configuration change synchronously closes the source, discards half a rep and requires profile validation', async () => {
  const h = harness(); h.source.setProfile(syntheticProfile()); await h.source.start(context, e => h.events.push(e));
  h.pose('raised'); h.pose('down');
  h.source.setRecognitionConfig(createLeniencyConfig(5));
  const before = h.events.length; h.pose('raised'); expect(h.events).toHaveLength(before);
  await expect(h.source.start({ ...context, sourceEpoch: 2 }, () => {})).rejects.toThrow('标定');
  h.source.setProfile(syntheticProfile()); await h.source.start({ ...context, sourceEpoch: 2 }, e => h.events.push(e));
  h.pose('raised'); expect(h.events.filter(e => e.kind === 'rep-completed')).toHaveLength(0);
  h.pose('down'); h.pose('raised');
  const reps = h.events.filter(e => e.kind === 'rep-completed');
  expect(reps).toHaveLength(1); expect(reps[0].sourceEpoch).toBe(2);
});

test.each(['constructor', 'setter'] as const)('source %s copies validated configuration and applies loose range to actual camera frames', async entry => {
  const mutable = { ...createLeniencyConfig(5) }, h = harness(entry === 'constructor' ? mutable : recognitionConfig);
  if (entry === 'setter') h.source.setRecognitionConfig(mutable);
  mutable.repEnterRatio = .99;
  h.source.setProfile(syntheticProfile()); await h.source.start(context, e => h.events.push(e));
  h.pose('raised', 800);
  for (let elapsed = 0; elapsed < 800; elapsed += 50) {
    h.advance(50); const raised = syntheticFrame(h.now(), 'raised'), down = syntheticFrame(h.now(), 'down');
    h.source.accept({ ...raised, landmarks: raised.landmarks.map((p, i) => ({ ...p,
      x: p.x + .65 * (down.landmarks[i].x - p.x), y: p.y + .65 * (down.landmarks[i].y - p.y),
    })) });
  }
  h.pose('raised', 800);
  expect(h.events.filter(e => e.kind === 'rep-completed')).toHaveLength(1);
});

test('changing configuration clears an in-progress Carry confirmation and never backfills it', async () => {
  const h = harness(); const carry = { ...context, taskRunId: 'carry', task: 'carry' as const };
  h.source.setProfile(syntheticProfile()); await h.source.start(carry, e => h.events.push(e));
  h.pose('hold', 400); expect(h.events.at(-1)).toMatchObject({ holding: false });
  h.source.setRecognitionConfig(createLeniencyConfig(5)); h.source.setProfile(syntheticProfile());
  await h.source.start({ ...carry, sourceEpoch: 2 }, e => h.events.push(e)); h.events.length = 0;
  h.pose('hold', 500); expect(h.events.every(e => e.kind !== 'hold-sample' || !e.holding)).toBe(true);
  h.pose('hold', 100); expect(h.events.at(-1)).toMatchObject({ holding: true, sourceEpoch: 2 });
  h.pose('standing', 50); expect(h.events.at(-1)).toMatchObject({ holding: false });
});

test('source timeout uses its validated configuration and expires explicitly', async () => {
  const h = harness(createRecognitionConfig({ trackingMaxAgeMs: 100 }));
  h.source.setProfile(syntheticProfile()); await h.source.start(context, e => h.events.push(e));
  h.source.tick(100); expect(h.events).toHaveLength(0);
  h.source.tick(101); expect(h.events).toContainEqual(expect.objectContaining({ kind: 'tracking', status: 'lost' }));
  await expect(h.source.start(context, () => {})).rejects.toThrow('标定');
});

test('source exposes current observed feedback and clears it when configuration invalidates the context', async () => {
  const h = harness(); expect(h.source.getFeedback()).toBeNull();
  h.source.setProfile(syntheticProfile()); await h.source.start(context, e => h.events.push(e)); h.pose('raised');
  expect(h.source.getFeedback()).toMatchObject({ status: 'matched' });
  expect(h.events.filter(e => e.kind === 'rep-completed')).toHaveLength(0);
  h.source.setRecognitionConfig(createLeniencyConfig(5)); expect(h.source.getFeedback()).toBeNull();
  h.pose('down'); expect(h.source.getFeedback()).toBeNull();
});
