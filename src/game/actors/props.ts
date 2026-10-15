import Phaser from 'phaser';
import { palette as p } from '../assets.js';

export function drawLog(g: Phaser.GameObjects.Graphics, x: number, y: number, scale = 1): void {
  const w = 43 * scale, h = 19 * scale;
  g.fillStyle(p.wood).fillRoundedRect(x, y, w, h, 5 * scale);
  g.lineStyle(2 * scale, p.outline).strokeRoundedRect(x, y, w, h, 5 * scale);
  g.lineStyle(2 * scale, p.bark).lineBetween(x + 12 * scale, y + h * .35, x + w - 4 * scale, y + h * .35);
  g.fillStyle(p.cut).fillEllipse(x + 5 * scale, y + h / 2, 14 * scale, h);
  g.lineStyle(2 * scale, p.bark).strokeEllipse(x + 5 * scale, y + h / 2, 14 * scale, h);
  g.lineStyle(scale, p.bark).strokeEllipse(x + 5 * scale, y + h / 2, 6 * scale, 10 * scale);
}

export class TreeActor {
  private stump: Phaser.GameObjects.Graphics;
  private crown: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.stump = scene.add.graphics({ x, y }).setDepth(y);
    const g = this.stump;
    g.fillStyle(0x385d3e, .18).fillEllipse(2, 8, 96, 25);
    g.fillStyle(p.bark).fillRoundedRect(-20, -23, 40, 27, 5);
    g.lineStyle(3, p.outline).strokeRoundedRect(-20, -23, 40, 27, 5);
    g.fillStyle(p.cut).fillEllipse(0, -22, 41, 18);
    g.lineStyle(2, p.bark).strokeEllipse(0, -22, 41, 18).strokeEllipse(0, -22, 22, 9);
    this.crown = scene.add.graphics({ x, y }).setDepth(y + 1);
    const t = this.crown;
    t.fillStyle(p.bark).fillRoundedRect(-13, -125, 26, 110, 4);
    t.lineStyle(3, p.outline).strokeRoundedRect(-13, -125, 26, 110, 4);
    t.lineStyle(3, 0xb18a5b).lineBetween(-4, -110, -4, -30);
    for (const [top, bottom, width, color] of [[-193, -65, 82, p.pine], [-235, -115, 67, p.pineLight], [-265, -166, 49, p.pineBright]]) {
      t.fillStyle(color!).fillPoints([{ x: 0, y: top! }, { x: width!, y: bottom! - 9 }, { x: width! - 24, y: bottom! - 9 }, { x: width! - 16, y: bottom! + 2 }, { x: -width!, y: bottom! - 5 }], true);
      t.lineStyle(3, p.outline, .6).lineBetween(0, top!, -width!, bottom! - 5);
      t.lineStyle(3, 0xb5bf80, .3).lineBetween(6, top! + 26, width! - 14, bottom! - 15);
    }
  }
  sync(felled: boolean, fall: number | undefined, hit: number | undefined): void {
    this.crown.setVisible(!felled || fall !== undefined);
    this.crown.setRotation(fall === undefined ? (hit === undefined ? 0 : Math.sin(hit * Math.PI * 4) * .035) : -fall * 1.1);
    this.crown.setAlpha(fall === undefined ? 1 : Math.min(1, (1 - fall) * 3));
  }
  destroy(): void { this.stump.destroy();this.crown.destroy(); }
}

export class CartActor {
  readonly body: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene) { this.body = scene.add.graphics(); }
  sync(x: number, y: number, logs: number, secured: boolean, wheelTurn: number): void {
    const g = this.body.setPosition(x, y).setDepth(y + 1);g.clear();
    g.fillStyle(0x3b5a3e, .2).fillEllipse(10, 2, 184, 32);
    g.lineStyle(9, p.outline).lineBetween(-35, -38, 125, -48);
    g.lineStyle(5, p.wood).lineBetween(-35, -38, 125, -48);
    g.fillStyle(0x775b43).fillRoundedRect(-67, -75, 137, 58, 7);
    for (let i = 0; i < logs; i++) drawLog(g, -60 + i % 3 * 40, -77 - Math.floor(i / 3) * 15, .9);
    g.fillStyle(0xbb8a54).fillRoundedRect(-74, -48, 151, 27, 5);
    g.lineStyle(3, p.outline).strokeRoundedRect(-74, -48, 151, 27, 5);
    g.lineStyle(3, 0xe1ba7b).lineBetween(-65, -39, 65, -39);
    for (const px of [-56, 57]) {
      g.fillStyle(p.outline).fillRoundedRect(px, -64, 7, 49, 2);
      g.fillStyle(p.cream).fillCircle(px + 3, -32, 2);
    }
    for (const wx of [-46, 50]) {
      g.fillStyle(p.outline).fillCircle(wx, -9, 23);
      g.fillStyle(0xd3b77e).fillCircle(wx, -9, 16);
      g.lineStyle(3, p.bark);
      for (let i = 0; i < 4; i++) { const a = wheelTurn + i * Math.PI / 2;g.lineBetween(wx, -9, wx + Math.cos(a) * 14, -9 + Math.sin(a) * 14); }
      g.fillStyle(p.outline).fillCircle(wx, -9, 5);
    }
    if (secured && logs) g.lineStyle(4, p.cream).lineBetween(-27, -48, -27, -142).lineBetween(-27, -142, 36, -142).lineBetween(36, -142, 36, -48);
  }
  destroy(): void { this.body.destroy(); }
}
