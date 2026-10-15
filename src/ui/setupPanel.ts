import { CameraService } from '../pose/cameraService.js';
import { PoseWorkerClient } from '../pose/poseWorkerClient.js';
import type { PoseFrame } from '../pose/types.js';
import type { CalibrationPanel } from './calibrationPanel.js';

const links = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];
export class SetupPanel {
  private readonly camera: CameraService;
  private readonly client = new PoseWorkerClient();
  private epoch = 0;
  private timer: ReturnType<typeof setInterval> | undefined;
  private slowTimer: ReturnType<typeof setTimeout> | undefined;
  private timeout: ReturnType<typeof setTimeout> | undefined;
  private lastVideoTime = -1;
  private frameCount = 0;
  private sampleStart = 0;
  private timings: number[] = [];
  private readonly suspendCalibration = (): void => { this.calibration.reset(); };
  constructor(video: HTMLVideoElement, private readonly overlay: HTMLCanvasElement,
    private readonly status: HTMLElement, private readonly metrics: HTMLElement, private readonly frames: HTMLElement,
    private readonly startButton: HTMLButtonElement, private readonly calibration: CalibrationPanel) {
    this.camera = new CameraService(video);
    document.addEventListener('visibilitychange', this.suspendCalibration);
    window.addEventListener('blur', this.suspendCalibration);
  }
  async start(): Promise<void> {
    const stopping = this.stop();
    const epoch = this.epoch;
    await stopping;
    if (epoch !== this.epoch) return;
    this.calibration.activate();
    this.startButton.disabled = true;
    this.status.textContent = '正在请求摄像头权限（仅视频）…';
    this.slowTimer = setTimeout(() => { if (epoch === this.epoch) this.status.textContent = '摄像头/模型加载较慢，可取消或重试'; }, 10_000);
    this.timeout = setTimeout(() => { if (epoch === this.epoch) this.fail('初始化超时（30 秒），请重试或选择键盘演示'); }, 30_000);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('浏览器不支持摄像头：请使用 localhost 或 HTTPS');
      const video = await this.camera.start();
      if (epoch !== this.epoch) return;
      (video.srcObject as MediaStream).getTracks().forEach(track => {
        track.addEventListener('ended', () => { if (epoch === this.epoch) this.fail('摄像头已断开，请重试'); }, { once: true });
      });
      this.status.textContent = '摄像头已打开，正在加载本地模型与 WASM…';
      await this.client.start(frame => { if (epoch === this.epoch && !document.hidden) this.draw(frame); }, message => {
        if (epoch === this.epoch) this.fail(message);
      });
      if (epoch !== this.epoch) return;
      clearTimeout(this.slowTimer); clearTimeout(this.timeout);
      this.status.textContent = '推理中 · Worker / CPU · 仅关键点诊断，尚未接入运动识别';
      this.sampleStart = performance.now();
      this.timer = setInterval(() => {
        this.calibration.tick(performance.now());
        if (document.hidden || video.currentTime === this.lastVideoTime) return;
        this.lastVideoTime = video.currentTime;
        this.client.submit(video, performance.now());
      }, 1000 / 15);
    } catch (error) {
      if (epoch !== this.epoch) return;
      const name = error instanceof Error ? error.name : '';
      const messages: Record<string, string> = {
        NotAllowedError: '摄像头权限被拒绝，请在浏览器允许视频权限后重试',
        NotFoundError: '未找到摄像头，请连接设备后重试',
        NotReadableError: '摄像头被占用或无法读取，请关闭其他占用程序后重试',
        NotSupportedError: '当前浏览器或摄像头设备不支持视频读取，请换用桌面 Chrome/Edge 或检查设备后重试',
      };
      this.fail(messages[name] ?? (error instanceof Error ? error.message : String(error)));
    }
  }
  private fail(message: string): void {
    void this.stop(); this.status.textContent = message;
  }
  private draw(frame: PoseFrame): void {
    this.calibration.accept(frame);
    this.frames.textContent = String(++this.frameCount);
    this.timings.push(frame.inferenceMs); if (this.timings.length > 120) this.timings.shift();
    const times = [...this.timings].sort((a, b) => a - b);
    const p50 = times[Math.floor((times.length - 1) * .5)];
    const p95 = times[Math.floor((times.length - 1) * .95)];
    const hz = this.frameCount * 1000 / Math.max(1, performance.now() - this.sampleStart);
    this.metrics.textContent = `${frame.width}×${frame.height} · ${frame.landmarks.length} 个关键点 · ${hz.toFixed(1)} Hz · 推理 p50/p95 ${p50.toFixed(0)}/${p95.toFixed(0)}ms · 样本年龄 ${(performance.now() - frame.capturedAtMs).toFixed(0)}ms · ${frame.valid ? '人体关键点可用' : '未检测到人体'}`;
    this.overlay.width = frame.width; this.overlay.height = frame.height;
    const ctx = this.overlay.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, frame.width, frame.height);
    ctx.strokeStyle = '#93ffb4'; ctx.fillStyle = '#ffe59b'; ctx.lineWidth = 3;
    const visible = (i: number) => (frame.landmarks[i]?.visibility ?? 0) >= .6;
    for (const [a, b] of links) {
      if (!visible(a) || !visible(b)) continue;
      const p = frame.landmarks[a], q = frame.landmarks[b];
      ctx.beginPath(); ctx.moveTo(p.x * frame.width, p.y * frame.height); ctx.lineTo(q.x * frame.width, q.y * frame.height); ctx.stroke();
    }
    frame.landmarks.forEach((p, i) => { if (visible(i)) { ctx.beginPath(); ctx.arc(p.x * frame.width, p.y * frame.height, 4, 0, Math.PI * 2); ctx.fill(); } });
  }
  async stop(): Promise<void> {
    this.epoch++; clearInterval(this.timer); clearTimeout(this.slowTimer); clearTimeout(this.timeout);
    this.camera.stop(); this.lastVideoTime = -1; this.frameCount = 0; this.timings = [];
    this.calibration.reset(true);
    this.frames.textContent = '0'; this.metrics.textContent = '';
    this.overlay.getContext('2d')?.clearRect(0, 0, this.overlay.width, this.overlay.height);
    this.startButton.disabled = false;
    this.status.textContent = '摄像头已关闭；点击开始诊断才请求视频权限';
    await this.client.stop();
  }
  async dispose(): Promise<void> {
    document.removeEventListener('visibilitychange', this.suspendCalibration);
    window.removeEventListener('blur', this.suspendCalibration);
    this.calibration.dispose();await this.stop();
  }
}
