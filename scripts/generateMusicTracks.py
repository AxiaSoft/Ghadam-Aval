#!/usr/bin/env python3
"""
Generates the 8 original cinematic stereo MP3 background music tracks
for 'قدم اول (THE FIRST MOVE)' into src/audio/tracks/*.mp3.

Features:
- Expressive felt piano with string stiffness inharmonicity, stereo unison detune & hammer felt transient
- Warm chamber strings (cello/viola/violin ensemble) with natural bow swell & gentle vibrato
- Delicate celesta / bell harmonics for mystery & uplift moments
- FFT stereo hall reverb with circular loop-tail wrap-around for 100% seamless gapless looping
"""

from pathlib import Path
import numpy as np
from scipy import signal
import soundfile as sf

SR = 44100
OUT_DIR = Path("/home/user/src/audio/tracks")
OUT_DIR.mkdir(parents=True, exist_ok=True)


def midi_to_freq(midi: float) -> float:
    return 440.0 * (2.0 ** ((midi - 69.0) / 12.0))


def build_stereo_reverb_ir(duration: float = 3.4, decay: float = 2.8, wetness_tone: float = 2400.0, seed: int = 42) -> np.ndarray:
    rng = np.random.default_rng(seed)
    n = int(SR * duration)
    t = np.linspace(0.0, duration, n, endpoint=False)
    env = np.exp(-t * decay)
    # Smooth pre-delay bloom (18ms)
    bloom = np.clip(t / 0.022, 0.0, 1.0)
    ir_l = rng.standard_normal(n) * env * bloom
    ir_r = rng.standard_normal(n) * env * bloom

    # Early reflections
    early_ms = [17, 29, 43, 61, 83, 109]
    for idx, ms in enumerate(early_ms):
        pos = int(SR * (ms / 1000.0))
        if pos < n:
            amp = 0.35 * (0.82 ** idx)
            if idx % 2 == 0:
                ir_l[pos] += amp
                ir_r[min(n - 1, pos + 130)] += amp * 0.75
            else:
                ir_r[pos] += amp
                ir_l[min(n - 1, pos + 130)] += amp * 0.75

    sos = signal.butter(2, wetness_tone / (SR * 0.5), btype="lowpass", output="sos")
    ir_l = signal.sosfilt(sos, ir_l)
    ir_r = signal.sosfilt(sos, ir_r)

    norm = max(np.max(np.abs(ir_l)), np.max(np.abs(ir_r)), 1e-6) * 14.0
    return np.column_stack([ir_l / norm, ir_r / norm])


def add_stereo_note(mix: np.ndarray, start_sec: float, wave_l: np.ndarray, wave_r: np.ndarray) -> None:
    start = int(round(start_sec * SR))
    if start < 0:
        start = 0
    end = start + len(wave_l)
    if start >= len(mix):
        return
    clip_len = min(len(wave_l), len(mix) - start)
    mix[start : start + clip_len, 0] += wave_l[:clip_len]
    mix[start : start + clip_len, 1] += wave_r[:clip_len]


