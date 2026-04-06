import { GAME_WIDTH, GAME_HEIGHT, PLAYER } from '../config';
import { RunState } from '../managers/RunState';
import { Bullet } from './Bullet';

export class Player extends Phaser.Physics.Arcade.Sprite {
  runState!: RunState;
  private fireTimer: number = 0;
  private bullets!: Phaser.GameObjects.Group;
  private invincible: boolean = false;
  private invincibleTimer: number = 0;
  private drones: Phaser.GameObjects.Sprite[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    (this.body as Phaser.Physics.Arcade.Body).setSize(20, 20);
  }

  init(runState: RunState, bulletGroup: Phaser.GameObjects.Group): void {
    this.runState = runState;
    this.bullets = bulletGroup;
    this.setActive(true);
    this.setVisible(true);
    this.invincible = false;
    this.updateDrones();
  }

  update(_time: number, delta: number): void {
    if (!this.active) return;

    this.fireTimer += delta;
    if (this.fireTimer >= this.runState.fireRate) {
      this.fireTimer = 0;
      this.shoot();
    }

    if (this.invincible) {
      this.invincibleTimer -= delta;
      this.setAlpha(Math.sin(this.invincibleTimer * 0.02) > 0 ? 1 : 0.3);
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.setAlpha(1);
      }
    }

    // Update drone positions
    for (let i = 0; i < this.drones.length; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const offset = (Math.floor(i / 2) + 1) * 35;
      this.drones[i].setPosition(this.x + side * offset, this.y);
    }
  }

  private shoot(): void {
    const patterns = this.getShootPatterns();
    for (const pattern of patterns) {
      this.fireBullet(pattern.x, pattern.y, pattern.vx, pattern.vy);
    }

    // Drone shots
    for (const drone of this.drones) {
      this.fireBullet(drone.x, drone.y, 0, -this.runState.bulletSpeed);
    }
  }

  private getShootPatterns(): { x: number; y: number; vx: number; vy: number }[] {
    const patterns: { x: number; y: number; vx: number; vy: number }[] = [];
    const speed = this.runState.bulletSpeed;

    switch (this.runState.shotPattern) {
      case 'single':
        patterns.push({ x: this.x, y: this.y - 15, vx: 0, vy: -speed });
        break;
      case 'double':
        patterns.push({ x: this.x - 8, y: this.y - 15, vx: -speed * 0.1, vy: -speed });
        patterns.push({ x: this.x + 8, y: this.y - 15, vx: speed * 0.1, vy: -speed });
        break;
      case 'triple':
        patterns.push({ x: this.x, y: this.y - 15, vx: 0, vy: -speed });
        patterns.push({ x: this.x - 8, y: this.y - 15, vx: -speed * 0.3, vy: -speed * 0.95 });
        patterns.push({ x: this.x + 8, y: this.y - 15, vx: speed * 0.3, vy: -speed * 0.95 });
        break;
    }

    if (this.runState.hasRearShot) {
      patterns.push({ x: this.x, y: this.y + 15, vx: 0, vy: speed * 0.8 });
    }

    return patterns;
  }

  private fireBullet(x: number, y: number, vx: number, vy: number): void {
    const bullet = this.bullets.getFirstDead(false) as Bullet | null;
    if (!bullet) return;

    bullet.fire(x, y, vx, vy, this.runState.atk);
    bullet.isPiercing = this.runState.hasPierce;
    bullet.isHoming = this.runState.hasHoming;
    bullet.hasFreeze = this.runState.hasFreeze;
    bullet.hasBurn = this.runState.hasBurn;
    bullet.hasSplit = this.runState.hasSplitShot;
    bullet.setScale(this.runState.bulletSizeMultiplier);
  }

  takeDamage(amount: number): boolean {
    if (this.invincible) return false;

    if (this.runState.shield > 0) {
      this.runState.shield--;
      this.setInvincible(500);
      return false;
    }

    const dmg = Math.max(1, amount - this.runState.defense);
    this.runState.hp -= dmg;
    this.setInvincible(1000);

    if (this.runState.hp <= 0) {
      this.runState.hp = 0;
      return true; // dead
    }
    return false;
  }

  setInvincible(duration: number): void {
    this.invincible = true;
    this.invincibleTimer = duration;
  }

  updateDrones(): void {
    // Clear old drones
    for (const d of this.drones) d.destroy();
    this.drones = [];

    for (let i = 0; i < this.runState.drones; i++) {
      const drone = this.scene.add.sprite(this.x, this.y, 'drone');
      drone.setScale(0.6);
      this.drones.push(drone);
    }
  }

  destroyDrones(): void {
    for (const d of this.drones) d.destroy();
    this.drones = [];
  }
}
