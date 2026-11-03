import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DIALOGUE_NODES } from './dialogueData';
import { useGameStore } from '../state/gameStore';
import { audioManager } from '../audio/AudioManager';
import { recordDialogueResponse } from '../utils/responseLogger';

export const DialogueOverlay: React.FC = () => {
  const stage = useGameStore((s) => s.stage);
  const answers = useGameStore((s) => s.answers);
  const activeNodeId = useGameStore((s) => s.activeDialogueNodeId);
  const setActiveDialogueNode = useGameStore((s) => s.setActiveDialogueNode);
  const setFemaleDialogueChoice = useGameStore((s) => s.setFemaleDialogueChoice);
  const transitionTo = useGameStore((s) => s.transitionTo);

  const [typingState, setTypingState] = useState<{
    nodeId: string;
    count: number;
    choicesReady: boolean;
  }>({ nodeId: '', count: 0, choicesReady: false });

  const typingIntervalRef = useRef<number | null>(null);
  const choiceTimerRef = useRef<number | null>(null);

  const node = activeNodeId ? DIALOGUE_NODES[activeNodeId] : null;

  const resolvedText = useMemo(() => {
    if (!node) return '';
    return node.dynamicText ? node.dynamicText(answers) : node.text;
  }, [node, answers]);

  useEffect(() => {
    if (typingIntervalRef.current !== null) {
      window.clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    if (choiceTimerRef.current !== null) {
      window.clearTimeout(choiceTimerRef.current);
      choiceTimerRef.current = null;
    }

    if (!node) return;
    const currentId = node.id;
    setTypingState({ nodeId: currentId, count: 0, choicesReady: false });

    const fullLength = resolvedText.length;
    let index = 0;

    typingIntervalRef.current = window.setInterval(() => {
      index += 2;
      if (index >= fullLength) {
        if (typingIntervalRef.current !== null) {
          window.clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        setTypingState({ nodeId: currentId, count: fullLength, choicesReady: false });
        choiceTimerRef.current = window.setTimeout(() => {
          setTypingState({ nodeId: currentId, count: fullLength, choicesReady: true });
        }, 240);
      } else {
        setTypingState({ nodeId: currentId, count: index, choicesReady: false });
        if (index % 8 === 0) {
          audioManager.playSfx('dialogue_soft');
        }
      }
    }, 26);

    return () => {
      if (typingIntervalRef.current !== null) {
        window.clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      if (choiceTimerRef.current !== null) {
        window.clearTimeout(choiceTimerRef.current);
        choiceTimerRef.current = null;
      }
    };
  }, [node, resolvedText]);

  if (stage !== 'DIALOGUE' || !node) return null;

  const revealedCount = typingState.nodeId === node.id ? typingState.count : 0;
  const readyForChoices = typingState.nodeId === node.id ? typingState.choicesReady : false;
  const isFullyTyped = revealedCount >= resolvedText.length && resolvedText.length > 0;
  const visibleText = resolvedText.slice(0, revealedCount);

  const handleAdvance = () => {
    audioManager.playSfx('ui_tap');
    if (!isFullyTyped) {
      if (typingIntervalRef.current !== null) {
        window.clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      if (choiceTimerRef.current !== null) {
        window.clearTimeout(choiceTimerRef.current);
        choiceTimerRef.current = null;
      }
      setTypingState({
        nodeId: node.id,
        count: resolvedText.length,
        choicesReady: true,
      });
      return;
    }

    if (node.choices && node.choices.length > 0) {
      return;
    }

    if (node.nextNodeId) {
      setActiveDialogueNode(node.nextNodeId);
    } else {
      setActiveDialogueNode(null);
      transitionTo('FINAL_ENDING', { withFade: true });
    }
  };

  const handleSelectChoice = (choiceId: string, choiceText: string, nextId: string) => {
    audioManager.playSfx('ui_tap');
    recordDialogueResponse({
      nodeId: node.id,
      speaker: node.speakerLabel ?? (node.speaker === 'male' ? 'او' : 'تو'),
      dialoguePrompt: resolvedText,
      choiceId,
      selectedAnswer: choiceText,
      nextNodeId: nextId,
    });
    setFemaleDialogueChoice(choiceText);
    setActiveDialogueNode(nextId);
  };

  return (
    <div className="dialogue-layer" role="region" aria-label="گفت‌وگوی داستانی">
      {node.choices && readyForChoices && (
        <div className="dialogue-choices" dir="rtl">
          {node.choices.map((c) => (
            <button
              key={c.id}
              type="button"
              className="dialogue-choice-btn persian-rtl"
              onClick={() => handleSelectChoice(c.id, c.text, c.nextNodeId)}
            >
              <span className="choice-dot" />
              <span>{c.text}</span>
            </button>
          ))}
        </div>
      )}

      <div
        className="dialogue-card persian-rtl"
        dir="rtl"
        onClick={handleAdvance}
      >
        <div className="dialogue-header">
          <span className={`speaker-badge speaker-${node.speaker}`}>
            {node.speakerLabel ?? (node.speaker === 'male' ? 'او' : 'تو')}
          </span>
        </div>

        <p className="dialogue-text">{visibleText}</p>

        {(!node.choices || node.choices.length === 0) && (
          <div className="dialogue-footer">
            <button
              type="button"
              className="dialogue-continue-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleAdvance();
              }}
            >
              {isFullyTyped ? 'ادامه ←' : '...'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
