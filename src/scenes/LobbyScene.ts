import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { PlayerData } from '../managers/PlayerData';
import {
  PartSlot, PartRarity, PART_SLOTS, PART_SLOT_LABELS, PART_SLOT_ICONS,
  getPartLineById, calcPartStats, parsePartKey, partKey,
  PART_RARITY_COLORS, PART_RARITY_LABELS, PART_RARITY_BG,
  RARITY_BONUS, RARITY_FIRERATE_BONUS,
  EVOLUTION_COST, NEXT_RARITY,
} from '../data/parts';
import { UPGRADES } from '../data/upgrades';

export class LobbyScene extends Phaser.Scene {
  private playerData!: PlayerData;
  private coinText!: Phaser.GameObjects.Text;
  private gemText!: Phaser.GameObjects.Text;
  private slotTexts: Phaser.GameObjects.Text[] = [];
  private statsText!: Phaser.GameObjects.Text;
  private popupContainer: Phaser.GameObjects.GameObject[] = [];

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

      this.add.text(15, y, PART_SLOT_ICONS[slot], {
        fontSize: '14px', color: '#888888', fontFamily: 'monospace',
      });

      this.add.text(32, y, PART_SLOT_LABELS[slot], {
        fontSize: '11px', color: '#666666', fontFamily: 'monospace',
      });

      const partText = this.add.text(110, y, '', {
        fontSize: '13px', color: '#ffffff', fontFamily: 'monospace',
      }).setInteractive();

      partText.on('pointerdown', () => this.openPartSelect(slot));
      this.slotTexts.push(partText);
    });

    this.statsText = this.add.text(GAME_WIDTH / 2, startY + PART_SLOTS.length * rowHeight + 8, '', {
      fontSize: '12px', color: '#aaaaaa', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5, 0);

    this.updatePartsDisplay();
  }

  private updatePartsDisplay(): void {
    const equipped = this.playerData.data.equippedParts as Record<PartSlot, string>;

    PART_SLOTS.forEach((slot, i) => {
      const key = equipped[slot];
      if (!key || !key.includes(':')) {
        this.slotTexts[i].setText('— 未装備 —');
        this.slotTexts[i].setColor('#444444');
        return;
      }
      const { lineId, rarity } = parsePartKey(key);
      const line = getPartLineById(lineId);
      if (line) {
        const color = PART_RARITY_COLORS[rarity];
        const label = PART_RARITY_LABELS[rarity];
        this.slotTexts[i].setText(`[${label}] ${line.names[rarity]}`);
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
    this.closePopup();

    const ownedParts = this.playerData.getOwnedPartsForSlot(slot);
    if (ownedParts.length === 0) return;

    const equipped = this.playerData.data.equippedParts as Record<PartSlot, string>;

    // Overlay
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setInteractive().setDepth(10);
    overlay.on('pointerdown', () => this.closePopup());
    this.popupContainer.push(overlay);

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 80, `${PART_SLOT_ICONS[slot]} ${PART_SLOT_LABELS[slot]}を選択`, {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);
    this.popupContainer.push(title);

    const cardHeight = 65;
    const gap = 6;
    const startY = 115;

    ownedParts.forEach((item, i) => {
      const y = startY + i * (cardHeight + gap);
      const line = getPartLineById(item.lineId);
      if (!line) return;

      const isEquipped = equipped[slot] === item.key;
      const color = PART_RARITY_COLORS[item.rarity];
      const bgColor = isEquipped ? 0x223344 : 0x111122;

      const card = this.add.rectangle(GAME_WIDTH / 2, y + cardHeight / 2, GAME_WIDTH - 30, cardHeight, bgColor)
        .setStrokeStyle(isEquipped ? 2 : 1, Phaser.Display.Color.HexStringToColor(color).color)
        .setInteractive().setDepth(11);
      this.popupContainer.push(card);

      // Rarity + name
      const rLabel = PART_RARITY_LABELS[item.rarity];
      const partName = line.names[item.rarity];
      const nameText = this.add.text(22, y + 6, `[${rLabel}] ${partName}`, {
        fontSize: '13px', color, fontFamily: 'monospace', fontStyle: 'bold',
      }).setDepth(12);
      this.popupContainer.push(nameText);

      // Count + evolution
      const nextRarity = NEXT_RARITY[item.rarity];
      const canEvolve = this.playerData.canEvolve(item.lineId, item.rarity);
      let countStr = `×${item.count}`;
      if (nextRarity) {
        countStr += ` (${item.count}/${EVOLUTION_COST})`;
      }
      const countText = this.add.text(22, y + 24, countStr, {
        fontSize: '10px', color: canEvolve ? '#00ff88' : '#888888', fontFamily: 'monospace',
      }).setDepth(12);
      this.popupContainer.push(countText);

      // Stats
      const bonus = RARITY_BONUS[item.rarity];
      const hp = line.hp + bonus.hp;
      const atk = line.atk + bonus.atk;
      const spd = line.speed + bonus.speed;
      let statsStr = `HP:${hp} ATK:${atk} SPD:${spd}`;
      if (line.fireRate > 0) {
        statsStr += ` FR:${line.fireRate - RARITY_FIRERATE_BONUS[item.rarity]}ms`;
      }
      const statsText = this.add.text(22, y + 38, statsStr, {
        fontSize: '9px', color: '#777777', fontFamily: 'monospace',
      }).setDepth(12);
      this.popupContainer.push(statsText);

      // Ability
      if (line.abilityDesc) {
        const abilText = this.add.text(22, y + 50, line.abilityDesc, {
          fontSize: '9px', color: '#aaaacc', fontFamily: 'monospace',
        }).setDepth(12);
        this.popupContainer.push(abilText);
      }

      // Right side: equip marker or evolve button
      if (isEquipped) {
        const eqMark = this.add.text(GAME_WIDTH - 22, y + 10, '装備中', {
          fontSize: '11px', color: '#00ff88', fontFamily: 'monospace',
        }).setOrigin(1, 0).setDepth(12);
        this.popupContainer.push(eqMark);
      }

      // Evolve button
      if (canEvolve && nextRarity) {
        const evolveBtn = this.add.text(GAME_WIDTH - 22, y + 36, `進化→${PART_RARITY_LABELS[nextRarity]}`, {
          fontSize: '11px', color: '#000000', fontFamily: 'monospace', fontStyle: 'bold',
          backgroundColor: '#00ff88', padding: { x: 6, y: 3 },
        }).setOrigin(1, 0).setDepth(13).setInteractive();
        this.popupContainer.push(evolveBtn);

        evolveBtn.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          pointer.event.stopPropagation();
          this.playerData.evolvePart(item.lineId, item.rarity);
          this.closePopup();
          this.updatePartsDisplay();
          // 進化演出
          this.cameras.main.flash(400, 0, 255, 136);
          this.openPartSelect(slot); // リロード
        });
      }

      // Tap card to equip
      card.on('pointerdown', () => {
        this.playerData.equipPart(slot, item.key);
        this.closePopup();
        this.updatePartsDisplay();
      });
    });
  }

  private closePopup(): void {
    for (const obj of this.popupContainer) obj.destroy();
    this.popupContainer = [];
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
      scaleX: 1.03, scaleY: 1.03,
      duration: 600, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });

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

    this.add.text(15, GAME_HEIGHT - 30, '← タイトル', {
      fontSize: '14px', color: '#666666', fontFamily: 'monospace',
    }).setInteractive().on('pointerdown', () => {
      this.scene.start('TitleScene');
    });
  }
}
