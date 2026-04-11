// ====== パーツスロット・レアリティ定義 ======

export type PartSlot = 'core' | 'engine' | 'wing' | 'main_weapon' | 'sub_weapon' | 'chip';
export type PartRarity = 'n' | 'r' | 'sr' | 'ssr' | 'ur' | 'lr';

export const PART_SLOTS: PartSlot[] = ['core', 'engine', 'wing', 'main_weapon', 'sub_weapon', 'chip'];

export const PART_SLOT_LABELS: Record<PartSlot, string> = {
  core: 'コア', engine: 'エンジン', wing: 'ウイング',
  main_weapon: 'メインウェポン', sub_weapon: 'サブウェポン', chip: 'チップ',
};

export const PART_SLOT_ICONS: Record<PartSlot, string> = {
  core: '◈', engine: '⚙', wing: '✦', main_weapon: '⚔', sub_weapon: '◆', chip: '▣',
};

export const PART_RARITY_ORDER: PartRarity[] = ['n', 'r', 'sr', 'ssr', 'ur', 'lr'];

export const PART_RARITY_LABELS: Record<PartRarity, string> = {
  n: 'N', r: 'R', sr: 'SR', ssr: 'SSR', ur: 'UR', lr: 'LR',
};

export const PART_RARITY_COLORS: Record<PartRarity, string> = {
  n: '#aaaaaa', r: '#4488ff', sr: '#ff44ff', ssr: '#ffaa00', ur: '#ff4444', lr: '#00ffaa',
};

export const PART_RARITY_BG: Record<PartRarity, number> = {
  n: 0x222233, r: 0x112255, sr: 0x331155, ssr: 0x443300, ur: 0x441111, lr: 0x114433,
};

export const PART_GACHA_WEIGHTS: Record<PartRarity, number> = {
  n: 50, r: 30, sr: 12, ssr: 5, ur: 2.5, lr: 0.5,
};

export const PART_DUPLICATE_COINS: Record<PartRarity, number> = {
  n: 30, r: 150, sr: 800, ssr: 3000, ur: 10000, lr: 50000,
};

// ====== パーツ定義 ======

export interface PartDef {
  id: string;
  name: string;
  slot: PartSlot;
  rarity: PartRarity;
  hp: number;
  atk: number;
  speed: number;
  fireRate: number;      // メインウェポン専用。0=このスロットでは影響なし
  ability: string;       // 特殊能力キー (空文字=なし)
  abilityDesc: string;   // 表示用説明
  color: number;
}

