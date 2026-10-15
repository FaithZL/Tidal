import type { Landmark, PoseFrame } from './types.js';
import type { Calibration, BodySide } from './calibration.js';
import { recognitionConfig, type RecognitionConfig } from '../config/recognitionConfig.js';
export interface SideFeatures { elbowDeg: number; kneeDeg: number; kneeFlexionDeg: number | null; wrist: { x: number; y: number }; confidence: number }
export interface PoseFeatures {
  frameId: number; capturedAtMs: number; torsoScalePx: number; center: { x: number; y: number }; hipHeight: number;
  sides: Record<BodySide, SideFeatures | null>;
}
export type PoseInspection = { ok: true; features: PoseFeatures } | { ok: false; reason: string };
type Point = { x: number; y: number };
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export function landmarkConfidence(point: Landmark | undefined): number {
  const values = [point?.visibility ?? 0, point?.presence ?? 1];
  return values.every(v => Number.isFinite(v) && v >= 0 && v <= 1) ? Math.min(...values) : 0;
}
function angle(a: Point, b: Point, c: Point): number | null {
  const ab = distance(a, b), cb = distance(c, b);
  if (ab < 1e-6 || cb < 1e-6) return null;
  const cosine = ((a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y)) / (ab * cb);
  return Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI;
}
export function inspectPose(frame: PoseFrame, config: RecognitionConfig = recognitionConfig): PoseInspection {
  if (!frame.valid || frame.landmarks.length !== 33) return { ok: false, reason: 'missing-points' };
  if (!Number.isSafeInteger(frame.frameId) || frame.frameId < 0 || !Number.isFinite(frame.capturedAtMs) || frame.capturedAtMs < 0 ||
      !Number.isFinite(frame.width) || !Number.isFinite(frame.height) || frame.width <= 0 || frame.height <= 0 ||
      !frame.landmarks.every(p => p && [p.x, p.y, p.z].every(Number.isFinite))) return { ok: false, reason: 'invalid-data' };
  const confidence = (i: number) => landmarkConfidence(frame.landmarks[i]);
  const usable = (i: number) => Number.isFinite(confidence(i)) && confidence(i) >= config.minConfidence;
  const inside = (i: number) => {
    const p = frame.landmarks[i], m = config.framingMargin;
    return p && p.x >= m && p.x <= 1 - m && p.y >= m && p.y <= 1 - m;
  };
  const core = [0, 11, 12, 23, 24, 27, 28];
  if (!core.every(usable)) return { ok: false, reason: 'low-confidence' };
  if (!core.every(inside)) return { ok: false, reason: 'out-of-frame' };
  const pixels = frame.landmarks.map(p => ({ x: p.x * frame.width, y: p.y * frame.height }));
  const midpoint = (a: number, b: number): Point => ({ x: (pixels[a].x + pixels[b].x) / 2, y: (pixels[a].y + pixels[b].y) / 2 });
  const shoulder = midpoint(11, 12), hip = midpoint(23, 24), ankle = midpoint(27, 28);
  const scale = distance(shoulder, hip);
  if (scale < frame.height * config.minTorsoHeightFraction) return { ok: false, reason: 'small-torso' };
  const side = (indices: number[]): SideFeatures | null => {
    if (!indices.every(usable) || !indices.every(inside)) return null;
    const [s, e, w, h, k, a] = indices;
    const elbowDeg = angle(pixels[s], pixels[e], pixels[w]), kneeDeg = angle(pixels[h], pixels[k], pixels[a]);
    if (elbowDeg === null || kneeDeg === null) return null;
    return { elbowDeg, kneeDeg, kneeFlexionDeg: null, wrist: { x: (pixels[w].x - hip.x) / scale, y: (pixels[w].y - hip.y) / scale },
      confidence: Math.min(...indices.map(confidence)) };
  };
  const sides = { left: side([11, 13, 15, 23, 25, 27]), right: side([12, 14, 16, 24, 26, 28]) };
  if (!sides.left && !sides.right) return { ok: false, reason: 'unusable-side' };
  return { ok: true, features: { frameId: frame.frameId, capturedAtMs: frame.capturedAtMs, torsoScalePx: scale,
    center: hip, hipHeight: (ankle.y - hip.y) / scale, sides } };
}
export function extractFeatures(frame: PoseFrame, calibration: Calibration, config: RecognitionConfig = recognitionConfig): PoseFeatures | null {
  const inspected = inspectPose(frame, config);
  if (!inspected.ok || !inspected.features.sides[calibration.primarySide] ||
      !Number.isFinite(calibration.standingKnee[calibration.primarySide])) return null;
  for (const side of ['left', 'right'] as const) {
    const features = inspected.features.sides[side], natural = calibration.standingKnee[side];
    if (features && natural !== undefined && Number.isFinite(natural)) features.kneeFlexionDeg = natural - features.kneeDeg;
  }
  return inspected.features;
}
