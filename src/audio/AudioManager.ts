/**
 * AudioManager
 *
 * Web Audio API で手続き的に SE / BGM を生成する。音声ファイルを持たないため
 * ロードが軽く、レトロシューターの雰囲気に合う。
 *
 * iOS Safari / mobile の autoplay 制約に対応するため、初回ユーザー操作で
 * unlock() を呼び AudioContext を resume する必要がある。
 */

import { loadData, saveData } from '../utils/storage';

type BgmTrack = 'none' | 'lobby' | 'battle' | 'boss';

interface AudioSettings {
  muteSE: boolean;
  muteBGM: boolean;
}

const SETTINGS_KEY = 'audioSettings';

export class AudioManager {
  private static _instance: AudioManager | null = null;
  static get(): AudioManager {
    if (!this._instance) this._instance = new AudioManager();
    return this._instance;
  }

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private seGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;

  // BGM 状態
  private currentBgm: BgmTrack = 'none';
  private bgmTimer: number | null = null;
  private bgmStep: number = 0;

  // 設定
  muteSE: boolean = false;
  muteBGM: boolean = false;

  private constructor() {
    const s = loadData<AudioSettings>(SETTINGS_KEY);
    if (s) {
      this.muteSE = !!s.muteSE;
      this.muteBGM = !!s.muteBGM;
    }
  }

  private saveSettings(): void {
    saveData<AudioSettings>(SETTINGS_KEY, { muteSE: this.muteSE, muteBGM: this.muteBGM });
  }

