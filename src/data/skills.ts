export type SkillRarity = 'normal' | 'rare' | 'epic' | 'legendary';

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  rarity: SkillRarity;
  category: 'attack' | 'defense' | 'special';
  stackable: boolean;
  maxStacks: number;
  evolvesTo?: string;
  evolveStacks?: number;
  conflictsWith?: string[];
}

export const SKILLS: SkillDef[] = [
  // ===== ATTACK - Normal =====
  { id: 'atk_up', name: '攻撃力UP', description: '弾のダメージ+1', rarity: 'normal', category: 'attack', stackable: true, maxStacks: 5, evolvesTo: 'atk_awakening', evolveStacks: 3 },
  { id: 'fire_rate_up', name: '連射速度UP', description: '発射間隔-15%', rarity: 'normal', category: 'attack', stackable: true, maxStacks: 4, evolvesTo: 'machine_gun', evolveStacks: 3 },
  { id: 'bullet_speed_up', name: '弾速UP', description: '弾の速度+20%', rarity: 'normal', category: 'attack', stackable: true, maxStacks: 3, evolvesTo: 'light_speed_bullet', evolveStacks: 3 },
  { id: 'bullet_size_up', name: '弾サイズUP', description: '弾の当たり判定拡大', rarity: 'normal', category: 'attack', stackable: true, maxStacks: 3, evolvesTo: 'giant_bullet', evolveStacks: 3 },
  { id: 'crit_chance', name: 'クリティカル率UP', description: 'クリティカル率+10%', rarity: 'normal', category: 'attack', stackable: true, maxStacks: 5, evolvesTo: 'critical_master', evolveStacks: 3 },
  { id: 'rapid_fire', name: 'ラピッドファイア', description: '3秒間連射速度2倍(10秒CD)', rarity: 'normal', category: 'attack', stackable: true, maxStacks: 3, evolvesTo: 'full_auto', evolveStacks: 2 },

  // ===== ATTACK - Rare =====
  { id: 'double_shot', name: 'ダブルショット', description: '2方向に同時発射', rarity: 'rare', category: 'attack', stackable: false, maxStacks: 1, conflictsWith: ['triple_shot'] },
  { id: 'triple_shot', name: 'トリプルショット', description: '3方向に扇状発射', rarity: 'rare', category: 'attack', stackable: false, maxStacks: 1, conflictsWith: ['double_shot'] },
  { id: 'rear_shot', name: '後方射撃', description: '後方にも弾を発射', rarity: 'rare', category: 'attack', stackable: false, maxStacks: 1 },
  { id: 'pierce', name: '貫通弾', description: '弾が敵を貫通する', rarity: 'rare', category: 'attack', stackable: false, maxStacks: 1 },
  { id: 'explosion_shot', name: '爆裂弾', description: '弾が着弾時に範囲爆発', rarity: 'rare', category: 'attack', stackable: false, maxStacks: 1 },
  { id: 'chain_damage', name: 'チェインダメージ', description: '敵を倒すと周囲に連鎖ダメージ', rarity: 'rare', category: 'attack', stackable: false, maxStacks: 1 },
  { id: 'power_shot', name: 'パワーショット', description: '5発毎に高威力弾を発射', rarity: 'rare', category: 'attack', stackable: false, maxStacks: 1 },
  { id: 'multi_bounce', name: 'リフレクト弾', description: '弾が壁で反射する', rarity: 'rare', category: 'attack', stackable: false, maxStacks: 1 },

  // ===== ATTACK - Epic =====
  { id: 'homing', name: 'ホーミング弾', description: '弾が敵を追尾する', rarity: 'epic', category: 'attack', stackable: false, maxStacks: 1 },
  { id: 'split_shot', name: '分裂弾', description: '弾が着弾時に分裂', rarity: 'epic', category: 'attack', stackable: false, maxStacks: 1 },
  { id: 'elemental_burst', name: 'エレメンタルバースト', description: '弾にランダム属性付与', rarity: 'epic', category: 'attack', stackable: false, maxStacks: 1 },
  { id: 'overcharge', name: 'オーバーチャージ', description: '攻撃を溜めて強力な一撃', rarity: 'epic', category: 'attack', stackable: false, maxStacks: 1 },

  // ===== DEFENSE - Normal =====
  { id: 'hp_up', name: 'HP上限UP', description: '最大HP+1', rarity: 'normal', category: 'defense', stackable: true, maxStacks: 5, evolvesTo: 'life_spring', evolveStacks: 3 },
  { id: 'heal', name: 'HP回復', description: 'HPを1回復', rarity: 'normal', category: 'defense', stackable: true, maxStacks: 99 },
  { id: 'def_up', name: 'ダメージ軽減', description: '被ダメ-1（最低1）', rarity: 'normal', category: 'defense', stackable: true, maxStacks: 3, evolvesTo: 'iron_wall', evolveStacks: 3 },
  { id: 'dodge', name: '回避', description: '被弾時15%で回避', rarity: 'normal', category: 'defense', stackable: true, maxStacks: 5, evolvesTo: 'afterimage', evolveStacks: 3 },
  { id: 'thorns', name: '反撃', description: '被弾時に反撃弾発射', rarity: 'normal', category: 'defense', stackable: true, maxStacks: 3, evolvesTo: 'retaliation', evolveStacks: 2 },
  { id: 'hp_regen_time', name: '時間回復', description: '15秒毎にHP+1', rarity: 'normal', category: 'defense', stackable: true, maxStacks: 3, evolvesTo: 'regen_blessing', evolveStacks: 2 },

  // ===== DEFENSE - Rare =====
  { id: 'regen', name: 'リジェネ', description: 'ウェーブ終了時HP+1回復', rarity: 'rare', category: 'defense', stackable: true, maxStacks: 3, evolvesTo: 'immortal', evolveStacks: 3 },
  { id: 'shield', name: 'シールド', description: '次の被弾を1回無効化', rarity: 'rare', category: 'defense', stackable: true, maxStacks: 3, evolvesTo: 'auto_shield', evolveStacks: 3 },
  { id: 'barrier', name: 'バリア', description: '10秒毎にシールド自動付与', rarity: 'rare', category: 'defense', stackable: false, maxStacks: 1 },
  { id: 'lifesteal', name: 'ライフスティール', description: '敵撃破時5%でHP+1回復', rarity: 'rare', category: 'defense', stackable: false, maxStacks: 1 },
  { id: 'last_stand', name: 'ラストスタンド', description: 'HP1で致死ダメージを1回無効', rarity: 'rare', category: 'defense', stackable: false, maxStacks: 1 },

  // ===== DEFENSE - Epic =====
  { id: 'invincible_dash', name: '無敵ダッシュ', description: '素早い移動時に無敵', rarity: 'epic', category: 'defense', stackable: false, maxStacks: 1 },
  { id: 'damage_cap', name: 'ダメージキャップ', description: '1回の被ダメ上限を1に制限', rarity: 'epic', category: 'defense', stackable: false, maxStacks: 1 },
  { id: 'absorb', name: 'アブソーブ', description: '被ダメの一部をHP回復に変換', rarity: 'epic', category: 'defense', stackable: false, maxStacks: 1 },

  // ===== SPECIAL - Normal =====
  { id: 'magnet', name: 'マグネット', description: 'コイン吸引範囲拡大', rarity: 'normal', category: 'special', stackable: true, maxStacks: 3, evolvesTo: 'black_hole', evolveStacks: 3 },
  { id: 'coin_bonus', name: 'コインボーナス', description: 'コイン獲得+25%', rarity: 'normal', category: 'special', stackable: true, maxStacks: 4, evolvesTo: 'alchemy', evolveStacks: 3 },
  { id: 'exp_bonus', name: 'EXPボーナス', description: 'EXP獲得+20%', rarity: 'normal', category: 'special', stackable: true, maxStacks: 5, evolvesTo: 'genius', evolveStacks: 3 },
  { id: 'speed_up', name: '移動速度UP', description: '移動速度+15%', rarity: 'normal', category: 'special', stackable: true, maxStacks: 5, evolvesTo: 'gale', evolveStacks: 3 },
  { id: 'item_luck', name: 'アイテム運', description: '特殊ドロップ率UP', rarity: 'normal', category: 'special', stackable: true, maxStacks: 5, evolvesTo: 'lucky_star', evolveStacks: 3 },

  // ===== SPECIAL - Rare =====
  { id: 'freeze_shot', name: 'フリーズ弾', description: '弾が敵を一時停止', rarity: 'rare', category: 'special', stackable: false, maxStacks: 1 },
  { id: 'burn_shot', name: '炎上弾', description: '弾が敵にDoTダメージ', rarity: 'rare', category: 'special', stackable: false, maxStacks: 1 },
  { id: 'gem_finder', name: 'ジェムファインダー', description: '低確率でジェムドロップ', rarity: 'rare', category: 'special', stackable: false, maxStacks: 1 },
  { id: 'slow_field', name: 'スロウフィールド', description: '周囲の敵の移動速度低下', rarity: 'rare', category: 'special', stackable: false, maxStacks: 1 },
  { id: 'orbital', name: 'オービタル', description: '周回する弾が敵にダメージ', rarity: 'rare', category: 'special', stackable: false, maxStacks: 1 },
  { id: 'bomb', name: 'ボム', description: 'ウェーブ開始時に画面全体攻撃', rarity: 'rare', category: 'special', stackable: false, maxStacks: 1 },

  // ===== SPECIAL - Epic =====
  { id: 'side_drone', name: 'サイドドローン', description: '左右にドローンが追従射撃', rarity: 'epic', category: 'special', stackable: true, maxStacks: 2, evolvesTo: 'drone_army', evolveStacks: 2 },
  { id: 'time_slow', name: 'タイムスロウ', description: '被弾時に1秒間スローモーション', rarity: 'epic', category: 'special', stackable: false, maxStacks: 1 },
  { id: 'clone', name: 'クローン', description: '分身が追従して攻撃', rarity: 'epic', category: 'special', stackable: false, maxStacks: 1 },

  // ===== LEGENDARY (進化専用 - 通常排出なし) =====
  // Attack evolutions
  { id: 'atk_awakening', name: '覚醒の刃', description: 'ATK+5, クリティカル率+10%', rarity: 'legendary', category: 'attack', stackable: false, maxStacks: 1 },
  { id: 'machine_gun', name: 'マシンガン', description: '連射速度が上限突破', rarity: 'legendary', category: 'attack', stackable: false, maxStacks: 1 },
  { id: 'light_speed_bullet', name: '光速弾', description: '弾速3倍+貫通付与', rarity: 'legendary', category: 'attack', stackable: false, maxStacks: 1 },
  { id: 'giant_bullet', name: '巨大弾', description: '弾サイズ2倍+ノックバック', rarity: 'legendary', category: 'attack', stackable: false, maxStacks: 1 },
  { id: 'critical_master', name: '必殺の一撃', description: 'クリ率50%+クリダメ2倍', rarity: 'legendary', category: 'attack', stackable: false, maxStacks: 1 },
  { id: 'full_auto', name: 'フルオート', description: '常時連射速度1.5倍', rarity: 'legendary', category: 'attack', stackable: false, maxStacks: 1 },

  // Defense evolutions
  { id: 'life_spring', name: '生命の泉', description: '最大HP+5, 全回復', rarity: 'legendary', category: 'defense', stackable: false, maxStacks: 1 },
  { id: 'iron_wall', name: '鉄壁', description: '被ダメ-3, 反撃弾', rarity: 'legendary', category: 'defense', stackable: false, maxStacks: 1 },
  { id: 'auto_shield', name: 'オートシールド', description: 'ウェーブ毎にシールド全回復', rarity: 'legendary', category: 'defense', stackable: false, maxStacks: 1 },
  { id: 'immortal', name: '不死', description: 'ウェーブ終了時HP全回復', rarity: 'legendary', category: 'defense', stackable: false, maxStacks: 1 },
  { id: 'afterimage', name: '残像', description: '30%回避+回避時に反撃', rarity: 'legendary', category: 'defense', stackable: false, maxStacks: 1 },
  { id: 'retaliation', name: '報復', description: '反撃弾がホーミング+ATK分ダメージ', rarity: 'legendary', category: 'defense', stackable: false, maxStacks: 1 },
  { id: 'regen_blessing', name: '再生の祝福', description: '5秒毎HP+1, 最大HP超過可能', rarity: 'legendary', category: 'defense', stackable: false, maxStacks: 1 },

  // Special evolutions
  { id: 'black_hole', name: 'ブラックホール', description: '全アイテム自動回収+敵弾吸引', rarity: 'legendary', category: 'special', stackable: false, maxStacks: 1 },
  { id: 'alchemy', name: '錬金術', description: 'コイン2倍+低確率でジェム変換', rarity: 'legendary', category: 'special', stackable: false, maxStacks: 1 },
  { id: 'genius', name: '天才', description: 'EXP2倍+スキル選択肢+1', rarity: 'legendary', category: 'special', stackable: false, maxStacks: 1 },
  { id: 'gale', name: '疾風', description: '速度2倍+移動中無敵フレーム', rarity: 'legendary', category: 'special', stackable: false, maxStacks: 1 },
  { id: 'lucky_star', name: '幸運の星', description: '全ドロップ2倍+ボスからレア報酬', rarity: 'legendary', category: 'special', stackable: false, maxStacks: 1 },
  { id: 'drone_army', name: 'ドローン軍団', description: 'ドローン4機+全方位射撃', rarity: 'legendary', category: 'special', stackable: false, maxStacks: 1 },
];