export const PARTS: PartDef[] = [
  // ====== コア (HP/防御) ======
  {
    id: 'core_basic', name: '標準コア', slot: 'core', rarity: 'n',
    hp: 5, atk: 0, speed: 0, fireRate: 0,
    ability: '', abilityDesc: '', color: 0x4488aa,
  },
  {
    id: 'core_guard', name: 'ガードコア', slot: 'core', rarity: 'r',
    hp: 7, atk: 0, speed: 0, fireRate: 0,
    ability: 'def_1', abilityDesc: '被ダメージ-1', color: 0x4488ff,
  },
  {
    id: 'core_vital', name: 'バイタルコア', slot: 'core', rarity: 'sr',
    hp: 9, atk: 0, speed: 0, fireRate: 0,
    ability: 'auto_shield', abilityDesc: 'HP50%以下でシールド自動付与', color: 0xff44ff,
  },
  {
    id: 'core_fortress', name: 'フォートレスコア', slot: 'core', rarity: 'ssr',
    hp: 12, atk: 0, speed: 0, fireRate: 0,
    ability: 'fortress', abilityDesc: '被ダメ-2, ウェーブ開始時HP+1', color: 0xffaa00,
  },
  {
    id: 'core_immortal', name: 'イモータルコア', slot: 'core', rarity: 'ur',
    hp: 15, atk: 1, speed: 0, fireRate: 0,
    ability: 'immortal', abilityDesc: '致死ダメージを1回だけ耐える', color: 0xff4444,
  },

  // ====== エンジン (移動速度) ======
  {
    id: 'engine_basic', name: '標準エンジン', slot: 'engine', rarity: 'n',
    hp: 0, atk: 0, speed: 350, fireRate: 0,
    ability: '', abilityDesc: '', color: 0x88aa44,
  },
  {
    id: 'engine_boost', name: 'ブーストエンジン', slot: 'engine', rarity: 'r',
    hp: 0, atk: 0, speed: 420, fireRate: 0,
    ability: '', abilityDesc: '', color: 0x44ff44,
  },
  {
    id: 'engine_phantom', name: 'ファントムエンジン', slot: 'engine', rarity: 'sr',
    hp: 1, atk: 0, speed: 450, fireRate: 0,
    ability: 'invincible_dash', abilityDesc: '素早い移動時に無敵', color: 0x8844ff,
  },
  {
    id: 'engine_warp', name: 'ワープエンジン', slot: 'engine', rarity: 'ssr',
    hp: 0, atk: 0, speed: 500, fireRate: 0,
    ability: 'warp', abilityDesc: '被弾時ランダムテレポート', color: 0xffaa00,
  },
  {
    id: 'engine_light', name: 'ライトドライブ', slot: 'engine', rarity: 'ur',
    hp: 1, atk: 0, speed: 550, fireRate: 0,
    ability: 'speed_atk', abilityDesc: '移動速度に応じてATK+1~3', color: 0xff4444,
  },

  // ====== ウイング (成長/収集効率) ======
  {
    id: 'wing_basic', name: '標準ウイング', slot: 'wing', rarity: 'n',
    hp: 0, atk: 0, speed: 50, fireRate: 0,
    ability: '', abilityDesc: '', color: 0xaa8844,
  },
  {
    id: 'wing_collector', name: 'コレクターウイング', slot: 'wing', rarity: 'r',
    hp: 0, atk: 0, speed: 30, fireRate: 0,
    ability: 'coin_25', abilityDesc: 'コイン獲得+25%', color: 0xffdd44,
  },
  {
    id: 'wing_exp', name: 'EXPウイング', slot: 'wing', rarity: 'sr',
    hp: 0, atk: 0, speed: 40, fireRate: 0,
    ability: 'exp_30', abilityDesc: 'EXP獲得+30%', color: 0x88ff88,
  },
  {
    id: 'wing_fortune', name: 'フォーチュンウイング', slot: 'wing', rarity: 'ssr',
    hp: 1, atk: 0, speed: 50, fireRate: 0,
    ability: 'fortune', abilityDesc: 'コイン+50%, EXP+30%, マグネット+50', color: 0xffaa00,
  },
  {
    id: 'wing_destiny', name: 'デスティニーウイング', slot: 'wing', rarity: 'ur',
    hp: 1, atk: 1, speed: 60, fireRate: 0,
    ability: 'drop_2x', abilityDesc: '特殊ドロップ率2倍', color: 0xff4444,
  },

  // ====== メインウェポン (攻撃力/連射/弾タイプ) ======
  {
    id: 'mw_basic', name: '標準キャノン', slot: 'main_weapon', rarity: 'n',
    hp: 0, atk: 1, speed: 0, fireRate: 200,
    ability: '', abilityDesc: '', color: 0xcc4444,
  },
  {
    id: 'mw_rapid', name: 'ラピッドガン', slot: 'main_weapon', rarity: 'r',
    hp: 0, atk: 1, speed: 0, fireRate: 150,
    ability: '', abilityDesc: '', color: 0xff6644,
  },
  {
    id: 'mw_spread', name: 'スプレッドショット', slot: 'main_weapon', rarity: 'sr',
    hp: 0, atk: 2, speed: 0, fireRate: 190,
    ability: 'double_shot', abilityDesc: '初期ダブルショット', color: 0xff44ff,
  },
  {
    id: 'mw_laser', name: 'レーザーキャノン', slot: 'main_weapon', rarity: 'ssr',
    hp: 0, atk: 4, speed: 0, fireRate: 220,
    ability: 'pierce', abilityDesc: '貫通弾', color: 0xffaa00,
  },
  {
    id: 'mw_plasma', name: 'プラズマライフル', slot: 'main_weapon', rarity: 'ur',
    hp: 0, atk: 5, speed: 0, fireRate: 170,
    ability: 'homing_pierce', abilityDesc: 'ホーミング+貫通', color: 0xff4444,
  },

  // ====== サブウェポン (副武装) ======
  {
    id: 'sw_none', name: '補助なし', slot: 'sub_weapon', rarity: 'n',
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: '', abilityDesc: '', color: 0x666666,
  },
  {
    id: 'sw_missile', name: 'ミサイルポッド', slot: 'sub_weapon', rarity: 'r',
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'auto_missile', abilityDesc: '5秒ごとに自動ミサイル1発', color: 0xff8844,
  },
  {
    id: 'sw_drone', name: 'ドローンユニット', slot: 'sub_weapon', rarity: 'sr',
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'drone_1', abilityDesc: 'サイドドローン1機', color: 0x44ffcc,
  },
  {
    id: 'sw_barrier', name: 'バリアモジュール', slot: 'sub_weapon', rarity: 'ssr',
    hp: 2, atk: 0, speed: 0, fireRate: 0,
    ability: 'shield_2', abilityDesc: '初期シールド+2', color: 0x44aaff,
  },
  {
    id: 'sw_satellite', name: 'サテライトシステム', slot: 'sub_weapon', rarity: 'ur',
    hp: 0, atk: 2, speed: 0, fireRate: 0,
    ability: 'satellite', abilityDesc: 'ドローン2機+後方射撃', color: 0xff4444,
  },

  // ====== チップ (パッシブ効果) ======
  {
    id: 'chip_basic', name: '汎用チップ', slot: 'chip', rarity: 'n',
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: '', abilityDesc: '', color: 0x888888,
  },
  {
    id: 'chip_lucky', name: 'ラッキーチップ', slot: 'chip', rarity: 'r',
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'drop_15', abilityDesc: '特殊ドロップ率+15%', color: 0x44ff88,
  },
  {
    id: 'chip_critical', name: 'クリティカルチップ', slot: 'chip', rarity: 'sr',
    hp: 0, atk: 1, speed: 0, fireRate: 0,
    ability: 'crit_15', abilityDesc: 'クリティカル率+15% (ダメ1.5倍)', color: 0xff44ff,
  },
  {
    id: 'chip_vampire', name: 'ヴァンパイアチップ', slot: 'chip', rarity: 'ssr',
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'vampire', abilityDesc: '敵撃破時5%でHP回復', color: 0xcc0044,
  },
  {
    id: 'chip_overclock', name: 'オーバークロック', slot: 'chip', rarity: 'ur',
    hp: 0, atk: 2, speed: 30, fireRate: 0,
    ability: 'overclock', abilityDesc: '全ステ微増+スキル進化率UP', color: 0xff4444,
  },
];