  /** ユーザー操作 (pointerdown / keydown) 直後に呼ぶ。AudioContext 作成 + resume */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      // 既に再生要求されているが timer 起動前なら開始
      if (this.currentBgm !== 'none' && this.bgmTimer == null && !this.muteBGM) {
        const t = this.currentBgm;
        this.currentBgm = 'none';
        this.playBGM(t);
      }
      return;
    }
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      const ctx: AudioContext = new AC();
      this.ctx = ctx;
      const master = ctx.createGain();
      master.gain.value = 0.7;
      master.connect(ctx.destination);
      this.masterGain = master;

      const se = ctx.createGain();
      se.gain.value = 0.45;
      se.connect(master);
      this.seGain = se;

      const bgm = ctx.createGain();
      bgm.gain.value = 0.25;
      bgm.connect(master);
      this.bgmGain = bgm;

      // unlock 前に playBGM が呼ばれていたら再試行
      if (this.currentBgm !== 'none' && !this.muteBGM) {
        const t = this.currentBgm;
        this.currentBgm = 'none';
        this.playBGM(t);
      }
    } catch {
      this.ctx = null;
    }
  }

  setMuteSE(muted: boolean): void {
    this.muteSE = muted;
    this.saveSettings();
  }

  setMuteBGM(muted: boolean): void {
    this.muteBGM = muted;
    this.saveSettings();
    if (muted) {
      this.stopBGM();
    } else if (this.currentBgm !== 'none') {
      // 記録された track を実際に再生開始 (同一ガードを回避)
      const t = this.currentBgm;
      this.currentBgm = 'none';
      this.playBGM(t);
    }
  }

  // ========== SE ==========

  private now(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  private seTone(freqStart: number, freqEnd: number, type: OscillatorType, duration: number, vol: number = 1): void {
    if (this.muteSE || !this.ctx || !this.seGain) return;
    const t = this.now();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), t + duration);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(g);
    g.connect(this.seGain);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  private seNoise(duration: number, filterFreq: number, vol: number = 1): void {
    if (this.muteSE || !this.ctx || !this.seGain) return;
    const t = this.now();
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = filterFreq;
    bp.Q.value = 1.2;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.seGain);
    src.start(t);
    src.stop(t + duration + 0.02);
  }

  // 連射時に SE が過密にならないよう最小間隔ガード
  private lastShootTime: number = 0;
  playShoot(): void {
    const now = this.now();
    if (now - this.lastShootTime < 0.04) return;
    this.lastShootTime = now;
    this.seTone(880, 220, 'triangle', 0.08, 0.25);
  }

  playHit(): void {
    this.seNoise(0.06, 1600, 0.25);
  }

  playExplode(): void {
    this.seNoise(0.25, 350, 0.6);
    this.seTone(220, 60, 'sawtooth', 0.2, 0.3);
  }

  playCoin(): void {
    this.seTone(1200, 1600, 'square', 0.05, 0.3);
    this.schedule(0.06, () => this.seTone(1800, 2200, 'square', 0.08, 0.3));
  }

  playPowerUp(): void {
    this.seTone(440, 880, 'square', 0.15, 0.35);
    this.schedule(0.15, () => this.seTone(880, 1320, 'square', 0.15, 0.35));
  }

  playDamage(): void {
    this.seTone(260, 90, 'sawtooth', 0.25, 0.5);
    this.seNoise(0.1, 200, 0.3);
  }

  playLevelUp(): void {
    // C E G C 上昇
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => this.schedule(i * 0.08, () => this.seTone(f, f, 'square', 0.15, 0.35)));
  }

  playBossWarn(): void {
    for (let i = 0; i < 4; i++) {
      this.schedule(i * 0.18, () => this.seTone(420, 420, 'square', 0.12, 0.4));
      this.schedule(i * 0.18 + 0.09, () => this.seTone(560, 560, 'square', 0.08, 0.3));
    }
  }

  playWaveClear(): void {
    const notes = [523, 659, 784];
    notes.forEach((f, i) => this.schedule(i * 0.1, () => this.seTone(f, f, 'triangle', 0.15, 0.35)));
  }

  playStageClear(): void {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => this.schedule(i * 0.12, () => this.seTone(f, f, 'square', 0.22, 0.4)));
  }

  playGameOver(): void {
    const notes = [440, 392, 349, 262];
    notes.forEach((f, i) => this.schedule(i * 0.25, () => this.seTone(f, f * 0.9, 'sawtooth', 0.4, 0.4)));
  }

  playSkillPick(): void {
    this.seTone(660, 990, 'triangle', 0.15, 0.3);
  }

  private schedule(delaySec: number, fn: () => void): void {
    window.setTimeout(fn, delaySec * 1000);
  }

  // ========== BGM ==========

  /** 指定トラックが未再生なら開始。同じトラックなら何もしない */
  playBGM(track: BgmTrack): void {
    if (track === this.currentBgm) return;
    this.stopBGM();
    if (track === 'none' || this.muteBGM) {
      this.currentBgm = track;
      return;
    }
    if (!this.ctx) {
      // まだアンロックされていない — 記録だけして後で unlock 時に再トリガ可能に
      this.currentBgm = track;
      return;
    }
    this.currentBgm = track;
    this.bgmStep = 0;
    const stepMs = this.getStepMs(track);
    this.bgmTimer = window.setInterval(() => this.bgmTick(), stepMs);
    // 最初の1打を即時にも鳴らす
    this.bgmTick();
  }

  stopBGM(): void {
    if (this.bgmTimer != null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.currentBgm = 'none';
  }

  private getStepMs(track: BgmTrack): number {
    switch (track) {
      case 'lobby': return 320;
      case 'battle': return 200;
      case 'boss': return 170;
      default: return 300;
    }
  }

  /**
   * 1 Step ごとに音を鳴らすシーケンサ。
   * パターンは配列化しておき step を mod する。0 は休符。
   */
  private bgmTick(): void {
    if (this.muteBGM || !this.ctx || !this.bgmGain) return;

    const patterns: Record<BgmTrack, { bass: number[]; lead: number[] }> = {
      lobby: {
        // ゆったり長調 (C major)
        bass: [130, 0, 0, 0, 196, 0, 0, 0, 147, 0, 0, 0, 175, 0, 0, 0],
        lead: [523, 0, 659, 0, 784, 0, 659, 0, 587, 0, 659, 0, 784, 0, 1047, 0],
      },
      battle: {
        // 駆動する短調 (A minor)
        bass: [110, 0, 110, 0, 110, 0, 146, 0, 98, 0, 98, 0, 110, 0, 146, 164],
        lead: [440, 0, 523, 659, 0, 523, 440, 0, 392, 0, 440, 523, 0, 440, 392, 0],
      },
      boss: {
        // 緊迫した短調 (D minor) 高速
        bass: [73, 0, 73, 0, 73, 73, 98, 0, 87, 0, 87, 87, 73, 0, 98, 110],
        lead: [587, 0, 698, 0, 587, 0, 440, 0, 523, 0, 587, 698, 587, 440, 392, 0],
      },
      none: { bass: [], lead: [] },
    };

    const pat = patterns[this.currentBgm];
    if (!pat || pat.bass.length === 0) return;

    const idx = this.bgmStep % pat.bass.length;
    const bassFreq = pat.bass[idx];
    const leadFreq = pat.lead[idx];

    if (bassFreq > 0) this.bgmNote(bassFreq, 'triangle', 0.22, 0.35);
    if (leadFreq > 0) this.bgmNote(leadFreq, 'square', 0.18, 0.16);

    this.bgmStep++;
  }

  private bgmNote(freq: number, type: OscillatorType, duration: number, vol: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const t = this.now();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(g);
    g.connect(this.bgmGain);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }
}
