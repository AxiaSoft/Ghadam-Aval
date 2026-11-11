import React from 'react';
import { useGameStore } from '../state/gameStore';
import { audioManager } from '../audio/AudioManager';
import { SCREEN_TEXTS } from '../dialogue/dialogueData';
import { getEndingPresentation } from '../narrative/endings';
import { startNewResponseSession } from '../utils/responseLogger';

export const IntroAndEndingScreens: React.FC = () => {
  const stage = useGameStore((s) => s.stage);
  const endingVariant = useGameStore((s) => s.endingVariant);
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
    useGameStore.setState({ questionnaireIndex: 0, textAnswers: [], answers: {}, relationshipAnswer: null });
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

  // ۱. صفحه آغازین
  if (stage === 'INTRO' && !postGameMenu) {
    return (
      <div className="cinematic-screen intro-screen" dir="ltr">
        <div className="intro-content" dir="rtl">
          <h1 className="cinematic-main-title">{SCREEN_TEXTS.mainTitle}</h1>

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

  // ۲. منوی بعد از پایان: همان فضا، بدون نمایش عجیب و غریب
  if (stage === 'INTRO' && postGameMenu) {
    return (
      <div className="cinematic-screen intro-screen intro-postgame" dir="rtl">
        <div className="postgame-card">
          <span className="postgame-eyebrow">{SCREEN_TEXTS.soonMeetText}</span>
          <p className="postgame-note">{SCREEN_TEXTS.postgameNote}</p>

          <div className="postgame-details" aria-hidden="true">
            <span>یک دفتر باز</span>
            <span>یک لیوان نیمهپر</span>
            <span>یک مکث قبل از در</span>
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
            <button type="button" className="text-quiet-btn" onClick={handleRestart}>
              پاک کردن ذخیره و شروع از اول
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ۳. پایان محترمانه، وقتی بازیکن گفته رابطه دارد
  if (stage === 'RESPECTFUL_ENDING') {
    return (
      <div className="cinematic-screen ending-screen" dir="rtl">
        <div className="ending-card">
          <p className="respectful-message">چقدر عالی! 😀</p>
          <p className="respectful-message">امیدوارم پایدار باشید 🙂</p>
          <p className="respectful-message">چون تو رابطه ای زشته که ادامه سوالات رو بپرسم پس برای شما آرزوی موفقیت و خوش بختی میکنم 💙</p>
          <p className="respectful-message">خدافظ 👋🏻😊</p>
          <div className="ending-actions">
            <button type="button" className="secondary-ghost-btn" onClick={handleReturnToMenu}>
              {SCREEN_TEXTS.returnToStartButton}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ۴. تیتراژ نهایی، متناسب با تصمیم آخر
  if (stage === 'FINAL_ENDING') {
    const presentation = getEndingPresentation(endingVariant ?? 'slow');

    return (
      <div className="cinematic-screen final-screen" dir="rtl">
        <div className="final-card">
          <span className="cinematic-eyebrow">{presentation.eyebrow}</span>
          <h1 className="final-persian-title">{presentation.title}</h1>
          <p className="final-persian-quote">{presentation.quote}</p>
          <p className="ending-summary">{presentation.summary}</p>

          {presentation.details.length > 0 && (
            <ul className="ending-detail-list">
              {presentation.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          )}

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
