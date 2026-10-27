import { expect, test } from 'vitest';
import { CameraActionSource } from '../../src/input/cameraActionSource.js';
import { upperFrame, upperProfile, type UpperPose } from '../helpers/upperBodyPose.js';
import { syntheticProfile } from '../helpers/recognizerReplay.js';
import { replacePoint } from '../helpers/syntheticPose.js';
import { createLeniencyConfig } from '../../src/config/recognitionTolerance.js';
import { sessionHarness } from '../helpers/sessionHarness.js';
import { inputContext } from '../../src/domain/sessionController.js';
import type { ExerciseSignal, InputContext } from '../../src/domain/types.js';
const context: InputContext = { sessionId: 'session', taskRunId: 'chop', sourceEpoch: 1, task: 'chop' };
function sourceHarness() {
  let now = 0;const events: ExerciseSignal[] = [], source = new CameraActionSource(() => now);
  const pose = (kind: UpperPose, duration = 600) => {
    for (let elapsed = 0; elapsed < duration; elapsed += 50) { now += 50;source.accept(upperFrame(now, kind)); }
  };
  return { source, events, pose, get now() { return now; } };
}

test('camera explicitly accepts a validated upper-body profile', () => {
  const source = new CameraActionSource();
  const upperSource = source as unknown as { setUpperBodyProfile?: (profile: ReturnType<typeof upperProfile>) => void };
  expect(typeof upperSource.setUpperBodyProfile).toBe('function');
  expect(() => upperSource.setUpperBodyProfile?.(upperProfile())).not.toThrow();
});

test('upper-body camera events preserve session context and domain inventory through all three tasks', async () => {
  const h = sessionHarness(400), source = new CameraActionSource(() => h.clock.ms), events: ExerciseSignal[] = [];
  source.setUpperBodyProfile(upperProfile());
  h.controller.command({ kind: 'open-setup', mode: 'camera' });
  h.controller.command({ kind: 'setup-ready', calibrated: { chop: true, load: true, carry: true } });h.tick(1);
  const pose = (kind: UpperPose, duration: number) => {
    for (let elapsed = 0; elapsed < duration; elapsed += 50) { h.tick(50);source.accept(upperFrame(h.clock.ms, kind)); }
  };
  for (const task of ['chop', 'load'] as const) {
    expect(h.controller.getSnapshot().task).toBe(task);
    const ctx = inputContext(h.controller.getSnapshot())!;
    await source.start(ctx, event => { events.push(event);h.controller.accept(event); });
    pose('lowered', 600);pose('raised', 1200);pose('lowered', 600);
    expect(events.filter(event => event.kind === 'rep-completed' && event.task === task)).toHaveLength(1);
    expect(events.filter(event => event.taskRunId === ctx.taskRunId).every(event => event.sourceEpoch === ctx.sourceEpoch)).toBe(true);
    await source.stop();h.tick(1);h.tick(1);
  }
  expect(h.controller.getSnapshot()).toMatchObject({ chopReps: 1, loadReps: 1, groundLogs: 0, cartLogs: 1 });
  await source.start(inputContext(h.controller.getSnapshot())!, event => { events.push(event);h.controller.accept(event); });
  pose('hold', 1000);
  expect(h.controller.getSnapshot()).toMatchObject({ phase: 'results', carryActiveMs: 400, deliveredLogs: 1, cartLogs: 0, groundLogs: 0, rewardsGranted: true });
  expect(h.effects.filter(effect => effect.kind === 'rewards-granted')).toHaveLength(1);
});

test('profile choices are explicit and mutually exclusive, with no upper fallback in full-body mode', async () => {
  const h = sourceHarness();h.source.setUpperBodyProfile(upperProfile());h.source.setProfile(syntheticProfile());
  await h.source.start(context, event => h.events.push(event));h.pose('lowered', 50);
  expect(h.events).toContainEqual(expect.objectContaining({ kind: 'tracking', status: 'lost' }));
  await expect(h.source.start(context, () => {})).rejects.toThrow('标定');
  h.source.setUpperBodyProfile(upperProfile());await h.source.start({ ...context, sourceEpoch: 2 }, event => h.events.push(event));
  h.pose('lowered');h.pose('raised', 1200);h.pose('lowered');
  expect(h.events.filter(event => event.kind === 'rep-completed')).toHaveLength(1);
});

