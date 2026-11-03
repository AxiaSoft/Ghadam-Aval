import React, { useState } from 'react';
import { QUESTIONNAIRE_STEPS, RELATIONSHIP_PROMPT } from '../dialogue/dialogueData';
import { useGameStore } from '../state/gameStore';
import { audioManager } from '../audio/AudioManager';
import {
  AfternoonChoice,
  AtmosphereChoice,
  BeginningValueChoice,
  HappinessChoice,
  RelationshipAnswer,
} from '../types/game';

export const QuestionnaireUI: React.FC = () => {
  const stage = useGameStore((s) => s.stage);
  const qIndex = useGameStore((s) => s.questionnaireIndex);
  const setQuestionnaireAnswer = useGameStore((s) => s.setQuestionnaireAnswer);
  const advanceQuestionnaire = useGameStore((s) => s.advanceQuestionnaire);
  const answerRelationship = useGameStore((s) => s.answerRelationship);

  const [animatingOut, setAnimatingOut] = useState(false);

  // پرسش‌نامه‌ی شخصیت (۴ گام)
  if (stage === 'QUESTIONNAIRE') {
    const step = QUESTIONNAIRE_STEPS[qIndex];
    if (!step) return null;

    const handlePick = (
      val: HappinessChoice | AfternoonChoice | AtmosphereChoice | BeginningValueChoice
    ) => {
      if (animatingOut) return;
      audioManager.playSfx('ui_tap');
      setQuestionnaireAnswer(step.key, val);
      setAnimatingOut(true);
      window.setTimeout(() => {
        advanceQuestionnaire();
        setAnimatingOut(false);
      }, 310);
    };

    return (
      <div className="story-prompt-layer" dir="ltr">
        <div
          className={`story-question-panel ${animatingOut ? 'fade-step-out' : 'fade-step-in'}`}
          dir="rtl"
        >
          <div className="question-progress-row">
            <span className="question-chapter">{step.chapterLabel}</span>
            <div className="question-dots" aria-hidden="true" dir="ltr">
              {QUESTIONNAIRE_STEPS.map((_, idx) => (
                <span
                  key={idx}
                  className={`q-dot ${idx === qIndex ? 'active' : idx < qIndex ? 'done' : ''}`}
                />
              ))}
            </div>
          </div>

          <h2 className="story-question-title">{step.question}</h2>

          <div className="story-options-grid">
            {step.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="story-option-btn"
                onClick={() => handlePick(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // سوال آخر (وضعیت رابطه — فقط دو گزینه‌ی «بله، هستم.» و «نه، نیستم.»)
  if (stage === 'RELATIONSHIP_QUESTION') {
    const handleRel = (ans: RelationshipAnswer) => {
      audioManager.playSfx('ui_tap');
      answerRelationship(ans);
    };

    return (
      <div className="story-prompt-layer" dir="ltr">
        <div className="story-question-panel fade-step-in" dir="rtl">
          <div className="question-progress-row">
            <span className="question-chapter">{RELATIONSHIP_PROMPT.chapterLabel}</span>
          </div>

          <h2 className="story-question-title">{RELATIONSHIP_PROMPT.question}</h2>

          <div className="story-options-stack">
            <button
              type="button"
              className="story-option-btn"
              onClick={() => handleRel('yes')}
            >
              <span className="option-letter">۱.</span> {RELATIONSHIP_PROMPT.options.yes}
            </button>
            <button
              type="button"
              className="story-option-btn highlight-subtle"
              onClick={() => handleRel('no')}
            >
              <span className="option-letter">۲.</span> {RELATIONSHIP_PROMPT.options.no}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
