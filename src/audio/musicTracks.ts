import { GameStage, MusicTrackId } from '../types/game';

/**
 * قطعهها همان هشت فضای قبلین را پوشش میدهند، ولی توضیحشان به جای «حالوهوای کلی»
 * به همان چیزی اشاره میکند که توی صحنه دیده میشود.
 * برای عوض کردن یک صدا، کافی است فایل همان نام را جایگزین کنی یا آدرسش را اینجا تغییر بدهی.
 */

export interface MusicTrackConfig {
  id: Exclude<MusicTrackId, 'none'>;
  url: string;
  titleFa: string;
  moodFa: string;
  volumeScale: number;
}

export const MUSIC_TRACK_FILES: Record<Exclude<MusicTrackId, 'none'>, MusicTrackConfig> = {
  intro_cold: {
    id: 'intro_cold',
    url: new URL('./tracks/01_intro_cold.mp3', import.meta.url).href,
    titleFa: '۱. صفحه شروع — راهروی خلوت',
    moodFa: 'پیانوی آرام و صدای باد پشت پنجره؛ انگار چراغها تازه روشن شدهاند',
    volumeScale: 0.95,
  },
  questionnaire_mystery: {
    id: 'questionnaire_mystery',
    url: new URL('./tracks/02_questionnaire_mystery.mp3', import.meta.url).href,
    titleFa: '۲. چهار سوال کوتاه',
    moodFa: 'آرپژ ملایم و مکثهای کوتاه، مناسب فکر کردن به جوابهای ساده',
    volumeScale: 0.95,
  },
  transformation_uplift: {
    id: 'transformation_uplift',
    url: new URL('./tracks/03_transformation_uplift.mp3', import.meta.url).href,
    titleFa: '۳. رنگ برمیگردد',
    moodFa: 'زهیهای گرم که آرام بالا میآیند؛ همان لحظه افتادن نور روی دیوار',
    volumeScale: 1.0,
  },
  missions_adventure: {
    id: 'missions_adventure',
    url: new URL('./tracks/04_missions_adventure.mp3', import.meta.url).href,
    titleFa: '۴. محوطه تا سرِدر',
    moodFa: 'قدمزدن آرام در هوای باز، بدون هیچ عجله یا هیجان ساختگی',
    volumeScale: 0.95,
  },
  classroom_calm: {
    id: 'classroom_calm',
    url: new URL('./tracks/05_classroom_calm.mp3', import.meta.url).href,
    titleFa: '۵. کلاس ۲۰۴',
    moodFa: 'خلوت صبحگاهی، صدای بخاری و ورق خوردن دفتر',
    volumeScale: 0.85,
  },
  classroom_ending: {
    id: 'classroom_ending',
    url: new URL('./tracks/06_classroom_ending.mp3', import.meta.url).href,
    titleFa: '۶. یک سوال و یک خط خالی',
    moodFa: 'ویولنسل و پیانوی آرام؛ همان مکث کوتاه بعد از زنگ',
    volumeScale: 0.95,
  },
  lobby_warm: {
    id: 'lobby_warm',
    url: new URL('./tracks/07_lobby_warm.mp3', import.meta.url).href,
    titleFa: '۷. لابی، قبل از در',
    moodFa: 'گرمای عصر و همهمهای که موقع گفتوگو کمی عقبتر میرود',
    volumeScale: 0.95,
  },
  final_hopeful: {
    id: 'final_hopeful',
    url: new URL('./tracks/08_final_hopeful.mp3', import.meta.url).href,
    titleFa: '۸. پایان یک روز معمولی',
    moodFa: 'روشن و ساده، بدون اوجگیری اغراقآمیز؛ فقط یک روز که تمام شد',
    volumeScale: 1.0,
  },
};

export const SFX_AUDIO_FILES = {
  lobbyMurmur: new URL('./sfx/sfx_lobby_murmur.mp3', import.meta.url).href,
  classroomMurmur: new URL('./sfx/sfx_classroom_murmur.mp3', import.meta.url).href,
  footsteps: [
    new URL('./sfx/sfx_footstep_1.mp3', import.meta.url).href,
    new URL('./sfx/sfx_footstep_2.mp3', import.meta.url).href,
    new URL('./sfx/sfx_footstep_3.mp3', import.meta.url).href,
    new URL('./sfx/sfx_footstep_4.mp3', import.meta.url).href,
  ],
};

export const STAGE_MUSIC_MAP: Record<GameStage, MusicTrackId> = {
  INTRO: 'intro_cold',
  QUESTIONNAIRE: 'questionnaire_mystery',
  RELATIONSHIP_QUESTION: 'questionnaire_mystery',
  RESPECTFUL_ENDING: 'classroom_ending',
  WORLD_TRANSFORMATION: 'transformation_uplift',
  MISSION_1: 'missions_adventure',
  MISSION_2: 'missions_adventure',
  MISSION_3: 'missions_adventure',
  CLASSROOM_ENTRY: 'classroom_calm',
  CLASSROOM_GAMEPLAY: 'classroom_calm',
  CLASSROOM_CINEMATIC: 'classroom_ending',
  LOBBY_ENTRY: 'lobby_warm',
  LOBBY_CINEMATIC: 'lobby_warm',
  FINAL_DECISION: 'lobby_warm',
  DIALOGUE: 'lobby_warm',
  FINAL_ENDING: 'final_hopeful',
};
