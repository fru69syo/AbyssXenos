import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { AudioManager } from '../audio/AudioManager';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create(): void {
    // Overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.32, 'PAUSED', {
      fontSize: '40px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Resume button
    const resumeBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.46, '▶  再開', {
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

    // Audio toggles
    this.createAudioToggles(GAME_HEIGHT * 0.57);

    // Quit button
    const quitBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.72, '✕  ロビーに戻る', {
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

  private createAudioToggles(y: number): void {
    const am = AudioManager.get();

    const bgmBtn = this.add.text(GAME_WIDTH / 2 - 70, y, '', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
      backgroundColor: '#222244', padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setInteractive();
    const seBtn = this.add.text(GAME_WIDTH / 2 + 70, y, '', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
      backgroundColor: '#222244', padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setInteractive();

    const refresh = () => {
      bgmBtn.setText(`BGM: ${am.muteBGM ? 'OFF' : 'ON'}`);
      seBtn.setText(`SE: ${am.muteSE ? 'OFF' : 'ON'}`);
      bgmBtn.setStyle({ color: am.muteBGM ? '#888888' : '#ffffff' });
      seBtn.setStyle({ color: am.muteSE ? '#888888' : '#ffffff' });
    };
    refresh();

    bgmBtn.on('pointerdown', () => {
      am.setMuteBGM(!am.muteBGM);
      if (!am.muteBGM) am.playBGM('battle');
      refresh();
    });
    seBtn.on('pointerdown', () => {
      am.setMuteSE(!am.muteSE);
      refresh();
    });
  }
}
