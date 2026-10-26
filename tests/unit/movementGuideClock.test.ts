import { describe, expect, test } from 'vitest';
import type { TaskKind } from '../../src/domain/types.js';
import { tutorialLessons } from '../../src/ui/exerciseTutorialModel.js';
import { MovementGuideClock } from '../../src/ui/movementGuideClock.js';

function advanceBy(clock: MovementGuideClock, milliseconds: number): void {
  let remaining = milliseconds;
  while (remaining > 0) {
    const delta = Math.min(200, remaining);
    clock.advance(delta);
    remaining -= delta;
  }
}

describe('MovementGuideClock', () => {
  test('starts chopping at the shoulder and cycles through down and return without a neutral introduction', () => {
    const clock = new MovementGuideClock();
    expect(clock.frame).toMatchObject({
      task: 'chop', stepIndex: 1, title: '上肩准备', elapsedMs: 0, totalMs: 5000,
    });
    expect(clock.frame.points).toEqual(tutorialLessons.chop.steps[3].points);
    advanceBy(clock, 1600);
    expect(clock.frame).toMatchObject({ stepIndex: 2, title: '缓慢下挥' });
    expect(clock.frame.points.rightWrist.y).toBe(.27);
    advanceBy(clock, 1350);
    expect(clock.frame.points.rightWrist.y).toBe(.61);
    expect(clock.frame.points.leftWrist.y).toBe(.64);
    advanceBy(clock, 450);
    expect(clock.frame).toMatchObject({ stepIndex: 3, title: '回到上肩' });
    expect(clock.frame.points.rightWrist.y).toBe(.61);
    advanceBy(clock, 1200);
    expect(clock.frame.points.rightWrist.y).toBe(.27);
    advanceBy(clock, 400);
    expect(clock.frame).toMatchObject({ stepIndex: 1, title: '上肩准备', elapsedMs: 0 });
    expect(clock.frame.points).toEqual(tutorialLessons.chop.steps[1].points);
  });

  test('load keeps the complete standing, squat, stand, lift and reset order with original durations', () => {
    const clock = new MovementGuideClock('load');
    expect(clock.frame.totalMs).toBe(7600);
    const checkpoints = [
      { delta: 0, stepIndex: 0, title: '自然站立', previous: 4, elapsedMs: 0 },
      { delta: 1000, stepIndex: 1, title: '舒适下蹲', previous: 0, elapsedMs: 1000 },
      { delta: 1800, stepIndex: 2, title: '恢复站立', previous: 1, elapsedMs: 2800 },
      { delta: 1600, stepIndex: 3, title: '向上举手', previous: 2, elapsedMs: 4400 },
      { delta: 1600, stepIndex: 4, title: '放下并复位', previous: 3, elapsedMs: 6000 },
      { delta: 1600, stepIndex: 0, title: '自然站立', previous: 4, elapsedMs: 0 },
    ];
    for (const { delta, stepIndex, title, previous, elapsedMs } of checkpoints) {
      advanceBy(clock, delta);
      expect(clock.frame).toMatchObject({ task: 'load', stepIndex, title, elapsedMs });
      expect(clock.frame.points).toEqual(tutorialLessons.load.steps[previous].points);
    }
  });

  test('smoothly bends both knees and moves the wrists, reaching the target at 75% then holding it', () => {
    const clock = new MovementGuideClock('load');
    advanceBy(clock, 1337.5);
    // One quarter of the 1350 ms movement: smoothstep(.25) = .15625.
    expect(clock.frame.points.rightWrist.y).toBeCloseTo(.4753125, 10);
    expect(clock.frame.points.rightKnee.x).toBeCloseTo(.59875, 10);
    expect(clock.frame.points.leftKnee.x).toBeCloseTo(.40125, 10);
    advanceBy(clock, 337.5);
    expect(clock.frame.points.rightWrist.y).toBeCloseTo(.575, 10);
    expect(clock.frame.points.rightKnee.x).toBeCloseTo(.64, 10);
    expect(clock.frame.points.leftKnee.x).toBeCloseTo(.36, 10);
    advanceBy(clock, 675);
    expect(clock.frame.points).toEqual(tutorialLessons.load.steps[1].points);
    advanceBy(clock, 449);
    expect(clock.frame).toMatchObject({ stepIndex: 1, elapsedMs: 2799 });
    expect(clock.frame.points).toEqual(tutorialLessons.load.steps[1].points);
    clock.advance(1);
    expect(clock.frame.stepIndex).toBe(2);
    expect(clock.frame.points).toEqual(tutorialLessons.load.steps[1].points);
  });

  test('load visibly raises both wrists above the head and returns to the original standing pose', () => {
    const clock = new MovementGuideClock('load');
    advanceBy(clock, 5600);
    expect(clock.frame.stepIndex).toBe(3);
    expect(clock.frame.points.leftWrist.y).toBe(.075);
    expect(clock.frame.points.rightWrist.y).toBe(.075);
    expect(clock.frame.points.rightWrist.y).toBeLessThan(clock.frame.points.head.y);
    advanceBy(clock, 1600);
    expect(clock.frame.stepIndex).toBe(4);
    expect(clock.frame.points).toEqual(tutorialLessons.load.steps[4].points);
  });

  test('carry continuously demonstrates stable holding and never periodically releases the arms', () => {
    const clock = new MovementGuideClock('carry');
    expect(clock.frame.totalMs).toBe(2600);
    for (let sample = 0; sample < 60; sample++) {
      expect(clock.frame).toMatchObject({ task: 'carry', stepIndex: 1, title: '稳定保持' });
      expect(clock.frame.points).toEqual(tutorialLessons.carry.steps[1].points);
      clock.advance(200);
    }
    expect(clock.frame.elapsedMs).toBe(1600);
  });

  test.each(['chop', 'load', 'carry'] as const)('%s wraps exactly and preserves its displayed pose across the cycle boundary', task => {
    const clock = new MovementGuideClock(task), initial = clock.frame;
    advanceBy(clock, initial.totalMs - 1);
    const beforeWrap = clock.frame;
    expect(beforeWrap.elapsedMs).toBe(initial.totalMs - 1);
    clock.advance(1);
    expect(clock.frame).toEqual(initial);
    expect(clock.frame.points).toEqual(beforeWrap.points);
    advanceBy(clock, initial.totalMs - 20);
    clock.advance(200);
    expect(clock.frame.elapsedMs).toBe(180);
    expect(clock.frame.stepIndex).toBe(initial.stepIndex);
  });

  test('rejects invalid or unobserved intervals and accepts exactly 200 ms without later catch-up', () => {
    const clock = new MovementGuideClock('load');
    clock.advance(200);
    expect(clock.frame.elapsedMs).toBe(200);
    const before = clock.frame;
    for (const delta of [0, -1, -200, 200.01, 5000, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      clock.advance(delta);
      expect(clock.frame).toEqual(before);
    }
    clock.advance(200);
    expect(clock.frame.elapsedMs).toBe(400);
    clock.advance(16);
    expect(clock.frame.elapsedMs).toBe(416);
  });

  test('reset clears elapsed time even for the same task and selects the new task initial pose', () => {
    const clock = new MovementGuideClock('load');
    advanceBy(clock, 2100);
    clock.reset('load');
    expect(clock.frame).toMatchObject({ task: 'load', stepIndex: 0, elapsedMs: 0, totalMs: 7600 });
    expect(clock.frame.points).toEqual(tutorialLessons.load.steps[4].points);
    clock.advance(200);
    clock.reset('carry');
    expect(clock.frame).toMatchObject({ task: 'carry', stepIndex: 1, elapsedMs: 0, totalMs: 2600 });
    expect(clock.frame.points).toEqual(tutorialLessons.carry.steps[1].points);
    clock.advance(200);
    clock.reset('chop');
    expect(clock.frame).toMatchObject({ task: 'chop', stepIndex: 1, elapsedMs: 0, totalMs: 5000 });
    expect(clock.frame.points).toEqual(tutorialLessons.chop.steps[3].points);
  });

  test.each(['chop', 'load', 'carry'] as const)('%s remains finite and within its cycle through repeated fractional frame wraps', (task: TaskKind) => {
    const lessonsBefore = JSON.stringify(tutorialLessons), clock = new MovementGuideClock(task);
    for (let sample = 0; sample < 1300; sample++) {
      clock.advance(16.67);
      const frame = clock.frame;
      expect(frame.elapsedMs).toBeGreaterThanOrEqual(0);
      expect(frame.elapsedMs).toBeLessThan(frame.totalMs);
      expect(Object.keys(frame.points)).toHaveLength(14);
      for (const point of Object.values(frame.points)) {
        expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
        expect(point.x).toBeGreaterThan(0);expect(point.x).toBeLessThan(1);
        expect(point.y).toBeGreaterThan(0);expect(point.y).toBeLessThan(1);
      }
    }
    expect(JSON.stringify(tutorialLessons)).toBe(lessonsBefore);
  });
});
