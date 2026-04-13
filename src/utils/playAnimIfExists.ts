/**
 * 指定キーのアニメーションが登録されていれば再生する。未登録なら no-op。
 * 画像アセットが無くて generateTexture フォールバックされた場合でも安全に呼べる。
 */
export function playAnimIfExists(sprite: Phaser.GameObjects.Sprite, key: string): void {
  if (sprite.scene && sprite.scene.anims && sprite.scene.anims.exists(key)) {
    sprite.play(key, true);
  }
}
