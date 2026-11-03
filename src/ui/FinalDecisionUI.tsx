import React from 'react';
import { useGameStore } from '../state/gameStore';
import { audioManager } from '../audio/AudioManager';

export const FinalDecisionUI: React.FC = () => {
  const stage = useGameStore((s) => s.stage);
  const finalDecision = useGameStore((s) => s.finalDecision);
  const chooseFinalDecision = useGameStore((s) => s.chooseFinalDecision);

  if (stage !== 'FINAL_DECISION' || finalDecision !== null) return null;

  const handleLeaveLobby = () => {
    audioManager.playSfx('ui_tap');
    chooseFinalDecision('leave_trigger');
  };

  return (
    <div className="final-decision-dock" dir="rtl" role="region" aria-label="خروج از لابی">
      <div className="final-decision-header">
        <span className="decision-eyebrow">لابی دانشگاه</span>
        <span className="decision-sub">یا با جوی‌استیک به سمت درِ خروجی قدم بزن</span>
      </div>
      <div className="final-decision-buttons">
        <button
          type="button"
          className="decision-choice-btn primary"
          onClick={handleLeaveLobby}
        >
          <span>حرکت به سمت درِ خروجی لابی برای رفتن</span>
        </button>
      </div>
    </div>
  );
};
