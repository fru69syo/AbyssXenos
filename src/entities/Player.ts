import { GAME_WIDTH, GAME_HEIGHT, PLAYER } from '../config';
import { RunState } from '../managers/RunState';
import { Bullet } from './Bullet';
import { AudioManager } from '../audio/AudioManager';

export class Player extends Phaser.Physics.Arcade.Sprite {
  runState!: RunState;
  private fireTimer: number = 0;
  private bullets!: Phaser.GameObjects.Group;
  private invincible: boolean = false;
  private invincibleTimer: number = 0;
  private drones: Phaser.GameObjects.Sprite[] = [];
  private shotCount: number = 0;

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
    this.shotCount = 0;
    this.updateDrones();
  }

  update(_time: number, delta: number): void {
    if (!this.active) return;

    // Effective fire rate: single additive reduction model (prevents cascade from multiple skills)
    let effectiveFireRate = this.runState.fireRate * (1 - this.runState.fireRateReduction);
    if (this.runState.rapidFireActive) effectiveFireRate *= 0.5;
    effectiveFireRate = Math.max(40, effectiveFireRate);

    this.fireTimer += delta;
    if (this.fireTimer >= effectiveFireRate) {
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
    this.shotCount++;
    AudioManager.get().playShoot();
    const patterns = this.getShootPatterns();
    for (const pattern of patterns) {
      this.fireBullet(pattern.x, pattern.y, pattern.vx, pattern.vy);
    }

    // Drone shots
    for (const drone of this.drones) {
      if (this.runState.droneAllDirection) {
        // Fire in 4 directions
        const speed = this.runState.bulletSpeed;
        this.fireBullet(drone.x, drone.y, 0, -speed);       // Up
        this.fireBullet(drone.x, drone.y, 0, speed * 0.6);  // Down
        this.fireBullet(drone.x, drone.y, -speed * 0.5, 0); // Left
        this.fireBullet(drone.x, drone.y, speed * 0.5, 0);  // Right
      } else {
        this.fireBullet(drone.x, drone.y, 0, -this.runState.bulletSpeed);
      }
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

    // Power shot: every 5th shot deals 3x damage
    let damage = this.runState.atk;
    if (this.runState.hasPowerShot && this.shotCount % 5 === 0) {
      damage *= 3;
    }

    bullet.fire(x, y, vx, vy, damage);
    bullet.isPiercing = this.runState.hasPierce;
    bullet.isHoming = this.runState.hasHoming;
    bullet.hasExplosion = this.runState.hasExplosion;
    bullet.hasMultiBounce = this.runState.hasMultiBounce;
    bullet.setScale(this.runState.bulletSizeMultiplier);

    // Elemental burst: random element per shot
    if (this.runState.hasElementalBurst) {
      const roll = Math.random();
      bullet.hasFreeze = roll < 0.33;
      bullet.hasBurn = roll >= 0.33 && roll < 0.66;
    } else {
      bullet.hasFreeze = this.runState.hasFreeze;
      bullet.hasBurn = this.runState.hasBurn;
    }
    bullet.hasSplit = this.runState.hasSplitShot;

    // Power shot visual: larger + tinted
    if (this.runState.hasPowerShot && this.shotCount % 5 === 0) {
      bullet.setScale(this.runState.bulletSizeMultiplier * 1.8);
      bullet.setTint(0xffaa00);
    }
  }

  takeDamage(amount: number): boolean {
    if (this.invincible) return false;

    // Dodge check — thorns only fires on dodge if afterimage evolution is active (dodgeChance >= 0.3)
    if (this.runState.dodgeChance > 0 && Math.random() < this.runState.dodgeChance) {
      this.showDamageText('DODGE!', '#44ffaa');
      this.setInvincible(300);
      if (this.runState.hasThorns && this.runState.dodgeChance >= 0.3) this.fireThorns();
      return false;
    }

    // Shield consumed — the shield itself is the defense; no thorns / timeSlow / absorb trigger
    if (this.runState.shield > 0) {
      this.runState.shield--;
      this.setInvincible(500);
      return false;
    }

    let dmg = Math.max(1, amount - this.runState.defense);

    // Damage cap
    if (this.runState.hasDamageCap) dmg = 1;

    this.runState.hp -= dmg;
    this.setInvincible(1000);
    AudioManager.get().playDamage();

    // Thorns: retaliatory bullet
    if (this.runState.hasThorns) this.fireThorns();

    // Time slow on hit
    if (this.runState.hasTimeSlow) {
      this.scene.time.timeScale = 0.3;
      this.scene.time.delayedCall(300, () => {
        this.scene.time.timeScale = 1;
      });
    }

    // Absorb: 30% chance to heal 1 HP on damage
    if (this.runState.hasAbsorb && Math.random() < 0.3) {
      this.runState.hp = Math.min(this.runState.hp + 1, this.runState.maxHp);
      this.showDamageText('ABSORB', '#88ff88');
    }

    // Last Stand: prevent death once
    if (this.runState.hp <= 0 && this.runState.hasLastStand && !this.runState.lastStandUsed) {
      this.runState.hp = 1;
      this.runState.lastStandUsed = true;
      this.setInvincible(2000);
      this.showDamageText('LAST STAND!', '#ff4444');
      this.scene.cameras.main.flash(300, 255, 50, 50);
      return false;
    }

    if (this.runState.hp <= 0) {
      this.runState.hp = 0;
      return true; // dead
    }
    return false;
  }

  private fireThorns(): void {
    const bullet = this.bullets.getFirstDead(false) as Bullet | null;
    if (!bullet) return;
    const damage = Math.max(1, Math.floor(this.runState.atk * this.runState.thornsDamageMul));
    bullet.fire(this.x, this.y - 10, 0, -this.runState.bulletSpeed * 1.2, damage);
    bullet.isPiercing = true;
    bullet.isHoming = this.runState.thornsHoming;
    bullet.setScale(1.5);
    bullet.setTint(0xff4444);
  }

  private showDamageText(text: string, color: string): void {
    const t = this.scene.add.text(this.x, this.y - 30, text, {
      fontSize: '14px', color, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(60);
    this.scene.tweens.add({
      targets: t, y: t.y - 30, alpha: 0, duration: 700,
      onComplete: () => t.destroy(),
    });
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
