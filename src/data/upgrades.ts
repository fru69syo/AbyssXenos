export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  effect: { stat: string; valuePerLevel: number };
}

export const UPGRADES: UpgradeDef[] = [
  { id: 'max_hp', name: '最大HP強化', description: '最大HPを永続的に増加', maxLevel: 10, baseCost: 100, costMultiplier: 1.5, effect: { stat: 'maxHp', valuePerLevel: 1 } },
  { id: 'atk_power', name: '攻撃力強化', description: '基礎攻撃力を永続的に増加', maxLevel: 10, baseCost: 150, costMultiplier: 1.6, effect: { stat: 'atk', valuePerLevel: 1 } },
  { id: 'move_speed', name: '移動速度強化', description: '移動速度を永続的に増加', maxLevel: 5, baseCost: 200, costMultiplier: 1.8, effect: { stat: 'speed', valuePerLevel: 20 } },
  { id: 'coin_rate', name: 'コイン獲得率UP', description: 'コイン獲得量を永続的に増加', maxLevel: 10, baseCost: 120, costMultiplier: 1.4, effect: { stat: 'coinRate', valuePerLevel: 10 } },
  { id: 'start_shield', name: '初期シールド', description: 'ラン開始時にシールド付与', maxLevel: 3, baseCost: 500, costMultiplier: 2.0, effect: { stat: 'startShield', valuePerLevel: 1 } },
  { id: 'skill_reroll', name: 'スキルリロール', description: 'スキル選択のリロール回数増加', maxLevel: 3, baseCost: 300, costMultiplier: 2.0, effect: { stat: 'rerolls', valuePerLevel: 1 } },
];
