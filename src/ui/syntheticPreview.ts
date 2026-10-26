import type { ActionPhase, GameEffect, SessionSnapshot, TaskKind } from '../domain/types.js';

type PoseName = ActionPhase | 'hold' | 'rest';
type Point = [number, number];
const links = [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6], [6, 7], [2, 8], [5, 9], [8, 9], [8, 10], [10, 11], [9, 12], [12, 13]];
const names: Record<PoseName, string> = { ready: '准备', 'chop-down': '下挥', 'chop-return': '挥砍复位',
  'squat-down': '下蹲', 'stand-up': '站起', 'press-up': '上举', 'load-return': '装车复位', hold: '持姿拉车', rest: '休息 / 整理' };
const sample: readonly [TaskKind, PoseName][] = [
  ['chop', 'ready'], ['chop', 'chop-down'], ['chop', 'chop-return'], ['load', 'ready'],
  ['load', 'squat-down'], ['load', 'stand-up'], ['load', 'press-up'], ['load', 'load-return'], ['carry', 'hold'], ['carry', 'hold'],
];

/** Decorative, authored skeleton poses. These never enter MediaPipe or any recognizer. */
function points(task: TaskKind, phase: PoseName): Point[] {
  const p: Point[] = [[.5, .16], [.5, .29], [.39, .31], [.32, .46], [.31, .63], [.61, .31], [.68, .46], [.69, .63],
    [.43, .58], [.57, .58], [.41, .75], [.4, .92], [.59, .75], [.6, .92]];
  if (task === 'chop' && phase !== 'rest') {
    const hands: Point = phase === 'chop-down' ? [.52, .68] : phase === 'chop-return' ? [.5, .29] : [.5, .09];
    p[3] = [.33, hands[1] + .13];p[6] = [.67, hands[1] + .13];
    p[4] = [hands[0] - .035, hands[1]];p[7] = [hands[0] + .035, hands[1]];
  }
  if (phase === 'squat-down') {
    for (const i of [0, 1, 2, 5, 8, 9]) p[i]![1] += .17;
    p[3] = [.32, .65];p[6] = [.68, .65];p[4] = [.4, .8];p[7] = [.6, .8];p[10] = [.28, .78];p[12] = [.72, .78];
  } else if (phase === 'stand-up' || phase === 'press-up') {
    const y = phase === 'press-up' ? .08 : .43;
    p[3] = [.3, y + .14];p[6] = [.7, y + .14];p[4] = [.46, y];p[7] = [.54, y];
  }
  return p;
}

export class SyntheticPreview {
  private enabled = false;
  private suspended = false;
  private elapsed = 0;
  private lastTime: number | null = null;
  private painted = '';
  private action: { key: string; phase: ActionPhase } | null = null;
  constructor(private readonly targets: readonly { canvas: HTMLCanvasElement; label: HTMLElement }[]) {}
  setSuspended(suspended: boolean): void {
    if (typeof suspended !== 'boolean' || this.suspended === suspended) return;
    this.suspended = suspended;this.lastTime = null;
  }
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;this.elapsed = 0;this.lastTime = null;this.painted = '';this.action = null;
    if (!enabled) for (const { canvas, label } of this.targets) {
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);label.textContent = '';
    }
  }
  apply(effect: GameEffect): void {
    if (this.enabled && effect.kind === 'action-phase') this.action = { key: `${effect.sessionId}/${effect.taskRunId}/${effect.sourceEpoch}`, phase: effect.phase };
  }
  update(now: number, s: Readonly<SessionSnapshot>): void {
    if (!this.enabled || this.suspended) return;
    const delta = this.lastTime === null ? 0 : now - this.lastTime;this.lastTime = now;
    if (document.hidden || s.pauseReasons.length) return;
    if (delta >= 0 && delta < 200) this.elapsed += delta;
    const tutorial = s.phase === 'setup' || s.phase === 'home';
    const [task, phase] = tutorial ? sample[Math.floor(this.elapsed / 700) % sample.length]!
      : [s.task ?? 'carry', s.phase === 'rest' || s.phase === 'results' ? 'rest' : s.task === 'carry' ? 'hold'
        : this.action?.key === `${s.sessionId}/${s.taskRunId}/${s.sourceEpoch}` ? this.action.phase : 'ready'] as const;
    const key = `${task}/${phase}`;if (this.painted === key) return;this.painted = key;
    for (const { canvas, label } of this.targets) {
      this.draw(canvas, task, phase);label.textContent = `${names[phase]} · 脚本姿态`;
    }
  }
  private draw(canvas: HTMLCanvasElement, task: TaskKind, phase: PoseName): void {
    const ctx = canvas.getContext('2d');if (!ctx) return;
    const w = canvas.width, h = canvas.height, pose = points(task, phase);
    ctx.fillStyle = '#143737';ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#28504c';ctx.lineWidth = 1;
    for (let x = 0; x < w; x += w / 10) { ctx.beginPath();ctx.moveTo(x, 0);ctx.lineTo(x, h);ctx.stroke(); }
    for (let y = 0; y < h; y += h / 8) { ctx.beginPath();ctx.moveTo(0, y);ctx.lineTo(w, y);ctx.stroke(); }
    ctx.strokeStyle = '#8bdcb1';ctx.lineWidth = 5;ctx.lineCap = 'round';
    for (const [a, b] of links) {
      const from = pose[a!]!, to = pose[b!]!;
      ctx.beginPath();ctx.moveTo(from[0] * w, from[1] * h);ctx.lineTo(to[0] * w, to[1] * h);ctx.stroke();
    }
    ctx.fillStyle = '#efd28f';
    for (const [x, y] of pose) { ctx.beginPath();ctx.arc(x * w, y * h, 4, 0, Math.PI * 2);ctx.fill(); }
    ctx.beginPath();ctx.arc(pose[0]![0] * w, pose[0]![1] * h, 13, 0, Math.PI * 2);ctx.stroke();
    ctx.fillStyle = '#efd28f';ctx.font = 'bold 13px sans-serif';ctx.fillText('DEMO / SYNTHETIC', 9, h - 9);
  }
  dispose(): void { this.setEnabled(false); }
}
