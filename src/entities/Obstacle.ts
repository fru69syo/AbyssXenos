import { GAME_HEIGHT } from '../config';
import { playAnimIfExists } from '../utils/playAnimIfExists';

/**
 * 壊れない障害物。画面をゆっくり降下しながら自機を狙って弾を撃つ。
 * プレイヤー弾はブロック (HP なし、ダメージ無効)。
 */
export class Obstacle extends Phaser.Physics.Arcade.Sprite {
  attackTimer: number = 0;
  attackInterval: number = 1400;
  descentSpeed: number = 45;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'obstacle');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setData('isObstacle', true);
  }

  spawn(x: number, y: number): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setImmovable(true);
    this.attackTimer = 0;
    // 初弾まで少し間を空ける
    this.attackTimer = -600;
    playAnimIfExists(this, 'obstacle_idle');
  }

  update(): void {
    if (!this.active) return;
    this.setVelocity(0, this.descentSpeed);
    if (this.y > GAME_HEIGHT + 60) {
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
