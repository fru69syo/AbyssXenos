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
  /** 敵弾が自機を追尾する */
  enemyHoming: boolean = false;
  /** > 0 の間カウントダウン、0 到達で爆発イベント発火 */
  explodeIn: number = 0;
  explodeRadius: number = 50;
  explodeDamage: number = 1;
  /** > 0 の間カウントダウン、0 で停止 */
  stopAfter: number = 0;
  /** stopAfter 0 到達後、自機方向に再発射する */
  resumeAim: boolean = false;
  /** 再アイム後の速度 (px/s) */
  resumeSpeed: number = 260;
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
    // Reset enemy-bullet-specific behaviors
    this.enemyHoming = false;
    this.explodeIn = 0;
    this.stopAfter = 0;
    this.resumeAim = false;
    this.clearTint();
    playAnimIfExists(this, `${this.texture.key}_idle`);
  }

  update(_time?: number, delta: number = 16): void {
    if (!this.active) return;

    // Timed explosion (enemy delayed_explode)
    if (this.explodeIn > 0) {
      this.explodeIn -= delta;
      if (this.explodeIn <= 0) {
        this.scene.events.emit('enemy-bullet-explode', {
          x: this.x,
          y: this.y,
          radius: this.explodeRadius,
          damage: this.explodeDamage,
        });
        this.deactivate();
        return;
      }
    }

    // Stop-then-aim behaviour for enemy bullets
    if (this.stopAfter > 0) {
      this.stopAfter -= delta;
      if (this.stopAfter <= 0) {
        this.stopAfter = -1; // guard: prevent re-entry
        this.setVelocity(0, 0);
        if (this.resumeAim) {
          const player = this.scene.registry.get('player') as Phaser.GameObjects.Sprite | undefined;
          if (player && player.active) {
            const a = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            this.setVelocity(Math.cos(a) * this.resumeSpeed, Math.sin(a) * this.resumeSpeed);
          } else {
            this.setVelocity(0, this.resumeSpeed);
          }
        }
      }
    }

    // Enemy homing: track player instead of enemies
    if (this.enemyHoming) {
      const player = this.scene.registry.get('player') as Phaser.GameObjects.Sprite | undefined;
      if (player && player.active) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        const vx = this.body!.velocity.x;
        const vy = this.body!.velocity.y;
        const speed = Math.sqrt(vx * vx + vy * vy) || 220;
        this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      }
    }

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
