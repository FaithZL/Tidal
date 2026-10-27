import type { TaskKind } from '../domain/types.js';

export type TutorialJoint = 'head' | 'neck' | 'leftShoulder' | 'leftElbow' | 'leftWrist'
  | 'rightShoulder' | 'rightElbow' | 'rightWrist' | 'leftHip' | 'rightHip'
  | 'leftKnee' | 'leftAnkle' | 'rightKnee' | 'rightAnkle';
export interface TutorialPoint { x: number; y: number; }
export type TutorialSpeed = .25 | .5 | 1;
export interface TutorialStep {
  title: string;
  cue: string;
  tips: readonly string[];
  durationMs: number;
  points: Readonly<Record<TutorialJoint, TutorialPoint>>;
  highlight: readonly TutorialJoint[];
}
export interface TutorialLesson { id: TaskKind; title: string; summary: string; steps: readonly TutorialStep[]; }
export interface TutorialFrame {
  task: TaskKind;
  stepIndex: number;
  stepProgress: number;
  playing: boolean;
  speed: TutorialSpeed;
  elapsedMs: number;
  totalMs: number;
  points: Readonly<Record<TutorialJoint, TutorialPoint>>;
  highlight: readonly TutorialJoint[];
}

const joints: readonly TutorialJoint[] = [
  'head', 'neck', 'leftShoulder', 'leftElbow', 'leftWrist',
  'rightShoulder', 'rightElbow', 'rightWrist', 'leftHip', 'rightHip',
  'leftKnee', 'leftAnkle', 'rightKnee', 'rightAnkle',
];
const standing: Readonly<Record<TutorialJoint, TutorialPoint>> = {
  head: { x: .5, y: .16 }, neck: { x: .5, y: .26 },
  leftShoulder: { x: .39, y: .3 }, rightShoulder: { x: .61, y: .3 },
  leftElbow: { x: .32, y: .49 }, rightElbow: { x: .68, y: .49 },
  leftWrist: { x: .29, y: .68 }, rightWrist: { x: .71, y: .68 },
  leftHip: { x: .43, y: .58 }, rightHip: { x: .57, y: .58 },
  leftKnee: { x: .42, y: .76 }, rightKnee: { x: .58, y: .76 },
  leftAnkle: { x: .4, y: .93 }, rightAnkle: { x: .6, y: .93 },
};

// Original schematic coordinates explain the application's stages, not exercise thresholds.
function pose(overrides: Partial<Record<TutorialJoint, TutorialPoint>> = {}): Readonly<Record<TutorialJoint, TutorialPoint>> {
  const points = { ...standing, ...overrides };
  for (const joint of joints) Object.freeze(points[joint]);
  return Object.freeze(points);
}

const neutral = pose();
const chopReady = pose({
  leftElbow: { x: .31, y: .4 }, leftWrist: { x: .53, y: .33 },
  rightElbow: { x: .73, y: .39 }, rightWrist: { x: .58, y: .27 },
});
const chopDown = pose({
  head: { x: .48, y: .18 }, neck: { x: .49, y: .28 },
  leftShoulder: { x: .39, y: .32 }, rightShoulder: { x: .59, y: .31 },
  leftElbow: { x: .33, y: .49 }, rightElbow: { x: .61, y: .48 },
  leftWrist: { x: .45, y: .64 }, rightWrist: { x: .51, y: .61 },
});
const loadReady = pose({
  leftElbow: { x: .29, y: .45 }, rightElbow: { x: .71, y: .45 },
  leftWrist: { x: .45, y: .43 }, rightWrist: { x: .55, y: .43 },
});
const loadSquat = pose({
  head: { x: .5, y: .27 }, neck: { x: .5, y: .37 },
  leftShoulder: { x: .39, y: .41 }, rightShoulder: { x: .61, y: .41 },
  leftElbow: { x: .3, y: .56 }, rightElbow: { x: .7, y: .56 },
  leftWrist: { x: .34, y: .72 }, rightWrist: { x: .66, y: .72 },
  leftHip: { x: .43, y: .69 }, rightHip: { x: .57, y: .69 },
  leftKnee: { x: .3, y: .78 }, rightKnee: { x: .7, y: .78 },
});
const loadPress = pose({
  leftElbow: { x: .33, y: .19 }, rightElbow: { x: .67, y: .19 },
  leftWrist: { x: .36, y: .075 }, rightWrist: { x: .64, y: .075 },
});
const carryHold = pose({
  leftElbow: { x: .27, y: .44 }, rightElbow: { x: .73, y: .44 },
  leftWrist: { x: .4, y: .53 }, rightWrist: { x: .6, y: .53 },
});
const wrists: readonly TutorialJoint[] = ['leftWrist', 'rightWrist'];
const arms: readonly TutorialJoint[] = ['leftShoulder', 'leftElbow', 'leftWrist', 'rightShoulder', 'rightElbow', 'rightWrist'];
const legs: readonly TutorialJoint[] = ['leftHip', 'rightHip', 'leftKnee', 'rightKnee'];

