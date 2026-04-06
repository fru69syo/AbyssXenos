import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create(): void {
    // Overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.35, 'PAUSED', {
      fontSize: '40px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Resume button
    const resumeBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.5, '▶  再開', {
      fontSize: '28px',
      color: '#00ccff',
      fontFamily: 'monospace',
      backgroundColor: '#003344',
      padding: { x: 40, y: 12 },
    }).setOrigin(0.5).setInteractive();

    resumeBtn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume('GameScene');
    });

    // Quit button
    const quitBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.62, '✕  ロビーに戻る', {
      fontSize: '20px',
      color: '#ff4444',
      fontFamily: 'monospace',
      backgroundColor: '#330000',
      padding: { x: 30, y: 10 },
    }).setOrigin(0.5).setInteractive();

    quitBtn.on('pointerdown', () => {
      this.scene.stop('GameScene');
      this.scene.stop();
      this.scene.start('LobbyScene');
    });
  }
}
