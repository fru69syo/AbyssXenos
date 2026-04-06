import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number = 1;
  maxHp: number = 1;
  moveSpeed: number = 100;
  scoreValue: number = 10;
  coinDrop: number = 1;
  shootChance: number = 0;
  movePattern: 'drifter' | 'zigzag' | 'shooter' | 'swarm' = 'drifter';
  private zigzagTimer: number = 0;
  private zigzagDir: number = 1;
  private frozen: boolean = false;
  private frozenTimer: number = 0;
  private burning: boolean = false;
  private burnTimer: number = 0;
  private burnDamageTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setData('isEnemy', true);
  }

  spawn(x: number, y: number, type: string, speed: number, shootChance: number): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    (this.body as Phaser.Physics.Arcade.Body).enable = true;
    this.moveSpeed = speed;
    this.shootChance = shootChance;
    this.movePattern = type as typeof this.movePattern;
    this.frozen = false;
    this.burning = false;
    this.zigzagTimer = 0;
    this.zigzagDir = Math.random() > 0.5 ? 1 : -1;

    switch (type) {
      case 'drifter': this.hp = 2; this.scoreValue = 10; this.coinDrop = 1; break;
      case 'zigzag': this.hp = 3; this.scoreValue = 15; this.coinDrop = 1; break;
      case 'shooter': this.hp = 4; this.scoreValue = 25; this.coinDrop = 2; break;
      case 'swarm': this.hp = 1; this.scoreValue = 5; this.coinDrop = 1; break;
    }
    this.maxHp = this.hp;
    this.setScale(type === 'swarm' ? 0.7 : 1);
  }

  update(_time: number, delta: number): void {
    if (!this.active) return;

    // Frozen state
    if (this.frozen) {
      this.frozenTimer -= delta;
      if (this.frozenTimer <= 0) this.frozen = false;
      this.setVelocity(0, 0);
      return;
    }

    // Burn DoT
    if (this.burning) {
      this.burnTimer -= delta;
      this.burnDamageTimer -= delta;
      if (this.burnDamageTimer <= 0) {
        this.burnDamageTimer = 500;
        this.hp -= 1;
        if (this.hp <= 0) {
          this.deactivate();
          return;
        }
      }
      if (this.burnTimer <= 0) this.burning = false;
    }

    // Movement
    switch (this.movePattern) {
      case 'drifter':
        this.setVelocity(0, this.moveSpeed);
        break;
      case 'zigzag':
        this.zigzagTimer += delta;
        if (this.zigzagTimer > 800) {
          this.zigzagTimer = 0;
          this.zigzagDir *= -1;
        }
        this.setVelocity(this.zigzagDir * this.moveSpeed * 0.6, this.moveSpeed * 0.8);
        break;
      case 'shooter':
        this.setVelocity(0, this.moveSpeed * 0.6);
        break;
      case 'swarm':
        this.setVelocity(
          Math.sin(Date.now() * 0.003 + this.x) * this.moveSpeed * 0.3,
          this.moveSpeed
        );
        break;
    }

    // Off-screen check
    if (this.y > GAME_HEIGHT + 50) {
      this.deactivate();
    }
  }

  takeDamage(amount: number, hasFreeze: boolean, hasBurn: boolean): boolean {
    this.hp -= amount;

    if (hasFreeze && !this.frozen) {
      this.frozen = true;
      this.frozenTimer = 1000;
      this.setTint(0x88ccff);
    }

    if (hasBurn && !this.burning) {
      this.burning = true;
      this.burnTimer = 2000;
      this.burnDamageTimer = 500;
      this.setTint(0xff4400);
    }

    if (!hasFreeze && !hasBurn) this.clearTint();

    // Flash white on hit
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) {
        if (this.frozen) this.setTint(0x88ccff);
        else if (this.burning) this.setTint(0xff4400);
        else this.clearTint();
      }
    });

    return this.hp <= 0;
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    if (this.body) (this.body as Phaser.Physics.Arcade.Body).enable = false;
  }
}
