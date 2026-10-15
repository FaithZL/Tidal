export interface Landmark { x: number; y: number; z: number; visibility?: number; presence?: number }
export interface PoseFrame {
  frameId: number; capturedAtMs: number; width: number; height: number;
  landmarks: readonly Landmark[]; valid: boolean; inferenceMs: number;
}
export type WorkerRequest =
  | { kind: 'init'; sourceEpoch: number; baseUrl: string }
  | { kind: 'frame'; sourceEpoch: number; requestId: number; capturedAtMs: number; width: number; height: number; bitmap: ImageBitmap }
  | { kind: 'dispose' };
export type WorkerResponse =
  | { kind: 'ready'; sourceEpoch: number }
  | { kind: 'frame'; sourceEpoch: number; requestId: number; frame: PoseFrame }
  | { kind: 'error'; sourceEpoch: number; message: string }
  | { kind: 'disposed' };
