import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { SkillDef } from '../data/skills';

interface EvolutionInfo {
  current: number;
  required: number;
  evolvesTo: string;
}

interface SkillSelectData {
  skills: SkillDef[];
  onSelect: (skillId: string) => void;
  title?: string;
  evolutionInfos?: Record<string, EvolutionInfo>;
}

export class SkillSelectScene extends Phaser.Scene {
  constructor() {
    super('SkillSelectScene');
  }

  create(data: SkillSelectData): void {
    const { skills, onSelect, title, evolutionInfos } = data;

    // Dimmed overlay
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);

    // Title
    const isLevelUp = !!title;
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.15, title ?? 'スキル選択', {
      fontSize: isLevelUp ? '24px' : '28px',
      color: isLevelUp ? '#88ff88' : '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.15 + 35, '1つ選んでください', {
      fontSize: '14px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Skill cards
    const rarityColors: Record<string, string> = {
      normal: '#aaaaaa',
      rare: '#4488ff',
      epic: '#ff44ff',
      legendary: '#ffd700',
    };

    const rarityBg: Record<string, number> = {
      normal: 0x222233,
      rare: 0x112244,
      epic: 0x331133,
      legendary: 0x332200,
    };

    const rarityLabels: Record<string, string> = {
      normal: '★',
      rare: '★★',
      epic: '★★★',
      legendary: '★★★★',
    };

    const cardWidth = GAME_WIDTH - 60;
    const cardHeight = 100;
    const startY = GAME_HEIGHT * 0.28;
    const gap = 12;

    skills.forEach((skill, i) => {
      const y = startY + i * (cardHeight + gap);

      // Card background
      const card = this.add.rectangle(GAME_WIDTH / 2, y + cardHeight / 2, cardWidth, cardHeight, rarityBg[skill.rarity])
        .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(rarityColors[skill.rarity]).color)
        .setInteractive();

      // Rarity stars
      this.add.text(40, y + 8, rarityLabels[skill.rarity], {
        fontSize: '14px',
        color: rarityColors[skill.rarity],
        fontFamily: 'monospace',
      });

      // Skill name
      this.add.text(40, y + 26, skill.name, {
        fontSize: '18px',
        color: rarityColors[skill.rarity],
        fontFamily: 'monospace',
        fontStyle: 'bold',
      });

      // Description
      this.add.text(40, y + 50, skill.description, {
        fontSize: '13px',
        color: '#cccccc',
        fontFamily: 'monospace',
      });

      // Evolution progress
      const evoInfo = evolutionInfos?.[skill.id];
      if (evoInfo) {
        const nextStack = evoInfo.current + 1;
        const isLastForEvo = nextStack >= evoInfo.required;
        const evoColor = isLastForEvo ? '#ffd700' : '#888866';
        const evoText = isLastForEvo
          ? `✨ 進化! → ${evoInfo.evolvesTo}`
          : `進化まで ${nextStack}/${evoInfo.required} → ${evoInfo.evolvesTo}`;
        this.add.text(40, y + 68, evoText, {
          fontSize: '11px',
          color: evoColor,
          fontFamily: 'monospace',
          fontStyle: isLastForEvo ? 'bold' : 'normal',
        });

        if (isLastForEvo) {
          // Glow effect on the card border for evolution-ready
          this.tweens.add({
            targets: card,
            alpha: 0.8,
            duration: 400,
            yoyo: true,
            repeat: -1,
          });
        }
      }

      // Category icon
      const catIcon = skill.category === 'attack' ? '⚔' : skill.category === 'defense' ? '🛡' : '✦';
      this.add.text(GAME_WIDTH - 45, y + 35, catIcon, {
        fontSize: '28px',
        color: '#ffffff',
      }).setOrigin(0.5);

      // Selection
      card.on('pointerdown', () => {
        // Flash effect - gold for legendary-triggering, white for normal
        const evoTriggered = evoInfo && (evoInfo.current + 1) >= evoInfo.required;
        if (evoTriggered) {
          this.cameras.main.flash(400, 255, 215, 0);
        } else {
          this.cameras.main.flash(200, 255, 255, 255);
        }
        this.time.delayedCall(evoTriggered ? 400 : 200, () => {
          this.scene.stop();
          onSelect(skill.id);
        });
      });

      // Hover effect
      card.on('pointerover', () => card.setFillStyle(rarityBg[skill.rarity] + 0x111111));
      card.on('pointerout', () => card.setFillStyle(rarityBg[skill.rarity]));
    });
  }
}
