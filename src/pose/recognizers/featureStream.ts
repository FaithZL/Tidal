import type { PoseFrame } from '../types.js';
import { extractFeatures, type PoseFeatures } from '../features.js';
import { PoseSmoother } from '../smoothing.js';
import type { Calibration } from '../calibration.js';
import { recognitionConfig, type RecognitionConfig } from '../../config/recognitionConfig.js';
/** Stateful observation boundary. An invalid observation never bridges two valid ones. */
export class FeatureStream {
  private readonly smoother: PoseSmoother;
  private last: { time: number; id: number } | null = null;
  reason: string | null = null;
  constructor(private readonly calibration: Calibration, private readonly config: RecognitionConfig = recognitionConfig) { this.smoother = new PoseSmoother(config); }
  read(frame: PoseFrame, nowMs: number): PoseFeatures | null {
    const fail = (reason: string) => { this.reason = reason;this.smoother.reset();return null; };
    if (!Number.isFinite(nowMs) || nowMs < 0 || !Number.isFinite(frame.capturedAtMs) || frame.capturedAtMs < 0) return fail('invalid-time');
    if (nowMs - frame.capturedAtMs > this.config.trackingMaxAgeMs) return fail('stale');
    if (frame.capturedAtMs - nowMs > this.config.futureToleranceMs) return fail('future');
    if (this.last && (frame.capturedAtMs <= this.last.time || frame.frameId <= this.last.id)) return fail('out-of-order');
    const gap = this.last && frame.capturedAtMs - this.last.time > this.config.maxPoseGapMs;
    if (Number.isSafeInteger(frame.frameId) && frame.frameId >= 0) this.last = { time: frame.capturedAtMs, id: frame.frameId };
    if (gap) return fail('gap');
    const smoothed = this.smoother.update(frame);
    if (!smoothed.frame || smoothed.discontinuity) return fail(smoothed.reason ?? 'invalid-pose');
    const features = extractFeatures(smoothed.frame, this.calibration, this.config);
    // Check the raw frame as well; filtering must not mask a missing/degenerate required joint.
    if (!features || !extractFeatures(frame, this.calibration, this.config)) return fail('invalid-pose');
    this.reason = null;return features;
  }
  reset(): void { this.last = null;this.reason = null;this.smoother.reset(); }
}
