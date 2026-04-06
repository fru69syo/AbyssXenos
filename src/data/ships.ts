export type ShipRarity = 'n' | 'r' | 'sr' | 'ssr';

export interface ShipDef {
  id: string;
  name: string;
  rarity: ShipRarity;
  baseHp: number;
  baseAtk: number;
  baseSpeed: number;
  fireRate: number;
  color: number;
  special: string;
}

export const SHIPS: ShipDef[] = [
  { id: 'abyss_scout', name: 'アビス・スカウト', rarity: 'n', baseHp: 5, baseAtk: 1, baseSpeed: 400, fireRate: 200, color: 0x00ccff, special: 'なし' },
  { id: 'deep_striker', name: 'ディープストライカー', rarity: 'n', baseHp: 4, baseAtk: 2, baseSpeed: 350, fireRate: 180, color: 0x4488ff, special: 'なし' },
  { id: 'phantom_ray', name: 'ファントムレイ', rarity: 'r', baseHp: 6, baseAtk: 2, baseSpeed: 420, fireRate: 190, color: 0x8844ff, special: '回避時に無敵フレーム延長' },
  { id: 'coral_viper', name: 'コーラルヴァイパー', rarity: 'r', baseHp: 5, baseAtk: 3, baseSpeed: 380, fireRate: 160, color: 0xff4488, special: 'クリティカル率+10%' },
  { id: 'leviathan', name: 'リヴァイアサン', rarity: 'sr', baseHp: 8, baseAtk: 3, baseSpeed: 360, fireRate: 170, color: 0x00ff88, special: 'ウェーブ開始時シールド+1' },
  { id: 'abyssal_lord', name: 'アビサルロード', rarity: 'sr', baseHp: 7, baseAtk: 4, baseSpeed: 400, fireRate: 150, color: 0xffaa00, special: 'HP50%以下で攻撃力2倍' },
  { id: 'xenos_prime', name: 'ゼノスプライム', rarity: 'ssr', baseHp: 10, baseAtk: 5, baseSpeed: 450, fireRate: 140, color: 0xff0088, special: '撃破時HP回復+コイン2倍' },
];

export const GACHA_WEIGHTS: Record<ShipRarity, number> = {
  n: 60,
  r: 30,
  sr: 8,
  ssr: 2,
};
