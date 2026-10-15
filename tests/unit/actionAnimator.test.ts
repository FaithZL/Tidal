import { describe, expect, it } from 'vitest';
import { ActionAnimator } from '../../src/game/ActionAnimator.js';
import { createDemoConfig } from '../../src/config/demoConfig.js';
import type { ActionPhase, GameEffect, SessionSnapshot } from '../../src/domain/types.js';

const config = createDemoConfig();
const base: SessionSnapshot = {
  sessionId: 's1', taskRunId: 'chop1', sourceEpoch: 1, phase: 'active', task: 'chop', inputMode: 'keyboard',
  pauseReasons: [], remainingMs: 0, chopReps: 0, choppedTrees: 0, loadReps: 0, cartLogs: 0,
  groundLogs: 12, deliveredLogs: 0, carryActiveMs: 0, exerciseActiveMs: 0, sessionElapsedMs: 0,
  rewardsGranted: false, sessionStartedAtMs: 0,
};
function effect(phase: ActionPhase, task: 'chop' | 'load' = 'chop'): GameEffect {
  return { kind: 'action-phase', sessionId: 's1', taskRunId: 'chop1', sourceEpoch: 1, repId: 1, task, phase, progress: 1 };
}
const impact: GameEffect = { ...effect('chop-down'), kind: 'action-impact', task: 'chop' };
function setup(s = base) { const a = new ActionAnimator(config); a.sync(s); return a; }

describe('presentation consumes snapshots; never completes a business action', () => {
  it.each(['ready', 'chop-down', 'chop-return', 'squat-down', 'stand-up', 'press-up', 'load-return'] as const)('%s enters independently and stays until another effect', phase => {
    const task = ['squat-down', 'stand-up', 'press-up', 'load-return'].includes(phase) ? 'load' : 'chop';
    const a = setup({ ...base, task }); a.apply(effect(phase, task)); a.advance(10000);
    expect(a.frame.action).toBe(phase); expect(a.frame.effects).toEqual([]);
  });
  it('one impact per rep, even after its particles expire', () => {
    const a = setup(); a.apply(impact); a.apply(impact);
    expect(a.frame.effects.filter(e => e.kind === 'impact')).toHaveLength(1);
    a.advance(5000); a.apply(impact); expect(a.frame.effects).toHaveLength(0);
    a.apply({ ...impact, repId: 2 }); expect(a.frame.effects).toHaveLength(1);
  });
  it('anchors a hit to the struck tree even if the last rep selects the next tree', () => {
    const a = setup({ ...base, choppedTrees: 1 });a.apply(impact);
    a.sync({ ...base, choppedTrees: 2 });expect(a.frame.effects[0]?.index).toBe(1);
  });
  it('rejects stale session, task, epoch and paused phase/impact callbacks', () => {
    const a = setup();
    for (const patch of [{ sessionId: 'old' }, { taskRunId: 'old' }, { sourceEpoch: 0 }, { task: 'load' as const }]) a.apply({ ...impact, ...patch });
    expect(a.frame.effects).toHaveLength(0);
    a.sync({ ...base, pauseReasons: ['user'] });a.apply(effect('chop-down'));a.apply(impact);
    expect(a.frame.action).toBe('ready');expect(a.frame.effects).toHaveLength(0);
  });
  it('freezes effects on pause, clears partial action on resume and releases all state on reset/dispose', () => {
    const a = setup();a.apply(effect('chop-down'));a.apply(impact);a.advance(80);
    a.sync({ ...base, pauseReasons: ['user', 'visibility'] });
    const frozen = a.frame; a.advance(10000);expect(a.frame).toEqual(frozen);
    a.sync({ ...base, sourceEpoch: 2 });expect(a.frame.action).toBe('ready');expect(a.frame.effects).toHaveLength(0);
    a.apply({ ...impact, sourceEpoch: 2 });
    a.sync({ ...base, sessionId: 's2', phase: 'home', task: null, taskRunId: null });
    expect(a.frame.effects).toHaveLength(0);expect(a.frame.action).toBe('ready');
    a.dispose();a.sync(base);a.apply(impact);a.advance(200);
    expect(a.frame.effects).toHaveLength(0);
  });
  it('committed tree/log effects survive the transition to rest, without multiplying or changing inventory', () => {
    const s = Object.freeze({ ...base, chopReps: 15, choppedTrees: 3, groundLogs: 15 });
    const a = setup(s);const felled: GameEffect = { ...impact, kind: 'tree-felled', choppedTrees: 3 };
    a.apply(felled);a.apply(felled);a.sync({ ...s, task: 'load', taskRunId: null, phase: 'rest', remainingMs: config.restMs });
    expect(a.frame.effects.filter(e => e.kind === 'tree')).toHaveLength(1);
    a.advance(5000);expect(a.frame.effects).toHaveLength(0);expect(s.groundLogs).toBe(15);
    a.sync({ ...base, task: 'load', cartLogs: 1, groundLogs: 14 });
    const loaded: GameEffect = { sessionId: 's1', taskRunId: 'chop1', sourceEpoch: 1, repId: 1, kind: 'log-loaded', cartLogs: 1 };
    a.apply(loaded);a.apply(loaded);
    expect(a.frame.effects.filter(e => e.kind === 'log')).toHaveLength(1);
    expect(a.frame.cartVisibleLogs + a.frame.flyingLogs).toBe(1);
    a.advance(2000);expect(a.frame.cartVisibleLogs).toBe(1);expect(a.frame.flyingLogs).toBe(0);
  });
  it('carry position has no easing or wall-clock drift; only snapshot progress moves the cart', () => {
    const s = { ...base, task: 'carry' as const, cartLogs: 15, groundLogs: 0, carryActiveMs: 30000 };
    const a = setup(s);const position = a.frame.cart;
    a.advance(30000);expect(a.frame.cart).toEqual(position);
    a.sync({ ...s, carryActiveMs: 60000 });expect(a.frame.cart.x).toBeGreaterThan(position.x);
    a.sync({ ...s, phase: 'results', task: null, deliveredLogs: 15, cartLogs: 0, rewardsGranted: true });
    expect(a.frame.cartVisibleLogs).toBe(0);expect(a.frame.deliveredLogs).toBe(15);
  });
  it('both NPC scripts follow rest progress without mutating the supplied snapshot', () => {
    const s = Object.freeze({ ...base, phase: 'rest' as const, taskRunId: null, task: 'load' as const, remainingMs: 15000, groundLogs: 15, choppedTrees: 3 });
    const a = setup(s);expect(a.frame.npc.mode).toBe('gather');const start = a.frame.npc.x;
    a.sync({ ...s, remainingMs: 7500 });expect(a.frame.npc.x).not.toBe(start);
    const middle = a.frame;a.advance(5000);expect(a.frame.npc).toEqual(middle.npc);
    expect(s.groundLogs).toBe(15);
    a.sync({ ...s, task: 'carry', groundLogs: 0, cartLogs: 15 });expect(a.frame.npc.mode).toBe('secure');
    expect(a.frame.cartVisibleLogs).toBe(15);
  });
});
