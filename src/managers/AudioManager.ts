export class AudioManager {
  private scene: Phaser.Scene;
  private bgm: Phaser.Sound.BaseSound | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  playBgm(key: string, volume: number = 0.3): void {
    if (this.bgm) this.bgm.stop();
    if (this.scene.cache.audio.exists(key)) {
      this.bgm = this.scene.sound.add(key, { loop: true, volume });
      this.bgm.play();
    }
  }

  stopBgm(): void {
    if (this.bgm) {
      this.bgm.stop();
      this.bgm = null;
    }
  }

  playSfx(key: string, volume: number = 0.5): void {
    if (this.scene.cache.audio.exists(key)) {
      this.scene.sound.play(key, { volume });
    }
  }
}
