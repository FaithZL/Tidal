import type { TaskKind } from '../domain/types.js';
import type { RecognitionConfig } from '../config/recognitionConfig.js';
import type { PoseFeatures } from './features.js';
import type { RecognitionProfile } from './recognizers/types.js';

/** Comparison with the current step of a personal calibration, not a form or safety score. */
export interface RecognitionFeedback {
  status: 'matched' | 'adjust' | 'moving';
  message: string;
  joints: Readonly<Partial<Record<number, 'matched' | 'adjust'>>>;
}
export interface RecognitionFeedbackInput {
  task: TaskKind; phase: string; features: PoseFeatures; rawFeatures?: PoseFeatures;
  profile: RecognitionProfile; config: RecognitionConfig; completed?: boolean;
}
type Judgment = 'matched' | 'adjust';
type Joints = Partial<Record<number, Judgment>>;
const moving = (): RecognitionFeedback => ({ status: 'moving', message: '动作过渡中', joints: {} });
function mark(joints: Joints, indices: readonly number[], judgment: Judgment): void {
  for (const index of indices) joints[index] = judgment;
}
function combined(joints: Joints, transitioning: boolean, matched: string, adjust: string): RecognitionFeedback {
  const status = Object.values(joints).includes('adjust') ? 'adjust' : transitioning ? 'moving' : 'matched';
  return { status, message: status === 'adjust' ? adjust : status === 'moving' ? '动作过渡中' : matched, joints };
}
/** Only measured primary-side limb features may color that limb; hip height uses both hips. */
export function assessRecognitionFeedback(input: RecognitionFeedbackInput): RecognitionFeedback {
  const { task, phase, features: f, profile, config: c } = input;
  const primary = profile.calibration.primarySide, side = f.sides[primary];
  if (!side || ![side.wrist.x, side.wrist.y, side.elbowDeg, side.kneeDeg, f.hipHeight].every(Number.isFinite)) return moving();
  const arm = primary === 'left' ? [11, 13, 15] : [12, 14, 16];
  const knee = primary === 'left' ? [25] : [26], hips = [23, 24];
  const joints: Joints = {}, e = profile.examples;
  if (input.completed && task !== 'carry') {
    mark(joints, arm, 'matched');
    if (task === 'load') { mark(joints, knee, 'matched');mark(joints, hips, 'matched'); }
    return { status: 'matched', message: '完整动作已完成', joints };
  }
  if (task === 'chop') {
    const raised = e['chop-raised'], down = e['chop-down'];
    if (!raised || !down || down.wrist.y <= raised.wrist.y) return moving();
    const q = (side.wrist.y - raised.wrist.y) / (down.wrist.y - raised.wrist.y);
    if (q > c.repReturnRatio && q < c.repEnterRatio) return moving();
    const up = q <= c.repReturnRatio;
    const adjust = !up && (phase === 'unready' || phase === 'chop-return');
    mark(joints, arm, adjust ? 'adjust' : 'matched');
    return { status: adjust ? 'adjust' : 'matched', message: adjust ? '主手回到上肩位置' : up ? '上肩位置匹配' : '下挥位置匹配', joints };
  }
  if (task === 'load') {
    const stand = e['load-stand'], squat = e['load-squat'], press = e['load-press'];
    if (!stand || !squat || !press || stand.kneeDeg <= squat.kneeDeg || stand.hipHeight <= squat.hipHeight || stand.wrist.y <= press.wrist.y) return moving();
    const flex = (stand.kneeDeg - side.kneeDeg) / (stand.kneeDeg - squat.kneeDeg);
    const hip = (stand.hipHeight - f.hipHeight) / (stand.hipHeight - squat.hipHeight);
    const pressRatio = (stand.wrist.y - side.wrist.y) / (stand.wrist.y - press.wrist.y);
    const low = (value: number) => value <= c.repReturnRatio;
    const high = (value: number) => value >= c.repEnterRatio;
    const rest = Math.hypot(side.wrist.x - stand.wrist.x, side.wrist.y - stand.wrist.y) <= c.returnWristTolerance;
    const upright = low(flex) && low(hip), squatting = high(flex) && high(hip);
    const legs = (): boolean => {
      if (low(flex)) mark(joints, knee, 'matched');else if (high(flex)) mark(joints, knee, 'adjust');
      if (low(hip)) mark(joints, hips, 'matched');else if (high(hip)) mark(joints, hips, 'adjust');
      return !low(flex) && !high(flex) || !low(hip) && !high(hip);
    };
    if (phase === 'unready') {
      const transition = legs();mark(joints, arm, rest ? 'matched' : 'adjust');
      return combined(joints, transition, '站立复位匹配', '回到站立复位姿态');
    }
    if (phase === 'ready' || phase === 'squat-down') {
      if (upright || squatting) {
        mark(joints, knee, 'matched');mark(joints, hips, 'matched');
        if (upright) {
          if (phase === 'ready') mark(joints, arm, rest ? 'matched' : 'adjust');
          else if (rest || high(pressRatio)) mark(joints, arm, 'matched');
        }
        return combined(joints, false, squatting ? '下蹲位置匹配' : '站起位置匹配', '先下蹲再举手');
      }
      // A knee bend alone or a hip shift alone is not the calibrated squat.
      // Between endpoint regions, normal travel remains unjudged.
      if (high(flex) && low(hip) || low(flex) && high(hip)) {
        const kneeMatched = phase === 'ready' ? high(flex) : low(flex);
        mark(joints, knee, kneeMatched ? 'matched' : 'adjust');
        mark(joints, hips, kneeMatched ? 'adjust' : 'matched');
        return combined(joints, false, '', phase === 'ready' ? '膝髋需共同下蹲' : '膝髋需共同站起');
      }
      return moving();
    }
    if (phase === 'stand-up' || phase === 'press-up' || phase === 'load-return') {
      let transition = legs();
      if (phase === 'stand-up') {
        if (high(pressRatio)) mark(joints, arm, 'matched');
        else if (low(pressRatio)) mark(joints, arm, 'adjust');
        else transition = true;
      } else if (rest || phase === 'press-up' && high(pressRatio)) mark(joints, arm, 'matched');
      else if (!low(pressRatio) && !high(pressRatio)) transition = true;
      else mark(joints, arm, 'adjust');
      return combined(joints, transition, phase === 'stand-up' ? '举手位置匹配' : '复位位置匹配',
        !upright ? '先恢复站立姿态' : phase === 'stand-up' ? '手臂向标定高度举起' : '手臂回到复位位置');
    }
    return moving();
  }
  const hold = e['carry-hold'], release = e['carry-release'];
  const raw = input.rawFeatures ?? f, rawSide = raw.sides[primary];
  if (!hold || !release || !rawSide) return moving();
  const vector = (wrist: { x: number; y: number }, elbow: number, kneeAngle: number, hipHeight: number) =>
    [wrist.x, wrist.y, elbow / 180, kneeAngle / 180, hipHeight];
  const target = vector(hold.wrist, hold.elbowDeg, hold.kneeDeg, hold.hipHeight);
  const released = vector(release.wrist, release.elbowDeg, release.kneeDeg, release.hipHeight);
  const smoothVector = vector(side.wrist, side.elbowDeg, side.kneeDeg, f.hipHeight);
  const rawVector = vector(rawSide.wrist, rawSide.elbowDeg, rawSide.kneeDeg, raw.hipHeight);
  const rms = (a: readonly number[], b: readonly number[]) => Math.hypot(...a.map((v, index) => v - b[index])) / Math.sqrt(5);
  const separation = rms(target, released);
  if (!Number.isFinite(separation) || separation <= 0 || ![...smoothVector, ...rawVector].every(Number.isFinite)) return moving();
  const inside = (v: readonly number[], ratio: number) => rms(v, target) <= ratio * separation && rms(v, target) < rms(v, released);
  const ratio = phase === 'holding' ? c.holdExitRatio : c.holdEnterRatio;
  if (inside(smoothVector, ratio) && inside(rawVector, ratio)) {
    mark(joints, arm, 'matched');mark(joints, knee, 'matched');mark(joints, hips, 'matched');
    return { status: 'matched', message: phase === 'holding' ? '持姿位置匹配' : '持姿匹配，正在确认', joints };
  }
  if (phase !== 'holding' && inside(smoothVector, c.holdExitRatio) && inside(rawVector, c.holdExitRatio)) return moving();
  const groups = [
    { indices: arm, components: [0, 1, 2], message: '手臂靠近标定持姿' },
    { indices: knee, components: [3], message: '膝部靠近标定持姿' },
    { indices: hips, components: [4], message: '髋部靠近标定持姿' },
  ];
  const errors = groups.map(group => Math.max(...[smoothVector, rawVector].map(v =>
    Math.hypot(...group.components.map(index => v[index] - target[index])))));
  const dominant = errors.indexOf(Math.max(...errors));
  groups.forEach((group, index) => mark(joints, group.indices,
    index === dominant || errors[index] / Math.sqrt(group.components.length) > ratio * separation ? 'adjust' : 'matched'));
  return { status: 'adjust', message: groups[dominant].message, joints };
}
