import type { ExerciseSignal, InputContext } from '../domain/types.js';
import type { ActionSource } from './types.js';
import { KeyboardActionSource } from './keyboardActionSource.js';

/** Explicit synthetic playback. Reuses complete semantic cycles; never accesses the session. */
export class AutoDemoSource implements ActionSource {
  readonly mode = 'keyboard' as const;
  private readonly keyboard: KeyboardActionSource;
  private timer: ReturnType<typeof setInterval> | undefined;
  private generation = 0;
  constructor(private readonly speed = 1) { this.keyboard = new KeyboardActionSource(speed); }
  async start(context: InputContext, emit: (e: ExerciseSignal) => void): Promise<void> {
    const stopping = this.stop(), generation = this.generation;
    await stopping;if (generation !== this.generation) return;
    await this.keyboard.start(context, emit);if (generation !== this.generation) return;
    if (context.task === 'carry') this.keyboard.holdStart();
    else {
      this.keyboard.doRep();
      this.timer = setInterval(() => { if (generation === this.generation) this.keyboard.doRep(); }, 1200 * this.speed);
    }
  }
  async stop(): Promise<void> {
    this.generation++;clearInterval(this.timer);this.timer = undefined;await this.keyboard.stop();
  }
  async dispose(): Promise<void> { await this.stop(); }
}
