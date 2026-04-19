import { COLORS } from '../config';
import { ENEMIES } from './enemies';
import { DROP_TYPES } from './dropTypes';
import { PART_LINES } from './parts';

/**
 * スプライトマニフェスト。
 * - file: `public/assets/images/` 配下のファイル名
 * - frameWidth/Height: spritesheet として読み込むフレームサイズ
 * - animations: anims.create に渡す定義 (省略可)
 * - fallback: ファイルが無い (loaderror) ときに generateTexture で描くプレースホルダー
 */
export interface AnimationSpec {
  key: string;
  frames: number[];
  frameRate: number;
  repeat: number;
}

export interface SpriteSpec {
  key: string;
  file: string;
  frameWidth: number;
  frameHeight: number;
  animations?: AnimationSpec[];
  fallback: (scene: Phaser.Scene) => void;
}

// ====== fallback 生成関数 (BootScene の既存ロジックを移植) ======

function fallbackPlayer(scene: Phaser.Scene): void {
  const pg = scene.add.graphics();
  pg.fillStyle(COLORS.PLAYER, 1);
  pg.fillTriangle(16, 0, 0, 32, 32, 32);
  pg.lineStyle(1, 0xffffff, 0.5);
  pg.strokeTriangle(16, 0, 0, 32, 32, 32);
  pg.generateTexture('player', 32, 32);
  pg.destroy();
}

function fallbackDrone(scene: Phaser.Scene): void {
  const dg = scene.add.graphics();
  dg.fillStyle(0x00ffcc, 1);
  dg.fillTriangle(8, 0, 0, 16, 16, 16);
  dg.generateTexture('drone', 16, 16);
  dg.destroy();
}

function fallbackBulletPlayer(scene: Phaser.Scene): void {
  const bg = scene.add.graphics();
  bg.fillStyle(COLORS.PLAYER_BULLET, 1);
  bg.fillRect(2, 0, 4, 12);
  bg.generateTexture('bullet_player', 8, 12);
  bg.destroy();
}

function fallbackBulletEnemy(scene: Phaser.Scene): void {
  const ebg = scene.add.graphics();
  ebg.fillStyle(COLORS.ENEMY_BULLET, 1);
  ebg.fillCircle(4, 4, 4);
  ebg.generateTexture('bullet_enemy', 8, 8);
  ebg.destroy();
}

function fallbackEnemy(key: string, color: number): (scene: Phaser.Scene) => void {
  return (scene) => {
    const g = scene.add.graphics();
    g.fillStyle(color, 1);
    g.fillTriangle(12, 24, 0, 0, 24, 0);
    g.lineStyle(1, 0xffffff, 0.3);
    g.strokeTriangle(12, 24, 0, 0, 24, 0);
    g.generateTexture(key, 24, 24);
    g.destroy();
  };
}

function fallbackBoss(scene: Phaser.Scene): void {
  const boss = scene.add.graphics();
  boss.fillStyle(COLORS.BOSS, 1);
  boss.fillRoundedRect(0, 0, 60, 50, 8);
  boss.fillStyle(0xff4488, 1);
  boss.fillCircle(15, 15, 6);
  boss.fillCircle(45, 15, 6);
  boss.fillRect(10, 35, 40, 8);
  boss.generateTexture('boss', 60, 50);
  boss.destroy();
}

function fallbackMidBoss(scene: Phaser.Scene): void {
  const mb = scene.add.graphics();
  mb.fillStyle(0xff8844, 1);
  mb.fillRoundedRect(0, 0, 48, 40, 6);
  mb.fillStyle(0xffcc00, 1);
  mb.fillCircle(12, 12, 5);
  mb.fillCircle(36, 12, 5);
  mb.fillRect(8, 28, 32, 6);
  mb.lineStyle(2, 0xffffff, 0.4);
  mb.strokeRoundedRect(0, 0, 48, 40, 6);
  mb.generateTexture('midboss', 48, 40);
  mb.destroy();
}

