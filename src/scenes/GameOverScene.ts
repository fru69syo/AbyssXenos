import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { PlayerData } from '../managers/PlayerData';
import { AudioManager } from '../audio/AudioManager';

interface GameOverData {
  playerData: PlayerData;
  coins: number;
  stage: number;
  wave: number;
  skills: string[];
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(data: GameOverData): void {
    const { playerData, coins, stage, wave, skills } = data;
    AudioManager.get().stopBGM();

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0a1e);

    // Title (緊急生命維持システム作動 → 帰還メッセージ)
    this.add.text(GAME_WIDTH / 2, 60, '⚠ 緊急生命維持システム作動 ⚠', {
      fontSize: '18px',
      color: '#ffaa00',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 95, '帰還します', {
      fontSize: '26px',
      color: '#ff6644',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Stats
    const statsY = 160;
    this.add.text(GAME_WIDTH / 2, statsY, `到達ステージ: ${stage}`, {
      fontSize: '22px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, statsY + 35, `到達ウェーブ: ${wave}`, {
      fontSize: '18px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, statsY + 70, `獲得コイン: 🪙 ${coins}`, {
      fontSize: '22px', color: '#ffd700', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Skills used
    if (skills.length > 0) {
      this.add.text(GAME_WIDTH / 2, statsY + 115, '取得スキル:', {
        fontSize: '16px', color: '#888888', fontFamily: 'monospace',
      }).setOrigin(0.5);

      const skillText = skills.slice(0, 6).join('、');
      this.add.text(GAME_WIDTH / 2, statsY + 140, skillText, {
        fontSize: '13px', color: '#aaaacc', fontFamily: 'monospace',
        wordWrap: { width: GAME_WIDTH - 40 }, align: 'center',
      }).setOrigin(0.5, 0);
    }

    // Total coins
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 250, `所持コイン: 🪙 ${playerData.data.coins}`, {
      fontSize: '16px', color: '#888866', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Retry button
    const retryBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 180, '⚔  再出撃', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#004466',
      padding: { x: 45, y: 15 },
    }).setOrigin(0.5).setInteractive();

    retryBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { playerData, startStageIndex: stage - 1 });
    });

    this.tweens.add({
      targets: retryBtn,
      scaleX: 1.04, scaleY: 1.04,
      duration: 700, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Lobby button
    const lobbyBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 110, 'ロビーに戻る', {
      fontSize: '20px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
      backgroundColor: '#222222',
      padding: { x: 35, y: 10 },
    }).setOrigin(0.5).setInteractive();

    lobbyBtn.on('pointerdown', () => {
      this.scene.start('LobbyScene');
    });

    // Rewarded ad button (continue)
    const adBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, '📺 広告を見てコイン2倍', {
      fontSize: '15px',
      color: '#ffaa00',
      fontFamily: 'monospace',
      backgroundColor: '#332200',
      padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive();

    adBtn.on('pointerdown', () => {
      // Simulate rewarded ad
      playerData.addCoins(coins);
      adBtn.setText('✓ コイン2倍獲得済み!');
      adBtn.removeInteractive();
      adBtn.setColor('#00ff88');
    });
  }
}
