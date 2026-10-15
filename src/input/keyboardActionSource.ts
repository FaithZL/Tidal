import type { ExerciseSignal, InputContext, TaskKind } from '../domain/types.js';
import type { ActionSource } from './types.js';

/** Produces semantic exercise signals; never changes inventory itself. */
type Strip<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type LocalSignal = Strip<ExerciseSignal, 'seq' | 'capturedAtMs' | 'sessionId' | 'taskRunId' | 'sourceEpoch'>;
export class KeyboardActionSource implements ActionSource {
  constructor(private readonly speed = 1) {}
  readonly mode = 'keyboard' as const;
  private context: InputContext | null = null;
  private emit: ((e: ExerciseSignal) => void) | null = null;
  private seq = 0;
  private repId = 0;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private holdTimer: ReturnType<typeof setInterval> | null = null;
  private inRep = false;
  private holding = false;
  private generation = 0;

  async start(context: InputContext, emit: (e: ExerciseSignal) => void): Promise<void> {
    const stopping = this.stop();
    const generation = this.generation;
    await stopping;
    if (generation !== this.generation) return;
    this.context = context;
    this.emit = emit;
  }
  private signal(data: LocalSignal): void {
    const c = this.context;
    if (!c || !this.emit) return;
    this.emit({ ...c, ...data, seq: ++this.seq, capturedAtMs: performance.now() } as ExerciseSignal);
  }
  private after(ms: number, fn: () => void): void {
    const generation = this.generation;
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      if (generation === this.generation) fn();
    }, ms * this.speed);
    this.timers.add(timer);
  }
  doRep(): boolean {
    const task = this.context?.task;
    if (!task || task === 'carry' || this.inRep) return false;
    this.inRep = true;
    const repId = ++this.repId;
    if (task === 'chop') {
      const phases = ['ready', 'chop-down', 'chop-return'] as const;
      phases.forEach((phase, i) => this.after(i === 0 ? 0 : i === 1 ? 135 : 335, () => {
        this.signal({ kind: 'phase', task: 'chop', repId, phase, progress: i / (phases.length - 1) });
      }));
    } else {
      const phases = ['ready', 'squat-down', 'stand-up', 'press-up', 'load-return'] as const;
      const delays = [0, 140, 300, 445, 580];
      phases.forEach((phase, i) => this.after(delays[i], () => {
        this.signal({ kind: 'phase', task: 'load', repId, phase, progress: i / (phases.length - 1) });
      }));
    }
    this.after(task === 'chop' ? 195 : 500, () => this.signal({ kind: 'impact', task, repId }));
    this.after(task === 'chop' ? 460 : 715, () => {
      this.signal({ kind: 'rep-completed', task, repId });
      this.inRep = false;
    });
    return true;
  }
  holdStart(): void {
    if (this.context?.task !== 'carry' || this.holding) return;
    this.holding = true;
    this.signal({ kind: 'hold-sample', task: 'carry', holding: true, valid: true });
    this.holdTimer = setInterval(() => {
      if (this.holding) this.signal({ kind: 'hold-sample', task: 'carry', holding: true, valid: true });
    }, 50);
  }
  holdEnd(): void {
    if (!this.holding) return;
    this.holding = false;
    if (this.holdTimer) clearInterval(this.holdTimer);
    this.holdTimer = null;
    this.signal({ kind: 'hold-sample', task: 'carry', holding: false, valid: true });
  }
  async stop(): Promise<void> {
    this.generation++;
    this.holdEnd();
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    this.context = null;
    this.emit = null;
    this.inRep = false;
    this.repId = 0;
    this.seq = 0;
  }
  async dispose(): Promise<void> { await this.stop(); }
  get isHolding(): boolean { return this.holding; }
  get currentTask(): TaskKind | null { return this.context?.task ?? null; }
}