test('changing runtime config synchronously drops upper half-input and requires a fresh validated profile', async () => {
  const h = sourceHarness();h.source.setUpperBodyProfile(upperProfile());await h.source.start(context, event => h.events.push(event));
  h.pose('lowered');h.pose('raised', 1200);h.source.setRecognitionConfig(createLeniencyConfig(5));
  const count = h.events.length;h.pose('lowered');expect(h.events).toHaveLength(count);expect(h.source.getFeedback()).toBeNull();
  await expect(h.source.start(context, () => {})).rejects.toThrow('标定');
  h.source.setUpperBodyProfile(upperProfile());await h.source.start({ ...context, sourceEpoch: 2 }, event => h.events.push(event));
  h.pose('lowered');expect(h.events.filter(event => event.kind === 'rep-completed')).toHaveLength(0);
  h.pose('raised', 1200);h.pose('lowered');
  expect(h.events.filter(event => event.kind === 'rep-completed')).toEqual([expect.objectContaining({ sourceEpoch: 2 })]);
});

test('equivalent configuration preserves an upper cycle while invalid settings cannot interrupt it', async () => {
  const h = sourceHarness();h.source.setUpperBodyProfile(upperProfile());await h.source.start(context, event => h.events.push(event));
  h.pose('lowered');h.pose('raised', 1200);
  expect(() => h.source.setRecognitionConfig({ ...createLeniencyConfig(3), phaseConfirmMs: NaN })).toThrow();
  h.source.setRecognitionConfig({ ...createLeniencyConfig(3) });h.pose('lowered');
  expect(h.events.filter(event => event.kind === 'rep-completed')).toHaveLength(1);
});

test('failed explicit profile choices cannot leave the other mode armed', async () => {
  const h = sourceHarness();h.source.setProfile(syntheticProfile());
  const invalid = upperProfile();invalid.raised.left.y = invalid.lowered.left.y;
  expect(() => h.source.setUpperBodyProfile(invalid)).toThrow();
  await expect(h.source.start(context, () => {})).rejects.toThrow('标定');
  h.source.setUpperBodyProfile(upperProfile());expect(() => h.source.setProfile({ ...syntheticProfile(), examples: {} })).toThrow();
  await expect(h.source.start(context, () => {})).rejects.toThrow('标定');
});

test('upper Carry confirmation is fresh after a config change and no invalid interval gains time', async () => {
  const h = sourceHarness(), carry = { ...context, task: 'carry' as const, taskRunId: 'carry' };
  h.source.setUpperBodyProfile(upperProfile());await h.source.start(carry, event => h.events.push(event));
  h.pose('hold', 400);expect(h.events.at(-1)).toMatchObject({ holding: false });
  h.source.setRecognitionConfig(createLeniencyConfig(5));h.source.setUpperBodyProfile(upperProfile());
  await h.source.start({ ...carry, sourceEpoch: 2 }, event => h.events.push(event));h.events.length = 0;
  h.pose('hold', 500);expect(h.events.every(event => event.kind !== 'hold-sample' || !event.holding)).toBe(true);
  h.pose('hold', 100);expect(h.events.at(-1)).toMatchObject({ holding: true, sourceEpoch: 2 });
  h.source.accept(upperFrame(h.now + 201, 'hold'), h.now + 201);
  expect(h.events.at(-1)).toMatchObject({ kind: 'tracking', status: 'lost' });expect(h.source.getFeedback()).toBeNull();
  await expect(h.source.start(carry, () => {})).rejects.toThrow('标定');
});

test('upper profile is copied, source stops block late frames, and ticks clear readiness', async () => {
  const h = sourceHarness(), p = upperProfile();h.source.setUpperBodyProfile(p);p.raised.left.y = 100;
  await h.source.start(context, event => h.events.push(event));h.pose('lowered');h.pose('raised', 1200);h.pose('lowered');
  expect(h.events.filter(event => event.kind === 'rep-completed')).toHaveLength(1);
  await h.source.stop();const count = h.events.length;h.pose('lowered');expect(h.events).toHaveLength(count);
  await h.source.start({ ...context, taskRunId: 'next', sourceEpoch: 2 }, event => h.events.push(event));
  h.source.accept(upperFrame(h.now - 50, 'raised'));expect(h.events).toHaveLength(count);
  h.source.tick(h.now + 301);expect(h.source.getFeedback()).toBeNull();
  await expect(h.source.start(context, () => {})).rejects.toThrow('标定');
});

test('explicit clearing removes both profile choices and cannot silently restart either mode', async () => {
  for (const upper of [false, true]) {
    const h = sourceHarness();if (upper) h.source.setUpperBodyProfile(upperProfile());else h.source.setProfile(syntheticProfile());
    h.source.clearProfile();await expect(h.source.start(context, () => {})).rejects.toThrow('标定');
    expect(h.source.getFeedback()).toBeNull();
  }
  const h = sourceHarness();h.source.setUpperBodyProfile(upperProfile());await h.source.start(context, event => h.events.push(event));
  h.source.accept(replacePoint(upperFrame(50), 12, { presence: .1 }));
  expect(h.events).toContainEqual(expect.objectContaining({ kind: 'tracking', status: 'lost' }));
  await expect(h.source.start(context, () => {})).rejects.toThrow('标定');
});
