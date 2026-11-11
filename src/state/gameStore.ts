import { create } from 'zustand';
import {
  CinematicShot,
  EndingVariant,
  FinalDecisionChoice,
  GameStage,
  GraphicsProfile,
  InteractionTarget,
  MissionObjectChoice,
  PathColorChoice,
  QuestionnaireAnswers,
  RelationshipAnswer,
} from '../types/game';
import {
  recordMissionObjectResponse,
  recordMissionPathResponse,
  recordRelationshipResponse,
  startNewResponseSession,
} from '../utils/responseLogger';

const STORAGE_KEY = 'the_first_move_save_v6';

/**
 * Valid state machine transitions to prevent accidental stage skipping
 */
const VALID_TRANSITIONS: Record<GameStage, GameStage[]> = {
  INTRO: ['QUESTIONNAIRE'],
  QUESTIONNAIRE: ['RELATIONSHIP_QUESTION', 'WORLD_TRANSFORMATION'],
  RELATIONSHIP_QUESTION: ['RESPECTFUL_ENDING', 'QUESTIONNAIRE'],
  RESPECTFUL_ENDING: ['INTRO'],
  WORLD_TRANSFORMATION: ['MISSION_1'],
  MISSION_1: ['MISSION_2'],
  MISSION_2: ['MISSION_3'],
  MISSION_3: ['CLASSROOM_ENTRY'],
  CLASSROOM_ENTRY: ['CLASSROOM_GAMEPLAY'],
  CLASSROOM_GAMEPLAY: ['CLASSROOM_CINEMATIC'],
  CLASSROOM_CINEMATIC: ['LOBBY_ENTRY'],
  LOBBY_ENTRY: ['LOBBY_CINEMATIC'],
  LOBBY_CINEMATIC: ['FINAL_DECISION'],
  FINAL_DECISION: ['DIALOGUE', 'FINAL_ENDING'],
  DIALOGUE: ['FINAL_ENDING'],
  FINAL_ENDING: ['INTRO'],
};

/**
 * Automatically selects a reasonable default graphics profile based on device capabilities
 */
export function detectDefaultGraphicsProfile(): GraphicsProfile {
  if (typeof window === 'undefined') return 'MEDIUM';
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4;
  const prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced || cores <= 2 || memory <= 2) {
    return 'LOW';
  }
  if (cores >= 8 && memory >= 6 && window.devicePixelRatio >= 1.5) {
    return 'HIGH';
  }
  return 'MEDIUM';
}

interface PersistedSave {
  stage: GameStage;
  questionnaireIndex: number;
  textAnswers: string[];
  answers: QuestionnaireAnswers;
  relationshipAnswer: RelationshipAnswer | null;
  selectedPath: PathColorChoice | null;
  selectedObject: MissionObjectChoice | null;
  finalDecision: FinalDecisionChoice | null;
  endingVariant: EndingVariant | null;
  graphicsProfile: GraphicsProfile;
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
}

function loadSavedState(): Partial<PersistedSave> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<PersistedSave>;
  } catch {
    return null;
  }
}

function persistState(data: PersistedSave): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota / private mode restrictions gracefully
  }
}

export interface GameStoreState {
  stage: GameStage;
  savedResumeStage: GameStage | null;
  isTransitioning: boolean;
  fadeOpacity: number;
  isPaused: boolean;
  audioUnlocked: boolean;

  // Progress & narrative state
  questionnaireIndex: number;
  textAnswers: string[];
  answers: QuestionnaireAnswers;
  relationshipAnswer: RelationshipAnswer | null;
  selectedPath: PathColorChoice | null;
  selectedObject: MissionObjectChoice | null;
  finalDecision: FinalDecisionChoice | null;
  endingVariant: EndingVariant | null;
  femaleDialogueChoice: string | null;
  activeDialogueNodeId: string | null;
  waitOutcomeSubstate: 'idle' | 'pausing' | 'he_approaches' | 'choice_shown';

  // Camera & presentation state
  cinematicShot: CinematicShot | null;
  narrativeCaption: string | null;
  objectiveHint: string | null;
  activeInteraction: InteractionTarget | null;
  worldWarmth: number; // 0 = cold gray world, 1 = full warm colorful world

  // Settings
  graphicsProfile: GraphicsProfile;
  reducedMotion: boolean;
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;

  // Loading
  essentialAssetsLoaded: boolean;
  loadingProgress: number;
  loadingLabel: string;

  // Post-game menu state
  postGameMenu: boolean;

