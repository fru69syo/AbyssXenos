import { STAGES, WaveData, StageData, BossData } from '../data/stages';
import { GAME_WIDTH, ENEMY } from '../config';

export interface SpawnCommand {
  enemyId: number;
  x: number;
  y: number;
  speedBase: number;
}

export class WaveManager {
  private stage: StageData;
  private waveIndex: number = 0;
  private spawnQueue: SpawnCommand[] = [];
  private spawnTimer: number = 0;
  private spawnInterval: number = 800;
  private waveComplete: boolean = false;
  private activeEnemies: number = 0;
  private isBossWave: boolean = false;
  private pendingMidBoss: BossData | null = null;
  private midBossAlive: boolean = false;

  constructor(stageIndex: number) {
    this.stage = STAGES[stageIndex % STAGES.length];
    this.prepareWave();
  }

  get currentWaveIndex(): number { return this.waveIndex; }
  get totalWaves(): number { return this.stage.waves.length; }
  get stageName(): string { return this.stage.name; }
  get isBoss(): boolean { return this.isBossWave; }
  get bossData() { return this.stage.boss; }

  get isWaveComplete(): boolean {
    return this.waveComplete
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
      this.isBossWave = true;
      this.waveComplete = false;
      this.pendingMidBoss = null;
      this.midBossAlive = false;
      return;
    }

    const wave = this.stage.waves[this.waveIndex];
    this.spawnQueue = this.generateSpawnCommands(wave);
    this.spawnTimer = 0;
    this.waveComplete = false;
    this.isBossWave = false;
    this.pendingMidBoss = wave.midBoss ?? null;
    this.midBossAlive = false;
  }

  private generateSpawnCommands(wave: WaveData): SpawnCommand[] {
    const commands: SpawnCommand[] = [];
    const margin = ENEMY.SPAWN_MARGIN;
    const usableWidth = GAME_WIDTH - margin * 2;

    for (let i = 0; i < wave.count; i++) {
      let x: number;
      switch (wave.formation) {
        case 'line':
          x = margin + (usableWidth / (wave.count + 1)) * (i + 1);
          break;
        case 'v': {
          const center = GAME_WIDTH / 2;
          const half = Math.floor(wave.count / 2);
          const offset = (i - half) * 30;
          x = center + offset;
          break;
        }
        case 'random':
        default:
          x = margin + Math.random() * usableWidth;
          break;
      }

      commands.push({
        enemyId: wave.enemyId,
        x,
        y: -30,
        speedBase: wave.speedBase,
      });
    }

    return commands;
  }

  update(delta: number): SpawnCommand | null {
    if (this.waveComplete || this.isBossWave) return null;

    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval && this.spawnQueue.length > 0) {
      this.spawnTimer = 0;
      const cmd = this.spawnQueue.shift()!;
      this.activeEnemies++;
      if (this.spawnQueue.length === 0) {
        this.waveComplete = true;
      }
      return cmd;
    }

    return null;
  }

  nextWave(): void {
    this.waveIndex++;
    this.prepareWave();
  }

  onBossDefeated(): void {
    this.isBossWave = false;
    this.waveComplete = true;
    this.activeEnemies = 0;
  }
}
