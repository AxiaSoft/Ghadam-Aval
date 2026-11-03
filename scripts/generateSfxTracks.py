#!/usr/bin/env python3
"""
Generates realistic stereo SFX & crowd murmur MP3 files into src/audio/sfx/:
- sfx_lobby_murmur.mp3      (16s seamless loop: warm university lobby crowd conversation murmur / همهمه لابی)
- sfx_classroom_murmur.mp3  (14s seamless loop: quiet classroom whispers & notebook rustle / همهمه آرام کلاس)
- sfx_footstep_1..4.mp3     (4 natural shoe footsteps on indoor stone/ceramic floor / صدای راه رفتن)
"""

from pathlib import Path
import numpy as np
from scipy import signal
import soundfile as sf

SR = 44100
SFX_DIR = Path("/home/user/src/audio/sfx")
SFX_DIR.mkdir(parents=True, exist_ok=True)


def synthesize_murmur_voice(duration_s: float, base_f0: float, pan: float, distance: float, rng: np.random.Generator) -> tuple[np.ndarray, np.ndarray]:
    """
    Synthesizes a single unintelligible human conversational voice in the background ('walla')
    using glottal harmonic excitation + time-varying vowel formants (F1, F2, F3) + syllabic speech rhythm.
    """
    n = int(round(duration_s * SR))
    t = np.linspace(0.0, duration_s, n, endpoint=False)

    # Intonation pitch contour (smooth random walk around base_f0)
    ctrl_pts = int(duration_s * 3) + 2
    pitch_curve = np.interp(
        np.linspace(0, ctrl_pts - 1, n),
        np.arange(ctrl_pts),
        base_f0 * (1.0 + rng.normal(0.0, 0.085, ctrl_pts)),
    )
    phase = 2.0 * np.pi * np.cumsum(pitch_curve) / SR

    # Soft glottal pulse train (rich harmonics up to 3.2 kHz + slight breath aspiration)
    glottal = np.zeros(n, dtype=np.float64)
    max_h = min(22, int(3100.0 / base_f0))
    for h in range(1, max_h + 1):
        # Spectral tilt ~ -12dB/octave
        glottal += (1.0 / (h ** 1.45)) * np.sin(h * phase + rng.uniform(0, 2 * np.pi))
    glottal += rng.standard_normal(n) * 0.14  # consonant / breath aspiration

    # Syllabic speech envelope (3.2 to 5.4 syllables/sec, bursty with natural listening pauses)
    syl_rate = rng.uniform(3.3, 5.2)
    phrase_rate = rng.uniform(0.18, 0.35)
    syl_mod = np.clip(np.sin(2 * np.pi * syl_rate * t + rng.uniform(0, 6.28)) * 0.65 + 0.35, 0.0, 1.0)
    # Occasional pauses when the listener's partner is speaking
    pause_pts = int(duration_s * 1.5) + 2
    talk_gate = np.interp(
        np.linspace(0, pause_pts - 1, n),
        np.arange(pause_pts),
        (rng.uniform(0, 1, pause_pts) > 0.38).astype(float),
    )
    talk_gate = signal.sosfilt(signal.butter(2, 2.5 / (SR * 0.5), output="sos"), talk_gate)
    phrase_mod = 0.65 + 0.35 * np.sin(2 * np.pi * phrase_rate * t + rng.uniform(0, 6.28))
    env = np.clip(syl_mod * talk_gate * phrase_mod, 0.0, 1.0)

    voiced = glottal * env

    # Vowel formant filtering in 3 overlapping formant bands (F1, F2, F3) with slow modulation
    f1_centers = [380.0, 520.0, 660.0]
    f2_centers = [1050.0, 1480.0, 1920.0]
    formant_mix = np.zeros(n, dtype=np.float64)

    for idx_v, (f1, f2) in enumerate(zip(f1_centers, f2_centers)):
        weight = 0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(0.7, 1.9) * t + idx_v * 2.1)
        sos1 = signal.butter(2, [f1 * 0.78 / (SR * 0.5), f1 * 1.25 / (SR * 0.5)], btype="bandpass", output="sos")
        sos2 = signal.butter(2, [f2 * 0.82 / (SR * 0.5), f2 * 1.18 / (SR * 0.5)], btype="bandpass", output="sos")
        formant_mix += weight * (signal.sosfilt(sos1, voiced) * 0.85 + signal.sosfilt(sos2, voiced) * 0.42)

    # Distance air absorption lowpass (farther voices sound warmer/softer)
    dist_cutoff = np.clip(2800.0 - distance * 1400.0, 850.0, 2800.0)
    sos_dist = signal.butter(2, dist_cutoff / (SR * 0.5), btype="lowpass", output="sos")
    mono = signal.sosfilt(sos_dist, formant_mix) * (0.045 / (0.65 + distance))

    gl = np.sqrt(0.5 * (1.0 - np.clip(pan, -0.85, 0.85)))
    gr = np.sqrt(0.5 * (1.0 + np.clip(pan, -0.85, 0.85)))
    return mono * gl, mono * gr


