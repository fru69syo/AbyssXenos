import { STAGES, WaveData, StageData, BossData, SpawnGroup } from '../data/stages';
import { GAME_WIDTH, ENEMY } from '../config';

export interface SpawnCommand {
  enemyId: number;
  x: number;
  y: number;
  speedBase: number;
}

interface ActiveGroup {
  queue: SpawnCommand[];
  startDelay: number;
  interval: number;
  /** まだ startDelay を消化中かどうか */
  waiting: boolean;
  /** interval を累積するタイマー */
  timer: number;
}

export class WaveManager {
  private stage: StageData;
  private waveIndex: number = 0;
  private activeGroups: ActiveGroup[] = [];
  private waveElapsed: number = 0;
  private waveDuration: number = 0;
  private spawnedAll: boolean = false;
  private activeEnemies: number = 0;
  private isBossWave: boolean = false;
  private pendingMidBoss: BossData | null = null;
  private midBossAlive: boolean = false;

  constructor(stageIndex: number) {
    this.stage = STAGES[stageIndex % STAGES.length];
    this.prepareWave();
  }

  get currentWaveIndex(): number { return this.waveIndex; }
  /** 通常ウェーブ数 + ボスの 1 を含めた総ウェーブ数 */
  get totalWaves(): number { return this.stage.waves.length + 1; }
  get stageName(): string { return this.stage.name; }
  get isBoss(): boolean { return this.isBossWave; }
  get bossData() { return this.stage.boss; }

  get isWaveComplete(): boolean {
    // 全敵を撃破 or 画面外に逃した時点で即次ウェーブへ。duration は廃止。
    return this.spawnedAll
      && this.activeEnemies <= 0
      && !this.midBossAlive
      && !this.pendingMidBoss;
  }

  get isStageComplete(): boolean {
    return this.waveIndex >= this.stage.waves.length && this.isWaveComplete && !this.isBossWave;
  }

  onEnemyDestroyed(): void {
    this.activeEnemies = Math.max(0, this.activeEnemies - 1);
  }

  /** GameScene が中ボスを生成するタイミングで呼ぶ。null なら生成不要。 */
  consumeMidBoss(): BossData | null {
    if (!this.pendingMidBoss) return null;
    const data = this.pendingMidBoss;
    this.pendingMidBoss = null;
    this.midBossAlive = true;
    return data;
  }

  onMidBossDefeated(): void {
    this.midBossAlive = false;
  }

  private prepareWave(): void {
    if (this.waveIndex >= this.stage.waves.length) {
      // ボス波: 生成待ち状態にする
      this.isBossWave = true;
      this.spawnedAll = true;
      this.waveElapsed = 0;
      this.waveDuration = 0;
      this.activeGroups = [];
      this.activeEnemies = 0;
      this.pendingMidBoss = null;
      this.midBossAlive = false;
      return;
    }

    const wave = this.stage.waves[this.waveIndex];
    this.activeGroups = this.buildGroups(wave).map(g => ({
      queue: this.generateSpawnCommands(g),
      startDelay: g.startDelay,
      interval: g.spawnInterval ?? 500,
      waiting: g.startDelay > 0,
      timer: 0,
    }));

    this.waveElapsed = 0;
    this.waveDuration = wave.duration ?? 0;
    this.spawnedAll = this.activeGroups.every(g => g.queue.length === 0);
    this.isBossWave = false;
    this.pendingMidBoss = wave.midBoss ?? null;
    this.midBossAlive = false;
  }

  /** groups 形式 / レガシー形式 を正規化 */
  private buildGroups(wave: WaveData): SpawnGroup[] {
    if (wave.groups && wave.groups.length > 0) return wave.groups;
    // レガシー fallback
    if (wave.enemyId != null && wave.count != null && wave.formation && wave.speedBase != null) {
      return [{
        enemyId: wave.enemyId,
        count: wave.count,
        formation: wave.formation,
        speedBase: wave.speedBase,
        startDelay: 0,
        spawnInterval: 500,
      }];
    }
    return [];
  }

  private generateSpawnCommands(group: SpawnGroup): SpawnCommand[] {
    const commands: SpawnCommand[] = [];
    const margin = ENEMY.SPAWN_MARGIN;
    const usableWidth = GAME_WIDTH - margin * 2;

    for (let i = 0; i < group.count; i++) {
      let x: number;
      let y = -30;
      let clampX = true;
      switch (group.formation) {
        case 'line':
          x = margin + (usableWidth / (group.count + 1)) * (i + 1);
          break;
        case 'v': {
          const center = GAME_WIDTH / 2;
          const half = Math.floor(group.count / 2);
          const offset = (i - half) * 30;
          x = center + offset;
          break;
        }
        case 'side':
          // 左右端から交互に侵入
          x = i % 2 === 0 ? margin + 10 : GAME_WIDTH - margin - 10;
          break;
        case 'side_enter':
          // 画面外 (左右) から横方向に出現、y は上半分〜中段に散らす
          x = i % 2 === 0 ? -20 : GAME_WIDTH + 20;
          y = 150 + (i % 5) * 50;
          clampX = false;
          break;
        case 'burst':
          // 密集スポーン: ランダムだがやや中央寄り
          x = GAME_WIDTH / 2 + (Math.random() - 0.5) * usableWidth * 0.7;
          break;
        case 'random':
        default:
          x = margin + Math.random() * usableWidth;
          break;
      }
      // 画面端からはみ出ないようクランプ (side_enter を除く)
      if (clampX) {
        x = Math.max(margin, Math.min(GAME_WIDTH - margin, x));
      }

      commands.push({
        enemyId: group.enemyId,
        x,
        y,
        speedBase: group.speedBase,
      });
    }

    return commands;
  }

  /**
   * 1 フレームで生成された spawn コマンドをまとめて返す。
   * ボス波の場合は空配列 (GameScene 側で別途 bossData を見て生成)。
   */
  update(delta: number): SpawnCommand[] {
    if (this.isBossWave) return [];

    this.waveElapsed += delta;

    const out: SpawnCommand[] = [];
    for (const g of this.activeGroups) {
      if (g.queue.length === 0) continue;
      if (g.waiting) {
        g.timer += delta;
        if (g.timer >= g.startDelay) {
          g.waiting = false;
          g.timer = 0;
          // startDelay 解消直後に 1 体スポーン
          const cmd = g.queue.shift()!;
          out.push(cmd);
          this.activeEnemies++;
        }
        continue;
      }
      g.timer += delta;
      // 同フレームに複数溢れた場合に備え while
      while (g.timer >= g.interval && g.queue.length > 0) {
        g.timer -= g.interval;
        const cmd = g.queue.shift()!;
        out.push(cmd);
        this.activeEnemies++;
      }
    }

    if (!this.spawnedAll && this.activeGroups.every(g => g.queue.length === 0)) {
      this.spawnedAll = true;
    }

    return out;
  }

  nextWave(): void {
    this.waveIndex++;
    this.prepareWave();
  }

  onBossDefeated(): void {
    this.isBossWave = false;
    this.spawnedAll = true;
    this.activeEnemies = 0;
  }
}
