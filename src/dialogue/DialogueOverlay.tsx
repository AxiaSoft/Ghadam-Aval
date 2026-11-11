import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DIALOGUE_NODES } from './dialogueData';
import { isRecommendedChoice } from './recommendedChoices';
import { DialogueNode } from '../types/game';
import { useGameStore } from '../state/gameStore';
import { audioManager } from '../audio/AudioManager';
import { recordDialogueResponse } from '../utils/responseLogger';

type DialogueChoice = NonNullable<DialogueNode['choices']>[number];

interface TypingState {
  nodeId: string;
  count: number;
  choicesReady: boolean;
}

export const DialogueOverlay: React.FC = () => {
  const stage = useGameStore((s) => s.stage);
  const answers = useGameStore((s) => s.answers);
  const activeNodeId = useGameStore((s) => s.activeDialogueNodeId);
  const reducedMotion = useGameStore((s) => s.reducedMotion);
  const setActiveDialogueNode = useGameStore((s) => s.setActiveDialogueNode);
  const setFemaleDialogueChoice = useGameStore((s) => s.setFemaleDialogueChoice);
  const setEndingVariant = useGameStore((s) => s.setEndingVariant);
  const transitionTo = useGameStore((s) => s.transitionTo);

  const [typingState, setTypingState] = useState<TypingState>({
    nodeId: '',
    count: 0,
    choicesReady: false,
  });

  const typingIntervalRef = useRef<number | null>(null);
  const choiceTimerRef = useRef<number | null>(null);
  const advanceRef = useRef<() => void>(() => {});

  const node = activeNodeId ? DIALOGUE_NODES[activeNodeId] : null;

  const resolvedText = useMemo(() => {
    if (!node) return '';
    return node.dynamicText ? node.dynamicText(answers) : node.text;
  }, [node, answers]);

  const clearTimers = () => {
    if (typingIntervalRef.current !== null) {
      window.clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    if (choiceTimerRef.current !== null) {
      window.clearTimeout(choiceTimerRef.current);
      choiceTimerRef.current = null;
    }
  };

  useEffect(() => {
    clearTimers();
    if (!node) return;

    const currentId = node.id;
    const fullLength = resolvedText.length;

    if (reducedMotion) {
      setTypingState({ nodeId: currentId, count: fullLength, choicesReady: true });
      return;
    }

    setTypingState({ nodeId: currentId, count: 0, choicesReady: false });
    let index = 0;

    typingIntervalRef.current = window.setInterval(() => {
      index += 2;
      if (index >= fullLength) {
        clearTimers();
        setTypingState({ nodeId: currentId, count: fullLength, choicesReady: false });
        choiceTimerRef.current = window.setTimeout(() => {
          setTypingState({ nodeId: currentId, count: fullLength, choicesReady: true });
        }, 180);
      } else {
        setTypingState({ nodeId: currentId, count: index, choicesReady: false });
        if (index % 10 === 0) {
          audioManager.playSfx('dialogue_soft');
        }
      }
    }, 22);

    return clearTimers;
  }, [node, resolvedText, reducedMotion]);

  useEffect(() => {
    if (stage !== 'DIALOGUE' || !node) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        advanceRef.current();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [stage, node]);

  if (stage !== 'DIALOGUE' || !node) return null;

  const revealedCount = typingState.nodeId === node.id ? typingState.count : 0;
  const readyForChoices =
    typingState.nodeId === node.id ? typingState.choicesReady : false;
  const isFullyTyped = revealedCount >= resolvedText.length && resolvedText.length > 0;
  const visibleText = resolvedText.slice(0, revealedCount);
  const speaker =
    node.speakerLabel ?? (node.speaker === 'male' ? 'پسر' : 'تو');

  const revealAll = () => {
    clearTimers();
    setTypingState({
      nodeId: node.id,
      count: resolvedText.length,
      choicesReady: true,
    });
  };

  const advance = () => {
    audioManager.playSfx('ui_tap');

    if (!isFullyTyped) {
      revealAll();
      return;
    }

    if (node.choices && node.choices.length > 0) return;

    if (node.nextNodeId) {
      setActiveDialogueNode(node.nextNodeId);
    } else {
      setActiveDialogueNode(null);
      transitionTo('FINAL_ENDING', { withFade: true });
    }
  };

  advanceRef.current = advance;

  const handleSelectChoice = (choice: DialogueChoice) => {
    audioManager.playSfx('ui_tap');
    recordDialogueResponse({
      nodeId: node.id,
      speaker,
      dialoguePrompt: resolvedText,
      choiceId: choice.id,
      selectedAnswer: choice.text,
      nextNodeId: choice.nextNodeId,
    });
    setFemaleDialogueChoice(choice.text);
    if (choice.endingVariant) setEndingVariant(choice.endingVariant);
    setActiveDialogueNode(choice.nextNodeId);
  };

  return (
    <div className="dialogue-layer" role="region" aria-label="گفتوگوی داستانی">
      {node.choices && readyForChoices && (
        <div className="dialogue-choices" dir="rtl">
          {node.choices.map((choice, idx) => (
            <button
              key={choice.id}
              type="button"
              className={`dialogue-choice-btn persian-rtl ${isRecommendedChoice(node.id, choice.id) ? 'is-recommended' : ''}`}
              onClick={() => handleSelectChoice(choice)}
            >
              <span className="dialogue-choice-index">
                {(idx + 1).toLocaleString('fa-IR')}
              </span>
              <span className="dialogue-choice-label">{choice.text}</span>
            </button>
          ))}
        </div>
      )}

      <div className="dialogue-card persian-rtl" dir="rtl" onClick={advance}>
        <div className="dialogue-topline">
          <span className={`speaker-badge speaker-${node.speaker}`}>{speaker}</span>
          {node.beatLabel && <span className="dialogue-beat">{node.beatLabel}</span>}
          {!isFullyTyped && (
            <button
              type="button"
              className="dialogue-skip-btn"
              onClick={(event) => {
                event.stopPropagation();
                revealAll();
              }}
            >
              نمایش کامل
            </button>
          )}
        </div>

        {node.sceneNote && <p className="dialogue-scene-note">{node.sceneNote}</p>}

        <p className="dialogue-text" aria-live="polite">
          {visibleText}
          {!isFullyTyped && <span className="dialogue-caret" aria-hidden="true" />}
        </p>

        {(!node.choices || node.choices.length === 0) && (
          <div className="dialogue-footer">
            <button
              type="button"
              className="dialogue-continue-btn"
              onClick={(event) => {
                event.stopPropagation();
                advance();
              }}
            >
              {isFullyTyped ? 'ادامه' : 'نمایش کامل'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
