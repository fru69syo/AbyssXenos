export interface SpawnGroup {
  enemyId: number;
  count: number;
  formation: 'line' | 'v' | 'random' | 'side' | 'burst';
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
          G(1, 14, 'line', 100, 0, 450),
          G(1, 8, 'random', 110, 5000, 500),
        ],
        duration: 12000,
      },
      {
        groups: [
          G(2, 12, 'random', 110, 0, 450),
          G(4, 10, 'burst', 120, 6000, 150),
        ],
        duration: 13000,
      },
      {
        groups: [
          G(1, 10, 'line', 110, 0, 450),
          G(2, 10, 'side', 120, 4000, 400),
        ],
        midBoss: { hp: 18, speed: 50, attackPatterns: ['aimed'] },
        duration: 15000,
      },
      {
        groups: [
          G(2, 14, 'v', 120, 0, 450),
          G(4, 12, 'burst', 130, 7000, 140),
          G(1, 6, 'random', 130, 13000, 400),
        ],
        duration: 18000,
      },
    ],
    boss: { hp: 35, speed: 60, attackPatterns: ['spread'] },
  },

  // ======== ステージ2: 外宇宙・零号域 [往路] ========
  {
    id: 2,
    name: '外宇宙・零号域',
    waves: [
      {
        groups: [
          G(2, 14, 'random', 110, 0, 450),
          G(3, 4, 'side', 120, 4000, 700),
        ],
        duration: 14000,
      },
      {
        groups: [
          G(3, 10, 'line', 130, 0, 700),
          G(4, 14, 'burst', 140, 5000, 130),
        ],
        duration: 16000,
      },
      {
        groups: [
          G(4, 16, 'random', 130, 0, 380),
          G(2, 10, 'side', 140, 6000, 400),
        ],
        midBoss: { hp: 28, speed: 55, attackPatterns: ['spread', 'aimed'] },
        duration: 17000,
      },
      {
        groups: [
          G(6, 6, 'random', 140, 0, 800),
          G(4, 18, 'burst', 150, 6000, 130),
          G(3, 6, 'v', 150, 13000, 500),
        ],
        duration: 20000,
      },
    ],
    boss: { hp: 55, speed: 70, attackPatterns: ['spread', 'aimed'] },
  },

  // ======== ステージ3: 深海回廊 [往路] ========
  {
    id: 3,
    name: '深海回廊',
    waves: [
      {
        groups: [
          G(3, 12, 'line', 140, 0, 650),
          G(4, 16, 'burst', 150, 7000, 130),
        ],
        duration: 17000,
      },
      {
        groups: [
          G(4, 22, 'random', 160, 0, 350),
          G(3, 8, 'side', 150, 5000, 500),
        ],
        duration: 18000,
      },
      {
        groups: [
          G(2, 14, 'v', 140, 0, 400),
          G(5, 6, 'line', 140, 5000, 800),
        ],
        midBoss: { hp: 42, speed: 60, attackPatterns: ['spread', 'spiral'] },
        duration: 20000,
      },
      {
        groups: [
          G(5, 10, 'random', 150, 0, 700),
          G(4, 20, 'burst', 170, 7000, 120),
          G(6, 6, 'side', 150, 15000, 600),
        ],
        duration: 22000,
      },
    ],
    boss: { hp: 85, speed: 80, attackPatterns: ['spread', 'aimed', 'spiral'] },
  },

  // ======== ステージ4: 暗黒海溝 [往路] ========
  {
    id: 4,
    name: '暗黒海溝',
    waves: [
      {
        groups: [
          G(4, 28, 'random', 170, 0, 300),
          G(3, 6, 'side', 160, 8000, 600),
        ],
        duration: 20000,
      },
      {
        groups: [
          G(5, 10, 'v', 140, 0, 700),
          G(4, 20, 'burst', 180, 6000, 120),
          G(2, 10, 'line', 160, 12000, 400),
        ],
        duration: 22000,
      },
      {
        groups: [
          G(6, 10, 'random', 150, 0, 600),
          G(4, 20, 'burst', 180, 7000, 130),
        ],
        midBoss: { hp: 65, speed: 70, attackPatterns: ['aimed', 'spiral', 'spread'] },
        duration: 24000,
      },
      {
        groups: [
          G(4, 32, 'v', 190, 0, 280),
          G(5, 8, 'side', 160, 9000, 550),
          G(7, 3, 'line', 140, 16000, 900),
        ],
        duration: 26000,
      },
    ],
    boss: { hp: 130, speed: 90, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ5: 異界の裂け目 [往路] ========
  {
    id: 5,
    name: '異界の裂け目',
    waves: [
      {
        groups: [
          G(5, 14, 'line', 150, 0, 600),
          G(4, 18, 'burst', 180, 6000, 120),
        ],
        duration: 22000,
      },
      {
        groups: [
          G(4, 36, 'random', 190, 0, 250),
          G(3, 10, 'side', 170, 8000, 450),
        ],
        duration: 24000,
      },
      {
        groups: [
          G(7, 6, 'v', 140, 0, 900),
          G(4, 24, 'burst', 190, 6000, 110),
          G(5, 6, 'side', 160, 14000, 600),
        ],
        midBoss: { hp: 95, speed: 80, attackPatterns: ['spread', 'aimed', 'spiral'] },
        duration: 27000,
      },
      {
        groups: [
          G(5, 18, 'random', 170, 0, 400),
          G(6, 8, 'v', 160, 8000, 600),
          G(7, 4, 'side', 140, 15000, 900),
        ],
        duration: 28000,
      },
    ],
    boss: { hp: 190, speed: 100, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ6: ゼノスの巣窟 [往路] ========
  {
    id: 6,
    name: 'ゼノスの巣窟',
    waves: [
      {
        groups: [
          G(5, 12, 'line', 160, 0, 500),
          G(4, 22, 'burst', 200, 5000, 110),
        ],
        duration: 22000,
      },
      {
        groups: [
          G(2, 18, 'random', 160, 0, 350),
          G(3, 10, 'side', 150, 6000, 450),
          G(6, 4, 'v', 160, 14000, 800),
        ],
        duration: 24000,
      },
      {
        groups: [
          G(4, 24, 'burst', 200, 0, 110),
          G(5, 10, 'line', 170, 8000, 550),
        ],
        midBoss: { hp: 110, speed: 75, attackPatterns: ['spread', 'aimed', 'spiral'] },
        duration: 26000,
      },
      {
        groups: [
          G(7, 4, 'v', 150, 0, 900),
          G(5, 16, 'random', 180, 5000, 400),
          G(4, 20, 'burst', 200, 14000, 110),
        ],
        duration: 30000,
      },
    ],
    boss: { hp: 220, speed: 100, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ7: マザー・コア [特異点/完全シンクロ] ========
  {
    id: 7,
    name: 'マザー・コア',
    waves: [
      {
        groups: [
          G(4, 30, 'random', 200, 0, 240),
          G(5, 8, 'side', 170, 7000, 500),
        ],
        duration: 24000,
      },
      {
        groups: [
          G(6, 10, 'v', 160, 0, 500),
          G(4, 26, 'burst', 210, 6000, 110),
          G(3, 8, 'line', 170, 14000, 500),
        ],
        duration: 26000,
      },
      {
        groups: [
          G(5, 14, 'random', 180, 0, 400),
          G(7, 4, 'side', 150, 8000, 900),
        ],
        midBoss: { hp: 130, speed: 80, attackPatterns: ['spread', 'aimed', 'laser'] },
        duration: 28000,
      },
      {
        groups: [
          G(2, 18, 'v', 180, 0, 350),
          G(4, 28, 'burst', 210, 7000, 100),
          G(6, 6, 'side', 170, 17000, 600),
        ],
        duration: 32000,
      },
    ],
    boss: { hp: 250, speed: 100, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ8: 認知の狭間 [復路 - フィルター直後] ========
  {
    id: 8,
    name: '認知の狭間',
    waves: [
      {
        groups: [
          G(6, 10, 'random', 170, 0, 500),
          G(4, 24, 'burst', 210, 5000, 100),
        ],
        duration: 24000,
      },
      {
        groups: [
          G(5, 14, 'side', 180, 0, 450),
          G(3, 12, 'line', 170, 6000, 450),
          G(4, 22, 'burst', 210, 14000, 100),
        ],
        duration: 28000,
      },
      {
        groups: [
          G(7, 5, 'v', 160, 0, 900),
          G(5, 12, 'random', 190, 6000, 400),
          G(4, 20, 'burst', 220, 14000, 100),
        ],
        midBoss: { hp: 150, speed: 85, attackPatterns: ['spiral', 'aimed', 'spread'] },
        duration: 30000,
      },
      {
        groups: [
          G(5, 18, 'random', 190, 0, 350),
          G(2, 22, 'v', 180, 6000, 300),
          G(7, 5, 'side', 160, 16000, 900),
        ],
        duration: 32000,
      },
    ],
    boss: { hp: 280, speed: 105, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ9: 虚構の帰還路 [復路] ========
  {
    id: 9,
    name: '虚構の帰還路',
    waves: [
      {
        groups: [
          G(4, 34, 'random', 210, 0, 220),
          G(5, 10, 'side', 180, 7000, 450),
        ],
        duration: 26000,
      },
      {
        groups: [
          G(3, 14, 'line', 180, 0, 450),
          G(6, 8, 'v', 170, 5000, 550),
          G(4, 26, 'burst', 220, 12000, 100),
        ],
        duration: 28000,
      },
      {
        groups: [
          G(5, 14, 'random', 200, 0, 380),
          G(7, 5, 'side', 160, 9000, 900),
        ],
        midBoss: { hp: 170, speed: 90, attackPatterns: ['spread', 'aimed', 'spiral'] },
        duration: 30000,
      },
      {
        groups: [
          G(7, 6, 'v', 160, 0, 800),
          G(4, 30, 'burst', 230, 6000, 100),
          G(5, 12, 'side', 190, 16000, 500),
        ],
        duration: 34000,
      },
    ],
    boss: { hp: 310, speed: 110, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ10: アセリア外縁 [復路 - 防衛艦隊を誤認] ========
  {
    id: 10,
    name: 'アセリア外縁',
    waves: [
      {
        groups: [
          G(5, 14, 'line', 190, 0, 500),
          G(4, 24, 'burst', 220, 5000, 100),
          G(3, 10, 'side', 180, 13000, 500),
        ],
        duration: 28000,
      },
      {
        groups: [
          G(2, 20, 'random', 190, 0, 320),
          G(6, 10, 'v', 170, 7000, 500),
          G(4, 24, 'burst', 230, 14000, 100),
        ],
        duration: 30000,
      },
      {
        groups: [
          G(5, 14, 'side', 190, 0, 450),
          G(7, 6, 'v', 160, 7000, 800),
        ],
        midBoss: { hp: 190, speed: 90, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
        duration: 32000,
      },
      {
        groups: [
          G(4, 34, 'random', 230, 0, 200),
          G(5, 14, 'line', 190, 7000, 450),
          G(6, 8, 'side', 180, 15000, 550),
        ],
        duration: 34000,
      },
    ],
    boss: { hp: 340, speed: 115, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ11: 鏡面次元 [復路 - 認識反転] ========
  {
    id: 11,
    name: '鏡面次元',
    waves: [
      {
        groups: [
          G(5, 16, 'line', 200, 0, 450),
          G(4, 28, 'burst', 240, 5000, 95),
          G(3, 10, 'side', 190, 14000, 450),
        ],
        duration: 30000,
      },
      {
        groups: [
          G(6, 12, 'random', 190, 0, 450),
          G(4, 30, 'burst', 240, 6000, 95),
          G(7, 4, 'v', 160, 15000, 900),
        ],
        duration: 32000,
      },
      {
        groups: [
          G(5, 16, 'random', 210, 0, 380),
          G(2, 22, 'v', 200, 7000, 300),
        ],
        midBoss: { hp: 210, speed: 95, attackPatterns: ['spread', 'spiral', 'laser'] },
        duration: 32000,
      },
      {
        groups: [
          G(7, 6, 'v', 170, 0, 800),
          G(5, 18, 'side', 200, 5000, 400),
          G(4, 32, 'burst', 240, 14000, 95),
        ],
        duration: 36000,
      },
    ],
    boss: { hp: 360, speed: 115, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ12: 殉教者の空 [復路 - 子供たちの特攻機] ========
  {
    id: 12,
    name: '殉教者の空',
    waves: [
      {
        groups: [
          G(4, 38, 'random', 240, 0, 190),
          G(5, 12, 'line', 200, 7000, 450),
          G(3, 12, 'side', 190, 16000, 450),
        ],
        duration: 32000,
      },
      {
        groups: [
          G(6, 12, 'v', 180, 0, 450),
          G(5, 14, 'random', 210, 6000, 400),
          G(4, 30, 'burst', 250, 14000, 90),
        ],
        duration: 34000,
      },
      {
        groups: [
          G(7, 6, 'v', 170, 0, 800),
          G(5, 14, 'side', 200, 6000, 450),
        ],
        midBoss: { hp: 230, speed: 95, attackPatterns: ['spread', 'aimed', 'spiral'] },
        duration: 34000,
      },
      {
        groups: [
          G(5, 20, 'random', 210, 0, 330),
          G(2, 24, 'v', 200, 7000, 280),
          G(7, 6, 'side', 170, 16000, 800),
        ],
        duration: 36000,
      },
    ],
    boss: { hp: 380, speed: 120, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ13: 防衛環 第一軌道 [復路 - 母星防衛ライン突破] ========
  {
    id: 13,
    name: '防衛環 第一軌道',
    waves: [
      {
        groups: [
          G(5, 18, 'line', 210, 0, 420),
          G(4, 32, 'burst', 250, 5000, 90),
          G(3, 12, 'side', 200, 15000, 420),
        ],
        duration: 32000,
      },
      {
        groups: [
          G(6, 14, 'random', 200, 0, 400),
          G(4, 34, 'burst', 260, 6000, 90),
          G(5, 12, 'v', 200, 15000, 500),
        ],
        duration: 34000,
      },
      {
        groups: [
          G(7, 7, 'v', 170, 0, 750),
          G(4, 28, 'burst', 260, 6000, 90),
        ],
        midBoss: { hp: 250, speed: 100, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
        duration: 36000,
      },
      {
        groups: [
          G(5, 22, 'random', 220, 0, 320),
          G(2, 26, 'v', 210, 7000, 260),
          G(7, 6, 'side', 170, 16000, 800),
          G(4, 20, 'burst', 260, 22000, 90),
        ],
        duration: 38000,
      },
    ],
    boss: { hp: 400, speed: 125, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ14: 旗艦インフェルノ [最終 - かつての恩師の総司令艦] ========
  {
    id: 14,
    name: '旗艦インフェルノ',
    waves: [
      {
        groups: [
          G(4, 40, 'random', 250, 0, 180),
          G(5, 14, 'line', 210, 7000, 420),
          G(3, 14, 'side', 200, 16000, 420),
        ],
        duration: 34000,
      },
      {
        groups: [
          G(6, 14, 'v', 180, 0, 420),
          G(5, 16, 'random', 220, 6000, 370),
          G(4, 32, 'burst', 260, 14000, 85),
        ],
        duration: 36000,
      },
      {
        groups: [
          G(7, 8, 'v', 170, 0, 750),
          G(5, 16, 'side', 210, 6000, 420),
        ],
        midBoss: { hp: 270, speed: 100, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
        duration: 36000,
      },
      {
        groups: [
          G(5, 24, 'random', 220, 0, 300),
          G(2, 28, 'v', 210, 7000, 260),
          G(7, 8, 'side', 170, 16000, 700),
          G(4, 24, 'burst', 270, 24000, 85),
        ],
        duration: 40000,
      },
    ],
    boss: { hp: 430, speed: 130, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },

  // ======== ステージ15: 羽化の終点 アセリア [最終 - 母星殲滅/神への羽化] ========
  {
    id: 15,
    name: '羽化の終点 アセリア',
    waves: [
      {
        groups: [
          G(5, 20, 'line', 230, 0, 400),
          G(4, 36, 'burst', 270, 5000, 80),
          G(3, 14, 'side', 210, 15000, 400),
          G(6, 10, 'v', 200, 22000, 450),
        ],
        duration: 36000,
      },
      {
        groups: [
          G(6, 16, 'random', 210, 0, 380),
          G(4, 38, 'burst', 280, 6000, 80),
          G(5, 16, 'v', 220, 15000, 450),
          G(7, 6, 'side', 180, 24000, 700),
        ],
        duration: 38000,
      },
      {
        groups: [
          G(7, 10, 'v', 180, 0, 700),
          G(5, 18, 'side', 230, 6000, 380),
          G(4, 30, 'burst', 280, 14000, 80),
        ],
        midBoss: { hp: 320, speed: 110, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
        duration: 40000,
      },
      {
        groups: [
          G(5, 26, 'random', 240, 0, 280),
          G(2, 30, 'v', 220, 6000, 240),
          G(7, 10, 'side', 180, 14000, 650),
          G(4, 28, 'burst', 280, 24000, 80),
        ],
        duration: 45000,
      },
    ],
    boss: { hp: 500, speed: 140, attackPatterns: ['spread', 'aimed', 'spiral', 'laser'] },
  },
];
