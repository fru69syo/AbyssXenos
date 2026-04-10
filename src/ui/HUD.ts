import { GAME_WIDTH, COLORS } from '../config';
import { RunState } from '../managers/RunState';
import { Boss } from '../entities/Boss';

export class HUD {
  private scene: Phaser.Scene;
  private hpText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private shieldText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private expBarBg!: Phaser.GameObjects.Rectangle;
  private expBarFill!: Phaser.GameObjects.Graphics;
  private skillIcons: Phaser.GameObjects.Text[] = [];
  private pauseBtn!: Phaser.GameObjects.Text;
  private bossHpBar!: Phaser.GameObjects.Graphics;
  private bossHpBg!: Phaser.GameObjects.Rectangle;
  private bossLabel!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '18px',
      color: COLORS.UI_TEXT,
      fontFamily: 'monospace',
    };

    this.hpText = this.scene.add.text(15, 15, '', style).setScrollFactor(0).setDepth(100);
    this.shieldText = this.scene.add.text(15, 40, '', style).setScrollFactor(0).setDepth(100);
    this.waveText = this.scene.add.text(GAME_WIDTH / 2, 15, '', { ...style, fontSize: '16px' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
    this.stageText = this.scene.add.text(GAME_WIDTH / 2, 38, '', { ...style, fontSize: '14px', color: COLORS.UI_ACCENT }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
    this.coinText = this.scene.add.text(GAME_WIDTH - 15, 15, '', { ...style, color: '#ffd700' }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

    // レベル + EXPバー
    this.levelText = this.scene.add.text(15, 58, 'Lv.1', { fontSize: '13px', color: '#88ff88', fontFamily: 'monospace' })
      .setScrollFactor(0).setDepth(100);
    this.expBarBg = this.scene.add.rectangle(62, 65, 100, 6, 0x333333)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);
    this.expBarFill = this.scene.add.graphics().setScrollFactor(0).setDepth(101);

    this.pauseBtn = this.scene.add.text(GAME_WIDTH - 15, 45, '⏸', { fontSize: '28px', color: '#ffffff' })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(100).setInteractive();
    this.pauseBtn.on('pointerdown', () => {
      this.scene.scene.launch('PauseScene');
      this.scene.scene.pause();
    });

    // ボス/中ボス HP バー (非表示初期)
    this.bossHpBg = this.scene.add.rectangle(GAME_WIDTH / 2, 78, GAME_WIDTH - 40, 8, 0x333333)
      .setScrollFactor(0).setDepth(100).setVisible(false);
    this.bossHpBar = this.scene.add.graphics().setScrollFactor(0).setDepth(101);
    this.bossLabel = this.scene.add.text(20, 68, '', { fontSize: '11px', color: '#ff8844', fontFamily: 'monospace' })
      .setScrollFactor(0).setDepth(102).setVisible(false);
  }

  update(
    runState: RunState,
    waveCurrent: number,
    waveTotal: number,
    stageName: string,
    boss?: Boss | null,
    midBoss?: Boss | null,
  ): void {
    const hpBars = '❤'.repeat(runState.hp) + '🖤'.repeat(Math.max(0, runState.maxHp - runState.hp));
    this.hpText.setText(hpBars);
    this.shieldText.setText(runState.shield > 0 ? '🛡'.repeat(runState.shield) : '');
    this.waveText.setText(`WAVE ${waveCurrent + 1}/${waveTotal}`);
    this.stageText.setText(stageName);
    this.coinText.setText(`🪙 ${runState.coins}`);

    // レベル + EXP バー
    this.levelText.setText(`Lv.${runState.level}`);
    this.expBarFill.clear();
    const expPct = runState.expToNextLevel > 0 ? runState.exp / runState.expToNextLevel : 0;
    this.expBarFill.fillStyle(0x88ff88, 1);
    this.expBarFill.fillRect(62, 62, 100 * expPct, 6);

    // ボス / 中ボス HP バー
    const activeBoss = (boss && boss.active) ? boss : (midBoss && midBoss.active) ? midBoss : null;
    if (activeBoss) {
      this.bossHpBg.setVisible(true);
      this.bossLabel.setVisible(true);
      this.bossHpBar.clear();
      const barWidth = (GAME_WIDTH - 40) * activeBoss.getHpPercent();
      const isMid = activeBoss === midBoss;
      this.bossHpBar.fillStyle(isMid ? 0xff8844 : 0xff0044, 1);
      this.bossHpBar.fillRect(20, 74, barWidth, 8);
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
    const y = 80;
    skills.slice(0, 8).forEach((s, i) => {
      const color = s.skill.rarity === 'epic' ? '#ff44ff' : s.skill.rarity === 'rare' ? '#4488ff' : '#aaaaaa';
      const text = this.scene.add.text(startX + i * 22, y, '◆', {
        fontSize: '14px', color,
      }).setScrollFactor(0).setDepth(100);
      if (s.stacks > 1) {
        this.scene.add.text(startX + i * 22 + 10, y - 2, `${s.stacks}`, {
          fontSize: '10px', color: '#ffffff',
        }).setScrollFactor(0).setDepth(101);
      }
      this.skillIcons.push(text);
    });
  }

  destroy(): void {
    this.hpText.destroy();
    this.waveText.destroy();
    this.coinText.destroy();
    this.shieldText.destroy();
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
