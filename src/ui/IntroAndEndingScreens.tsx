import React from 'react';
import { useGameStore } from '../state/gameStore';
import { audioManager } from '../audio/AudioManager';
import { SCREEN_TEXTS } from '../dialogue/dialogueData';
import { startNewResponseSession } from '../utils/responseLogger';

export const IntroAndEndingScreens: React.FC = () => {
  const stage = useGameStore((s) => s.stage);
  const savedResumeStage = useGameStore((s) => s.savedResumeStage);
  const postGameMenu = useGameStore((s) => s.postGameMenu);
  const unlockAudio = useGameStore((s) => s.unlockAudio);
  const transitionTo = useGameStore((s) => s.transitionTo);
  const resumeSavedJourney = useGameStore((s) => s.resumeSavedJourney);
  const restartGame = useGameStore((s) => s.restartGame);
  const setPostGameMenu = useGameStore((s) => s.setPostGameMenu);

  const handleStart = () => {
    audioManager.unlock();
    unlockAudio();
    audioManager.playSfx('ui_tap');
    startNewResponseSession();
    setPostGameMenu(false);
    transitionTo('QUESTIONNAIRE');
  };

  const handleResume = () => {
    audioManager.unlock();
    unlockAudio();
    audioManager.playSfx('ui_tap');
    resumeSavedJourney();
  };

  const handleRestart = () => {
    audioManager.unlock();
    unlockAudio();
    audioManager.playSfx('ui_tap');
    restartGame();
  };

  const handleReturnToMenu = () => {
    audioManager.unlock();
    unlockAudio();
    audioManager.playSfx('ui_tap');
    setPostGameMenu(true);
    transitionTo('INTRO', { force: true, withFade: true });
  };

  // ۱. صفحه‌ی آغازین — حالت عادی (ابتدای بازی)
  if (stage === 'INTRO' && !postGameMenu) {
    return (
      <div className="cinematic-screen intro-screen" dir="ltr">
        <div className="intro-content" dir="rtl">
          <h1 className="cinematic-main-title">{SCREEN_TEXTS.mainTitle}</h1>
          <p className="cinematic-subtitle">{SCREEN_TEXTS.introDescription}</p>

          <div className="intro-actions">
            <button type="button" className="primary-cta-btn" onClick={handleStart}>
              {SCREEN_TEXTS.startButton}
            </button>
            {savedResumeStage && (
              <button type="button" className="secondary-ghost-btn" onClick={handleResume}>
                {SCREEN_TEXTS.resumeButton}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ۲. صفحه‌ی آغازین — حالت بعد از پایان بازی (دو نفر کنار هم در فضا زیبا)
  if (stage === 'INTRO' && postGameMenu) {
    return (
      <div className="cinematic-screen intro-screen intro-postgame" dir="ltr">
        <div className="postgame-card" dir="rtl">
          <div className="postgame-visual">
            <span className="postgame-eyebrow">{SCREEN_TEXTS.soonMeetText}</span>
            <div className="postgame-couple">
              <div className="postgame-char male-char" aria-label="پسر" />
              <div className="postgame-char female-char" aria-label="دختر" />
              <div className="postgame-bubble">
                «خیلی خوشحالم که در این cuarേ Stopped به هم رسیدیم...» 💭
              </div>
            </div>
          </div>

          <div className="postgame-actions">
            <button type="button" className="primary-cta-btn postgame-start-btn" onClick={handleStart}>
              {SCREEN_TEXTS.startButton}
            </button>
            {savedResumeStage && (
              <button type="button" className="secondary-ghost-btn" onClick={handleResume}>
                {SCREEN_TEXTS.resumeButton}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ۳. پایان محترمانه — در صورت «بله، هستم.»
  if (stage === 'RESPECTFUL_ENDING') {
    return (
      <div className="cinematic-screen ending-screen" dir="rtl">
        <div className="ending-card">
          <span className="cinematic-eyebrow">{SCREEN_TEXTS.respectfulHeader}</span>
          <p className="respectful-message">{SCREEN_TEXTS.respectfulYesMessage}</p>
          <div className="ending-actions">
            <button type="button" className="secondary-ghost-btn" onClick={handleReturnToMenu}>
              {SCREEN_TEXTS.returnToStartButton}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ۴. صفحه‌ی پایانی داستان
  if (stage === 'FINAL_ENDING') {
    return (
      <div className="cinematic-screen final-screen" dir="rtl">
        <div className="final-card">
          <span className="cinematic-eyebrow">{SCREEN_TEXTS.finalHeader}</span>
          <h1 className="final-persian-title">{SCREEN_TEXTS.finalTitle}</h1>
          <p className="final-persian-quote">{SCREEN_TEXTS.finalQuote}</p>
          <div className="ending-actions">
            <button type="button" className="secondary-ghost-btn warm" onClick={handleReturnToMenu}>
              {SCREEN_TEXTS.playAgainButton}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
