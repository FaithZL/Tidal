import type { DemoConfig } from '../config/demoConfig.js';
import type { ActionPhase, GameEffect, SessionSnapshot } from '../domain/types.js';

export interface VisualEffect { kind: 'impact' | 'tree' | 'log'; id: string; index: number; progress: number }
export interface FarmFrame {
  action: ActionPhase;
  effects: readonly VisualEffect[];
  player: { x: number; y: number; facing: number; walking: number };
  cart: { x: number; y: number };
  npc: { x: number; y: number; mode: 'idle' | 'gather' | 'secure' | 'guide' | 'celebrate'; progress: number };
  cartVisibleLogs: number; flyingLogs: number; groundVisibleLogs: number; handLog: boolean;
  deliveredLogs: number; carryProgress: number;
}
export class ActionAnimator {
  private snapshot: Readonly<SessionSnapshot> | null = null;
  private action: ActionPhase = 'ready';
  private effects: (VisualEffect & { elapsed: number; duration: number })[] = [];
  private seen = new Set<string>();
  private disposed = false;
  constructor(private readonly config: Readonly<DemoConfig>) {}
  sync(snapshot: Readonly<SessionSnapshot>): void {
    if (this.disposed) return;
    const previous = this.snapshot;
    if (previous?.sessionId !== snapshot.sessionId) this.clear();
    else if (previous.sourceEpoch !== snapshot.sourceEpoch || previous.taskRunId !== snapshot.taskRunId) {
      this.action = 'ready';
      // Committed arrivals/falls can finish across a task boundary; a resumed partial action cannot.
      this.effects = previous.taskRunId === snapshot.taskRunId ? [] : this.effects.filter(e => e.kind !== 'impact');
    }
    this.snapshot = snapshot;
  }
  apply(effect: GameEffect): void {
    const s = this.snapshot;
    if (this.disposed || !s || effect.sessionId !== s.sessionId) return;
    if (effect.kind === 'session-reset') { this.clear(); return; }
    if (s.pauseReasons.length || s.phase !== 'active') return;
    if (effect.taskRunId !== s.taskRunId || effect.sourceEpoch !== s.sourceEpoch) return;
    if ('task' in effect && effect.task !== s.task) return;
    if (effect.kind === 'action-phase') { this.action = effect.phase; return; }
    const id = `${effect.kind}:${effect.taskRunId}:${effect.sourceEpoch}:${effect.repId}`;
    if (this.seen.has(id)) return;
    let kind: VisualEffect['kind']; let index: number; let duration: number;
    if (effect.kind === 'action-impact') { kind = 'impact'; index = effect.task === 'chop' ? s.choppedTrees : -1; duration = 320; }
    else if (effect.kind === 'tree-felled') { kind = 'tree'; index = effect.choppedTrees - 1; duration = 1000; }
    else if (effect.kind === 'log-loaded') { kind = 'log'; index = effect.cartLogs - 1; duration = 540; }
    else return;
    this.seen.add(id);
    this.effects.push({ kind, id, index, elapsed: 0, progress: 0, duration });
  }
  advance(deltaMs: number): void {
    if (this.disposed || this.snapshot?.pauseReasons.length || !Number.isFinite(deltaMs) || deltaMs < 0) return;
    for (const e of this.effects) { e.elapsed += deltaMs; e.progress = Math.min(1, e.elapsed / e.duration); }
    this.effects = this.effects.filter(e => e.progress < 1);
  }
  private clear(): void { this.action = 'ready'; this.effects = []; this.seen.clear(); }
  dispose(): void { this.clear(); this.snapshot = null; this.disposed = true; }
  get frame(): FarmFrame {
    const s = this.snapshot;
    const f: FarmFrame = { action: this.action, effects: this.effects.map(({ kind, id, index, progress }) => ({ kind, id, index, progress })),
      cart: { x: 790, y: 540 }, player: { x: 365, y: 495, facing: -1, walking: 0 },
      npc: { x: 730, y: 475, mode: 'idle', progress: 0 }, cartVisibleLogs: s?.cartLogs ?? 0, flyingLogs: 0,
      groundVisibleLogs: s?.groundLogs ?? 0, handLog: false, deliveredLogs: s?.deliveredLogs ?? 0, carryProgress: 0 };
    if (!s) return f;
    const rest = Math.max(0, Math.min(1, 1 - s.remainingMs / this.config.restMs));
    if (s.task === 'chop') {
      const tree = treePosition(Math.min(s.choppedTrees, this.config.treeCount - 1));
      f.player = { x: tree.x + 105, y: tree.y + 45, facing: -1, walking: 0 };
    }
    if (s.task === 'load') {
      const gathering = s.phase === 'rest';
      f.cart = { x: gathering ? 790 - 140 * rest : 650, y: 540 };
      f.player = { x: gathering ? 515 + 33 * rest : 548, y: gathering ? 415 + 140 * rest : 555, facing: 1, walking: gathering ? rest * 24 : 0 };
      f.npc = gathering ? { x: 710 - 240 * Math.sin(rest * Math.PI), y: 500, mode: 'gather', progress: rest }
        : { x: 750, y: 470, mode: 'idle', progress: 0 };
      f.handLog = s.phase === 'active' && s.groundLogs > 0 && ['squat-down', 'stand-up', 'press-up'].includes(this.action);
      if (f.handLog) f.groundVisibleLogs--;
    }
    if (s.task === 'carry' || s.phase === 'results') {
      f.carryProgress = s.phase === 'results' ? 1 : Math.max(0, Math.min(1, s.carryActiveMs / this.config.carryTargetMs));
      f.cart = { x: 650 + f.carryProgress * 340, y: 540 - f.carryProgress * 130 };
      f.player = { x: f.cart.x + 130, y: f.cart.y + 5, facing: 1, walking: f.carryProgress * 60 };
      f.npc = { x: f.cart.x - 95, y: f.cart.y - 25, mode: s.phase === 'rest' ? 'secure' : s.phase === 'results' ? 'celebrate' : 'guide', progress: s.phase === 'rest' ? rest : f.carryProgress };
    }
    f.flyingLogs = Math.min(f.cartVisibleLogs, this.effects.filter(e => e.kind === 'log').length);
    f.cartVisibleLogs -= f.flyingLogs;
    return f;
  }
}

/** Stable layout shared by trees, player and impact rendering; no domain coordinates. */
export function treePosition(index: number): { x: number; y: number } {
  const positions = [{ x: 260, y: 450 }, { x: 140, y: 370 }, { x: 410, y: 370 }];
  const p = positions[index % positions.length]!;
  return { x: p.x + Math.floor(index / positions.length) * 32, y: p.y - Math.floor(index / positions.length) * 40 };
}
