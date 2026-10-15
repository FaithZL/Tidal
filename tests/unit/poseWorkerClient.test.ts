import { test, expect, vi } from 'vitest';
import { PoseWorkerClient, type WorkerPort } from '../../src/pose/poseWorkerClient.js';
import type { WorkerRequest, WorkerResponse } from '../../src/pose/types.js';

class Port implements WorkerPort {
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null;
  onerror: (() => void) | null = null;
  messages: WorkerRequest[] = [];
  terminated = 0;
  postMessage(message: WorkerRequest): void {
    this.messages.push(message);
    if (message.kind === 'init') queueMicrotask(() => this.reply({ kind: 'ready', sourceEpoch: message.sourceEpoch }));
    if (message.kind === 'dispose') queueMicrotask(() => this.reply({ kind: 'disposed' }));
  }
  terminate(): void { this.terminated++; }
  reply(message: WorkerResponse): void { this.onmessage?.({ data: message } as MessageEvent<WorkerResponse>); }
}
const video = { videoWidth: 640, videoHeight: 480, readyState: 4 } as HTMLVideoElement;

test('only one frame in flight, mismatched responses do not unlock it, stop discards late frames', async () => {
  const port = new Port(); const frames: unknown[] = [];
  const client = new PoseWorkerClient(() => port, async () => ({ close() {} }) as ImageBitmap, 'http://localhost/');
  await client.start(f => frames.push(f));
  client.submit(video, 100); client.submit(video, 101); await Promise.resolve();
  const request = port.messages.find(m => m.kind === 'frame');
  expect(request?.kind).toBe('frame'); if (request?.kind !== 'frame') return;
  const frame = { frameId: request.requestId, capturedAtMs: 100, width: 640, height: 480, landmarks: [], valid: false, inferenceMs: 5 };
  port.reply({ kind: 'frame', sourceEpoch: request.sourceEpoch, requestId: request.requestId + 1, frame });
  client.submit(video, 102); await Promise.resolve();
  expect(port.messages.filter(m => m.kind === 'frame')).toHaveLength(1);
  expect(frames).toHaveLength(0);
  port.reply({ kind: 'frame', sourceEpoch: request.sourceEpoch, requestId: request.requestId, frame });
  expect(frames).toHaveLength(1);
  await client.stop(); await client.stop();
  port.reply({ kind: 'frame', sourceEpoch: request.sourceEpoch, requestId: request.requestId, frame });
  expect(frames).toHaveLength(1); expect(port.terminated).toBe(1);
});

test('bitmap resolving after stop is closed and never transferred', async () => {
  const port = new Port(); const close = vi.fn();
  let deliver!: (bitmap: ImageBitmap) => void;
  const client = new PoseWorkerClient(() => port, () => new Promise(resolve => { deliver = resolve; }), 'http://localhost/');
  await client.start(() => {}); client.submit(video, 10); await client.stop();
  expect(deliver).toBeTypeOf('function');
  deliver({ close } as unknown as ImageBitmap); await Promise.resolve();
  expect(close).toHaveBeenCalledTimes(1);
  expect(port.messages.filter(m => m.kind === 'frame')).toHaveLength(0);
});

test('stop racing start cannot create a new worker after cancellation', async () => {
  const factory=vi.fn(()=>new Port());
  const client=new PoseWorkerClient(factory, async()=>({close(){}}) as ImageBitmap,'http://localhost/');
  const pending=client.start(()=>{}).catch(error=>error);
  await client.stop();await pending;
  expect(factory).not.toHaveBeenCalled();
  await client.stop();
});
