import type { PoseFrame, WorkerRequest, WorkerResponse } from './types.js';
export interface WorkerPort {
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: WorkerRequest, transfer?: Transferable[]): void;
  terminate(): void;
}
export class PoseWorkerClient {
  private worker: WorkerPort | null = null;
  private epoch = 0;
  private nextId = 0;
  private pending: { id: number; capturedAtMs: number } | null = null;
  private ready = false;
  private rejectStart: ((error: Error) => void) | null = null;
  private initTimer: ReturnType<typeof setTimeout> | undefined;
  private frameTimer: ReturnType<typeof setTimeout> | undefined;
  constructor(
    private readonly factory: () => WorkerPort = () => new Worker(new URL('worker/pose.js', this.baseUrl)),
    private readonly bitmap = (video: HTMLVideoElement) => createImageBitmap(video),
    private readonly baseUrl = new URL(import.meta.env.BASE_URL, location.href).href,
  ) {}
  async start(onFrame: (frame: PoseFrame) => void, onError: (message: string) => void = () => {}): Promise<void> {
    const stopping = this.stop();
    const epoch = this.epoch;
    await stopping;
    if (epoch !== this.epoch) throw new DOMException('Cancelled', 'AbortError');
    const worker = this.factory(); this.worker = worker;
    return new Promise<void>((resolve, reject) => {
      this.rejectStart = reject;
      const fail = (message: string): void => {
        if (epoch !== this.epoch) return;
        reject(new Error(message)); this.rejectStart = null;
        void this.stop(); onError(message);
      };
      this.initTimer = setTimeout(() => fail('模型初始化超时（30 秒），请重试'), 30_000);
      worker.onerror = () => fail('推理 Worker 失败，请重试或选择键盘演示');
      worker.onmessage = ({ data }) => {
        if (epoch !== this.epoch || data.kind === 'disposed' || data.sourceEpoch !== epoch) return;
        if (data.kind === 'ready') {
          clearTimeout(this.initTimer); this.ready = true; this.rejectStart = null; resolve();
        } else if (data.kind === 'error') fail(data.message);
        else if (data.kind === 'frame' && this.pending?.id === data.requestId && data.frame.capturedAtMs === this.pending.capturedAtMs) {
          clearTimeout(this.frameTimer); this.pending = null; onFrame(data.frame);
        }
      };
      worker.postMessage({ kind: 'init', sourceEpoch: epoch, baseUrl: this.baseUrl });
    });
  }
  submit(video: HTMLVideoElement, capturedAtMs: number): void {
    const worker = this.worker, epoch = this.epoch;
    if (!worker || !this.ready || this.pending || video.readyState < 2 || !Number.isFinite(capturedAtMs)) return;
    const requestId = ++this.nextId;
    this.pending = { id: requestId, capturedAtMs };
    this.frameTimer = setTimeout(() => {
      if (epoch === this.epoch) worker.onmessage?.({ data: { kind: 'error', sourceEpoch: epoch, message: '推理超时，请重试' } } as MessageEvent<WorkerResponse>);
    }, 10_000);
    void this.bitmap(video).then(bitmap => {
      if (epoch !== this.epoch) { bitmap.close(); return; }
      try {
        worker.postMessage({ kind: 'frame', sourceEpoch: epoch, requestId, capturedAtMs,
          width: video.videoWidth, height: video.videoHeight, bitmap }, [bitmap]);
      } catch (error) {
        bitmap.close(); throw error;
      }
    }).catch(error => {
      if (epoch === this.epoch) worker.onmessage?.({ data: { kind: 'error', sourceEpoch: epoch, message: `视频帧读取失败：${String(error)}` } } as MessageEvent<WorkerResponse>);
    });
  }
  async stop(): Promise<void> {
    this.epoch++; this.ready = false; this.pending = null;
    clearTimeout(this.initTimer); clearTimeout(this.frameTimer);
    this.rejectStart?.(new DOMException('Cancelled', 'AbortError')); this.rejectStart = null;
    const worker = this.worker; this.worker = null;
    if (!worker) return;
    await new Promise<void>(resolve => {
      let done = false;
      const finish = (): void => {
        if (done) return; done = true; clearTimeout(timer);
        worker.onmessage = null; worker.onerror = null; worker.terminate(); resolve();
      };
      const timer = setTimeout(finish, 300);
      worker.onmessage = ({ data }) => { if (data.kind === 'disposed') finish(); };
      worker.onerror = finish;
      worker.postMessage({ kind: 'dispose' });
    });
  }
}
