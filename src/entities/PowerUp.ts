import { GAME_HEIGHT, COLORS } from '../config';

export type PowerUpType = 'coin' | 'heal';

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  powerUpType: PowerUpType = 'coin';
  value: number = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  spawn(x: number, y: number, type: PowerUpType, value: number = 1): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    (this.body as Phaser.Physics.Arcade.Body).enable = true;
    this.powerUpType = type;
    this.value = value;

    this.setTexture(type === 'coin' ? 'powerup_coin' : 'powerup_heal');
    this.setVelocity(0, 80);
  }

  update(): void {
    if (!this.active) return;
    if (this.y > GAME_HEIGHT + 20) {
      this.deactivate();
    }
  }

  attract(targetX: number, targetY: number, range: number): void {
    if (!this.active) return;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    if (dist < range) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
      const speed = 300 * (1 - dist / range);
      this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    }
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    if (this.body) (this.body as Phaser.Physics.Arcade.Body).enable = false;
  }
}
