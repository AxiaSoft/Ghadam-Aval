import {
  MissionObjectChoice,
  PathColorChoice,
  QuestionnaireAnswers,
  RelationshipAnswer,
} from '../types/game';
import { RELATIONSHIP_PROMPT } from '../dialogue/dialogueData';

export interface LoggedQuestionnaireAnswer {
  stepKey: keyof QuestionnaireAnswers;
  chapterLabel: string;
  question: string;
  answerId: string;
  answerText: string;
  answeredAt: string;
}

export interface LoggedRelationshipAnswer {
  question: string;
  answerId: RelationshipAnswer;
  answerText: string;
  answeredAt: string;
}

export interface LoggedDialogueAnswer {
  nodeId: string;
  speaker: string;
  dialoguePrompt: string;
  choiceId: string;
  selectedAnswer: string;
  nextNodeId: string;
  answeredAt: string;
}

export interface PlayerSessionLog {
  sessionId: string;
  startedAt: string;
  updatedAt: string;
  questionnaireResponses: LoggedQuestionnaireAnswer[];
  relationshipQuestion: LoggedRelationshipAnswer | null;
  missionChoices: {
    selectedPath: { id: PathColorChoice; label: string } | null;
    selectedObject: { id: MissionObjectChoice; label: string } | null;
  };
  dialogueResponses: LoggedDialogueAnswer[];
}

const SESSION_STORAGE_KEY = 'the_first_move_response_session_v2';

const PATH_LABELS: Record<PathColorChoice, string> = {
  blue: 'زیر خط خالی را مشخص کن',
  pink: 'اول تابلو اعلانات را چک کن',
  gold: 'برگه را ببر سر نیمکت',
};

const OBJECT_LABELS: Record<MissionObjectChoice, string> = {
  star: 'سه اسلاید آخر را مرور کن',
  flower: 'خط خالی را همانجا پر کن',
  book: 'کیف را مرتب کن و دو دقیقه کاری نکن',
};

function createFreshSession(): PlayerSessionLog {
  const now = new Date().toISOString();
  const rand = Math.random().toString(36).slice(2, 8);
  return {
    sessionId: `session_${Date.now()}_${rand}`,
    startedAt: now,
    updatedAt: now,
    questionnaireResponses: [],
    relationshipQuestion: null,
    missionChoices: {
      selectedPath: null,
      selectedObject: null,
    },
    dialogueResponses: [],
  };
}

function loadExistingSession(): PlayerSessionLog {
  if (typeof window === 'undefined') {
    return createFreshSession();
  }
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PlayerSessionLog;
      if (parsed && typeof parsed.sessionId === 'string') {
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }
  const fresh = createFreshSession();
  saveSessionLocally(fresh);
  return fresh;
}

function saveSessionLocally(session: PlayerSessionLog): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore storage quota errors
  }
}

let currentSession: PlayerSessionLog = loadExistingSession();
let syncChain: Promise<void> = Promise.resolve();

function enqueueServerSync(snapshot: PlayerSessionLog): void {
  if (typeof window === 'undefined') return;
  // روی GitHub Pages سروری برای ذخیره فایل وجود ندارد؛ همان localStorage کافی است.
  if (!import.meta.env.DEV) return;
  const payload = JSON.stringify(snapshot);
  syncChain = syncChain
    .then(async () => {
      try {
        await fetch('/api/player-responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        });
      } catch (err) {
        console.warn('[ResponseLogger] Could not sync the local response log:', err);
      }
    })
    .catch(() => {
      // keep queue alive
    });
}

export function startNewResponseSession(): void {
  currentSession = createFreshSession();
  saveSessionLocally(currentSession);
}

export function recordRelationshipResponse(answerId: RelationshipAnswer): void {
  const now = new Date().toISOString();
  const answerText =
    answerId === 'yes' ? RELATIONSHIP_PROMPT.options.yes : RELATIONSHIP_PROMPT.options.no;

  currentSession = {
    ...currentSession,
    updatedAt: now,
    relationshipQuestion: {
      question: RELATIONSHIP_PROMPT.question,
      answerId,
      answerText,
      answeredAt: now,
    },
  };

  saveSessionLocally(currentSession);
  enqueueServerSync(currentSession);
}

export function recordMissionPathResponse(color: PathColorChoice): void {
  const now = new Date().toISOString();
  currentSession = {
    ...currentSession,
    updatedAt: now,
    missionChoices: {
      ...currentSession.missionChoices,
      selectedPath: {
        id: color,
        label: PATH_LABELS[color] ?? color,
      },
    },
  };

  saveSessionLocally(currentSession);
  enqueueServerSync(currentSession);
}

export function recordMissionObjectResponse(obj: MissionObjectChoice): void {
  const now = new Date().toISOString();
  currentSession = {
    ...currentSession,
    updatedAt: now,
    missionChoices: {
      ...currentSession.missionChoices,
      selectedObject: {
        id: obj,
        label: OBJECT_LABELS[obj] ?? obj,
      },
    },
  };

  saveSessionLocally(currentSession);
  enqueueServerSync(currentSession);
}

export function recordDialogueResponse(params: {
  nodeId: string;
  speaker: string;
  dialoguePrompt: string;
  choiceId: string;
  selectedAnswer: string;
  nextNodeId: string;
}): void {
  const now = new Date().toISOString();
  const entry: LoggedDialogueAnswer = {
    nodeId: params.nodeId,
    speaker: params.speaker,
    dialoguePrompt: params.dialoguePrompt,
    choiceId: params.choiceId,
    selectedAnswer: params.selectedAnswer,
    nextNodeId: params.nextNodeId,
    answeredAt: now,
  };

  const filtered = currentSession.dialogueResponses.filter((d) => d.nodeId !== params.nodeId);
  currentSession = {
    ...currentSession,
    updatedAt: now,
    dialogueResponses: [...filtered, entry],
  };

  saveSessionLocally(currentSession);
  enqueueServerSync(currentSession);
}
