export type GameStage =
  | 'INTRO'
  | 'QUESTIONNAIRE'
  | 'RELATIONSHIP_QUESTION'
  | 'RESPECTFUL_ENDING'
  | 'WORLD_TRANSFORMATION'
  | 'MISSION_1'
  | 'MISSION_2'
  | 'MISSION_3'
  | 'CLASSROOM_ENTRY'
  | 'CLASSROOM_GAMEPLAY'
  | 'CLASSROOM_CINEMATIC'
  | 'LOBBY_ENTRY'
  | 'LOBBY_CINEMATIC'
  | 'FINAL_DECISION'
  | 'DIALOGUE'
  | 'FINAL_ENDING';

export type GraphicsProfile = 'LOW' | 'MEDIUM' | 'HIGH';

export type HappinessChoice =
  | 'music'
  | 'talking'
  | 'going_out'
  | 'unexpected'
  | 'simple_things';

export type AfternoonChoice =
  | 'cafe'
  | 'walk'
  | 'movie'
  | 'games'
  | 'adventure';

export type AtmosphereChoice =
  | 'starry_sky'
  | 'flowers_gardens'
  | 'city_night'
  | 'minimalist'
  | 'nature';

export type BeginningValueChoice =
  | 'honesty'
  | 'humor'
  | 'attention_to_detail'
  | 'trust'
  | 'time';

export interface QuestionnaireAnswers {
  happiness?: HappinessChoice;
  afternoon?: AfternoonChoice;
  atmosphere?: AtmosphereChoice;
  beginningValue?: BeginningValueChoice;
}

export type RelationshipAnswer = 'yes' | 'no';
export type PathColorChoice = 'blue' | 'pink' | 'gold';
export type MissionObjectChoice = 'star' | 'flower' | 'book';
export type FinalDecisionChoice = 'leave_trigger';

/** نتیجه‌ی گفت‌وگوی آخر؛ برای ساختن تیتراژ متناسب با تصمیم بازیکن */
export type EndingVariant = 'yes' | 'slow' | 'no';

/** یک جزئیات قابل مشاهده در صحنه، جدا از دیالوگ */
export interface SceneDetail {
  label: string;
  text: string;
}

export type MusicTrackId =
  | 'none'
  | 'intro_cold'
  | 'questionnaire_mystery'
  | 'transformation_uplift'
  | 'missions_adventure'
  | 'classroom_calm'
  | 'classroom_ending'
  | 'lobby_warm'
  | 'final_hopeful';

export type SfxId =
  | 'ui_tap'
  | 'footstep'
  | 'door_open'
  | 'chair_move'
  | 'classroom_bell'
  | 'object_interact'
  | 'student_ambience'
  | 'lobby_ambience'
  | 'dialogue_soft';

export type CameraMode =
  | 'FOLLOW'
  | 'CINEMATIC'
  | 'DIALOGUE'
  | 'OVER_SHOULDER'
  | 'FOCUS';

export interface CinematicShot {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov?: number;
  duration?: number;
  ease?: string;
}

export type CharacterPose =
  | 'idle'
  | 'walk'
  | 'sit'
  | 'sit_attentive'
  | 'sit_nervous'
  | 'sit_lean_forward'
  | 'interact'
  | 'greet'
  | 'wait_gesture'
  | 'talk'
  | 'laugh';

export type CharacterEmotion =
  | 'neutral'
  | 'warm_smile'
  | 'shy'
  | 'curious'
  | 'nervous'
  | 'happy_laugh'
  | 'hopeful'
  | 'thoughtful';

export type CharacterGazeBehavior =
  | 'forward'
  | 'target'
  | 'look_backward'
  | 'look_away'
  | 'down_shy'
  | 'wonder_up';

export interface InteractionTarget {
  id: string;
  label: string;
  sublabel?: string;
  position: [number, number, number];
  radius: number;
  accentColor?: string;
  onInteract: () => void;
}

export interface DialogueNode {
  id: string;
  speaker: 'male' | 'female' | 'narrator';
  speakerLabel?: string;
  text: string;
  dynamicText?: (answers: QuestionnaireAnswers) => string;
  rtl?: boolean;
  maleEmotion?: CharacterEmotion;
  femaleEmotion?: CharacterEmotion;
  cameraPreset?: 'male_close' | 'female_close' | 'over_shoulder_male' | 'two_shot';
  /** نشانی کوتاه از زمان و مکان، بالای کارت دیالوگ */
  beatLabel?: string;
  /** یادداشت محیطی کوتاه؛ چیزی که دوربین نشان میدهد، نه چیزی که گفته میشود */
  sceneNote?: string;
  choices?: {
    id: string;
    text: string;
    rtl?: boolean;
    nextNodeId: string;
    endingVariant?: EndingVariant;
  }[];
  nextNodeId?: string | null;
}
