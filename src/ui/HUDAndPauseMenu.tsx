import React, { useState } from 'react';
import { Pause, Play, Volume2, VolumeX, RotateCcw, Sliders } from 'lucide-react';
import { useGameStore } from '../state/gameStore';
import { GraphicsProfile } from '../types/game';
import { audioManager } from '../audio/AudioManager';

const PROFILE_LABELS: Record<GraphicsProfile, string> = {
  LOW: 'سبک',
  MEDIUM: 'متعادل',
  HIGH: 'بالا',
};

export const HUDAndPauseMenu: React.FC = () => {
  const stage = useGameStore((s) => s.stage);
  const isPaused = useGameStore((s) => s.isPaused);
  const setPaused = useGameStore((s) => s.setPaused);
  const isMuted = useGameStore((s) => s.isMuted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const musicVolume = useGameStore((s) => s.musicVolume);
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const setMusicVolume = useGameStore((s) => s.setMusicVolume);
  const setSfxVolume = useGameStore((s) => s.setSfxVolume);
  const graphicsProfile = useGameStore((s) => s.graphicsProfile);
  const setGraphicsProfile = useGameStore((s) => s.setGraphicsProfile);
  const objectiveHint = useGameStore((s) => s.objectiveHint);
  const narrativeCaption = useGameStore((s) => s.narrativeCaption);
  const fadeOpacity = useGameStore((s) => s.fadeOpacity);
  const restartGame = useGameStore((s) => s.restartGame);
  const unlockAudio = useGameStore((s) => s.unlockAudio);

  const [confirmRestart, setConfirmRestart] = useState(false);

  const handleToggleMute = () => {
    audioManager.unlock();
    unlockAudio();
    toggleMute();
    audioManager.playSfx('ui_tap');
  };

  const handleOpenPause = () => {
    audioManager.unlock();
    unlockAudio();
    audioManager.playSfx('ui_tap');
    setConfirmRestart(false);
    setPaused(!isPaused);
  };

  const profiles: GraphicsProfile[] = ['LOW', 'MEDIUM', 'HIGH'];

  return (
    <>
      <div
        className="scene-fade-curtain"
        style={{
          opacity: fadeOpacity,
          pointerEvents: fadeOpacity > 0.1 ? 'auto' : 'none',
        }}
      />

      {/* Minimal Top HUD (kept dir="ltr" so Objective Pill stays top-left & icons top-right cleanly) */}
      <header className="minimal-hud" dir="ltr">
        <div className="hud-left">
          {objectiveHint && !isPaused && (
            <div className="objective-pill" dir="rtl">
              {objectiveHint}
            </div>
          )}
        </div>

        <div className="hud-right">
          <button
            type="button"
            className="hud-icon-btn"
            onClick={handleToggleMute}
            aria-label={isMuted ? 'وصل کردن صدا' : 'قطع صدا'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {stage !== 'INTRO' && (
            <button
              type="button"
              className="hud-icon-btn"
              onClick={handleOpenPause}
              aria-label={isPaused ? 'ادامه‌ی بازی' : 'توقف و تنظیمات'}
            >
              {isPaused ? <Play size={18} /> : <Pause size={18} />}
            </button>
          )}
        </div>
      </header>

      {/* زیرنویس داستانی فارسی */}
      {narrativeCaption && !isPaused && (
        <div className="narrative-caption-bar" dir="rtl" role="status" aria-live="polite">
          <p>{narrativeCaption}</p>
        </div>
      )}

      {/* پنجره‌ی توقف و تنظیمات */}
      {isPaused && (
        <div className="pause-overlay" dir="rtl" role="dialog" aria-modal="true" aria-label="تنظیمات بازی">
          <div className="pause-modal">
            <div className="pause-header">
              <div className="pause-title-group">
                <Sliders size={18} />
                <h2>توقف و تنظیمات</h2>
              </div>
              <button
                type="button"
                className="resume-pill-btn"
                onClick={() => {
                  audioManager.playSfx('ui_tap');
                  setPaused(false);
                }}
              >
                <Play size={15} /> ادامه
              </button>
            </div>

            <div className="settings-section">
              <div className="setting-row">
                <label htmlFor="music-vol">
                  صدای موسیقی (٪{Math.round(musicVolume * 100).toLocaleString('fa-IR')})
                </label>
                <input
                  id="music-vol"
                  dir="ltr"
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                />
              </div>

              <div className="setting-row">
                <label htmlFor="sfx-vol">
                  افکت‌های صوتی محیط (٪{Math.round(sfxVolume * 100).toLocaleString('fa-IR')})
                </label>
                <input
                  id="sfx-vol"
                  dir="ltr"
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={sfxVolume}
                  onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                />
              </div>

              <div className="setting-row">
                <label>کیفیت گرافیکی موبایل</label>
                <div className="graphics-segmented">
                  {profiles.map((prof) => (
                    <button
                      key={prof}
                      type="button"
                      className={`graphics-seg-btn ${graphicsProfile === prof ? 'active' : ''}`}
                      onClick={() => {
                        audioManager.playSfx('ui_tap');
                        setGraphicsProfile(prof);
                      }}
                    >
                      {PROFILE_LABELS[prof]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pause-footer">
              {!confirmRestart ? (
                <button
                  type="button"
                  className="restart-outline-btn"
                  onClick={() => {
                    audioManager.playSfx('ui_tap');
                    setConfirmRestart(true);
                  }}
                >
                  <RotateCcw size={15} /> شروع دوباره از ابتدا
                </button>
              ) : (
                <div className="confirm-restart-row">
                  <span>داستان از اول شروع شود؟</span>
                  <button
                    type="button"
                    className="confirm-yes-btn"
                    onClick={() => {
                      audioManager.playSfx('ui_tap');
                      setConfirmRestart(false);
                      restartGame();
                    }}
                  >
                    بله، از ابتدا
                  </button>
                  <button
                    type="button"
                    className="confirm-cancel-btn"
                    onClick={() => setConfirmRestart(false)}
                  >
                    انصراف
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
