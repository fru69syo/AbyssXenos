export interface WaveData {
  enemyType: 'drifter' | 'zigzag' | 'shooter' | 'swarm';
  count: number;
  formation: 'line' | 'v' | 'random';
  speed: number;
  shootChance?: number;
}

export interface BossData {
  hp: number;
  speed: number;
  attackPatterns: ('spread' | 'aimed' | 'spiral' | 'laser')[];
}

export interface StageData {
  id: number;
  name: string;
  waves: WaveData[];
  boss: BossData;
}

export const STAGES: StageData[] = [
  {
    id: 1,
    name: '深海入口',
    waves: [
      { enemyType: 'drifter', count: 6, formation: 'line', speed: 100 },
      { enemyType: 'drifter', count: 8, formation: 'random', speed: 110 },
      { enemyType: 'zigzag', count: 5, formation: 'random', speed: 90 },
      { enemyType: 'drifter', count: 10, formation: 'v', speed: 120 },
      { enemyType: 'zigzag', count: 7, formation: 'line', speed: 100 },
    ],
    boss: { hp: 30, speed: 60, attackPatterns: ['spread'] },
  },
  {
    id: 2,
    name: '暗黒海溝',
    waves: [
      { enemyType: 'zigzag', count: 8, formation: 'random', speed: 110 },
      { enemyType: 'shooter', count: 4, formation: 'line', speed: 80, shootChance: 0.02 },
      { enemyType: 'drifter', count: 12, formation: 'v', speed: 130 },
      { enemyType: 'shooter', count: 6, formation: 'random', speed: 90, shootChance: 0.03 },
      { enemyType: 'swarm', count: 15, formation: 'random', speed: 150 },
    ],
    boss: { hp: 50, speed: 70, attackPatterns: ['spread', 'aimed'] },
  },
  {
    id: 3,
    name: '異界の裂け目',
    waves: [
      { enemyType: 'shooter', count: 6, formation: 'line', speed: 100, shootChance: 0.03 },
      { enemyType: 'swarm', count: 18, formation: 'random', speed: 160 },
      { enemyType: 'zigzag', count: 10, formation: 'v', speed: 120 },
      { enemyType: 'shooter', count: 8, formation: 'random', speed: 110, shootChance: 0.04 },
      { enemyType: 'swarm', count: 20, formation: 'line', speed: 170 },
    ],
    boss: { hp: 80, speed: 80, attackPatterns: ['spread', 'aimed', 'spiral'] },
  },
  {
    id: 4,
    name: 'ゼノスの巣窟',
    waves: [
      { enemyType: 'swarm', count: 20, formation: 'random', speed: 170 },
      { enemyType: 'shooter', count: 8, formation: 'v', speed: 120, shootChance: 0.04 },
      { enemyType: 'zigzag', count: 12, formation: 'line', speed: 140 },
      { enemyType: 'shooter', count: 10, formation: 'random', speed: 130, shootChance: 0.05 },
      { enemyType: 'swarm', count: 25, formation: 'v', speed: 180 },
    ],
    boss: { hp: 120, speed: 90, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },
  {
    id: 5,
    name: 'アビス・コア',
    waves: [
      { enemyType: 'shooter', count: 10, formation: 'line', speed: 140, shootChance: 0.05 },
      { enemyType: 'swarm', count: 30, formation: 'random', speed: 190 },
      { enemyType: 'zigzag', count: 15, formation: 'v', speed: 150 },
      { enemyType: 'shooter', count: 12, formation: 'v', speed: 150, shootChance: 0.06 },
      { enemyType: 'swarm', count: 35, formation: 'random', speed: 200 },
    ],
    boss: { hp: 180, speed: 100, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },
];