export const tutorialLessons: Record<TaskKind, TutorialLesson> = {
  chop: {
    id: 'chop', title: '挥砍',
    summary: '先上肩准备，再下挥，最后回到上肩。完整复位后才计一次。',
    steps: [
      {
        title: '站稳与入镜', cue: '固定机位，自然站立，让全身和举手范围都在画面内。',
        tips: ['确认头顶、双手与脚部没有被画面裁切。', '先空手缓慢熟悉示意；动作范围以自己的舒适标定为准。'],
        durationMs: 1000, points: neutral, highlight: ['head', 'leftAnkle', 'rightAnkle'],
      },
      {
        title: '上肩准备', cue: '把主手放到自己标定的舒适上肩位置，保持稳定。',
        tips: ['图中用右侧演示；摄像头标定按本人的主手选择。', '手腕接近上肩准备区后，再开始下挥。'],
        durationMs: 1600, points: chopReady, highlight: arms,
      },
      {
        title: '缓慢下挥', cue: '从准备位置缓慢下挥到自己标定的下方位置。',
        tips: ['保持主手和躯干可见，不必追求更快或更大的幅度。', '下挥反馈只表示动作阶段，尚未完成一次计数。'],
        durationMs: 1800, points: chopDown, highlight: ['rightShoulder', 'rightElbow', 'rightWrist'],
      },
      {
        title: '回到上肩', cue: '回到刚才的上肩准备位置，稳定复位后完成一个循环。',
        tips: ['仅下挥、停在下方或未完整复位，都不算完整动作。', '失去跟踪或暂停后，先重新稳定到准备姿态。'],
        durationMs: 1600, points: chopReady, highlight: arms,
      },
    ],
  },
  load: {
    id: 'load', title: '装车',
    summary: '站立 → 下蹲 → 站起 → 举手 → 放下复位，是一个完整装车动作。',
    steps: [
      {
        title: '自然站立', cue: '自然站立，双手回到本人标定的起始区域。',
        tips: ['全身与双手保持入镜，使用固定机位。', '示意只说明本应用步骤，按自己的舒适范围标定。'],
        durationMs: 1000, points: loadReady, highlight: ['leftHip', 'rightHip', ...wrists],
      },
      {
        title: '舒适下蹲', cue: '在舒适范围内下蹲，让髋部下降、膝部弯曲。',
        tips: ['不要为了识别强行加深下蹲。', '髋、膝和脚部需可见；差异不足时先检查机位与标定。'],
        durationMs: 1800, points: loadSquat, highlight: legs,
      },
      {
        title: '恢复站立', cue: '从下蹲恢复到刚才的自然站立姿态。',
        tips: ['先有下蹲再站起，不能跳过前一步。', '站起与后续举手可以自然连续，不必刻意停顿。'],
        durationMs: 1600, points: loadReady, highlight: legs,
      },
      {
        title: '向上举手', cue: '站起后，将双手举到本人标定的舒适高度。',
        tips: ['抬手后双手仍需留在画面内。', '只举手或只下蹲，都不是完整装车动作。'],
        durationMs: 1600, points: loadPress, highlight: arms,
      },
      {
        title: '放下并复位', cue: '双手放回起始区域，并恢复自然站立，完成一次装车循环。',
        tips: ['完整复位后，次数才增加一次、木材才会入车。', '中途暂停或失去跟踪后，重新从起始姿态准备。'],
        durationMs: 1600, points: loadReady, highlight: ['leftHip', 'rightHip', ...wrists],
      },
    ],
  },
  carry: {
    id: 'carry', title: '拉车持姿',
    summary: '使用本人标定且能与放下区分的持姿。人体姿态不能证明实际持握或器械重量。',
    steps: [
      {
        title: '准备持姿', cue: '摆出自己已经标定的持姿，让双手与全身保持可见。',
        tips: ['图中屈臂仅用于区分阶段，具体姿态以本人的舒适标定为准。', '持姿与放下无法区分时，需调整机位并重新准备。'],
        durationMs: 1400, points: carryHold, highlight: arms,
      },
      {
        title: '稳定保持', cue: '稳定保持在已标定的持姿范围，等待就绪后累计有效时间。',
        tips: ['姿态保持稳定、识别有效时才会计时。', '保持头、手、躯干与脚部可见；不靠加重或强行改变动作换取识别。'],
        durationMs: 2600, points: carryHold, highlight: arms,
      },
      {
        title: '放下停止', cue: '回到已标定的放下后姿态，有效计时和拉车随之停止。',
        tips: ['放下、未识别到有效姿态或暂停时，计时停止。', '恢复持姿后从当前继续计时，中断期间不会补算。'],
        durationMs: 1800, points: neutral, highlight: arms,
      },
    ],
  },
};

