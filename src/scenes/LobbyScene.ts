import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { PlayerData } from '../managers/PlayerData';
import {
  PartSlot, PART_SLOTS, PART_SLOT_LABELS, PART_SLOT_ICONS,
  getPartLineById, calcPartStats, parsePartKey,
  PART_RARITY_COLORS, PART_RARITY_LABELS, PART_RARITY_BG,
  RARITY_BONUS, RARITY_FIRERATE_BONUS,
  EVOLUTION_COST, NEXT_RARITY, PART_RARITY_ORDER,
} from '../data/parts';
import { UPGRADES } from '../data/upgrades';
import { STAGES } from '../data/stages';
import { AudioManager } from '../audio/AudioManager';
import { GachaManager, GachaResult } from '../managers/GachaManager';

type TabKey = 'shop' | 'upgrade' | 'top' | 'parts' | 'gacha' | 'debug';
const TAB_ORDER: TabKey[] = ['shop', 'upgrade', 'top', 'parts', 'gacha', 'debug'];
const TAB_LABELS: Record<TabKey, string> = {
  shop: 'ショップ',
  upgrade: 'アップグレード',
  top: 'トップ',
  parts: 'パーツ',
  gacha: 'ガチャ',
  debug: 'デバッグ',
};
const TAB_ICONS: Record<TabKey, string> = {
  shop: '🛒',
  upgrade: '⬆',
  top: '🏠',
  parts: '🔧',
  gacha: '🎰',
  debug: '🛠',
};

const NAV_HEIGHT = 66;
const HEADER_HEIGHT = 56;

export class LobbyScene extends Phaser.Scene {
  private playerData!: PlayerData;
  private coinText!: Phaser.GameObjects.Text;
  private gemText!: Phaser.GameObjects.Text;
  private slotTexts: Phaser.GameObjects.Text[] = [];
  private statsText!: Phaser.GameObjects.Text;
  private popupContainer: Phaser.GameObjects.GameObject[] = [];

  private tabContainers!: Record<TabKey, Phaser.GameObjects.Container>;
  private currentTab: TabKey = 'top';
  private navButtons: { rect: Phaser.GameObjects.Rectangle; iconText: Phaser.GameObjects.Text; labelText: Phaser.GameObjects.Text; key: TabKey }[] = [];

  // Carousel state
  private stageCards: Phaser.GameObjects.Container[] = [];
  private selectedStageIndex: number = 0;
  private carouselRoot!: Phaser.GameObjects.Container;
  private stageIndicatorText!: Phaser.GameObjects.Text;
  private launchBtn!: Phaser.GameObjects.Text;
  private swipeStartX: number = 0;
  private swipeActive: boolean = false;

  // Gacha state
  private gachaManager!: GachaManager;
  private gachaGemText!: Phaser.GameObjects.Text;
  private gachaPityText!: Phaser.GameObjects.Text;
  private gachaAdBtn!: Phaser.GameObjects.Text;
  private gachaResultContainer: Phaser.GameObjects.GameObject[] = [];
  private gachaAdUsed: boolean = false;

  // Popup scroll state
  private popupScrollContainer: Phaser.GameObjects.Container | null = null;
  private popupScrollMin: number = 0;
  private popupScrollMax: number = 0;
  private popupScrollBaseY: number = 0;
  private popupScrollLastY: number = 0;
  private popupScrollDragAccum: number = 0;
  private popupScrollActive: boolean = false;
  private popupOpenedAt: number = 0;

  constructor() {
    super('LobbyScene');
  }

