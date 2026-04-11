import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { PlayerData } from '../managers/PlayerData';
import { GachaManager, GachaResult } from '../managers/GachaManager';
import {
  PartRarity, PART_RARITY_COLORS, PART_RARITY_LABELS, PART_RARITY_BG,
  PART_SLOT_LABELS, PART_SLOT_ICONS, RARITY_BONUS, RARITY_FIRERATE_BONUS,
  EVOLUTION_COST, NEXT_RARITY, PART_RARITY_ORDER,
} from '../data/parts';

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
    this.add.text(GAME_WIDTH / 2, 40, '🎰 パーツガチャ', {
      fontSize: '28px', color: '#ffaa00', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.gemText = this.add.text(GAME_WIDTH / 2, 80, `💎 ${this.playerData.data.gems}`, {
      fontSize: '20px', color: '#44aaff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.pityText = this.add.text(GAME_WIDTH / 2, 105, this.getPityText(), {
      fontSize: '13px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 135, '排出: N 55%  R 33%  SR 12%', {
      fontSize: '11px', color: '#666666', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 153, '50回で SR確定 / 同パーツ3個で進化!', {
      fontSize: '11px', color: '#886644', fontFamily: 'monospace',
    }).setOrigin(0.5);

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

    const adPullBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, '📺 広告で無料ガチャ', {
      fontSize: '18px',
      color: '#ffaa00',
      fontFamily: 'monospace',
      backgroundColor: '#332200',
      padding: { x: 25, y: 10 },
    }).setOrigin(0.5).setInteractive();

    adPullBtn.on('pointerdown', () => {
      this.playerData.addGems(this.gachaManager.getCost());
      this.updateGemDisplay();
      this.doPull();
      adPullBtn.setText('✓ 使用済み');
      adPullBtn.removeInteractive();
    });

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
    const { line, rarity, newCount } = result;
    const color = PART_RARITY_COLORS[rarity];
    const bgColor = PART_RARITY_BG[rarity];
    const label = PART_RARITY_LABELS[rarity];
    const slotIcon = PART_SLOT_ICONS[line.slot];
    const slotLabel = PART_SLOT_LABELS[line.slot];
    const partName = line.names[rarity];

    const centerY = GAME_HEIGHT * 0.45;

    // Flash for SR
    if (rarity === 'sr') {
      this.cameras.main.flash(400, 200, 100, 255);
    } else if (rarity === 'r') {
      this.cameras.main.flash(200, 80, 120, 255);
    }

    // Card (taller to fit bonus abilities)
    const card = this.add.rectangle(GAME_WIDTH / 2, centerY, GAME_WIDTH - 80, 280, bgColor)
      .setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(color).color);
    this.resultContainer.push(card);

    // Rarity label
    const rarityText = this.add.text(GAME_WIDTH / 2, centerY - 90, label, {
      fontSize: '22px', color, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.resultContainer.push(rarityText);

    // Slot icon + label
    const slotText = this.add.text(GAME_WIDTH / 2, centerY - 63, `${slotIcon} ${slotLabel}`, {
      fontSize: '14px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.resultContainer.push(slotText);

    // Part icon
    const icon = this.add.text(GAME_WIDTH / 2, centerY - 25, slotIcon, {
      fontSize: '48px', color: '#' + line.color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5);
    this.resultContainer.push(icon);

    // Part name
    const nameText = this.add.text(GAME_WIDTH / 2, centerY + 18, partName, {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.resultContainer.push(nameText);

    // Copy count + evolution progress
    const nextRarity = NEXT_RARITY[rarity];
    let countStr = `所持: ${newCount}個`;
    if (nextRarity) {
      countStr += ` (進化まで ${newCount}/${EVOLUTION_COST})`;
    }
    const canEvolve = newCount >= EVOLUTION_COST && nextRarity;
    const countText = this.add.text(GAME_WIDTH / 2, centerY + 45, countStr, {
      fontSize: '14px',
      color: canEvolve ? '#00ff88' : '#aaaaaa',
      fontFamily: 'monospace',
      fontStyle: canEvolve ? 'bold' : 'normal',
    }).setOrigin(0.5);
    this.resultContainer.push(countText);

    if (canEvolve) {
      const evolveHint = this.add.text(GAME_WIDTH / 2, centerY + 63, '✨ 進化可能! ロビーで進化できます', {
        fontSize: '12px', color: '#00ff88', fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.resultContainer.push(evolveHint);
      this.tweens.add({ targets: evolveHint, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
    }

    // Stats
    const bonus = RARITY_BONUS[rarity];
    const hp = line.hp + bonus.hp;
    const atk = line.atk + bonus.atk;
    const spd = line.speed + bonus.speed;
    let statsStr = `HP:${hp} ATK:${atk} SPD:${spd}`;
    if (line.fireRate > 0) {
      statsStr += ` FR:${line.fireRate - RARITY_FIRERATE_BONUS[rarity]}ms`;
    }
    const statsText = this.add.text(GAME_WIDTH / 2, centerY + 82, statsStr, {
      fontSize: '12px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.resultContainer.push(statsText);

    // Ability
    let nextY = centerY + 99;
    if (line.abilityDesc) {
      const abilityText = this.add.text(GAME_WIDTH / 2, nextY, line.abilityDesc, {
        fontSize: '12px', color, fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.resultContainer.push(abilityText);
      nextY += 16;
    }

    // Bonus abilities (SR/UR/LR)
    if (line.bonusAbilities) {
      const ri = PART_RARITY_ORDER.indexOf(rarity);
      const tiers: { key: 'sr' | 'ur' | 'lr'; label: string; minRi: number }[] = [
        { key: 'sr', label: 'SR', minRi: 2 },
        { key: 'ur', label: 'UR', minRi: 3 },
        { key: 'lr', label: 'LR', minRi: 4 },
      ];
      for (const tier of tiers) {
        const ba = line.bonusAbilities[tier.key];
        if (!ba) continue;
        const unlocked = ri >= tier.minRi;
        const tierColor = unlocked ? PART_RARITY_COLORS[tier.key] : '#444444';
        const prefix = unlocked ? '✦' : '🔒';
        const baText = this.add.text(GAME_WIDTH / 2, nextY, `${prefix} ${tier.label}: ${ba.desc}`, {
          fontSize: '10px', color: tierColor, fontFamily: 'monospace',
        }).setOrigin(0.5);
        this.resultContainer.push(baText);
        nextY += 14;
      }
    }

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
