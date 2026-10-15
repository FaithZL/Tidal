import { CalibrationSession, calibrationSteps, type CalibrationStep } from '../pose/calibrationSession.js';
import { recognitionConfig } from '../config/recognitionConfig.js';
import type { PoseFrame } from '../pose/types.js';
import type { RecognitionProfile } from '../pose/recognizers/types.js';

const steps: Record<CalibrationStep, [string, string]> = {
  standing: ['自然站立', '全身入镜、相机固定，自然站立保持稳定。'],
  'chop-raised': ['挥砍准备', '主手放在舒适的上肩准备位置，保持片刻。'],
  'chop-down': ['挥砍下方', '缓慢下挥到舒适位置，保持片刻；不要求负重。'],
  'load-squat': ['下蹲示例', '按自己舒适的幅度下蹲，保持片刻；不要强行加深。'],
  'load-stand': ['站起示例', '恢复自然站立，保持片刻。'],
  'load-press': ['举手示例', '将双手举至舒适高度，确保手仍在画面内。'],
  'load-return': ['装车复位', '恢复刚才站起时的自然姿态。'],
  'carry-hold': ['Carry 持姿', '摆出准备拉车的持姿，稳定保持；人体姿态不能证明真实持握。'],
  'carry-release': ['Carry 放下', '展示与持姿可区分的放下后姿态；无需增加负重或强行改变动作。'],
};
const reasons: Record<string, string> = {
  'missing-points': '未检测到完整人体关键点', 'invalid-data': '关键点或时间数据无效',
  'low-confidence': '头、躯干或脚部置信度不足', 'out-of-frame': '头部或脚部接近边缘/超出画面，请调整站位',
  'small-torso': '人体过小或躯干点重合，请调整机位', 'unusable-side': '主手侧关键点缺失、低置信度或关节重合',
  'out-of-order': '收到重复/乱序帧，请重新准备', gap: '采样断档，请重新标定', stale: '关键点已过期，请等待新数据并重新标定',
  future: '采集时间异常，请重新准备', resized: '画面尺寸变化，请重新标定', 'person-moved': '人物位置/尺度明显变化，请重新准备',
  'insufficient-samples': '连续样本不足，请重新采集', 'insufficient-duration': '观察时长不足，请重新采集', unstable: '姿态不够稳定，请重采当前步骤',
  'insufficient-chop-range': '上肩与下挥示例差异不足，请检查主手和机位后重采',
  'insufficient-squat-range': '蹲下示例未形成可用差异；请调整机位，不要强行加深',
  'insufficient-press-range': '举手示例差异不足，请确认手部可见', 'not-returned': '复位示例与自然站立不一致，请重采',
  'carry-not-separable': '持姿与放下不可区分：不能启用 Carry 姿态代理，请调整机位后重新采集',
};
export class CalibrationPanel {
  private readonly session = new CalibrationSession();
  private readonly events = new AbortController();
  constructor(private readonly root: HTMLDetailsElement) {
    const options = { signal: this.events.signal };
    this.node<HTMLButtonElement>('calibrationCapture').addEventListener('click', () => {
      this.session.tick(performance.now());this.session.beginCapture();this.render();
    }, options);
    this.node<HTMLButtonElement>('calibrationReset').addEventListener('click', () => this.reset(), options);
    this.node<HTMLSelectElement>('calibrationSide').addEventListener('change', () => {
      this.session.setPrimarySide(this.node<HTMLSelectElement>('calibrationSide').value === 'left' ? 'left' : 'right');this.render();
    }, options);
    this.render();
  }
  private node<T extends HTMLElement>(id: string): T {
    const element = this.root.querySelector<T>(`#${id}`);if (!element) throw new Error(`Missing calibration element ${id}`);return element;
  }
  activate(): void { this.root.open = true; }
  getProfile():RecognitionProfile|null {
    const s=this.session.getSnapshot();
    return s.calibration&&s.readyFor.chop&&s.readyFor.load&&s.readyFor.carry?{calibration:s.calibration,examples:s.examples}:null;
  }
  accept(frame: PoseFrame): void { this.session.ingest(frame, performance.now());this.render(); }
  tick(nowMs: number): void { this.session.tick(nowMs);this.render(); }
  reset(close = false): void { this.session.reset();if (close) this.root.open = false;this.render(); }
  dispose(): void { this.reset(true);this.events.abort(); }
  private render(): void {
    const s = this.session.getSnapshot(), step = s.step;
    this.root.dataset.step = step ?? 'complete';
    const duration = step === 'standing' ? recognitionConfig.standingDurationMs : step?.startsWith('carry') ? recognitionConfig.carryDurationMs : recognitionConfig.exampleDurationMs;
    const name = step ? steps[step][0] : '全部完成';
    const button = this.node<HTMLButtonElement>('calibrationCapture');button.disabled = !s.available || s.capturing || s.complete;
    button.textContent = s.capturing ? `采集中 ${Math.round(s.progress * 100)}%` : step ? `采集${name} · ${duration / 1000}秒` : '标定完成';
    this.node<HTMLProgressElement>('calibrationProgress').value = s.progress;
    this.node('calibrationStatus').textContent = !s.available ? '等待全身有效关键点；开启摄像头后开始标定。'
      : s.complete ? '标定完成 · 可手动选择摄像头姿态代理训练。'
      : `第 ${calibrationSteps.indexOf(step!) + 1}/9 步 · ${name}${s.capturing ? '：采集中，请保持稳定' : ''}`;
    this.node('calibrationInstruction').textContent = step ? steps[step][1] : '标定只存在本次内存。离开准备页、切换来源或失去跟踪后需要重新采集。';
    this.node('calibrationReason').textContent = s.reason ? `最近拒绝：${reasons[s.reason] ?? s.reason}` : '';
    const ready = (yes: boolean) => yes ? '已标定' : '未标定';
    this.node('calibrationReadiness').textContent = `砍树：${ready(s.readyFor.chop)} · 装车：${ready(s.readyFor.load)} · Carry：${ready(s.readyFor.carry)}`;
    const features = s.features, side = features?.sides[s.primarySide];
    this.node('calibrationFeatures').textContent = features && side
      ? `${s.primarySide === 'right' ? '右' : '左'}侧 · 置信度 ${side.confidence.toFixed(2)} · 膝 ${side.kneeDeg.toFixed(1)}° · 肘 ${side.elbowDeg.toFixed(1)}° · 腕相对髋 (${side.wrist.x.toFixed(2)}, ${side.wrist.y.toFixed(2)}) · 躯干 ${features.torsoScalePx.toFixed(0)}px`
      : '特征不可用；不会补点或用默认角度继续。';
  }
}
