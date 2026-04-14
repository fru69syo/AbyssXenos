export interface SpawnGroup {
  enemyId: number;
  count: number;
  formation: 'line' | 'v' | 'random' | 'side' | 'burst' | 'side_enter';
  speedBase: number;
  startDelay: number;        // wave 開始からの遅延 (ms)
  spawnInterval?: number;    // 既定 500ms。burst では 100〜150ms 等に短縮
}

export interface WaveData {
  // レガシー形式: groups が無ければ単一グループとして扱う
  enemyId?: number;
  count?: number;
  formation?: 'line' | 'v' | 'random';
  speedBase?: number;
  // 新: 複数の敵タイプを時差スポーン
  groups?: SpawnGroup[];
  midBoss?: BossData;
  // 最低継続時間 (ms)。全敵撃破後もこの時間までは isWaveComplete=false を維持
  duration?: number;
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

// ヘルパー: 単純なサブグループを 1 行で宣言しやすくする
const G = (
  enemyId: number,
  count: number,
  formation: SpawnGroup['formation'],
  speedBase: number,
  startDelay: number,
  spawnInterval?: number,
): SpawnGroup => ({ enemyId, count, formation, speedBase, startDelay, spawnInterval });

export const STAGES: StageData[] = [
  // ======== ステージ1: アセリア軌道 [往路] ========
  {
    id: 1,
    name: 'アセリア軌道',
    waves: [
      {
        groups: [
          G(1, 21, 'line', 100, 0, 338),
          G(1, 12, 'random', 110, 5000, 375),
        ],
        duration: 12000,
      },
      {
        groups: [
          G(2, 18, 'random', 110, 0, 338),
          G(4, 15, 'burst', 120, 6000, 113),
          G(8, 5, 'random', 130, 8000, 450),       // seeker: 自機直進
        ],
        duration: 13000,
      },
      {
        groups: [
          G(1, 15, 'line', 110, 0, 338),
          G(2, 15, 'side', 120, 4000, 300),
          G(10, 4, 'side_enter', 120, 7000, 600),  // side_rusher: 横出現→直進
        ],
        midBoss: { hp: 26, speed: 50, attackPatterns: ['aimed'] },
        duration: 15000,
      },
      {
        groups: [
          G(2, 21, 'v', 120, 0, 338),
          G(4, 18, 'burst', 130, 7000, 105),
          G(1, 9, 'random', 130, 13000, 300),
          G(14, 3, 'random', 150, 10000, 900),     // self_destruct: 突進自爆
        ],
        duration: 18000,
      },
    ],
    boss: { hp: 49, speed: 60, attackPatterns: ['spread'] },
  },

  // ======== ステージ2: 外宇宙・零号域 [往路] ========
  {
    id: 2,
    name: '外宇宙・零号域',
    waves: [
      {
        groups: [
          G(2, 21, 'random', 110, 0, 338),
          G(3, 6, 'side', 120, 4000, 525),
          G(9, 4, 'random', 130, 8000, 700),       // orbiter: 円運動+単発
        ],
        duration: 14000,
      },
      {
        groups: [
          G(3, 15, 'line', 130, 0, 525),
          G(4, 21, 'burst', 140, 5000, 98),
          G(11, 4, 'side_enter', 130, 9000, 700),  // side_hunter: 横出現→狙い撃ち
        ],
        duration: 16000,
      },
      {
        groups: [
          G(4, 24, 'random', 130, 0, 285),
          G(2, 15, 'side', 140, 6000, 300),
          G(13, 3, 'line', 90, 10000, 1200),       // bomber: 時限爆発弾
        ],
        midBoss: { hp: 40, speed: 55, attackPatterns: ['spread', 'aimed'] },
        duration: 17000,
      },
      {
        groups: [
          G(6, 9, 'random', 140, 0, 600),
          G(4, 27, 'burst', 150, 6000, 98),
          G(3, 9, 'v', 150, 13000, 375),
          G(12, 3, 'line', 90, 9000, 1100),        // homer_drone: ホーミング弾
        ],
        duration: 20000,
      },
    ],
    boss: { hp: 77, speed: 70, attackPatterns: ['spread', 'aimed'] },
  },

  // ======== ステージ3: 深海回廊 [往路] ========
  {
    id: 3,
    name: '深海回廊',
    waves: [
      {
        groups: [
          G(3, 18, 'line', 140, 0, 488),
          G(4, 24, 'burst', 150, 7000, 98),
        ],
        duration: 17000,
      },
      {
        groups: [
          G(4, 33, 'random', 160, 0, 263),
          G(3, 12, 'side', 150, 5000, 375),
        ],
        duration: 18000,
      },
      {
        groups: [
          G(2, 21, 'v', 140, 0, 300),
          G(5, 9, 'line', 140, 5000, 600),
        ],
        midBoss: { hp: 59, speed: 60, attackPatterns: ['spread', 'spiral'] },
        duration: 20000,
      },
      {
        groups: [
          G(5, 15, 'random', 150, 0, 525),
          G(4, 30, 'burst', 170, 7000, 90),
          G(6, 9, 'side', 150, 15000, 450),
        ],
        duration: 22000,
      },
    ],
    boss: { hp: 119, speed: 80, attackPatterns: ['spread', 'aimed', 'spiral'] },
  },

  // ======== ステージ4: 暗黒海溝 [往路] ========
  {
    id: 4,
    name: '暗黒海溝',
    waves: [
      {
        groups: [
          G(4, 42, 'random', 170, 0, 225),
          G(3, 9, 'side', 160, 8000, 450),
        ],
        duration: 20000,
      },
      {
        groups: [
          G(5, 15, 'v', 140, 0, 525),
          G(4, 30, 'burst', 180, 6000, 90),
          G(2, 15, 'line', 160, 12000, 300),
        ],
        duration: 22000,
      },
      {
        groups: [
          G(6, 15, 'random', 150, 0, 450),
          G(4, 30, 'burst', 180, 7000, 98),
        ],
        midBoss: { hp: 91, speed: 70, attackPatterns: ['aimed', 'spiral', 'spread'] },
        duration: 24000,
      },
      {
        groups: [
          G(4, 48, 'v', 190, 0, 210),
          G(5, 12, 'side', 160, 9000, 413),
          G(7, 5, 'line', 140, 16000, 675),
        ],
        duration: 26000,
      },
    ],
    boss: { hp: 182, speed: 90, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ5: 異界の裂け目 [往路] ========
  {
    id: 5,
    name: '異界の裂け目',
    waves: [
      {
        groups: [
          G(5, 21, 'line', 150, 0, 450),
          G(4, 27, 'burst', 180, 6000, 90),
        ],
        duration: 22000,
      },
      {
        groups: [
          G(4, 54, 'random', 190, 0, 188),
          G(3, 15, 'side', 170, 8000, 338),
        ],
        duration: 24000,
      },
      {
        groups: [
          G(7, 9, 'v', 140, 0, 675),
          G(4, 36, 'burst', 190, 6000, 83),
          G(5, 9, 'side', 160, 14000, 450),
        ],
        midBoss: { hp: 133, speed: 80, attackPatterns: ['spread', 'aimed', 'spiral'] },
        duration: 27000,
      },
      {
        groups: [
          G(5, 27, 'random', 170, 0, 300),
          G(6, 12, 'v', 160, 8000, 450),
          G(7, 6, 'side', 140, 15000, 675),
        ],
        duration: 28000,
      },
    ],
    boss: { hp: 266, speed: 100, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ6: ゼノスの巣窟 [往路] ========
  {
    id: 6,
    name: 'ゼノスの巣窟',
    waves: [
      {
        groups: [
          G(5, 18, 'line', 160, 0, 375),
          G(4, 33, 'burst', 200, 5000, 83),
        ],
        duration: 22000,
      },
      {
        groups: [
          G(2, 27, 'random', 160, 0, 263),
          G(3, 15, 'side', 150, 6000, 338),
          G(6, 6, 'v', 160, 14000, 600),
        ],
        duration: 24000,
      },
      {
        groups: [
          G(4, 36, 'burst', 200, 0, 83),
          G(5, 15, 'line', 170, 8000, 413),
        ],
        midBoss: { hp: 154, speed: 75, attackPatterns: ['spread', 'aimed', 'spiral'] },
        duration: 26000,
      },
      {
        groups: [
          G(7, 6, 'v', 150, 0, 675),
          G(5, 24, 'random', 180, 5000, 300),
          G(4, 30, 'burst', 200, 14000, 83),
        ],
        duration: 30000,
      },
    ],
    boss: { hp: 308, speed: 100, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ7: マザー・コア [特異点/完全シンクロ] ========
  {
    id: 7,
    name: 'マザー・コア',
    waves: [
      {
        groups: [
          G(4, 45, 'random', 200, 0, 180),
          G(5, 12, 'side', 170, 7000, 375),
        ],
        duration: 24000,
      },
      {
        groups: [
          G(6, 15, 'v', 160, 0, 375),
          G(4, 39, 'burst', 210, 6000, 83),
          G(3, 12, 'line', 170, 14000, 375),
        ],
        duration: 26000,
      },
      {
        groups: [
          G(5, 21, 'random', 180, 0, 300),
          G(7, 6, 'side', 150, 8000, 675),
        ],
        midBoss: { hp: 182, speed: 80, attackPatterns: ['spread', 'aimed', 'laser'] },
        duration: 28000,
      },
      {
        groups: [
          G(2, 27, 'v', 180, 0, 263),
          G(4, 42, 'burst', 210, 7000, 75),
          G(6, 9, 'side', 170, 17000, 450),
        ],
        duration: 32000,
      },
    ],
    boss: { hp: 350, speed: 100, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ8: 認知の狭間 [復路 - フィルター直後] ========
  {
    id: 8,
    name: '認知の狭間',
    waves: [
      {
        groups: [
          G(6, 15, 'random', 170, 0, 375),
          G(4, 36, 'burst', 210, 5000, 75),
        ],
        duration: 24000,
      },
      {
        groups: [
          G(5, 21, 'side', 180, 0, 338),
          G(3, 18, 'line', 170, 6000, 338),
          G(4, 33, 'burst', 210, 14000, 75),
        ],
        duration: 28000,
      },
      {
        groups: [
          G(7, 8, 'v', 160, 0, 675),
          G(5, 18, 'random', 190, 6000, 300),
          G(4, 30, 'burst', 220, 14000, 75),
        ],
        midBoss: { hp: 210, speed: 85, attackPatterns: ['spiral', 'aimed', 'spread'] },
        duration: 30000,
      },
      {
        groups: [
          G(5, 27, 'random', 190, 0, 263),
          G(2, 33, 'v', 180, 6000, 225),
          G(7, 8, 'side', 160, 16000, 675),
        ],
        duration: 32000,
      },
    ],
    boss: { hp: 392, speed: 105, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ9: 虚構の帰還路 [復路] ========
  {
    id: 9,
    name: '虚構の帰還路',
    waves: [
      {
        groups: [
          G(4, 51, 'random', 210, 0, 165),
          G(5, 15, 'side', 180, 7000, 338),
        ],
        duration: 26000,
      },
      {
        groups: [
          G(3, 21, 'line', 180, 0, 338),
          G(6, 12, 'v', 170, 5000, 413),
          G(4, 39, 'burst', 220, 12000, 75),
        ],
        duration: 28000,
      },
      {
        groups: [
          G(5, 21, 'random', 200, 0, 285),
          G(7, 8, 'side', 160, 9000, 675),
        ],
        midBoss: { hp: 238, speed: 90, attackPatterns: ['spread', 'aimed', 'spiral'] },
        duration: 30000,
      },
      {
        groups: [
          G(7, 9, 'v', 160, 0, 600),
          G(4, 45, 'burst', 230, 6000, 75),
          G(5, 18, 'side', 190, 16000, 375),
        ],
        duration: 34000,
      },
    ],
    boss: { hp: 434, speed: 110, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ10: アセリア外縁 [復路 - 防衛艦隊を誤認] ========
  {
    id: 10,
    name: 'アセリア外縁',
    waves: [
      {
        groups: [
          G(5, 21, 'line', 190, 0, 375),
          G(4, 36, 'burst', 220, 5000, 75),
          G(3, 15, 'side', 180, 13000, 375),
        ],
        duration: 28000,
      },
      {
        groups: [
          G(2, 30, 'random', 190, 0, 240),
          G(6, 15, 'v', 170, 7000, 375),
          G(4, 36, 'burst', 230, 14000, 75),
        ],
        duration: 30000,
      },
      {
        groups: [
          G(5, 21, 'side', 190, 0, 338),
          G(7, 9, 'v', 160, 7000, 600),
        ],
        midBoss: { hp: 266, speed: 90, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
        duration: 32000,
      },
      {
        groups: [
          G(4, 51, 'random', 230, 0, 150),
          G(5, 21, 'line', 190, 7000, 338),
          G(6, 12, 'side', 180, 15000, 413),
        ],
        duration: 34000,
      },
    ],
    boss: { hp: 476, speed: 115, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ11: 鏡面次元 [復路 - 認識反転] ========
  {
    id: 11,
    name: '鏡面次元',
    waves: [
      {
        groups: [
          G(5, 24, 'line', 200, 0, 338),
          G(4, 42, 'burst', 240, 5000, 71),
          G(3, 15, 'side', 190, 14000, 338),
        ],
        duration: 30000,
      },
      {
        groups: [
          G(6, 18, 'random', 190, 0, 338),
          G(4, 45, 'burst', 240, 6000, 71),
          G(7, 6, 'v', 160, 15000, 675),
        ],
        duration: 32000,
      },
      {
        groups: [
          G(5, 24, 'random', 210, 0, 285),
          G(2, 33, 'v', 200, 7000, 225),
        ],
        midBoss: { hp: 294, speed: 95, attackPatterns: ['spread', 'spiral', 'laser'] },
        duration: 32000,
      },
      {
        groups: [
          G(7, 9, 'v', 170, 0, 600),
          G(5, 27, 'side', 200, 5000, 300),
          G(4, 48, 'burst', 240, 14000, 71),
        ],
        duration: 36000,
      },
    ],
    boss: { hp: 504, speed: 115, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ12: 殉教者の空 [復路 - 子供たちの特攻機] ========
  {
    id: 12,
    name: '殉教者の空',
    waves: [
      {
        groups: [
          G(4, 57, 'random', 240, 0, 143),
          G(5, 18, 'line', 200, 7000, 338),
          G(3, 18, 'side', 190, 16000, 338),
        ],
        duration: 32000,
      },
      {
        groups: [
          G(6, 18, 'v', 180, 0, 338),
          G(5, 21, 'random', 210, 6000, 300),
          G(4, 45, 'burst', 250, 14000, 70),
        ],
        duration: 34000,
      },
      {
        groups: [
          G(7, 9, 'v', 170, 0, 600),
          G(5, 21, 'side', 200, 6000, 338),
        ],
        midBoss: { hp: 322, speed: 95, attackPatterns: ['spread', 'aimed', 'spiral'] },
        duration: 34000,
      },
      {
        groups: [
          G(5, 30, 'random', 210, 0, 248),
          G(2, 36, 'v', 200, 7000, 210),
          G(7, 9, 'side', 170, 16000, 600),
        ],
        duration: 36000,
      },
    ],
    boss: { hp: 532, speed: 120, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ13: 防衛環 第一軌道 [復路 - 母星防衛ライン突破] ========
  {
    id: 13,
    name: '防衛環 第一軌道',
    waves: [
      {
        groups: [
          G(5, 27, 'line', 210, 0, 315),
          G(4, 48, 'burst', 250, 5000, 70),
          G(3, 18, 'side', 200, 15000, 315),
        ],
        duration: 32000,
      },
      {
        groups: [
          G(6, 21, 'random', 200, 0, 300),
          G(4, 51, 'burst', 260, 6000, 70),
          G(5, 18, 'v', 200, 15000, 375),
        ],
        duration: 34000,
      },
      {
        groups: [
          G(7, 11, 'v', 170, 0, 563),
          G(4, 42, 'burst', 260, 6000, 70),
        ],
        midBoss: { hp: 350, speed: 100, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
        duration: 36000,
      },
      {
        groups: [
          G(5, 33, 'random', 220, 0, 240),
          G(2, 39, 'v', 210, 7000, 195),
          G(7, 9, 'side', 170, 16000, 600),
          G(4, 30, 'burst', 260, 22000, 70),
        ],
        duration: 38000,
      },
    ],
    boss: { hp: 560, speed: 125, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ14: 旗艦インフェルノ [最終 - かつての恩師の総司令艦] ========
  {
    id: 14,
    name: '旗艦インフェルノ',
    waves: [
      {
        groups: [
          G(4, 60, 'random', 250, 0, 135),
          G(5, 21, 'line', 210, 7000, 315),
          G(3, 21, 'side', 200, 16000, 315),
        ],
        duration: 34000,
      },
      {
        groups: [
          G(6, 21, 'v', 180, 0, 315),
          G(5, 24, 'random', 220, 6000, 278),
          G(4, 48, 'burst', 260, 14000, 70),
        ],
        duration: 36000,
      },
      {
        groups: [
          G(7, 12, 'v', 170, 0, 563),
          G(5, 24, 'side', 210, 6000, 315),
        ],
        midBoss: { hp: 378, speed: 100, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
        duration: 36000,
      },
      {
        groups: [
          G(5, 36, 'random', 220, 0, 225),
          G(2, 42, 'v', 210, 7000, 195),
          G(7, 12, 'side', 170, 16000, 525),
          G(4, 36, 'burst', 270, 24000, 70),
        ],
        duration: 40000,
      },
    ],
    boss: { hp: 602, speed: 130, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ15: 羽化の終点 アセリア [最終 - 母星殲滅/神への羽化] ========
  {
    id: 15,
    name: '羽化の終点 アセリア',
    waves: [
      {
        groups: [
          G(5, 30, 'line', 230, 0, 300),
          G(4, 54, 'burst', 270, 5000, 70),
          G(3, 21, 'side', 210, 15000, 300),
          G(6, 15, 'v', 200, 22000, 338),
        ],
        duration: 36000,
      },
      {
        groups: [
          G(6, 24, 'random', 210, 0, 285),
          G(4, 57, 'burst', 280, 6000, 70),
          G(5, 24, 'v', 220, 15000, 338),
          G(7, 9, 'side', 180, 24000, 525),
        ],
        duration: 38000,
      },
      {
        groups: [
          G(7, 15, 'v', 180, 0, 525),
          G(5, 27, 'side', 230, 6000, 285),
          G(4, 45, 'burst', 280, 14000, 70),
        ],
        midBoss: { hp: 448, speed: 110, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
        duration: 40000,
      },
      {
        groups: [
          G(5, 39, 'random', 240, 0, 210),
          G(2, 45, 'v', 220, 6000, 180),
          G(7, 15, 'side', 180, 14000, 488),
          G(4, 42, 'burst', 280, 24000, 70),
        ],
        duration: 45000,
      },
    ],
    boss: { hp: 700, speed: 140, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },
];
