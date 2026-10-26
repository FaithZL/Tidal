import type { TaskKind } from '../domain/types.js';
import { tutorialLessons, type TutorialPoint, type TutorialJoint } from './exerciseTutorialModel.js';

export interface MovementGuideFrame {
  task: TaskKind;
  stepIndex: number;
  title: string;
  elapsedMs: number;
  totalMs: number;
  points: Readonly<Record<TutorialJoint, TutorialPoint>>;
}

const cycleSteps: Readonly<Record<TaskKind, readonly number[]>> = {
  chop: [1, 2, 3],
  load: [0, 1, 2, 3, 4],
  carry: [1],
};

// This clock only animates a demonstration; it never submits exercise input.
export class MovementGuideClock {
  private elapsedMs = 0;

  constructor(private task: TaskKind = 'chop') {}

  private get totalMs(): number {
    const steps = tutorialLessons[this.task].steps;
    return cycleSteps[this.task].reduce((sum, index) => sum + steps[index].durationMs, 0);
  }

  get frame(): MovementGuideFrame {
    const steps = tutorialLessons[this.task].steps, cycle = cycleSteps[this.task];
    let cycleIndex = 0, stepElapsedMs = this.elapsedMs;
    while (stepElapsedMs >= steps[cycle[cycleIndex]].durationMs) {
      stepElapsedMs -= steps[cycle[cycleIndex]].durationMs;
      cycleIndex++;
    }
    const stepIndex = cycle[cycleIndex], step = steps[stepIndex];
    const previousIndex = cycle[(cycleIndex + cycle.length - 1) % cycle.length];
    const from = steps[previousIndex].points;
    const progress = Math.min(1, stepElapsedMs / (step.durationMs * .75));
    let points = from;
    if (progress >= 1) points = step.points;
    else if (progress > 0) {
      const smooth = progress * progress * (3 - 2 * progress), interpolated = { ...step.points };
      for (const joint of Object.keys(step.points) as TutorialJoint[]) {
        const a = from[joint], b = step.points[joint];
        interpolated[joint] = Object.freeze({ x: a.x + (b.x - a.x) * smooth, y: a.y + (b.y - a.y) * smooth });
      }
      points = Object.freeze(interpolated);
    }
    return {
      task: this.task, stepIndex, title: step.title,
      elapsedMs: this.elapsedMs, totalMs: this.totalMs, points,
    };
  }

  reset(task: TaskKind): void {
    this.task = task;
    this.elapsedMs = 0;
  }

  advance(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0 || deltaMs > 200) return;
    this.elapsedMs = (this.elapsedMs + deltaMs) % this.totalMs;
  }
}
