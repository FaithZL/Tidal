import { describe, expect, test } from 'vitest';
import {
  TutorialClock, tutorialLessons,
  type TutorialJoint, type TutorialPoint, type TutorialSpeed,
} from '../../src/ui/exerciseTutorialModel.js';

const joints: readonly TutorialJoint[] = [
  'head', 'neck', 'leftShoulder', 'leftElbow', 'leftWrist',
  'rightShoulder', 'rightElbow', 'rightWrist', 'leftHip', 'rightHip',
  'leftKnee', 'leftAnkle', 'rightKnee', 'rightAnkle',
];

function angle(a: TutorialPoint, b: TutorialPoint, c: TutorialPoint): number {
  const u = { x: a.x - b.x, y: a.y - b.y }, v = { x: c.x - b.x, y: c.y - b.y };
  return Math.acos((u.x * v.x + u.y * v.y) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y))) * 180 / Math.PI;
}

function advanceBy(clock: TutorialClock, milliseconds: number): void {
  let remaining = milliseconds;
  while (remaining > 0) {
    const delta = Math.min(200, remaining);
    clock.advance(delta);
    remaining -= delta;
  }
}

describe('tutorial lesson diagrams', () => {
  test('each lesson supplies visible whole-body joints and the complete number of teaching steps', () => {
    expect(Object.keys(tutorialLessons).sort()).toEqual(['carry', 'chop', 'load']);
    expect(tutorialLessons.chop.steps).toHaveLength(4);
    expect(tutorialLessons.load.steps).toHaveLength(5);
    expect(tutorialLessons.carry.steps).toHaveLength(3);
    for (const [task, lesson] of Object.entries(tutorialLessons)) {
      expect(lesson.id).toBe(task);
      for (const step of lesson.steps) {
        expect(Object.keys(step.points).sort()).toEqual([...joints].sort());
        expect(step.durationMs).toBeGreaterThan(0);
        expect(Number.isFinite(step.durationMs)).toBe(true);
        expect(step.highlight.length).toBeGreaterThan(0);
        for (const joint of step.highlight) expect(joints).toContain(joint);
        for (const joint of joints) {
          const point = step.points[joint];
          expect(Number.isFinite(point.x) && Number.isFinite(point.y), `${task}/${joint}`).toBe(true);
          expect(point.x).toBeGreaterThan(.03);expect(point.x).toBeLessThan(.97);
          expect(point.y).toBeGreaterThan(.03);expect(point.y).toBeLessThan(.97);
        }
      }
    }
  });

  test('chop first raises the hand to the shoulder, moves it down and returns fully to the ready pose', () => {
    const [standing, ready, down, reset] = tutorialLessons.chop.steps;
    expect(ready.points.rightWrist.y).toBeLessThan(standing.points.rightWrist.y - .2);
    expect(Math.abs(ready.points.rightWrist.y - ready.points.rightShoulder.y)).toBeLessThan(.1);
    expect(down.points.rightWrist.y).toBeGreaterThan(ready.points.rightWrist.y + .25);
    expect(reset.points).toEqual(ready.points);
    expect(ready.highlight).toContain('rightWrist');expect(down.highlight).toContain('rightWrist');
  });

  test('load bends both knees and lowers the hips before standing, raising both hands and resetting', () => {
    const [standing, squat, upright, press, reset] = tutorialLessons.load.steps;
    for (const side of ['left', 'right'] as const) {
      const hip = `${side}Hip` as const, knee = `${side}Knee` as const, ankle = `${side}Ankle` as const;
      const shoulder = `${side}Shoulder` as const, wrist = `${side}Wrist` as const;
      const standingKnee = angle(standing.points[hip], standing.points[knee], standing.points[ankle]);
      expect(angle(squat.points[hip], squat.points[knee], squat.points[ankle])).toBeLessThan(standingKnee - 35);
      expect(squat.points[hip].y).toBeGreaterThan(standing.points[hip].y + .08);
      expect(squat.points[ankle]).toEqual(standing.points[ankle]);
      expect(upright.points[hip]).toEqual(standing.points[hip]);
      expect(angle(upright.points[hip], upright.points[knee], upright.points[ankle])).toBeGreaterThan(160);
      expect(press.points[wrist].y).toBeLessThan(press.points.head.y);
      expect(press.points[wrist].y).toBeLessThan(press.points[shoulder].y - .15);
      expect(squat.highlight).toContain(knee);expect(press.highlight).toContain(wrist);
    }
    expect(reset.points).toEqual(standing.points);
  });

  test('carry holds a stable bent-arm pose then visibly releases both arms', () => {
    const [ready, hold, released] = tutorialLessons.carry.steps;
    expect(hold.points).toEqual(ready.points);
    for (const side of ['left', 'right'] as const) {
      const shoulder = `${side}Shoulder` as const, elbow = `${side}Elbow` as const, wrist = `${side}Wrist` as const;
      expect(released.points[wrist].y).toBeGreaterThan(hold.points[wrist].y + .1);
      expect(angle(released.points[shoulder], released.points[elbow], released.points[wrist])).toBeGreaterThan(
        angle(hold.points[shoulder], hold.points[elbow], hold.points[wrist]) + 25,
      );
      expect(hold.highlight).toContain(wrist);expect(released.highlight).toContain(wrist);
    }
  });
});

