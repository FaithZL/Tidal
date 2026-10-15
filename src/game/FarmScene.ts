import Phaser from 'phaser';
import type { DemoConfig } from '../config/demoConfig.js';
import type { ActionPhase, SessionController, SessionSnapshot } from '../domain/types.js';
import { ActionAnimator, treePosition, type FarmFrame } from './ActionAnimator.js';
import { farmAssets, palette as p } from './assets.js';
import { FarmerActor } from './actors/FarmerActor.js';
import { HelperActor } from './actors/HelperActor.js';
import { CartActor, drawLog, TreeActor } from './actors/props.js';

const phaseNames: Record<ActionPhase, string> = {
  ready: '准备 · 上肩蓄力', 'chop-down': '下挥 · 击中树干', 'chop-return': '复位 · 收回斧头',
  'squat-down': '下蹲 · 拾起木材', 'stand-up': '站起 · 抬至胸前', 'press-up': '上举 · 举过头顶', 'load-return': '复位 · 等待装车提交',
};

/** Scene owns every actor/subscription, and only reads the domain's authoritative state. */
export class FarmScene extends Phaser.Scene {
  private snapshot: Readonly<SessionSnapshot>;
  private animator: ActionAnimator;
  private farmer!: FarmerActor;
  private helper!: HelperActor;
  private cart!: CartActor;
  private trees: TreeActor[] = [];
  private wood!: Phaser.GameObjects.Graphics;
  private particles!: Phaser.GameObjects.Graphics;
  private caption!: Phaser.GameObjects.Text;
  private stock!: Phaser.GameObjects.Text;
  private host: HTMLElement | null = null;
  private lastPaint = '';

