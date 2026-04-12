export interface WaveData {
  enemyId: number;            // 敵テーブルのID参照
  count: number;
  formation: 'line' | 'v' | 'random';
  speedBase: number;          // 基本速度 (敵側 speedMul と乗算)
  midBoss?: BossData;         // この波に中ボスを併発する場合
}

export interface BossData {
  hp: number;
  speed: number;
  attackPatterns: ('spread' | 'aimed' | 'spiral' | 'laser')[];
}

export interface StageData {
  id: number;
  name: string;
  waves: WaveData[];          // 4波: 通常→通常→中ボス+通常→通常
  boss: BossData;             // 最終ボス
}

export const STAGES: StageData[] = [
  // ======== ステージ1: 深海入口 ========
  {
    id: 1,
    name: '深海入口',
    waves: [
      // wave1: 通常敵
      { enemyId: 1, count: 14, formation: 'line', speedBase: 100 },
      // wave2: 通常敵
      { enemyId: 2, count: 16, formation: 'random', speedBase: 110 },
      // wave3: 中ボス + 通常敵
      {
        enemyId: 1, count: 12, formation: 'random', speedBase: 110,
        midBoss: { hp: 15, speed: 50, attackPatterns: ['aimed'] },
      },
      // wave4: 通常敵
      { enemyId: 2, count: 18, formation: 'v', speedBase: 120 },
    ],
    boss: { hp: 30, speed: 60, attackPatterns: ['spread'] },
  },

  // ======== ステージ2: 暗黒海溝 ========
  {
    id: 2,
    name: '暗黒海溝',
    waves: [
      { enemyId: 2, count: 18, formation: 'random', speedBase: 110 },
      { enemyId: 3, count: 12, formation: 'line', speedBase: 130 },
      {
        enemyId: 4, count: 20, formation: 'random', speedBase: 130,
        midBoss: { hp: 25, speed: 55, attackPatterns: ['spread', 'aimed'] },
      },
      { enemyId: 6, count: 8, formation: 'random', speedBase: 140 },
    ],
    boss: { hp: 50, speed: 70, attackPatterns: ['spread', 'aimed'] },
  },

  // ======== ステージ3: 異界の裂け目 ========
  {
    id: 3,
    name: '異界の裂け目',
    waves: [
      { enemyId: 3, count: 14, formation: 'line', speedBase: 140 },
      { enemyId: 4, count: 28, formation: 'random', speedBase: 160 },
      {
        enemyId: 2, count: 18, formation: 'v', speedBase: 130,
        midBoss: { hp: 40, speed: 60, attackPatterns: ['spread', 'spiral'] },
      },
      { enemyId: 5, count: 10, formation: 'random', speedBase: 150 },
    ],
    boss: { hp: 80, speed: 80, attackPatterns: ['spread', 'aimed', 'spiral'] },
  },

  // ======== ステージ4: ゼノスの巣窟 ========
  {
    id: 4,
    name: 'ゼノスの巣窟',
    waves: [
      { enemyId: 4, count: 32, formation: 'random', speedBase: 170 },
      { enemyId: 5, count: 12, formation: 'v', speedBase: 140 },
      {
        enemyId: 6, count: 10, formation: 'random', speedBase: 150,
        midBoss: { hp: 60, speed: 70, attackPatterns: ['aimed', 'spiral', 'spread'] },
      },
      { enemyId: 4, count: 38, formation: 'v', speedBase: 180 },
    ],
    boss: { hp: 120, speed: 90, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ5: アビス・コア ========
  {
    id: 5,
    name: 'アビス・コア',
    waves: [
      { enemyId: 5, count: 14, formation: 'line', speedBase: 150 },
      { enemyId: 4, count: 42, formation: 'random', speedBase: 190 },
      {
        enemyId: 7, count: 8, formation: 'v', speedBase: 140,
        midBoss: { hp: 90, speed: 80, attackPatterns: ['spread', 'aimed', 'spiral'] },
      },
      { enemyId: 5, count: 18, formation: 'random', speedBase: 170 },
    ],
    boss: { hp: 180, speed: 100, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },
];
