import {
  MissionObjectChoice,
  PathColorChoice,
  QuestionnaireAnswers,
  RelationshipAnswer,
} from '../types/game';
import { QUESTIONNAIRE_STEPS, RELATIONSHIP_PROMPT } from '../dialogue/dialogueData';

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

const SESSION_STORAGE_KEY = 'the_first_move_response_session_v1';

const PATH_LABELS: Record<PathColorChoice, string> = {
  blue: 'مسیر آبی (آرامش و عمق)',
  pink: 'مسیر صورتی (صمیمیت و گرما)',
  gold: 'مسیر طلایی (امید و روشنایی)',
};

const OBJECT_LABELS: Record<MissionObjectChoice, string> = {
  star: 'ستاره بلورین',
  flower: 'گل روشن',
  book: 'کتاب گشوده',
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
        console.warn('[ResponseLogger] Could not sync responses to src/playerResponses.json:', err);
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

export function recordQuestionnaireResponse(
  key: keyof QuestionnaireAnswers,
  answerId: string
): void {
  const step = QUESTIONNAIRE_STEPS.find((s) => s.key === key);
  const option = step?.options.find((o) => o.id === answerId);
  const now = new Date().toISOString();

  const entry: LoggedQuestionnaireAnswer = {
    stepKey: key,
    chapterLabel: step?.chapterLabel ?? String(key),
    question: step?.question ?? String(key),
    answerId,
    answerText: option?.label ?? answerId,
    answeredAt: now,
  };

  const filtered = currentSession.questionnaireResponses.filter((r) => r.stepKey !== key);
  currentSession = {
    ...currentSession,
    updatedAt: now,
    questionnaireResponses: [...filtered, entry],
  };

  saveSessionLocally(currentSession);
  enqueueServerSync(currentSession);
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
