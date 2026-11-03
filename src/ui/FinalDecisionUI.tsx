import React, { useEffect, useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { audioManager } from '../audio/AudioManager';

export const FinalDecisionUI: React.FC = () => {
  const stage = useGameStore((s) => s.stage);
  const finalDecision = useGameStore((s) => s.finalDecision);
  const chooseFinalDecision = useGameStore((s) => s.chooseFinalDecision);
  const setNarrativeCaption = useGameStore((s) => s.setNarrativeCaption);

  const [linger, setLinger] = useState(false);

  useEffect(() => {
    if (!linger) return;

    setNarrativeCaption(
      'هنوز نرفتی. لیوانت را روی میز میگذاری و یک لحظه به پنجره نگاه میکنی.'
    );

    const timer = window.setTimeout(() => {
      setNarrativeCaption(null);
      setLinger(false);
    }, 2600);

    return () => {
      window.clearTimeout(timer);
      setNarrativeCaption(null);
    };
  }, [linger, setNarrativeCaption]);

  if (stage !== 'FINAL_DECISION' || finalDecision !== null) return null;

  const handleLeaveLobby = () => {
    audioManager.playSfx('ui_tap');
    setLinger(false);
    chooseFinalDecision('leave_trigger');
  };

  const handleStay = () => {
    audioManager.playSfx('ui_tap');
    setLinger(true);
  };

  return (
    <div className="final-decision-dock" dir="rtl" role="region" aria-label="خروج از لابی">
      <div className="final-decision-header">
        <span className="decision-eyebrow">لابی / قبل از در</span>
        <span className="decision-sub">با جویاستیک هم میشود سمت در رفت</span>
      </div>

      {!linger && (
        <div className="final-decision-buttons">
          <button
            type="button"
            className="decision-choice-btn primary"
            onClick={handleLeaveLobby}
          >
            <span className="decision-idx">۱</span>
            <span>بلند شوم و سمت در بروم</span>
          </button>
          <button type="button" className="decision-choice-btn" onClick={handleStay}>
            <span className="decision-idx">۲</span>
            <span>یک کم دیگر همینجا بمانم</span>
          </button>
        </div>
      )}
    </div>
  );
};