function fallbackPowerUpCoin(scene: Phaser.Scene): void {
  const cg = scene.add.graphics();
  cg.fillStyle(COLORS.POWERUP_COIN, 1);
  cg.fillCircle(6, 6, 6);
  cg.lineStyle(1, 0xffa500);
  cg.strokeCircle(6, 6, 6);
  cg.generateTexture('powerup_coin', 12, 12);
  cg.destroy();
}

function fallbackPowerUpHeal(scene: Phaser.Scene): void {
  const hg = scene.add.graphics();
  hg.fillStyle(COLORS.POWERUP_HP, 1);
  hg.fillCircle(6, 6, 6);
  hg.fillStyle(0xffffff, 1);
  hg.fillRect(4, 2, 4, 8);
  hg.fillRect(2, 4, 8, 4);
  hg.generateTexture('powerup_heal', 12, 12);
  hg.destroy();
}

function fallbackParticle(scene: Phaser.Scene): void {
  const exp = scene.add.graphics();
  exp.fillStyle(0xffffff, 1);
  exp.fillCircle(3, 3, 3);
  exp.generateTexture('particle', 6, 6);
  exp.destroy();
}

function fallbackObstacle(scene: Phaser.Scene): void {
  const ob = scene.add.graphics();
  ob.fillStyle(0x555566, 1);
  ob.fillRoundedRect(0, 0, 36, 36, 6);
  ob.fillStyle(0x777788, 1);
  ob.fillRoundedRect(3, 3, 30, 30, 4);
  ob.fillStyle(0x333344, 1);
  ob.fillCircle(8, 8, 2);
  ob.fillCircle(28, 8, 2);
  ob.fillCircle(8, 28, 2);
  ob.fillCircle(28, 28, 2);
  ob.fillStyle(0xff3333, 1);
  ob.fillCircle(18, 18, 4);
  ob.lineStyle(2, 0x222233, 1);
  ob.strokeRoundedRect(0, 0, 36, 36, 6);
  ob.generateTexture('obstacle', 36, 36);
  ob.destroy();
}

function fallbackDrop(key: string, shape: 'ticket' | 'gem' | 'part', color: number): (scene: Phaser.Scene) => void {
  return (scene) => {
    const g = scene.add.graphics();
    g.fillStyle(color, 1);
    if (shape === 'ticket') {
      g.fillRoundedRect(1, 3, 14, 10, 2);
      g.lineStyle(1, 0xffffff, 0.6);
      g.strokeRoundedRect(1, 3, 14, 10, 2);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(8, 8, 1.5);
    } else if (shape === 'gem') {
      g.fillTriangle(8, 1, 1, 8, 15, 8);
      g.fillTriangle(1, 8, 15, 8, 8, 15);
      g.lineStyle(1, 0xffffff, 0.7);
      g.strokeTriangle(8, 1, 1, 8, 15, 8);
      g.strokeTriangle(1, 8, 15, 8, 8, 15);
    } else {
      g.fillCircle(8, 8, 6);
      g.lineStyle(1, 0xffffff, 0.6);
      g.strokeCircle(8, 8, 6);
    }
    g.generateTexture(key, 16, 16);
    g.destroy();
  };
}

function fallbackPlayerVariant(key: string, coreColor: number, mwColor: number): (scene: Phaser.Scene) => void {
  return (scene) => {
    const g = scene.add.graphics();
    g.fillStyle(coreColor, 1);
    g.fillTriangle(16, 0, 0, 32, 32, 32);
    g.lineStyle(1, 0xffffff, 0.5);
    g.strokeTriangle(16, 0, 0, 32, 32, 32);
    g.fillStyle(mwColor, 1);
    g.fillRect(6, 20, 6, 10);
    g.fillRect(20, 20, 6, 10);
    g.fillCircle(16, 12, 4);
    g.generateTexture(key, 32, 32);
    g.destroy();
  };
}

// コア × メイン武器の自機テクスチャ組み合わせ
const CORE_IDS = PART_LINES.filter(p => p.slot === 'core').map(p => p.id);
const MW_IDS = PART_LINES.filter(p => p.slot === 'main_weapon').map(p => p.id);

function getPartColor(lineId: string): number {
  return PART_LINES.find(p => p.id === lineId)?.color ?? 0x4488aa;
}

// ====== マニフェスト本体 ======

