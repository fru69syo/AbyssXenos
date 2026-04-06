import { COLORS } from '../config';

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

    // Enemies
    this.generateEnemyTexture('enemy_drifter', COLORS.ENEMY_BASIC);
    this.generateEnemyTexture('enemy_zigzag', COLORS.ENEMY_ZIGZAG);
    this.generateEnemyTexture('enemy_shooter', COLORS.ENEMY_SHOOTER);
    this.generateEnemyTexture('enemy_swarm', COLORS.ENEMY_SWARM);

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

    // Explosion particle
    const exp = this.add.graphics();
    exp.fillStyle(0xffffff, 1);
    exp.fillCircle(3, 3, 3);
    exp.generateTexture('particle', 6, 6);
    exp.destroy();
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
}
