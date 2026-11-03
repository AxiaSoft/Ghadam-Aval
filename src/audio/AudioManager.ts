import { GameStage, MusicTrackId, SfxId } from '../types/game';
import { MUSIC_TRACK_FILES, SFX_AUDIO_FILES, STAGE_MUSIC_MAP } from './musicTracks';

type AmbienceLoopId = 'none' | 'classroom' | 'lobby';

interface ActiveTrackState {
  id: MusicTrackId;
  gainNode: GainNode;
  timerIds: number[];
  oscillators: OscillatorNode[];
  sources: AudioBufferSourceNode[];
  stopped: boolean;
}

interface ActiveAmbienceState {
  id: Exclude<AmbienceLoopId, 'none'>;
  gainNode: GainNode;
  source: AudioBufferSourceNode | null;
  stopped: boolean;
}

class AudioManagerImpl {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private proceduralMusicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private bufferCache = new Map<Exclude<MusicTrackId, 'none'>, AudioBuffer>();
  private loadingPromises = new Map<Exclude<MusicTrackId, 'none'>, Promise<AudioBuffer | null>>();

  private urlBufferCache = new Map<string, AudioBuffer>();
  private urlLoadingPromises = new Map<string, Promise<AudioBuffer | null>>();
  private footstepBuffers: AudioBuffer[] = [];
  private lastFootstepIndex = -1;

  private backgroundPreloadStarted = false;

  private currentTrack: ActiveTrackState | null = null;
  private desiredTrackId: MusicTrackId = 'intro_cold';

  private currentAmbience: ActiveAmbienceState | null = null;
  private desiredAmbienceId: AmbienceLoopId = 'none';
  private desiredAmbienceLevel = 0.5;

  private musicVolume = 0.65;
  private sfxVolume = 0.75;
  private isMuted = false;
  private unlocked = false;

  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.musicBus = this.ctx.createGain();
      this.proceduralMusicBus = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();

      this.reverbNode = this.createReverbImpulse(2.4, 2.5);
      this.noiseBuffer = this.createPinkNoiseBuffer(3.0);

      const reverbWet = this.ctx.createGain();
      reverbWet.gain.value = 0.32;

      this.musicBus.connect(this.masterGain);

      this.proceduralMusicBus.connect(this.musicBus);
      this.proceduralMusicBus.connect(this.reverbNode);
      this.reverbNode.connect(reverbWet);
      reverbWet.connect(this.musicBus);

