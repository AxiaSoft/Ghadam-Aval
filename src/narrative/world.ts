import { GameStage } from '../types/game';

export interface ChapterMeta {
  eyebrow: string;
  title: string;
  time: string;
  place: string;
}

const FALLBACK_CHAPTER: ChapterMeta = {
  eyebrow: 'قدم اول',
  title: 'یک روز قبل از کلاس',
  time: 'همان روز',
  place: 'دانشکده',
};

export const CHAPTERS: Partial<Record<GameStage, ChapterMeta>> = {
  INTRO: {
    eyebrow: 'پیش از شروع',
    title: 'روز ارائه',
    time: 'چهارشنبه، ۸:۱۰ صبح',
    place: 'راهروی طبقه دوم',
  },
  QUESTIONNAIRE: {
    eyebrow: 'قبل از کلاس',
    title: 'چهار سوال کوچک',
    time: '۸:۱۲',
    place: 'راهروی طبقه دوم',
  },
  RELATIONSHIP_QUESTION: {
    eyebrow: 'یک شرط ساده',
    title: 'احترام به وضعیت تو',
    time: '۸:۱۴',
    place: 'راهروی طبقه دوم',
  },
  RESPECTFUL_ENDING: {
    eyebrow: 'پایان',
    title: 'همینجا میایستیم',
    time: '—',
    place: '—',
  },
  WORLD_TRANSFORMATION: {
    eyebrow: 'فصل ۱',
    title: 'رنگ برمیگردد',
    time: '۸:۱۵',
    place: 'راهروی طبقه دوم',
  },
  MISSION_1: {
    eyebrow: 'فصل ۱',
    title: 'کارت گمشده',
    time: '۸:۲۰',
    place: 'محوطهٔ دانشکده',
  },
  MISSION_2: {
    eyebrow: 'فصل ۱',
    title: 'پیدا شد',
    time: '۸:۲۴',
    place: 'نیمکت محوطه',
  },
  MISSION_3: {
    eyebrow: 'فصل ۱',
    title: 'دم در ۲۰۴',
    time: '۸:۲۸',
    place: 'جلوی کلاس ۲۰۴',
  },
  CLASSROOM_ENTRY: {
    eyebrow: 'فصل ۲',
    title: 'فهرست ارائهها',
    time: '۸:۳۰',
    place: 'کلاس ۲۰۴',
  },
  CLASSROOM_GAMEPLAY: {
    eyebrow: 'فصل ۲',
    title: 'یک صندلی خالی',
    time: '۸:۳۱',
    place: 'ردیف آخر',
  },
  CLASSROOM_CINEMATIC: {
    eyebrow: 'فصل ۲',
    title: 'سوال کوتاه',
    time: '۹:۴۰',
    place: 'کلاس ۲۰۴',
  },
  LOBBY_ENTRY: {
    eyebrow: 'فصل ۳',
    title: 'لابی',
    time: '۱۰:۰۵',
    place: 'لابی دانشکده',
  },
  LOBBY_CINEMATIC: {
    eyebrow: 'فصل ۳',
    title: 'بعد از ارائه',
    time: '۱۰:۱۲',
    place: 'لابی دانشکده',
  },
  FINAL_DECISION: {
    eyebrow: 'فصل ۳',
    title: 'سمت در',
    time: '۱۰:۱۸',
    place: 'لابی دانشکده',
  },
  DIALOGUE: {
    eyebrow: 'فصل ۳',
    title: 'سر همان برگه',
    time: '۱۰:۱۹',
    place: 'جلوی در خروجی',
  },
  FINAL_ENDING: {
    eyebrow: 'پایان این روز',
    title: 'قبل از اینکه بری',
    time: '۱۰:۲۲',
    place: 'لابی دانشکده',
  },
};

export function getChapter(stage: GameStage): ChapterMeta {
  return CHAPTERS[stage] ?? FALLBACK_CHAPTER;
}
