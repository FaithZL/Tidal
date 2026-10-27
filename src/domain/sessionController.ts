import type { DemoConfig } from '../config/demoConfig.js';
import type {
  Clock, ExerciseSignal, GameEffect, InputContext,
  SessionCommand, SessionController, SessionSnapshot, TaskKind, Unsubscribe,
} from './types.js';

let sessionCounter = 0;
let runCounter = 0;
const nextSessionId = () => `session-${++sessionCounter}`;
const nextRunId = () => `run-${++runCounter}`;
const nextTask = (current: TaskKind): TaskKind | null =>
  current === 'chop' ? 'load' : current === 'load' ? 'carry' : null;

type Strip<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type LocalEffect = Strip<GameEffect, 'sessionId'>;

export function createSessionController(config: Readonly<DemoConfig>, clock: Clock): SessionController {
  let lastTickMs = clock.nowMs();
  const listeners = new Set<(s: Readonly<SessionSnapshot>) => void>();
  const effects = new Set<(e: GameEffect) => void>();
  let disposed = false;
  let seq = -1;
  let lastCapturedAtMs = -Infinity;
  const seenReps = new Set<number>();
  const seenImpacts = new Set<number>();
  const phaseProgress = new Map<number, number>();
  let lastCarryHoldSampleMs: number | null = null;
  let carryHolding = false;
  let carrySampleAtMs = -Infinity;
  let cameraReady = false;
  let snapshot: SessionSnapshot = initial('keyboard');

  function initial(mode: 'keyboard' | 'camera'): SessionSnapshot {
    return {
      sessionId: nextSessionId(), taskRunId: null, phase: 'home', task: null,
      inputMode: mode, sourceEpoch: 0, pauseReasons: [], remainingMs: 0,
      chopReps: 0, choppedTrees: 0, loadReps: 0, cartLogs: 0,
      groundLogs: config.initialLogs, deliveredLogs: 0, carryActiveMs: 0,
      exerciseActiveMs: 0, sessionElapsedMs: 0, rewardsGranted: false,
      sessionStartedAtMs: null,
    };
  }
  function emit(): void {
    const s = Object.freeze({ ...snapshot, pauseReasons: Object.freeze([...snapshot.pauseReasons]) });
    for (const f of listeners) f(s);
  }
  function effect(e: LocalEffect): void {
    for (const f of effects) f({ ...e, sessionId: snapshot.sessionId } as GameEffect);
  }
  function resetInputs(): void {
    seq = -1;
    lastCapturedAtMs = -Infinity;
    seenReps.clear();
    seenImpacts.clear();
    phaseProgress.clear();
    lastCarryHoldSampleMs = null;
    carryHolding = false;
    carrySampleAtMs = -Infinity;
  }
  function countdown(task: TaskKind): void {
    resetInputs();
    snapshot.task = task;
    snapshot.phase = 'countdown';
    snapshot.remainingMs = config.startCountdownMs;
    snapshot.taskRunId = null;
    effect({ kind: 'task-changed', task, phase: 'countdown' });
  }
  function active(): void {
    if (snapshot.task === null) return;
    snapshot.phase = 'active';
    snapshot.remainingMs = 0;
    snapshot.taskRunId = nextRunId();
    snapshot.sourceEpoch++;
    resetInputs();
    effect({ kind: 'task-changed', task: snapshot.task, phase: 'active' });
  }
  function rest(): void {
    if (!snapshot.task) return;
    const upcoming = nextTask(snapshot.task);
    if (!upcoming) return finish();
    snapshot.phase = 'rest';
    snapshot.task = upcoming;
    snapshot.taskRunId = null;
    snapshot.remainingMs = config.restMs;
    resetInputs();
    effect({ kind: 'task-changed', task: upcoming, phase: 'rest' });
  }
  function finish(): void {
    if (snapshot.rewardsGranted) return;
    if (snapshot.sessionStartedAtMs !== null) snapshot.sessionElapsedMs = Math.max(0, clock.nowMs() - snapshot.sessionStartedAtMs);
    snapshot.deliveredLogs += snapshot.cartLogs;
    snapshot.cartLogs = 0;
    snapshot.rewardsGranted = true;
    snapshot.phase = 'results';
    snapshot.remainingMs = 0;
    snapshot.task = null;
    snapshot.taskRunId = null;
    resetInputs();
    effect({ kind: 'rewards-granted', logs: snapshot.deliveredLogs,
      coins: config.coinReward, stamina: config.staminaReward, reward: 'tshirt' });
  }
  function isPaused(): boolean { return snapshot.pauseReasons.length > 0; }
  function settleCameraCountdown(): void {
    if (snapshot.phase !== 'countdown' || snapshot.inputMode !== 'camera' || !cameraReady || isPaused()) return;
    const delta = clock.nowMs() - lastTickMs;
    // Preserve the short ready interval before a loss edge, even if no render tick
    // occurred inside it. Never backfill a stale gap or start a task on a loss callback.
    if (Number.isFinite(delta) && delta > 0 && delta <= config.trackingMaxAgeMs)
      snapshot.remainingMs = Math.max(0, snapshot.remainingMs - delta);
  }
  function getSnapshot(): Readonly<SessionSnapshot> {
    return Object.freeze({ ...snapshot, pauseReasons: Object.freeze([...snapshot.pauseReasons]) });
  }
  function command(cmd: SessionCommand): void {
    if (disposed) return;
    if (cmd.kind === 'reset') {
      cameraReady = false;
      snapshot = initial('keyboard');
      lastTickMs = clock.nowMs();
      resetInputs();
      effect({ kind: 'session-reset' });
      emit();
      return;
    }
    if (cmd.kind === 'open-setup' && snapshot.phase === 'home') {
      snapshot.phase = 'setup';
      snapshot.inputMode = cmd.mode;
    } else if (cmd.kind === 'switch-source' && (snapshot.phase === 'setup' || isPaused())) {
      cameraReady = false;
      snapshot.inputMode = cmd.mode;
      snapshot.sourceEpoch++;
      resetInputs();
    } else if (cmd.kind === 'setup-ready' && snapshot.phase === 'setup' && (snapshot.inputMode === 'keyboard' ||
      (cmd.calibrated?.chop === true && cmd.calibrated.load === true && cmd.calibrated.carry === true))) {
      cameraReady = snapshot.inputMode === 'camera';
      snapshot.sessionStartedAtMs = clock.nowMs();
      lastTickMs = clock.nowMs();
      countdown('chop');
    } else if (cmd.kind === 'camera-readiness') {
      if (cameraReady !== cmd.ready && snapshot.inputMode === 'camera' && snapshot.phase === 'countdown') {
        // Recovery continues the same countdown; never charge an unobserved gap.
        if (!cmd.ready) settleCameraCountdown();
        lastTickMs = clock.nowMs();
      }
      cameraReady = cmd.ready;
    } else if (cmd.kind === 'pause' && snapshot.phase !== 'home' && snapshot.phase !== 'results') {
      settleCameraCountdown();
      const restTracking = cmd.reason === 'tracking' && snapshot.inputMode === 'camera' && snapshot.phase === 'rest';
      if (cmd.reason === 'tracking' && snapshot.inputMode === 'camera') cameraReady = false;
      if (!restTracking && !snapshot.pauseReasons.includes(cmd.reason)) snapshot.pauseReasons = [...snapshot.pauseReasons, cmd.reason];
      carryHolding = false;
      lastCarryHoldSampleMs = null;
    } else if (cmd.kind === 'resume') {
      if (cmd.reason === 'tracking' && snapshot.inputMode === 'camera' && !cameraReady) return;
      const hadPauses = isPaused();
      snapshot.pauseReasons = snapshot.pauseReasons.filter(x => x !== cmd.reason);
      if (hadPauses && !isPaused() && snapshot.phase === 'active') {
        snapshot.sourceEpoch++;
        resetInputs();
      }
      lastTickMs = clock.nowMs();
    }
    emit();
  }
  function accept(sig: ExerciseSignal): void {
    if (disposed || snapshot.phase !== 'active' || isPaused()) return;
    if (sig.sessionId !== snapshot.sessionId || sig.taskRunId !== snapshot.taskRunId || sig.sourceEpoch !== snapshot.sourceEpoch) return;
    const now = clock.nowMs();
    if (!Number.isFinite(sig.capturedAtMs) || !Number.isSafeInteger(sig.seq) || sig.seq <= seq) return;
    if (sig.capturedAtMs < 0 || sig.capturedAtMs < lastCapturedAtMs || sig.capturedAtMs > now + 50 || now - sig.capturedAtMs > config.trackingMaxAgeMs) return;
    seq = sig.seq;
    lastCapturedAtMs = sig.capturedAtMs;
    if (sig.kind === 'tracking') {
      if (snapshot.inputMode === 'camera' && sig.status !== 'ready') command({ kind: 'pause', reason: 'tracking' });
      return;
    }
    if (sig.kind === 'hold-sample') {
      if (snapshot.task !== 'carry' || sig.task !== 'carry') return;
      const validHold = sig.holding && sig.valid;
      if (validHold && carryHolding && lastCarryHoldSampleMs !== null) {
        const gap = sig.capturedAtMs - lastCarryHoldSampleMs;
        if (gap > 0 && gap <= config.maxPoseGapMs) {
          const credited = Math.min(gap, config.carryTargetMs - snapshot.carryActiveMs);
          snapshot.carryActiveMs += credited;
          snapshot.exerciseActiveMs += credited;
          if (snapshot.carryActiveMs >= config.carryTargetMs) {
            snapshot.carryActiveMs = config.carryTargetMs;
            finish();
          }
        }
      }
      carryHolding = validHold;
      lastCarryHoldSampleMs = validHold ? sig.capturedAtMs : null;
      carrySampleAtMs = sig.capturedAtMs;
      emit();
      return;
    }
    if (sig.task !== snapshot.task || (sig.task !== 'chop' && sig.task !== 'load')) return;
    if (!Number.isSafeInteger(sig.repId) || sig.repId < 0) return;
    const context = { taskRunId: sig.taskRunId, sourceEpoch: sig.sourceEpoch, repId: sig.repId };
    if (sig.kind === 'phase') {
      if (!Number.isFinite(sig.progress)) return;
      const phases: readonly string[] = sig.task === 'chop'
        ? ['ready', 'chop-down', 'chop-return']
        : ['ready', 'squat-down', 'stand-up', 'press-up', 'load-return'];
      const current = phaseProgress.get(sig.repId) ?? -1;
      if (phases[current + 1] === sig.phase) phaseProgress.set(sig.repId, current + 1);
      if (!seenReps.has(sig.repId)) effect({ kind: 'action-phase', task: sig.task, phase: sig.phase,
        progress: Math.max(0, Math.min(1, sig.progress)), ...context });
    } else if (sig.kind === 'impact') {
      if (!seenReps.has(sig.repId) && !seenImpacts.has(sig.repId)) {
        seenImpacts.add(sig.repId);
        effect({ kind: 'action-impact', task: sig.task, ...context });
      }
    } else if (sig.kind === 'rep-completed') {
      if (seenReps.has(sig.repId)) return;
      if (phaseProgress.get(sig.repId) !== (sig.task === 'chop' ? 2 : 4)) return;
      seenReps.add(sig.repId);
      phaseProgress.delete(sig.repId);
      if (sig.task === 'chop') {
        snapshot.chopReps++;
        if (snapshot.chopReps % config.repsPerTree === 0) {
          snapshot.choppedTrees++;
          snapshot.groundLogs += config.logsPerTree;
          effect({ kind: 'tree-felled', choppedTrees: snapshot.choppedTrees, ...context });
        }
        if (snapshot.chopReps >= config.chopRepTarget) rest();
      } else {
        snapshot.loadReps++;
        if (snapshot.groundLogs > 0) {
          snapshot.groundLogs--;
          snapshot.cartLogs++;
          effect({ kind: 'log-loaded', cartLogs: snapshot.cartLogs, ...context });
        }
        if (snapshot.loadReps >= config.loadRepTarget) rest();
      }
    }
    emit();
  }
  function tick(nowMs: number): void {
    if (disposed || !Number.isFinite(nowMs) || nowMs < lastTickMs) return;
    const delta = Math.max(0, nowMs - lastTickMs);
    lastTickMs = nowMs;
    if (snapshot.sessionStartedAtMs !== null && snapshot.phase !== 'results') {
      snapshot.sessionElapsedMs = Math.max(0, nowMs - snapshot.sessionStartedAtMs);
    }
    if (isPaused() || (snapshot.phase === 'countdown' && snapshot.inputMode === 'camera' && !cameraReady)) return;
    if (snapshot.phase === 'active') {
      if (snapshot.task === 'carry') {
        if (nowMs - carrySampleAtMs > config.trackingMaxAgeMs) {
          carryHolding = false;
          lastCarryHoldSampleMs = null;
        }
      } else snapshot.exerciseActiveMs += delta;
    } else if (snapshot.phase === 'countdown' || snapshot.phase === 'rest') {
      snapshot.remainingMs = Math.max(0, snapshot.remainingMs - delta);
      if (snapshot.remainingMs === 0) {
        if (snapshot.phase === 'countdown') active();
        else if (snapshot.task && (snapshot.inputMode !== 'camera' || cameraReady)) countdown(snapshot.task);
      }
    }
    emit();
  }
  function dispose(): void { disposed = true; listeners.clear(); effects.clear(); resetInputs(); }
  function subscribe(fn: (s: Readonly<SessionSnapshot>) => void): Unsubscribe {
    listeners.add(fn); fn(getSnapshot()); return () => listeners.delete(fn);
  }
  function onEffect(fn: (e: GameEffect) => void): Unsubscribe {
    effects.add(fn); return () => effects.delete(fn);
  }
  return { getSnapshot, subscribe, onEffect, command, accept, tick, dispose };
}
/** Context carries the authority boundary for an input source. */
export function inputContext(snapshot: Readonly<SessionSnapshot>): InputContext | null {
  return snapshot.task && snapshot.taskRunId ? {
    sessionId: snapshot.sessionId, taskRunId: snapshot.taskRunId,
    sourceEpoch: snapshot.sourceEpoch, task: snapshot.task,
  } : null;
}
