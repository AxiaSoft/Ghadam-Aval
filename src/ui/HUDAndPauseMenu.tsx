import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Clock3,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useGameStore } from '../state/gameStore';
import { GraphicsProfile } from '../types/game';
import { audioManager } from '../audio/AudioManager';
import {
  getAmbientDetail,
  getChapter,
  getDiscoveredDetails,
} from '../narrative/world';

const PROFILE_LABELS: Record<GraphicsProfile, string> = {
  LOW: 'کم',
  MEDIUM: 'معمولی',
  HIGH: 'کامل',
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
  const [notesOpen, setNotesOpen] = useState(false);

  const isOpening = ['INTRO', 'QUESTIONNAIRE', 'RELATIONSHIP_QUESTION', 'RESPECTFUL_ENDING'].includes(stage);
  const chapter = getChapter(stage);
  const ambient = getAmbientDetail(stage);
  const discovered = getDiscoveredDetails(stage);

  useEffect(() => {
    setNotesOpen(false);
  }, [stage]);

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
    setNotesOpen(false);
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

      <header className="minimal-hud" dir="ltr">
        <div className="hud-left">
          {!isOpening && (
            <div className="chapter-tag" dir="rtl">
              <span className="chapter-eyebrow">{chapter.eyebrow}</span>
              <span className="chapter-title">{chapter.title}</span>
              <span className="chapter-place">
                <MapPin size={11} /> {chapter.place}
                <span className="chapter-dot">·</span>
                <Clock3 size={11} /> {chapter.time}
              </span>
            </div>
          )}

          {objectiveHint && !isPaused && (
            <div className="objective-pill" dir="rtl">
              {objectiveHint}
            </div>
          )}

          {ambient && !isPaused && !isOpening && (
            <button
              type="button"
              className="ambient-detail-chip"
              onClick={() => setNotesOpen((open) => !open)}
              aria-label="نمایش جزئیات صحنه"
            >
              <span className="ambient-dot" />
              <span>{ambient.label}</span>
            </button>
          )}
        </div>

        <div className="hud-right">
          {discovered.length > 0 && !isOpening && (
            <button
              type="button"
              className="hud-icon-btn"
              onClick={() => {
                audioManager.playSfx('ui_tap');
                setNotesOpen((open) => !open);
              }}
              aria-label="دفترچه مشاهدات"
            >
              <BookOpen size={18} />
            </button>
          )}

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
              aria-label={isPaused ? 'ادامه بازی' : 'توقف و تنظیمات'}
            >
              {isPaused ? <Play size={18} /> : <Pause size={18} />}
            </button>
          )}
        </div>
      </header>

      {notesOpen && !isPaused && discovered.length > 0 && (
        <aside className="notes-panel" dir="rtl" aria-label="مشاهدات تا اینجا">
          <div className="notes-header">
            <span className="notes-title">
              <BookOpen size={15} /> دفترچه مشاهدات
            </span>
            <button
              type="button"
              className="notes-close-btn"
              onClick={() => setNotesOpen(false)}
              aria-label="بستن دفترچه"
            >
              <X size={16} />
            </button>
          </div>
          <ul className="notes-list">
            {discovered.map((detail) => (
              <li key={detail.label}>
                <strong>{detail.label}</strong>
                <span>{detail.text}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}

      {narrativeCaption && !isPaused && (
        <div className="narrative-caption-bar" dir="rtl" role="status" aria-live="polite">
          <p>{narrativeCaption}</p>
        </div>
      )}

      {isPaused && (
        <div
          className="pause-overlay"
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-label="تنظیمات بازی"
        >
          <div className="pause-modal">
            <div className="pause-header">
              <div className="pause-title-group">
                <Sliders size={18} />
                <h2>چند دقیقه مکث</h2>
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
                  موسیقی (٪{Math.round(musicVolume * 100).toLocaleString('fa-IR')})
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
                  صداهای محیط (٪{Math.round(sfxVolume * 100).toLocaleString('fa-IR')})
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
                <label>کیفیت تصویر</label>
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

              <div className="setting-row">
                <label>کنترلها</label>
                <p className="settings-help">
                  چپ: راه رفتن · راست: چرخش دوربین · دکمه زرد: تعامل با چیزی که نزدیک شدی
                </p>
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
                  <RotateCcw size={15} /> شروع دوباره از اول
                </button>
              ) : (
                <div className="confirm-restart-row">
                  <span>ذخیره پاک شود و از اول شروع کنیم؟</span>
                  <button
                    type="button"
                    className="confirm-yes-btn"
                    onClick={() => {
                      audioManager.playSfx('ui_tap');
                      setConfirmRestart(false);
                      restartGame();
                    }}
                  >
                    بله، از اول
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