export const SPRITE_MANIFEST: SpriteSpec[] = [
  {
    key: 'player', file: 'player.png',
    frameWidth: 32, frameHeight: 32,
    animations: [{ key: 'player_idle', frames: [0, 1, 2, 3], frameRate: 8, repeat: -1 }],
    fallback: fallbackPlayer,
  },
  {
    key: 'drone', file: 'drone.png',
    frameWidth: 16, frameHeight: 16,
    animations: [{ key: 'drone_idle', frames: [0, 1], frameRate: 6, repeat: -1 }],
    fallback: fallbackDrone,
  },
  {
    key: 'bullet_player', file: 'bullet_player.png',
    frameWidth: 8, frameHeight: 12,
    fallback: fallbackBulletPlayer,
  },
  {
    key: 'bullet_enemy', file: 'bullet_enemy.png',
    frameWidth: 8, frameHeight: 8,
    fallback: fallbackBulletEnemy,
  },
  // Enemies (ENEMIES 配列からキー/色を参照。重複キー除外)
  ...(() => {
    const seen = new Set<string>();
    return ENEMIES.filter(def => {
      if (seen.has(def.graphic)) return false;
      seen.add(def.graphic);
      return true;
    }).map<SpriteSpec>((def) => ({
      key: def.graphic,
      file: `${def.graphic}.png`,
      frameWidth: 24,
      frameHeight: 24,
      animations: [{ key: `${def.graphic}_idle`, frames: [0, 1], frameRate: 4, repeat: -1 }],
      fallback: fallbackEnemy(def.graphic, def.color),
    }));
  })(),
  {
    key: 'boss', file: 'boss.png',
    frameWidth: 60, frameHeight: 50,
    fallback: fallbackBoss,
  },
  {
    key: 'midboss', file: 'midboss.png',
    frameWidth: 48, frameHeight: 40,
    fallback: fallbackMidBoss,
  },
  {
    key: 'obstacle', file: 'obstacle.png',
    frameWidth: 36, frameHeight: 36,
    animations: [{ key: 'obstacle_idle', frames: [0, 1], frameRate: 3, repeat: -1 }],
    fallback: fallbackObstacle,
  },
  {
    key: 'powerup_coin', file: 'powerup_coin.png',
    frameWidth: 12, frameHeight: 12,
    animations: [{ key: 'powerup_coin_idle', frames: [0, 1, 2, 3], frameRate: 8, repeat: -1 }],
    fallback: fallbackPowerUpCoin,
  },
  {
    key: 'powerup_heal', file: 'powerup_heal.png',
    frameWidth: 12, frameHeight: 12,
    fallback: fallbackPowerUpHeal,
  },
  {
    key: 'particle', file: 'particle.png',
    frameWidth: 6, frameHeight: 6,
    fallback: fallbackParticle,
  },
  {
    key: 'drop_gacha_ticket', file: 'drop_gacha_ticket.png',
    frameWidth: 16, frameHeight: 16,
    fallback: fallbackDrop('drop_gacha_ticket', 'ticket', DROP_TYPES.gacha_ticket.color),
  },
  {
    key: 'drop_gem', file: 'drop_gem.png',
    frameWidth: 16, frameHeight: 16,
    fallback: fallbackDrop('drop_gem', 'gem', DROP_TYPES.gem.color),
  },
  {
    key: 'drop_rare_part', file: 'drop_rare_part.png',
    frameWidth: 16, frameHeight: 16,
    fallback: fallbackDrop('drop_rare_part', 'part', DROP_TYPES.rare_part.color),
  },
  // 自機テクスチャ: コア × メイン武器 (8×8 = 64 パターン)
  ...CORE_IDS.flatMap(core =>
    MW_IDS.map<SpriteSpec>(mw => {
      const key = `player_${core}_${mw}`;
      return {
        key,
        file: `${key}.png`,
        frameWidth: 32,
        frameHeight: 32,
        animations: [{ key: `${key}_idle`, frames: [0, 1, 2, 3], frameRate: 8, repeat: -1 }],
        fallback: fallbackPlayerVariant(key, getPartColor(core), getPartColor(mw)),
      };
    })
  ),
];
