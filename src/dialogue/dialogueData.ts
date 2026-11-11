import {
  AfternoonChoice,
  BeginningValueChoice,
  DialogueNode,
  HappinessChoice,
  MissionObjectChoice,
  PathColorChoice,
  QuestionnaireAnswers,
} from '../types/game';

/**
 * تمام متنهای بازی در این فایل است.
 * اصل نوشتن: جمله کوتاه، دلیل مشخص، جزئیات دیدهشده، بدون تکرار گزینه در پاسخ.
 * پسر اسم ندارد؛ در تمام برچسبها فقط «پسر» نوشته میشود.
 */

export const CUTSCENE_MIN_DURATION_MS = 4200;
export const CUTSCENE_MIN_DURATION_SEC = 4.2;

export const DIALOGUE_START_NODE = 'lobby_open';

// ============================================================================
// ۱. صفحهها، بارگذاری و پیامهای کلی
// ============================================================================
export const SCREEN_TEXTS = {
  mainTitle: 'قدم اول',

  startButton: 'شروع این روز',
  resumeButton: 'ادامه از همانجا',

  loadingEyebrow: 'در حال آماده کردن صحنه',
  loadingTitle: 'قدم اول',
  loadingNotes: [
    'اول چراغهای راهرو یکییکی روشن میشوند.',
    'بعد پرینتر کنار کتابخانه یک برگه بیرون میدهد.',
    'روی تخته، فهرست ارائهها نوشته میشود.',
    'در آخر، برگهها روی میز لابی کنار دو لیوان کاغذی میمانند.',
  ],

  returnToStartButton: 'برگشت به صفحه اول',

  finalHeader: 'پایان این روز',
  finalTitle: 'همین یک خط هم کافی بود.',
  finalQuote: '«قدم اول لازم نیست بزرگ باشد.»',
  playAgainButton: 'یک روز دیگر از اول',

  soonMeetText: 'همان فضا، یک بار دیگر',
  postgameNote:
    'هر بار یک جزئیات تازه پیدا میشود: برگهٔ گرم پرینتر، جوهر پخششده، دستمال کاغذی، خودکار روی میز.',
};

// ============================================================================
// ۲. پرسشنامه: هر جواب به یک چیز قابل دیدن تبدیل میشود
// ============================================================================
export const RELATIONSHIP_PROMPT = {
  chapterLabel: 'یک سوال قبل از شروع',
  question: 'برای اینکه سوالات رو شروع کنم اول بهم بگو الان توی رابطه هستید؟',
  note: 'فقط برای اینکه گفتوگو وارد جایی نشود که برایت ناخوشایند باشد.',
  options: {
    yes: 'بله',
    no: 'خیر',
  },
};

