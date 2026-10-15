import data from '../fixtures/poses.synthetic.json' with { type: 'json' };
import type { PoseFrame, Landmark } from '../../src/pose/types.js';
export type SyntheticPose = keyof typeof data.poses;
export const fixtureMetadata = { source: data.source, description: data.description } as const;
export function syntheticFrame(time = 0, pose: SyntheticPose = 'standing', width = 640, height = 480): PoseFrame {
  const overrides: Record<string, number[]> = data.poses[pose];
  const landmarks = data.standing.map((point, index) => {
    const [x, y] = overrides[String(index)] ?? point;
    return { x: x / width, y: y / height, z: 0, visibility: .99, presence: .99 };
  });
  return { frameId: Math.round(time) + 1, capturedAtMs: time, width, height, landmarks, valid: true, inferenceMs: 0 };
}
export function replacePoint(frame: PoseFrame, index: number, change: Partial<Landmark>): PoseFrame {
  return { ...frame, landmarks: frame.landmarks.map((p, i) => i === index ? { ...p, ...change } : { ...p }) };
}
export const standingFrames = (start = 0, duration = 2000) => Array.from({ length: duration / 100 + 1 }, (_, i) => syntheticFrame(start + i * 100));
