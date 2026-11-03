import { GameStage, SceneDetail } from '../types/game';

export interface ChapterMeta {
  eyebrow: string;
  title: string;
  time: string;
  place: string;
}

/** ترتیب داستان؛ برای ساختن دفترچه مشاهدات تا همین لحظه */
export const STAGE_ORDER: GameStage[] = [
  'INTRO',
  'QUESTIONNAIRE',
  'RELATIONSHIP_QUESTION',
  'RESPECTFUL_ENDING',
  'WORLD_TRANSFORMATION',
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

const FALLBACK_CHAPTER: ChapterMeta = {
  eyebrow: 'قدم اول',
  title: 'یک روز معمولی',
  time: 'همان روز',
  place: 'دانشکده',
};

export const CHAPTERS: Partial<Record<GameStage, ChapterMeta>> = {
  INTRO: {
    eyebrow: 'پیش از شروع',
    title: 'یک روز معمولی',
    time: 'چهارشنبه، ۸:۱۰ صبح',
    place: 'دانشکده',
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
    place: 'محوطه دانشگاه',
  },
  MISSION_1: {
    eyebrow: 'فصل ۱',
    title: 'سه راه',
    time: '۸:۲۰',
    place: 'محوطه دانشگاه',
  },
  MISSION_2: {
    eyebrow: 'فصل ۱',
    title: 'سه شیء',
    time: '۸:۲۴',
    place: 'محوطه دانشگاه',
  },
  MISSION_3: {
    eyebrow: 'فصل ۱',
    title: 'جلوی سرِدر',
    time: '۸:۲۸',
    place: 'جلوی دانشکده',
  },
  CLASSROOM_ENTRY: {
    eyebrow: 'فصل ۲',
    title: 'کلاس ۲۰۴',
    time: '۸:۳۰',
    place: 'کلاس درس',
  },
  CLASSROOM_GAMEPLAY: {
    eyebrow: 'فصل ۲',
    title: 'یک صندلی خالی',
    time: '۸:۳۱',
    place: 'ردیف آخر',
  },
  CLASSROOM_CINEMATIC: {
    eyebrow: 'فصل ۲',
    title: 'یک سوال کوتاه',
    time: '۹:۴۰',
    place: 'کلاس درس',
  },
  LOBBY_ENTRY: {
    eyebrow: 'فصل ۳',
    title: 'لابی',
    time: '۱۰:۰۵',
    place: 'لابی دانشکده',
  },
  LOBBY_CINEMATIC: {
    eyebrow: 'فصل ۳',
    title: 'قبل از زنگ بعدی',
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
    title: 'چند دقیقه مکث',
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

/**
 * جزئیاتی که بازیکن میتواند ببیند، بدون اینکه کسی آنها را توضیح بدهد.
 * اینها دیالوگ نیستند؛ یادداشتهای محیطاند.
 */
export const AMBIENT_DETAILS: Partial<Record<GameStage, SceneDetail>> = {
  INTRO: {
    label: 'پشت پنجره',
    text: 'راهرو هنوز خلوت است؛ چراغها یکییکی روشن میشوند.',
  },
  QUESTIONNAIRE: {
    label: 'روی نیمکت',
    text: 'یک دفتر باز مانده و گوشه صفحهاش با خودکار خط خورده است.',
  },
  RELATIONSHIP_QUESTION: {
    label: 'کنار دیوار',
    text: 'تابلو اعلانات پر است، ولی یک گوشهاش خالی مانده.',
  },
  WORLD_TRANSFORMATION: {
    label: 'کنار پنجره',
    text: 'گرد و غبار توی نور صبح بالا میرود؛ دیوارها دوباره رنگ دارند.',
  },
  MISSION_1: {
    label: 'سر سه راه',
    text: 'روی زمین سه رد رنگ کمرنگ افتاده؛ هیچ تابلویی بالایشان نیست.',
  },
  MISSION_2: {
    label: 'روی پایهها',
    text: 'یک ستاره شیشهای، یک گل و یک کتاب باز. هیچکدام برچسب توضیح ندارند.',
  },
  MISSION_3: {
    label: 'جلوی سرِدر',
    text: 'بوی قهوه از کافه کنار کتابخانه میآید و در نیمهباز است.',
  },
  CLASSROOM_ENTRY: {
    label: 'کلاس ۲۰۴',
    text: 'بخاری کنار تخته صدای ریزی میدهد؛ روی ردیف آخر یک خودکار جا مانده.',
  },
  CLASSROOM_GAMEPLAY: {
    label: 'ردیف آخر',
    text: 'از اینجا هم تخته دیده میشود، هم پچپچ ردیفهای جلو.',
  },
  CLASSROOM_CINEMATIC: {
    label: 'میز چند ردیف جلوتر',
    text: 'خط آخر جزوه خالی مانده؛ نوک خودکار دور همان خط چرخیده است.',
  },
  LOBBY_ENTRY: {
    label: 'کنار پنجره',
    text: 'دو لیوان کاغذی روی میز مانده؛ یکی هنوز نیمهپر است.',
  },
  LOBBY_CINEMATIC: {
    label: 'میز پسر',
    text: 'دفترش باز است، ولی مدتی است چیزی روی آن ننوشته.',
  },
  FINAL_DECISION: {
    label: 'سمت در',
    text: 'نور عصر افتاده روی کف لابی و دستگیره در سرد است.',
  },
  DIALOGUE: {
    label: 'قبل از در',
    text: 'همهمه لابی هست، ولی حرفتان همانجا پیش میرود.',
  },
  FINAL_ENDING: {
    label: 'بعد از حرف',
    text: 'در همانجا مانده؛ فقط دفتر بسته شده است.',
  },
};

export function getChapter(stage: GameStage): ChapterMeta {
  return CHAPTERS[stage] ?? FALLBACK_CHAPTER;
}

export function getAmbientDetail(stage: GameStage): SceneDetail | null {
  return AMBIENT_DETAILS[stage] ?? null;
}

export function getDiscoveredDetails(stage: GameStage): SceneDetail[] {
  const currentIndex = STAGE_ORDER.indexOf(stage);
  if (currentIndex < 0) return [];

  const seen = new Set<string>();
  const details: SceneDetail[] = [];

  for (let i = 0; i <= currentIndex; i += 1) {
    const detail = AMBIENT_DETAILS[STAGE_ORDER[i]];
    if (detail && !seen.has(detail.label)) {
      seen.add(detail.label);
      details.push(detail);
    }
  }

  return details;
}