  create(): void {
    this.playerData = new PlayerData();
    AudioManager.get().playBGM('lobby');

    this.slotTexts = [];
    this.popupContainer = [];
    this.stageCards = [];
    this.navButtons = [];
    this.gachaResultContainer = [];
    this.gachaAdUsed = false;
    this.gachaManager = new GachaManager();

    const highest = this.playerData.data.highestStage;
    this.selectedStageIndex = Phaser.Math.Clamp(highest, 0, STAGES.length - 1);

    this.createBackground();
    this.createHeader();
    this.createTabContainers();
    this.createBottomNav();
    this.setupSwipeInput();

    this.setTab('top');
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

  // ---------- Header ----------

  private createHeader(): void {
    // Header backdrop
    const bar = this.add.rectangle(GAME_WIDTH / 2, HEADER_HEIGHT / 2, GAME_WIDTH, HEADER_HEIGHT, 0x000010, 0.5);
    bar.setDepth(1);

    this.coinText = this.add.text(12, 8, `🪙 ${this.playerData.data.coins}`, {
      fontSize: '16px', color: '#ffd700', fontFamily: 'monospace',
    }).setDepth(2);

    this.gemText = this.add.text(12, 32, `💎 ${this.playerData.data.gems}`, {
      fontSize: '16px', color: '#44aaff', fontFamily: 'monospace',
    }).setDepth(2);

    this.add.text(GAME_WIDTH / 2, 12, 'LOBBY', {
      fontSize: '22px', color: COLORS.UI_ACCENT, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(2);

    // Title back button (top-right area, above audio toggles)
    const backBtn = this.add.text(GAME_WIDTH - 12, 8, '← タイトル', {
      fontSize: '13px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(1, 0).setInteractive().setDepth(2);
    backBtn.on('pointerdown', () => {
      this.scene.start('TitleScene');
    });

    // Audio toggles below back button
    this.createAudioToggles(GAME_WIDTH - 12, 30);
  }

  private createAudioToggles(rightX: number, y: number): void {
    const am = AudioManager.get();
    const seBtn = this.add.text(rightX, y, '', {
      fontSize: '12px', color: '#ffffff', fontFamily: 'monospace',
      backgroundColor: '#222244', padding: { x: 5, y: 2 },
    }).setOrigin(1, 0).setInteractive().setDepth(2);
    const bgmBtn = this.add.text(rightX - 68, y, '', {
      fontSize: '12px', color: '#ffffff', fontFamily: 'monospace',
      backgroundColor: '#222244', padding: { x: 5, y: 2 },
    }).setOrigin(1, 0).setInteractive().setDepth(2);

    const refresh = () => {
      bgmBtn.setText(`BGM ${am.muteBGM ? 'OFF' : 'ON'}`);
      seBtn.setText(`SE ${am.muteSE ? 'OFF' : 'ON'}`);
      bgmBtn.setStyle({ color: am.muteBGM ? '#888888' : '#ffffff' });
      seBtn.setStyle({ color: am.muteSE ? '#888888' : '#ffffff' });
    };
    refresh();

    bgmBtn.on('pointerdown', () => {
      am.setMuteBGM(!am.muteBGM);
      if (!am.muteBGM) am.playBGM('lobby');
      refresh();
    });
    seBtn.on('pointerdown', () => {
      am.setMuteSE(!am.muteSE);
      refresh();
    });
  }

  private refreshCurrencyDisplay(): void {
    this.coinText.setText(`🪙 ${this.playerData.data.coins}`);
    this.gemText.setText(`💎 ${this.playerData.data.gems}`);
  }

  // ---------- Tab containers ----------

  private createTabContainers(): void {
    this.tabContainers = {
      shop: this.add.container(0, 0).setVisible(false),
      upgrade: this.add.container(0, 0).setVisible(false),
      top: this.add.container(0, 0).setVisible(false),
      parts: this.add.container(0, 0).setVisible(false),
      gacha: this.add.container(0, 0).setVisible(false),
      debug: this.add.container(0, 0).setVisible(false),
    };
    this.createShopTab(this.tabContainers.shop);
    this.createUpgradeTab(this.tabContainers.upgrade);
    this.createTopTab(this.tabContainers.top);
    this.createPartsTab(this.tabContainers.parts);
    this.createGachaTab(this.tabContainers.gacha);
    this.createDebugTab(this.tabContainers.debug);
  }

  // ---------- SHOP tab ----------

  private createShopTab(container: Phaser.GameObjects.Container): void {
    const title = this.add.text(GAME_WIDTH / 2, HEADER_HEIGHT + 30, '🛒 ショップ', {
      fontSize: '26px', color: '#ffaa00', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    const msg = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, '準備中', {
      fontSize: '34px', color: '#666666', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const sub = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, '近日実装予定', {
      fontSize: '18px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);

    container.add([title, msg, sub]);
  }

  // ---------- UPGRADE tab ----------

  private createUpgradeTab(container: Phaser.GameObjects.Container): void {
    const title = this.add.text(GAME_WIDTH / 2, HEADER_HEIGHT + 20, '— 恒久アップグレード —', {
      fontSize: '18px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5);
    container.add(title);

    const startY = HEADER_HEIGHT + 60;
    UPGRADES.forEach((upg, i) => {
      const y = startY + i * 68;
      const level = this.playerData.getUpgradeLevel(upg.id);
      const cost = Math.floor(upg.baseCost * Math.pow(upg.costMultiplier, level));
      const maxed = level >= upg.maxLevel;

      const nameText = this.add.text(15, y, upg.name, {
        fontSize: '17px', color: '#ffffff', fontFamily: 'monospace',
      });

      const descText = this.add.text(15, y + 24, `Lv.${level}/${upg.maxLevel}  ${upg.description}`, {
        fontSize: '12px', color: '#888888', fontFamily: 'monospace', wordWrap: { width: GAME_WIDTH - 110 },
      });

      const btnText = maxed ? 'MAX' : `🪙${cost}`;
      const btn = this.add.text(GAME_WIDTH - 20, y + 18, btnText, {
        fontSize: '16px',
        color: maxed ? '#666666' : '#ffd700',
        fontFamily: 'monospace',
        backgroundColor: maxed ? '#222222' : '#333300',
        padding: { x: 10, y: 6 },
      }).setOrigin(1, 0.5).setInteractive();

      if (!maxed) {
        btn.on('pointerdown', () => {
          if (this.playerData.spendCoins(cost)) {
            this.playerData.setUpgradeLevel(upg.id, level + 1);
            this.scene.restart();
          }
        });
      }

      container.add([nameText, descText, btn]);
    });
  }

  // ---------- PARTS tab ----------

  private createPartsTab(container: Phaser.GameObjects.Container): void {
    const title = this.add.text(GAME_WIDTH / 2, HEADER_HEIGHT + 20, '— パーツ装備 —', {
      fontSize: '18px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5);
    container.add(title);

    const startY = HEADER_HEIGHT + 55;
    const rowHeight = 42;

    PART_SLOTS.forEach((slot, i) => {
      const y = startY + i * rowHeight;

      const iconText = this.add.text(15, y, PART_SLOT_ICONS[slot], {
        fontSize: '20px', color: '#888888', fontFamily: 'monospace',
      });

      const labelText = this.add.text(44, y + 4, PART_SLOT_LABELS[slot], {
        fontSize: '14px', color: '#666666', fontFamily: 'monospace',
      });

      const partText = this.add.text(130, y + 4, '', {
        fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
      }).setInteractive();

      partText.on('pointerup', () => this.openPartSelect(slot));
      this.slotTexts.push(partText);

      container.add([iconText, labelText, partText]);
    });

    this.statsText = this.add.text(GAME_WIDTH / 2, startY + PART_SLOTS.length * rowHeight + 16, '', {
      fontSize: '15px', color: '#aaaaaa', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5, 0);
    container.add(this.statsText);

    const hint = this.add.text(GAME_WIDTH / 2, startY + PART_SLOTS.length * rowHeight + 48, 'パーツ名をタップして装備変更・進化', {
      fontSize: '12px', color: '#666666', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);
    container.add(hint);

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
    this.popupOpenedAt = performance.now();

    const ownedParts = this.playerData.getOwnedPartsForSlot(slot);
    if (ownedParts.length === 0) return;

    const equipped = this.playerData.data.equippedParts as Record<PartSlot, string>;

    // Full-screen dim overlay (not tap-to-close; use ✕ button)
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85)
      .setInteractive().setDepth(10);
    this.popupContainer.push(overlay);

    // Header bar
    const headerBg = this.add.rectangle(GAME_WIDTH / 2, 35, GAME_WIDTH, 70, 0x001a33, 1)
      .setStrokeStyle(1, 0x2244aa).setDepth(14);
    this.popupContainer.push(headerBg);

    const title = this.add.text(GAME_WIDTH / 2, 25, `${PART_SLOT_ICONS[slot]} ${PART_SLOT_LABELS[slot]}を選択`, {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(15);
    this.popupContainer.push(title);

    const closeBtn = this.add.text(GAME_WIDTH - 12, 12, '✕ 閉じる', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
      backgroundColor: '#553333', padding: { x: 8, y: 4 },
    }).setOrigin(1, 0).setInteractive().setDepth(15);
    closeBtn.on('pointerup', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.closePopup();
    });
    this.popupContainer.push(closeBtn);

    // Scroll hint
    const hint = this.add.text(GAME_WIDTH / 2, 52, '↕ スワイプでスクロール', {
      fontSize: '10px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(15);
    this.popupContainer.push(hint);

    // Scrollable viewport
    const viewTop = 70;
    const viewBottom = GAME_HEIGHT - 15;
    const viewHeight = viewBottom - viewTop;

    const scrollContainer = this.add.container(0, viewTop).setDepth(11);
    this.popupContainer.push(scrollContainer);

    // Geometry mask for clipping
    const maskGfx = this.make.graphics({ x: 0, y: 0 }, false);
    maskGfx.fillStyle(0xffffff);
    maskGfx.fillRect(0, viewTop, GAME_WIDTH, viewHeight);
    const mask = maskGfx.createGeometryMask();
    scrollContainer.setMask(mask);
    // Mask graphics need to be destroyed explicitly
    this.popupContainer.push(maskGfx as unknown as Phaser.GameObjects.GameObject);

    const cardHeight = 125;
    const gap = 8;

    ownedParts.forEach((item, i) => {
      const y = i * (cardHeight + gap) + 8;
      const line = getPartLineById(item.lineId);
      if (!line) return;

      const isEquipped = equipped[slot] === item.key;
      const color = PART_RARITY_COLORS[item.rarity];
      const bgColor = isEquipped ? 0x223344 : 0x111122;

      const card = this.add.rectangle(GAME_WIDTH / 2, y + cardHeight / 2, GAME_WIDTH - 30, cardHeight, bgColor)
        .setStrokeStyle(isEquipped ? 2 : 1, Phaser.Display.Color.HexStringToColor(color).color)
        .setInteractive();
      scrollContainer.add(card);

      const rLabel = PART_RARITY_LABELS[item.rarity];
      const partName = line.names[item.rarity];
      const nameText = this.add.text(22, y + 6, `[${rLabel}] ${partName}`, {
        fontSize: '15px', color, fontFamily: 'monospace', fontStyle: 'bold',
      });
      scrollContainer.add(nameText);

      const nextRarity = NEXT_RARITY[item.rarity];
      const canEvolve = this.playerData.canEvolve(item.lineId, item.rarity);
      let countStr = `×${item.count}`;
      if (nextRarity) {
        countStr += ` (${item.count}/${EVOLUTION_COST})`;
      }
      const countText = this.add.text(22, y + 28, countStr, {
        fontSize: '12px', color: canEvolve ? '#00ff88' : '#aaaaaa', fontFamily: 'monospace',
      });
      scrollContainer.add(countText);

      const bonus = RARITY_BONUS[item.rarity];
      const hp = line.hp + bonus.hp;
      const atk = line.atk + bonus.atk;
      const spd = line.speed + bonus.speed;
      let statsStr = `HP:${hp} ATK:${atk} SPD:${spd}`;
      if (line.fireRate > 0) {
        statsStr += ` FR:${line.fireRate - RARITY_FIRERATE_BONUS[item.rarity]}ms`;
      }
      const statsText = this.add.text(22, y + 46, statsStr, {
        fontSize: '11px', color: '#bbbbbb', fontFamily: 'monospace',
      });
      scrollContainer.add(statsText);

      let abilY = y + 62;
      if (line.abilityDesc) {
        const abilText = this.add.text(22, abilY, line.abilityDesc, {
          fontSize: '11px', color: '#aaaacc', fontFamily: 'monospace',
        });
        scrollContainer.add(abilText);
        abilY += 14;
      }

      if (line.bonusAbilities) {
        const ri = PART_RARITY_ORDER.indexOf(item.rarity);
        const tiers: { key: 'sr' | 'ur' | 'lr'; label: string; minRi: number }[] = [
          { key: 'sr', label: 'SR', minRi: 2 },
          { key: 'ur', label: 'UR', minRi: 3 },
          { key: 'lr', label: 'LR', minRi: 4 },
        ];
        for (const tier of tiers) {
          const ba = line.bonusAbilities[tier.key];
          if (!ba) continue;
          const unlocked = ri >= tier.minRi;
          const tierColor = unlocked ? PART_RARITY_COLORS[tier.key] : '#555555';
          const prefix = unlocked ? '✦' : '🔒';
          const baText = this.add.text(22, abilY, `${prefix}${tier.label}: ${ba.desc}`, {
            fontSize: '10px', color: tierColor, fontFamily: 'monospace',
          });
          scrollContainer.add(baText);
          abilY += 13;
        }
      }

      if (isEquipped) {
        const eqMark = this.add.text(GAME_WIDTH - 22, y + 8, '装備中', {
          fontSize: '13px', color: '#00ff88', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(1, 0);
        scrollContainer.add(eqMark);
      }

      if (canEvolve && nextRarity) {
        const evolveBtn = this.add.text(GAME_WIDTH - 22, y + 32, `進化→${PART_RARITY_LABELS[nextRarity]}`, {
          fontSize: '13px', color: '#000000', fontFamily: 'monospace', fontStyle: 'bold',
          backgroundColor: '#00ff88', padding: { x: 8, y: 4 },
        }).setOrigin(1, 0).setInteractive();
        scrollContainer.add(evolveBtn);

        evolveBtn.on('pointerup', (pointer: Phaser.Input.Pointer) => {
          if (performance.now() - this.popupOpenedAt < 200) return;
          if (this.popupScrollDragAccum > 8) return;
          pointer.event.stopPropagation();
          this.playerData.evolvePart(item.lineId, item.rarity);
          this.closePopup();
          this.updatePartsDisplay();
          this.cameras.main.flash(400, 0, 255, 136);
          this.openPartSelect(slot);
        });
      }

      card.on('pointerup', () => {
        if (performance.now() - this.popupOpenedAt < 200) return;
        if (this.popupScrollDragAccum > 8) return;
        this.playerData.equipPart(slot, item.key);
        this.closePopup();
        this.updatePartsDisplay();
      });
    });

    // Compute scroll bounds
    const contentHeight = ownedParts.length * (cardHeight + gap) + 16;
    const overflow = Math.max(0, contentHeight - viewHeight);
    this.popupScrollBaseY = viewTop;
    this.popupScrollMin = viewTop - overflow; // container.y can go this low when scrolled down
    this.popupScrollMax = viewTop;
    this.popupScrollContainer = scrollContainer;
  }

  private closePopup(): void {
    for (const obj of this.popupContainer) {
      // Graphics used as mask may not be a proper DisplayList child
      if (obj && typeof (obj as Phaser.GameObjects.GameObject).destroy === 'function') {
        try { obj.destroy(); } catch (_e) { /* noop */ }
      }
    }
    this.popupContainer = [];
    this.popupScrollContainer = null;
    this.popupScrollActive = false;
    this.popupScrollDragAccum = 0;
  }

  // ---------- TOP tab: stage carousel ----------

  private createTopTab(container: Phaser.GameObjects.Container): void {
    const highest = this.playerData.data.highestStage;

    const title = this.add.text(GAME_WIDTH / 2, HEADER_HEIGHT + 15, '— ステージ選択 —', {
      fontSize: '18px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5);
    container.add(title);

    const subtitle = this.add.text(GAME_WIDTH / 2, HEADER_HEIGHT + 40, `最高到達: ステージ ${highest}`, {
      fontSize: '13px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);
    container.add(subtitle);

    // Carousel root container; child cards are absolutely positioned
    this.carouselRoot = this.add.container(0, 0);
    container.add(this.carouselRoot);

    const cardCenterY = HEADER_HEIGHT + 230;
    STAGES.forEach((_stage, i) => {
      const card = this.createStageCard(i, cardCenterY);
      this.carouselRoot.add(card);
      this.stageCards.push(card);
    });
    this.layoutCarousel(false);

    // Arrows + indicator
    const arrowY = HEADER_HEIGHT + 415;
    const leftArrow = this.add.text(30, arrowY, '◀', {
      fontSize: '30px', color: '#ffffff', fontFamily: 'monospace',
      backgroundColor: '#223344', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive();
    leftArrow.on('pointerdown', () => this.changeStage(-1));

    const rightArrow = this.add.text(GAME_WIDTH - 30, arrowY, '▶', {
      fontSize: '30px', color: '#ffffff', fontFamily: 'monospace',
      backgroundColor: '#223344', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive();
    rightArrow.on('pointerdown', () => this.changeStage(1));

    this.stageIndicatorText = this.add.text(GAME_WIDTH / 2, arrowY, '', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([leftArrow, rightArrow, this.stageIndicatorText]);

    // Launch button
    this.launchBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - NAV_HEIGHT - 60, '⚔  出撃  ⚔', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#004466',
      padding: { x: 44, y: 14 },
    }).setOrigin(0.5).setInteractive();

    this.launchBtn.on('pointerover', () => {
      if (this.isStageUnlocked(this.selectedStageIndex)) {
        this.launchBtn.setStyle({ backgroundColor: '#006699' });
      }
    });
    this.launchBtn.on('pointerout', () => {
      if (this.isStageUnlocked(this.selectedStageIndex)) {
        this.launchBtn.setStyle({ backgroundColor: '#004466' });
      }
    });
    this.launchBtn.on('pointerdown', () => this.launchSelectedStage());

    this.tweens.add({
      targets: this.launchBtn,
      scaleX: 1.03, scaleY: 1.03,
      duration: 600, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });
    container.add(this.launchBtn);

    this.updateLaunchButton();
    this.updateStageIndicator();
  }

  private createStageCard(index: number, centerY: number): Phaser.GameObjects.Container {
    const stage = STAGES[index];
    const stageNum = index + 1;
    const highest = this.playerData.data.highestStage;
    const unlocked = stageNum <= highest + 1;

    const card = this.add.container(GAME_WIDTH / 2, centerY);

    const bgColor = unlocked ? 0x112244 : 0x111111;
    const borderColor = unlocked ? 0x4488ff : 0x333333;
    const bg = this.add.rectangle(0, 0, GAME_WIDTH - 40, 320, bgColor)
      .setStrokeStyle(2, borderColor);

    const nameColor = unlocked ? '#ffffff' : '#555555';
    const stageLabel = this.add.text(0, -118, `STAGE ${stageNum}`, {
      fontSize: '26px', color: unlocked ? '#ffd700' : '#555555', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    const nameText = this.add.text(0, -75, stage.name, {
      fontSize: '22px', color: nameColor, fontFamily: 'monospace',
    }).setOrigin(0.5);

    const waveText = this.add.text(0, -20, `Wave ${stage.waves.length} + Boss`, {
      fontSize: '17px', color: unlocked ? '#aaaacc' : '#444444', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const bossText = this.add.text(0, 14, `Boss HP ${stage.boss.hp}`, {
      fontSize: '17px', color: unlocked ? '#ff6688' : '#444444', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // 実ゲームの hpMul に合わせる: stage1-3 は ×1/×2/×3、stage4+ は (stageIndex + 3)
    const hpMul = index <= 2 ? index + 1 : index + 3;
    const mulText = this.add.text(0, 46, `敵HP ×${hpMul}`, {
      fontSize: '14px', color: unlocked ? '#88aadd' : '#333333', fontFamily: 'monospace',
    }).setOrigin(0.5);

    card.add([bg, stageLabel, nameText, waveText, bossText, mulText]);

    // 初回クリア報酬の表示 (受領済みなら ✓ 表示)
    const reward = PlayerData.firstClearReward(stageNum);
    const received = this.playerData.hasReceivedFirstClear(stageNum);
    const rewardLabel = received
      ? `✓ 初回報酬受取済み`
      : `初回報酬: 🪙${reward.coins}  💎${reward.gems}`;
    const rewardColor = received ? '#666666' : (unlocked ? '#ffaa44' : '#333333');
    const rewardText = this.add.text(0, 74, rewardLabel, {
      fontSize: '13px', color: rewardColor, fontFamily: 'monospace',
    }).setOrigin(0.5);
    card.add(rewardText);

    if (!unlocked) {
      const lock = this.add.text(0, 110, '🔒 LOCKED', {
        fontSize: '22px', color: '#666666', fontFamily: 'monospace',
      }).setOrigin(0.5);
      card.add(lock);
      card.setAlpha(0.5);
    } else if (stageNum <= highest) {
      const cleared = this.add.text(0, 110, '✓ クリア済み', {
        fontSize: '16px', color: '#00ff88', fontFamily: 'monospace',
      }).setOrigin(0.5);
      card.add(cleared);
    }

    return card;
  }

  private layoutCarousel(animate: boolean): void {
    for (let i = 0; i < this.stageCards.length; i++) {
      const targetX = GAME_WIDTH / 2 + (i - this.selectedStageIndex) * GAME_WIDTH;
      if (animate) {
        this.tweens.add({
          targets: this.stageCards[i],
          x: targetX,
          duration: 220,
          ease: 'Cubic.easeOut',
        });
      } else {
        this.stageCards[i].x = targetX;
      }
    }
  }

  private changeStage(delta: number): void {
    const newIndex = Phaser.Math.Clamp(this.selectedStageIndex + delta, 0, STAGES.length - 1);
    if (newIndex === this.selectedStageIndex) return;
    this.selectedStageIndex = newIndex;
    this.layoutCarousel(true);
    this.updateLaunchButton();
    this.updateStageIndicator();
  }

  private updateStageIndicator(): void {
    this.stageIndicatorText.setText(`STAGE ${this.selectedStageIndex + 1} / ${STAGES.length}`);
  }

  private isStageUnlocked(index: number): boolean {
    const stageNum = index + 1;
    return stageNum <= this.playerData.data.highestStage + 1;
  }

  private updateLaunchButton(): void {
    if (this.isStageUnlocked(this.selectedStageIndex)) {
      this.launchBtn.setStyle({ color: '#ffffff', backgroundColor: '#004466' });
      this.launchBtn.setText('⚔  出撃  ⚔');
      this.launchBtn.setInteractive();
    } else {
      this.launchBtn.setStyle({ color: '#666666', backgroundColor: '#222222' });
      this.launchBtn.setText('🔒 LOCKED');
      this.launchBtn.disableInteractive();
    }
  }

  private launchSelectedStage(): void {
    if (!this.isStageUnlocked(this.selectedStageIndex)) return;
    this.scene.start('GameScene', { playerData: this.playerData, startStageIndex: this.selectedStageIndex });
  }

  private setupSwipeInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Popup scroll takes priority when modal is open
      if (this.popupScrollContainer) {
        this.popupScrollActive = true;
        this.popupScrollLastY = pointer.y;
        this.popupScrollDragAccum = 0;
        return;
      }
      if (this.currentTab !== 'top') return;
      // Avoid triggering when clicking within nav area or header
      if (pointer.y < HEADER_HEIGHT + 60) return;
      if (pointer.y > GAME_HEIGHT - NAV_HEIGHT - 70) return;
      this.swipeActive = true;
      this.swipeStartX = pointer.x;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.popupScrollActive || !this.popupScrollContainer) return;
      if (!pointer.isDown) return;
      const dy = pointer.y - this.popupScrollLastY;
      this.popupScrollLastY = pointer.y;
      this.popupScrollDragAccum += Math.abs(dy);
      const c = this.popupScrollContainer;
      c.y = Phaser.Math.Clamp(c.y + dy, this.popupScrollMin, this.popupScrollMax);
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.popupScrollActive) {
        this.popupScrollActive = false;
        // Reset drag accum shortly after so card pointerup handlers see the drag flag
        this.time.delayedCall(50, () => { this.popupScrollDragAccum = 0; });
        return;
      }
      if (!this.swipeActive) return;
      this.swipeActive = false;
      if (this.currentTab !== 'top') return;
      if (this.popupContainer.length > 0) return;
      const dx = pointer.x - this.swipeStartX;
      if (dx > 50) this.changeStage(-1);
      else if (dx < -50) this.changeStage(1);
    });
  }

  // ---------- GACHA tab ----------

  private createGachaTab(container: Phaser.GameObjects.Container): void {
    const title = this.add.text(GAME_WIDTH / 2, HEADER_HEIGHT + 18, '🎰 パーツガチャ', {
      fontSize: '26px', color: '#ffaa00', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.gachaGemText = this.add.text(GAME_WIDTH / 2, HEADER_HEIGHT + 56, `💎 ${this.playerData.data.gems}`, {
      fontSize: '22px', color: '#44aaff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.gachaPityText = this.add.text(GAME_WIDTH / 2, HEADER_HEIGHT + 84, this.getPityText(), {
      fontSize: '15px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const rateText = this.add.text(GAME_WIDTH / 2, HEADER_HEIGHT + 108, '排出: N 88%  R 11%  SR 1%', {
      fontSize: '13px', color: '#666666', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const noteText = this.add.text(GAME_WIDTH / 2, HEADER_HEIGHT + 128, '50回で SR確定 / 同パーツ3個で進化!', {
      fontSize: '12px', color: '#886644', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const pullBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - NAV_HEIGHT - 100, `ガチャを引く (💎${this.gachaManager.getCost()})`, {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#553300',
      padding: { x: 30, y: 12 },
    }).setOrigin(0.5).setInteractive();

    pullBtn.on('pointerdown', () => this.doGachaPull());

    this.tweens.add({
      targets: pullBtn,
      scaleX: 1.04, scaleY: 1.04,
      duration: 700, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.gachaAdBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - NAV_HEIGHT - 36, '📺 広告で無料ガチャ', {
      fontSize: '20px',
      color: '#ffaa00',
      fontFamily: 'monospace',
      backgroundColor: '#332200',
      padding: { x: 26, y: 10 },
    }).setOrigin(0.5).setInteractive();

    this.gachaAdBtn.on('pointerdown', () => {
      if (this.gachaAdUsed) return;
      this.playerData.addGems(this.gachaManager.getCost());
      this.refreshCurrencyDisplay();
      this.refreshGachaDisplay();
      this.doGachaPull();
      this.gachaAdUsed = true;
      this.gachaAdBtn.setText('✓ 使用済み');
      this.gachaAdBtn.disableInteractive();
    });

    container.add([title, this.gachaGemText, this.gachaPityText, rateText, noteText, pullBtn, this.gachaAdBtn]);
  }

  private doGachaPull(): void {
    const result = this.gachaManager.pull(this.playerData);
    if (!result) {
      this.showGachaMessage('💎が足りません!', '#ff4444');
      return;
    }
    this.clearGachaResult();
    this.showGachaResult(result);
    this.refreshGachaDisplay();
    this.refreshCurrencyDisplay();
  }

  private showGachaResult(result: GachaResult): void {
    const { line, rarity, newCount } = result;
    const color = PART_RARITY_COLORS[rarity];
    const bgColor = PART_RARITY_BG[rarity];
    const label = PART_RARITY_LABELS[rarity];
    const slotIcon = PART_SLOT_ICONS[line.slot];
    const slotLabel = PART_SLOT_LABELS[line.slot];
    const partName = line.names[rarity];

    const centerY = HEADER_HEIGHT + 300;

    if (rarity === 'sr') this.cameras.main.flash(400, 200, 100, 255);
    else if (rarity === 'r') this.cameras.main.flash(200, 80, 120, 255);

    const card = this.add.rectangle(GAME_WIDTH / 2, centerY, GAME_WIDTH - 60, 290, bgColor)
      .setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(color).color);
    this.tabContainers.gacha.add(card);
    this.gachaResultContainer.push(card);

    const rarityText = this.add.text(GAME_WIDTH / 2, centerY - 110, label, {
      fontSize: '22px', color, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tabContainers.gacha.add(rarityText);
    this.gachaResultContainer.push(rarityText);

    const slotText = this.add.text(GAME_WIDTH / 2, centerY - 82, `${slotIcon} ${slotLabel}`, {
      fontSize: '14px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.tabContainers.gacha.add(slotText);
    this.gachaResultContainer.push(slotText);

    const icon = this.add.text(GAME_WIDTH / 2, centerY - 42, slotIcon, {
      fontSize: '44px', color: '#' + line.color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5);
    this.tabContainers.gacha.add(icon);
    this.gachaResultContainer.push(icon);

    const nameText = this.add.text(GAME_WIDTH / 2, centerY + 5, partName, {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tabContainers.gacha.add(nameText);
    this.gachaResultContainer.push(nameText);

    const nextRarity = NEXT_RARITY[rarity];
    let countStr = `所持: ${newCount}個`;
    if (nextRarity) countStr += ` (進化まで ${newCount}/${EVOLUTION_COST})`;
    const canEvolve = newCount >= EVOLUTION_COST && nextRarity;
    const countText = this.add.text(GAME_WIDTH / 2, centerY + 33, countStr, {
      fontSize: '14px',
      color: canEvolve ? '#00ff88' : '#aaaaaa',
      fontFamily: 'monospace',
      fontStyle: canEvolve ? 'bold' : 'normal',
    }).setOrigin(0.5);
    this.tabContainers.gacha.add(countText);
    this.gachaResultContainer.push(countText);

    if (canEvolve) {
      const evolveHint = this.add.text(GAME_WIDTH / 2, centerY + 53, '✨ 進化可能! パーツタブで進化', {
        fontSize: '13px', color: '#00ff88', fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.tabContainers.gacha.add(evolveHint);
      this.gachaResultContainer.push(evolveHint);
      this.tweens.add({ targets: evolveHint, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
    }

    const bonus = RARITY_BONUS[rarity];
    const hp = line.hp + bonus.hp;
    const atk = line.atk + bonus.atk;
    const spd = line.speed + bonus.speed;
    let statsStr = `HP:${hp} ATK:${atk} SPD:${spd}`;
    if (line.fireRate > 0) statsStr += ` FR:${line.fireRate - RARITY_FIRERATE_BONUS[rarity]}ms`;
    const statsText = this.add.text(GAME_WIDTH / 2, centerY + 75, statsStr, {
      fontSize: '13px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.tabContainers.gacha.add(statsText);
    this.gachaResultContainer.push(statsText);

    let nextY = centerY + 94;
    if (line.abilityDesc) {
      const abilityText = this.add.text(GAME_WIDTH / 2, nextY, line.abilityDesc, {
        fontSize: '13px', color, fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.tabContainers.gacha.add(abilityText);
      this.gachaResultContainer.push(abilityText);
      nextY += 16;
    }

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
          fontSize: '11px', color: tierColor, fontFamily: 'monospace',
        }).setOrigin(0.5);
        this.tabContainers.gacha.add(baText);
        this.gachaResultContainer.push(baText);
        nextY += 14;
      }
    }

    card.setScale(0);
    this.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut' });
  }

  private clearGachaResult(): void {
    for (const obj of this.gachaResultContainer) obj.destroy();
    this.gachaResultContainer = [];
  }

  private refreshGachaDisplay(): void {
    if (this.gachaGemText) this.gachaGemText.setText(`💎 ${this.playerData.data.gems}`);
    if (this.gachaPityText) this.gachaPityText.setText(this.getPityText());
  }

  private getPityText(): string {
    const pity = this.gachaManager.getPityCount(this.playerData);
    const threshold = this.gachaManager.getPityThreshold();
    return `天井まで: ${threshold - pity}回`;
  }

  private showGachaMessage(msg: string, color: string): void {
    const text = this.add.text(GAME_WIDTH / 2, HEADER_HEIGHT + 300, msg, {
      fontSize: '22px', color, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tabContainers.gacha.add(text);
    this.tweens.add({
      targets: text, alpha: 0, y: text.y - 50, duration: 1500,
      onComplete: () => text.destroy(),
    });
  }

  // ---------- DEBUG tab ----------

  private createDebugTab(container: Phaser.GameObjects.Container): void {
    const title = this.add.text(GAME_WIDTH / 2, HEADER_HEIGHT + 20, '— デバッグメニュー —', {
      fontSize: '18px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5);
    container.add(title);

    const warn = this.add.text(GAME_WIDTH / 2, HEADER_HEIGHT + 48, '※ 開発用。操作後は即時保存されます', {
      fontSize: '11px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);
    container.add(warn);

    const startY = HEADER_HEIGHT + 90;
    const buttons: { label: string; color: string; bg: string; onPress: () => void }[] = [
      {
        label: '🗺  ステージ進行状況を初期化',
        color: '#ffffff',
        bg: '#442222',
        onPress: () => {
          this.playerData.resetStageProgress();
          this.scene.restart();
        },
      },
      {
        label: '⚙  ステータスを初期化',
        color: '#ffffff',
        bg: '#442222',
        onPress: () => {
          this.playerData.resetStatus();
          this.scene.restart();
        },
      },
      {
        label: '💎  ジェム +5000',
        color: '#44aaff',
        bg: '#112244',
        onPress: () => {
          this.playerData.addGems(5000);
          this.refreshCurrencyDisplay();
        },
      },
      {
        label: '🪙  ゴールド +10000',
        color: '#ffd700',
        bg: '#333300',
        onPress: () => {
          this.playerData.addCoins(10000);
          this.refreshCurrencyDisplay();
        },
      },
      {
        label: '🗑  ゴールド & ジェムを 0 に',
        color: '#ffffff',
        bg: '#442222',
        onPress: () => {
          this.playerData.resetCurrency();
          this.refreshCurrencyDisplay();
        },
      },
    ];

    buttons.forEach((b, i) => {
      const y = startY + i * 68;
      const btn = this.add.text(GAME_WIDTH / 2, y, b.label, {
        fontSize: '17px',
        color: b.color,
        fontFamily: 'monospace',
        backgroundColor: b.bg,
        padding: { x: 20, y: 14 },
        align: 'center',
        fixedWidth: GAME_WIDTH - 40,
      }).setOrigin(0.5).setInteractive();
      btn.on('pointerdown', () => {
        b.onPress();
        AudioManager.get().playPowerUp();
      });
      container.add(btn);
    });
  }

  // ---------- Bottom nav ----------

  private createBottomNav(): void {
    const navY = GAME_HEIGHT - NAV_HEIGHT;
    const bg = this.add.rectangle(GAME_WIDTH / 2, navY + NAV_HEIGHT / 2, GAME_WIDTH, NAV_HEIGHT, 0x000010, 0.9);
    bg.setStrokeStyle(1, 0x2244aa);
    bg.setDepth(5);

    const tabWidth = GAME_WIDTH / TAB_ORDER.length;

    TAB_ORDER.forEach((key, i) => {
      const cx = tabWidth * (i + 0.5);
      const cy = navY + NAV_HEIGHT / 2;

      const rect = this.add.rectangle(cx, cy, tabWidth - 2, NAV_HEIGHT - 4, 0x222244)
        .setInteractive()
        .setDepth(6);

      const iconText = this.add.text(cx, cy - 14, TAB_ICONS[key], {
        fontSize: '22px', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(7);

      const labelText = this.add.text(cx, cy + 15, TAB_LABELS[key], {
        fontSize: '11px', color: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(7);

      rect.on('pointerdown', () => this.setTab(key));

      this.navButtons.push({ rect, iconText, labelText, key });
    });
  }

  private refreshNavHighlight(): void {
    for (const btn of this.navButtons) {
      const selected = btn.key === this.currentTab;
      btn.rect.setFillStyle(selected ? 0x004466 : 0x222244);
      btn.labelText.setColor(selected ? '#44ccff' : '#aaaaaa');
    }
  }

  // ---------- Tab switch ----------

  private setTab(key: TabKey): void {
    this.closePopup();

    this.currentTab = key;
    TAB_ORDER.forEach(k => {
      this.tabContainers[k].setVisible(k === key);
    });

    if (key === 'parts') this.updatePartsDisplay();
    if (key === 'gacha') this.refreshGachaDisplay();

    this.refreshCurrencyDisplay();
    this.refreshNavHighlight();
  }
}
