import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { PlayerData } from '../managers/PlayerData';
import { SHIPS, ShipDef } from '../data/ships';
import { UPGRADES, UpgradeDef } from '../data/upgrades';

export class LobbyScene extends Phaser.Scene {
  private playerData!: PlayerData;
  private selectedShipIndex: number = 0;
  private shipPreview!: Phaser.GameObjects.Text;
  private shipName!: Phaser.GameObjects.Text;
  private shipStats!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private gemText!: Phaser.GameObjects.Text;

  constructor() {
    super('LobbyScene');
  }

  create(): void {
    this.playerData = new PlayerData();
    this.createBackground();
    this.createCurrencyDisplay();
    this.createShipSelector();
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

  private createShipSelector(): void {
    this.add.text(GAME_WIDTH / 2, 70, '— 機体選択 —', {
      fontSize: '16px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Ship preview area
    const ownedShips = SHIPS.filter(s => this.playerData.data.ownedShips.includes(s.id));
    this.selectedShipIndex = ownedShips.findIndex(s => s.id === this.playerData.data.selectedShip);
    if (this.selectedShipIndex < 0) this.selectedShipIndex = 0;

    this.shipPreview = this.add.text(GAME_WIDTH / 2, 130, '▲', {
      fontSize: '48px', color: '#00ccff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.shipName = this.add.text(GAME_WIDTH / 2, 170, '', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.shipStats = this.add.text(GAME_WIDTH / 2, 195, '', {
      fontSize: '13px', color: '#aaaaaa', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5, 0);

    // Left/Right arrows
    const leftBtn = this.add.text(40, 130, '◀', {
      fontSize: '32px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive();
    leftBtn.on('pointerdown', () => {
      this.selectedShipIndex = (this.selectedShipIndex - 1 + ownedShips.length) % ownedShips.length;
      this.updateShipDisplay(ownedShips);
    });

    const rightBtn = this.add.text(GAME_WIDTH - 40, 130, '▶', {
      fontSize: '32px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive();
    rightBtn.on('pointerdown', () => {
      this.selectedShipIndex = (this.selectedShipIndex + 1) % ownedShips.length;
      this.updateShipDisplay(ownedShips);
    });

    this.updateShipDisplay(ownedShips);
  }

  private updateShipDisplay(ownedShips: ShipDef[]): void {
    const ship = ownedShips[this.selectedShipIndex];
    if (!ship) return;

    const rarityColors: Record<string, string> = { n: '#aaaaaa', r: '#4488ff', sr: '#ff44ff', ssr: '#ffaa00' };
    const rarityLabels: Record<string, string> = { n: 'N', r: 'R', sr: 'SR', ssr: 'SSR' };

    this.shipPreview.setColor('#' + ship.color.toString(16).padStart(6, '0'));
    this.shipName.setText(`[${rarityLabels[ship.rarity]}] ${ship.name}`);
    this.shipName.setColor(rarityColors[ship.rarity]);
    this.shipStats.setText(
      `HP:${ship.baseHp}  ATK:${ship.baseAtk}  SPD:${ship.baseSpeed}\nFIRE:${ship.fireRate}ms\n${ship.special}`
    );

    this.playerData.data.selectedShip = ship.id;
    this.playerData.save();
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
      this.scene.start('GameScene', {
        playerData: this.playerData,
        shipId: this.playerData.data.selectedShip,
      });
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
