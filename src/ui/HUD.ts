import { GAME_WIDTH, COLORS } from '../config';
import { RunState } from '../managers/RunState';
import { Boss } from '../entities/Boss';

// HP バーの配置 / サイズ
const HP_BAR_X = 15;
const HP_BAR_Y = 22;
const HP_BAR_W = 160;
const HP_BAR_H = 14;

export class HUD {
  private scene: Phaser.Scene;
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Graphics;
  private shieldOverlay!: Phaser.GameObjects.Graphics;
  private hpLabel!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private expBarBg!: Phaser.GameObjects.Rectangle;
  private expBarFill!: Phaser.GameObjects.Graphics;
  private skillIcons: Phaser.GameObjects.Text[] = [];
  private pauseBtn!: Phaser.GameObjects.Text;
  private bossHpBar!: Phaser.GameObjects.Graphics;
  private bossHpBg!: Phaser.GameObjects.Rectangle;
  private bossLabel!: Phaser.GameObjects.Text;
  private flashTimer: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '16px',
      color: COLORS.UI_TEXT,
      fontFamily: 'monospace',
    };

    // HP バー (背景 → fill → シールドオーバーレイ → ラベル)
    this.hpBarBg = this.scene.add
      .rectangle(HP_BAR_X, HP_BAR_Y, HP_BAR_W, HP_BAR_H, 0x440000)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x000000, 0.6)
      .setScrollFactor(0)
      .setDepth(100);
    this.hpBarFill = this.scene.add.graphics().setScrollFactor(0).setDepth(101);
    this.shieldOverlay = this.scene.add.graphics().setScrollFactor(0).setDepth(102);
    this.hpLabel = this.scene.add
      .text(HP_BAR_X + HP_BAR_W / 2, HP_BAR_Y, '', {
        fontSize: '11px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(103);

    this.waveText = this.scene.add
      .text(GAME_WIDTH / 2, 15, '', { ...style })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(100);
    this.stageText = this.scene.add
      .text(GAME_WIDTH / 2, 38, '', { ...style, fontSize: '14px', color: COLORS.UI_ACCENT })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(100);
    this.coinText = this.scene.add
      .text(GAME_WIDTH - 15, 15, '', { ...style, color: '#ffd700' })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(100);

    // レベル + EXPバー
    this.levelText = this.scene.add
      .text(15, 45, 'Lv.1', { fontSize: '13px', color: '#88ff88', fontFamily: 'monospace' })
      .setScrollFactor(0)
      .setDepth(100);
    this.expBarBg = this.scene.add
      .rectangle(62, 52, 100, 6, 0x333333)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(100);
    this.expBarFill = this.scene.add.graphics().setScrollFactor(0).setDepth(101);

    this.pauseBtn = this.scene.add
      .text(GAME_WIDTH - 15, 45, '⏸', { fontSize: '28px', color: '#ffffff' })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive();
    this.pauseBtn.on('pointerdown', () => {
      this.scene.scene.launch('PauseScene');
      this.scene.scene.pause();
    });

    // ボス / 中ボス HP バー (非表示初期)
    this.bossHpBg = this.scene.add
      .rectangle(GAME_WIDTH / 2, 82, GAME_WIDTH - 40, 8, 0x333333)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false);
    this.bossHpBar = this.scene.add.graphics().setScrollFactor(0).setDepth(101);
    this.bossLabel = this.scene.add
      .text(20, 72, '', { fontSize: '11px', color: '#ff8844', fontFamily: 'monospace' })
      .setScrollFactor(0)
      .setDepth(102)
      .setVisible(false);
  }

  update(
    runState: RunState,
    waveCurrent: number,
    waveTotal: number,
    stageName: string,
    boss?: Boss | null,
    midBoss?: Boss | null,
  ): void {
    // ===== HP バー =====
    const hp = Math.max(0, runState.hp);
    const maxHp = Math.max(1, runState.maxHp);
    const hpRatio = Math.min(1, hp / maxHp);

    let hpColor = 0x44ff66;
    if (hpRatio < 0.3) hpColor = 0xff2233;
    else if (hpRatio < 0.7) hpColor = 0xffaa33;

    // 低 HP 時の点滅
    let alpha = 1;
    if (hpRatio < 0.3) {
      this.flashTimer += 1;
      alpha = (this.flashTimer % 30) < 15 ? 1 : 0.45;
    } else {
      this.flashTimer = 0;
    }

    this.hpBarFill.clear();
    this.hpBarFill.fillStyle(hpColor, alpha);
    this.hpBarFill.fillRect(HP_BAR_X, HP_BAR_Y - HP_BAR_H / 2, HP_BAR_W * hpRatio, HP_BAR_H);

    // シールドオーバーレイ (HP バー内に左端から青系半透明で重ね描き)
    this.shieldOverlay.clear();
    if (runState.shield > 0) {
      const shownShield = Math.min(runState.shield, maxHp);
      const shieldW = HP_BAR_W * (shownShield / maxHp);
      this.shieldOverlay.fillStyle(0x44aaff, 0.7);
      this.shieldOverlay.fillRect(HP_BAR_X, HP_BAR_Y - HP_BAR_H / 2, shieldW, HP_BAR_H);
    }

    // HP ラベル: "HP N/M" (シールド時は末尾に +S)
    let label = `HP ${hp}/${maxHp}`;
    if (runState.shield > 0) label += `  +${runState.shield}`;
    this.hpLabel.setText(label);

    // ===== その他 HUD =====
    this.waveText.setText(`WAVE ${waveCurrent + 1}/${waveTotal}`);
    this.stageText.setText(stageName);
    this.coinText.setText(`🪙 ${runState.coins}`);

    // レベル + EXP バー
    this.levelText.setText(`Lv.${runState.level}`);
    this.expBarFill.clear();
    const expPct = runState.expToNextLevel > 0 ? runState.exp / runState.expToNextLevel : 0;
    this.expBarFill.fillStyle(0x88ff88, 1);
    this.expBarFill.fillRect(62, 49, 100 * expPct, 6);

    // ボス / 中ボス HP バー
    const activeBoss = boss && boss.active ? boss : midBoss && midBoss.active ? midBoss : null;
    if (activeBoss) {
      this.bossHpBg.setVisible(true);
      this.bossLabel.setVisible(true);
      this.bossHpBar.clear();
      const barWidth = (GAME_WIDTH - 40) * activeBoss.getHpPercent();
      const isMid = activeBoss === midBoss;
      this.bossHpBar.fillStyle(isMid ? 0xff8844 : 0xff0044, 1);
      this.bossHpBar.fillRect(20, 78, barWidth, 8);
      this.bossLabel.setText(isMid ? 'MID BOSS' : 'BOSS');
      this.bossLabel.setColor(isMid ? '#ff8844' : '#ff0044');
    } else {
      this.bossHpBg.setVisible(false);
      this.bossLabel.setVisible(false);
      this.bossHpBar.clear();
    }
  }

  showSkillIcons(skills: { skill: { id: string; rarity: string }; stacks: number }[]): void {
    for (const icon of this.skillIcons) icon.destroy();
    this.skillIcons = [];

    const startX = 15;
    const y = 90;
    skills.slice(0, 8).forEach((s, i) => {
      const color =
        s.skill.rarity === 'legendary'
          ? '#ffd700'
          : s.skill.rarity === 'epic'
          ? '#ff44ff'
          : s.skill.rarity === 'rare'
          ? '#4488ff'
          : '#aaaaaa';
      const text = this.scene.add
        .text(startX + i * 22, y, '◆', { fontSize: '14px', color })
        .setScrollFactor(0)
        .setDepth(100);
      if (s.stacks > 1) {
        this.scene.add
          .text(startX + i * 22 + 10, y - 2, `${s.stacks}`, { fontSize: '10px', color: '#ffffff' })
          .setScrollFactor(0)
          .setDepth(101);
      }
      this.skillIcons.push(text);
    });
  }

  destroy(): void {
    this.hpBarBg.destroy();
    this.hpBarFill.destroy();
    this.shieldOverlay.destroy();
    this.hpLabel.destroy();
    this.waveText.destroy();
    this.coinText.destroy();
    this.stageText.destroy();
    this.levelText.destroy();
    this.expBarBg.destroy();
    this.expBarFill.destroy();
    this.pauseBtn.destroy();
    this.bossHpBg.destroy();
    this.bossHpBar.destroy();
    this.bossLabel.destroy();
    for (const icon of this.skillIcons) icon.destroy();
  }
}
