import Phaser from 'phaser';
import type { ActionPhase, TaskKind } from '../../domain/types.js';
import { palette as p } from '../assets.js';
import { drawLog } from './props.js';

/** A small articulated illustration. Only the requested pose is drawn; no chained action tween. */
export class FarmerActor {
  readonly body: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene) { this.body = scene.add.graphics(); }
  sync(x: number, y: number, facing: number, phase: ActionPhase, task: TaskKind | null, handLog: boolean, walking: number): void {
    const g = this.body.setPosition(x, y).setScale(facing, 1).setDepth(y + 2);g.clear();
    const squat = task === 'load' && phase === 'squat-down';
    const hip = squat ? -32 : -55, head = squat ? -99 : -132;
    const stride = Math.sin(walking) * 8;
    g.fillStyle(0x3b5a3e, .22).fillEllipse(0, 3, 90, 22);
    // Boots and bent knees remain planted during squats.
    this.limb(-13, hip, squat ? -33 : -16 + stride, -23, -23 + stride, -7, p.denim, 18);
    this.limb(13, hip, squat ? 32 : 17 - stride, -23, 22 - stride, -7, p.denim, 18);
    g.fillStyle(p.boot).fillRoundedRect(-36 + stride, -12, 31, 14, 5).fillRoundedRect(9 - stride, -12, 32, 14, 5);
    g.lineStyle(3, p.outline).lineBetween(-34 + stride, 0, -9 + stride, 0).lineBetween(13 - stride, 0, 38 - stride, 0);
    // Shirt, overall bib and buttons.
    const shoulder = head + 32;
    g.fillStyle(p.shirt).fillRoundedRect(-25, shoulder, 50, hip - shoulder + 10, 11);
    g.lineStyle(3, p.outline).strokeRoundedRect(-25, shoulder, 50, hip - shoulder + 10, 11);
    g.fillStyle(p.denim).fillRoundedRect(-20, shoulder + 24, 40, hip - shoulder - 10, 5);
    g.lineStyle(7, p.denim).lineBetween(-15, shoulder + 4, -15, shoulder + 28).lineBetween(15, shoulder + 4, 15, shoulder + 28);
    g.fillStyle(p.cream).fillCircle(-15, shoulder + 25, 3).fillCircle(15, shoulder + 25, 3);
    g.lineStyle(2, 0x91b0a0).strokeRoundedRect(-10, shoulder + 31, 20, 12, 3);
    // Back arm, neck and face.
    this.limb(-22, shoulder + 8, -31, shoulder + 25, -25, shoulder + 42, p.skin, 12);
    g.fillStyle(p.skin).fillRoundedRect(-7, head + 14, 19, 25, 5);
    g.fillStyle(p.bark).fillRoundedRect(-24, head - 17, 46, 42, 15);
    g.fillStyle(p.skin).fillRoundedRect(-19, head - 17, 45, 40, 17).fillCircle(25, head + 4, 7);
    g.lineStyle(2, p.outline).lineBetween(11, head + 16, 18, head + 17);
    g.fillStyle(p.outline).fillCircle(16, head - 1, 2.7);
    g.fillStyle(0xd8966b, .65).fillEllipse(11, head + 10, 10, 6);
    // Straw hat with dark band and leaf.
    g.fillStyle(p.gold).fillRoundedRect(-25, head - 42, 49, 29, 10);
    g.lineStyle(3, p.outline).strokeRoundedRect(-25, head - 42, 49, 29, 10);
    g.fillStyle(p.bark).fillRect(-25, head - 24, 49, 9);
    g.fillStyle(0xe8cb84).fillRoundedRect(-39, head - 18, 81, 11, 5);
    g.lineStyle(2, p.outline).strokeRoundedRect(-39, head - 18, 81, 11, 5);
    g.fillStyle(p.pineLight).fillEllipse(-19, head - 28, 9, 18);
    // Pose endpoints are deliberate holds, not a time-based cycle.
    let hx = 34, hy = shoulder + 40;
    if (task === 'chop') {
      if (phase === 'chop-down') { hx = 60;hy = -61; }
      else if (phase === 'chop-return') { hx = 15;hy = -112; }
      else { hx = 32;hy = -145; }
    } else if (task === 'load') {
      hx = 45;
      hy = phase === 'squat-down' ? -25 : phase === 'stand-up' ? -86 : phase === 'press-up' ? -161 : -64;
    } else if (task === 'carry') { hx = -8;hy = -50; }
    const elbowX = task === 'carry' ? -34 : Math.max(29, hx - 13);
    this.limb(22, shoulder + 10, elbowX, (shoulder + hy) / 2 + 15, hx, hy, p.skin, 13);
    g.fillStyle(p.shirt).fillCircle(23, shoulder + 12, 10);
    if (handLog) drawLog(g, hx - 28, hy - 19, 1.3);
    if (task === 'chop') {
      const angle = phase === 'chop-down' ? .22 : phase === 'chop-return' ? -1.65 : -1.95;
      const ax = hx + Math.cos(angle) * 63, ay = hy + Math.sin(angle) * 63;
      g.lineStyle(8, p.outline).lineBetween(hx - Math.cos(angle) * 14, hy - Math.sin(angle) * 14, ax, ay);
      g.lineStyle(5, 0xb58b54).lineBetween(hx - Math.cos(angle) * 14, hy - Math.sin(angle) * 14, ax, ay);
      const nx = -Math.sin(angle), ny = Math.cos(angle);
      const blade = [{ x: ax - 8, y: ay - 8 }, { x: ax + nx * 27, y: ay + ny * 27 }, { x: ax + nx * 24 + 17, y: ay + ny * 24 - 9 }, { x: ax + 8, y: ay - 17 }];
      g.fillStyle(0xc4d7c8).fillPoints(blade, true);g.lineStyle(3, p.outline).strokePoints(blade, true);
    }
    g.fillStyle(p.skin).fillCircle(hx, hy, 7);
  }
  private limb(x: number, y: number, mx: number, my: number, ex: number, ey: number, color: number, width: number): void {
    const points = [{ x, y }, { x: mx, y: my }, { x: ex, y: ey }];
    this.body.lineStyle(width + 4, p.outline).strokePoints(points).fillStyle(p.outline).fillCircle(mx, my, (width + 4) / 2);
    this.body.lineStyle(width, color).strokePoints(points).fillStyle(color).fillCircle(mx, my, width / 2);
  }
  destroy(): void { this.body.destroy(); }
}