const upperHold = pose({
  leftElbow: { x: .29, y: .4 }, rightElbow: { x: .71, y: .4 },
  leftWrist: { x: .4, y: .34 }, rightWrist: { x: .6, y: .34 },
});
function upperRaiseLesson(id: 'chop' | 'load', title: string): TutorialLesson {
  return {
    id, title,
    summary: '上半身举手循环：双手放下 → 举到舒适的肩上或头侧 → 放下。可以坐着完成；完整复位后才计一次。',
    steps: [
      { title: '双手放下', cue: '坐稳或站稳，双手放下到本人准备时的低位，让双肩、双肘和双手腕留在画面内。',
        tips: ['只识别上半身；腿部保持舒适，不需要下蹲。', '固定机位，身体保持稳定，先从自己的放下姿态开始。'],
        durationMs: 1200, points: neutral, highlight: arms },
      { title: '双手向上举起', cue: '双手一起举到本人准备时的舒适高度；可以在肩上或头侧，不要伸出画面。',
        tips: ['两只手都需达到自己的举手位置。', '只举起一只手或停在半路，都不能完成一个完整循环。'],
        durationMs: 1800, points: loadPress, highlight: arms },
      { title: '放下完成复位', cue: '将双手放回刚才的低位，稳定复位后完成一次。',
        tips: ['举起后仍需放下；停在高位不会重复计数。', '暂停或跟踪失效后，重新从放下姿态开始，不能接续旧半次动作。'],
        durationMs: 1800, points: neutral, highlight: arms },
    ],
  };
}
/** Original diagrams for the explicit seated/standing upper-body input program. */
export const upperBodyTutorialLessons: Record<TaskKind, TutorialLesson> = {
  chop: upperRaiseLesson('chop', '砍树 · 上半身举手'),
  load: upperRaiseLesson('load', '装车 · 上半身举手'),
  carry: {
    id: 'carry', title: '拉车 · 上半身持姿',
    summary: '上半身持姿：双臂屈肘前举至胸肩之间并稳定保持。可以坐着完成；只需双肩、双肘和双手腕可见。',
    steps: [
      { title: '双臂向前举起', cue: '双臂屈肘向前，双手停在放下和举高之间，靠近胸肩位置；保持舒适，双手留在画面内。',
        tips: ['持姿应与双手放下、向上举手的姿态有可见区别。', '上半身示意不代表真实负重或器械持握。'],
        durationMs: 1400, points: upperHold, highlight: arms },
      { title: '双臂稳定保持', cue: '双臂屈肘，双手稳定停在胸肩前方，识别确认后开始累计有效时间。',
        tips: ['只需上半身入镜，腿部保持舒适，不需要下蹲。', '双手都需保持前举；放下、举过高或失效时不会计时。'],
        durationMs: 2600, points: upperHold, highlight: arms },
      { title: '放下停止', cue: '将双手放回低位，拉车和有效计时随之停止。',
        tips: ['暂停、放下或失去跟踪时不累计持姿时间。', '重新持姿后只计新观察到的有效样本，中断期间不补算。'],
        durationMs: 1800, points: neutral, highlight: arms },
    ],
  },
};

