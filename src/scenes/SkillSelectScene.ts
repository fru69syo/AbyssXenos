import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { SkillDef } from '../data/skills';

interface SkillSelectData {
  skills: SkillDef[];
  onSelect: (skillId: string) => void;
}

export class SkillSelectScene extends Phaser.Scene {
  constructor() {
    super('SkillSelectScene');
  }

  create(data: SkillSelectData): void {
    const { skills, onSelect } = data;

    // Dimmed overlay
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);

    // Title
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.2, 'スキル選択', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.2 + 35, '1つ選んでください', {
      fontSize: '14px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Skill cards
    const rarityColors: Record<string, string> = {
      normal: '#aaaaaa',
      rare: '#4488ff',
      epic: '#ff44ff',
    };

    const rarityBg: Record<string, number> = {
      normal: 0x222233,
      rare: 0x112244,
      epic: 0x331133,
    };

    const rarityLabels: Record<string, string> = {
      normal: '★',
      rare: '★★',
      epic: '★★★',
    };

    const cardWidth = GAME_WIDTH - 60;
    const cardHeight = 90;
    const startY = GAME_HEIGHT * 0.35;
    const gap = 15;

    skills.forEach((skill, i) => {
      const y = startY + i * (cardHeight + gap);

      // Card background
      const card = this.add.rectangle(GAME_WIDTH / 2, y + cardHeight / 2, cardWidth, cardHeight, rarityBg[skill.rarity])
        .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(rarityColors[skill.rarity]).color)
        .setInteractive();

      // Rarity stars
      this.add.text(40, y + 10, rarityLabels[skill.rarity], {
        fontSize: '14px',
        color: rarityColors[skill.rarity],
        fontFamily: 'monospace',
      });

      // Skill name
      this.add.text(40, y + 30, skill.name, {
        fontSize: '20px',
        color: rarityColors[skill.rarity],
        fontFamily: 'monospace',
        fontStyle: 'bold',
      });

      // Description
      this.add.text(40, y + 58, skill.description, {
        fontSize: '14px',
        color: '#cccccc',
        fontFamily: 'monospace',
      });

      // Category icon
      const catIcon = skill.category === 'attack' ? '⚔' : skill.category === 'defense' ? '🛡' : '✦';
      this.add.text(GAME_WIDTH - 45, y + 35, catIcon, {
        fontSize: '28px',
        color: '#ffffff',
      }).setOrigin(0.5);

      // Selection
      card.on('pointerdown', () => {
        // Flash effect
        this.cameras.main.flash(200, 255, 255, 255);
        this.time.delayedCall(200, () => {
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
