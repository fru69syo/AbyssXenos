import { COLORS } from '../config';
import { ENEMIES } from '../data/enemies';
import { DROP_TYPES } from '../data/dropTypes';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    // Show loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const bar = this.add.graphics();
    const barBg = this.add.rectangle(width / 2, height / 2, 300, 20, 0x222222);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0x00ccff, 1);
      bar.fillRect(width / 2 - 150, height / 2 - 10, 300 * value, 20);
    });

    this.load.on('complete', () => {
      bar.destroy();
      barBg.destroy();
    });
  }

  create(): void {
    this.generateTextures();
    this.scene.start('TitleScene');
  }

  private generateTextures(): void {
    // Player ship (triangle pointing up)
    const pg = this.add.graphics();
    pg.fillStyle(COLORS.PLAYER, 1);
    pg.fillTriangle(16, 0, 0, 32, 32, 32);
    pg.lineStyle(1, 0xffffff, 0.5);
    pg.strokeTriangle(16, 0, 0, 32, 32, 32);
    pg.generateTexture('player', 32, 32);
    pg.destroy();

    // Drone
    const dg = this.add.graphics();
    dg.fillStyle(0x00ffcc, 1);
    dg.fillTriangle(8, 0, 0, 16, 16, 16);
    dg.generateTexture('drone', 16, 16);
    dg.destroy();

    // Player bullet
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.PLAYER_BULLET, 1);
    bg.fillRect(2, 0, 4, 12);
    bg.generateTexture('bullet_player', 8, 12);
    bg.destroy();

    // Enemy bullet
    const ebg = this.add.graphics();
    ebg.fillStyle(COLORS.ENEMY_BULLET, 1);
    ebg.fillCircle(4, 4, 4);
    ebg.generateTexture('bullet_enemy', 8, 8);
    ebg.destroy();

    // Enemies (data-driven from ENEMIES table)
    for (const def of ENEMIES) {
      this.generateEnemyTexture(def.graphic, def.color);
    }

    // Boss
    const boss = this.add.graphics();
    boss.fillStyle(COLORS.BOSS, 1);
    boss.fillRoundedRect(0, 0, 60, 50, 8);
    boss.fillStyle(0xff4488, 1);
    boss.fillCircle(15, 15, 6);
    boss.fillCircle(45, 15, 6);
    boss.fillRect(10, 35, 40, 8);
    boss.generateTexture('boss', 60, 50);
    boss.destroy();

    // Mid Boss (小型・橙色)
    const mb = this.add.graphics();
    mb.fillStyle(0xff8844, 1);
    mb.fillRoundedRect(0, 0, 48, 40, 6);
    mb.fillStyle(0xffcc00, 1);
    mb.fillCircle(12, 12, 5);
    mb.fillCircle(36, 12, 5);
    mb.fillRect(8, 28, 32, 6);
    mb.lineStyle(2, 0xffffff, 0.4);
    mb.strokeRoundedRect(0, 0, 48, 40, 6);
    mb.generateTexture('midboss', 48, 40);
    mb.destroy();

    // PowerUp coin
    const cg = this.add.graphics();
    cg.fillStyle(COLORS.POWERUP_COIN, 1);
    cg.fillCircle(6, 6, 6);
    cg.lineStyle(1, 0xffa500);
    cg.strokeCircle(6, 6, 6);
    cg.generateTexture('powerup_coin', 12, 12);
    cg.destroy();

    // PowerUp heal
    const hg = this.add.graphics();
    hg.fillStyle(COLORS.POWERUP_HP, 1);
    hg.fillCircle(6, 6, 6);
    hg.fillStyle(0xffffff, 1);
    hg.fillRect(4, 2, 4, 8);
    hg.fillRect(2, 4, 8, 4);
    hg.generateTexture('powerup_heal', 12, 12);
    hg.destroy();

    // Special drops (gacha ticket / gem / rare part)
    this.generateDropTexture('drop_gacha_ticket', DROP_TYPES.gacha_ticket.color, 'ticket');
    this.generateDropTexture('drop_gem', DROP_TYPES.gem.color, 'gem');
    this.generateDropTexture('drop_rare_part', DROP_TYPES.rare_part.color, 'part');

    // Explosion particle
    const exp = this.add.graphics();
    exp.fillStyle(0xffffff, 1);
    exp.fillCircle(3, 3, 3);
    exp.generateTexture('particle', 6, 6);
    exp.destroy();

    // Obstacle: 壊れない岩塊 (鋼色の八角形 + リベット)
    const ob = this.add.graphics();
    ob.fillStyle(0x555566, 1);
    ob.fillRoundedRect(0, 0, 36, 36, 6);
    ob.fillStyle(0x777788, 1);
    ob.fillRoundedRect(3, 3, 30, 30, 4);
    ob.fillStyle(0x333344, 1);
    ob.fillCircle(8, 8, 2);
    ob.fillCircle(28, 8, 2);
    ob.fillCircle(8, 28, 2);
    ob.fillCircle(28, 28, 2);
    ob.fillStyle(0xff3333, 1);
    ob.fillCircle(18, 18, 4);
    ob.lineStyle(2, 0x222233, 1);
    ob.strokeRoundedRect(0, 0, 36, 36, 6);
    ob.generateTexture('obstacle', 36, 36);
    ob.destroy();
  }

  private generateEnemyTexture(key: string, color: number): void {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillTriangle(12, 24, 0, 0, 24, 0);
    g.lineStyle(1, 0xffffff, 0.3);
    g.strokeTriangle(12, 24, 0, 0, 24, 0);
    g.generateTexture(key, 24, 24);
    g.destroy();
  }

  private generateDropTexture(key: string, color: number, shape: 'ticket' | 'gem' | 'part'): void {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    if (shape === 'ticket') {
      // Ticket: rounded rectangle
      g.fillRoundedRect(1, 3, 14, 10, 2);
      g.lineStyle(1, 0xffffff, 0.6);
      g.strokeRoundedRect(1, 3, 14, 10, 2);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(8, 8, 1.5);
    } else if (shape === 'gem') {
      // Gem: diamond
      g.fillTriangle(8, 1, 1, 8, 15, 8);
      g.fillTriangle(1, 8, 15, 8, 8, 15);
      g.lineStyle(1, 0xffffff, 0.7);
      g.strokeTriangle(8, 1, 1, 8, 15, 8);
      g.strokeTriangle(1, 8, 15, 8, 8, 15);
    } else {
      // Part: hexagon
      g.fillCircle(8, 8, 6);
      g.lineStyle(1, 0xffffff, 0.6);
      g.strokeCircle(8, 8, 6);
    }
    g.generateTexture(key, 16, 16);
    g.destroy();
  }
}
