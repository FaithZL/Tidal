import Phaser from 'phaser';
import type { FarmFrame } from '../ActionAnimator.js';
import { palette as p } from '../assets.js';

/** Scripted helper has no controller, input emitter, inventory or independent timer. */
export class HelperActor {
  readonly body: Phaser.GameObjects.Graphics;
  readonly label: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene) {
    this.body = scene.add.graphics();
    this.label = scene.add.text(0, 0, '', { fontFamily: 'Microsoft YaHei, sans-serif', fontSize: '16px', color: '#405641', backgroundColor: '#f3e8bf', padding: { x: 10, y: 6 } }).setOrigin(.5, 1);
  }
  sync(npc: FarmFrame['npc']): void {
    const { x, y, mode, progress } = npc;
    const g = this.body.setPosition(x, y).setDepth(y + 1);g.clear();
    g.fillStyle(0x3b5a3e, .2).fillEllipse(0, 4, 76, 22);
    for (const dx of [-21, 16]) {
      g.fillStyle(p.outline).fillRoundedRect(dx - 10, -18, 24, 20, 7);
      g.lineStyle(2, 0x8c9c79).lineBetween(dx - 5, -14, dx - 5, -4).lineBetween(dx + 3, -14, dx + 3, -4);
    }
    g.fillStyle(p.denim).fillRoundedRect(-26, -66, 53, 52, 12);
    g.lineStyle(3, p.outline).strokeRoundedRect(-26, -66, 53, 52, 12);
    g.fillStyle(p.gold).fillRoundedRect(-16, -52, 33, 24, 5);
    g.lineStyle(3, p.cream).lineBetween(-4, -35, 7, -45).lineBetween(-4, -35, -10, -41);
    const lift = mode === 'celebrate' ? -75 : mode === 'secure' ? -32 + Math.sin(progress * 18) * 12 : mode === 'gather' ? -27 : -38;
    g.lineStyle(10, p.outline).lineBetween(-26, -56, -40, lift).lineBetween(27, -56, 43, lift);
    g.lineStyle(6, p.robot).lineBetween(-26, -56, -40, lift).lineBetween(27, -56, 43, lift);
    g.fillStyle(p.gold).fillCircle(-40, lift, 7).fillCircle(43, lift, 7);
    g.fillStyle(p.robot).fillRoundedRect(-32, -112, 65, 49, 14);
    g.lineStyle(3, p.outline).strokeRoundedRect(-32, -112, 65, 49, 14);
    g.fillStyle(p.outline).fillRoundedRect(-23, -101, 48, 26, 8);
    g.fillStyle(p.eye).fillRoundedRect(-15, -94, 8, 11, 4).fillRoundedRect(9, -94, 8, 11, 4);
    g.lineStyle(3, p.outline).lineBetween(0, -112, 5, -126);
    g.fillStyle(p.gold).fillCircle(5, -128, 6);
    if (mode === 'gather') {
      g.lineStyle(5, p.bark).lineBetween(43, lift, 62, 3);
      g.lineStyle(3, p.cream).lineBetween(51, 2, 77, 2);
      for (let i = 0; i < 5; i++) g.lineBetween(51 + i * 6, 2, 51 + i * 6, 11);
    }
    if (mode === 'secure') g.lineStyle(3, p.cream).strokeEllipse(43, lift - 2, 22, 31);
    const labels = { idle: '禾禾 · 预设协作', gather: '禾禾 · 归拢木材', secure: '禾禾 · 固定货物', guide: '禾禾 · 结伴回家', celebrate: '禾禾 · 欢迎回家' };
    this.label.setText(labels[mode]).setPosition(x, y - 143).setDepth(1100);
  }
  destroy(): void { this.body.destroy();this.label.destroy(); }
}