  // Actions
  transitionTo: (nextStage: GameStage, options?: { force?: boolean; withFade?: boolean }) => void;
  resumeSavedJourney: () => void;
  unlockAudio: () => void;
  setTextAnswer: (index: number, value: string) => void;
  advanceQuestionnaire: () => void;
  regressQuestionnaire: () => void;
  answerRelationship: (answer: RelationshipAnswer) => void;
  choosePath: (color: PathColorChoice) => void;
  chooseObject: (obj: MissionObjectChoice) => void;
  chooseFinalDecision: (decision: FinalDecisionChoice) => void;
  setWaitOutcomeSubstate: (sub: 'idle' | 'pausing' | 'he_approaches' | 'choice_shown') => void;
  setActiveDialogueNode: (nodeId: string | null) => void;
  setFemaleDialogueChoice: (choiceText: string) => void;
  setEndingVariant: (variant: EndingVariant | null) => void;
  setCinematicShot: (shot: CinematicShot | null) => void;
  setNarrativeCaption: (caption: string | null) => void;
  setObjectiveHint: (hint: string | null) => void;
  setActiveInteraction: (target: InteractionTarget | null) => void;
  setWorldWarmth: (warmth: number) => void;
  setPaused: (paused: boolean) => void;
  setGraphicsProfile: (profile: GraphicsProfile) => void;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  toggleMute: () => void;
  setLoadingState: (progress: number, label: string, done?: boolean) => void;
  setPostGameMenu: (flag: boolean) => void;
  restartGame: () => void;
}

const saved = loadSavedState();
const defaultGraphics = saved?.graphicsProfile ?? detectDefaultGraphicsProfile();
const resumableStages: GameStage[] = [
  'QUESTIONNAIRE',
  'RELATIONSHIP_QUESTION',
  'MISSION_1',
  'MISSION_2',
  'MISSION_3',
  'CLASSROOM_ENTRY',
  'CLASSROOM_GAMEPLAY',
  'LOBBY_ENTRY',
  'FINAL_DECISION',
];

const initialSavedResume =
  saved?.stage && resumableStages.includes(saved.stage) ? saved.stage : null;

