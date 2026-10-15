import type { PoseFrame } from './types.js';
import { calibrate, mean, type Calibration, type BodySide } from './calibration.js';
import { extractFeatures, inspectPose, type PoseFeatures } from './features.js';
import { PoseSmoother } from './smoothing.js';
import { recognitionConfig, type RecognitionConfig } from '../config/recognitionConfig.js';
export const calibrationSteps = ['standing', 'chop-raised', 'chop-down', 'load-squat', 'load-stand', 'load-press', 'load-return', 'carry-hold', 'carry-release'] as const;
export type CalibrationStep = typeof calibrationSteps[number];
export interface CalibrationExample {
  wrist: { x: number; y: number }; elbowDeg: number; kneeDeg: number; hipHeight: number; radius: number;
}
export interface CalibrationSnapshot {
  step: CalibrationStep | null; primarySide: BodySide; capturing: boolean; progress: number; complete: boolean;
  calibration: Calibration | null; features: PoseFeatures | null; reason: string | null; available: boolean;
  readyFor: Readonly<{ chop: boolean; load: boolean; carry: boolean }>;
  examples: Partial<Record<CalibrationStep, CalibrationExample>>;
}
interface Prototype { values: readonly number[]; radius: number }
const vectorDistance = (a: readonly number[], b: readonly number[]) => Math.hypot(...a.map((v, i) => v - b[i]));
function vector(f: PoseFeatures, side: BodySide): number[] {
  const s = f.sides[side]!;return [s.wrist.x, s.wrist.y, s.elbowDeg / 180, s.kneeDeg / 180, f.hipHeight];
}
/** Preparation only: no ExerciseSignal, domain controller, storage or device access. */
export class CalibrationSession {
  private readonly smoother: PoseSmoother;
  private primarySide: BodySide = 'right';
  private stepIndex = 0;
  private capturing = false;
  private samples: PoseFrame[] = [];
  private progress = 0;
  private calibration: Calibration | null = null;
  private features: PoseFeatures | null = null;
  private reason: string | null = null;
  private prototypes: Partial<Record<CalibrationStep, Prototype>> = {};
  private lastSeen: { time: number; id: number } | null = null;
  constructor(private readonly config: RecognitionConfig = recognitionConfig) { this.smoother = new PoseSmoother(config); }
  ingest(frame: PoseFrame, nowMs: number): void {
    if (!Number.isFinite(nowMs) || nowMs < 0 || !Number.isFinite(frame.capturedAtMs) || frame.capturedAtMs < 0) { this.invalidate('invalid-data');return; }
    if (frame.capturedAtMs - nowMs > this.config.futureToleranceMs) { this.invalidate('future');return; }
    if (nowMs - frame.capturedAtMs > this.config.trackingMaxAgeMs) { this.invalidate('stale');return; }
    if (this.lastSeen && (frame.capturedAtMs <= this.lastSeen.time || frame.frameId <= this.lastSeen.id)) { this.invalidate('out-of-order');return; }
    const result = this.smoother.update(frame);
    if (Number.isSafeInteger(frame.frameId)) this.lastSeen = { time: frame.capturedAtMs, id: frame.frameId };
    if (result.discontinuity) this.invalidate(result.reason ?? 'invalid-data');
    if (!result.frame) return;
    const measured = inspectPose(frame, this.config);
    if (!measured.ok || !measured.features.sides[this.primarySide]) { this.invalidate(measured.ok ? 'unusable-side' : measured.reason);return; }
    const display = inspectPose(result.frame, this.config);
    this.features = this.calibration ? extractFeatures(result.frame, this.calibration, this.config) : display.ok ? display.features : null;
    if (!this.features?.sides[this.primarySide]) { this.invalidate('unusable-side');return; }
    if (!this.capturing) return;
    this.samples.push(frame);
    const step = calibrationSteps[this.stepIndex];
    const duration = step === 'standing' ? this.config.standingDurationMs : step.startsWith('carry') ? this.config.carryDurationMs : this.config.exampleDurationMs;
    this.progress = Math.min(1, (frame.capturedAtMs - this.samples[0].capturedAtMs) / duration);
    if (this.progress < 1) return;
    this.finishCapture(step);
  }
  tick(nowMs: number): void {
    if (this.features && (!Number.isFinite(nowMs) || nowMs - this.features.capturedAtMs > this.config.trackingMaxAgeMs)) this.invalidate('stale');
  }
  beginCapture(): boolean {
    if (!this.features || this.capturing || this.stepIndex >= calibrationSteps.length) return false;
    this.samples = [];this.progress = 0;this.reason = null;this.capturing = true;return true;
  }
  setPrimarySide(side: BodySide): void { if (side !== this.primarySide) { this.primarySide = side;this.reset(); } }
  reset(): void { this.invalidate(null);this.lastSeen = null; }
  private invalidate(reason: string | null): void {
    this.stepIndex = 0;this.capturing = false;this.samples = [];this.progress = 0;
    this.calibration = null;this.prototypes = {};this.features = null;this.reason = reason;this.smoother.reset();
  }
  private finishCapture(step: CalibrationStep): void {
    this.capturing = false;
    if (step === 'standing') {
      const result = calibrate(this.samples, this.config, this.primarySide);
      if (result.ok) this.calibration = result.calibration;
      else this.reason = result.reason;
    } else if (this.calibration) {
      const features = this.samples.map(f => extractFeatures(f, this.calibration!, this.config));
      if (features.some(f => f === null)) this.reason = 'unusable-side';
      else {
        const vectors = features.map(f => vector(f!, this.primarySide));
        const values = vectors[0].map((_, i) => mean(vectors.map(v => v[i])));
        const radius = Math.max(...vectors.map(v => vectorDistance(v, values)));
        const prototype = { values, radius };
        this.reason = radius > this.config.stableFeatureRadius ? 'unstable' : this.checkExample(step, prototype);
        if (!this.reason) this.prototypes[step] = prototype;
      }
    }
    if (!this.reason) this.stepIndex++;
    this.samples = [];this.progress = 0;
  }
  private checkExample(step: CalibrationStep, sample: Prototype): string | null {
    const p = this.prototypes, c = this.config, natural = this.calibration!.standingKnee[this.primarySide]!;
    const knee = sample.values[3] * 180, wristY = sample.values[1];
    if (step === 'chop-down' && wristY - p['chop-raised']!.values[1] < c.minChopTravelTorso) return 'insufficient-chop-range';
    if (step === 'load-squat' && natural - knee < c.minSquatFlexionDeg) return 'insufficient-squat-range';
    if ((step === 'load-stand' || step === 'load-return') && Math.abs(knee - natural) > c.standToleranceDeg) return 'not-returned';
    if (step === 'load-press' && p['load-stand']!.values[1] - wristY < c.minPressTravelTorso) return 'insufficient-press-range';
    if (step === 'load-return' && Math.hypot(sample.values[0] - p['load-stand']!.values[0], wristY - p['load-stand']!.values[1]) > c.returnWristTolerance) return 'not-returned';
    if (step === 'carry-release') {
      const hold = p['carry-hold']!;
      if (vectorDistance(sample.values, hold.values) <= Math.max(c.minCarrySeparation, c.minPoseSeparation * Math.sqrt(sample.values.length), c.carryNoiseMultiplier * (sample.radius + hold.radius))) return 'carry-not-separable';
    }
    return null;
  }
  getSnapshot(): CalibrationSnapshot {
    const ready = this.features !== null && this.calibration !== null, p = this.prototypes;
    const examples: CalibrationSnapshot['examples'] = {};
    for (const step of calibrationSteps) {
      const sample = p[step];
      if (sample) examples[step] = { wrist: { x: sample.values[0], y: sample.values[1] },
        elbowDeg: sample.values[2] * 180, kneeDeg: sample.values[3] * 180, hipHeight: sample.values[4], radius: sample.radius };
    }
    return { step: calibrationSteps[this.stepIndex] ?? null, primarySide: this.primarySide, capturing: this.capturing,
      progress: this.progress, complete: this.stepIndex === calibrationSteps.length, calibration: this.calibration,
      features: this.features ? structuredClone(this.features) : null, reason: this.reason, available: this.features !== null,
      examples, readyFor: { chop: ready && !!p['chop-down'], load: ready && !!p['load-return'], carry: ready && !!p['carry-release'] } };
  }
}
