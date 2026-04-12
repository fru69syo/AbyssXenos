import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  damage: number = 1;
  isPiercing: boolean = false;
  isHoming: boolean = false;
  hasFreeze: boolean = false;
  hasBurn: boolean = false;
  hasSplit: boolean = false;
  hasExplosion: boolean = false;
  hasMultiBounce: boolean = false;
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
  }

  update(): void {
    if (!this.active) return;

    if (this.isHoming) {
      const enemies = this.scene.children.getAll().filter(
        (obj): obj is Phaser.Physics.Arcade.Sprite =>
          obj instanceof Phaser.Physics.Arcade.Sprite &&
          obj.getData('isEnemy') === true &&
          obj.active
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
        this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
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
