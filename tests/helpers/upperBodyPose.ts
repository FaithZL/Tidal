import type { PoseFrame } from '../../src/pose/types.js';
import type { UpperBodyProfile, UpperBodyVector } from '../../src/pose/upperBody.js';

export type UpperPose = 'lowered' | 'raised' | 'hold';
const points: Record<UpperPose, readonly (readonly [number, number])[]> = {
  lowered: [[230, 150], [410, 150], [230, 235], [410, 235], [230, 320], [410, 320]],
  raised: [[230, 150], [410, 150], [220, 90], [420, 90], [210, 30], [430, 30]],
  hold: [[230, 150], [410, 150], [220, 195], [420, 195], [220, 140], [420, 140]],
};
/** Authored upper-body points. Head/hips/legs are deliberately unavailable, not inferred. */
export function upperFrame(time = 0, pose: UpperPose = 'lowered'): PoseFrame {
  const landmarks = Array.from({ length: 33 }, (_, index) => {
    const point = points[pose][index - 11];
    return point ? { x: point[0] / 640, y: point[1] / 480, z: 0, visibility: .99, presence: .99 }
      : { x: NaN, y: NaN, z: NaN, visibility: 0, presence: 0 };
  });
  return { frameId: Math.round(time) + 1, capturedAtMs: time, width: 640, height: 480, landmarks, valid: true, inferenceMs: 0 };
}
export function upperProgress(time: number, left: number, right = left): PoseFrame {
  const frame = upperFrame(time), raised = upperFrame(time, 'raised');
  return { ...frame, landmarks: frame.landmarks.map((point, index) => {
    if (index < 11 || index > 16) return point;
    const ratio = index % 2 ? left : right, target = raised.landmarks[index];
    return { ...point, x: point.x + ratio * (target.x - point.x), y: point.y + ratio * (target.y - point.y) };
  }) };
}
export function upperProfile(): UpperBodyProfile {
  const vector = (pose: UpperPose): UpperBodyVector => {
    const p = points[pose];
    const side = (offset: number) => {
      const shoulder = p[offset], elbow = p[offset + 2], wrist = p[offset + 4];
      const a = [shoulder[0] - elbow[0], shoulder[1] - elbow[1]], b = [wrist[0] - elbow[0], wrist[1] - elbow[1]];
      const elbowDeg = Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1]) /
        (Math.hypot(...a) * Math.hypot(...b))))) * 180 / Math.PI;
      return { x: (wrist[0] - shoulder[0]) / 180, y: (wrist[1] - shoulder[1]) / 180, elbowDeg };
    };
    return { left: side(0), right: side(1) };
  };
  return { lowered: vector('lowered'), raised: vector('raised'), hold: vector('hold'),
    reference: { width: 640, height: 480, center: { x: 320, y: 150 }, scalePx: 180 } };
}
