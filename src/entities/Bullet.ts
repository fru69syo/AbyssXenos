import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { playAnimIfExists } from '../utils/playAnimIfExists';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  damage: number = 1;
  isPiercing: boolean = false;
  isHoming: boolean = false;
  hasFreeze: boolean = false;
  hasBurn: boolean = false;
  hasSplit: boolean = false;
  hasExplosion: boolean = false;
  hasMultiBounce: boolean = false;
  /** 後方に撃ち出された弾 (true の場合、前方へは向かず後方にしか進めない) */
  isRearShot: boolean = false;
  private bounceCount: number = 0;
  private maxBounces: number = 3;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  fire(x: number, y: number, velocityX: number, velocityY: number, damage: number): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    (this.body as Phaser.Physics.Arcade.Body).enable = true;
    this.setVelocity(velocityX, velocityY);
    this.damage = damage;
    this.bounceCount = 0;
    this.isRearShot = false;
    playAnimIfExists(this, `${this.texture.key}_idle`);
  }

  update(): void {
    if (!this.active) return;

    if (this.isHoming) {
      // 進行方向の enemy だけを追尾対象にする。
      // 前方弾 = 現在位置より上(または同じ y)の敵、後方弾 = 下の敵。
      const isRear = this.isRearShot;
      const enemies = this.scene.children.getAll().filter(
        (obj): obj is Phaser.Physics.Arcade.Sprite =>
          obj instanceof Phaser.Physics.Arcade.Sprite &&
          obj.getData('isEnemy') === true &&
          obj.active &&
          (isRear ? obj.y >= this.y : obj.y <= this.y)
      );

      if (enemies.length > 0) {
        let closest = enemies[0];
        let minDist = Phaser.Math.Distance.Between(this.x, this.y, closest.x, closest.y);
        for (const e of enemies) {
          const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
          if (dist < minDist) { closest = e; minDist = dist; }
        }
        const angle = Phaser.Math.Angle.Between(this.x, this.y, closest.x, closest.y);
        const speed = Math.sqrt(this.body!.velocity.x ** 2 + this.body!.velocity.y ** 2);
        let newVx = Math.cos(angle) * speed;
        let newVy = Math.sin(angle) * speed;
        // 方向制約: 前方弾は後退禁止、後方弾は前進禁止
        if (isRear) newVy = Math.max(newVy, 0);
        else newVy = Math.min(newVy, 0);
        this.setVelocity(newVx, newVy);
      }
    }

    // Wall bounce for multi-bounce bullets
    if (this.hasMultiBounce && this.bounceCount < this.maxBounces) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      let bounced = false;
      if (this.x <= 2 || this.x >= GAME_WIDTH - 2) {
        body.velocity.x *= -1;
        this.x = Phaser.Math.Clamp(this.x, 3, GAME_WIDTH - 3);
        bounced = true;
      }
      if (this.y <= 2) {
        body.velocity.y *= -1;
        this.y = 3;
        bounced = true;
      }
      if (bounced) {
        this.bounceCount++;
        return; // Don't deactivate this frame
      }
    }

    if (this.y < -20 || this.y > GAME_HEIGHT + 20 || this.x < -20 || this.x > GAME_WIDTH + 20) {
      this.deactivate();
    }
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    if (this.body) (this.body as Phaser.Physics.Arcade.Body).enable = false;
  }
}
