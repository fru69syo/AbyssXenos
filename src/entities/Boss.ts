import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { BossData, BossPattern } from '../data/stages';
import { Bullet } from './Bullet';
import { playAnimIfExists } from '../utils/playAnimIfExists';

export class Boss extends Phaser.Physics.Arcade.Sprite {
  hp: number = 30;
  maxHp: number = 30;
  moveSpeed: number = 60;
  private patterns: BossPattern[] = [];
  private ragePatterns: BossPattern[] | null = null;
  private patternIndex: number = 0;
  private patternTimer: number = 0;
  private patternInterval: number = 2000;
  private baseInterval: number = 2000;
  private raging: boolean = false;
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
    this.ragePatterns = data.ragePatterns ?? null;
    this.patternIndex = 0;
    this.patternTimer = 0;
    this.baseInterval = data.interval ?? 2000;
    this.patternInterval = this.baseInterval;
    this.raging = false;
    this.entering = true;
    this.targetY = 100;
    this.setTexture('boss');
    this.setScale(1);
    this.setPosition(GAME_WIDTH / 2, -60);
    this.setActive(true);
    this.setVisible(true);
    (this.body as Phaser.Physics.Arcade.Body).enable = true;
    playAnimIfExists(this, 'boss_idle');
  }

  initAsMidBoss(data: BossData): void {
    this.hp = data.hp;
    this.maxHp = data.hp;
    this.moveSpeed = data.speed;
    this.patterns = data.attackPatterns;
    this.ragePatterns = data.ragePatterns ?? null;
    this.patternIndex = 0;
    this.patternTimer = 0;
    this.baseInterval = data.interval ?? 1800;
    this.patternInterval = this.baseInterval;
    this.raging = false;
    this.entering = true;
    this.targetY = 80;
    this.setTexture('midboss');
    this.setScale(0.85);
    this.setPosition(GAME_WIDTH / 2, -40);
    this.setActive(true);
    this.setVisible(true);
    (this.body as Phaser.Physics.Arcade.Body).enable = true;
    playAnimIfExists(this, 'midboss_idle');
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
    const pool = this.raging && this.ragePatterns ? this.ragePatterns : this.patterns;
    const pattern = pool[this.patternIndex % pool.length];
    switch (pattern) {
      case 'spread':      this.attackSpread(); break;
      case 'aimed':       this.attackAimed(); break;
      case 'spiral':      this.attackSpiral(); break;
      case 'laser':       this.attackLaser(); break;
      case 'ring':        this.attackRing(); break;
      case 'burst_aimed': this.attackBurstAimed(); break;
      case 'cross':       this.attackCross(); break;
      case 'scatter':     this.attackScatter(); break;
    }
  }

  // --- 既存パターン (発狂時は弾数・速度が増加) ---

  private attackSpread(): void {
    const count = this.raging ? 8 : 5;
    const speed = this.raging ? 240 : 200;
    const spreadAngle = Math.PI * 0.6;
    const startAngle = Math.PI / 2 - spreadAngle / 2;
    for (let i = 0; i < count; i++) {
      const angle = startAngle + (spreadAngle / (count - 1)) * i;
      this.fireBullet(this.x, this.y + 20, Math.cos(angle) * speed, Math.sin(angle) * speed);
    }
  }

  private attackAimed(): void {
    const player = this.getPlayer();
    if (!player) return;
    const count = this.raging ? 5 : 3;
    const speed = this.raging ? 290 : 250;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const half = (count - 1) / 2;
    for (let i = 0; i < count; i++) {
      const a = angle + (i - half) * 0.12;
      this.fireBullet(this.x, this.y + 20, Math.cos(a) * speed, Math.sin(a) * speed);
    }
  }

  private attackSpiral(): void {
    const arms = this.raging ? 6 : 4;
    const speed = this.raging ? 220 : 180;
    const baseAngle = (Date.now() * 0.003) % (Math.PI * 2);
    for (let i = 0; i < arms; i++) {
      const a = baseAngle + (Math.PI * 2 / arms) * i;
      this.fireBullet(this.x, this.y, Math.cos(a) * speed, Math.sin(a) * speed);
    }
  }

  private attackLaser(): void {
    const shots = this.raging ? 12 : 8;
    const speed = this.raging ? 350 : 300;
    for (let i = 0; i < shots; i++) {
      this.scene.time.delayedCall(i * 70, () => {
        if (!this.active) return;
        this.fireBullet(this.x, this.y + 20, 0, speed + i * 20);
      });
    }
  }

  // --- 新パターン ---

  /** 360° 全方位リング弾 */
  private attackRing(): void {
    const count = this.raging ? 16 : 12;
    const speed = this.raging ? 220 : 180;
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 / count) * i;
      this.fireBullet(this.x, this.y, Math.cos(a) * speed, Math.sin(a) * speed);
    }
  }

  /** 自機狙い連射 (マシンガン) */
  private attackBurstAimed(): void {
    const player = this.getPlayer();
    if (!player) return;
    const shots = this.raging ? 7 : 5;
    const speed = this.raging ? 310 : 270;
    for (let i = 0; i < shots; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        if (!this.active) return;
        const p = this.getPlayer();
        if (!p) return;
        const a = Phaser.Math.Angle.Between(this.x, this.y, p.x, p.y);
        this.fireBullet(this.x, this.y + 20, Math.cos(a) * speed, Math.sin(a) * speed);
      });
    }
  }

  /** 十字 + 斜め8方向弾 */
  private attackCross(): void {
    const speed = this.raging ? 240 : 200;
    const dirs = this.raging ? 8 : 4;
    for (let i = 0; i < dirs; i++) {
      const a = (Math.PI * 2 / dirs) * i;
      this.fireBullet(this.x, this.y, Math.cos(a) * speed, Math.sin(a) * speed);
    }
    // 0.15 秒後に位相をずらして第2波
    this.scene.time.delayedCall(150, () => {
      if (!this.active) return;
      const speed2 = speed * 0.8;
      for (let i = 0; i < dirs; i++) {
        const a = (Math.PI * 2 / dirs) * i + Math.PI / dirs;
        this.fireBullet(this.x, this.y, Math.cos(a) * speed2, Math.sin(a) * speed2);
      }
    });
  }

  /** ランダム散弾 (弾幕) */
  private attackScatter(): void {
    const count = this.raging ? 14 : 9;
    const speedMin = this.raging ? 150 : 120;
    const speedMax = this.raging ? 300 : 240;
    for (let i = 0; i < count; i++) {
      const a = Math.PI * 0.15 + Math.random() * Math.PI * 0.7; // 下向き 27°〜153°
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      this.fireBullet(this.x, this.y + 20, Math.cos(a) * speed, Math.sin(a) * speed);
    }
  }

  // --- ヘルパ ---

  private getPlayer(): Phaser.Physics.Arcade.Sprite | null {
    const p = this.scene.registry.get('player') as Phaser.Physics.Arcade.Sprite | undefined;
    return p && p.active ? p : null;
  }

  private fireBullet(x: number, y: number, vx: number, vy: number): void {
    const bullet = this.enemyBullets.getFirstDead(false) as Bullet | null;
    if (!bullet) return;
    bullet.fire(x, y, vx, vy, 1);
  }

  takeDamage(amount: number): boolean {
    if (this.entering) return false;
    this.hp -= amount;

    // 発狂フェーズ突入 (HP 50% 以下)
    if (!this.raging && this.hp <= this.maxHp * 0.5 && this.hp > 0) {
      this.raging = true;
      this.patternInterval = Math.floor(this.baseInterval * 0.65);
      this.patternIndex = 0;
      this.moveSpeed *= 1.3;
      this.setTint(0xff6666);
      this.scene.cameras.main.shake(200, 0.008);
      return false;
    }

    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) this.clearTint();
      if (this.raging && this.active) this.setTint(0xff6666);
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
