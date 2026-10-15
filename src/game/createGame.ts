import Phaser from 'phaser';
import type { DemoConfig } from '../config/demoConfig.js';
import type { SessionController } from '../domain/types.js';
import { FarmScene } from './FarmScene.js';

/** Rendering subscribes to authority; it never advances the session clock. */
export function createGame(parent: HTMLElement, controller: SessionController, config: Readonly<DemoConfig>): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO, parent, width: 1280, height: 720, backgroundColor: '#95c6ac',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [new FarmScene(controller, config)],
    audio: { noAudio: true },
    callbacks: { postBoot: () => { parent.dataset.renderer = `Phaser ${Phaser.VERSION}`; } },
  });
}
