export type SkillRarity = 'normal' | 'rare' | 'epic';

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  rarity: SkillRarity;
  category: 'attack' | 'defense' | 'special';
  stackable: boolean;
  maxStacks: number;
}

export const SKILLS: SkillDef[] = [
  // Attack - Normal
  { id: 'atk_up', name: '攻撃力UP', description: '弾のダメージ+1', rarity: 'normal', category: 'attack', stackable: true, maxStacks: 5 },
  { id: 'fire_rate_up', name: '連射速度UP', description: '発射間隔-15%', rarity: 'normal', category: 'attack', stackable: true, maxStacks: 4 },
  { id: 'bullet_speed_up', name: '弾速UP', description: '弾の速度+20%', rarity: 'normal', category: 'attack', stackable: true, maxStacks: 3 },
  { id: 'bullet_size_up', name: '弾サイズUP', description: '弾の当たり判定拡大', rarity: 'normal', category: 'attack', stackable: true, maxStacks: 3 },

  // Attack - Rare
  { id: 'double_shot', name: 'ダブルショット', description: '2方向に同時発射', rarity: 'rare', category: 'attack', stackable: false, maxStacks: 1 },
  { id: 'triple_shot', name: 'トリプルショット', description: '3方向に扇状発射', rarity: 'rare', category: 'attack', stackable: false, maxStacks: 1 },
  { id: 'rear_shot', name: '後方射撃', description: '後方にも弾を発射', rarity: 'rare', category: 'attack', stackable: false, maxStacks: 1 },
  { id: 'pierce', name: '貫通弾', description: '弾が敵を貫通する', rarity: 'rare', category: 'attack', stackable: false, maxStacks: 1 },

  // Attack - Epic
  { id: 'homing', name: 'ホーミング弾', description: '弾が敵を追尾する', rarity: 'epic', category: 'attack', stackable: false, maxStacks: 1 },
  { id: 'split_shot', name: '分裂弾', description: '弾が着弾時に分裂', rarity: 'epic', category: 'attack', stackable: false, maxStacks: 1 },

  // Defense - Normal
  { id: 'hp_up', name: 'HP上限UP', description: '最大HP+1', rarity: 'normal', category: 'defense', stackable: true, maxStacks: 5 },
  { id: 'heal', name: 'HP回復', description: 'HPを1回復', rarity: 'normal', category: 'defense', stackable: true, maxStacks: 99 },
  { id: 'def_up', name: 'ダメージ軽減', description: '被ダメ-1（最低1）', rarity: 'normal', category: 'defense', stackable: true, maxStacks: 3 },

  // Defense - Rare
  { id: 'regen', name: 'リジェネ', description: 'ウェーブ終了時HP+1回復', rarity: 'rare', category: 'defense', stackable: true, maxStacks: 3 },
  { id: 'shield', name: 'シールド', description: '次の被弾を1回無効化', rarity: 'rare', category: 'defense', stackable: true, maxStacks: 3 },

  // Defense - Epic
  { id: 'invincible_dash', name: '無敵ダッシュ', description: '素早い移動時に無敵', rarity: 'epic', category: 'defense', stackable: false, maxStacks: 1 },

  // Special - Normal
  { id: 'magnet', name: 'マグネット', description: 'コイン吸引範囲拡大', rarity: 'normal', category: 'special', stackable: true, maxStacks: 3 },
  { id: 'coin_bonus', name: 'コインボーナス', description: 'コイン獲得+25%', rarity: 'normal', category: 'special', stackable: true, maxStacks: 4 },

  // Special - Rare
  { id: 'freeze_shot', name: 'フリーズ弾', description: '弾が敵を一時停止', rarity: 'rare', category: 'special', stackable: false, maxStacks: 1 },
  { id: 'burn_shot', name: '炎上弾', description: '弾が敵にDoTダメージ', rarity: 'rare', category: 'special', stackable: false, maxStacks: 1 },

  // Special - Epic
  { id: 'side_drone', name: 'サイドドローン', description: '左右にドローンが追従射撃', rarity: 'epic', category: 'special', stackable: true, maxStacks: 2 },
];