// ============================================================================
// ۳. زیرنویس کاتسینها: چیزهایی که دوربین نشان میدهد
// ============================================================================
export const CUTSCENE_CAPTIONS = {
  worldTransform:
    'چراغهای راهرو یکییکی روشن میشوند. رنگ کاشیها و درهای چوبی برمیگردد و صدای قدمها تو راهرو میپیچد.',
  universityEnter:
    'ساعت هشت و بیست و هشت دقیقه است. تابلو کوچک کنار پلهها نوشته «کلاس ۲۰۴ ←» و در نیمهباز است.',
  classroomDoor:
    'روی تخته فهرست ارائهها نوشته شده؛ اسم تو ردیف سوم است. پسر دو ردیف جلوتر برگهاش را صاف کرده.',
  pathChoice: 'کنار پرینتر، برگهٔ آخر هنوز گرم است و خط آخرش سفید مانده.',
  objectChoice: 'روی نیمکت، برگه، خودکار و یک لیوان کاغذی کنار هم گذاشته شدهاند.',
  universityGate: 'سرِدر جلو است. یکی از لنگههای در کمی عقبتر مانده.',

  classroomEntry:
    'کلاس ۲۰۴ هنوز نیمهخالیه. روی تخته فهرست ارائهها نوشته شده؛ اسم تو ردیف سوم است. بخاری کنار تخته صدای ریزی میدهد.',
  classroomBeat1:
    'مینشینی ردیف آخر. پروژکتور روشن است، ولی اسلاید اول هنوز بالا نیامده.',
  classroomBeat2:
    'دو ردیف جلوتر، پسر برگهاش را صاف میکند. خط آخرش مثل برگهٔ تو خالی است.',
  classroomBeat3:
    'قبل از شروع، یک سوال کوتاه میپرسی: «جواب آخرین سوال کدام اسلاید است؟» استاد همان خط را میگوید.',
  classroomBeat4:
    'پسر برمیگردد، نگاهش به برگهٔ تو میافتد، بعد سریع همان خط را مینویسد.',
  classroomBeat5:
    'ارائهات تمام میشود. صدای زیپ کیفها و کشیده شدن صندلیها جای صدای پروژکتور را میگیرد.',
  classroomBeat6:
    'دم در، پسر خودکاری را روی میز میگذارد و کیفش را جابجا میکند؛ هنوز چیزی نمیگوید.',

  lobbyBeat1:
    'لابی پر از صدای آدم است. روی میز کنار پنجره، دو لیوان کاغذی، یک دستمال و یک برگهٔ چاپی مانده.',
  lobbyBeat2:
    'تو روبهروی دوستت نشستی. دربارهٔ ارائه و همان خط خالی حرف میزنید، نه دربارهٔ چیز دیگری.',
  lobbyBeat3:
    'پسر یک میز آنورتر تنها نشسته. برگهاش را جلویش گذاشته و دفترش را بسته، ولی هنوز نرفته.',
  lobbyBeat4:
    'یک بار به برگه نگاه میکند، یک بار به در. بعد خودکارش را برمیدارد و دوباره میگذارد.',
  lobbyBeat5:
    'دوستت میگوید «حداقل خوب پیش رفت» و بلند میشود. بیرون، نور عصر افتاده روی کف لابی.',
  lobbyBeat6:
    'پسر دستش را میگذارد روی میز، انگار بلند شود؛ ولی دوباره مینشیند.',
  lobbyBeat7:
    'بالاخره برگه را برمیدارد. نه با عجله، فقط انگار تصمیمش را گرفته.',
  lobbyReadyToLeave: 'حرفتان تمام میشود. کیفت را برمیداری و سمت در راه میافتی.',
  lobbyLeavingTrigger:
    'پشت سرت صدای صندلی میآید. پسر بلند شده، برگهاش را گرفته و دارد میآید.',
};

// ============================================================================
// ۴. مرحلهٔ ۱ و ۲: یک خط داستانی پیوسته، بهجای سه راه و سه شیء
// ============================================================================
export interface StoryChoiceOption<T extends string> {
  id: T;
  label: string;
  sublabel: string;
  response: string;
  pos: [number, number, number];
  accent: string;
}

export const PRECLASS_OPTIONS: StoryChoiceOption<PathColorChoice>[] = [
  {
    id: 'blue',
    label: 'زیر خط خالی را همانجا مشخص کن',
    sublabel: 'با همان خودکار توی کیفت',
    response: 'یک خط نازک زیر سفیدی میکشی. حداقل سر کلاس میدانی دنبال چی میگردی.',
    pos: [-2.2, 0, -2.6],
    accent: '#6f93b8',
  },
  {
    id: 'pink',
    label: 'اول تابلو اعلانات را چک کن',
    sublabel: 'شاید ترتیب ارائهها عوض شده باشد',
    response: 'اسمت هنوز ردیف سوم است. کنارش یک برگهٔ قدیمی از ترم قبل مانده، با همان خط تیره وسطش.',
    pos: [0, 0, -3.4],
    accent: '#c98d86',
  },
  {
    id: 'gold',
    label: 'برگه را بگیر و برو سر نیمکت',
    sublabel: 'همانجا با فرصت ببینش',
    response: 'کاغذ هنوز گرم است. لبهاش کمی تا خورده، ولی خط آخر همانطور خالی است.',
    pos: [2.2, 0, -2.6],
    accent: '#d3ad67',
  },
];

export const REHEARSAL_OPTIONS: StoryChoiceOption<MissionObjectChoice>[] = [
  {
    id: 'star',
    label: 'سه اسلاید آخر را زیر لب مرور کن',
    sublabel: 'قبل از اینکه زنگ بخورد',
    response: 'جملهٔ دوم گیر میکند، دوباره از اول میگویی. پسر آنطرف میز خودکارش را آرام زمین میگذارد.',
    pos: [-2.0, 0, -2.2],
    accent: '#8aa9c4',
  },
  {
    id: 'flower',
    label: 'خط خالی را همانجا پر کن',
    sublabel: 'جوابی که استاد گفت',
    response: 'جواب را مینویسی، ولی جوهر کمی پخش میشود. پسر یک دستمال کاغذی جلو میگذارد و برمیگردد سر برگهٔ خودش.',
    pos: [0, 0, -3.0],
    accent: '#c98d86',
  },
  {
    id: 'book',
    label: 'کیفت را مرتب کن و دو دقیقه کاری نکن',
    sublabel: 'فقط نفس بگیر',
    response: 'زیپ کیف بسته میشود. صدای زنگ از راهرو میآید؛ هنوز چند دقیقه مانده.',
    pos: [2.0, 0, -2.2],
    accent: '#b9a27c',
  },
];

