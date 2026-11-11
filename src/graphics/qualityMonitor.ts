export type QualityLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export interface QualitySample {
  elapsed: number;
  frames: number;
  badWindows: number;
  cooldown: number;
}
export function initialQualitySample(): QualitySample {
  return { elapsed: 0, frames: 0, badWindows: 0, cooldown: 8 };
}
/** Return one downgrade only after two consecutive five-second slow windows. */
export function sampleQuality(sample: QualitySample, delta: number, paused: boolean, quality: QualityLevel): QualityLevel | null {
  if (paused || delta <= 0 || delta > 2) {
    sample.elapsed = 0; sample.frames = 0; sample.badWindows = 0;
    return null;
  }
  if (sample.cooldown > 0) { sample.cooldown -= delta; return null; }
  sample.elapsed += delta;
  sample.frames++;
  if (sample.elapsed < 5) return null;
  const fps = sample.frames / sample.elapsed;
  sample.badWindows = fps < 30 ? sample.badWindows + 1 : 0;
  sample.elapsed = 0; sample.frames = 0;
  if (sample.badWindows < 2 || quality === 'LOW') return null;
  sample.badWindows = 0; sample.cooldown = 15;
  return quality === 'HIGH' ? 'MEDIUM' : 'LOW';
}
