import React from 'react';
import { useGameStore } from '../state/gameStore';
import { SCREEN_TEXTS } from '../dialogue/dialogueData';

export const LoadingScreen: React.FC = () => {
  const loaded = useGameStore((s) => s.essentialAssetsLoaded);
  const progress = useGameStore((s) => s.loadingProgress);
  const label = useGameStore((s) => s.loadingLabel);

  if (loaded) return null;

  return (
    <div className="loading-screen" dir="rtl" role="status" aria-live="polite">
      <div className="loading-inner">
        <h1 className="loading-title">{SCREEN_TEXTS.mainTitle}</h1>
        <div className="loading-bar-track" dir="ltr">
          <div
            className="loading-bar-fill"
            style={{ width: `${Math.max(6, Math.min(100, progress))}%` }}
          />
        </div>
        <div className="loading-meta">
          <span>{label}</span>
          <span>٪{Math.round(progress).toLocaleString('fa-IR')}</span>
        </div>
      </div>
    </div>
  );
};