const HAPPINESS_ECHO: Record<HappinessChoice, string> = {
  music: 'هدفونت را هنوز توی کیف گذاشتی.',
  talking: 'دوستت همانطرف میز نشسته، ولی چیزی نمیپرسد.',
  going_out: 'کتت را پشت نیمکت گذاشتی.',
  unexpected: 'زنگ کمی زودتر از چیزی که فکر میکردی خورد.',
  simple_things: 'لیوانت را مرتب کردی کنار برگه.',
};

export function getPathChoiceMessage(id: PathColorChoice): string {
  return PRECLASS_OPTIONS.find((option) => option.id === id)?.response ?? '';
}

export function getPersonalizedObjectMessage(
  id: MissionObjectChoice,
  answers: QuestionnaireAnswers
): string {
  const base = REHEARSAL_OPTIONS.find((option) => option.id === id)?.response ?? '';
  const echo = answers.happiness ? HAPPINESS_ECHO[answers.happiness] : '';
  return echo ? `${base} ${echo}` : base;
}

// ============================================================================
// ۵. کمککنندههای شخصیسازی گفتوگوی آخر
// ============================================================================
function getAfternoonSuggestion(afternoon?: AfternoonChoice): string {
  switch (afternoon) {
    case 'cafe':
      return 'پنج دقیقه قبلش کافه کنار کتابخانه، یک چای و همان برگهها';
    case 'walk':
      return 'پنج دقیقه قبلش یک دور تا سرِدر، حین راه برگهها را چک کنیم';
    case 'movie':
      return 'بعدش چند دقیقه درباره همان فیلم کوتاه حرف بزنیم';
    case 'games':
      return 'سر یک میز کافه یک بازی ساده بکنیم';
    case 'adventure':
      return 'یک روز بیبرنامه از در بیرون برویم و هر جا رسیدیم برگردیم';
    default:
      return 'پنج دقیقه قبلش یک چای بخوریم و برگهها را چک کنیم';
  }
}

export function getInvitationCaveat(value?: BeginningValueChoice): string {
  switch (value) {
    case 'honesty':
      return 'راستش دلیلش همین برگه است، چیز دیگری پشتش نیست.';
    case 'humor':
      return 'قول نمیدهم سر جلسه جملهٔ بهتری پیدا کنم.';
    case 'attention_to_detail':
      return 'خط آخر را هم با هم چک کنیم، همان که امروز خالی ماند.';
    case 'trust':
      return 'اگر راحت نیستی، همینجا تمامش میکنم.';
    case 'time':
      return 'عجله نیست؛ فردا هم سر کلاس هستیم.';
    default:
      return 'اگر نخواستی، هیچی عوض نمیشود.';
  }
}