def make_seamless(buf: np.ndarray, crossfade_s: float = 2.0) -> np.ndarray:
    """Crossfades the last `crossfade_s` seconds onto the start so looping has zero seam."""
    xf = int(round(crossfade_s * SR))
    main_len = len(buf) - xf
    out = buf[:main_len].copy()
    w = np.linspace(0.0, 1.0, xf)[:, None]
    out[:xf] = out[:xf] * w + buf[main_len:] * (1.0 - w)
    return out


def generate_lobby_murmur() -> None:
    rng = np.random.default_rng(2026)
    loop_s = 16.0
    xf_s = 2.5
    raw_s = loop_s + xf_s
    n = int(round(raw_s * SR))
    mix = np.zeros((n, 2), dtype=np.float64)

    # 18 distinct male & female conversational voices seated in pairs around the lobby
    f0_pool = [
        108, 116, 124, 132, 138, 146, 155, 165,  # male vocal range
        182, 194, 205, 214, 222, 232, 240, 248, 198, 128,  # female + mixed vocal range
    ]
    for i, f0 in enumerate(f0_pool):
        pan = np.clip(((i % 6) - 2.5) / 3.0 + rng.normal(0, 0.08), -0.82, 0.82)
        dist = rng.uniform(0.25, 0.95)
        vl, vr = synthesize_murmur_voice(raw_s, float(f0), float(pan), float(dist), rng)
        mix[:, 0] += vl
        mix[:, 1] += vr

    # Subtle room air tone + gentle lobby acoustics diffusion
    room_ir_len = int(0.85 * SR)
    t_ir = np.linspace(0.0, 0.85, room_ir_len, endpoint=False)
    ir_l = rng.standard_normal(room_ir_len) * np.exp(-t_ir * 5.2)
    ir_r = rng.standard_normal(room_ir_len) * np.exp(-t_ir * 5.2)
    sos_ir = signal.butter(2, 1900.0 / (SR * 0.5), btype="lowpass", output="sos")
    ir_l = signal.sosfilt(sos_ir, ir_l) * 0.035
    ir_r = signal.sosfilt(sos_ir, ir_r) * 0.035

    wet_l = signal.fftconvolve(mix[:, 0], ir_l, mode="same")
    wet_r = signal.fftconvolve(mix[:, 1], ir_r, mode="same")
    mix[:, 0] = mix[:, 0] * 0.72 + wet_l * 0.55
    mix[:, 1] = mix[:, 1] * 0.72 + wet_r * 0.55

    # Warm highpass at 95Hz so murmur never muddies piano bass
    sos_hp = signal.butter(2, 95.0 / (SR * 0.5), btype="highpass", output="sos")
    mix[:, 0] = signal.sosfilt(sos_hp, mix[:, 0])
    mix[:, 1] = signal.sosfilt(sos_hp, mix[:, 1])

    looped = make_seamless(mix, crossfade_s=xf_s)
    peak = max(np.max(np.abs(looped)), 1e-6)
    looped = (looped / peak) * 0.52
    sf.write(SFX_DIR / "sfx_lobby_murmur.mp3", looped.astype(np.float32), SR)


def generate_classroom_murmur() -> None:
    rng = np.random.default_rng(3030)
    loop_s = 14.0
    xf_s = 2.0
    raw_s = loop_s + xf_s
    n = int(round(raw_s * SR))
    mix = np.zeros((n, 2), dtype=np.float64)

    # Hushed whispers (higher frequencies, sparser syllables) + soft paper/notebook rustles
    whisper_f0s = [135, 168, 205, 228, 148, 215]
    for i, f0 in enumerate(whisper_f0s):
        pan = -0.65 + (i / 5.0) * 1.3
        vl, vr = synthesize_murmur_voice(raw_s, float(f0), float(pan), distance=0.88, rng=rng)
        mix[:, 0] += vl * 0.45
        mix[:, 1] += vr * 0.45

    # Occasional soft notebook page turn / cloth shift
    for rustle_t in [1.4, 4.3, 7.6, 10.8, 13.5]:
        r_len = int(0.32 * SR)
        start = int(rustle_t * SR)
        if start + r_len < n:
            tr = np.linspace(0.0, 0.32, r_len, endpoint=False)
            env = np.sin(np.pi * tr / 0.32) ** 1.6
            noise = rng.standard_normal(r_len) * env * 0.025
            sos_bp = signal.butter(2, [900.0 / (SR * 0.5), 3800.0 / (SR * 0.5)], btype="bandpass", output="sos")
            rustle = signal.sosfilt(sos_bp, noise)
            pan = rng.uniform(-0.6, 0.6)
            mix[start : start + r_len, 0] += rustle * np.sqrt(0.5 * (1.0 - pan))
            mix[start : start + r_len, 1] += rustle * np.sqrt(0.5 * (1.0 + pan))

    # Quiet room tone
    room = rng.standard_normal((n, 2)) * 0.004
    sos_room = signal.butter(2, [120.0 / (SR * 0.5), 900.0 / (SR * 0.5)], btype="bandpass", output="sos")
    mix[:, 0] += signal.sosfilt(sos_room, room[:, 0])
    mix[:, 1] += signal.sosfilt(sos_room, room[:, 1])

    looped = make_seamless(mix, crossfade_s=xf_s)
    peak = max(np.max(np.abs(looped)), 1e-6)
    looped = (looped / peak) * 0.38
    sf.write(SFX_DIR / "sfx_classroom_murmur.mp3", looped.astype(np.float32), SR)


