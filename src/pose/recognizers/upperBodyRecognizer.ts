import type { TaskKind } from '../../domain/types.js';
import type { PoseFrame } from '../types.js';
import { UpperBodyStream, type UpperBodyFeatures, type UpperBodyProfile, type UpperBodyVector } from '../upperBody.js';
import { createRecognitionConfig, recognitionConfig, type RecognitionConfig } from '../../config/recognitionConfig.js';
import type { RecognitionFeedback } from '../recognitionFeedback.js';
import type { Recognizer, RecognitionEvent } from './types.js';

export class UpperBodyRecognizer implements Recognizer {
  private readonly profile: UpperBodyProfile;
  private readonly config: RecognitionConfig;
  private readonly stream: UpperBodyStream;
  private latest: { raw: UpperBodyFeatures; smooth: UpperBodyFeatures } | null = null;
  private phase = 'unready';
  private reason: string | null = null;
  private repId = 0;
  private cycleStart: number | null = null;
  private candidates = new Map<string, number>();
  private holding = false;
  private holdCandidate: number | null = null;
  private completed = false;
  constructor(profile: UpperBodyProfile, private readonly task: TaskKind, config: RecognitionConfig = recognitionConfig) {
    this.config = createRecognitionConfig(config);
    const reference = profile.reference;
    const all = [profile.lowered, profile.raised, profile.hold].flatMap(vector => (['left', 'right'] as const)
      .flatMap(side => [vector[side].x, vector[side].y, vector[side].elbowDeg]));
    if (!all.every(Number.isFinite) || ![reference.width, reference.height, reference.scalePx].every(value => Number.isFinite(value) && value > 0) ||
      ![reference.center.x, reference.center.y].every(Number.isFinite) || reference.center.x < 0 || reference.center.x > reference.width ||
      reference.center.y < 0 || reference.center.y > reference.height || reference.scalePx < Math.min(reference.width, reference.height) * this.config.minTorsoHeightFraction ||
      reference.scalePx > Math.hypot(reference.width, reference.height)) throw new Error('Invalid upper-body calibration');
    for (const side of ['left', 'right'] as const) {
      if (profile.lowered[side].y - profile.raised[side].y < this.config.minPressTravelTorso)
        throw new Error('Upper-body raised calibration is not separable');
      if (this.distance(profile.hold[side], profile.lowered[side]) <= Math.max(this.config.minPoseSeparation, this.config.minCarrySeparation / Math.sqrt(3)))
        throw new Error('Upper-body hold calibration is not separable');
    }
    this.profile = structuredClone(profile);this.stream = new UpperBodyStream(this.config, this.profile.reference);
  }
  private distance(a: UpperBodyVector['left'], b: UpperBodyVector['left']): number {
    return Math.hypot(a.x - b.x, a.y - b.y, (a.elbowDeg - b.elbowDeg) / 180) / Math.sqrt(3);
  }
  private progress(f: UpperBodyVector, side: 'left' | 'right'): number {
    const low = this.profile.lowered[side], high = this.profile.raised[side];
    return (low.y - f[side].y) / (low.y - high.y);
  }
  private both(ratio: number, raised: boolean): boolean {
    return !!this.latest && [this.latest.raw, this.latest.smooth].every(f => (['left', 'right'] as const).every(side =>
      raised ? this.progress(f, side) >= ratio : this.progress(f, side) <= ratio));
  }
  private confirm(key: string, condition: boolean, time: number): boolean {
    if (!condition) { this.candidates.delete(key);return false; }
    if (!this.candidates.has(key)) this.candidates.set(key, time);
    if (time - this.candidates.get(key)! < this.config.phaseConfirmMs) return false;
    this.candidates.delete(key);return true;
  }
  private clearCycle(): void { this.phase = 'unready';this.cycleStart = null;this.candidates.clear(); }
  update(frame: PoseFrame, nowMs = frame.capturedAtMs): readonly RecognitionEvent[] {
    this.latest = this.stream.read(frame, nowMs);this.completed = false;
    if (!this.latest) {
      this.clearCycle();this.holding = false;this.holdCandidate = null;this.reason = this.stream.reason;
      const lost: RecognitionEvent = { kind: 'tracking', status: 'lost', message: this.reason ?? 'invalid-upper-body-pose' };
      return this.task === 'carry' ? [{ kind: 'hold-sample', task: 'carry', holding: false, valid: false }, lost] : [lost];
    }
    this.reason = null;
    const events: RecognitionEvent[] = [{ kind: 'tracking', status: 'ready' }];
    if (this.task === 'carry') {
      const inside = (ratio: number) => (['left', 'right'] as const).every(side => this.holdInside(side, ratio));
      if (this.holding) {
        if (!inside(this.config.holdExitRatio)) { this.holding = false;this.holdCandidate = null; }
      } else if (inside(this.config.holdEnterRatio)) {
        this.holdCandidate ??= frame.capturedAtMs;
        if (frame.capturedAtMs - this.holdCandidate >= this.config.holdConfirmMs) this.holding = true;
      } else this.holdCandidate = null;
      events.push({ kind: 'hold-sample', task: 'carry', holding: this.holding, valid: true });
      return events;
    }
    const max = this.task === 'chop' ? this.config.chopMaxCycleMs : this.config.loadMaxCycleMs;
    if (this.cycleStart !== null && frame.capturedAtMs - this.cycleStart > max) {
      this.clearCycle();this.reason = 'cycle-timeout';return events;
    }
    const lowered = this.both(this.config.repReturnRatio, false), raised = this.both(this.config.repEnterRatio, true), task = this.task;
    if (this.phase === 'unready') {
      if (this.confirm('ready', lowered, frame.capturedAtMs)) {
        this.repId++;this.phase = 'ready';events.push({ kind: 'phase', task, repId: this.repId, phase: 'ready', progress: 0 });
      }
    } else if (this.phase === 'ready') {
      if (this.confirm('raised', raised, frame.capturedAtMs)) {
        this.cycleStart = frame.capturedAtMs;
        if (task === 'chop') {
          this.phase = 'chop-down';events.push({ kind: 'phase', task, repId: this.repId, phase: 'chop-down', progress: .5 });
        } else {
          // Upper-body lifting replaces the human squat. Keep the existing farm protocol in legal order.
          for (const [phase, progress] of [['squat-down', .25], ['stand-up', .5], ['press-up', .75]] as const)
            events.push({ kind: 'phase', task, repId: this.repId, phase, progress });
          this.phase = 'press-up';
        }
        events.push({ kind: 'impact', task, repId: this.repId });
      }
    } else {
      if (task === 'chop' && this.phase === 'chop-down' && !raised) {
        this.phase = 'chop-return';events.push({ kind: 'phase', task, repId: this.repId, phase: 'chop-return', progress: 1 });
      }
      if (task === 'load' && this.phase === 'press-up' && lowered) {
        this.phase = 'load-return';events.push({ kind: 'phase', task, repId: this.repId, phase: 'load-return', progress: 1 });
      }
      if (this.confirm('return', lowered, frame.capturedAtMs)) {
        const min = task === 'chop' ? this.config.chopMinCycleMs : this.config.loadMinCycleMs;
        if (frame.capturedAtMs - this.cycleStart! >= min) {
          events.push({ kind: 'rep-completed', task, repId: this.repId });this.completed = true;
        }
        this.clearCycle();
      }
    }
    return events;
  }
  private holdInside(side: 'left' | 'right', ratio: number): boolean {
    if (!this.latest) return false;
    const target = this.profile.hold[side], release = this.profile.lowered[side], separation = this.distance(target, release);
    return [this.latest.raw, this.latest.smooth].every(f => this.distance(f[side], target) <= ratio * separation &&
      this.distance(f[side], target) < this.distance(f[side], release));
  }
  reset(): void {
    this.stream.reset();this.latest = null;this.clearCycle();this.reason = null;this.holding = false;this.holdCandidate = null;this.completed = false;
  }
  getDebug() { return { phase: this.task === 'carry' ? this.holding ? 'holding' : this.holdCandidate === null ? 'released' : 'confirming' : this.phase, reason: this.reason }; }
  getFeedback(): RecognitionFeedback | null {
    if (!this.latest) return null;
    const joints: Partial<Record<number, 'matched' | 'adjust'>> = {};
    const mark = (side: 'left' | 'right', judgment: 'matched' | 'adjust') => {
      for (const index of side === 'left' ? [11, 13, 15] : [12, 14, 16]) joints[index] = judgment;
    };
    if (this.completed) { mark('left', 'matched');mark('right', 'matched');return { status: 'matched', message: '完整举手已完成', joints }; }
    if (this.task === 'carry') {
      const ratio = this.holding ? this.config.holdExitRatio : this.config.holdEnterRatio;
      if (!this.holding && (['left', 'right'] as const).every(side => this.holdInside(side, this.config.holdExitRatio)) &&
        !(this.holdInside('left', ratio) && this.holdInside('right', ratio))) return { status: 'moving', message: '双臂向持姿位置调整', joints };
      for (const side of ['left', 'right'] as const) mark(side, this.holdInside(side, ratio) ? 'matched' : 'adjust');
      const matched = this.holdInside('left', ratio) && this.holdInside('right', ratio);
      return { status: matched ? 'matched' : 'adjust', message: matched ? this.holding ? '双臂持姿匹配' : '双臂匹配，正在确认' : '双臂回到前举持姿', joints };
    }
    const positions = (['left', 'right'] as const).map(side => {
      const q = this.progress(this.latest!.smooth, side), raw = this.progress(this.latest!.raw, side);
      return { side, low: q <= this.config.repReturnRatio && raw <= this.config.repReturnRatio,
        high: q >= this.config.repEnterRatio && raw >= this.config.repEnterRatio };
    });
    const bothLow = positions.every(p => p.low), bothHigh = positions.every(p => p.high);
    if (this.phase === 'unready') {
      for (const p of positions) if (p.low || p.high) mark(p.side, p.low ? 'matched' : 'adjust');
    } else if (this.phase === 'ready') {
      for (const p of positions) {
        if (bothLow || bothHigh || p.high) mark(p.side, 'matched');
        else if (p.low && positions.some(other => other.high)) mark(p.side, 'adjust');
      }
    } else {
      for (const p of positions) {
        if (bothHigh || bothLow || p.low) mark(p.side, 'matched');
        else if (p.high && positions.some(other => other.low)) mark(p.side, 'adjust');
      }
    }
    const adjust = Object.values(joints).includes('adjust'), moving = Object.keys(joints).length < 6;
    return { status: adjust ? 'adjust' : moving ? 'moving' : 'matched',
      message: adjust ? this.phase === 'unready' ? '先将双手放下' : this.phase === 'ready' ? '双手一起举到标定高度' : '双手一起放下复位'
        : moving ? '双臂动作过渡中' : bothLow ? '双手放下位置匹配' : '双手举起位置匹配', joints };
  }
}
