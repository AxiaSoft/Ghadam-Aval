/** Optional lines approved for the two students outside the university. */
export const CAMPUS_CHATTER = {
  seated: [
    'فکر کنم کلاس بعدی طبقهٔ بالاست.',
    'هنوز چند دقیقه تا شروع کلاس مونده.',
    'کیفم رو همین‌جا مرتب کنم بهتره.',
  ],
  standing: [
    'تابلوی کلاس‌ها رو تازه عوض کردن؟',
    'امروز محوطه خلوت‌تره.',
    'باید قبل از کلاس برم کتابخونه.',
  ],
} as const;

export interface ChatterState {
  nearby: boolean;
  remaining: number;
  cooldown: number;
  lastIndex: number;
  line: string | null;
}
export const initialChatterState = (): ChatterState => ({ nearby: false, remaining: 0, cooldown: 0, lastIndex: -1, line: null });

/** Trigger only on entering the radius, pause timers with the game and avoid immediate repetition. */
export function updateChatter(state: ChatterState, distance: number, dt: number, enabled: boolean, paused: boolean, lines: readonly string[], random = Math.random): ChatterState {
  if (!enabled) return { ...state, nearby: false, remaining: 0, line: null };
  if (paused) return state;
  const elapsed = Math.max(0, dt);
  const cooldown = Math.max(0, state.cooldown - elapsed);
  const remaining = Math.max(0, state.remaining - elapsed);
  // Hysteresis prevents flickering when the player stands on the boundary.
  const nearby = distance < (state.nearby ? 2.8 : 2.2);
  if (nearby && !state.nearby && cooldown === 0 && lines.length > 0) {
    const candidates = lines.map((_, index) => index).filter((index) => index !== state.lastIndex || lines.length === 1);
    const selection = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
    const index = candidates[Math.max(0, selection)];
    return { nearby, cooldown: 10, remaining: 4, lastIndex: index, line: lines[index] };
  }
  return { ...state, nearby, cooldown, remaining: nearby ? remaining : 0, line: nearby && remaining > 0 ? state.line : null };
}