export class TutorialClock {
  private task: TaskKind;
  private stepIndex = 0;
  private stepElapsedMs = 0;
  private playing = false;
  private speed: TutorialSpeed = 1;
  private selected = false;
  private upperBody = false;

  constructor(task: TaskKind = 'chop') { this.task = task; }

  private get lesson(): TutorialLesson { return (this.upperBody ? upperBodyTutorialLessons : tutorialLessons)[this.task]; }

  setUpperBodyEnabled(enabled: boolean): void {
    if (this.upperBody === enabled) return;
    this.upperBody = enabled;
    this.stepIndex = 0;this.stepElapsedMs = 0;this.selected = false;
  }

  get frame(): TutorialFrame {
    const steps = this.lesson.steps, step = steps[this.stepIndex];
    const progress = this.stepElapsedMs / step.durationMs;
    const from = steps[Math.max(0, this.stepIndex - 1)].points;
    const points = { ...step.points };
    for (const joint of joints) {
      const a = from[joint], b = step.points[joint];
      points[joint] = progress === 1 ? b : progress === 0 ? a
        : Object.freeze({ x: a.x + (b.x - a.x) * progress, y: a.y + (b.y - a.y) * progress });
    }
    return {
      task: this.task, stepIndex: this.stepIndex, stepProgress: progress,
      playing: this.playing, speed: this.speed,
      elapsedMs: steps.slice(0, this.stepIndex).reduce((sum, item) => sum + item.durationMs, 0) + this.stepElapsedMs,
      totalMs: steps.reduce((sum, item) => sum + item.durationMs, 0),
      points: Object.freeze(points), highlight: step.highlight,
    };
  }

  setTask(task: TaskKind): void { this.task = task;this.replay(); }

  setSpeed(speed: TutorialSpeed): void {
    if (speed === .25 || speed === .5 || speed === 1) this.speed = speed;
  }

  selectStep(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.lesson.steps.length) return;
    this.stepIndex = index;
    this.stepElapsedMs = this.lesson.steps[index].durationMs;
    this.playing = false;
    this.selected = true;
  }

  play(): void {
    if (this.selected) { this.stepElapsedMs = 0;this.selected = false; }
    const last = this.lesson.steps.length - 1;
    if (this.stepIndex < last || this.stepElapsedMs < this.lesson.steps[last].durationMs) this.playing = true;
  }

  pause(): void { this.playing = false; }

  replay(): void {
    this.stepIndex = 0;this.stepElapsedMs = 0;this.selected = false;this.playing = true;
  }

  advance(deltaMs: number): void {
    if (!this.playing || !Number.isFinite(deltaMs) || deltaMs <= 0 || deltaMs > 200) return;
    let remaining = deltaMs * this.speed;
    while (remaining > 0) {
      const duration = this.lesson.steps[this.stepIndex].durationMs;
      const toTarget = duration - this.stepElapsedMs;
      if (remaining < toTarget) { this.stepElapsedMs += remaining;return; }
      this.stepElapsedMs = duration;
      remaining -= toTarget;
      if (this.stepIndex === this.lesson.steps.length - 1) { this.playing = false;return; }
      this.stepIndex++;this.stepElapsedMs = 0;
    }
  }
}
