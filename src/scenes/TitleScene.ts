import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { AudioManager } from '../audio/AudioManager';

export class TitleScene extends Phaser.Scene {
  private bgStars: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super('TitleScene');
  }

  create(): void {
    AudioManager.get().playBGM('lobby');
    // Parallax star background
    this.createStarfield();

    // Title
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.25, 'ABYSS', {
      fontSize: '64px',
      color: COLORS.UI_ACCENT,
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.25 + 70, 'XENOS', {
      fontSize: '56px',
      color: '#ff4488',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.25 + 130, '~ 深海からの侵略者 ~', {
      fontSize: '16px',
      color: '#8888cc',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Start button
    const startBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.55, '▶  START', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#004466',
      padding: { x: 40, y: 15 },
    }).setOrigin(0.5).setInteractive();

    startBtn.on('pointerover', () => startBtn.setStyle({ backgroundColor: '#006699' }));
    startBtn.on('pointerout', () => startBtn.setStyle({ backgroundColor: '#004466' }));
    startBtn.on('pointerdown', () => {
      this.scene.start('LobbyScene');
    });

    // Pulsing animation
    this.tweens.add({
      targets: startBtn,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Version
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'v0.1.0', {
      fontSize: '12px',
      color: '#555555',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  private createStarfield(): void {
    const g = this.add.graphics();
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const size = Math.random() * 2 + 0.5;
      const alpha = Math.random() * 0.5 + 0.3;
      g.fillStyle(0xffffff, alpha);
      g.fillCircle(x, y, size);
    }
  }

  update(_time: number, _delta: number): void {
    // Stars could animate here
  }
}
