import type { ExerciseSignal, InputContext, InputMode } from '../domain/types.js';
export interface ActionSource {
  readonly mode: InputMode;
  start(context: InputContext, emit: (event: ExerciseSignal) => void): Promise<void>;
  stop(): Promise<void>;
  dispose(): Promise<void>;
}
