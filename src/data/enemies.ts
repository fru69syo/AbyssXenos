import { SpecialDropType } from './dropTypes';

export type MoveTypeCode =
  | 'straight'      // 真下に直線降下
  | 'zigzag'        // ジグザグ移動
  | 'sine'          // sin波で揺れながら降下
  | 'slow_descent'  // ゆっくり降下(射撃用)
  | 'swarm';        // 群れ動作

export type AttackTypeCode =
  | 'none'          // 攻撃なし
  | 'aimed_single'  // 自機狙い単発
  | 'aimed_burst'   // 自機狙い3連射
  | 'spread3'       // 前方3way拡散
  | 'spread5'       // 前方5way拡散
  | 'circle8';      // 円形8way

export interface EnemyDef {
  id: number;                       // No (1始まり)
  key: string;                      // 内部識別子
  name: string;                     // 表示名
  graphic: string;                  // テクスチャキー
  color: number;                    // プレースホルダー色
  moveType: MoveTypeCode;           // 移動タイプコード
  attackType: AttackTypeCode;       // 攻撃タイプコード
  attackInterval: number;           // 攻撃間隔ms (0=攻撃しない)
  hp: number;                       // HP
  exp: number;                      // 経験値
  coin: number;                     // お金 (基本コインドロップ量)
  specialDropFlag: boolean;         // 特殊ドロップフラグ
  specialDropType: SpecialDropType; // ドロップ種類 (別カラム)
  specialDropChance: number;        // ドロップ確率 (0-1)
  scale: number;                    // 表示倍率
  speedMul: number;                 // baseSpeed への乗数
}

export const ENEMIES: EnemyDef[] = [
  // ====== 基本敵 (既存4種を移植) ======
  {
    id: 1, key: 'drifter', name: 'ドリフター', graphic: 'enemy_1',
    color: 0xff4444, moveType: 'straight', attackType: 'none', attackInterval: 0,
    hp: 4, exp: 5, coin: 1,
    specialDropFlag: false, specialDropType: 'none', specialDropChance: 0,
    scale: 1, speedMul: 1,
  },
  {
    id: 2, key: 'zigzag', name: 'ザグラー', graphic: 'enemy_2',
    color: 0xff8800, moveType: 'zigzag', attackType: 'none', attackInterval: 0,
    hp: 6, exp: 8, coin: 1,
    specialDropFlag: false, specialDropType: 'none', specialDropChance: 0,
    scale: 1, speedMul: 1,
  },
  {
    id: 3, key: 'shooter', name: 'シューター', graphic: 'enemy_3',
    color: 0xcc00ff, moveType: 'slow_descent', attackType: 'aimed_burst', attackInterval: 1100,
    hp: 8, exp: 15, coin: 2,
    specialDropFlag: false, specialDropType: 'none', specialDropChance: 0,
    scale: 1, speedMul: 0.6,
  },
  {
    id: 4, key: 'swarm', name: 'スウォーム', graphic: 'enemy_4',
    color: 0xffcc00, moveType: 'swarm', attackType: 'none', attackInterval: 0,
    hp: 2, exp: 3, coin: 1,
    specialDropFlag: false, specialDropType: 'none', specialDropChance: 0,
    scale: 0.7, speedMul: 1,
  },

  // ====== 拡張敵 (特殊ドロップ持ち) ======
  {
    id: 5, key: 'elite_shooter', name: 'エリートシューター', graphic: 'enemy_5',
    color: 0xff00ff, moveType: 'slow_descent', attackType: 'spread5', attackInterval: 1500,
    hp: 16, exp: 30, coin: 5,
    specialDropFlag: true, specialDropType: 'gacha_ticket', specialDropChance: 0.3,
    scale: 1.2, speedMul: 0.7,
  },
  {
    id: 6, key: 'gem_carrier', name: 'ジェムキャリア', graphic: 'enemy_6',
    color: 0x00ffff, moveType: 'sine', attackType: 'none', attackInterval: 0,
    hp: 10, exp: 20, coin: 3,
    specialDropFlag: true, specialDropType: 'gem', specialDropChance: 1.0,
    scale: 1.1, speedMul: 1.2,
  },
  {
    id: 7, key: 'heavy_shooter', name: 'ヘビーシューター', graphic: 'enemy_7',
    color: 0xaa00aa, moveType: 'slow_descent', attackType: 'circle8', attackInterval: 2200,
    hp: 24, exp: 50, coin: 8,
    specialDropFlag: true, specialDropType: 'gacha_ticket', specialDropChance: 0.5,
    scale: 1.4, speedMul: 0.5,
  },
];

export function getEnemyById(id: number): EnemyDef {
  const def = ENEMIES.find(e => e.id === id);
  if (!def) throw new Error(`Enemy id ${id} not found`);
  return def;
}
