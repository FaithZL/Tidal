import type { PoseFrame } from './types.js';
import { inspectPose, landmarkConfidence, type PoseFeatures } from './features.js';
import { recognitionConfig, type RecognitionConfig } from '../config/recognitionConfig.js';
export interface SmoothingResult { frame: PoseFrame | null; discontinuity: boolean; reason: string | null }
export class PoseSmoother {
  private previous: PoseFrame | null = null;
  private geometry: PoseFeatures | null = null;
  constructor(private readonly config: RecognitionConfig = recognitionConfig) {}
  update(frame: PoseFrame): SmoothingResult {
    const inspected = inspectPose(frame, this.config), previous = this.previous, old = this.geometry;
    if (!inspected.ok) { this.reset();return { frame: null, discontinuity: true, reason: inspected.reason }; }
    const fresh = inspected.features;
    if (previous && (frame.capturedAtMs <= previous.capturedAtMs || frame.frameId <= previous.frameId)) {
      this.reset();return { frame: null, discontinuity: true, reason: 'out-of-order' };
    }
    let reason: string | null = null;
    if (previous && old) {
      if (frame.width !== previous.width || frame.height !== previous.height) reason = 'resized';
      else if (frame.capturedAtMs - previous.capturedAtMs > this.config.maxPoseGapMs) reason = 'gap';
      else if (Math.hypot(fresh.center.x - old.center.x, fresh.center.y - old.center.y) / old.torsoScalePx > this.config.centerJumpTorso ||
        Math.max(fresh.torsoScalePx / old.torsoScalePx, old.torsoScalePx / fresh.torsoScalePx) > this.config.maxScaleRatio) reason = 'person-moved';
    }
    const alpha = previous ? 1 - Math.exp(-(frame.capturedAtMs - previous.capturedAtMs) / this.config.smoothingTauMs) : 1;
    const filtered = { ...frame, landmarks: frame.landmarks.map((point, i) => {
      const before = previous?.landmarks[i];
      if (reason || !before || Math.min(landmarkConfidence(point), landmarkConfidence(before)) < this.config.minConfidence) return { ...point };
      return { ...point, x: before.x + alpha * (point.x - before.x), y: before.y + alpha * (point.y - before.y), z: before.z + alpha * (point.z - before.z) };
    }) };
    this.previous = filtered;this.geometry = fresh;
    return { frame: filtered, discontinuity: reason !== null, reason };
  }
  reset(): void { this.previous = null;this.geometry = null; }
}