// ====== ユーティリティ ======

export function getPartById(id: string): PartDef | undefined {
  return PARTS.find(p => p.id === id);
}

export function getPartsBySlot(slot: PartSlot): PartDef[] {
  return PARTS.filter(p => p.slot === slot);
}

// ====== セット装備プリセット ======

export interface PresetDef {
  id: string;
  name: string;
  parts: Record<PartSlot, string>;
}

export const PRESETS: PresetDef[] = [
  {
    id: 'abyss_scout', name: 'アビス・スカウト',
    parts: { core: 'core_basic', engine: 'engine_basic', wing: 'wing_basic',
             main_weapon: 'mw_basic', sub_weapon: 'sw_none', chip: 'chip_basic' },
  },
  {
    id: 'deep_striker', name: 'ディープストライカー',
    parts: { core: 'core_basic', engine: 'engine_basic', wing: 'wing_basic',
             main_weapon: 'mw_rapid', sub_weapon: 'sw_none', chip: 'chip_basic' },
  },
  {
    id: 'phantom_ray', name: 'ファントムレイ',
    parts: { core: 'core_guard', engine: 'engine_phantom', wing: 'wing_basic',
             main_weapon: 'mw_basic', sub_weapon: 'sw_none', chip: 'chip_basic' },
  },
  {
    id: 'coral_viper', name: 'コーラルヴァイパー',
    parts: { core: 'core_basic', engine: 'engine_boost', wing: 'wing_collector',
             main_weapon: 'mw_rapid', sub_weapon: 'sw_none', chip: 'chip_critical' },
  },
  {
    id: 'leviathan', name: 'リヴァイアサン',
    parts: { core: 'core_vital', engine: 'engine_boost', wing: 'wing_basic',
             main_weapon: 'mw_basic', sub_weapon: 'sw_barrier', chip: 'chip_basic' },
  },
  {
    id: 'abyssal_lord', name: 'アビサルロード',
    parts: { core: 'core_fortress', engine: 'engine_boost', wing: 'wing_exp',
             main_weapon: 'mw_spread', sub_weapon: 'sw_drone', chip: 'chip_vampire' },
  },
  {
    id: 'xenos_prime', name: 'ゼノスプライム',
    parts: { core: 'core_fortress', engine: 'engine_warp', wing: 'wing_fortune',
             main_weapon: 'mw_laser', sub_weapon: 'sw_satellite', chip: 'chip_overclock' },
  },
];

// ====== パーツ合算ステータス計算 ======

export interface PartStats {
  hp: number;
  atk: number;
  speed: number;
  fireRate: number;
  abilities: string[];
}

export function calcPartStats(equippedParts: Record<PartSlot, string>): PartStats {
  let hp = 0;
  let atk = 0;
  let speed = 0;
  let fireRate = 200; // デフォルト
  const abilities: string[] = [];

  for (const slot of PART_SLOTS) {
    const partId = equippedParts[slot];
    if (!partId) continue;
    const part = getPartById(partId);
    if (!part) continue;

    hp += part.hp;
    atk += part.atk;
    speed += part.speed;
    if (part.fireRate > 0) fireRate = part.fireRate;
    if (part.ability) abilities.push(part.ability);
  }

  return { hp, atk, speed, fireRate, abilities };
}
