import { afterEach, expect, test, vi } from 'vitest';
import { AutoDemoSource } from '../../src/input/autoDemoSource.js';
import type { ExerciseSignal, InputContext } from '../../src/domain/types.js';

const context = (task: InputContext['task']): InputContext => ({ sessionId: 's1', taskRunId: 'r1', sourceEpoch: 1, task });
afterEach(() => vi.useRealTimers());

test('automatic demo emits complete keyboard semantics, not direct resource changes', async () => {
  vi.useFakeTimers();const events: ExerciseSignal[] = [];const source = new AutoDemoSource();
  await source.start(context('chop'), e => events.push(e));await vi.advanceTimersByTimeAsync(1100);
  expect(events.map(e => e.kind)).toEqual(['phase', 'phase', 'impact', 'phase', 'rep-completed']);
  expect(events.every(e => e.sessionId === 's1' && e.sourceEpoch === 1)).toBe(true);
  await source.stop();const count = events.length;await vi.advanceTimersByTimeAsync(5000);expect(events).toHaveLength(count);
});
test('stopping during a partial action prevents completion and restarting uses the new epoch', async () => {
  vi.useFakeTimers();const events: ExerciseSignal[] = [];const source = new AutoDemoSource();
  await source.start(context('load'), e => events.push(e));await vi.advanceTimersByTimeAsync(300);await source.stop();
  await vi.advanceTimersByTimeAsync(2000);expect(events.some(e => e.kind === 'rep-completed')).toBe(false);
  events.length = 0;await source.start({ ...context('load'), sourceEpoch: 2 }, e => events.push(e));await vi.advanceTimersByTimeAsync(900);
  expect(events.filter(e => e.kind === 'rep-completed')).toHaveLength(1);
  expect(events.filter(e => e.kind === 'phase').map(e => e.phase)).toEqual(['ready', 'squat-down', 'stand-up', 'press-up', 'load-return']);
  expect(events.every(e => e.sourceEpoch === 2)).toBe(true);await source.dispose();
});
test('automatic carry sends adjacent hold samples and stops immediately when disabled', async () => {
  vi.useFakeTimers();const events: ExerciseSignal[] = [];const source = new AutoDemoSource();
  await source.start(context('carry'), e => events.push(e));await vi.advanceTimersByTimeAsync(260);
  expect(events.filter(e => e.kind === 'hold-sample' && e.holding).length).toBeGreaterThan(3);
  await source.stop();expect(events.at(-1)).toMatchObject({ kind: 'hold-sample', holding: false });
  const count = events.length;await vi.advanceTimersByTimeAsync(2000);expect(events).toHaveLength(count);
});
test('stop racing start cannot revive an automatic timer', async () => {
  vi.useFakeTimers();const events: ExerciseSignal[] = [];const source = new AutoDemoSource();
  const pending = source.start(context('chop'), e => events.push(e));await source.stop();await pending;
  await vi.advanceTimersByTimeAsync(5000);expect(events).toEqual([]);
});
