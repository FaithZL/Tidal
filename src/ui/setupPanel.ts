import { CameraService } from '../pose/cameraService.js';
import { PoseWorkerClient } from '../pose/poseWorkerClient.js';
import type { PoseFrame } from '../pose/types.js';
import type { CalibrationPanel } from './calibrationPanel.js';
import type { RecognitionFeedback } from '../pose/recognitionFeedback.js';

const links = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];
const upperBodyIndices = new Set([11, 12, 13, 14, 15, 16]);
const upperBodyLinks = links.filter(([a, b]) => upperBodyIndices.has(a) && upperBodyIndices.has(b));
const feedbackColors = { matched: '#77e3a0', adjust: '#ff6b69', moving: '#9baeb4', unavailable: '#9baeb4' };
interface SetupEvents { onFrame?:(frame:PoseFrame)=>void; onError?:(message:string)=>void; onSuspend?:(reason?:string)=>void; onStop?:()=>void }
type SetupCalibration = Pick<CalibrationPanel,'activate'|'accept'|'tick'|'dispose'> & { reset(close?: boolean, reason?: string): void };
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
  private trackEvents: AbortController | null = null;
  private feedback: RecognitionFeedback | null = null;
  private upperBodyEnabled = false;
  private readonly suspendCalibration = (event: Event): void => {
    const reason = event.type === 'blur' ? 'window-blur' : document.hidden ? 'page-hidden' : 'page-visible';
    this.setFeedback(null);this.calibration.reset(false, reason);this.events.onSuspend?.(reason);
  };
  constructor(video: HTMLVideoElement, private readonly overlay: HTMLCanvasElement,
    private readonly status: HTMLElement, private readonly metrics: HTMLElement, private readonly frames: HTMLElement,
    private readonly startButton: HTMLButtonElement, private readonly calibration: SetupCalibration,private readonly events:SetupEvents={}) {
    this.camera = new CameraService(video);
    document.addEventListener('visibilitychange', this.suspendCalibration);
    window.addEventListener('blur', this.suspendCalibration);
    this.setFeedback(null);
  }
  setUpperBodyEnabled(enabled: boolean): void {
    if (this.upperBodyEnabled === enabled) return;
    this.upperBodyEnabled = enabled;this.setFeedback(null);
  }
  setFeedback(feedback: RecognitionFeedback | null): void {
    this.feedback = feedback ? { ...feedback, joints: { ...feedback.joints } } : null;
    const state = feedback?.status ?? 'unavailable';
    if (this.overlay.parentElement) this.overlay.parentElement.dataset.feedback = state;
    const label = document.getElementById('cameraFeedbackStatus');
    if (label) { label.textContent = feedback?.message ?? '暂无法判断';label.style.color = feedbackColors[state]; }
    // Loss may be detected by the source clock without another camera frame.
    if (!feedback) this.overlay.getContext('2d')?.clearRect(0, 0, this.overlay.width, this.overlay.height);
  }
  async start(): Promise<void> {
    const stopping = this.stop('camera-restart');
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
      this.trackEvents = new AbortController();
      (video.srcObject as MediaStream).getTracks().forEach(track => {
        track.addEventListener('ended', () => { if (epoch === this.epoch) this.fail('摄像头已断开，请重试'); }, { once: true, signal: this.trackEvents!.signal });
      });
      this.status.textContent = '摄像头已打开，正在加载本地模型与 WASM…';
      await this.client.start(frame => { if (epoch === this.epoch && !document.hidden) this.draw(frame); }, message => {
        if (epoch === this.epoch) this.fail(message);
      });
      if (epoch !== this.epoch) return;
      clearTimeout(this.slowTimer); clearTimeout(this.timeout);
      this.status.textContent = '推理中 · Worker / CPU · 完成标定后可选择姿态代理训练';
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
    void this.stop(); this.status.textContent = message;this.events.onError?.(message);
  }
  private draw(frame: PoseFrame): void {
    this.calibration.accept(frame);
    this.events.onFrame?.(frame);
    const indices = this.upperBodyEnabled ? [...upperBodyIndices] : Array.from({ length: frame.landmarks.length }, (_, index) => index);
    const valid = frame.valid && Number.isSafeInteger(frame.frameId) && frame.frameId >= 0 &&
      Number.isFinite(frame.capturedAtMs) && frame.capturedAtMs >= 0 &&
      [frame.width, frame.height].every(value => Number.isFinite(value) && value > 0) && (this.upperBodyEnabled || frame.landmarks.length === 33) &&
      indices.every(index => {
        const point = frame.landmarks[index];
        return point && [point.x, point.y, point.z].every(Number.isFinite) &&
          [point.visibility, point.presence].every(value => value === undefined || Number.isFinite(value) && value >= 0 && value <= 1) &&
          (!this.upperBodyEnabled || (point.visibility ?? 0) >= .6 && (point.presence ?? 1) >= .6);
      });
    if (!valid && this.feedback) this.setFeedback(null);
    this.frames.textContent = String(++this.frameCount);
    this.timings.push(frame.inferenceMs); if (this.timings.length > 120) this.timings.shift();
    const times = [...this.timings].sort((a, b) => a - b);
    const p50 = times[Math.floor((times.length - 1) * .5)];
    const p95 = times[Math.floor((times.length - 1) * .95)];
    const hz = this.frameCount * 1000 / Math.max(1, performance.now() - this.sampleStart);
    this.metrics.textContent = `${frame.width}×${frame.height} · ${frame.landmarks.length} 个关键点 · ${hz.toFixed(1)} Hz · 推理 p50/p95 ${p50.toFixed(0)}/${p95.toFixed(0)}ms · 样本年龄 ${(performance.now() - frame.capturedAtMs).toFixed(0)}ms · ${frame.valid ? '人体关键点可用' : '未检测到人体'}`;
    if (![frame.width, frame.height].every(value => Number.isFinite(value) && value > 0)) return;
    this.overlay.width = frame.width; this.overlay.height = frame.height;
    const ctx = this.overlay.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, frame.width, frame.height);
    ctx.lineWidth = 3;
    const visible = (i: number) => {
      const point = frame.landmarks[i];
      return (!this.upperBodyEnabled || upperBodyIndices.has(i)) && point &&
        (this.upperBodyEnabled ? [point.x, point.y, point.z] : [point.x, point.y]).every(Number.isFinite) &&
        (point.visibility ?? 0) >= .6 && (!this.upperBodyEnabled || (point.presence ?? 1) >= .6);
    };
    const joint = (index: number) => this.feedback?.joints[index];
    for (const [a, b] of this.upperBodyEnabled ? upperBodyLinks : links) {
      if (!visible(a) || !visible(b)) continue;
      const p = frame.landmarks[a], q = frame.landmarks[b];
      const first = joint(a), second = joint(b);
      ctx.strokeStyle = feedbackColors[first === 'adjust' || second === 'adjust' ? 'adjust' : first === 'matched' && second === 'matched' ? 'matched' : 'unavailable'];
      ctx.beginPath(); ctx.moveTo(p.x * frame.width, p.y * frame.height); ctx.lineTo(q.x * frame.width, q.y * frame.height); ctx.stroke();
    }
    frame.landmarks.forEach((p, i) => { if (visible(i)) { ctx.fillStyle = feedbackColors[joint(i) ?? 'unavailable'];ctx.beginPath(); ctx.arc(p.x * frame.width, p.y * frame.height, 4, 0, Math.PI * 2); ctx.fill(); } });
  }
  async stop(reason = 'camera-stop'): Promise<void> {
    this.epoch++; clearInterval(this.timer); clearTimeout(this.slowTimer); clearTimeout(this.timeout);
    this.trackEvents?.abort(); this.trackEvents = null;
    this.camera.stop(); this.lastVideoTime = -1; this.frameCount = 0; this.timings = [];
    this.calibration.reset(true, reason);
    this.events.onStop?.();
    this.setFeedback(null);
    this.frames.textContent = '0'; this.metrics.textContent = '';
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
