import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { PlayerData } from '../managers/PlayerData';
import { GachaManager, GachaResult } from '../managers/GachaManager';
import { ShipRarity } from '../data/ships';

export class GachaScene extends Phaser.Scene {
  private playerData!: PlayerData;
  private gachaManager!: GachaManager;
  private resultContainer: Phaser.GameObjects.GameObject[] = [];
  private gemText!: Phaser.GameObjects.Text;
  private pityText!: Phaser.GameObjects.Text;

  constructor() {
    super('GachaScene');
  }

  create(data: { playerData: PlayerData }): void {
    this.playerData = data.playerData;
    this.gachaManager = new GachaManager();

    this.createBackground();
    this.createUI();
  }

  private createBackground(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x2a1a4e, 0x2a1a4e, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Sparkle particles
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const star = this.add.text(x, y, '✦', {
        fontSize: `${Math.random() * 12 + 8}px`,
        color: Math.random() > 0.5 ? '#ffdd88' : '#8888ff',
      }).setAlpha(Math.random() * 0.5 + 0.2);

      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: Math.random() * 2000 + 1000,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private createUI(): void {
    // Title
    this.add.text(GAME_WIDTH / 2, 40, '🎰 機体ガチャ', {
      fontSize: '28px', color: '#ffaa00', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Gem count
    this.gemText = this.add.text(GAME_WIDTH / 2, 80, `💎 ${this.playerData.data.gems}`, {
      fontSize: '20px', color: '#44aaff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Pity counter
    this.pityText = this.add.text(GAME_WIDTH / 2, 105, this.getPityText(), {
      fontSize: '13px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Rates info
    this.add.text(GAME_WIDTH / 2, 140, '排出率: N 60% | R 30% | SR 8% | SSR 2%', {
      fontSize: '11px', color: '#666666', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 158, '50回で SR以上確定', {
      fontSize: '11px', color: '#886644', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Pull button
    const pullBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 160, `ガチャを引く (💎${this.gachaManager.getCost()})`, {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#553300',
      padding: { x: 30, y: 12 },
    }).setOrigin(0.5).setInteractive();

    pullBtn.on('pointerdown', () => this.doPull());

    this.tweens.add({
      targets: pullBtn,
      scaleX: 1.04, scaleY: 1.04,
      duration: 700, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Free pull with ad
    const adPullBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, '📺 広告で無料ガチャ', {
      fontSize: '18px',
      color: '#ffaa00',
      fontFamily: 'monospace',
      backgroundColor: '#332200',
      padding: { x: 25, y: 10 },
    }).setOrigin(0.5).setInteractive();

    adPullBtn.on('pointerdown', () => {
      // Simulate watching ad, then give free gems and pull
      this.playerData.addGems(this.gachaManager.getCost());
      this.updateGemDisplay();
      this.doPull();
      adPullBtn.setText('✓ 使用済み');
      adPullBtn.removeInteractive();
    });

    // Back button
    this.add.text(15, GAME_HEIGHT - 35, '← ロビーに戻る', {
      fontSize: '16px', color: '#888888', fontFamily: 'monospace',
    }).setInteractive().on('pointerdown', () => {
      this.scene.start('LobbyScene');
    });
  }

  private doPull(): void {
    const result = this.gachaManager.pull(this.playerData);
    if (!result) {
      this.showMessage('💎が足りません!', '#ff4444');
      return;
    }

    this.clearResult();
    this.showGachaResult(result);
    this.updateGemDisplay();
  }

  private showGachaResult(result: GachaResult): void {
    const rarityColors: Record<ShipRarity, string> = {
      n: '#aaaaaa', r: '#4488ff', sr: '#ff44ff', ssr: '#ffaa00',
    };
    const rarityLabels: Record<ShipRarity, string> = {
      n: 'NORMAL', r: 'RARE', sr: 'SUPER RARE', ssr: 'SSR !!!',
    };
    const rarityBgColors: Record<ShipRarity, number> = {
      n: 0x222233, r: 0x112255, sr: 0x331155, ssr: 0x443300,
    };

    const centerY = GAME_HEIGHT * 0.45;

    // Flash for high rarity
    if (result.ship.rarity === 'ssr') {
      this.cameras.main.flash(500, 255, 200, 0);
    } else if (result.ship.rarity === 'sr') {
      this.cameras.main.flash(300, 200, 100, 255);
    }

    // Card
    const card = this.add.rectangle(GAME_WIDTH / 2, centerY, GAME_WIDTH - 80, 200, rarityBgColors[result.ship.rarity])
      .setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(rarityColors[result.ship.rarity]).color);
    this.resultContainer.push(card);

    // Rarity
    const rarityText = this.add.text(GAME_WIDTH / 2, centerY - 70, rarityLabels[result.ship.rarity], {
      fontSize: '22px', color: rarityColors[result.ship.rarity], fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.resultContainer.push(rarityText);

    // Ship icon
    const icon = this.add.text(GAME_WIDTH / 2, centerY - 20, '▲', {
      fontSize: '48px', color: '#' + result.ship.color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5);
    this.resultContainer.push(icon);

    // Ship name
    const nameText = this.add.text(GAME_WIDTH / 2, centerY + 30, result.ship.name, {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.resultContainer.push(nameText);

    // NEW / duplicate
    if (result.isNew) {
      const newLabel = this.add.text(GAME_WIDTH / 2, centerY + 60, '✨ NEW! ✨', {
        fontSize: '24px', color: '#00ff88', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.resultContainer.push(newLabel);
      this.tweens.add({ targets: newLabel, scaleX: 1.2, scaleY: 1.2, duration: 400, yoyo: true, repeat: 2 });
    } else {
      const dupLabel = this.add.text(GAME_WIDTH / 2, centerY + 60, `重複 → 🪙${result.coinRefund}に変換`, {
        fontSize: '16px', color: '#aaaaaa', fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.resultContainer.push(dupLabel);
    }

    // Stats
    const stats = this.add.text(GAME_WIDTH / 2, centerY + 85, `HP:${result.ship.baseHp} ATK:${result.ship.baseAtk} SPD:${result.ship.baseSpeed}`, {
      fontSize: '12px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.resultContainer.push(stats);

    // Entry animation
    card.setScale(0);
    this.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut' });
  }

  private clearResult(): void {
    for (const obj of this.resultContainer) obj.destroy();
    this.resultContainer = [];
  }

  private updateGemDisplay(): void {
    this.gemText.setText(`💎 ${this.playerData.data.gems}`);
    this.pityText.setText(this.getPityText());
  }

  private getPityText(): string {
    const pity = this.gachaManager.getPityCount(this.playerData);
    const threshold = this.gachaManager.getPityThreshold();
    return `天井まで: ${threshold - pity}回`;
  }

  private showMessage(msg: string, color: string): void {
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.45, msg, {
      fontSize: '22px', color, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({ targets: text, alpha: 0, y: text.y - 50, duration: 1500, onComplete: () => text.destroy() });
  }
}
