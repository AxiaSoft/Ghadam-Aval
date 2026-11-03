import React from 'react';
import { useGameStore } from '../state/gameStore';
import { SCREEN_TEXTS } from '../dialogue/dialogueData';

export const LoadingScreen: React.FC = () => {
  const loaded = useGameStore((s) => s.essentialAssetsLoaded);
  const progress = useGameStore((s) => s.loadingProgress);
  const label = useGameStore((s) => s.loadingLabel);

  if (loaded) return null;

  const safeProgress = Math.max(0, Math.min(100, progress));
  const noteIndex = Math.min(
    SCREEN_TEXTS.loadingNotes.length - 1,
    Math.floor(safeProgress / 26)
  );

  return (
    <div className="loading-screen" dir="rtl" role="status" aria-live="polite">
      <div className="loading-inner">
        <span className="loading-eyebrow">{SCREEN_TEXTS.loadingEyebrow}</span>
        <h1 className="loading-title">{SCREEN_TEXTS.loadingTitle}</h1>

        <div className="loading-bar-track" dir="ltr">
          <div className="loading-bar-fill" style={{ width: `${Math.max(6, safeProgress)}%` }} />
        </div>

        <div className="loading-meta">
          <span>{label}</span>
          <span>٪{Math.round(safeProgress).toLocaleString('fa-IR')}</span>
        </div>

        <p className="loading-note">{SCREEN_TEXTS.loadingNotes[noteIndex]}</p>
      </div>
    </div>
  );
};
