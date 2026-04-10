import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { BossData } from '../data/stages';
import { Bullet } from './Bullet';

export class Boss extends Phaser.Physics.Arcade.Sprite {
  hp: number = 30;
  maxHp: number = 30;
  moveSpeed: number = 60;
  private patterns: string[] = [];
  private patternIndex: number = 0;
  private patternTimer: number = 0;
  private patternInterval: number = 2000;
  private moveDir: number = 1;
  private enemyBullets!: Phaser.GameObjects.Group;
  private targetY: number = 100;
  private entering: boolean = true;

  constructor(scene: Phaser.Scene, enemyBullets: Phaser.GameObjects.Group) {
    super(scene, GAME_WIDTH / 2, -60, 'boss');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setData('isEnemy', true);
    this.setData('isBoss', true);
    this.enemyBullets = enemyBullets;
  }

  init(data: BossData): void {
    this.hp = data.hp;
    this.maxHp = data.hp;
    this.moveSpeed = data.speed;
    this.patterns = data.attackPatterns;
    this.patternIndex = 0;
    this.patternTimer = 0;
    this.patternInterval = 2000;
    this.entering = true;
    this.targetY = 100;
    this.setTexture('boss');
    this.setScale(1);
    this.setPosition(GAME_WIDTH / 2, -60);
    this.setActive(true);
    this.setVisible(true);
    (this.body as Phaser.Physics.Arcade.Body).enable = true;
  }

  initAsMidBoss(data: BossData): void {
    this.hp = data.hp;
    this.maxHp = data.hp;
    this.moveSpeed = data.speed;
    this.patterns = data.attackPatterns;
    this.patternIndex = 0;
    this.patternTimer = 0;
    this.patternInterval = 1800;
    this.entering = true;
    this.targetY = 80;
    this.setTexture('midboss');
    this.setScale(0.85);
    this.setPosition(GAME_WIDTH / 2, -40);
    this.setActive(true);
    this.setVisible(true);
    (this.body as Phaser.Physics.Arcade.Body).enable = true;
  }

  update(_time: number, delta: number): void {
    if (!this.active) return;

    // Entry animation
    if (this.entering) {
      this.y += 1;
      if (this.y >= this.targetY) {
        this.entering = false;
        this.y = this.targetY;
      }
      return;
    }

    // Horizontal movement
    this.x += this.moveDir * this.moveSpeed * (delta / 1000);
    if (this.x > GAME_WIDTH - 40) this.moveDir = -1;
    if (this.x < 40) this.moveDir = 1;

    // Attack patterns
    this.patternTimer += delta;
    if (this.patternTimer >= this.patternInterval) {
      this.patternTimer = 0;
      this.executePattern();
      this.patternIndex = (this.patternIndex + 1) % this.patterns.length;
    }
  }

  private executePattern(): void {
    const pattern = this.patterns[this.patternIndex];
    switch (pattern) {
      case 'spread': this.attackSpread(); break;
      case 'aimed': this.attackAimed(); break;
      case 'spiral': this.attackSpiral(); break;
      case 'laser': this.attackLaser(); break;
    }
  }

  private attackSpread(): void {
    const count = 5;
    const spreadAngle = Math.PI * 0.6;
    const startAngle = Math.PI / 2 - spreadAngle / 2;

    for (let i = 0; i < count; i++) {
      const angle = startAngle + (spreadAngle / (count - 1)) * i;
      this.fireBullet(this.x, this.y + 20, Math.cos(angle) * 200, Math.sin(angle) * 200);
    }
  }

  private attackAimed(): void {
    const player = this.scene.children.getByName('player') as Phaser.Physics.Arcade.Sprite;
    if (!player || !player.active) return;

    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    for (let i = -1; i <= 1; i++) {
      const a = angle + i * 0.15;
      this.fireBullet(this.x, this.y + 20, Math.cos(a) * 250, Math.sin(a) * 250);
    }
  }

  private attackSpiral(): void {
    const baseAngle = (Date.now() * 0.003) % (Math.PI * 2);
    for (let i = 0; i < 4; i++) {
      const a = baseAngle + (Math.PI * 2 / 4) * i;
      this.fireBullet(this.x, this.y, Math.cos(a) * 180, Math.sin(a) * 180);
    }
  }

  private attackLaser(): void {
    for (let i = 0; i < 8; i++) {
      this.scene.time.delayedCall(i * 80, () => {
        if (!this.active) return;
        this.fireBullet(this.x, this.y + 20, 0, 300 + i * 20);
      });
    }
  }

  private fireBullet(x: number, y: number, vx: number, vy: number): void {
    const bullet = this.enemyBullets.getFirstDead(false) as Bullet | null;
    if (!bullet) return;
    bullet.fire(x, y, vx, vy, 1);
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;

    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) this.clearTint();
    });

    return this.hp <= 0;
  }

  getHpPercent(): number {
    return this.hp / this.maxHp;
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    if (this.body) (this.body as Phaser.Physics.Arcade.Body).enable = false;
  }
}
