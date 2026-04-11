// ====== パーツスロット・レアリティ定義 ======

export type PartSlot = 'core' | 'engine' | 'wing' | 'main_weapon' | 'sub_weapon' | 'chip';
export type PartRarity = 'n' | 'r' | 'sr' | 'ur' | 'lr';

export const PART_SLOTS: PartSlot[] = ['core', 'engine', 'wing', 'main_weapon', 'sub_weapon', 'chip'];

export const PART_SLOT_LABELS: Record<PartSlot, string> = {
  core: 'コア', engine: 'エンジン', wing: 'ウイング',
  main_weapon: 'メインウェポン', sub_weapon: 'サブウェポン', chip: 'チップ',
};

export const PART_SLOT_ICONS: Record<PartSlot, string> = {
  core: '◈', engine: '⚙', wing: '✦', main_weapon: '⚔', sub_weapon: '◆', chip: '▣',
};

export const PART_RARITY_ORDER: PartRarity[] = ['n', 'r', 'sr', 'ur', 'lr'];

export const PART_RARITY_LABELS: Record<PartRarity, string> = {
  n: 'N', r: 'R', sr: 'SR', ur: 'UR', lr: 'LR',
};

export const PART_RARITY_COLORS: Record<PartRarity, string> = {
  n: '#aaaaaa', r: '#4488ff', sr: '#ff44ff', ur: '#ff4444', lr: '#00ffaa',
};

export const PART_RARITY_BG: Record<PartRarity, number> = {
  n: 0x222233, r: 0x112255, sr: 0x331155, ur: 0x441111, lr: 0x114433,
};

// ====== ガチャ排出 (N/R/SRのみ) ======

export const PART_GACHA_WEIGHTS: Partial<Record<PartRarity, number>> = {
  n: 55, r: 33, sr: 12,
};

// ====== 進化システム ======

export const EVOLUTION_COST = 3; // 同パーツ3個で次レアリティへ

export const NEXT_RARITY: Record<PartRarity, PartRarity | null> = {
  n: 'r', r: 'sr', sr: 'ur', ur: 'lr', lr: null,
};

// ====== レアリティボーナス (Nの基準ステータスに加算) ======

export const RARITY_BONUS: Record<PartRarity, { hp: number; atk: number; speed: number }> = {
  n:  { hp: 0,  atk: 0, speed: 0 },
  r:  { hp: 2,  atk: 1, speed: 15 },
  sr: { hp: 4,  atk: 2, speed: 25 },
  ur: { hp: 7,  atk: 3, speed: 40 },
  lr: { hp: 11, atk: 5, speed: 60 },
};

export const RARITY_FIRERATE_BONUS: Record<PartRarity, number> = {
  n: 0, r: 5, sr: 10, ur: 20, lr: 30,
};

// ====== パーツキー (インベントリ/装備用) ======

export function partKey(lineId: string, rarity: PartRarity): string {
  return `${lineId}:${rarity}`;
}

export function parsePartKey(key: string): { lineId: string; rarity: PartRarity } {
  const idx = key.lastIndexOf(':');
  return { lineId: key.substring(0, idx), rarity: key.substring(idx + 1) as PartRarity };
}

// ====== パーツライン定義 (進化系統) ======

export interface PartLineDef {
  id: string;
  slot: PartSlot;
  names: Record<PartRarity, string>;
  hp: number;         // N基準のベースHP
  atk: number;        // N基準のベースATK
  speed: number;      // N基準のベース移動速度
  fireRate: number;   // メインウェポン専用 (0=影響なし)
  ability: string;    // 特殊能力キー (空文字=なし)
  abilityDesc: string;
  color: number;
}

