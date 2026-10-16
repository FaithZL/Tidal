import { afterEach, expect, test, vi } from 'vitest';
import { ReplayPoseSource } from '../helpers/replayPoseSource.js';
import { standingFrames, fixtureMetadata } from '../helpers/syntheticPose.js';
import type { PoseFrame } from '../../src/pose/types.js';
import { CalibrationSession } from '../../src/pose/calibrationSession.js';
afterEach(() => vi.useRealTimers());
const fixture = () => ({ source: 'synthetic' as const, description: fixtureMetadata.description, frames: standingFrames() });
test('replay emits exactly the fixture timestamps and is deterministic across restarts', async () => {
  vi.useFakeTimers();const source = new ReplayPoseSource(fixture()), first: PoseFrame[] = [], second: PoseFrame[] = [];
  source.start(f => first.push(f), 10_000);await vi.advanceTimersByTimeAsync(2100);
  expect(first.map(f => f.capturedAtMs)).toEqual(standingFrames().map(f => f.capturedAtMs + 10_000));
  source.start(f => second.push(f), 10_000);await vi.advanceTimersByTimeAsync(2100);expect(second).toEqual(first);source.stop();
});
test('stopping a replay cancels old callbacks; reversed fixture times are rejected', async () => {
  vi.useFakeTimers();const source = new ReplayPoseSource(fixture()), frames: PoseFrame[] = [];
  source.start(f => frames.push(f), 0);await vi.advanceTimersByTimeAsync(150);source.stop();const count = frames.length;
  await vi.advanceTimersByTimeAsync(3000);expect(frames).toHaveLength(count);expect(count).toBe(2);
  expect(() => new ReplayPoseSource({ ...fixture(), frames: standingFrames().reverse() })).toThrow();
});
test('synthetic replay traverses the same calibration pipeline without a camera', async () => {
  vi.useFakeTimers();const session = new CalibrationSession(), source = new ReplayPoseSource(fixture());
  session.ingest({ ...standingFrames()[0]!, frameId: 0, capturedAtMs: 0 }, 0);session.beginCapture();
  source.start(frame => session.ingest(frame, frame.capturedAtMs), 100);await vi.advanceTimersByTimeAsync(2100);
  expect(session.getSnapshot().calibration?.torsoScalePx).toBeCloseTo(130);expect(session.getSnapshot().step).toBe('chop-raised');
});