// ============================================================================
// ۶. گفتوگوی لابی: هر جواب یک واکنش تازه میگیرد، نه تکرار گزینه
// ============================================================================
export const DIALOGUE_NODES: Record<string, DialogueNode> = {
  lobby_open: {
    id: 'lobby_open',
    speaker: 'male',
    speakerLabel: 'پسر',
    rtl: true,
    maleEmotion: 'thoughtful',
    femaleEmotion: 'curious',
    cameraPreset: 'male_close',
    beatLabel: 'لابی / ۱۰:۱۹',
    sceneNote: 'برگه را گرفته، ولی هنوز بازش نکرده.',
    text: 'ببخشید، یک لحظه. سر کلاس آن خط آخر را نوشتی؟ من جا انداختم و برگهام ناقص ماند. گفتم قبل از اینکه بری بپرسم، چون فردا همین برگه را دوباره میخواهیم.',
    choices: [
      {
        id: 'line_photo',
        text: 'آره، نوشتم. بگیر عکس بگیر، برگهام پیشمه.',
        rtl: true,
        nextNodeId: 'male_takes_photo',
      },
      {
        id: 'line_compare',
        text: 'منم همان قسمت را جا انداختم. دو دقیقه با هم چک کنیم؟',
        rtl: true,
        nextNodeId: 'male_compare',
      },
      {
        id: 'line_tomorrow',
        text: 'امروز عجله دارم، فردا قبل از کلاس میدم بهت.',
        rtl: true,
        nextNodeId: 'male_respects_time',
      },
    ],
  },

  male_takes_photo: {
    id: 'male_takes_photo',
    speaker: 'male',
    speakerLabel: 'پسر',
    rtl: true,
    maleEmotion: 'neutral',
    femaleEmotion: 'neutral',
    cameraPreset: 'two_shot',
    beatLabel: 'لابی / ۱۰:۱۹',
    sceneNote: 'گوشی را بالای برگه میگیرد، بدون اینکه چیز دیگری بپرسد.',
    text: 'مرسی. عکسش را گرفتم. حداقل فردا دوباره گیر نمیکنم.',
    nextNodeId: 'male_why_waited',
  },

  male_compare: {
    id: 'male_compare',
    speaker: 'male',
    speakerLabel: 'پسر',
    rtl: true,
    maleEmotion: 'curious',
    femaleEmotion: 'thoughtful',
    cameraPreset: 'two_shot',
    beatLabel: 'لابی / ۱۰:۲۰',
    sceneNote: 'دو برگه را کنار هم روی میز میگذارد.',
    text: 'باشه، دو تا برگه را بگذاریم کنار هم. شاید یکیامان درست نوشته باشیم.',
    nextNodeId: 'male_why_waited',
  },

  male_respects_time: {
    id: 'male_respects_time',
    speaker: 'male',
    speakerLabel: 'پسر',
    rtl: true,
    maleEmotion: 'thoughtful',
    femaleEmotion: 'neutral',
    cameraPreset: 'two_shot',
    beatLabel: 'لابی / ۱۰:۲۰',
    sceneNote: 'کیفت همچنان روی شانهات است؛ او یک قدم عقبتر میایستد.',
    text: 'باشه، پس فردا. معطلت نکنم؛ همین که ماندی کافی بود.',
    nextNodeId: 'male_why_waited',
  },

  male_why_waited: {
    id: 'male_why_waited',
    speaker: 'male',
    speakerLabel: 'پسر',
    rtl: true,
    maleEmotion: 'thoughtful',
    femaleEmotion: 'curious',
    cameraPreset: 'male_close',
    beatLabel: 'لابی / ۱۰:۲۰',
    sceneNote: 'برگه بالاخره باز میشود، ولی هر دو هنوز ایستادهاید.',
    text: 'راستش سر کلاس هم خواستم بپرسم، ولی وسط ارائه نمیخواستم حواست را پرت کنم. دیدم سوال کوتاهی کردی، گفتم بعدش بپرسم راحتتر است.',
    choices: [
      {
        id: 'why_plain',
        text: 'خب بعدش چی شد که تا لابی صبر کردی؟',
        rtl: true,
        nextNodeId: 'male_plain_reason',
      },
      {
        id: 'why_laugh',
        text: 'پس آن برگشتن سر کلاس هم به خاطر همان خط بود؟',
        rtl: true,
        nextNodeId: 'male_small_laugh',
      },
      {
        id: 'why_shared',
        text: 'منم امروز تمرین نکرده بودم. خوشحال شدم سوال آنقدر کوتاه ماند.',
        rtl: true,
        nextNodeId: 'male_shared_pressure',
      },
    ],
  },

  male_plain_reason: {
    id: 'male_plain_reason',
    speaker: 'male',
    speakerLabel: 'پسر',
    rtl: true,
    maleEmotion: 'neutral',
    femaleEmotion: 'neutral',
    cameraPreset: 'two_shot',
    beatLabel: 'لابی / ۱۰:۲۰',
    text: 'هیچی، جملهام گیر داشت. آخرش گفتم همان برگه را بپرسم، سادهتر است.',
    nextNodeId: 'male_small_invitation',
  },

  male_small_laugh: {
    id: 'male_small_laugh',
    speaker: 'male',
    speakerLabel: 'پسر',
    rtl: true,
    maleEmotion: 'happy_laugh',
    femaleEmotion: 'warm_smile',
    cameraPreset: 'male_close',
    beatLabel: 'لابی / ۱۰:۲۰',
    text: 'آره، لو رفتم. خواستم چیز بامزهای بگویم، آخرش فقط خط آخر یادم ماند.',
    nextNodeId: 'male_small_invitation',
  },

  male_shared_pressure: {
    id: 'male_shared_pressure',
    speaker: 'male',
    speakerLabel: 'پسر',
    rtl: true,
    maleEmotion: 'thoughtful',
    femaleEmotion: 'thoughtful',
    cameraPreset: 'two_shot',
    beatLabel: 'لابی / ۱۰:۲۰',
    text: 'منم اسلاید سوم را دوبار چک کردم. حداقل هر دو سر کلاس بودیم.',
    nextNodeId: 'male_small_invitation',
  },

  male_small_invitation: {
    id: 'male_small_invitation',
    speaker: 'male',
    speakerLabel: 'پسر',
    rtl: true,
    maleEmotion: 'hopeful',
    femaleEmotion: 'neutral',
    cameraPreset: 'two_shot',
    beatLabel: 'لابی / ۱۰:۲۱',
    sceneNote: 'همهمه لابی هست، ولی حرفتان همانجا پیش میرود.',
    text: 'اگر هفتهٔ دیگه باز ارائه داشتیم، برگهها را با هم چک کنیم. اگر نه هم، همین الانم حل شد.',
    dynamicText: (answers: QuestionnaireAnswers) =>
      `اگر هفتهٔ دیگه باز ارائه داشتیم، ${getAfternoonSuggestion(answers.afternoon)}. ${getInvitationCaveat(answers.beginningValue)} اگر نه هم، همین الانم حل شد.`,
    choices: [
      {
        id: 'final_yes',
        text: 'آره، بد نیست. فقط بذار بعد از امتحان باشد.',
        rtl: true,
        nextNodeId: 'ending_female_yes',
        endingVariant: 'yes',
      },
      {
        id: 'final_slow',
        text: 'فعلاً همین برگه کافیه؛ بعدتر ببینیم.',
        rtl: true,
        nextNodeId: 'ending_female_slow',
        endingVariant: 'slow',
      },
      {
        id: 'final_no',
        text: 'مرسی، ولی ترجیح میدهم فقط سر کلاس همدیگر را ببینیم.',
        rtl: true,
        nextNodeId: 'ending_female_no',
        endingVariant: 'no',
      },
    ],
  },

  ending_female_yes: {
    id: 'ending_female_yes',
    speaker: 'female',
    speakerLabel: 'تو',
    rtl: true,
    maleEmotion: 'warm_smile',
    femaleEmotion: 'warm_smile',
    cameraPreset: 'female_close',
    beatLabel: 'لابی / ۱۰:۲۲',
    text: 'باشه، بعد از امتحان. من برگهام را نگه میدارم.',
    nextNodeId: 'ending_male_happy',
  },

  ending_female_slow: {
    id: 'ending_female_slow',
    speaker: 'female',
    speakerLabel: 'تو',
    rtl: true,
    maleEmotion: 'hopeful',
    femaleEmotion: 'thoughtful',
    cameraPreset: 'female_close',
    beatLabel: 'لابی / ۱۰:۲۲',
    text: 'فعلاً همین خط حل شد، کافیه.',
    nextNodeId: 'ending_male_slow',
  },

  ending_female_no: {
    id: 'ending_female_no',
    speaker: 'female',
    speakerLabel: 'تو',
    rtl: true,
    maleEmotion: 'thoughtful',
    femaleEmotion: 'neutral',
    cameraPreset: 'female_close',
    beatLabel: 'لابی / ۱۰:۲۲',
    text: 'مرسی، ولی ترجیح میدهم فقط همکلاسی بمانیم.',
    nextNodeId: 'ending_male_respectful',
  },

  ending_male_happy: {
    id: 'ending_male_happy',
    speaker: 'male',
    speakerLabel: 'پسر',
    rtl: true,
    maleEmotion: 'warm_smile',
    femaleEmotion: 'warm_smile',
    cameraPreset: 'two_shot',
    beatLabel: 'لابی / ۱۰:۲۲',
    text: 'منم خط آخر را مینویسم. پس پنجشنبه، قبل از کلاس.',
    nextNodeId: null,
  },

  ending_male_slow: {
    id: 'ending_male_slow',
    speaker: 'male',
    speakerLabel: 'پسر',
    rtl: true,
    maleEmotion: 'hopeful',
    femaleEmotion: 'thoughtful',
    cameraPreset: 'two_shot',
    beatLabel: 'لابی / ۱۰:۲۲',
    text: 'آره. فردا سر کلاس سلام میکنم، دیگه چیزی نمیپرسم.',
    nextNodeId: null,
  },

  ending_male_respectful: {
    id: 'ending_male_respectful',
    speaker: 'male',
    speakerLabel: 'پسر',
    rtl: true,
    maleEmotion: 'thoughtful',
    femaleEmotion: 'neutral',
    cameraPreset: 'two_shot',
    beatLabel: 'لابی / ۱۰:۲۲',
    text: 'فهمیدم. فردا مثل قبل، فقط سلام. برگه را هم خودم مینویسم.',
    nextNodeId: null,
  },
};
