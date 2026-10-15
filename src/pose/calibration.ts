import type { PoseFrame } from './types.js';
import { inspectPose, type PoseFeatures } from './features.js';
import { recognitionConfig, type RecognitionConfig } from '../config/recognitionConfig.js';
export type BodySide = 'left' | 'right';
export interface Calibration {
  readonly torsoScalePx: number;
  readonly standingKnee: Readonly<Partial<Record<BodySide, number>>>;
  readonly usableSides: readonly BodySide[];
  readonly primarySide: BodySide;
}
export type CalibrationResult = { ok: true; calibration: Calibration } | { ok: false; reason: string };
export function calibrate(samples: readonly PoseFrame[], config: RecognitionConfig = recognitionConfig, primarySide: BodySide = 'right'): CalibrationResult {
  if (samples.length < config.minStandingSamples) return { ok: false, reason: 'insufficient-samples' };
  const measured: PoseFeatures[] = [];
  for (let i = 0; i < samples.length; i++) {
    const frame = samples[i], previous = samples[i - 1], result = inspectPose(frame, config);
    if (!result.ok) return result;
    if (!result.features.sides[primarySide]) return { ok: false, reason: 'unusable-side' };
    if (previous && (frame.capturedAtMs <= previous.capturedAtMs || frame.frameId <= previous.frameId)) return { ok: false, reason: 'out-of-order' };
    if (previous && frame.capturedAtMs - previous.capturedAtMs > config.maxPoseGapMs) return { ok: false, reason: 'gap' };
    if (frame.width !== samples[0].width || frame.height !== samples[0].height) return { ok: false, reason: 'resized' };
    measured.push(result.features);
  }
  if (samples.at(-1)!.capturedAtMs - samples[0].capturedAtMs < config.standingDurationMs) return { ok: false, reason: 'insufficient-duration' };
  const scales = measured.map(f => f.torsoScalePx), meanScale = mean(scales), origin = measured[0].center;
  if (Math.max(...scales) / Math.min(...scales) > config.stableScaleRatio ||
      measured.some(f => Math.hypot(f.center.x - origin.x, f.center.y - origin.y) / meanScale > config.stableCenterTorso)) return { ok: false, reason: 'unstable' };
  const standingKnee: Partial<Record<BodySide, number>> = {}, usableSides: BodySide[] = [];
  for (const side of ['left', 'right'] as const) {
    if (!measured.every(f => f.sides[side])) continue;
    const knees = measured.map(f => f.sides[side]!.kneeDeg);
    if (Math.max(...knees) - Math.min(...knees) > config.stableKneeSpreadDeg) return { ok: false, reason: 'unstable' };
    standingKnee[side] = mean(knees);usableSides.push(side);
  }
  return { ok: true, calibration: Object.freeze({ torsoScalePx: meanScale, standingKnee: Object.freeze(standingKnee),
    usableSides: Object.freeze(usableSides), primarySide }) };
}
export const mean = (values: readonly number[]): number => values.reduce((sum, value) => sum + value, 0) / values.length;