def generate_footsteps() -> None:
    """
    Generates 4 natural shoe footstep variations on indoor stone/terrazzo flooring:
    1. Low-end heel contact thump (95-145 Hz damped membrane)
    2. Mid-high sole contact click/scuff (450-2900 Hz filtered transient, ~28ms after heel)
    3. Subtle indoor hallway early reflection tail (~180ms)
    """
    rng = np.random.default_rng(777)
    configs = [
        {"heel_hz": 118.0, "sole_hz": 1450.0, "sole_delay": 0.024, "pan": -0.06},
        {"heel_hz": 108.0, "sole_hz": 1620.0, "sole_delay": 0.028, "pan": +0.06},
        {"heel_hz": 124.0, "sole_hz": 1380.0, "sole_delay": 0.022, "pan": -0.05},
        {"heel_hz": 113.0, "sole_hz": 1540.0, "sole_delay": 0.026, "pan": +0.05},
    ]

    dur = 0.28
    n = int(round(dur * SR))
    t = np.linspace(0.0, dur, n, endpoint=False)

    for idx, cfg in enumerate(configs, start=1):
        # 1. Heel impact (warm stone floor thud + crisp heel click)
        f_heel = cfg["heel_hz"]
        heel_tone = (
            0.55 * np.sin(2.0 * np.pi * f_heel * t * np.exp(-t * 14.0)) * np.exp(-t * 48.0)
        )
        heel_click = rng.standard_normal(n) * np.exp(-t * 135.0)
        sos_hc = signal.butter(2, [280.0 / (SR * 0.5), 2400.0 / (SR * 0.5)], btype="bandpass", output="sos")
        heel_click = signal.sosfilt(sos_hc, heel_click) * 0.65

        # 2. Forefoot sole roll (~25ms after heel)
        sole = np.zeros(n, dtype=np.float64)
        d_samp = int(cfg["sole_delay"] * SR)
        ts = t[: n - d_samp]
        sole_raw = rng.standard_normal(n - d_samp) * np.exp(-ts * 85.0) * np.clip(ts / 0.005, 0.0, 1.0)
        sos_s = signal.butter(
            2,
            [cfg["sole_hz"] * 0.45 / (SR * 0.5), min(4200.0, cfg["sole_hz"] * 1.8) / (SR * 0.5)],
            btype="bandpass",
            output="sos",
        )
        sole[d_samp:] = signal.sosfilt(sos_s, sole_raw) * 0.52

        dry = heel_tone + heel_click + sole

        # 3. Subtle early room reflections (12ms, 23ms, 37ms)
        st_l = dry * np.sqrt(0.5 * (1.0 - cfg["pan"]))
        st_r = dry * np.sqrt(0.5 * (1.0 + cfg["pan"]))
        for tap_ms, gain in [(11, 0.16), (21, 0.11), (34, 0.06)]:
            off = int((tap_ms / 1000.0) * SR)
            if off < n:
                st_l[off:] += dry[: n - off] * gain
                st_r[min(n - 1, off + 18) :] += dry[: n - min(n - 1, off + 18)] * gain * 0.9

        fade = int(0.04 * SR)
        st_l[-fade:] *= np.linspace(1.0, 0.0, fade)
        st_r[-fade:] *= np.linspace(1.0, 0.0, fade)

        stereo = np.column_stack([st_l, st_r])
        peak = max(np.max(np.abs(stereo)), 1e-6)
        stereo = (stereo / peak) * 0.78
        sf.write(SFX_DIR / f"sfx_footstep_{idx}.mp3", stereo.astype(np.float32), SR)


if __name__ == "__main__":
    generate_lobby_murmur()
    generate_classroom_murmur()
    generate_footsteps()
    print("Successfully rendered crowd murmur & footstep MP3 files into:", SFX_DIR)
