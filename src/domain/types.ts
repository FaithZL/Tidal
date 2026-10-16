export type TaskKind = 'chop' | 'load' | 'carry';
export type InputMode = 'keyboard' | 'camera';
export type SessionPhase = 'home' | 'setup' | 'countdown' | 'active' | 'rest' | 'results';
export type PauseReason = 'user' | 'tracking' | 'visibility' | 'source-error';
export type Unsubscribe = () => void;
export type ChopPhase = 'ready' | 'chop-down' | 'chop-return';
export type LoadPhase = 'ready' | 'squat-down' | 'stand-up' | 'press-up' | 'load-return';
export type ActionPhase = ChopPhase | LoadPhase;
export interface InputContext {
  sessionId: string;
  taskRunId: string;
  sourceEpoch: number;
  task: TaskKind;
}
export interface SignalMeta {
  sessionId: string;
  taskRunId: string;
  sourceEpoch: number;
  seq: number;
  capturedAtMs: number;
}
export type ExerciseSignal = SignalMeta & (
  | { kind: 'phase'; task: 'chop'; repId: number; phase: ChopPhase; progress: number }
  | { kind: 'phase'; task: 'load'; repId: number; phase: LoadPhase; progress: number }
  | { kind: 'impact'; task: 'chop' | 'load'; repId: number }
  | { kind: 'rep-completed'; task: 'chop' | 'load'; repId: number }
  | { kind: 'hold-sample'; task: 'carry'; holding: boolean; valid: boolean }
  | { kind: 'tracking'; status: 'ready' | 'lost' | 'error'; message?: string }
);
export interface SessionSnapshot {
  sessionId: string;
  taskRunId: string | null;
  phase: SessionPhase;
  task: TaskKind | null;
  inputMode: InputMode;
  sourceEpoch: number;
  pauseReasons: readonly PauseReason[];
  remainingMs: number;
  chopReps: number;
  choppedTrees: number;
  loadReps: number;
  cartLogs: number;
  groundLogs: number;
  deliveredLogs: number;
  carryActiveMs: number;
  exerciseActiveMs: number;
  sessionElapsedMs: number;
  rewardsGranted: boolean;
  sessionStartedAtMs: number | null;
}
export type SessionCommand =
  | { kind: 'open-setup'; mode: InputMode }
  | { kind: 'setup-ready'; calibrated?: Readonly<Record<TaskKind,boolean>> }
  | { kind: 'camera-readiness'; ready: boolean }
  | { kind: 'pause'; reason: PauseReason }
  | { kind: 'resume'; reason: PauseReason }
  | { kind: 'switch-source'; mode: InputMode }
  | { kind: 'reset' };
export type GameEffect = {
  sessionId: string;
  taskRunId?: string;
  sourceEpoch?: number;
  repId?: number;
} & (
  | { kind: 'action-phase'; task: 'chop' | 'load'; phase: ActionPhase; progress: number }
  | { kind: 'action-impact'; task: 'chop' | 'load' }
  | { kind: 'tree-felled'; choppedTrees: number }
  | { kind: 'log-loaded'; cartLogs: number }
  | { kind: 'task-changed'; task: TaskKind; phase: SessionPhase }
  | { kind: 'rewards-granted'; logs: number; coins: number; stamina: number; reward: 'tshirt' }
  | { kind: 'session-reset' }
);
export interface Clock { nowMs(): number; }
export interface SessionController {
  getSnapshot(): Readonly<SessionSnapshot>;
  subscribe(listener: (s: Readonly<SessionSnapshot>) => void): Unsubscribe;
  onEffect(listener: (e: GameEffect) => void): Unsubscribe;
  command(command: SessionCommand): void;
  accept(signal: ExerciseSignal): void;
  tick(nowMs: number): void;
  dispose(): void;
}
