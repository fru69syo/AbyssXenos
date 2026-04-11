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
    bonusAbilities: {
      sr: { id: 'minor_shield', desc: 'ラン開始時シールド+1' },
      ur: { id: 'passive_def', desc: '全被ダメージ-1' },
      lr: { id: 'auto_revive', desc: '戦闘不能時にHP50%で自動復活' },
    },
  },
  {
    id: 'core_guard', slot: 'core',
    names: { n: 'ガード・フレーム', r: 'リアクティブ・アーマー', sr: 'アダマント・シェル', ur: 'イージス・プロテクター', lr: '侵蝕する甲殻の檻' },
    hp: 4, atk: 0, speed: 0, fireRate: 0,
    ability: 'def_1', abilityDesc: '被ダメージ軽減', color: 0x4488ff,
    bonusAbilities: {
      sr: { id: 'def_reflect', desc: '被弾時10%で反射弾発射' },
      ur: { id: 'def_absorb', desc: '被ダメの20%をHP回復に変換' },
      lr: { id: 'def_perfect', desc: '3秒毎に全ダメージ無効化(0.5秒)' },
    },
  },
  {
    id: 'core_vital', slot: 'core',
    names: { n: 'バイタル・モジュール', r: 'リカバリー・ユニット', sr: 'オート・シールダー', ur: 'ミラクル・レジスト', lr: '脈打つ防壁の臓腑' },
    hp: 6, atk: 0, speed: 0, fireRate: 0,
    ability: 'auto_shield', abilityDesc: 'HP50%以下でシールド自動付与', color: 0xff44ff,
    bonusAbilities: {
      sr: { id: 'shield_60', desc: 'シールド発動閾値をHP60%に緩和' },
      ur: { id: 'shield_double', desc: 'シールド付与量+2' },
      lr: { id: 'shield_regen', desc: 'シールド中は毎秒HP+1回復' },
    },
  },
  {
    id: 'core_fortress', slot: 'core',
    names: { n: 'ヘビー・フレーム', r: 'フォートレス・コア', sr: 'タイタン・アーマー', ur: 'バスティオン・コア', lr: '万象を拒む肉壁' },
    hp: 7, atk: 0, speed: 0, fireRate: 0,
    ability: 'fortress', abilityDesc: '被ダメ-2, ウェーブ開始時HP+1', color: 0xffaa00,
    bonusAbilities: {
      sr: { id: 'fortress_hp2', desc: 'ウェーブ開始時HP+2に強化' },
      ur: { id: 'fortress_def3', desc: '被ダメージ-3に強化' },
      lr: { id: 'fortress_iron', desc: 'HP満タン時は全ダメージ無効' },
    },
  },
  {
    id: 'core_immortal', slot: 'core',
    names: { n: 'サバイバル・コア', r: 'ラストスタンド', sr: 'フェニックス・コア', ur: 'イモータル・ハート', lr: '死を喰らう心臓' },
    hp: 4, atk: 1, speed: 0, fireRate: 0,
    ability: 'immortal', abilityDesc: '致死ダメージを1回だけ耐える', color: 0xff4444,
    bonusAbilities: {
      sr: { id: 'immortal_inv', desc: '耐久発動後2秒間無敵' },
      ur: { id: 'immortal_2', desc: '致死耐久が2回に増加' },
      lr: { id: 'immortal_rage', desc: '耐久発動時ATK+5(30秒)' },
    },
  },
  {
    id: 'core_regen', slot: 'core',
    names: { n: 'リペア・コア', r: 'リジェネ・モジュール', sr: 'ナノリペア・コア', ur: 'エターナル・コア', lr: '己を蝕む再生の苗床' },
    hp: 5, atk: 0, speed: 0, fireRate: 0,
    ability: 'regen', abilityDesc: 'ウェーブ終了時HP+1回復', color: 0x44ff88,
    bonusAbilities: {
      sr: { id: 'regen_2', desc: 'ウェーブ終了時HP+2に強化' },
      ur: { id: 'regen_passive', desc: '15秒毎にHP+1自動回復' },
      lr: { id: 'regen_overheal', desc: '最大HPを超えて回復可能(+5)' },
    },
  },
  {
    id: 'core_light', slot: 'core',
    names: { n: 'ライト・フレーム', r: 'カーボン・コア', sr: 'エアロ・コア', ur: 'フェザー・レギュレーター', lr: '骨を削る軽量の呪い' },
    hp: 3, atk: 0, speed: 30, fireRate: 0,
    ability: 'lightweight', abilityDesc: 'HP低めだが移動速度+', color: 0x88ccff,
    bonusAbilities: {
      sr: { id: 'dodge_10', desc: '10%の確率で被弾を回避' },
      ur: { id: 'low_hp_speed', desc: 'HP50%以下で移動速度2倍' },
      lr: { id: 'afterimage', desc: '高速移動時に残像が敵を攻撃' },
    },
  },
  {
    id: 'core_nova', slot: 'core',
    names: { n: 'リアクト・コア', r: 'カウンター・コア', sr: 'ノヴァ・リアクター', ur: 'スーパーノヴァ・コア', lr: '怒りを撒く膿の炉心' },
    hp: 4, atk: 1, speed: 0, fireRate: 0,
    ability: 'nova_explode', abilityDesc: '被弾時に周囲に爆発ダメージ', color: 0xff8800,
    bonusAbilities: {
      sr: { id: 'nova_range', desc: '爆発範囲1.5倍' },
      ur: { id: 'nova_stun', desc: '爆発が敵を1秒スタン' },
      lr: { id: 'nova_chain', desc: '爆発が連鎖し周囲の敵にも誘爆' },
    },
  },

  // ====== エンジン (移動速度) ======
  {
    id: 'engine_basic', slot: 'engine',
    names: { n: 'スロットル・推進機', r: 'ターボ・ドライブ', sr: 'アトミック・パルス', ur: 'フェニックス・ドライブ', lr: '絶え間なき悶絶の鼓動' },
    hp: 0, atk: 0, speed: 350, fireRate: 0,
    ability: '', abilityDesc: '', color: 0x88aa44,
    bonusAbilities: {
      sr: { id: 'kill_speed', desc: '敵撃破時に速度+10%(3秒)' },
      ur: { id: 'momentum_dmg', desc: '高速移動中に接触した敵にダメージ' },
      lr: { id: 'speed_aura', desc: '周囲の敵に継続ダメージオーラ' },
    },
  },
  {
    id: 'engine_boost', slot: 'engine',
    names: { n: 'ブースト・スラスター', r: 'ハイパー・スラスター', sr: 'イオン・ドライブ', ur: 'ライトニング・ドライブ', lr: '灼熱に軋む筋束' },
    hp: 0, atk: 0, speed: 380, fireRate: 0,
    ability: '', abilityDesc: '', color: 0x44ff44,
    bonusAbilities: {
      sr: { id: 'accel_buff', desc: '移動開始時に加速バフ(1.3倍)' },
      ur: { id: 'speed_break', desc: '速度上限を突破(+20%)' },
      lr: { id: 'sonic_boom', desc: '最高速到達時に衝撃波を発生' },
    },
  },
  {
    id: 'engine_phantom', slot: 'engine',
    names: { n: 'ファントム・ユニット', r: 'ゴースト・ドライブ', sr: 'スペクター・エンジン', ur: 'ヴァニッシュ・ドライブ', lr: '虚無を纏う亡骸の脈動' },
    hp: 1, atk: 0, speed: 360, fireRate: 0,
    ability: 'invincible_dash', abilityDesc: '素早い移動時に無敵', color: 0x8844ff,
    bonusAbilities: {
      sr: { id: 'dash_extend', desc: '無敵時間が1.5倍に延長' },
      ur: { id: 'dash_attack', desc: '無敵移動中に残像が敵を攻撃' },
      lr: { id: 'phase_shift', desc: '常時20%の確率で敵弾をすり抜け' },
    },
  },
  {
    id: 'engine_warp', slot: 'engine',
    names: { n: 'ワープ・モジュール', r: 'テレポート・ユニット', sr: 'ブリンク・ドライブ', ur: 'ディメンション・シフター', lr: '時空を喰う蟲穴' },
    hp: 0, atk: 0, speed: 370, fireRate: 0,
    ability: 'warp', abilityDesc: '被弾時ランダムテレポート', color: 0xffaa00,
    bonusAbilities: {
      sr: { id: 'warp_blast', desc: 'テレポート元に爆発を残す' },
      ur: { id: 'warp_inv', desc: 'テレポート後1秒間無敵' },
      lr: { id: 'warp_timestop', desc: 'テレポート時に0.5秒間時間停止' },
    },
  },
  {
    id: 'engine_light', slot: 'engine',
    names: { n: 'パルス・エンジン', r: 'フラッシュ・ドライブ', sr: 'フォトン・エンジン', ur: 'ルミナス・ドライブ', lr: '光を貪る飢餓の炎' },
    hp: 1, atk: 0, speed: 370, fireRate: 0,
    ability: 'speed_atk', abilityDesc: '移動速度に応じてATK+1~3', color: 0xff4444,
    bonusAbilities: {
      sr: { id: 'speed_atk4', desc: '速度ATKボーナス上限+4に拡張' },
      ur: { id: 'speed_crit', desc: '高速移動中クリティカル率+20%' },
      lr: { id: 'speed_max_atk', desc: '最高速でATK+8の極大ボーナス' },
    },
  },
  {
    id: 'engine_stealth', slot: 'engine',
    names: { n: 'サイレント・スラスター', r: 'ステルス・ドライブ', sr: 'クローク・エンジン', ur: 'シャドウ・ドライブ', lr: '闇に溶ける腐肉' },
    hp: 0, atk: 0, speed: 340, fireRate: 0,
    ability: 'stealth', abilityDesc: '停止時に敵弾を回避(2秒ごと)', color: 0x224466,
    bonusAbilities: {
      sr: { id: 'stealth_fast', desc: 'ステルス発動間隔1.5秒に短縮' },
      ur: { id: 'stealth_crit', desc: 'ステルスからの初撃が確定クリティカル' },
      lr: { id: 'stealth_perm', desc: '停止中は完全透明化+被弾無効' },
    },
  },
  {
    id: 'engine_burst', slot: 'engine',
    names: { n: 'バースト・スラスター', r: 'ラッシュ・ドライブ', sr: 'ブレイズ・エンジン', ur: 'ソニック・ドライブ', lr: '悲鳴を上げる加速器官' },
    hp: 0, atk: 0, speed: 390, fireRate: 0,
    ability: 'burst_dodge', abilityDesc: '回避時に一瞬速度2倍', color: 0xff44aa,
    bonusAbilities: {
      sr: { id: 'burst_3x', desc: '回避時速度3倍に強化' },
      ur: { id: 'burst_atk', desc: '回避成功時ATK+2(3秒)' },
      lr: { id: 'burst_chain', desc: '回避が連続すると永続加速' },
    },
  },
  {
    id: 'engine_gravity', slot: 'engine',
    names: { n: 'グラビティ・ユニット', r: 'プル・ドライブ', sr: 'シンギュラリティ・コア', ur: 'ブラックホール・ドライブ', lr: '全てを呑む暗黒の胃袋' },
    hp: 0, atk: 0, speed: 330, fireRate: 0,
    ability: 'gravity_pull', abilityDesc: '周囲の敵弾を引き寄せて消す', color: 0x6644aa,
    bonusAbilities: {
      sr: { id: 'gravity_wide', desc: '引力範囲1.5倍に拡大' },
      ur: { id: 'gravity_dmg', desc: '引き寄せた弾が敵にダメージを与える' },
      lr: { id: 'singularity', desc: '特異点フィールドが敵も引き寄せる' },
    },
  },

  // ====== ウイング (成長/収集効率) ======
  {
    id: 'wing_basic', slot: 'wing',
    names: { n: 'ベーシック・ベーン', r: 'エアロ・スタビライザー', sr: 'ヴァリアブル・バインダー', ur: 'ストラト・バインダー', lr: '天を覆う肉厚の絶望' },
    hp: 0, atk: 0, speed: 50, fireRate: 0,
    ability: '', abilityDesc: '', color: 0xaa8844,
    bonusAbilities: {
      sr: { id: 'exp_10', desc: 'EXP獲得+10%' },
      ur: { id: 'pickup_range', desc: 'アイテム吸引範囲+50' },
      lr: { id: 'drop_double', desc: '全ドロップ量2倍' },
    },
  },
  {
    id: 'wing_collector', slot: 'wing',
    names: { n: 'コレクター・ウイング', r: 'ギャザラー・ベーン', sr: 'ハーベスト・バインダー', ur: 'プロスペクター・ウイング', lr: '富を貪る粘膜の翼' },
    hp: 0, atk: 0, speed: 30, fireRate: 0,
    ability: 'coin_25', abilityDesc: 'コイン獲得+25%', color: 0xffdd44,
    bonusAbilities: {
      sr: { id: 'coin_40', desc: 'コイン獲得+40%に強化' },
      ur: { id: 'coin_rare', desc: '低確率で高額コインがドロップ' },
      lr: { id: 'coin_atk', desc: 'コイン取得時にATK+1(5秒)' },
    },
  },
  {
    id: 'wing_exp', slot: 'wing',
    names: { n: 'ラーニング・ウイング', r: 'グロース・ベーン', sr: 'エンライト・バインダー', ur: 'サピエンス・ウイング', lr: '知を吸い尽くす触手翼' },
    hp: 0, atk: 0, speed: 40, fireRate: 0,
    ability: 'exp_30', abilityDesc: 'EXP獲得+30%', color: 0x88ff88,
    bonusAbilities: {
      sr: { id: 'exp_50', desc: 'EXP獲得+50%に強化' },
      ur: { id: 'bonus_lv', desc: 'ラン開始時にボーナスLv+1' },
      lr: { id: 'skill_choice', desc: 'スキル選択肢が+1増加' },
    },
  },
  {
    id: 'wing_fortune', slot: 'wing',
    names: { n: 'フォーチュン・ウイング', r: 'ラック・ベーン', sr: 'ブレスド・バインダー', ur: 'ミラクル・ウイング', lr: '欲望を孕む福音の膜翼' },
    hp: 1, atk: 0, speed: 40, fireRate: 0,
    ability: 'fortune', abilityDesc: 'コイン+50%, EXP+30%, マグネット+50', color: 0xffaa00,
    bonusAbilities: {
      sr: { id: 'fortune_gem', desc: '低確率でジェムがドロップ' },
      ur: { id: 'fortune_ticket', desc: 'ボス撃破時にガチャチケット獲得' },
      lr: { id: 'fortune_crit', desc: 'クリティカル率+25%' },
    },
  },
  {
    id: 'wing_destiny', slot: 'wing',
    names: { n: 'デスティニー・ウイング', r: 'フェイト・ベーン', sr: 'プロビデンス・バインダー', ur: 'カルマ・ウイング', lr: '運命を喰い千切る翼' },
    hp: 1, atk: 1, speed: 50, fireRate: 0,
    ability: 'drop_2x', abilityDesc: '特殊ドロップ率2倍', color: 0xff4444,
    bonusAbilities: {
      sr: { id: 'drop_3x', desc: '特殊ドロップ率3倍に強化' },
      ur: { id: 'drop_rare', desc: 'レアドロップの品質が向上' },
      lr: { id: 'drop_boss', desc: 'ボスが確定でレジェンダリー報酬' },
    },
  },
  {
    id: 'wing_magnet', slot: 'wing',
    names: { n: 'マグネット・ウイング', r: 'アトラクト・ベーン', sr: 'ワイドマグネ・バインダー', ur: 'グラビトン・ウイング', lr: '獲物を絡め捕る粘糸翼' },
    hp: 0, atk: 0, speed: 35, fireRate: 0,
    ability: 'magnet_up', abilityDesc: 'アイテム吸引範囲+80', color: 0x44aaff,
    bonusAbilities: {
      sr: { id: 'magnet_120', desc: 'アイテム吸引範囲+120に拡大' },
      ur: { id: 'magnet_auto', desc: '画面内アイテムを自動回収' },
      lr: { id: 'magnet_heal', desc: 'アイテム取得時に5%でHP+1' },
    },
  },
  {
    id: 'wing_shield', slot: 'wing',
    names: { n: 'ガード・ウイング', r: 'プロテクト・ベーン', sr: 'セーフティ・バインダー', ur: 'バルウォーク・ウイング', lr: '堅牢に蠢く外殻翼' },
    hp: 2, atk: 0, speed: 25, fireRate: 0,
    ability: 'wing_shield', abilityDesc: 'ウェーブ開始時シールド+1', color: 0x4488cc,
    bonusAbilities: {
      sr: { id: 'wing_shield2', desc: 'ウェーブ開始時シールド+2に強化' },
      ur: { id: 'shield_regen_w', desc: '30秒毎にシールド+1自動回復' },
      lr: { id: 'shield_reflect', desc: 'シールドが弾を反射する' },
    },
  },
  {
    id: 'wing_assault', slot: 'wing',
    names: { n: 'アサルト・ウイング', r: 'ストライク・ベーン', sr: 'レイド・バインダー', ur: 'ブリッツ・ウイング', lr: '殲滅を渇望する血翼' },
    hp: 0, atk: 1, speed: 45, fireRate: 0,
    ability: 'assault', abilityDesc: '敵撃破時に一定確率でATK一時上昇', color: 0xff6644,
    bonusAbilities: {
      sr: { id: 'assault_rate', desc: 'ATK上昇確率が2倍' },
      ur: { id: 'assault_dur', desc: 'ATK上昇持続時間2倍' },
      lr: { id: 'assault_chain', desc: '連続撃破でATKが永続的に蓄積' },
    },
  },

  // ====== メインウェポン (攻撃力/連射/弾タイプ) ======
  {
    id: 'mw_basic', slot: 'main_weapon',
    names: { n: 'ライト・バルカン', r: 'ヘビー・マシンガン', sr: 'レーザー・ライフル', ur: 'プラズマ・ストライカー', lr: '怨嗟を吐き散らす口' },
    hp: 0, atk: 1, speed: 0, fireRate: 200,
    ability: '', abilityDesc: '', color: 0xcc4444,
    bonusAbilities: {
      sr: { id: 'dmg_up_10', desc: '弾ダメージ+10%' },
      ur: { id: 'double_dmg', desc: '20%の確率で2倍ダメージ' },
      lr: { id: 'tenth_shot', desc: '10発毎にATK×3の強弾を発射' },
    },
  },
  {
    id: 'mw_rapid', slot: 'main_weapon',
    names: { n: 'ラピッド・バルカン', r: 'バースト・ガン', sr: 'チェーン・バルカン', ur: 'ヘルファイア・ガン', lr: '呪詛を連ねる顎' },
    hp: 0, atk: 1, speed: 0, fireRate: 150,
    ability: '', abilityDesc: '', color: 0xff6644,
    bonusAbilities: {
      sr: { id: 'rapid_boost', desc: '連射速度+15%' },
      ur: { id: 'rapid_ramp', desc: '射撃継続で連射速度が加速' },
      lr: { id: 'bullet_hell', desc: '弾幕モード: 全方向に弾を撒く' },
    },
  },
  {
    id: 'mw_spread', slot: 'main_weapon',
    names: { n: 'スプレッド・ショット', r: 'ワイド・ショット', sr: 'バースト・ショット', ur: 'ストーム・キャノン', lr: '四方へ裂ける肉の華' },
    hp: 0, atk: 2, speed: 0, fireRate: 190,
    ability: 'double_shot', abilityDesc: '初期ダブルショット', color: 0xff44ff,
    bonusAbilities: {
      sr: { id: 'triple_shot', desc: 'トリプルショットに強化' },
      ur: { id: 'penta_shot', desc: '5方向ショットに拡張' },
      lr: { id: 'omni_shot', desc: '全方位に弾を発射' },
    },
  },
  {
    id: 'mw_laser', slot: 'main_weapon',
    names: { n: 'レーザー・ガン', r: 'ビーム・キャノン', sr: 'フォトン・ライフル', ur: 'メガ・レーザー', lr: '全てを貫く憎悪の光線' },
    hp: 0, atk: 3, speed: 0, fireRate: 220,
    ability: 'pierce', abilityDesc: '貫通弾', color: 0xffaa00,
    bonusAbilities: {
      sr: { id: 'pierce_trail', desc: '貫通弾がダメージ軌跡を残す' },
      ur: { id: 'pierce_wide', desc: 'ビーム幅が拡大し当たりやすい' },
      lr: { id: 'pierce_infinite', desc: '貫通する度にダメージ増加' },
    },
  },
  {
    id: 'mw_plasma', slot: 'main_weapon',
    names: { n: 'プラズマ・ガン', r: 'プラズマ・キャノン', sr: 'プラズマ・ライフル', ur: 'ノヴァ・キャノン', lr: '執念で追い縋る蝕弾' },
    hp: 0, atk: 3, speed: 0, fireRate: 170,
    ability: 'homing_pierce', abilityDesc: 'ホーミング+貫通', color: 0xff4444,
    bonusAbilities: {
      sr: { id: 'homing_strong', desc: 'ホーミング追尾力1.5倍' },
      ur: { id: 'multi_lock', desc: '同時に3体までマルチロック' },
      lr: { id: 'plasma_field', desc: '着弾地点にプラズマ残留フィールド' },
    },
  },
  {
    id: 'mw_shotgun', slot: 'main_weapon',
    names: { n: 'ショット・ガン', r: 'バック・ショット', sr: 'スラッグ・ショット', ur: 'デストロイヤー', lr: '獲物を引き裂く爆ぜる牙' },
    hp: 0, atk: 4, speed: 0, fireRate: 350,
    ability: 'shotgun_spread', abilityDesc: '近距離扇状3発同時発射', color: 0xaa6622,
    bonusAbilities: {
      sr: { id: 'shotgun_5', desc: '5発同時発射に強化' },
      ur: { id: 'shotgun_knock', desc: '弾がノックバック効果を付与' },
      lr: { id: 'shotgun_kill', desc: '至近距離で即死判定(ボス以外)' },
    },
  },
  {
    id: 'mw_sniper', slot: 'main_weapon',
    names: { n: 'スナイパー・ガン', r: 'マークスマン', sr: 'デッドアイ・ライフル', ur: 'ハンター・キャノン', lr: '命を射抜く凝視の眼窩' },
    hp: 0, atk: 5, speed: 0, fireRate: 400,
    ability: 'sniper_crit', abilityDesc: '高火力+クリティカル率30%', color: 0x226644,
    bonusAbilities: {
      sr: { id: 'crit_45', desc: 'クリティカル率45%に強化' },
      ur: { id: 'crit_dmg_2x', desc: 'クリティカルダメージ2倍' },
      lr: { id: 'oneshot', desc: '5%の確率でボス以外を即死' },
    },
  },
  {
    id: 'mw_chain', slot: 'main_weapon',
    names: { n: 'チェーン・ガン', r: 'アーク・ガン', sr: 'ライトニング・ガン', ur: 'サンダーボルト', lr: '神経を伝う激痛の雷' },
    hp: 0, atk: 2, speed: 0, fireRate: 180,
    ability: 'chain_lightning', abilityDesc: '着弾時に近くの敵へ連鎖ダメージ', color: 0x44ddff,
    bonusAbilities: {
      sr: { id: 'chain_3', desc: '連鎖が3体まで伝播' },
      ur: { id: 'chain_stun', desc: '連鎖ダメージが敵を0.5秒スタン' },
      lr: { id: 'chain_storm', desc: '着弾地点に雷嵐フィールド発生' },
    },
  },

  // ====== サブウェポン (副武装) ======
  {
    id: 'sw_none', slot: 'sub_weapon',
    names: { n: 'スモール・ミサイル', r: 'ワイド・スプレッダー', sr: 'クラスター・ランチャー', ur: 'マルチ・ランチャー', lr: '共食いする胎児の群れ' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: '', abilityDesc: '', color: 0x666666,
    bonusAbilities: {
      sr: { id: 'sub_atk', desc: 'ATK+1の微量バフ' },
      ur: { id: 'sub_random', desc: '10秒毎にランダムなサブ攻撃発動' },
      lr: { id: 'sub_copy', desc: 'メインウェポンの弾を後方にも発射' },
    },
  },
  {
    id: 'sw_missile', slot: 'sub_weapon',
    names: { n: 'ミサイル・ポッド', r: 'ミサイル・ランチャー', sr: 'マルチ・ミサイル', ur: 'ヘビーミサイル・システム', lr: '母体から射出される蛆' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'auto_missile', abilityDesc: '5秒ごとに自動ミサイル1発', color: 0xff8844,
    bonusAbilities: {
      sr: { id: 'missile_2', desc: 'ミサイル同時発射数2に増加' },
      ur: { id: 'missile_homing', desc: 'ミサイルがホーミング化' },
      lr: { id: 'missile_barrage', desc: '3秒毎に5連ミサイル斉射' },
    },
  },
  {
    id: 'sw_drone', slot: 'sub_weapon',
    names: { n: 'ドローン・ユニット', r: 'ドローン Mk-II', sr: 'ドローン Mk-III', ur: 'ドローン Mk-IV', lr: '従順に蠢く寄生子' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'drone_1', abilityDesc: 'サイドドローン1機', color: 0x44ffcc,
    bonusAbilities: {
      sr: { id: 'drone_2', desc: 'ドローン+1 (計2機)' },
      ur: { id: 'drone_rapid', desc: 'ドローンの連射速度1.5倍' },
      lr: { id: 'drone_ability', desc: 'ドローンが特殊弾を発射' },
    },
  },
  {
    id: 'sw_barrier', slot: 'sub_weapon',
    names: { n: 'バリア・ユニット', r: 'シールド・モジュール', sr: 'フォース・フィールド', ur: 'アブソリュート・シールド', lr: '拒絶の皮膜' },
    hp: 2, atk: 0, speed: 0, fireRate: 0,
    ability: 'shield_2', abilityDesc: '初期シールド+2', color: 0x44aaff,
    bonusAbilities: {
      sr: { id: 'shield_3', desc: '初期シールド+3に強化' },
      ur: { id: 'shield_recharge', desc: '20秒毎にシールド+1自動回復' },
      lr: { id: 'shield_explode', desc: 'シールド消滅時に大爆発' },
    },
  },
  {
    id: 'sw_satellite', slot: 'sub_weapon',
    names: { n: 'サテライト・ビット', r: 'サテライト・ユニット', sr: 'サテライト・システム', ur: 'サテライト・アレイ', lr: '眷属を率いる支配の臍帯' },
    hp: 0, atk: 1, speed: 0, fireRate: 0,
    ability: 'satellite', abilityDesc: 'ドローン2機+後方射撃', color: 0xff4444,
    bonusAbilities: {
      sr: { id: 'sat_3', desc: 'サテライト3機に増加' },
      ur: { id: 'sat_360', desc: 'サテライトが全方位射撃' },
      lr: { id: 'sat_beam', desc: 'サテライトがビームを照射' },
    },
  },
  {
    id: 'sw_mine', slot: 'sub_weapon',
    names: { n: 'マイン・ポッド', r: 'マイン・ランチャー', sr: 'クラスター・マイン', ur: 'メガマイン・システム', lr: '大地に埋まる孵化卵' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'auto_mine', abilityDesc: '3秒ごとに後方に地雷を設置', color: 0xaaaa44,
    bonusAbilities: {
      sr: { id: 'mine_2', desc: '地雷を同時に2個設置' },
      ur: { id: 'mine_homing', desc: '地雷が敵に向かって移動' },
      lr: { id: 'mine_field', desc: '地雷が永続し画面を覆い尽くす' },
    },
  },
  {
    id: 'sw_repair', slot: 'sub_weapon',
    names: { n: 'リペア・ユニット', r: 'リペア・モジュール', sr: 'リペア・システム', ur: 'オートリペア・システム', lr: '傷口を舐め回す肉舌' },
    hp: 1, atk: 0, speed: 0, fireRate: 0,
    ability: 'auto_repair', abilityDesc: '20秒ごとにHP+1回復', color: 0x44ff44,
    bonusAbilities: {
      sr: { id: 'repair_15', desc: '回復間隔15秒に短縮' },
      ur: { id: 'repair_2', desc: '回復量HP+2に強化' },
      lr: { id: 'repair_overheal', desc: '最大HPを超えて回復可能(+3)' },
    },
  },
  {
    id: 'sw_beam', slot: 'sub_weapon',
    names: { n: 'ビーム・ユニット', r: 'ビーム・モジュール', sr: 'ビーム・キャノン', ur: 'ギガビーム・システム', lr: '左右に伸びる蝕腕' },
    hp: 0, atk: 2, speed: 0, fireRate: 0,
    ability: 'side_beam', abilityDesc: '左右にビームを自動発射', color: 0xff88ff,
    bonusAbilities: {
      sr: { id: 'beam_dmg', desc: 'ビームダメージ1.5倍' },
      ur: { id: 'beam_4dir', desc: '上下左右4方向にビーム発射' },
      lr: { id: 'beam_rotate', desc: '回転ビームが周囲を薙ぎ払う' },
    },
  },

  // ====== チップ (パッシブ効果) ======
  {
    id: 'chip_basic', slot: 'chip',
    names: { n: 'データ・チップ', r: 'プロセス・チップ', sr: 'ブースト・チップ', ur: 'シンクロ・エディター', lr: '狂気の同化神経網' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: '', abilityDesc: '', color: 0x888888,
    bonusAbilities: {
      sr: { id: 'all_stat_1', desc: '全ステータス+1' },
      ur: { id: 'skill_cd', desc: 'スキルクールダウン-15%' },
      lr: { id: 'extra_skill', desc: 'スキル枠が+1増加' },
    },
  },
  {
    id: 'chip_lucky', slot: 'chip',
    names: { n: 'ラッキー・チップ', r: 'フォーチュン・チップ', sr: 'プロスペリティ・チップ', ur: 'ブレスド・チップ', lr: '幸運を貪る寄生回路' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'drop_15', abilityDesc: '特殊ドロップ率+15%', color: 0x44ff88,
    bonusAbilities: {
      sr: { id: 'drop_25', desc: '特殊ドロップ率+25%に強化' },
      ur: { id: 'drop_quality', desc: 'ドロップ品質が向上' },
      lr: { id: 'drop_legend', desc: 'レジェンダリードロップが出現' },
    },
  },
  {
    id: 'chip_critical', slot: 'chip',
    names: { n: 'プレシジョン・チップ', r: 'クリティカル・チップ', sr: 'デッドリー・チップ', ur: 'フェイタル・チップ', lr: '急所を穿つ殺意の棘' },
    hp: 0, atk: 1, speed: 0, fireRate: 0,
    ability: 'crit_15', abilityDesc: 'クリティカル率+15%', color: 0xff44ff,
    bonusAbilities: {
      sr: { id: 'crit_25', desc: 'クリティカル率+25%に強化' },
      ur: { id: 'crit_dmg', desc: 'クリティカルダメージ2倍' },
      lr: { id: 'crit_chain', desc: 'クリティカル時に近くの敵も被弾' },
    },
  },
  {
    id: 'chip_vampire', slot: 'chip',
    names: { n: 'ドレイン・チップ', r: 'ヴァンパイア・チップ', sr: 'リーチ・チップ', ur: 'ソウルドレイン・チップ', lr: '血を啜る飢えた回路' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'vampire', abilityDesc: '敵撃破時5%でHP回復', color: 0xcc0044,
    bonusAbilities: {
      sr: { id: 'vampire_8', desc: '吸血確率8%に強化' },
      ur: { id: 'vampire_12', desc: '吸血確率12%+回復量増加' },
      lr: { id: 'vampire_aura', desc: '周囲の敵からHP吸収オーラ' },
    },
  },
  {
    id: 'chip_overclock', slot: 'chip',
    names: { n: 'オーバークロック', r: 'ハイクロック', sr: 'メガクロック', ur: 'ウルトラクロック', lr: '限界を超えた禁忌の律動' },
    hp: 0, atk: 1, speed: 20, fireRate: 0,
    ability: 'overclock', abilityDesc: '全ステ微増+スキル進化率UP', color: 0xff4444,
    bonusAbilities: {
      sr: { id: 'oc_boost', desc: '全ステボーナスが2倍' },
      ur: { id: 'oc_burst', desc: '10秒毎に全能力1.5倍(3秒間)' },
      lr: { id: 'oc_perm', desc: 'オーバークロック常時発動' },
    },
  },
  {
    id: 'chip_rage', slot: 'chip',
    names: { n: 'レイジ・チップ', r: 'フューリー・チップ', sr: 'バーサーク・チップ', ur: 'ラース・チップ', lr: '怒りに焼かれる思考回路' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'rage', abilityDesc: 'HP50%以下でATK+3', color: 0xff2200,
    bonusAbilities: {
      sr: { id: 'rage_5', desc: 'ATK+5に強化' },
      ur: { id: 'rage_70', desc: '発動閾値をHP70%に緩和' },
      lr: { id: 'berserk', desc: '狂戦士化: ATK+10, 被ダメ2倍' },
    },
  },
  {
    id: 'chip_combo', slot: 'chip',
    names: { n: 'コンボ・チップ', r: 'ストリーク・チップ', sr: 'チェイン・チップ', ur: 'マルチキル・チップ', lr: '殺戮に酔い痴れる快楽中枢' },
    hp: 0, atk: 0, speed: 0, fireRate: 0,
    ability: 'combo', abilityDesc: '連続撃破でダメージ倍率UP', color: 0xffaa44,
    bonusAbilities: {
      sr: { id: 'combo_fast', desc: 'コンボ倍率の上昇速度2倍' },
      ur: { id: 'combo_keep', desc: 'コンボが途切れにくくなる' },
      lr: { id: 'combo_inf', desc: 'コンボ倍率が無限に蓄積' },
    },
  },
  {
    id: 'chip_shield', slot: 'chip',
    names: { n: 'シールド・チップ', r: 'プロテクト・チップ', sr: 'ガーディアン・チップ', ur: 'フォート・チップ', lr: '恐怖が編む防壁の繭' },
    hp: 1, atk: 0, speed: 0, fireRate: 0,
    ability: 'start_shield', abilityDesc: 'ラン開始時シールド+1', color: 0x4488ff,
    bonusAbilities: {
      sr: { id: 'start_shield2', desc: '開始時シールド+2に強化' },
      ur: { id: 'wave_shield', desc: 'ウェーブ開始毎にシールド+1' },
      lr: { id: 'shield_to_atk', desc: 'シールド吸収分をATKに変換' },
    },
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
  bonusAbilities: BonusAbility[];
}

export function calcPartStats(equippedParts: Record<PartSlot, string>): PartStats {
  let hp = 0;
  let atk = 0;
  let speed = 0;
  let fireRate = 200;
  const abilities: string[] = [];
  const bonusAbilities: BonusAbility[] = [];

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

    // SR以上でボーナス能力を収集
    if (line.bonusAbilities) {
      const ri = PART_RARITY_ORDER.indexOf(rarity);
      if (ri >= 2 && line.bonusAbilities.sr) bonusAbilities.push(line.bonusAbilities.sr);
      if (ri >= 3 && line.bonusAbilities.ur) bonusAbilities.push(line.bonusAbilities.ur);
      if (ri >= 4 && line.bonusAbilities.lr) bonusAbilities.push(line.bonusAbilities.lr);
    }
  }

  return { hp, atk, speed, fireRate, abilities, bonusAbilities };
}
