import { GameStage, MusicTrackId } from '../types/game';

/**
 * ============================================================================
 * راهنمای فایل‌های موسیقی پس‌زمینه و صداهای محیطی (همهمه و راه رفتن):
 * - موسیقی‌های زمینه در پوشه‌ی `src/audio/tracks/` قرار دارند.
 * - صداهای همهمه و قدم زدن (راه رفتن) در پوشه‌ی `src/audio/sfx/` قرار دارند.
 *
 * برای جایگزینی هر صدا با فایل دلخواه خودت:
 *   کافی است فایل `.mp3` خودت را با همان نام داخل پوشه‌ی مربوطه کپی کنی،
 *   یا نام فایل جدیدت را در جدول‌های همین فایل تغییر بدهی.
 * ============================================================================
 */

export interface MusicTrackConfig {
  id: Exclude<MusicTrackId, 'none'>;
  /** مسیر فایل صوتی از پوشه‌ی src/audio/tracks/ */
  url: string;
  /** نام فارسی و توضیح حال‌وهوای قطعه */
  titleFa: string;
  moodFa: string;
  /** تنظیم بلندی نسبی این قطعه (بین 0.0 تا 1.5 — پیش‌فرض 1.0) */
  volumeScale: number;
}

export const MUSIC_TRACK_FILES: Record<Exclude<MusicTrackId, 'none'>, MusicTrackConfig> = {
  intro_cold: {
    id: 'intro_cold',
    url: new URL('./tracks/01_intro_cold.mp3', import.meta.url).href,
    titleFa: '۱. صفحه‌ی شروع — دنیای خاکستری و ساکت',
    moodFa: 'مینیمال، خلوت و رازآلود (پیانوی آرام و صدای باد ملایم)',
    volumeScale: 0.95,
  },
  questionnaire_mystery: {
    id: 'questionnaire_mystery',
    url: new URL('./tracks/02_questionnaire_mystery.mp3', import.meta.url).href,
    titleFa: '۲. بخش سوال‌ها — تامل و کنجکاوی',
    moodFa: 'صمیمی و تامل‌برانگیز (آرپژ پیانو و زنگوله‌های لطیف)',
    volumeScale: 0.95,
  },
  transformation_uplift: {
    id: 'transformation_uplift',
    url: new URL('./tracks/03_transformation_uplift.mp3', import.meta.url).href,
    titleFa: '۳. کات‌سین رنگی شدن دنیا — طلوع امید',
    moodFa: 'امیدبخش، روشن و شکوفاشونده (اوج‌گیری زهی‌های گرم و پیانو)',
    volumeScale: 1.0,
  },
  missions_adventure: {
    id: 'missions_adventure',
    url: new URL('./tracks/04_missions_adventure.mp3', import.meta.url).href,
    titleFa: '۴. مراحل ۱ تا ۳ — قدم‌زدن تا دانشگاه',
    moodFa: 'رویایی، ملایم و دلنشین در فضای باز',
    volumeScale: 0.95,
  },
  classroom_calm: {
    id: 'classroom_calm',
    url: new URL('./tracks/05_classroom_calm.mp3', import.meta.url).href,
    titleFa: '۵. فضای کلاس درس — آرامش صبحگاهی',
    moodFa: 'خلوت، آرام و ملایم مناسب فضای کلاس',
    volumeScale: 0.85,
  },
  classroom_ending: {
    id: 'classroom_ending',
    url: new URL('./tracks/06_classroom_ending.mp3', import.meta.url).href,
    titleFa: '۶. کات‌سین کلاس و پایان محترمانه — نگاه ناگفته',
    moodFa: 'احساسی، نوستالژیک و آرام (ویولنسل و پیانو)',
    volumeScale: 0.95,
  },
  lobby_warm: {
    id: 'lobby_warm',
    url: new URL('./tracks/07_lobby_warm.mp3', import.meta.url).href,
    titleFa: '۷. لابی دانشگاه و دیالوگ اصلی — گرمای عصرگاهی',
    moodFa: 'گرم، عاشقانه‌ی آرام و صمیمی (تم اصلی گفت‌وگوی پسر و دختر)',
    volumeScale: 0.95,
  },
  final_hopeful: {
    id: 'final_hopeful',
    url: new URL('./tracks/08_final_hopeful.mp3', import.meta.url).href,
    titleFa: '۸. صفحه‌ی پایانی — شروع یک آشنایی قشنگ',
    moodFa: 'روشن، شیرین و امیدوارکننده برای تیتراژ و جمله‌ی پایانی',
    volumeScale: 1.0,
  },
};

/**
 * فایل‌های صوتی همهمه‌ی جمعیت (کلاس و لابی) و صدای قدم‌زدن / راه رفتن در `src/audio/sfx/`
 */
export const SFX_AUDIO_FILES = {
  /** صدای همهمه‌ی دانشجویان در لابی دانشگاه (پخش مداوم و لوپ در لابی) */
  lobbyMurmur: new URL('./sfx/sfx_lobby_murmur.mp3', import.meta.url).href,
  /** صدای همهمه‌ی آرام و پچ‌پچ دانشجویان در کلاس درس */
  classroomMurmur: new URL('./sfx/sfx_classroom_murmur.mp3', import.meta.url).href,
  /** ۴ تنوع صدای قدم‌زدن طبیعی کفش روی سنگ/سرامیک */
  footsteps: [
    new URL('./sfx/sfx_footstep_1.mp3', import.meta.url).href,
    new URL('./sfx/sfx_footstep_2.mp3', import.meta.url).href,
    new URL('./sfx/sfx_footstep_3.mp3', import.meta.url).href,
    new URL('./sfx/sfx_footstep_4.mp3', import.meta.url).href,
  ],
};

/**
 * مشخص می‌کند در هر مرحله از بازی کدام موسیقی پخش شود
 */
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