def synth_felt_piano(midi: float, duration: float = 3.8, velocity: float = 0.25, pan: float = 0.0, brightness: float = 1.0) -> tuple[np.ndarray, np.ndarray]:
    n = int(SR * duration)
    t = np.linspace(0.0, duration, n, endpoint=False)
    freq = midi_to_freq(midi)

    # Piano string stiffness coefficient
    B = 0.00016
    sig_l = np.zeros(n, dtype=np.float64)
    sig_r = np.zeros(n, dtype=np.float64)

    for k in range(1, 8):
        fk = freq * k * np.sqrt(1.0 + B * (k ** 2))
        if fk >= SR * 0.45:
            break
        # Higher partials decay faster like real felt piano strings
        partial_decay = np.exp(-t * (0.75 + 0.52 * (k ** 1.25)))
        amp = (velocity / (k ** 1.72)) * (1.0 if k == 1 else brightness)
        detune_cents = 1.15 if k <= 3 else 1.8
        fl = fk * (2.0 ** (-detune_cents / 1200.0))
        fr = fk * (2.0 ** (+detune_cents / 1200.0))
        phase_offset = (k * 0.67) % (2.0 * np.pi)
        sig_l += amp * partial_decay * np.sin(2.0 * np.pi * fl * t + phase_offset)
        sig_r += amp * partial_decay * np.sin(2.0 * np.pi * fr * t + phase_offset + 0.18)

    # Soft attack + gentle release fade so note end never clicks
    attack = 1.0 - np.exp(-t / 0.014)
    release_fade = np.ones(n, dtype=np.float64)
    fade_samples = min(int(0.18 * SR), n // 3)
    if fade_samples > 0:
        release_fade[-fade_samples:] = np.linspace(1.0, 0.0, fade_samples)

    # Subtle felt hammer transient
    rng = np.random.default_rng(int(midi * 100) + 7)
    hammer_len = min(int(0.028 * SR), n)
    hammer = np.zeros(n, dtype=np.float64)
    ht = np.linspace(0.0, 0.028, hammer_len, endpoint=False)
    hammer[:hammer_len] = rng.standard_normal(hammer_len) * np.exp(-ht * 160.0) * velocity * 0.06
    sos_h = signal.butter(2, 480.0 / (SR * 0.5), btype="lowpass", output="sos")
    hammer = signal.sosfilt(sos_h, hammer)

    cutoff = min(3400.0, max(380.0, freq * (3.4 * brightness + 0.8)))
    sos = signal.butter(2, cutoff / (SR * 0.5), btype="lowpass", output="sos")
    sig_l = signal.sosfilt(sos, (sig_l + hammer) * attack * release_fade)
    sig_r = signal.sosfilt(sos, (sig_r + hammer) * attack * release_fade)

    gain_l = np.sqrt(0.5 * (1.0 - np.clip(pan, -0.85, 0.85)))
    gain_r = np.sqrt(0.5 * (1.0 + np.clip(pan, -0.85, 0.85)))
    return sig_l * gain_l, sig_r * gain_r


def synth_warm_strings(midis: list[float], duration: float = 6.0, level: float = 0.085, cutoff: float = 1050.0) -> tuple[np.ndarray, np.ndarray]:
    n = int(SR * duration)
    t = np.linspace(0.0, duration, n, endpoint=False)
    out_l = np.zeros(n, dtype=np.float64)
    out_r = np.zeros(n, dtype=np.float64)

    # Bow swell envelope
    attack_sec = min(1.35, duration * 0.32)
    release_sec = min(1.65, duration * 0.35)
    env = np.ones(n, dtype=np.float64)
    na = int(attack_sec * SR)
    nr = int(release_sec * SR)
    if na > 0:
        env[:na] = 0.5 - 0.5 * np.cos(np.pi * np.linspace(0.0, 1.0, na))
    if nr > 0:
        env[-nr:] *= 0.5 + 0.5 * np.cos(np.pi * np.linspace(0.0, 1.0, nr))

    detunes_cents = [-7.5, -3.2, 0.0, +3.4, +7.8]
    pans = [-0.62, -0.28, 0.0, +0.28, +0.62]

    for m_idx, midi in enumerate(midis):
        base_freq = midi_to_freq(midi)
        note_amp = level / max(1.0, len(midis) ** 0.72)
        for v_idx, (cents, pan) in enumerate(zip(detunes_cents, pans)):
            f = base_freq * (2.0 ** (cents / 1200.0))
            vib_rate = 4.4 + 0.25 * ((m_idx + v_idx) % 3)
            vib_depth = 0.0022 * np.clip(t / 1.1, 0.0, 1.0)
            phase = 2.0 * np.pi * f * (t + (vib_depth / (2.0 * np.pi * vib_rate)) * np.sin(2.0 * np.pi * vib_rate * t))
            # Rich bowed waveform (band-limited first 6 harmonics)
            voice = np.zeros(n, dtype=np.float64)
            for h in range(1, 7):
                if f * h < SR * 0.45:
                    voice += ((-1) ** (h + 1)) * (1.0 / (h ** 1.28)) * np.sin(h * phase + v_idx * 0.7)
            voice *= note_amp * 0.24
            gl = np.sqrt(0.5 * (1.0 - pan))
            gr = np.sqrt(0.5 * (1.0 + pan))
            out_l += voice * gl
            out_r += voice * gr

    sos = signal.butter(3, cutoff / (SR * 0.5), btype="lowpass", output="sos")
    out_l = signal.sosfilt(sos, out_l * env)
    out_r = signal.sosfilt(sos, out_r * env)
    return out_l, out_r


def synth_celesta(midi: float, duration: float = 2.8, velocity: float = 0.09, pan: float = 0.15) -> tuple[np.ndarray, np.ndarray]:
    n = int(SR * duration)
    t = np.linspace(0.0, duration, n, endpoint=False)
    freq = midi_to_freq(midi)
    attack = 1.0 - np.exp(-t / 0.006)
    w = (
        0.72 * np.exp(-t * 1.45) * np.sin(2.0 * np.pi * freq * t)
        + 0.22 * np.exp(-t * 2.8) * np.sin(2.0 * np.pi * freq * 2.0 * t + 0.4)
        + 0.08 * np.exp(-t * 4.6) * np.sin(2.0 * np.pi * freq * 4.02 * t + 1.1)
    ) * velocity * attack
    fade = min(int(0.12 * SR), n // 3)
    if fade > 0:
        w[-fade:] *= np.linspace(1.0, 0.0, fade)
    gl = np.sqrt(0.5 * (1.0 - pan))
    gr = np.sqrt(0.5 * (1.0 + pan))
    return w * gl, w * gr


def synth_soft_air_bed(loop_seconds: float, center_hz: float = 420.0, level: float = 0.012, seed: int = 10) -> np.ndarray:
    rng = np.random.default_rng(seed)
    extra = int(2.0 * SR)
    n_loop = int(round(loop_seconds * SR))
    raw_l = rng.standard_normal(n_loop + extra)
    raw_r = rng.standard_normal(n_loop + extra)
    sos = signal.butter(2, [max(90.0, center_hz * 0.55) / (SR * 0.5), min(4000.0, center_hz * 1.65) / (SR * 0.5)], btype="bandpass", output="sos")
    fl = signal.sosfilt(sos, raw_l)[extra:]
    fr = signal.sosfilt(sos, raw_r)[extra:]
    # Crossfade loop seam (1.5s) for seamless ambient air
    xf = int(1.5 * SR)
    alpha = np.linspace(0.0, 1.0, xf)
    fl[:xf] = fl[:xf] * alpha + fl[-xf:] * (1.0 - alpha)
    fr[:xf] = fr[:xf] * alpha + fr[-xf:] * (1.0 - alpha)
    # Slow breathing LFO (exact integer cycle over loop)
    t = np.linspace(0.0, 2.0 * np.pi * 2.0, n_loop, endpoint=False)
    lfo = 0.78 + 0.22 * np.sin(t)
    return np.column_stack([fl * lfo * level, fr * lfo * level])


def finalize_seamless_loop(canvas: np.ndarray, loop_seconds: float, reverb_ir: np.ndarray, wet: float = 0.36, target_peak: float = 0.68) -> np.ndarray:
    n_loop = int(round(loop_seconds * SR))
    rev_l = signal.fftconvolve(canvas[:, 0], reverb_ir[:, 0], mode="full")
    rev_r = signal.fftconvolve(canvas[:, 1], reverb_ir[:, 1], mode="full")

    total_len = max(len(canvas), len(rev_l))
    mixed = np.zeros((total_len, 2), dtype=np.float64)
    mixed[: len(canvas), :] += canvas * (1.0 - wet * 0.28)
    mixed[: len(rev_l), 0] += rev_l * wet
    mixed[: len(rev_r), 1] += rev_r * wet

    # Wrap everything past n_loop circularly back onto the start of the loop!
    loop_buf = mixed[:n_loop].copy()
    pos = n_loop
    while pos < total_len:
        chunk = mixed[pos : min(total_len, pos + n_loop)]
        loop_buf[: len(chunk)] += chunk
        pos += n_loop

    # Gentle high-pass at 35Hz to remove DC / sub-rumble
    sos_hp = signal.butter(2, 35.0 / (SR * 0.5), btype="highpass", output="sos")
    loop_buf[:, 0] = signal.sosfilt(sos_hp, loop_buf[:, 0])
    loop_buf[:, 1] = signal.sosfilt(sos_hp, loop_buf[:, 1])

    # Tiny 12ms micro-crossfade guard at loop boundary for zero sample discontinuity
    guard = int(0.012 * SR)
    w = np.linspace(0.0, 1.0, guard)[:, None]
    seam_blend = loop_buf[:guard] * w + loop_buf[-guard:] * (1.0 - w)
    loop_buf[:guard] = seam_blend

    peak = max(np.max(np.abs(loop_buf)), 1e-6)
    loop_buf = np.tanh((loop_buf / peak) * 1.18) / np.tanh(1.18) * target_peak
    return loop_buf.astype(np.float32)


def render_all_tracks() -> None:
    ir_cold = build_stereo_reverb_ir(duration=4.2, decay=2.1, wetness_tone=1800.0, seed=11)
    ir_warm = build_stereo_reverb_ir(duration=3.5, decay=2.6, wetness_tone=2600.0, seed=22)
    ir_hall = build_stereo_reverb_ir(duration=3.8, decay=2.3, wetness_tone=3000.0, seed=33)

    # 1. 01_intro_cold.mp3 — Cold, quiet gray world (Am9 -> Fmaj7 -> Dm9 -> Em7, 24s loop)
    loop_s = 24.0
    canvas = np.zeros((int((loop_s + 6.0) * SR), 2), dtype=np.float64)
    canvas[: int(loop_s * SR)] += synth_soft_air_bed(loop_s, center_hz=310.0, level=0.014, seed=101)
    cold_bars = [
        {"pad": [45, 52, 60], "notes": [(0.4, 69, -0.2), (2.3, 76, 0.25), (4.1, 71, -0.1)]},
        {"pad": [41, 48, 57], "notes": [(0.5, 69, 0.18), (2.6, 72, -0.22), (4.4, 64, 0.1)]},
        {"pad": [38, 50, 57], "notes": [(0.4, 65, -0.15), (2.4, 69, 0.2), (4.3, 62, -0.18)]},
        {"pad": [40, 47, 55], "notes": [(0.6, 64, 0.15), (2.8, 67, -0.2), (4.6, 59, 0.05)]},
    ]
    for b_idx, bar in enumerate(cold_bars):
        t0 = b_idx * 6.0
        sl, sr_w = synth_warm_strings(bar["pad"], duration=6.4, level=0.068, cutoff=720.0)
        add_stereo_note(canvas, t0, sl, sr_w)
        for offset, m, pan in bar["notes"]:
            pl, pr = synth_felt_piano(m, duration=4.4, velocity=0.19, pan=pan, brightness=0.68)
            add_stereo_note(canvas, t0 + offset, pl, pr)
    audio = finalize_seamless_loop(canvas, loop_s, ir_cold, wet=0.46, target_peak=0.58)
    sf.write(OUT_DIR / "01_intro_cold.mp3", audio, SR)

    # 2. 02_questionnaire_mystery.mp3 — Intimate, curious, reflective arpeggios (24s loop)
    loop_s = 24.0
    canvas = np.zeros((int((loop_s + 6.0) * SR), 2), dtype=np.float64)
    canvas[: int(loop_s * SR)] += synth_soft_air_bed(loop_s, center_hz=440.0, level=0.009, seed=102)
    q_bars = [
        {"pad": [45, 52, 57], "arp": [57, 64, 69, 71, 76, 71], "bell": 81},
        {"pad": [41, 48, 57], "arp": [53, 60, 65, 69, 72, 69], "bell": 79},
        {"pad": [50, 57, 62], "arp": [50, 57, 62, 65, 69, 65], "bell": 76},
        {"pad": [40, 47, 56], "arp": [52, 59, 64, 68, 71, 68], "bell": 76},
    ]
    for b_idx, bar in enumerate(q_bars):
        t0 = b_idx * 6.0
        sl, sr_w = synth_warm_strings(bar["pad"], duration=6.2, level=0.062, cutoff=860.0)
        add_stereo_note(canvas, t0, sl, sr_w)
        for i, m in enumerate(bar["arp"]):
            pan = -0.3 + 0.12 * i
            pl, pr = synth_felt_piano(m, duration=3.3, velocity=0.20, pan=pan, brightness=0.82)
            add_stereo_note(canvas, t0 + i * 0.92, pl, pr)
        cl, cr = synth_celesta(bar["bell"], duration=3.2, velocity=0.065, pan=0.25)
        add_stereo_note(canvas, t0 + 2.75, cl, cr)
    audio = finalize_seamless_loop(canvas, loop_s, ir_warm, wet=0.40, target_peak=0.62)
    sf.write(OUT_DIR / "02_questionnaire_mystery.mp3", audio, SR)

    # 3. 03_transformation_uplift.mp3 — Radiant blooming color transformation (Dmaj9 -> Bm9 -> Gmaj7 -> Asus4/A, 22s loop)
    loop_s = 22.0
    canvas = np.zeros((int((loop_s + 6.0) * SR), 2), dtype=np.float64)
    up_bars = [
        {"pad": [50, 57, 62, 66], "arp": [62, 66, 69, 74, 78, 81], "bell": 86},
        {"pad": [47, 54, 59, 66], "arp": [59, 66, 69, 73, 74, 78], "bell": 85},
        {"pad": [43, 50, 59, 62], "arp": [59, 62, 67, 71, 74, 78], "bell": 83},
        {"pad": [45, 52, 57, 64], "arp": [61, 64, 69, 73, 76, 81], "bell": 85},
    ]
    bar_dur = loop_s / 4.0
    for b_idx, bar in enumerate(up_bars):
        t0 = b_idx * bar_dur
        sl, sr_w = synth_warm_strings(bar["pad"], duration=bar_dur + 0.8, level=0.115, cutoff=1350.0)
        add_stereo_note(canvas, t0, sl, sr_w)
        for i, m in enumerate(bar["arp"]):
            pl, pr = synth_felt_piano(m, duration=3.2, velocity=0.24, pan=-0.35 + i * 0.14, brightness=1.08)
            add_stereo_note(canvas, t0 + i * 0.78, pl, pr)
        cl, cr = synth_celesta(bar["bell"], duration=3.4, velocity=0.085, pan=-0.2 if b_idx % 2 else 0.2)
        add_stereo_note(canvas, t0 + 1.55, cl, cr)
    audio = finalize_seamless_loop(canvas, loop_s, ir_hall, wet=0.42, target_peak=0.70)
    sf.write(OUT_DIR / "03_transformation_uplift.mp3", audio, SR)

    # 4. 04_missions_adventure.mp3 — Gentle sunlit outdoor walk (Cmaj7 -> Am9 -> Fmaj7 -> G6, 24s loop)
    loop_s = 24.0
    canvas = np.zeros((int((loop_s + 6.0) * SR), 2), dtype=np.float64)
    adv_bars = [
        {"pad": [48, 55, 64], "bass": 48, "mel": [(0.0, 64), (0.75, 67), (1.5, 72), (2.6, 71), (3.75, 67), (4.8, 64)]},
        {"pad": [45, 52, 60], "bass": 45, "mel": [(0.0, 64), (0.75, 69), (1.5, 71), (2.7, 72), (3.85, 69), (4.9, 67)]},
        {"pad": [41, 48, 57], "bass": 41, "mel": [(0.0, 65), (0.8, 69), (1.6, 72), (2.8, 76), (4.0, 72), (5.0, 69)]},
        {"pad": [43, 50, 59], "bass": 43, "mel": [(0.0, 62), (0.75, 67), (1.5, 71), (2.7, 74), (3.9, 71), (4.9, 67)]},
    ]
    for b_idx, bar in enumerate(adv_bars):
        t0 = b_idx * 6.0
        sl, sr_w = synth_warm_strings(bar["pad"], duration=6.2, level=0.082, cutoff=1120.0)
        add_stereo_note(canvas, t0, sl, sr_w)
        bl, br = synth_felt_piano(bar["bass"], duration=4.5, velocity=0.22, pan=-0.12, brightness=0.85)
        add_stereo_note(canvas, t0, bl, br)
        for idx_n, (off, m) in enumerate(bar["mel"]):
            pl, pr = synth_felt_piano(m, duration=2.8, velocity=0.23, pan=-0.22 + (idx_n % 4) * 0.15, brightness=0.98)
            add_stereo_note(canvas, t0 + off, pl, pr)
    audio = finalize_seamless_loop(canvas, loop_s, ir_warm, wet=0.35, target_peak=0.66)
    sf.write(OUT_DIR / "04_missions_adventure.mp3", audio, SR)

    # 5. 05_classroom_calm.mp3 — Quiet morning classroom intimacy (Fmaj7 -> Em7 -> Dm7 -> Cmaj7, 24s loop)
    loop_s = 24.0
    canvas = np.zeros((int((loop_s + 6.0) * SR), 2), dtype=np.float64)
    canvas[: int(loop_s * SR)] += synth_soft_air_bed(loop_s, center_hz=580.0, level=0.007, seed=105)
    cls_bars = [
        {"bass": 53, "notes": [(0.0, 60), (1.2, 65), (2.4, 69), (3.9, 65)]},
        {"bass": 52, "notes": [(0.0, 59), (1.25, 64), (2.5, 67), (4.0, 64)]},
        {"bass": 50, "notes": [(0.0, 57), (1.2, 62), (2.45, 65), (3.95, 69)]},
        {"bass": 48, "notes": [(0.0, 60), (1.3, 64), (2.6, 67), (4.1, 64)]},
    ]
    for b_idx, bar in enumerate(cls_bars):
        t0 = b_idx * 6.0
        bl, br = synth_felt_piano(bar["bass"], duration=5.0, velocity=0.18, pan=-0.18, brightness=0.72)
        add_stereo_note(canvas, t0, bl, br)
        sl, sr_w = synth_warm_strings([bar["bass"], bar["bass"] + 7], duration=6.0, level=0.045, cutoff=780.0)
        add_stereo_note(canvas, t0, sl, sr_w)
        for idx_n, (off, m) in enumerate(bar["notes"]):
            pl, pr = synth_felt_piano(m, duration=3.6, velocity=0.19, pan=0.15 if idx_n % 2 else -0.1, brightness=0.76)
            add_stereo_note(canvas, t0 + off, pl, pr)
    audio = finalize_seamless_loop(canvas, loop_s, ir_warm, wet=0.38, target_peak=0.58)
    sf.write(OUT_DIR / "05_classroom_calm.mp3", audio, SR)

    # 6. 06_classroom_ending.mp3 — Wistful unspoken glance & respectful goodbye (Dm9 -> Bbmaj7 -> Gm9 -> Asus4/A, 24s loop)
    loop_s = 24.0
    canvas = np.zeros((int((loop_s + 6.0) * SR), 2), dtype=np.float64)
    end_bars = [
        {"pad": [50, 57, 65], "notes": [(0.2, 62), (1.4, 69), (2.9, 72), (4.4, 69)]},
        {"pad": [46, 53, 62], "notes": [(0.2, 62), (1.5, 65), (3.0, 69), (4.5, 65)]},
        {"pad": [43, 50, 58], "notes": [(0.2, 58), (1.45, 62), (2.95, 67), (4.4, 65)]},
        {"pad": [45, 52, 57], "notes": [(0.2, 61), (1.5, 64), (3.1, 69), (4.6, 64)]},
    ]
    for b_idx, bar in enumerate(end_bars):
        t0 = b_idx * 6.0
        sl, sr_w = synth_warm_strings(bar["pad"], duration=6.3, level=0.088, cutoff=980.0)
        add_stereo_note(canvas, t0, sl, sr_w)
        for idx_n, (off, m) in enumerate(bar["notes"]):
            pl, pr = synth_felt_piano(m, duration=3.8, velocity=0.21, pan=-0.2 + idx_n * 0.13, brightness=0.84)
            add_stereo_note(canvas, t0 + off, pl, pr)
    audio = finalize_seamless_loop(canvas, loop_s, ir_hall, wet=0.42, target_peak=0.63)
    sf.write(OUT_DIR / "06_classroom_ending.mp3", audio, SR)

    # 7. 07_lobby_warm.mp3 — Emotional centerpiece: warm afternoon lobby & heartfelt conversation (28s loop)
    loop_s = 28.0
    bar_dur = 7.0
    canvas = np.zeros((int((loop_s + 6.0) * SR), 2), dtype=np.float64)
    canvas[: int(loop_s * SR)] += synth_soft_air_bed(loop_s, center_hz=680.0, level=0.008, seed=107)
    lobby_bars = [
        {"pad": [48, 55, 64, 67], "bass": 48, "notes": [(0.0, 60), (0.95, 64), (1.9, 67), (3.1, 71), (4.35, 72), (5.6, 67)]},
        {"pad": [45, 52, 60, 64], "bass": 45, "notes": [(0.0, 57), (0.95, 64), (1.9, 69), (3.15, 71), (4.4, 72), (5.65, 69)]},
        {"pad": [41, 48, 57, 60], "bass": 41, "notes": [(0.0, 60), (1.0, 65), (2.0, 69), (3.25, 72), (4.5, 69), (5.7, 65)]},
        {"pad": [43, 50, 59, 62], "bass": 43, "notes": [(0.0, 59), (0.95, 62), (1.95, 67), (3.2, 71), (4.45, 74), (5.7, 71)]},
    ]
    for b_idx, bar in enumerate(lobby_bars):
        t0 = b_idx * bar_dur
        sl, sr_w = synth_warm_strings(bar["pad"], duration=bar_dur + 0.6, level=0.095, cutoff=1180.0)
        add_stereo_note(canvas, t0, sl, sr_w)
        bl, br = synth_felt_piano(bar["bass"], duration=5.5, velocity=0.20, pan=-0.16, brightness=0.82)
        add_stereo_note(canvas, t0, bl, br)
        for idx_n, (off, m) in enumerate(bar["notes"]):
            pl, pr = synth_felt_piano(m, duration=3.5, velocity=0.22, pan=-0.25 + (idx_n % 5) * 0.12, brightness=0.92)
            add_stereo_note(canvas, t0 + off, pl, pr)
    audio = finalize_seamless_loop(canvas, loop_s, ir_warm, wet=0.40, target_peak=0.65)
    sf.write(OUT_DIR / "07_lobby_warm.mp3", audio, SR)

    # 8. 08_final_hopeful.mp3 — Luminous, hopeful ending ("شاید این فقط شروع یک آشنایی قشنگ باشه") (26s loop)
    loop_s = 26.0
    bar_dur = 6.5
    canvas = np.zeros((int((loop_s + 6.0) * SR), 2), dtype=np.float64)
    final_bars = [
        {"pad": [50, 57, 66, 69], "bass": 50, "notes": [(0.0, 62), (0.85, 66), (1.7, 69), (2.75, 74), (3.95, 78), (5.2, 74)], "bell": 86},
        {"pad": [47, 54, 62, 66], "bass": 47, "notes": [(0.0, 59), (0.85, 66), (1.7, 71), (2.8, 74), (4.0, 73), (5.25, 69)], "bell": 85},
        {"pad": [43, 50, 59, 62], "bass": 43, "notes": [(0.0, 59), (0.85, 62), (1.7, 67), (2.8, 71), (4.0, 74), (5.2, 71)], "bell": 83},
        {"pad": [45, 52, 61, 64], "bass": 45, "notes": [(0.0, 61), (0.85, 64), (1.7, 69), (2.85, 73), (4.05, 76), (5.3, 73)], "bell": 85},
    ]
    for b_idx, bar in enumerate(final_bars):
        t0 = b_idx * bar_dur
        sl, sr_w = synth_warm_strings(bar["pad"], duration=bar_dur + 0.7, level=0.115, cutoff=1380.0)
        add_stereo_note(canvas, t0, sl, sr_w)
        bl, br = synth_felt_piano(bar["bass"], duration=5.2, velocity=0.22, pan=-0.15, brightness=0.90)
        add_stereo_note(canvas, t0, bl, br)
        for idx_n, (off, m) in enumerate(bar["notes"]):
            pl, pr = synth_felt_piano(m, duration=3.6, velocity=0.24, pan=-0.28 + (idx_n % 5) * 0.14, brightness=1.02)
            add_stereo_note(canvas, t0 + off, pl, pr)
        cl, cr = synth_celesta(bar["bell"], duration=3.5, velocity=0.075, pan=0.22 if b_idx % 2 == 0 else -0.22)
        add_stereo_note(canvas, t0 + 2.75, cl, cr)
    audio = finalize_seamless_loop(canvas, loop_s, ir_hall, wet=0.42, target_peak=0.70)
    sf.write(OUT_DIR / "08_final_hopeful.mp3", audio, SR)

    print("Successfully rendered all 8 stereo MP3 tracks into:", OUT_DIR)


if __name__ == "__main__":
    render_all_tracks()
