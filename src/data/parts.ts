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

export interface BonusAbility {
  id: string;
  desc: string;
}

export interface PartLineDef {
  id: string;
  slot: PartSlot;
  names: Record<PartRarity, string>;
  hp: number;         // N基準のベースHP
  atk: number;        // N基準のベースATK
  speed: number;      // N基準のベース移動速度
  fireRate: number;   // メインウェポン専用 (0=影響なし)
  ability: string;    // 基本能力キー (全レアリティ共通, 空文字=なし)
  abilityDesc: string;
  color: number;
  /** SR/UR/LRで追加解放される能力 */
  bonusAbilities?: {
    sr?: BonusAbility;
    ur?: BonusAbility;
    lr?: BonusAbility;
  };
}

export const PART_LINES: PartLineDef[] = [
  // ====== コア (HP/防御) ======
  {
    id: 'core_basic', slot: 'core',
    names: { n: 'ワークス・コア', r: 'ミリタリー・コア', sr: 'ジェネシス・コア', ur: 'オメガ・レギュレーター', lr: '終焉の孵化母体' },
    hp: 5, atk: 0, speed: 0, fireRate: 0,
    ability: '', abilityDesc: '', color: 0x4488aa,
  },
  {
    id: 'core_guard', slot: 'core',
    names: { n: 'ガード・フレーム', r: 'リアクティブ・アーマー', sr: 'アダマント・シェル', ur: 'イージス・プロテクター', lr: '侵蝕する甲殻の檻' },
    hp: 4, atk: 0, speed: 0, fireRate: 0,
    ability: 'def_1', abilityDesc: '被ダメージ軽減', color: 0x4488ff,
  },
  {
    id: 'core_vital', slot: 'core',
    names: { n: 'バイタル・モジュール', r: 'リカバリー・ユニット', sr: 'オート・シールダー', ur: 'ミラクル・レジスト', lr: '脈打つ防壁の臓腑' },
    hp: 6, atk: 0, speed: 0, fireRate: 0,
    ability: 'auto_shield', abilityDesc: 'HP50%以下でシールド自動付与', color: 0xff44ff,
  },
  {
    id: 'core_fortress', slot: 'core',
    names: { n: 'ヘビー・フレーム', r: 'フォートレス・コア', sr: 'タイタン・アーマー', ur: 'バスティオン・コア', lr: '万象を拒む肉壁' },
    hp: 7, atk: 0, speed: 0, fireRate: 0,
    ability: 'fortress', abilityDesc: '被ダメ-2, ウェーブ開始時HP+1', color: 0xffaa00,
  },
  {
    id: 'core_immortal', slot: 'core',
    names: { n: 'サバイバル・コア', r: 'ラストスタンド', sr: 'フェニックス・コア', ur: 'イモータル・ハート', lr: '死を喰らう心臓' },
    hp: 4, atk: 1, speed: 0, fireRate: 0,
    ability: 'immortal', abilityDesc: '致死ダメージを1回だけ耐える', color: 0xff4444,
  },
  {
    id: 'core_regen', slot: 'core',
    names: { n: 'リペア・コア', r: 'リジェネ・モジュール', sr: 'ナノリペア・コア', ur: 'エターナル・コア', lr: '己を蝕む再生の苗床' },
    hp: 5, atk: 0, speed: 0, fireRate: 0,
    ability: 'regen', abilityDesc: 'ウェーブ終了時HP+1回復', color: 0x44ff88,
  },
  {
    id: 'core_light', slot: 'core',
    names: { n: 'ライト・フレーム', r: 'カーボン・コア', sr: 'エアロ・コア', ur: 'フェザー・レギュレーター', lr: '骨を削る軽量の呪い' },
    hp: 3, atk: 0, speed: 30, fireRate: 0,
    ability: 'lightweight', abilityDesc: 'HP低めだが移動速度+', color: 0x88ccff,
  },
  {
    id: 'core_nova', slot: 'core',
    names: { n: 'リアクト・コア', r: 'カウンター・コア', sr: 'ノヴァ・リアクター', ur: 'スーパーノヴァ・コア', lr: '怒りを撒く膿の炉心' },
    hp: 4, atk: 1, speed: 0, fireRate: 0,
    ability: 'nova_explode', abilityDesc: '被弾時に周囲に爆発ダメージ', color: 0xff8800,
  },

  // ====== エンジン (移動速度) ======
  {
    id: 'engine_basic', slot: 'engine',
    names: { n: 'スロットル・推進機', r: 'ターボ・ドライブ', sr: 'アトミック・パルス', ur: 'フェニックス・ドライブ', lr: '絶え間なき悶絶の鼓動' },
    hp: 0, atk: 0, speed: 350, fireRate: 0,
    ability: '', abilityDesc: '', color: 0x88aa44,
  },
  {
    id: 'engine_boost', slot: 'engine',
    names: { n: 'ブースト・スラスター', r: 'ハイパー・スラスター', sr: 'イオン・ドライブ', ur: 'ライトニング・ドライブ', lr: '灼熱に軋む筋束' },
    hp: 0, atk: 0, speed: 380, fireRate: 0,
    ability: '', abilityDesc: '', color: 0x44ff44,
  },
  {
    id: 'engine_phantom', slot: 'engine',
    names: { n: 'ファントム・ユニット', r: 'ゴースト・ドライブ', sr: 'スペクター・エンジン', ur: 'ヴァニッシュ・ドライブ', lr: '虚無を纏う亡骸の脈動' },
    hp: 1, atk: 0, speed: 360, fireRate: 0,
    ability: 'invincible_dash', abilityDesc: '素早い移動時に無敵', color: 0x8844ff,
  },
  {
    id: 'engine_warp', slot: 'engine',
    names: { n: 'ワープ・モジュール', r: 'テレポート・ユニット', sr: 'ブリンク・ドライブ', ur: 'ディメンション・シフター', lr: '時空を喰う蟲穴' },
    hp: 0, atk: 0, speed: 370, fireRate: 0,
    ability: 'warp', abilityDesc: '被弾時ランダムテレポート', color: 0xffaa00,
  },
  {
    id: 'engine_light', slot: 'engine',
    names: { n: 'パルス・エンジン', r: 'フラッシュ・ドライブ', sr: 'フォトン・エンジン', ur: 'ルミナス・ドライブ', lr: '光を貪る飢餓の炎' },
    hp: 1, atk: 0, speed: 370, fireRate: 0,
    ability: 'speed_atk', abilityDesc: '移動速度に応じてATK+1~3', color: 0xff4444,
  },
  {
    id: 'engine_stealth', slot: 'engine',
    names: { n: 'サイレント・スラスター', r: 'ステルス・ドライブ', sr: 'クローク・エンジン', ur: 'シャドウ・ドライブ', lr: '闇に溶ける腐肉' },
    hp: 0, atk: 0, speed: 340, fireRate: 0,
    ability: 'stealth', abilityDesc: '停止時に敵弾を回避(2秒ごと)', color: 0x224466,
  },
  {
    id: 'engine_burst', slot: 'engine',
    names: { n: 'バースト・スラスター', r: 'ラッシュ・ドライブ', sr: 'ブレイズ・エンジン', ur: 'ソニック・ドライブ', lr: '悲鳴を上げる加速器官' },
    hp: 0, atk: 0, speed: 390, fireRate: 0,
    ability: 'burst_dodge', abilityDesc: '回避時に一瞬速度2倍', color: 0xff44aa,
  },
  {
    id: 'engine_gravity', slot: 'engine',
    names: { n: 'グラビティ・ユニット', r: 'プル・ドライブ', sr: 'シンギュラリティ・コア', ur: 'ブラックホール・ドライブ', lr: '全てを呑む暗黒の胃袋' },
    hp: 0, atk: 0, speed: 330, fireRate: 0,
    ability: 'gravity_pull', abilityDesc: '周囲の敵弾を引き寄せて消す', color: 0x6644aa,
  },

  // ====== ウイング (成長/収集効率) ======
  {
    id: 'wing_basic', slot: 'wing',
    names: { n: 'ベーシック・ベーン', r: 'エアロ・スタビライザー', sr: 'ヴァリアブル・バインダー', ur: 'ストラト・バインダー', lr: '天を覆う肉厚の絶望' },
    hp: 0, atk: 0, speed: 50, fireRate: 0,
    ability: '', abilityDesc: '', color: 0xaa8844,
  },
  {
    id: 'wing_collector', slot: 'wing',
    names: { n: 'コレクター・ウイング', r: 'ギャザラー・ベーン', sr: 'ハーベスト・バインダー', ur: 'プロスペクター・ウイング', lr: '富を貪る粘膜の翼' },
    hp: 0, atk: 0, speed: 30, fireRate: 0,
    ability: 'coin_25', abilityDesc: 'コイン獲得+25%', color: 0xffdd44,
  },
  {
    id: 'wing_exp', slot: 'wing',
    names: { n: 'ラーニング・ウイング', r: 'グロース・ベーン', sr: 'エンライト・バインダー', ur: 'サピエンス・ウイング', lr: '知を吸い尽くす触手翼' },
    hp: 0, atk: 0, speed: 40, fireRate: 0,
    ability: 'exp_30', abilityDesc: 'EXP獲得+30%', color: 0x88ff88,
  },
  {
    id: 'wing_fortune', slot: 'wing',
    names: { n: 'フォーチュン・ウイング', r: 'ラック・ベーン', sr: 'ブレスド・バインダー', ur: 'ミラクル・ウイング', lr: '欲望を孕む福音の膜翼' },
    hp: 1, atk: 0, speed: 40, fireRate: 0,
    ability: 'fortune', abilityDesc: 'コイン+50%, EXP+30%, マグネット+50', color: 0xffaa00,
  },
  {
    id: 'wing_destiny', slot: 'wing',
    names: { n: 'デスティニー・ウイング', r: 'フェイト・ベーン', sr: 'プロビデンス・バインダー', ur: 'カルマ・ウイング', lr: '運命を喰い千切る翼' },
    hp: 1, atk: 1, speed: 50, fireRate: 0,
    ability: 'drop_2x', abilityDesc: '特殊ドロップ率2倍', color: 0xff4444,
  },
  {
    id: 'wing_magnet', slot: 'wing',
    names: { n: 'マグネット・ウイング', r: 'アトラクト・ベーン', sr: 'ワイドマグネ・バインダー', ur: 'グラビトン・ウイング', lr: '獲物を絡め捕る粘糸翼' },
    hp: 0, atk: 0, speed: 35, fireRate: 0,
    ability: 'magnet_up', abilityDesc: 'アイテム吸引範囲+80', color: 0x44aaff,
  },
  {
    id: 'wing_shield', slot: 'wing',
    names: { n: 'ガード・ウイング', r: 'プロテクト・ベーン', sr: 'セーフティ・バインダー', ur: 'バルウォーク・ウイング', lr: '堅牢に蠢く外殻翼' },
    hp: 2, atk: 0, speed: 25, fireRate: 0,
    ability: 'wing_shield', abilityDesc: 'ウェーブ開始時シールド+1', color: 0x4488cc,
  },
  {
    id: 'wing_assault', slot: 'wing',
    names: { n: 'アサルト・ウイング', r: 'ストライク・ベーン', sr: 'レイド・バインダー', ur: 'ブリッツ・ウイング', lr: '殲滅を渇望する血翼' },
    hp: 0, atk: 1, speed: 45, fireRate: 0,
    ability: 'assault', abilityDesc: '敵撃破時に一定確率でATK一時上昇', color: 0xff6644,
  },

  // ====== メインウェポン (攻撃力/連射/弾タイプ) ======
  {
    id: 'mw_basic', slot: 'main_weapon',
    names: { n: 'ライト・バルカン', r: 'ヘビー・マシンガン', sr: 'レーザー・ライフル', ur: 'プラズマ・ストライカー', lr: '怨嗟を吐き散らす口' },
    hp: 0, atk: 1, speed: 0, fireRate: 200,
    ability: '', abilityDesc: '', color: 0xcc4444,
  },
  {
    id: 'mw_rapid', slot: 'main_weapon',
    names: { n: 'ラピッド・バルカン', r: 'バースト・ガン', sr: 'チェーン・バルカン', ur: 'ヘルファイア・ガン', lr: '呪詛を連ねる顎' },
    hp: 0, atk: 1, speed: 0, fireRate: 150,
    ability: '', abilityDesc: '', color: 0xff6644,
  },
  {
    id: 'mw_spread', slot: 'main_weapon',
    names: { n: 'スプレッド・ショット', r: 'ワイド・ショット', sr: 'バースト・ショット', ur: 'ストーム・キャノン', lr: '四方へ裂ける肉の華' },
    hp: 0, atk: 2, speed: 0, fireRate: 190,
    ability: 'double_shot', abilityDesc: '初期ダブルショット', color: 0xff44ff,
  },
  {
    id: 'mw_laser', slot: 'main_weapon',
    names: { n: 'レーザー・ガン', r: 'ビーム・キャノン', sr: 'フォトン・ライフル', ur: 'メガ・レーザー', lr: '全てを貫く憎悪の光線' },
    hp: 0, atk: 3, speed: 0, fireRate: 220,
    ability: 'pierce', abilityDesc: '貫通弾', color: 0xffaa00,
  },
  {
    id: 'mw_plasma', slot: 'main_weapon',
    names: { n: 'プラズマ・ガン', r: 'プラズマ・キャノン', sr: 'プラズマ・ライフル', ur: 'ノヴァ・キャノン', lr: '執念で追い縋る蝕弾' },
    hp: 0, atk: 3, speed: 0, fireRate: 170,
    ability: 'homing_pierce', abilityDesc: 'ホーミング+貫通', color: 0xff4444,
  },
  {
    id: 'mw_shotgun', slot: 'main_weapon',
    names: { n: 'ショット・ガン', r: 'バック・ショット', sr: 'スラッグ・ショット', ur: 'デストロイヤー', lr: '獲物を引き裂く爆ぜる牙' },
    hp: 0, atk: 4, speed: 0, fireRate: 350,
    ability: 'shotgun_spread', abilityDesc: '近距離扇状3発同時発射', color: 0xaa6622,
  },
  {
    id: 'mw_sniper', slot: 'main_weapon',
    names: { n: 'スナイパー・ガン', r: 'マークスマン', sr: 'デッドアイ・ライフル', ur: 'ハンター・キャノン', lr: '命を射抜く凝視の眼窩' },
    hp: 0, atk: 5, speed: 0, fireRate: 400,
    ability: 'sniper_crit', abilityDesc: '高火力+クリティカル率30%', color: 0x226644,
  },
  {
    id: 'mw_chain', slot: 'main_weapon',
    names: { n: 'チェーン・ガン', r: 'アーク・ガン', sr: 'ライトニング・ガン', ur: 'サンダーボルト', lr: '神経を伝う激痛の雷' },
    hp: 0, atk: 2, speed: 0, fireRate: 180,
    ability: 'chain_lightning', abilityDesc: '着弾時に近くの敵へ連鎖ダメージ', color: 0x44ddff,
  },

  // ====== サブウェポン (副武装) ======
  {
    id: 'sw_none', slot: 'sub_weapon',
    names: { n: 'スモール・ミサイル', r: 'ワイド・スプレッダー', sr: 'クラスター・ランチャー', ur: 'マルチ・ランチャー', lr: '共食いする胎児の群れ' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: '', abilityDesc: '', color: 0x666666,
  },
  {
    id: 'sw_missile', slot: 'sub_weapon',
    names: { n: 'ミサイル・ポッド', r: 'ミサイル・ランチャー', sr: 'マルチ・ミサイル', ur: 'ヘビーミサイル・システム', lr: '母体から射出される蛆' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'auto_missile', abilityDesc: '5秒ごとに自動ミサイル1発', color: 0xff8844,
  },
  {
    id: 'sw_drone', slot: 'sub_weapon',
    names: { n: 'ドローン・ユニット', r: 'ドローン Mk-II', sr: 'ドローン Mk-III', ur: 'ドローン Mk-IV', lr: '従順に蠢く寄生子' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'drone_1', abilityDesc: 'サイドドローン1機', color: 0x44ffcc,
  },
  {
    id: 'sw_barrier', slot: 'sub_weapon',
    names: { n: 'バリア・ユニット', r: 'シールド・モジュール', sr: 'フォース・フィールド', ur: 'アブソリュート・シールド', lr: '拒絶の皮膜' },
    hp: 2, atk: 0, speed: 0, fireRate: 0,
    ability: 'shield_2', abilityDesc: '初期シールド+2', color: 0x44aaff,
  },
  {
    id: 'sw_satellite', slot: 'sub_weapon',
    names: { n: 'サテライト・ビット', r: 'サテライト・ユニット', sr: 'サテライト・システム', ur: 'サテライト・アレイ', lr: '眷属を率いる支配の臍帯' },
    hp: 0, atk: 1, speed: 0, fireRate: 0,
    ability: 'satellite', abilityDesc: 'ドローン2機+後方射撃', color: 0xff4444,
  },
  {
    id: 'sw_mine', slot: 'sub_weapon',
    names: { n: 'マイン・ポッド', r: 'マイン・ランチャー', sr: 'クラスター・マイン', ur: 'メガマイン・システム', lr: '大地に埋まる孵化卵' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'auto_mine', abilityDesc: '3秒ごとに後方に地雷を設置', color: 0xaaaa44,
  },
  {
    id: 'sw_repair', slot: 'sub_weapon',
    names: { n: 'リペア・ユニット', r: 'リペア・モジュール', sr: 'リペア・システム', ur: 'オートリペア・システム', lr: '傷口を舐め回す肉舌' },
    hp: 1, atk: 0, speed: 0, fireRate: 0,
    ability: 'auto_repair', abilityDesc: '20秒ごとにHP+1回復', color: 0x44ff44,
  },
  {
    id: 'sw_beam', slot: 'sub_weapon',
    names: { n: 'ビーム・ユニット', r: 'ビーム・モジュール', sr: 'ビーム・キャノン', ur: 'ギガビーム・システム', lr: '左右に伸びる蝕腕' },
    hp: 0, atk: 2, speed: 0, fireRate: 0,
    ability: 'side_beam', abilityDesc: '左右にビームを自動発射', color: 0xff88ff,
  },

  // ====== チップ (パッシブ効果) ======
  {
    id: 'chip_basic', slot: 'chip',
    names: { n: 'データ・チップ', r: 'プロセス・チップ', sr: 'ブースト・チップ', ur: 'シンクロ・エディター', lr: '狂気の同化神経網' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: '', abilityDesc: '', color: 0x888888,
  },
  {
    id: 'chip_lucky', slot: 'chip',
    names: { n: 'ラッキー・チップ', r: 'フォーチュン・チップ', sr: 'プロスペリティ・チップ', ur: 'ブレスド・チップ', lr: '幸運を貪る寄生回路' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'drop_15', abilityDesc: '特殊ドロップ率+15%', color: 0x44ff88,
  },
  {
    id: 'chip_critical', slot: 'chip',
    names: { n: 'プレシジョン・チップ', r: 'クリティカル・チップ', sr: 'デッドリー・チップ', ur: 'フェイタル・チップ', lr: '急所を穿つ殺意の棘' },
    hp: 0, atk: 1, speed: 0, fireRate: 0,
    ability: 'crit_15', abilityDesc: 'クリティカル率+15%', color: 0xff44ff,
  },
  {
    id: 'chip_vampire', slot: 'chip',
    names: { n: 'ドレイン・チップ', r: 'ヴァンパイア・チップ', sr: 'リーチ・チップ', ur: 'ソウルドレイン・チップ', lr: '血を啜る飢えた回路' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'vampire', abilityDesc: '敵撃破時5%でHP回復', color: 0xcc0044,
  },
  {
    id: 'chip_overclock', slot: 'chip',
    names: { n: 'オーバークロック', r: 'ハイクロック', sr: 'メガクロック', ur: 'ウルトラクロック', lr: '限界を超えた禁忌の律動' },
    hp: 0, atk: 1, speed: 20, fireRate: 0,
    ability: 'overclock', abilityDesc: '全ステ微増+スキル進化率UP', color: 0xff4444,
  },
  {
    id: 'chip_rage', slot: 'chip',
    names: { n: 'レイジ・チップ', r: 'フューリー・チップ', sr: 'バーサーク・チップ', ur: 'ラース・チップ', lr: '怒りに焼かれる思考回路' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'rage', abilityDesc: 'HP50%以下でATK+3', color: 0xff2200,
  },
  {
    id: 'chip_combo', slot: 'chip',
    names: { n: 'コンボ・チップ', r: 'ストリーク・チップ', sr: 'チェイン・チップ', ur: 'マルチキル・チップ', lr: '殺戮に酔い痴れる快楽中枢' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'combo', abilityDesc: '連続撃破でダメージ倍率UP', color: 0xffaa44,
  },
  {
    id: 'chip_shield', slot: 'chip',
    names: { n: 'シールド・チップ', r: 'プロテクト・チップ', sr: 'ガーディアン・チップ', ur: 'フォート・チップ', lr: '恐怖が編む防壁の繭' },
    hp: 1, atk: 0, speed: 0, fireRate: 0,
    ability: 'start_shield', abilityDesc: 'ラン開始時シールド+1', color: 0x4488ff,
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