      this.sfxBus.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.applyVolumes();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (!this.unlocked) {
      this.unlocked = true;
      void this.preloadSfxBuffers();
      if (this.desiredTrackId !== 'none') {
        this.playMusic(this.desiredTrackId);
      }
      if (this.desiredAmbienceId !== 'none') {
        this.playAmbienceLoop(this.desiredAmbienceId, this.desiredAmbienceLevel);
      }
      this.preloadAllTracksInBackground();
    }
  }

  public setVolumes(musicVol: number, sfxVol: number, muted: boolean): void {
    this.musicVolume = Math.max(0, Math.min(1, musicVol));
    this.sfxVolume = Math.max(0, Math.min(1, sfxVol));
    this.isMuted = muted;
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.masterGain || !this.musicBus || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.92, now, 0.08);
    this.musicBus.gain.setTargetAtTime(this.musicVolume * 0.82, now, 0.12);
    this.sfxBus.gain.setTargetAtTime(this.sfxVolume * 0.88, now, 0.08);
  }

  public syncStageMusic(stage: GameStage): void {
    const nextTrack = STAGE_MUSIC_MAP[stage] ?? 'intro_cold';
    this.playMusic(nextTrack);
    this.syncStageAmbience(stage);
  }

  /**
   * Automatically manages continuous background crowd murmur (همهمه کلاس و لابی)
   */
  private syncStageAmbience(stage: GameStage): void {
    if (
      stage === 'CLASSROOM_ENTRY' ||
      stage === 'CLASSROOM_GAMEPLAY' ||
      stage === 'CLASSROOM_CINEMATIC'
    ) {
      const lvl = stage === 'CLASSROOM_CINEMATIC' ? 0.36 : 0.48;
      this.playAmbienceLoop('classroom', lvl);
      return;
    }

    if (
      stage === 'LOBBY_ENTRY' ||
      stage === 'LOBBY_CINEMATIC' ||
      stage === 'FINAL_DECISION' ||
      stage === 'DIALOGUE'
    ) {
      // Slightly gentler murmur during close-up conversation so dialogue stays intimate
      const lvl = stage === 'DIALOGUE' ? 0.34 : 0.58;
      this.playAmbienceLoop('lobby', lvl);
      return;
    }

    this.playAmbienceLoop('none', 0);
  }

  private async loadUrlBuffer(url: string): Promise<AudioBuffer | null> {
    if (!this.ctx) return null;
    const cached = this.urlBufferCache.get(url);
    if (cached) return cached;

    const inflight = this.urlLoadingPromises.get(url);
    if (inflight) return inflight;

    const p = (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ab = await res.arrayBuffer();
        if (!this.ctx) return null;
        const decoded = await this.ctx.decodeAudioData(ab.slice(0));
        this.urlBufferCache.set(url, decoded);
        return decoded;
      } catch (err) {
        console.warn('[AudioManager] Could not decode SFX file:', url, err);
        return null;
      } finally {
        this.urlLoadingPromises.delete(url);
      }
    })();

    this.urlLoadingPromises.set(url, p);
    return p;
  }

  private async preloadSfxBuffers(): Promise<void> {
    const loadedSteps = await Promise.all(
      SFX_AUDIO_FILES.footsteps.map((u) => this.loadUrlBuffer(u))
    );
    this.footstepBuffers = loadedSteps.filter((b): b is AudioBuffer => b !== null);
    await Promise.all([
      this.loadUrlBuffer(SFX_AUDIO_FILES.lobbyMurmur),
      this.loadUrlBuffer(SFX_AUDIO_FILES.classroomMurmur),
    ]);
  }

  private playAmbienceLoop(ambienceId: AmbienceLoopId, level: number): void {
    this.desiredAmbienceId = ambienceId;
    this.desiredAmbienceLevel = level;
    if (!this.unlocked || !this.ctx || !this.sfxBus) return;

    if (
      ambienceId !== 'none' &&
      this.currentAmbience &&
      this.currentAmbience.id === ambienceId &&
      !this.currentAmbience.stopped
    ) {
      // Smoothly adjust murmur loudness (e.g. ducking softly when entering DIALOGUE)
      this.currentAmbience.gainNode.gain.setTargetAtTime(level, this.ctx.currentTime, 0.45);
      return;
    }

    if (this.currentAmbience) {
      this.fadeOutAmbience(this.currentAmbience, 1.2);
      this.currentAmbience = null;
    }

    if (ambienceId === 'none') return;

    const url =
      ambienceId === 'lobby' ? SFX_AUDIO_FILES.lobbyMurmur : SFX_AUDIO_FILES.classroomMurmur;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gainNode.connect(this.sfxBus);

    const state: ActiveAmbienceState = {
      id: ambienceId,
      gainNode,
      source: null,
      stopped: false,
    };
    this.currentAmbience = state;

    void this.loadUrlBuffer(url).then((buf) => {
      if (state.stopped || !this.ctx || !buf) return;
      const now = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(gainNode);
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(level, now + 1.4);
      src.start(now);
      state.source = src;
    });
  }

  private fadeOutAmbience(amb: ActiveAmbienceState, fadeSeconds: number): void {
    amb.stopped = true;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      amb.gainNode.gain.cancelScheduledValues(now);
      amb.gainNode.gain.setValueAtTime(Math.max(0.0001, amb.gainNode.gain.value), now);
      amb.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + fadeSeconds);
    } catch {
      // ignore
    }
    window.setTimeout(() => {
      try {
        amb.source?.stop();
        amb.source?.disconnect();
        amb.gainNode.disconnect();
      } catch {
        // ignore
      }
    }, fadeSeconds * 1000 + 180);
  }

  private async loadTrackBuffer(
    trackId: Exclude<MusicTrackId, 'none'>
  ): Promise<AudioBuffer | null> {
    if (!this.ctx) return null;
    const cached = this.bufferCache.get(trackId);
    if (cached) return cached;

    const inflight = this.loadingPromises.get(trackId);
    if (inflight) return inflight;

    const cfg = MUSIC_TRACK_FILES[trackId];
    if (!cfg?.url) return null;

    const promise = (async () => {
      try {
        const res = await fetch(cfg.url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} for ${cfg.url}`);
        }
        const arrayBuf = await res.arrayBuffer();
        if (!this.ctx) return null;
        const decoded = await this.ctx.decodeAudioData(arrayBuf.slice(0));
        this.bufferCache.set(trackId, decoded);
        return decoded;
      } catch (err) {
        console.warn(
          `[AudioManager] Could not load audio file for '${trackId}', using procedural fallback:`,
          err
        );
        return null;
      } finally {
        this.loadingPromises.delete(trackId);
      }
    })();

    this.loadingPromises.set(trackId, promise);
    return promise;
  }

  private preloadAllTracksInBackground(): void {
    if (this.backgroundPreloadStarted) return;
    this.backgroundPreloadStarted = true;

    const allIds = Object.keys(MUSIC_TRACK_FILES) as Exclude<MusicTrackId, 'none'>[];
    window.setTimeout(async () => {
      for (const id of allIds) {
        await this.loadTrackBuffer(id);
      }
    }, 600);
  }

  public playMusic(trackId: MusicTrackId): void {
    this.desiredTrackId = trackId;
    if (!this.unlocked || !this.ctx || !this.musicBus || !this.proceduralMusicBus) return;
    if (this.currentTrack && this.currentTrack.id === trackId && !this.currentTrack.stopped) {
      return;
    }

    if (this.currentTrack) {
      this.fadeOutAndCleanupTrack(this.currentTrack, 1.5);
      this.currentTrack = null;
    }

    if (trackId === 'none') return;

    const cfg = MUSIC_TRACK_FILES[trackId];
    const targetGain = cfg?.volumeScale ?? 1.0;

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    const trackState: ActiveTrackState = {
      id: trackId,
      gainNode,
      timerIds: [],
      oscillators: [],
      sources: [],
      stopped: false,
    };
    this.currentTrack = trackState;

    void this.loadTrackBuffer(trackId).then((audioBuffer) => {
      if (trackState.stopped || !this.ctx || !this.musicBus || !this.proceduralMusicBus) {
        return;
      }

      const now = this.ctx.currentTime;
      if (audioBuffer) {
        gainNode.connect(this.musicBus);
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(targetGain, now + 1.6);

        const source = this.ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = true;
        source.connect(gainNode);
        source.start(now);
        trackState.sources.push(source);
      } else {
        gainNode.connect(this.proceduralMusicBus);
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(0.7, now + 1.6);
        this.startProceduralFallback(trackState);
      }
    });
  }

  private fadeOutAndCleanupTrack(track: ActiveTrackState, fadeSeconds: number): void {
    track.stopped = true;
    track.timerIds.forEach((id) => window.clearInterval(id));
    track.timerIds.length = 0;

    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      track.gainNode.gain.cancelScheduledValues(now);
      track.gainNode.gain.setValueAtTime(Math.max(0.0001, track.gainNode.gain.value), now);
      track.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + fadeSeconds);
    } catch {
      // ignore
    }

    window.setTimeout(() => {
      track.oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      });
      track.sources.forEach((src) => {
        try {
          src.stop();
          src.disconnect();
        } catch {
          // ignore
        }
      });
      try {
        track.gainNode.disconnect();
      } catch {
        // ignore
      }
    }, fadeSeconds * 1000 + 180);
  }

  private startProceduralFallback(track: ActiveTrackState): void {
    if (!this.ctx) return;
    const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
    const notes = [60, 64, 67, 71];
    let step = 0;
    const playNote = () => {
      if (!this.ctx || track.stopped) return;
      const t = this.ctx.currentTime;
      const freq = midiToFreq(notes[step % notes.length]);
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      osc.connect(g);
      g.connect(track.gainNode);
      osc.start(t);
      osc.stop(t + 2.65);
      step++;
    };
    playNote();
    track.timerIds.push(window.setInterval(playNote, 1400));
  }

  /**
   * Plays realistic SFX (using MP3 footstep & murmur files from src/audio/sfx/ + crisp foley)
   */
  public playSfx(id: SfxId): void {
    if (!this.unlocked || !this.ctx || !this.sfxBus || this.isMuted) return;
    const t = this.ctx.currentTime;

    switch (id) {
      case 'footstep': {
        if (this.footstepBuffers.length > 0) {
          let idx = Math.floor(Math.random() * this.footstepBuffers.length);
          if (this.footstepBuffers.length > 1 && idx === this.lastFootstepIndex) {
            idx = (idx + 1) % this.footstepBuffers.length;
          }
          this.lastFootstepIndex = idx;

          const src = this.ctx.createBufferSource();
          src.buffer = this.footstepBuffers[idx];
          src.playbackRate.value = 0.95 + Math.random() * 0.1;

          const g = this.ctx.createGain();
          g.gain.value = 0.56 + Math.random() * 0.08;

          src.connect(g);
          g.connect(this.sfxBus);
          src.start(t);
          break;
        }

        // Fallback if footstep MP3s haven't finished decoding yet
        if (!this.noiseBuffer) break;
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        src.playbackRate.value = 0.92 + Math.random() * 0.18;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(420, t);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.28, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        src.connect(filter);
        filter.connect(g);
        g.connect(this.sfxBus);
        src.start(t);
        src.stop(t + 0.12);
        break;
      }

      case 'student_ambience': {
        this.playAmbienceLoop('classroom', 0.48);
        break;
      }

      case 'lobby_ambience': {
        this.playAmbienceLoop('lobby', 0.58);
        break;
      }

      case 'ui_tap': {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(680, t + 0.055);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(g);
        g.connect(this.sfxBus);
        osc.start(t);
        osc.stop(t + 0.09);
        break;
      }

      case 'door_open': {
        const click = this.ctx.createOscillator();
        const cg = this.ctx.createGain();
        click.type = 'triangle';
        click.frequency.setValueAtTime(290, t);
        click.frequency.exponentialRampToValueAtTime(140, t + 0.06);
        cg.gain.setValueAtTime(0.18, t);
        cg.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        click.connect(cg);
        cg.connect(this.sfxBus);
        click.start(t);
        click.stop(t + 0.09);

        if (this.noiseBuffer) {
          const sw = this.ctx.createBufferSource();
          sw.buffer = this.noiseBuffer;
          const bpf = this.ctx.createBiquadFilter();
          bpf.type = 'bandpass';
          bpf.frequency.setValueAtTime(220, t + 0.08);
          bpf.frequency.linearRampToValueAtTime(460, t + 0.55);
          const sg = this.ctx.createGain();
          sg.gain.setValueAtTime(0.001, t + 0.06);
          sg.gain.linearRampToValueAtTime(0.14, t + 0.22);
          sg.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
          sw.connect(bpf);
          bpf.connect(sg);
          sg.connect(this.sfxBus);
          sw.start(t + 0.06);
          sw.stop(t + 0.68);
        }
        break;
      }

      case 'chair_move': {
        if (!this.noiseBuffer) break;
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const bpf = this.ctx.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.setValueAtTime(260, t);
        bpf.frequency.linearRampToValueAtTime(190, t + 0.35);
        bpf.Q.value = 3.2;

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.18, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

        src.connect(bpf);
        bpf.connect(g);
        g.connect(this.sfxBus);
        src.start(t);
        src.stop(t + 0.4);
        break;
      }

      case 'classroom_bell': {
        const tones = [
          { freq: 659.25, offset: 0 },
          { freq: 523.25, offset: 0.62 },
        ];
        tones.forEach(({ freq, offset }) => {
          if (!this.ctx || !this.sfxBus) return;
          const start = t + offset;
          [1, 2.0, 3.01].forEach((mult, idx) => {
            if (!this.ctx || !this.sfxBus) return;
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq * mult, start);
            const g = this.ctx.createGain();
            const amp = idx === 0 ? 0.22 : idx === 1 ? 0.08 : 0.03;
            g.gain.setValueAtTime(0.001, start);
            g.gain.linearRampToValueAtTime(amp, start + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0008, start + 1.8);
            osc.connect(g);
            g.connect(this.sfxBus);
            osc.start(start);
            osc.stop(start + 1.85);
          });
        });
        break;
      }

      case 'object_interact': {
        const notes = [587.33, 739.99, 880, 1174.66];
        notes.forEach((freq, idx) => {
          if (!this.ctx || !this.sfxBus) return;
          const start = t + idx * 0.09;
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          const g = this.ctx.createGain();
          g.gain.setValueAtTime(0.001, start);
          g.gain.linearRampToValueAtTime(0.14, start + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0008, start + 1.1);
          osc.connect(g);
          g.connect(this.sfxBus);
          osc.start(start);
          osc.stop(start + 1.15);
        });
        break;
      }

      case 'dialogue_soft': {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420 + Math.random() * 60, t);
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(g);
        g.connect(this.sfxBus);
        osc.start(t);
        osc.stop(t + 0.1);
        break;
      }
    }
  }

  private createReverbImpulse(duration: number, decay: number): ConvolverNode {
    const ctx = this.ctx!;
    const length = Math.floor(ctx.sampleRate * duration);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  private createPinkNoiseBuffer(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }
    return buffer;
  }
}

export const audioManager = new AudioManagerImpl();