describe('TutorialClock', () => {
  test('starts paused at the first chop pose and cannot advance until played', () => {
    const clock = new TutorialClock(), before = clock.frame;
    expect(before).toMatchObject({ task: 'chop', stepIndex: 0, stepProgress: 0, elapsedMs: 0, playing: false, speed: 1 });
    expect(before.points).toEqual(tutorialLessons.chop.steps[0].points);
    expect(before.totalMs).toBe(tutorialLessons.chop.steps.reduce((sum, step) => sum + step.durationMs, 0));
    clock.advance(200);expect(clock.frame).toEqual(before);
    expect(new TutorialClock('load').frame.task).toBe('load');
  });

  test('switching lessons resets to the first pose and autoplays while retaining the chosen speed', () => {
    const clock = new TutorialClock();clock.play();advanceBy(clock, 1300);clock.setSpeed(.5);
    clock.setTask('carry');
    expect(clock.frame).toMatchObject({ task: 'carry', stepIndex: 0, stepProgress: 0, elapsedMs: 0, playing: true, speed: .5 });
    expect(clock.frame.points).toEqual(tutorialLessons.carry.steps[0].points);
    expect(clock.frame.totalMs).toBe(tutorialLessons.carry.steps.reduce((sum, step) => sum + step.durationMs, 0));
    clock.advance(100);expect(clock.frame.elapsedMs).toBe(50);
  });

  test('interpolates the actual joints from the previous pose towards the current step target', () => {
    const clock = new TutorialClock(), [standing, ready] = tutorialLessons.chop.steps;
    clock.play();advanceBy(clock, standing.durationMs + ready.durationMs / 2);
    const frame = clock.frame;
    expect(frame.stepIndex).toBe(1);expect(frame.stepProgress).toBeCloseTo(.5);
    expect(frame.points.rightWrist.y).toBeCloseTo((standing.points.rightWrist.y + ready.points.rightWrist.y) / 2);
    expect(frame.points.rightWrist.y).toBeLessThan(standing.points.rightWrist.y);
    expect(frame.points.rightWrist.y).toBeGreaterThan(ready.points.rightWrist.y);
    expect(frame.highlight).toEqual(ready.highlight);
  });

  test.each([.5, .25] as const)('speed %s progresses proportionally over the same observed time without altering lesson duration', speed => {
    const normal = new TutorialClock(), slow = new TutorialClock();normal.play();slow.setSpeed(speed);slow.play();
    advanceBy(normal, 400);advanceBy(slow, 400);
    expect(normal.frame.elapsedMs).toBe(400);expect(slow.frame.elapsedMs).toBe(400 * speed);
    expect(slow.frame.stepProgress).toBeCloseTo(normal.frame.stepProgress * speed);
    expect(slow.frame.totalMs).toBe(normal.frame.totalMs);
  });

  test('changing speed preserves the displayed pose and uses the new rate only for subsequent time', () => {
    const clock = new TutorialClock();clock.play();advanceBy(clock, 1300);const before = clock.frame;
    clock.setSpeed(.25);
    expect(clock.frame.points).toEqual(before.points);expect(clock.frame.elapsedMs).toBe(before.elapsedMs);
    clock.advance(200);expect(clock.frame.elapsedMs).toBe(before.elapsedMs + 50);
    clock.setSpeed(2 as TutorialSpeed);expect(clock.frame.speed).toBe(.25);
  });

  test('ordinary pause and play preserve exact progress and do not restart a partially observed step', () => {
    const clock = new TutorialClock();clock.play();advanceBy(clock, 1340);clock.pause();const paused = clock.frame;
    advanceBy(clock, 600);expect(clock.frame).toEqual(paused);
    clock.play();expect(clock.frame.points).toEqual(paused.points);expect(clock.frame.elapsedMs).toBe(paused.elapsedMs);
    clock.play();clock.advance(60);expect(clock.frame.elapsedMs).toBe(1400);
  });

  test('invalid and long intervals are discarded entirely, and the next valid frame never catches them up', () => {
    const clock = new TutorialClock();clock.play();advanceBy(clock, 1200);const before = clock.frame;
    for (const delta of [0, -1, 200.01, 5000, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      clock.advance(delta);expect(clock.frame).toEqual(before);
    }
    clock.advance(200);expect(clock.frame.elapsedMs).toBe(before.elapsedMs + 200);
    clock.advance(16);expect(clock.frame.elapsedMs).toBe(before.elapsedMs + 216);
  });

  test('selecting a step immediately freezes its target, then play begins that step from its prior target', () => {
    const clock = new TutorialClock('load'), steps = tutorialLessons.load.steps;
    clock.play();clock.advance(100);clock.selectStep(3);
    const selected = clock.frame, stepStart = steps.slice(0, 3).reduce((sum, step) => sum + step.durationMs, 0);
    expect(selected).toMatchObject({ stepIndex: 3, stepProgress: 1, playing: false });
    expect(selected.points).toEqual(steps[3].points);expect(selected.elapsedMs).toBe(stepStart + steps[3].durationMs);
    clock.advance(200);expect(clock.frame).toEqual(selected);
    clock.pause();clock.play();
    expect(clock.frame).toMatchObject({ stepIndex: 3, stepProgress: 0, playing: true, elapsedMs: stepStart });
    expect(clock.frame.points).toEqual(steps[2].points);
    clock.advance(200);expect(clock.frame.stepProgress).toBeGreaterThan(0);
  });

  test('invalid step selections preserve the current animation and selection state', () => {
    const clock = new TutorialClock();clock.play();clock.advance(200);const before = clock.frame;
    for (const index of [-1, .5, 4, Number.NaN, Number.POSITIVE_INFINITY]) {
      clock.selectStep(index);expect(clock.frame).toEqual(before);
    }
    clock.selectStep(0);expect(clock.frame.points).toEqual(tutorialLessons.chop.steps[0].points);
    expect(clock.frame).toMatchObject({ stepIndex: 0, stepProgress: 1, playing: false });
  });

  test('replay returns to the beginning, clears a manual selection and preserves the playback rate', () => {
    const clock = new TutorialClock('carry');clock.setSpeed(.5);clock.selectStep(2);clock.replay();
    expect(clock.frame).toMatchObject({ task: 'carry', stepIndex: 0, stepProgress: 0, elapsedMs: 0, playing: true, speed: .5 });
    expect(clock.frame.points).toEqual(tutorialLessons.carry.steps[0].points);
    clock.advance(200);expect(clock.frame.elapsedMs).toBe(100);
  });

  test('a completed lesson stops at the final target and never loops or accumulates beyond its duration', () => {
    const clock = new TutorialClock('load'), steps = tutorialLessons.load.steps;
    clock.play();advanceBy(clock, clock.frame.totalMs + 130);
    const final = clock.frame;
    expect(final).toMatchObject({ stepIndex: 4, stepProgress: 1, playing: false, elapsedMs: final.totalMs });
    expect(final.points).toEqual(steps[4].points);
    clock.advance(200);clock.play();clock.advance(200);expect(clock.frame).toEqual(final);
    clock.replay();expect(clock.frame).toMatchObject({ stepIndex: 0, elapsedMs: 0, playing: true });
  });
});
