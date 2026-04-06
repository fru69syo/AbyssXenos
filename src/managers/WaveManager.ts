import { STAGES, WaveData, StageData } from '../data/stages';
import { GAME_WIDTH, ENEMY } from '../config';

export interface SpawnCommand {
  enemyType: string;
  x: number;
  y: number;
  speed: number;
  shootChance: number;
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

  constructor(stageIndex: number) {
    this.stage = STAGES[stageIndex % STAGES.length];
    this.prepareWave();
  }

  get currentWaveIndex(): number { return this.waveIndex; }
  get totalWaves(): number { return this.stage.waves.length; }
  get stageName(): string { return this.stage.name; }
  get isWaveComplete(): boolean { return this.waveComplete && this.activeEnemies <= 0; }
  get isBoss(): boolean { return this.isBossWave; }
  get bossData() { return this.stage.boss; }

  get isStageComplete(): boolean {
    return this.waveIndex >= this.stage.waves.length && this.isWaveComplete && !this.isBossWave;
  }

  onEnemyDestroyed(): void {
    this.activeEnemies = Math.max(0, this.activeEnemies - 1);
  }

  private prepareWave(): void {
    if (this.waveIndex >= this.stage.waves.length) {
      this.isBossWave = true;
      this.waveComplete = false;
      return;
    }

    const wave = this.stage.waves[this.waveIndex];
    this.spawnQueue = this.generateSpawnCommands(wave);
    this.spawnTimer = 0;
    this.waveComplete = false;
    this.isBossWave = false;
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
        enemyType: wave.enemyType,
        x,
        y: -30,
        speed: wave.speed,
        shootChance: wave.shootChance ?? 0,
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