export const PART_LINES: PartLineDef[] = [
  // ====== コア (HP/防御) ======
  {
    id: 'core_basic', slot: 'core',
    names: { n: '標準コア', r: '改良コア', sr: '高性能コア', ur: 'マスターコア', lr: 'アビスコア' },
    hp: 5, atk: 0, speed: 0, fireRate: 0,
    ability: '', abilityDesc: '', color: 0x4488aa,
  },
  {
    id: 'core_guard', slot: 'core',
    names: { n: 'ガードコア', r: 'シールドコア', sr: 'バリアコア', ur: 'フォートレスコア', lr: 'イージスコア' },
    hp: 4, atk: 0, speed: 0, fireRate: 0,
    ability: 'def_1', abilityDesc: '被ダメージ軽減', color: 0x4488ff,
  },
  {
    id: 'core_vital', slot: 'core',
    names: { n: 'バイタルコア', r: 'リジェネコア', sr: 'リカバリーコア', ur: 'イモータルコア', lr: 'エターナルコア' },
    hp: 6, atk: 0, speed: 0, fireRate: 0,
    ability: 'auto_shield', abilityDesc: 'HP50%以下でシールド自動付与', color: 0xff44ff,
  },
  {
    id: 'core_fortress', slot: 'core',
    names: { n: 'アーマーコア', r: 'タフネスコア', sr: 'バンカーコア', ur: '要塞コア', lr: '天壁コア' },
    hp: 7, atk: 0, speed: 0, fireRate: 0,
    ability: 'fortress', abilityDesc: '被ダメ-2, ウェーブ開始時HP+1', color: 0xffaa00,
  },
  {
    id: 'core_immortal', slot: 'core',
    names: { n: 'ソウルコア', r: 'スピリットコア', sr: 'フェニックスコア', ur: '不滅コア', lr: '永劫コア' },
    hp: 4, atk: 1, speed: 0, fireRate: 0,
    ability: 'immortal', abilityDesc: '致死ダメージを1回だけ耐える', color: 0xff4444,
  },

  // ====== エンジン (移動速度) ======
  {
    id: 'engine_basic', slot: 'engine',
    names: { n: '標準エンジン', r: '改良エンジン', sr: '高性能エンジン', ur: 'マスターエンジン', lr: 'アビスエンジン' },
    hp: 0, atk: 0, speed: 350, fireRate: 0,
    ability: '', abilityDesc: '', color: 0x88aa44,
  },
  {
    id: 'engine_boost', slot: 'engine',
    names: { n: 'ブーストエンジン', r: 'ターボエンジン', sr: 'ハイブーストエンジン', ur: 'メガブーストエンジン', lr: 'ライトブーストエンジン' },
    hp: 0, atk: 0, speed: 380, fireRate: 0,
    ability: '', abilityDesc: '', color: 0x44ff44,
  },
  {
    id: 'engine_phantom', slot: 'engine',
    names: { n: 'ファントムエンジン', r: 'ゴーストエンジン', sr: 'スペクターエンジン', ur: 'シェイドエンジン', lr: 'ヴォイドエンジン' },
    hp: 1, atk: 0, speed: 360, fireRate: 0,
    ability: 'invincible_dash', abilityDesc: '素早い移動時に無敵', color: 0x8844ff,
  },
  {
    id: 'engine_warp', slot: 'engine',
    names: { n: 'ワープエンジン', r: 'テレポートエンジン', sr: 'ブリンクエンジン', ur: 'ディメンションエンジン', lr: '時空エンジン' },
    hp: 0, atk: 0, speed: 370, fireRate: 0,
    ability: 'warp', abilityDesc: '被弾時ランダムテレポート', color: 0xffaa00,
  },
  {
    id: 'engine_light', slot: 'engine',
    names: { n: 'パルスエンジン', r: 'フラッシュエンジン', sr: 'ライトエンジン', ur: 'ルミナスエンジン', lr: '光速エンジン' },
    hp: 1, atk: 0, speed: 370, fireRate: 0,
    ability: 'speed_atk', abilityDesc: '移動速度に応じてATK+1~3', color: 0xff4444,
  },

  // ====== ウイング (成長/収集効率) ======
  {
    id: 'wing_basic', slot: 'wing',
    names: { n: '標準ウイング', r: '改良ウイング', sr: '高性能ウイング', ur: 'マスターウイング', lr: 'アビスウイング' },
    hp: 0, atk: 0, speed: 50, fireRate: 0,
    ability: '', abilityDesc: '', color: 0xaa8844,
  },
  {
    id: 'wing_collector', slot: 'wing',
    names: { n: 'コレクターウイング', r: 'ギャザラーウイング', sr: 'ハーベスターウイング', ur: 'プロスペクターウイング', lr: 'ゴールドウイング' },
    hp: 0, atk: 0, speed: 30, fireRate: 0,
    ability: 'coin_25', abilityDesc: 'コイン獲得+25%', color: 0xffdd44,
  },
  {
    id: 'wing_exp', slot: 'wing',
    names: { n: 'EXPウイング', r: 'ラーニングウイング', sr: 'グロースウイング', ur: 'エンライトウイング', lr: 'オムニウイング' },
    hp: 0, atk: 0, speed: 40, fireRate: 0,
    ability: 'exp_30', abilityDesc: 'EXP獲得+30%', color: 0x88ff88,
  },
  {
    id: 'wing_fortune', slot: 'wing',
    names: { n: 'フォーチュンウイング', r: 'ラッキーウイング', sr: 'ブレスドウイング', ur: 'ミラクルウイング', lr: 'ディヴァインウイング' },
    hp: 1, atk: 0, speed: 40, fireRate: 0,
    ability: 'fortune', abilityDesc: 'コイン+50%, EXP+30%, マグネット+50', color: 0xffaa00,
  },
  {
    id: 'wing_destiny', slot: 'wing',
    names: { n: 'デスティニーウイング', r: 'フェイトウイング', sr: 'プロビデンスウイング', ur: 'カルマウイング', lr: '運命のウイング' },
    hp: 1, atk: 1, speed: 50, fireRate: 0,
    ability: 'drop_2x', abilityDesc: '特殊ドロップ率2倍', color: 0xff4444,
  },

  // ====== メインウェポン (攻撃力/連射/弾タイプ) ======
  {
    id: 'mw_basic', slot: 'main_weapon',
    names: { n: '標準キャノン', r: '改良キャノン', sr: '高性能キャノン', ur: 'マスターキャノン', lr: 'アビスキャノン' },
    hp: 0, atk: 1, speed: 0, fireRate: 200,
    ability: '', abilityDesc: '', color: 0xcc4444,
  },
  {
    id: 'mw_rapid', slot: 'main_weapon',
    names: { n: 'ラピッドガン', r: 'バーストガン', sr: 'マシンガン', ur: 'チェーンガン', lr: 'ヘルファイア' },
    hp: 0, atk: 1, speed: 0, fireRate: 150,
    ability: '', abilityDesc: '', color: 0xff6644,
  },
  {
    id: 'mw_spread', slot: 'main_weapon',
    names: { n: 'スプレッドショット', r: 'ワイドショット', sr: 'バーストショット', ur: 'ストームショット', lr: 'テンペスト' },
    hp: 0, atk: 2, speed: 0, fireRate: 190,
    ability: 'double_shot', abilityDesc: '初期ダブルショット', color: 0xff44ff,
  },
  {
    id: 'mw_laser', slot: 'main_weapon',
    names: { n: 'レーザーガン', r: 'ビームキャノン', sr: 'レーザーキャノン', ur: 'メガレーザー', lr: 'ギガレーザー' },
    hp: 0, atk: 3, speed: 0, fireRate: 220,
    ability: 'pierce', abilityDesc: '貫通弾', color: 0xffaa00,
  },
  {
    id: 'mw_plasma', slot: 'main_weapon',
    names: { n: 'プラズマガン', r: 'プラズマキャノン', sr: 'プラズマライフル', ur: 'ノヴァキャノン', lr: 'ビッグバン' },
    hp: 0, atk: 3, speed: 0, fireRate: 170,
    ability: 'homing_pierce', abilityDesc: 'ホーミング+貫通', color: 0xff4444,
  },

  // ====== サブウェポン (副武装) ======
  {
    id: 'sw_none', slot: 'sub_weapon',
    names: { n: '補助モジュール', r: '改良モジュール', sr: '強化モジュール', ur: '高性能モジュール', lr: 'アビスモジュール' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: '', abilityDesc: '', color: 0x666666,
  },
  {
    id: 'sw_missile', slot: 'sub_weapon',
    names: { n: 'ミサイルポッド', r: 'ミサイルランチャー', sr: 'マルチミサイル', ur: 'ヘビーミサイル', lr: 'メテオミサイル' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'auto_missile', abilityDesc: '5秒ごとに自動ミサイル1発', color: 0xff8844,
  },
  {
    id: 'sw_drone', slot: 'sub_weapon',
    names: { n: 'ドローンユニット', r: 'ドローンMk-II', sr: 'ドローンMk-III', ur: 'ドローンMk-IV', lr: 'ドローンMk-V' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'drone_1', abilityDesc: 'サイドドローン1機', color: 0x44ffcc,
  },
  {
    id: 'sw_barrier', slot: 'sub_weapon',
    names: { n: 'バリアユニット', r: 'シールドユニット', sr: 'フォースフィールド', ur: 'アブソリュートシールド', lr: 'ディヴァインシールド' },
    hp: 2, atk: 0, speed: 0, fireRate: 0,
    ability: 'shield_2', abilityDesc: '初期シールド+2', color: 0x44aaff,
  },
  {
    id: 'sw_satellite', slot: 'sub_weapon',
    names: { n: 'サテライトビット', r: 'サテライトユニット', sr: 'サテライトシステム', ur: 'サテライトアレイ', lr: 'サテライトリング' },
    hp: 0, atk: 1, speed: 0, fireRate: 0,
    ability: 'satellite', abilityDesc: 'ドローン2機+後方射撃', color: 0xff4444,
  },

  // ====== チップ (パッシブ効果) ======
  {
    id: 'chip_basic', slot: 'chip',
    names: { n: '汎用チップ', r: '改良チップ', sr: '高性能チップ', ur: 'マスターチップ', lr: 'アビスチップ' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: '', abilityDesc: '', color: 0x888888,
  },
  {
    id: 'chip_lucky', slot: 'chip',
    names: { n: 'ラッキーチップ', r: 'フォーチュンチップ', sr: 'プロスペリティチップ', ur: 'ブレスドチップ', lr: 'ミラクルチップ' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'drop_15', abilityDesc: '特殊ドロップ率+15%', color: 0x44ff88,
  },
  {
    id: 'chip_critical', slot: 'chip',
    names: { n: 'クリティカルチップ', r: 'プレシジョンチップ', sr: 'デッドリーチップ', ur: 'フェイタルチップ', lr: 'エクストリームチップ' },
    hp: 0, atk: 1, speed: 0, fireRate: 0,
    ability: 'crit_15', abilityDesc: 'クリティカル率+15%', color: 0xff44ff,
  },
  {
    id: 'chip_vampire', slot: 'chip',
    names: { n: 'ドレインチップ', r: 'ヴァンパイアチップ', sr: 'リーチチップ', ur: 'ソウルドレインチップ', lr: 'アビスドレインチップ' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'vampire', abilityDesc: '敵撃破時5%でHP回復', color: 0xcc0044,
  },
  {
    id: 'chip_overclock', slot: 'chip',
    names: { n: 'オーバークロック', r: 'ハイクロック', sr: 'メガクロック', ur: 'ウルトラクロック', lr: 'リミットブレイク' },
    hp: 0, atk: 1, speed: 20, fireRate: 0,
    ability: 'overclock', abilityDesc: '全ステ微増+スキル進化率UP', color: 0xff4444,
  },
];

// ====== ユーティリティ ======

export function getPartLineById(id: string): PartLineDef | undefined {
  return PART_LINES.find(p => p.id === id);
}

export function getPartLinesBySlot(slot: PartSlot): PartLineDef[] {
  return PART_LINES.filter(p => p.slot === slot);
}

/** パーツラインのレアリティ別名称を取得 */
export function getPartName(lineId: string, rarity: PartRarity): string {
  const line = getPartLineById(lineId);
  return line ? line.names[rarity] : lineId;
}

// ====== セット装備プリセット ======

export interface PresetDef {
  id: string;
  name: string;
  parts: Record<PartSlot, string>; // value = "lineId:rarity"
}

export const PRESETS: PresetDef[] = [
  {
    id: 'abyss_scout', name: 'アビス・スカウト',
    parts: {
      core: 'core_basic:n', engine: 'engine_basic:n', wing: 'wing_basic:n',
      main_weapon: 'mw_basic:n', sub_weapon: 'sw_none:n', chip: 'chip_basic:n',
    },
  },
  {
    id: 'deep_striker', name: 'ディープストライカー',
    parts: {
      core: 'core_basic:n', engine: 'engine_basic:n', wing: 'wing_basic:n',
      main_weapon: 'mw_rapid:n', sub_weapon: 'sw_none:n', chip: 'chip_basic:n',
    },
  },
  {
    id: 'phantom_ray', name: 'ファントムレイ',
    parts: {
      core: 'core_guard:n', engine: 'engine_phantom:n', wing: 'wing_basic:n',
      main_weapon: 'mw_basic:n', sub_weapon: 'sw_none:n', chip: 'chip_basic:n',
    },
  },
  {
    id: 'coral_viper', name: 'コーラルヴァイパー',
    parts: {
      core: 'core_basic:n', engine: 'engine_boost:n', wing: 'wing_collector:n',
      main_weapon: 'mw_rapid:n', sub_weapon: 'sw_none:n', chip: 'chip_critical:n',
    },
  },
  {
    id: 'leviathan', name: 'リヴァイアサン',
    parts: {
      core: 'core_vital:n', engine: 'engine_boost:n', wing: 'wing_basic:n',
      main_weapon: 'mw_basic:n', sub_weapon: 'sw_barrier:n', chip: 'chip_basic:n',
    },
  },
  {
    id: 'abyssal_lord', name: 'アビサルロード',
    parts: {
      core: 'core_fortress:n', engine: 'engine_boost:n', wing: 'wing_exp:n',
      main_weapon: 'mw_spread:n', sub_weapon: 'sw_drone:n', chip: 'chip_vampire:n',
    },
  },
  {
    id: 'xenos_prime', name: 'ゼノスプライム',
    parts: {
      core: 'core_fortress:n', engine: 'engine_warp:n', wing: 'wing_fortune:n',
      main_weapon: 'mw_laser:n', sub_weapon: 'sw_satellite:n', chip: 'chip_overclock:n',
    },
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
  let fireRate = 200;
  const abilities: string[] = [];

  for (const slot of PART_SLOTS) {
    const key = equippedParts[slot];
    if (!key) continue;
    const { lineId, rarity } = parsePartKey(key);
    const line = getPartLineById(lineId);
    if (!line) continue;

    const bonus = RARITY_BONUS[rarity];
    hp += line.hp + bonus.hp;
    atk += line.atk + bonus.atk;
    speed += line.speed + bonus.speed;
    if (line.fireRate > 0) {
      fireRate = line.fireRate - RARITY_FIRERATE_BONUS[rarity];
    }
    if (line.ability) abilities.push(line.ability);
  }

  return { hp, atk, speed, fireRate, abilities };
}
