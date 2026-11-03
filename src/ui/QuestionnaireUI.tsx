import React, { useEffect, useRef, useState } from 'react';
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
  const regressQuestionnaire = useGameStore((s) => s.regressQuestionnaire);
  const answerRelationship = useGameStore((s) => s.answerRelationship);

  const [animatingOut, setAnimatingOut] = useState(false);
  const stepTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (stepTimerRef.current !== null) {
        window.clearTimeout(stepTimerRef.current);
      }
    };
  }, []);

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
      stepTimerRef.current = window.setTimeout(() => {
        advanceQuestionnaire();
        setAnimatingOut(false);
      }, 260);
    };

    const handleBack = () => {
      if (animatingOut || qIndex === 0) return;
      audioManager.playSfx('ui_tap');
      regressQuestionnaire();
    };

    const progress = ((qIndex + 1) / QUESTIONNAIRE_STEPS.length) * 100;

    return (
      <div className="story-prompt-layer" dir="ltr">
        <div
          className={`story-question-panel ${animatingOut ? 'fade-step-out' : 'fade-step-in'}`}
          dir="rtl"
        >
          <div className="question-progress-row">
            <span className="question-chapter">{step.chapterLabel}</span>
            <span className="question-step-count">
              {`${(qIndex + 1).toLocaleString('fa-IR')} / ${QUESTIONNAIRE_STEPS.length.toLocaleString('fa-IR')}`}
            </span>
          </div>

          <div className="question-progress-track" dir="ltr">
            <div className="question-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <h2 className="story-question-title">{step.question}</h2>
          {step.note && <p className="question-note">{step.note}</p>}

          <div className="story-options-grid">
            {step.options.map((opt, idx) => (
              <button
                key={opt.id}
                type="button"
                className="story-option-btn"
                onClick={() => handlePick(opt.id)}
              >
                <span className="option-letter">
                  {(idx + 1).toLocaleString('fa-IR')}.
                </span>{' '}
                {opt.label}
              </button>
            ))}
          </div>

          <div className="question-panel-footer">
            {step.hint && <p className="question-hint">{step.hint}</p>}
            {qIndex > 0 && (
              <button type="button" className="text-quiet-btn" onClick={handleBack}>
                سوال قبلی
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

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
          <p className="question-note relationship-note">{RELATIONSHIP_PROMPT.note}</p>

          <div className="story-options-stack">
            <button type="button" className="story-option-btn" onClick={() => handleRel('yes')}>
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
