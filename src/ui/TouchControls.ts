import { Player } from '../entities/Player';

export class TouchControls {
  private scene: Phaser.Scene;
  private player: Player;
  private isDragging: boolean = false;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;

    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.dragOffsetX = pointer.x - player.x;
      this.dragOffsetY = pointer.y - player.y;
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      const targetX = pointer.x - this.dragOffsetX;
      const targetY = pointer.y - this.dragOffsetY;
      player.x = Phaser.Math.Clamp(targetX, 20, scene.scale.width - 20);
      player.y = Phaser.Math.Clamp(targetY, 100, scene.scale.height - 40);
    });

    scene.input.on('pointerup', () => {
      this.isDragging = false;
    });
  }

  destroy(): void {
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointermove');
    this.scene.input.off('pointerup');
  }
}
