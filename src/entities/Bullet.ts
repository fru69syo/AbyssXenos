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
  /** ホーミング対象 (射出時に固定。死亡後は再取得しない) */
  private lockedTarget: Phaser.Physics.Arcade.Sprite | null = null;

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
    // ホーミングロックは発射毎にクリア。前弾の参照を引き継がない。
    this.lockedTarget = null;
    this.clearTint();
    playAnimIfExists(this, `${this.texture.key}_idle`);
  }

  /** 射出時に 1 回だけ呼び、追尾対象を固定する */
  setHomingTarget(target: Phaser.Physics.Arcade.Sprite | null): void {
    this.lockedTarget = target;
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

    if (this.isHoming && this.lockedTarget && this.lockedTarget.active) {
      // ロックした敵のみに微弱な角度補正を適用。再ターゲットは行わない。
      // 対象が死亡/null の場合はそのまま直進する。
      const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, this.lockedTarget.x, this.lockedTarget.y);
      const vx = this.body!.velocity.x;
      const vy = this.body!.velocity.y;
      const speed = Math.hypot(vx, vy);
      if (speed > 0) {
        const currentAngle = Math.atan2(vy, vx);
        // 最短回転量 (-π 〜 +π) に正規化して 1 フレームあたりの旋回を制限
        const diff = Phaser.Math.Angle.Wrap(targetAngle - currentAngle);
        const MAX_TURN = 0.035; // ≒ 2°/frame。ほぼ真っ直ぐ飛ばしつつ動く敵に追従可能
        const delta = Phaser.Math.Clamp(diff, -MAX_TURN, MAX_TURN);
        const newAngle = currentAngle + delta;
        let newVx = Math.cos(newAngle) * speed;
        let newVy = Math.sin(newAngle) * speed;
        // 方向制約: 前方弾は後退禁止、後方弾は前進禁止
        if (this.isRearShot) newVy = Math.max(newVy, 0);
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
