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

/**
 * جزئیاتی که بازیکن میتواند ببیند، بدون اینکه کسی آنها را توضیح بدهد.
 * اینها دیالوگ نیستند؛ یادداشتهای محیطاند.
 */
export const AMBIENT_DETAILS: Partial<Record<GameStage, SceneDetail>> = {
  INTRO: {
    label: 'کاشیهای راهرو',
    text: 'بندکش خاکستری کاشیها هنوز توی نور کم معلوم است؛ چراغها یکییکی روشن میشوند.',
  },
  QUESTIONNAIRE: {
    label: 'درهای شمارهدار',
    text: 'ردیف ۲۰۱ تا ۲۰۶ پشت سر هماند. روی در ۲۰۴ یک برگهٔ کوچک چسبانده شده.',
  },
  RELATIONSHIP_QUESTION: {
    label: 'تابلو اعلانات',
    text: 'سوزنهای کج، چند برگهٔ قدیمی و یک گوشهٔ خالی که هنوز کسی پرش نکرده.',
  },
  WORLD_TRANSFORMATION: {
    label: 'رادیاتور قدیمی',
    text: 'کنار دیوار گرم است؛ گرد ریز توی نور مهتابی بالا میرود و رنگ درها برمیگردد.',
  },
  MISSION_1: {
    label: 'تابلوی اشیای پیداشده',
    text: 'چند برگه و یک کارت دانشجویی روی تابلوی کنار کتابخانه دیده میشود.',
  },
  MISSION_2: {
    label: 'نیمکت محوطه',
    text: 'کیف روی نیمکت کنار مسیر ورودی گذاشته شده است.',
  },
  MISSION_3: {
    label: 'تابلوی کوچک پلهها',
    text: 'روی تابلو نوشته «کلاس ۲۰۴ ←». یکی از لنگههای در کمی عقبتر مانده.',
  },
  CLASSROOM_ENTRY: {
    label: 'تختهٔ کلاس ۲۰۴',
    text: 'فهرست ارائهها با ماژیک آبی نوشته شده؛ اسم تو ردیف سوم است و کنارش یک خط تیره کشیده شده.',
  },
  CLASSROOM_GAMEPLAY: {
    label: 'ردیف آخر',
    text: 'از اینجا هم پروژکتور دیده میشود، هم پچپچ ردیفهای جلو. یک خودکار روی میز جا مانده.',
  },
  CLASSROOM_CINEMATIC: {
    label: 'میز دو ردیف جلوتر',
    text: 'برگهٔ پسر صاف شده، ولی خط آخرش خالی است. نوک خودکار دور همان خط چرخیده.',
  },
  LOBBY_ENTRY: {
    label: 'میز کنار پنجره',
    text: 'دو لیوان کاغذی، یک دستمال و همان برگهٔ چاپی کنار هماند؛ یکی از لیوانها نیمهپر است.',
  },
  LOBBY_CINEMATIC: {
    label: 'میز پسر',
    text: 'دفترش بسته است، برگه جلویش مانده. خودکار را برمیدارد و دوباره زمین میگذارد.',
  },
  FINAL_DECISION: {
    label: 'سمت در',
    text: 'نور عصر افتاده روی کف سنگی؛ دستگیرهٔ فلزی زیر همان نور سرد به نظر میرسد.',
  },
  DIALOGUE: {
    label: 'قبل از در',
    text: 'همهمه لابی هست، ولی حرفتان همانجا پیش میرود. برگه همچنان توی دست پسر است.',
  },
  FINAL_ENDING: {
    label: 'بعد از حرف',
    text: 'در همانجا مانده؛ فقط برگه بسته شده و خودکار روی میز گذاشته شده است.',
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
