import React from 'react';
import { useGameStore } from '../state/gameStore';
import { audioManager } from '../audio/AudioManager';
import { RelationshipAnswer } from '../types/game';

const QUESTIONS = [
  'چه چیزی باعث می‌شه یک نفر توی ذهنت با بقیه فرق داشته باشه؟',
  'به نظرت قشنگ‌ترین شکل ابراز علاقه چیه؟',
  'دوست داری که چی ویژگی داشته باشم؟',
  'اگر روزی قسمت شد وارد دنیای زیبات بشم، چه چیزی رو باید درموردت بدونم؟',
];

export const QuestionnaireUI: React.FC = () => {
  const stage = useGameStore((s) => s.stage);
  const qIndex = useGameStore((s) => s.questionnaireIndex);
  const textAnswers = useGameStore((s) => s.textAnswers);
  const setTextAnswer = useGameStore((s) => s.setTextAnswer);
  const advanceQuestionnaire = useGameStore((s) => s.advanceQuestionnaire);
  const regressQuestionnaire = useGameStore((s) => s.regressQuestionnaire);
  const answerRelationship = useGameStore((s) => s.answerRelationship);

  if (stage === 'QUESTIONNAIRE') {
    if (qIndex === 0) {
      return (
        <div className="story-prompt-layer" dir="ltr">
          <div className="story-question-panel welcome-panel fade-step-in" dir="rtl">
            <h2 className="story-question-title">سلام 🙃</h2>
            <p className="question-note">امیدوارم خوب باشی</p>
            <p className="question-note">این بازی فقط مخصوص شما ساخته شده و برای اینکه شروع کنیم چند سوال ازت میپرسم. 😉</p>
            <p className="question-note">ببخشید اگر فضولی میکنما ... 😅</p>
            <p className="question-note">اگر آماده بودی بریم که شروع کنیم 😁</p>
            <button type="button" className="primary-cta-btn" onClick={() => {
              audioManager.playSfx('ui_tap');
              advanceQuestionnaire();
            }}>بریم شروع کنیم</button>
          </div>
        </div>
      );
    }
    const question = QUESTIONS[qIndex - 1];
    if (!question) return null;
    const answer = textAnswers[qIndex - 1] ?? '';
    return (
      <div className="story-prompt-layer joyful-questionnaire" dir="ltr">
        <form className="story-question-panel joyful-panel fade-step-in" dir="rtl" onSubmit={(event) => {
          event.preventDefault();
          if (!answer.trim()) return;
          audioManager.playSfx('ui_tap');
          advanceQuestionnaire();
        }}>
          <div className="question-progress-row">
            <span className="question-chapter">{`سوال ${qIndex.toLocaleString('fa-IR')} از ۴`}</span>
          </div>
          <div className="question-progress-track" dir="ltr">
            <div className="question-progress-fill" style={{ width: `${qIndex * 25}%` }} />
          </div>
          <label className="story-question-title" htmlFor="question-answer">{question}</label>
          <textarea id="question-answer" className="question-text-input" value={answer} maxLength={2000} placeholder="پاسخت رو اینجا بنویس"
            onChange={(event) => setTextAnswer(qIndex - 1, event.target.value)} required rows={4} />
          <div className="question-panel-footer">
            {qIndex > 1 && <button type="button" className="text-quiet-btn" onClick={regressQuestionnaire}>سوال قبلی</button>}
            <button type="submit" className="primary-cta-btn" disabled={!answer.trim()}>{qIndex === 4 ? 'شروع بازی' : 'سوال بعدی'}</button>
          </div>
        </form>
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
        <div className="story-question-panel relationship-panel fade-step-in" dir="rtl">
          <div className="question-progress-row">
            <span className="question-chapter">قبل از شروع</span>
          </div>

          <h2 className="story-question-title">برای اینکه سوالات رو شروع کنم اول بهم بگو الان توی رابطه هستید؟</h2>

          <div className="story-options-stack">
            <button type="button" className="story-option-btn" onClick={() => handleRel('yes')}>
              <span className="option-letter">۱.</span> بله
            </button>
            <button
              type="button"
              className="story-option-btn highlight-subtle"
              onClick={() => handleRel('no')}
            >
              <span className="option-letter">۲.</span> خیر
              <span className="recommendation-badge">ادامهٔ بازی</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
