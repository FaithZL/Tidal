import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { WorkerRequest, WorkerResponse } from './types.js';

let landmarker: PoseLandmarker | null = null;
let epoch = 0;
let disposed = false;
const reply = (message: WorkerResponse): void => self.postMessage(message);
self.onmessage = async ({ data }: MessageEvent<WorkerRequest>): Promise<void> => {
  if (data.kind === 'dispose') {
    disposed = true; landmarker?.close(); landmarker = null;
    reply({ kind: 'disposed' }); return;
  }
  try {
    if (data.kind === 'init') {
      epoch = data.sourceEpoch;
      const modelUrl = new URL('models/pose_landmarker_lite.task', data.baseUrl).href;
      const response = await fetch(modelUrl);
      if (!response.ok) throw new Error(`模型资源加载失败（HTTP ${response.status}），请运行 npm run assets:sync`);
      const modelAssetBuffer = new Uint8Array(await response.arrayBuffer());
      const files = await FilesetResolver.forVisionTasks(new URL('mediapipe/wasm', data.baseUrl).href);
      const model = await PoseLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetBuffer, delegate: 'CPU' },
        runningMode: 'VIDEO', numPoses: 1,
        outputSegmentationMasks: false,
      });
      if (disposed) { model.close(); return; }
      landmarker = model;
      reply({ kind: 'ready', sourceEpoch: epoch });
    } else {
      try {
        if (!landmarker || disposed || data.sourceEpoch !== epoch) return;
        const start = performance.now();
        const result = landmarker.detectForVideo(data.bitmap, data.capturedAtMs);
        const landmarks = result.landmarks[0] ?? [];
        reply({ kind: 'frame', sourceEpoch: epoch, requestId: data.requestId, frame: {
          frameId: data.requestId, capturedAtMs: data.capturedAtMs, width: data.width, height: data.height,
          landmarks, valid: landmarks.length === 33 && landmarks.every(p => [p.x, p.y, p.z].every(Number.isFinite)),
          inferenceMs: performance.now() - start,
        } });
      } finally { data.bitmap.close(); }
    }
  } catch (error) {
    if (!disposed) reply({ kind: 'error', sourceEpoch: epoch, message: `模型/推理失败：${error instanceof Error ? error.message : String(error)}` });
  }
};
