import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { PlayerData } from '../managers/PlayerData';
import {
  PartSlot, PART_SLOTS, PART_SLOT_LABELS, PART_SLOT_ICONS,
  getPartById, getPartsBySlot, calcPartStats,
  PART_RARITY_COLORS, PART_RARITY_LABELS, PRESETS,
} from '../data/parts';
import { UPGRADES } from '../data/upgrades';

export class LobbyScene extends Phaser.Scene {
  private playerData!: PlayerData;
  private coinText!: Phaser.GameObjects.Text;
  private gemText!: Phaser.GameObjects.Text;
  private slotTexts: Phaser.GameObjects.Text[] = [];
  private statsText!: Phaser.GameObjects.Text;
  private partSelectContainer: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('LobbyScene');
  }

  create(): void {
    this.playerData = new PlayerData();
    this.createBackground();
    this.createCurrencyDisplay();
    this.createPartsDisplay();
    this.createUpgradePanel();
    this.createButtons();
  }

  private createBackground(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a0a3e, 0x1a0a3e, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (let i = 0; i < 60; i++) {
      g.fillStyle(0xffffff, Math.random() * 0.4 + 0.1);
      g.fillCircle(Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT, Math.random() * 1.5 + 0.5);
    }
  }

  private createCurrencyDisplay(): void {
    this.coinText = this.add.text(15, 15, `🪙 ${this.playerData.data.coins}`, {
      fontSize: '18px', color: '#ffd700', fontFamily: 'monospace',
    });
    this.gemText = this.add.text(15, 40, `💎 ${this.playerData.data.gems}`, {
      fontSize: '18px', color: '#44aaff', fontFamily: 'monospace',
    });

    this.add.text(GAME_WIDTH / 2, 15, 'LOBBY', {
      fontSize: '24px', color: COLORS.UI_ACCENT, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
  }

  private createPartsDisplay(): void {
    this.add.text(GAME_WIDTH / 2, 60, '— パーツ装備 —', {
      fontSize: '16px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const startY = 85;
    const rowHeight = 28;

    PART_SLOTS.forEach((slot, i) => {
      const y = startY + i * rowHeight;

      // Slot icon
      this.add.text(15, y, PART_SLOT_ICONS[slot], {
        fontSize: '14px', color: '#888888', fontFamily: 'monospace',
      });

      // Slot label
      this.add.text(32, y, PART_SLOT_LABELS[slot], {
        fontSize: '11px', color: '#666666', fontFamily: 'monospace',
      });

      // Part name (interactive, updates on equip)
      const partText = this.add.text(110, y, '', {
        fontSize: '13px', color: '#ffffff', fontFamily: 'monospace',
      }).setInteractive();

      partText.on('pointerdown', () => this.openPartSelect(slot));
      this.slotTexts.push(partText);
    });

    // Stats summary
    this.statsText = this.add.text(GAME_WIDTH / 2, startY + PART_SLOTS.length * rowHeight + 8, '', {
      fontSize: '12px', color: '#aaaaaa', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5, 0);

    this.updatePartsDisplay();
  }

  private updatePartsDisplay(): void {
    const equipped = this.playerData.data.equippedParts as Record<PartSlot, string>;

    PART_SLOTS.forEach((slot, i) => {
      const partId = equipped[slot];
      const part = partId ? getPartById(partId) : null;
      if (part) {
        const color = PART_RARITY_COLORS[part.rarity];
        const label = PART_RARITY_LABELS[part.rarity];
        this.slotTexts[i].setText(`[${label}] ${part.name}`);
        this.slotTexts[i].setColor(color);
      } else {
        this.slotTexts[i].setText('— 未装備 —');
        this.slotTexts[i].setColor('#444444');
      }
    });

    const stats = calcPartStats(equipped);
    this.statsText.setText(`HP:${stats.hp}  ATK:${stats.atk}  SPD:${stats.speed}  FR:${stats.fireRate}ms`);
  }

  private openPartSelect(slot: PartSlot): void {
    // Close existing popup
    this.closePartSelect();

    const ownedParts = this.playerData.data.ownedParts;
    const allSlotParts = getPartsBySlot(slot);
    const available = allSlotParts.filter(p => ownedParts.includes(p.id));

    if (available.length === 0) return;

    // Overlay
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setInteractive().setDepth(10);
    overlay.on('pointerdown', () => this.closePartSelect());
    this.partSelectContainer.push(overlay);

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 100, `${PART_SLOT_ICONS[slot]} ${PART_SLOT_LABELS[slot]}を選択`, {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);
    this.partSelectContainer.push(title);

    const equipped = this.playerData.data.equippedParts as Record<PartSlot, string>;
    const cardHeight = 55;
    const gap = 8;
    const startY = 140;

    available.forEach((part, i) => {
      const y = startY + i * (cardHeight + gap);
      const isEquipped = equipped[slot] === part.id;
      const color = PART_RARITY_COLORS[part.rarity];
      const bgColor = isEquipped ? 0x223344 : 0x111122;

      const card = this.add.rectangle(GAME_WIDTH / 2, y + cardHeight / 2, GAME_WIDTH - 40, cardHeight, bgColor)
        .setStrokeStyle(isEquipped ? 2 : 1, Phaser.Display.Color.HexStringToColor(color).color)
        .setInteractive().setDepth(11);
      this.partSelectContainer.push(card);

      // Rarity + name
      const nameText = this.add.text(30, y + 8, `[${PART_RARITY_LABELS[part.rarity]}] ${part.name}`, {
        fontSize: '14px', color, fontFamily: 'monospace', fontStyle: 'bold',
      }).setDepth(12);
      this.partSelectContainer.push(nameText);

      // Stats
      let statsStr = `HP:${part.hp} ATK:${part.atk} SPD:${part.speed}`;
      if (part.fireRate > 0) statsStr += ` FR:${part.fireRate}ms`;
      const statsText = this.add.text(30, y + 28, statsStr, {
        fontSize: '10px', color: '#888888', fontFamily: 'monospace',
      }).setDepth(12);
      this.partSelectContainer.push(statsText);

      // Ability
      if (part.abilityDesc) {
        const abilText = this.add.text(GAME_WIDTH - 30, y + 28, part.abilityDesc, {
          fontSize: '10px', color: '#aaaacc', fontFamily: 'monospace',
        }).setOrigin(1, 0).setDepth(12);
        this.partSelectContainer.push(abilText);
      }

      // Equipped marker
      if (isEquipped) {
        const eqMark = this.add.text(GAME_WIDTH - 30, y + 8, '装備中', {
          fontSize: '11px', color: '#00ff88', fontFamily: 'monospace',
        }).setOrigin(1, 0).setDepth(12);
        this.partSelectContainer.push(eqMark);
      }

      card.on('pointerdown', () => {
        this.playerData.equipPart(slot, part.id);
        this.closePartSelect();
        this.updatePartsDisplay();
      });
    });
  }

  private closePartSelect(): void {
    for (const obj of this.partSelectContainer) obj.destroy();
    this.partSelectContainer = [];
  }

  private createUpgradePanel(): void {
    this.add.text(GAME_WIDTH / 2, 275, '— 恒久アップグレード —', {
      fontSize: '16px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5);

    UPGRADES.forEach((upg, i) => {
      const y = 310 + i * 50;
      const level = this.playerData.getUpgradeLevel(upg.id);
      const cost = Math.floor(upg.baseCost * Math.pow(upg.costMultiplier, level));
      const maxed = level >= upg.maxLevel;

      this.add.text(15, y, upg.name, {
        fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
      });

      this.add.text(15, y + 18, `Lv.${level}/${upg.maxLevel}  ${upg.description}`, {
        fontSize: '11px', color: '#888888', fontFamily: 'monospace',
      });

      const btnText = maxed ? 'MAX' : `🪙${cost}`;
      const btn = this.add.text(GAME_WIDTH - 20, y + 8, btnText, {
        fontSize: '14px',
        color: maxed ? '#666666' : '#ffd700',
        fontFamily: 'monospace',
        backgroundColor: maxed ? '#222222' : '#333300',
        padding: { x: 8, y: 4 },
      }).setOrigin(1, 0.5).setInteractive();

      if (!maxed) {
        btn.on('pointerdown', () => {
          if (this.playerData.spendCoins(cost)) {
            this.playerData.setUpgradeLevel(upg.id, level + 1);
            this.scene.restart();
          }
        });
      }
    });
  }

  private createButtons(): void {
    // Start Run button
    const startBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 130, '⚔  出撃  ⚔', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#004466',
      padding: { x: 50, y: 15 },
    }).setOrigin(0.5).setInteractive();

    startBtn.on('pointerover', () => startBtn.setStyle({ backgroundColor: '#006699' }));
    startBtn.on('pointerout', () => startBtn.setStyle({ backgroundColor: '#004466' }));
    startBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { playerData: this.playerData });
    });

    this.tweens.add({
      targets: startBtn,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Gacha button
    const gachaBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 65, '🎰  ガチャ', {
      fontSize: '22px',
      color: '#ffaa00',
      fontFamily: 'monospace',
      backgroundColor: '#332200',
      padding: { x: 35, y: 10 },
    }).setOrigin(0.5).setInteractive();

    gachaBtn.on('pointerdown', () => {
      this.scene.start('GachaScene', { playerData: this.playerData });
    });

    // Back to title
    this.add.text(15, GAME_HEIGHT - 30, '← タイトル', {
      fontSize: '14px', color: '#666666', fontFamily: 'monospace',
    }).setInteractive().on('pointerdown', () => {
      this.scene.start('TitleScene');
    });
  }
}