  constructor(private readonly controller: SessionController, private readonly config: Readonly<DemoConfig>) {
    super('Farm');this.snapshot = controller.getSnapshot();this.animator = new ActionAnimator(config);
  }
  preload(): void { this.load.svg('farm-landscape', farmAssets.landscape, { width: 1280, height: 720 }); }
  create(): void {
    this.lastPaint = '';
    this.animator = new ActionAnimator(this.config);
    this.host = this.game.canvas.parentElement;
    if (this.textures.exists('farm-landscape')) {
      this.add.image(0, 0, 'farm-landscape').setOrigin(0);
      if (this.host) this.host.dataset.art = 'tidal-farm-v1';
    } else this.add.text(30, 250, '农场背景资源加载失败，请刷新检查本地 assets。', { color: '#842e22', fontSize: '24px' });
    this.add.text(36, 30, 'TIDAL  /  A LITTLE EVERY DAY', { fontFamily: 'sans-serif', fontSize: '15px', color: '#6c7957', letterSpacing: 3 });
    this.add.text(34, 56, '林间农场', { fontFamily: 'Microsoft YaHei, sans-serif', fontSize: '34px', fontStyle: 'bold', color: '#3d5944' });
    this.caption = this.add.text(36, 106, '', { fontFamily: 'Microsoft YaHei, sans-serif', fontSize: '20px', color: '#4c6249' }).setDepth(1100);
    this.stock = this.add.text(1244, 33, '', { fontFamily: 'Microsoft YaHei, sans-serif', fontSize: '19px', color: '#4c6249', align: 'right', lineSpacing: 9 }).setOrigin(1, 0).setDepth(1100);
    this.add.text(985, 367, '农舍 · 今日收获', { fontFamily: 'Microsoft YaHei, sans-serif', fontSize: '17px', color: '#5f6a47' });
    this.trees = Array.from({ length: this.config.treeCount }, (_, index) => { const pos = treePosition(index);return new TreeActor(this, pos.x, pos.y); });
    this.wood = this.add.graphics().setDepth(530);
    this.particles = this.add.graphics().setDepth(1000);
    this.farmer = new FarmerActor(this);this.helper = new HelperActor(this);this.cart = new CartActor(this);
    const unsubscribe = this.controller.subscribe(s => { this.snapshot = s;this.animator.sync(s); });
    this.snapshot = this.controller.getSnapshot();this.animator.sync(this.snapshot);
    const uneffect = this.controller.onEffect(e => {
      // Controller emits effects before notifying snapshot subscribers; read the committed state first.
      this.snapshot = this.controller.getSnapshot();this.animator.sync(this.snapshot);this.animator.apply(e);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unsubscribe();uneffect();this.animator.dispose();
      this.farmer.destroy();this.helper.destroy();this.cart.destroy();this.trees.forEach(t => t.destroy());this.trees = [];
    });
  }
  update(_time: number, delta: number): void {
    if (!this.farmer) return;
    this.animator.advance(delta);
    const s = this.snapshot, f = this.animator.frame;
    const paint = JSON.stringify([f, s.phase, s.task, s.pauseReasons, s.choppedTrees, s.chopReps, s.groundLogs, s.cartLogs, s.deliveredLogs]);
    if (paint === this.lastPaint) return;
    this.lastPaint = paint;
    const impact = f.effects.find(e => e.kind === 'impact');
    for (let i = 0; i < this.trees.length; i++) this.trees[i]!.sync(i < s.choppedTrees,
      f.effects.find(e => e.kind === 'tree' && e.index === i)?.progress,
      s.task === 'chop' && i === impact?.index ? impact.progress : undefined);
    const actorTask = s.phase === 'active' || s.phase === 'countdown' ? s.task : null;
    this.farmer.sync(f.player.x, f.player.y, f.player.facing, f.action, actorTask, f.handLog, f.player.walking);
    this.helper.sync(f.npc);
    this.cart.sync(f.cart.x, f.cart.y, f.cartVisibleLogs, s.task === 'carry' && s.phase !== 'rest', f.carryProgress * 30);
    this.drawWood(f);this.drawEffects(f);
    const description = s.phase === 'rest' ? (s.task === 'load' ? '休息 · 归拢现有木材，推车靠近' : '休息 · 整理场地，固定车上货物')
      : s.phase === 'results' ? '已到家 · 今天的收获入库' : s.task === 'carry' ? '拉车 · 只随有效持姿时间前进'
      : s.phase === 'home' || s.phase === 'setup' ? '一片林地，一段属于你的好时光' : f.action === 'ready' && s.task === 'load' ? '准备 · 等待下蹲拾木' : phaseNames[f.action];
    this.caption.setText(`${s.pauseReasons.length ? '已暂停 / ' : ''}${description}`);
    this.stock.setText(`地面 ${s.groundLogs}    车上 ${s.cartLogs}    到家 ${s.deliveredLogs}\n禾禾是预设协作伙伴 · 阶段同步演示`);
    if (this.host) {
      const values = { action: f.action, fallen: String(s.choppedTrees), effects: f.effects.map(e => e.kind).join(','), npc: f.npc.mode,
        inventory: `${s.groundLogs}/${s.cartLogs}/${s.deliveredLogs}`, cartPosition: `${f.cart.x.toFixed(2)},${f.cart.y.toFixed(2)}` };
      for (const [key, value] of Object.entries(values)) if (this.host.dataset[key] !== value) this.host.dataset[key] = value;
      const label = `林间农场。${description}。地面木材${s.groundLogs}，车上${s.cartLogs}，到家${s.deliveredLogs}。NPC预设协作。`;
      if (this.host.getAttribute('aria-label') !== label) this.host.setAttribute('aria-label', label);
    }
  }
  private drawWood(f: FarmFrame): void {
    const g = this.wood;g.clear();
    const s = this.snapshot;
    if (s.task === 'chop' && s.phase === 'active') {
      const tree = treePosition(s.choppedTrees);
      for (let i = 0; i < this.config.repsPerTree; i++) {
        const x = tree.x - (this.config.repsPerTree - 1) * 7 + i * 14;
        g.fillStyle(i < s.chopReps % this.config.repsPerTree ? p.gold : 0x658057).fillCircle(x, tree.y + 26, 4);
      }
    }
    for (let i = 0; i < f.groundVisibleLogs; i++) {
      let x = 433 + i % 4 * 29, y = 551 - Math.floor(i / 4) * 15;
      if (i >= this.config.initialLogs && (s.task === 'chop' || (s.phase === 'rest' && s.task === 'load'))) {
        const origin = treePosition(Math.floor((i - this.config.initialLogs) / this.config.logsPerTree));
        const t = s.phase === 'rest' ? 1 - s.remainingMs / this.config.restMs : 0;
        x = origin.x + (x - origin.x) * t;y = origin.y + 5 + (y - origin.y - 5) * t;
      }
      drawLog(g, x, y, .85);
    }
    for (let i = 0; i < f.deliveredLogs; i++) drawLog(g, 1080 + i % 4 * 29, 370 - Math.floor(i / 4) * 14, .8);
  }
  private drawEffects(f: FarmFrame): void {
    const g = this.particles;g.clear();
    for (const e of f.effects) {
      if (e.kind === 'impact') {
        const target = e.index >= 0 ? treePosition(e.index) : { x: f.player.x + f.player.facing * 103, y: f.player.y - 45 };
        const x = target.x, y = target.y - 13;
        for (let i = 0; i < 7; i++) {
          const a = i * Math.PI * 2 / 7, r = 12 + e.progress * 42;
          g.fillStyle(i % 2 ? p.gold : p.cream, 1 - e.progress).fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r, 5, 9);
        }
      } else if (e.kind === 'log') {
        const t = e.progress, x = 570 + (f.cart.x - 570) * t, y = 410 + (f.cart.y - 110 - 410) * t - Math.sin(t * Math.PI) * 90;
        drawLog(g, x - 15, y, 1);
      }
    }
  }
}
