import { SPRITE_MANIFEST } from '../data/assets';

export class BootScene extends Phaser.Scene {
  private failedKeys: Set<string> = new Set();

  constructor() {
    super('BootScene');
  }

  preload(): void {
    // Show loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const bar = this.add.graphics();
    const barBg = this.add.rectangle(width / 2, height / 2, 300, 20, 0x222222);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0x00ccff, 1);
      bar.fillRect(width / 2 - 150, height / 2 - 10, 300 * value, 20);
    });

    this.load.on('complete', () => {
      bar.destroy();
      barBg.destroy();
    });

    // 各 spritesheet をキューに入れる。ロードに失敗したキーは failedKeys に記録。
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      if (file && file.key) this.failedKeys.add(file.key);
    });

    for (const spec of SPRITE_MANIFEST) {
      this.load.spritesheet(spec.key, `assets/images/${spec.file}`, {
        frameWidth: spec.frameWidth,
        frameHeight: spec.frameHeight,
      });
    }
  }

  create(): void {
    // 失敗キーは generateTexture でフォールバック生成
    for (const spec of SPRITE_MANIFEST) {
      if (this.failedKeys.has(spec.key) || !this.textures.exists(spec.key)) {
        spec.fallback(this);
        continue;
      }
      // 成功したもののみ anims 登録
      if (spec.animations) {
        for (const anim of spec.animations) {
          if (this.anims.exists(anim.key)) continue;
          this.anims.create({
            key: anim.key,
            frames: this.anims.generateFrameNumbers(spec.key, {
              frames: anim.frames,
            }),
            frameRate: anim.frameRate,
            repeat: anim.repeat,
          });
        }
      }
    }

    this.scene.start('TitleScene');
  }
}