export const useGameStore = create<GameStoreState>((set, get) => {
  const syncSave = () => {
    const s = get();
    persistState({
      stage: s.stage,
      questionnaireIndex: s.questionnaireIndex,
      textAnswers: s.textAnswers,
      answers: s.answers,
      relationshipAnswer: s.relationshipAnswer,
      selectedPath: s.selectedPath,
      selectedObject: s.selectedObject,
      finalDecision: s.finalDecision,
      endingVariant: s.endingVariant,
      graphicsProfile: s.graphicsProfile,
      musicVolume: s.musicVolume,
      sfxVolume: s.sfxVolume,
      isMuted: s.isMuted,
    });
  };

  return {
    stage: 'INTRO',
    savedResumeStage: initialSavedResume,
    isTransitioning: false,
    fadeOpacity: 0,
    isPaused: false,
    audioUnlocked: false,

    questionnaireIndex: saved?.questionnaireIndex ?? 0,
    textAnswers: saved?.textAnswers ?? [],
    answers: saved?.answers ?? {},
    relationshipAnswer: saved?.relationshipAnswer ?? null,
    selectedPath: saved?.selectedPath ?? null,
    selectedObject: saved?.selectedObject ?? null,
    finalDecision: saved?.finalDecision ?? null,
    endingVariant: saved?.endingVariant ?? null,
    femaleDialogueChoice: null,
    activeDialogueNodeId: null,
    waitOutcomeSubstate: 'idle',

    cinematicShot: null,
    narrativeCaption: null,
    objectiveHint: null,
    activeInteraction: null,
    worldWarmth: 0,

    graphicsProfile: defaultGraphics,
    reducedMotion:
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches),
    musicVolume: saved?.musicVolume ?? 0.65,
    sfxVolume: saved?.sfxVolume ?? 0.75,
    isMuted: saved?.isMuted ?? false,

    essentialAssetsLoaded: false,
    loadingProgress: 0,
    loadingLabel: 'در حال آماده‌سازی دنیای سه‌بعدی...',
    postGameMenu: false,

    transitionTo: (nextStage, options) => {
      const current = get().stage;
      if (get().isTransitioning && !options?.force) return;
      if (current === nextStage && !options?.force) return;

      const allowed = VALID_TRANSITIONS[current] ?? [];
      if (!options?.force && !allowed.includes(nextStage)) {
        console.warn(`[StateMachine] Blocked invalid transition: ${current} -> ${nextStage}`);
        return;
      }

      const warmStages: GameStage[] = [
        'MISSION_1',
        'MISSION_2',
        'MISSION_3',
        'CLASSROOM_ENTRY',
        'CLASSROOM_GAMEPLAY',
        'CLASSROOM_CINEMATIC',
        'LOBBY_ENTRY',
        'LOBBY_CINEMATIC',
        'FINAL_DECISION',
        'DIALOGUE',
        'FINAL_ENDING',
      ];

      if (options?.withFade) {
        set({ isTransitioning: true, fadeOpacity: 1, activeInteraction: null });
        window.setTimeout(() => {
          set({
            stage: nextStage,
            isTransitioning: false,
            narrativeCaption: null,
            objectiveHint: null,
            cinematicShot: null,
            worldWarmth: warmStages.includes(nextStage)
              ? 1
              : nextStage === 'WORLD_TRANSFORMATION'
                ? get().worldWarmth
                : 0,
          });
          syncSave();
          window.setTimeout(() => {
            set({ fadeOpacity: 0 });
          }, 120);
        }, 420);
      } else {
        set({
          stage: nextStage,
          activeInteraction: null,
          narrativeCaption: null,
          objectiveHint: null,
          worldWarmth: warmStages.includes(nextStage)
            ? 1
            : nextStage === 'WORLD_TRANSFORMATION'
              ? get().worldWarmth
              : 0,
        });
        syncSave();
      }
    },

    resumeSavedJourney: () => {
      const target = get().savedResumeStage;
      if (!target) return;
      // Older saves may contain an index from the removed multiple-choice survey.
      // Restart only that unfinished opening rather than skipping the relationship question.
      const legacyOpening = target === 'QUESTIONNAIRE' && get().relationshipAnswer !== 'no';
      set({ savedResumeStage: null, audioUnlocked: true,
        ...(legacyOpening ? { questionnaireIndex: 0, textAnswers: [] } : {}) });
      get().transitionTo(target, { force: true, withFade: true });
    },

    unlockAudio: () => {
      set({ audioUnlocked: true });
    },

    setTextAnswer: (index, value) => {
      set((s) => {
        const textAnswers = [...s.textAnswers];
        textAnswers[index] = value;
        return { textAnswers };
      });
      syncSave();
    },

    advanceQuestionnaire: () => {
      const idx = get().questionnaireIndex;
      if (idx === 0) {
        get().transitionTo('RELATIONSHIP_QUESTION');
      } else if (idx < 4) {
        set({ questionnaireIndex: idx + 1 });
        syncSave();
      } else if (get().textAnswers.slice(0, 4).filter((answer) => answer?.trim()).length === 4) {
        get().transitionTo('WORLD_TRANSFORMATION');
      }
    },

    regressQuestionnaire: () => {
      const idx = get().questionnaireIndex;
      if (idx > 1) {
        set({ questionnaireIndex: idx - 1 });
        syncSave();
      }
    },

    answerRelationship: (answer) => {
      set({ relationshipAnswer: answer });
      syncSave();
      recordRelationshipResponse(answer);
      if (answer === 'no') {
        set({ questionnaireIndex: 1 });
        get().transitionTo('QUESTIONNAIRE');
      } else {
        get().transitionTo('RESPECTFUL_ENDING', { withFade: true });
      }
    },

    choosePath: (color) => {
      set({ selectedPath: color });
      syncSave();
      recordMissionPathResponse(color);
    },

    chooseObject: (obj) => {
      set({ selectedObject: obj });
      syncSave();
      recordMissionObjectResponse(obj);
    },

    chooseFinalDecision: (decision) => {
      set({ finalDecision: decision, endingVariant: null });
      syncSave();
    },

    setWaitOutcomeSubstate: (sub) => set({ waitOutcomeSubstate: sub }),

    setActiveDialogueNode: (nodeId) => set({ activeDialogueNodeId: nodeId }),

    setFemaleDialogueChoice: (choiceText) => set({ femaleDialogueChoice: choiceText }),

    setEndingVariant: (variant) => {
      set({ endingVariant: variant });
      syncSave();
    },

    setCinematicShot: (shot) => set({ cinematicShot: shot }),

    setNarrativeCaption: (caption) => set({ narrativeCaption: caption }),

    setObjectiveHint: (hint) => set({ objectiveHint: hint }),

    setActiveInteraction: (target) => set({ activeInteraction: target }),

    setWorldWarmth: (warmth) => set({ worldWarmth: Math.max(0, Math.min(1, warmth)) }),

    setPaused: (paused) => set({ isPaused: paused }),

    setGraphicsProfile: (profile) => {
      set({ graphicsProfile: profile });
      syncSave();
    },

    setMusicVolume: (v) => {
      set({ musicVolume: Math.max(0, Math.min(1, v)) });
      syncSave();
    },

    setSfxVolume: (v) => {
      set({ sfxVolume: Math.max(0, Math.min(1, v)) });
      syncSave();
    },

    toggleMute: () => {
      set((s) => ({ isMuted: !s.isMuted }));
      syncSave();
    },

    setLoadingState: (progress, label, done) => {
      set((s) => ({
        loadingProgress: progress,
        loadingLabel: label,
        essentialAssetsLoaded: done !== undefined ? done : s.essentialAssetsLoaded,
      }));
    },

    setPostGameMenu: (flag) => set({ postGameMenu: flag }),

    restartGame: () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      startNewResponseSession();
      set({
        isPaused: false,
        savedResumeStage: null,
        questionnaireIndex: 0,
        textAnswers: [],
        answers: {},
        relationshipAnswer: null,
        selectedPath: null,
        selectedObject: null,
        finalDecision: null,
        endingVariant: null,
        femaleDialogueChoice: null,
        activeDialogueNodeId: null,
        waitOutcomeSubstate: 'idle',
        cinematicShot: null,
        narrativeCaption: null,
        objectiveHint: null,
        activeInteraction: null,
        worldWarmth: 0,
      });
      get().transitionTo('INTRO', { force: true, withFade: true });
    },
  };
});
