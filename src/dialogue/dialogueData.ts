import {
  AfternoonChoice,
  AtmosphereChoice,
  BeginningValueChoice,
  DialogueNode,
  HappinessChoice,
  MissionObjectChoice,
  QuestionnaireAnswers,
} from '../types/game';

/**
 * تمام متنهای بازی در این فایل است.
 * اصل نوشتن: جمله کوتاه، دلیل مشخص، جزئیات دیدهشده، بدون قول بزرگ و بدون فشار.
 * پسر اسم ندارد؛ در تمام برچسبها فقط «پسر» نوشته میشود.
 */

// مدت نمایش هر زیرنویس کاتسین. کمی کوتاهتر از قبل تا ریتم روزمره حفظ شود.
export const CUTSCENE_MIN_DURATION_MS = 4200;
export const CUTSCENE_MIN_DURATION_SEC = 4.2;

export const DIALOGUE_START_NODE = 'leave_male_call';

// ============================================================================
// ۱. صفحهها، بارگذاری و پیامهای کلی
// ============================================================================
export const SCREEN_TEXTS = {
  mainTitle: 'قدم اول',

  introEyebrow: 'یک روز معمولی، دانشکده',
  introTime: 'چهارشنبه، ۸:۱۰ صبح',
  introPlace: 'راهروی طبقه دوم',
  introDescription:
    'جزوه امروز یک خط کم دارد. تو سر کلاس یک سوال کوتاه میپرسی؛ پسر، چند ردیف جلوتر، همان خط را جا میاندازد. بقیه ماجرا قبل از در لابی و با انتخاب تو اتفاق میافتد.',
  introControlHint: 'چپ: حرکت  ·  راست: دوربین  ·  نزدیک شدن: تعامل',
  introFootnote: 'بدون اسم، بدون قول بزرگ؛ فقط چند دقیقه از یک روز.',
  startButton: 'شروع این روز',
  resumeButton: 'ادامه از همانجا',

  loadingEyebrow: 'در حال آماده کردن صحنه',
  loadingTitle: 'قدم اول',
  loadingNotes: [
    'اول چراغهای راهرو روشن میشوند.',
    'بعد صدای زنگ کلاس از دور میآید.',
    'دفترها باز میشوند؛ یکی هنوز یک خط خالی دارد.',
    'در آخر، نور عصر میافتد روی کف لابی.',
  ],

  respectfulHeader: 'همینجا میایستیم',
  respectfulYesMessage:
    'ممنون که راحت گفتی. وقتی رابطهای هست، ادامه دادن این داستان بیاحترامی است. پس همینجا تمام میشود؛ روز خوبی داشته باش.',
  returnToStartButton: 'برگشت به صفحه اول',

  finalHeader: 'پایان این روز',
  finalTitle: 'همین یک سلام هم کافی بود.',
  finalQuote: '«قدم اول لازم نیست بزرگ باشد.»',
  playAgainButton: 'یک روز دیگر از اول',

  soonMeetText: 'همان فضا، یک بار دیگر',
  postgameNote:
    'هر بار چند جزئیات تازه پیدا میشود: یک لیوان، یک خط جزوه، یک مکث قبل از در.',
};

// ============================================================================
// ۲. پرسشنامه: سوالها باید به چیزی تبدیل شوند که بعداً واقعاً دیده شود
// ============================================================================
export interface QuestionnaireStep {
  key: keyof QuestionnaireAnswers;
  chapterLabel: string;
  question: string;
  note?: string;
  hint?: string;
  options: {
    id: HappinessChoice | AfternoonChoice | AtmosphereChoice | BeginningValueChoice;
    label: string;
  }[];
}

export const QUESTIONNAIRE_STEPS: QuestionnaireStep[] = [
  {
    key: 'happiness',
    chapterLabel: 'گام ۱ از ۴',
    question: 'تو یک روز شلوغ دانشگاه، چی معمولاً یک ذره آرومت میکند؟',
    note: 'جواب این سوال، یک جزئیات کوچک توی کلاس میشود.',
    hint: 'چیزی که واقعاً انجام میدهی، نه چیزی که دوست داری انجام بدهی.',
    options: [
      { id: 'music', label: 'یک آهنگ کوتاه با هدفون، بین دو کلاس' },
      { id: 'talking', label: 'چند دقیقه گپ با کسی که خوب میشناسدت' },
      { id: 'going_out', label: 'پنج دقیقه بیرون زدن از ساختمان' },
      { id: 'unexpected', label: 'یک اتفاق کوچیک که برنامه روز را عوض کند' },
      { id: 'simple_things', label: 'چای داغ، یا یک میز مرتب' },
    ],
  },
  {
    key: 'afternoon',
    chapterLabel: 'گام ۲ از ۴',
    question: 'اگر امروز بعد از کلاس یک ساعت خالی داشته باشی، چیکار میکنی؟',
    note: 'اگر آخر داستان قرارِ کوچکی گذاشته شود، از همینجا میآید.',
    hint: 'لازم نیست جواب جالبی باشد؛ همان کاری که معمولاً میکنی.',
    options: [
      { id: 'cafe', label: 'کافه کنار کتابخانه، یک چای و یک کتاب' },
      { id: 'walk', label: 'یک دور تو محوطه، بدون هدف خاص' },
      { id: 'movie', label: 'یک فیلم کوتاه، ترجیحاً با زیرنویس' },
      { id: 'games', label: 'یک بازی ساده روی گوشی یا سر میز' },
      { id: 'adventure', label: 'بیرون زدن بیبرنامه و برگشتن هر وقت شد' },
    ],
  },
  {
    key: 'atmosphere',
    chapterLabel: 'گام ۳ از ۴',
    question: 'کدام گوشه دانشگاه بیشتر دلت میخواهد بنشینی؟',
    note: 'این انتخاب، جای خلوت آخر داستان را تعیین میکند.',
    hint: 'به جایی فکر کن که بدون دلیل خاصی دوست داری بروی آنجا.',
    options: [
      { id: 'starry_sky', label: 'پشت بام خوابگاه، وقتی چراغها کم میشوند' },
      { id: 'flowers_gardens', label: 'کنار باغچه جلوی دانشکده' },
      { id: 'city_night', label: 'پلههای بیرونی، رو به چراغهای خیابان' },
      { id: 'minimalist', label: 'ردیف آخر کتابخانه، جایی که کسی نیست' },
      { id: 'nature', label: 'زیر درختهای پشت ساختمان قدیمی' },
    ],
  },
  {
    key: 'beginningValue',
    chapterLabel: 'گام ۴ از ۴',
    question: 'تو یک آشنایی تازه، چی باعث میشود راحت باشی؟',
    note: 'پسر آخر لابی دقیقاً با همین لحن جلو میآید.',
    hint: 'این سوال درباره عشق نیست؛ درباره راحت بودن است.',
    options: [
      { id: 'honesty', label: 'طرف حرفش را راست بگوید، حتی اگر ساده باشد' },
      { id: 'humor', label: 'یک شوخی کوچیک، بدون اینکه مصنوعی باشد' },
      { id: 'attention_to_detail', label: 'حواسش به چیزهای ریز باشد، مثل یک خط جزوه' },
      { id: 'trust', label: 'بتوانم «نه» بگویم و چیزی عجیب نشود' },
      { id: 'time', label: 'کسی عجله نکند، حتی برای جواب سلام' },
    ],
  },
];

export const RELATIONSHIP_PROMPT = {
  chapterLabel: 'یک سوال قبل از شروع',
  question: 'الان با کسی رابطه داری؟',
  note: 'فقط برای اینکه داستان وارد جایی نشود که برایت ناخوشایند باشد.',
  options: {
    yes: 'بله، دارم.',
    no: 'نه، ندارم.',
  },
};

// ============================================================================
// ۳. زیرنویس کاتسینها: چیزهایی که دوربین نشان میدهد
// ============================================================================
export const CUTSCENE_CAPTIONS = {
  worldTransform:
    'دیگر لازم نیست تصورش کنی: پنجرهها روشن میشوند، رنگ دیوارها برمیگردد و صدای قدمها تو راهرو میپیچد.',
  universityEnter:
    'ساعت هشت و بیست و هشت دقیقه است. بوی قهوه از کافه کنار کتابخانه میآید و در نیمهباز است.',
  pathChoice: 'جلوتر سه رد رنگ کمرنگ روی زمین افتاده؛ هیچ تابلویی بالایشان نیست.',
  objectChoice: 'روی سه پایه چیزی گذاشته شده، بدون برچسب و بدون توضیح.',
  universityGate: 'سرِدر جلو است. یکی از لنگههای در کمی عقبتر مانده.',

  classroomEntry:
    'کلاس هنوز نیمهخالیه. بخاری کنار تخته صدای ریزی میدهد و روی ردیف آخر یک خودکار جا مانده.',
  classroomBeat1:
    'مینشینی ردیف آخر. استاد شروع میکند و تو دفترت را باز میکنی روی یک صفحه تازه.',
  classroomBeat2:
    'چند ردیف جلوتر، پسر خط آخر جزوهاش را جا میاندازد و نوک خودکارش را هی میچرخاند.',
  classroomBeat3:
    'یک سوال کوتاه از عقب کلاس میپرسی. استاد جواب میدهد؛ پسر برمیگردد ببیند کی پرسیده.',
  classroomBeat4:
    'نگاهت که به او میافتد، سریع برمیگردد سمت تخته و همان خط خالی را دوباره مینویسد.',
  classroomBeat5:
    'زنگ میخورد. صدای زیپ کیفها و کشیده شدن صندلیها جای صدای استاد را میگیرد.',
  classroomBeat6:
    'دم در، پسر یک لحظه مکث میکند، انگار بخواهد چیزی بپرسد؛ بعد کیفش را جابجا میکند و رد میشود.',

  lobbyBeat1:
    'لابی پر از صدای آدم است، ولی هر کس سر یک میز کوچیک نشسته. دو لیوان کاغذی کنار پنجره مانده.',
  lobbyBeat2:
    'تو روبهروی دوستت نشستی. درباره همان سوال کلاس حرف میزنید و خطی که هنوز تو جزوه خالی است.',
  lobbyBeat3:
    'پسر یک میز آنورتر تنها نشسته. دوستش زود رفته و او هنوز دفترش را باز گذاشته، بدون اینکه بنویسد.',
  lobbyBeat4:
    'هر چند دقیقه یک بار به در نگاه میکند، نه به آدمها. بعد دوباره برمیگردد سر همان صفحه.',
  lobbyBeat5:
    'دوستت یک خنده کوتاه میکند و حواستان پیش حرف خودتان است. بیرون، نور عصر افتاده روی کف لابی.',
  lobbyBeat6:
    'پسر دستش را میگذارد روی میز، انگار بلند شود؛ ولی دوباره مینشیند. هنوز جملهای پیدا نکرده.',
  lobbyBeat7:
    'بالاخره دفترش را میبندد. نه با عجله، فقط انگار تصمیمش را گرفته.',
  lobbyReadyToLeave: 'حرفتان تمام میشود. کیفت را برمیداری و سمت در راه میافتی.',
  lobbyLeavingTrigger:
    'پشت سرت صدای صندلی میآید. پسر بلند شده، دفترش را گرفته و دارد میآید؛ هنوز معلوم نیست چه میخواهد بگوید.',
};

// ============================================================================
// ۴. کمککنندههای شخصیسازی
// ============================================================================
const VALUE_PHRASES: Record<BeginningValueChoice, string> = {
  honesty: 'راست گفتن',
  humor: 'یک شوخی کوچیک',
  attention_to_detail: 'حواس جمع به جزئیات',
  trust: 'راحت بودن و بتوانی نه بگویی',
  time: 'عجله نکردن',
};

function getValuePhrase(value?: BeginningValueChoice): string {
  return value ? VALUE_PHRASES[value] : 'راحت بودن';
}

export function getPersonalizedObjectMessage(
  obj: MissionObjectChoice,
  answers: QuestionnaireAnswers
): string {
  const valuePhrase = getValuePhrase(answers.beginningValue);

  if (obj === 'star') {
    return `ستاره شیشهای را برمیداری. نور توی آن میشکند و یک لکه کوچک روی میز میاندازد. لازم نیست معنی خاصی پشتش باشد؛ همین ${valuePhrase} کافی است.`;
  }
  if (obj === 'flower') {
    return `گل را برمیداری. یکی از برگهایش کمی افتاده و حواست همانجا میرود، نه پیش حرفهای بزرگ. ${valuePhrase} هم معمولاً از همینجور چیزها شروع میشود.`;
  }
  return `کتاب باز است و صفحه سفیدش هنوز خط نخورده. ${valuePhrase} یعنی مجبور نیستی زود پرش کنی.`;
}

function getAfternoonSuggestion(afternoon?: AfternoonChoice): string {
  switch (afternoon) {
    case 'cafe':
      return 'پنجشنبه بعد از کلاس، کافه کنار کتابخانه، یک چای بخوریم';
    case 'walk':
      return 'پنجشنبه بعد از کلاس یک دور تو محوطه تا سرِدر قدم بزنیم';
    case 'movie':
      return 'یک روز چند دقیقه درباره همان فیلم کوتاه حرف بزنیم';
    case 'games':
      return 'سر یک میز کافه یک بازی ساده بکنیم';
    case 'adventure':
      return 'یک روز بیبرنامه از در بیرون برویم و هر جا رسیدیم برگردیم';
    default:
      return 'یک روز بعد از کلاس یک چای بخوریم و بیشتر حرف بزنیم';
  }
}

function getBeginningValueEcho(value?: BeginningValueChoice): string {
  switch (value) {
    case 'honesty':
      return 'راستش دلیلش فقط جزوه نبود؛ میخواستم سلام کنم، ولی دنبال یک جمله معمولی میگشتم که الکی نباشد.';
    case 'humor':
      return 'از بس تو ذهنم جمله چیدم، آخرش فقط همان خط جزوه یادم ماند.';
    case 'attention_to_detail':
      return 'همان سوالی که پرسیدی، خط آخر جزوهام را کامل کرد. اینجور چیزها معمولاً یادم میماند.';
    case 'trust':
      return 'نمیخواستم یکهو جلو بیایم و ناراحتت کنم؛ اگر عجله داری، همینجا تمامش میکنم.';
    case 'time':
      return 'اصلاً عجله ندارم. اگر امروز نشد، فردا هم سر کلاس هستیم.';
    default:
      return 'گفتم حداقل یک سلام ساده بکنم، بدون مقدمهچینی.';
  }
}

function getHappinessEcho(happiness?: HappinessChoice): string {
  switch (happiness) {
    case 'music':
      return 'همان موقع هدفونت را درآورده بودی که سوال کنی.';
    case 'talking':
      return 'قبل از سوال، یک جمله کوتاه به بغلت گفتی.';
    case 'going_out':
      return 'کتت را پشت صندلی گذاشتی و برگشتی سر دفتر.';
    case 'unexpected':
      return 'یک دفعه خندیدی، بعد سوال پرسیدی.';
    case 'simple_things':
      return 'لیوانت را مرتب کردی کنار دفتر، بعد پرسیدی.';
    default:
      return 'همان سوال کوتاه، هنوز یادم هست.';
  }
}

function getInvitationCaveat(value?: BeginningValueChoice): string {
  switch (value) {
    case 'honesty':
      return 'راستش دلیلش همین است، چیز دیگری پشتش نیست.';
    case 'humor':
      return 'قول نمیدهم سر قرار جمله بهتری پیدا کنم.';
    case 'attention_to_detail':
      return 'جزوه را هم میآورم، خط آخرش را با هم چک کنیم.';
    case 'trust':
      return 'اگر راحت نیستی، همینجا تمامش میکنم.';
    case 'time':
      return 'اصلاً عجله نیست؛ فردا هم سر کلاس هستیم.';
    default:
      return 'اگر نخواستی، هیچ چیزی هم قرار نیست عوض شود.';
  }
}

export function getPathChoiceMessage(nameFa: string, detail: string): string {
  return `رفتی سمت رد ${nameFa}. ${detail} جلوتر هنوز چیزی مشخص نیست، فقط راه ادامه دارد.`;
}

// ============================================================================
// ۵. گفتوگوی لابی: شروع با یک دلیل واقعی، ادامه با انتخاب بازیکن
// ============================================================================
export const DIALOGUE_NODES: Record<string, DialogueNode> = {
  leave_male_call: {
    id: 'leave_male_call',
    speaker: 'male',
    speakerLabel: 'پسر',
    rtl: true,
    maleEmotion: 'nervous',
    femaleEmotion: 'curious',
    cameraPreset: 'male_close',
    beatLabel: 'لابی / ۱۰:۱۹',
    sceneNote: 'دفترش را گرفته، ولی هنوز بازش نکرده.',
    text: 'ببخشید، یک لحظه... جزوه امروز را کامل نوشتی؟ من خط آخرش را جا انداختم و دیدم داری میروی، گفتم قبل از اینکه بری بپرسم. همان سوالی که سر کلاس پرسیدی، یادم ماند.',
    choices: [
      {
        id: 'leave_resp_note',
        text: 'آره، جزوه پیشمه. همینجا نشونت بدم.',
        rtl: true,
        nextNodeId: 'female_note_practical',
      },
      {
        id: 'leave_resp_shared',
        text: 'منم همان قسمت را نفهمیدم. دو دقیقه با هم چک کنیم؟',
        rtl: true,
        nextNodeId: 'female_note_shared',
      },
      {
        id: 'leave_resp_time',
        text: 'امروز عجله دارم، ولی فردا قبل از کلاس میتوانم بدهم بهت.',
        rtl: true,
        nextNodeId: 'female_note_short',
      },
    ],
  },

  female_note_practical: {
    id: 'female_note_practical',
    speaker: 'female',
    speakerLabel: 'تو',
    rtl: true,
    maleEmotion: 'thoughtful',
    femaleEmotion: 'neutral',
    cameraPreset: 'female_close',
    beatLabel: 'لابی / ۱۰:۱۹',
    text: 'آره، پیشمه. بگیر نگاه کن؛ خط آخر را هم مشخص کردم.',
    nextNodeId: 'male_note_followup',
  },

  female_note_shared: {
    id: 'female_note_shared',
    speaker: 'female',
    speakerLabel: 'تو',
    rtl: true,
    maleEmotion: 'curious',
    femaleEmotion: 'warm_smile',
    cameraPreset: 'two_shot',
    beatLabel: 'لابی / ۱۰:۲۰',
    text: 'منم همان قسمت را جا انداختم. بشینیم دو دقیقه چک کنیم، شاید هر دو حل شود.',
    nextNodeId: 'male_note_followup',
  },

  female_note_short: {
    id: 'female_note_short',
    speaker: 'female',
    speakerLabel: 'تو',
    rtl: true,
    maleEmotion: 'thoughtful',
    femaleEmotion: 'neutral',
    cameraPreset: 'female_close',
    beatLabel: 'لابی / ۱۰:۱۹',
    sceneNote: 'کیفت هنوز روی شانهات است.',
    text: 'امروز عجله دارم. فردا قبل از کلاس میآورم، باشه؟',
    nextNodeId: 'male_respects_time',
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
    text: 'باشه، پس فردا. دستت درد نکند که وایسادی؛ نمیخواهم بیشتر معطلت کنم.',
    choices: [
      {
        id: 'time_resp_tomorrow',
        text: 'فردا حتماً. اگر جزوه را آوردم، صدات میکنم.',
        rtl: true,
        nextNodeId: 'ending_female_slow',
        endingVariant: 'slow',
      },
      {
        id: 'time_resp_stop',
        text: 'مرسی، ولی ترجیح میدهم همینجا تمام شود.',
        rtl: true,
        nextNodeId: 'ending_female_no',
        endingVariant: 'no',
      },
      {
        id: 'time_resp_stay',
        text: 'راستش عجلهام کم شد؛ همین الانم میشود چکش کنیم.',
        rtl: true,
        nextNodeId: 'male_note_followup',
      },
    ],
  },

  male_note_followup: {
    id: 'male_note_followup',
    speaker: 'male',
    speakerLabel: 'پسر',
    rtl: true,
    maleEmotion: 'warm_smile',
    femaleEmotion: 'curious',
    cameraPreset: 'male_close',
    beatLabel: 'لابی / ۱۰:۲۰',
    sceneNote: 'دفتر بالاخره باز میشود، ولی هر دو هنوز ایستادهاید.',
    text: 'مرسی. راستش سر کلاس هم میخواستم سر صحبت را باز کنم، ولی جملهای پیدا نکردم که الکی نباشد.',
    dynamicText: (answers: QuestionnaireAnswers) =>
      `مرسی. راستش سر کلاس هم میخواستم سر صحبت را باز کنم، ولی جملهای پیدا نکردم که الکی نباشد. ${getBeginningValueEcho(answers.beginningValue)} ${getHappinessEcho(answers.happiness)}`,
    choices: [
      {
        id: 'mid_direct',
        text: 'خب حالا که جزوه حل شد، چی میخواستی بگی؟',
        rtl: true,
        nextNodeId: 'female_mid_direct',
      },
      {
        id: 'mid_playful',
        text: 'پس آن برگشتن سر کلاس هم به خاطر همان سوال بود؟',
        rtl: true,
        nextNodeId: 'female_mid_playful',
      },
      {
        id: 'mid_gentle',
        text: 'منم امروز حواسم خوب جمع نشده بود. خوشحال شدم سر حرف باز شد.',
        rtl: true,
        nextNodeId: 'female_mid_gentle',
      },
    ],
  },

  female_mid_direct: {
    id: 'female_mid_direct',
    speaker: 'female',
    speakerLabel: 'تو',
    rtl: true,
    maleEmotion: 'curious',
    femaleEmotion: 'neutral',
    cameraPreset: 'female_close',
    text: 'خب حالا که جزوه حل شد، چی میخواستی بگی؟',
    nextNodeId: 'male_invitation',
  },

  female_mid_playful: {
    id: 'female_mid_playful',
    speaker: 'female',
    speakerLabel: 'تو',
    rtl: true,
    maleEmotion: 'shy',
    femaleEmotion: 'warm_smile',
    cameraPreset: 'female_close',
    text: 'پس آن برگشتن سر کلاس هم به خاطر همان سوال بود؟',
    nextNodeId: 'male_laugh_bridge',
  },

  male_laugh_bridge: {
    id: 'male_laugh_bridge',
    speaker: 'male',
    speakerLabel: 'پسر',
    rtl: true,
    maleEmotion: 'happy_laugh',
    femaleEmotion: 'warm_smile',
    cameraPreset: 'male_close',
    text: 'آره، دیگر لو رفتم. خواستم یک جمله بسازم، آخرش فقط همان خط جزوه یادم ماند.',
    nextNodeId: 'male_invitation',
  },

  female_mid_gentle: {
    id: 'female_mid_gentle',
    speaker: 'female',
    speakerLabel: 'تو',
    rtl: true,
    maleEmotion: 'hopeful',
    femaleEmotion: 'thoughtful',
    cameraPreset: 'two_shot',
    text: 'منم امروز حواسم خوب جمع نشده بود. خوشحال شدم سر حرف باز شد.',
    nextNodeId: 'male_invitation',
  },

  male_invitation: {
    id: 'male_invitation',
    speaker: 'male',
    speakerLabel: 'پسر',
    rtl: true,
    maleEmotion: 'hopeful',
    femaleEmotion: 'neutral',
    cameraPreset: 'two_shot',
    beatLabel: 'لابی / ۱۰:۲۱',
    sceneNote: 'همهمه لابی هست، ولی حرفتان همانجا پیش میرود.',
    text: 'خلاصه خوشحال شدم وایسادی.',
    dynamicText: (answers: QuestionnaireAnswers) =>
      `خلاصه خوشحال شدم وایسادی. اگر هفته دیگه یک ساعت خالی داشتی، ${getAfternoonSuggestion(answers.afternoon)}. ${getInvitationCaveat(answers.beginningValue)} اگر نه هم، هیچی؛ همین چند دقیقه هم خوب بود.`,
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
        text: 'فعلاً همین قدم اول کافیه؛ بعدتر ببینیم.',
        rtl: true,
        nextNodeId: 'ending_female_slow',
        endingVariant: 'slow',
      },
      {
        id: 'final_no',
        text: 'مرسی، ولی ترجیح میدهم فقط همکلاسی بمانیم.',
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
    text: 'آره، بد نیست. فقط بذار بعد از امتحان باشد.',
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
    text: 'فعلاً همین قدم اول کافیه؛ بعدتر ببینیم.',
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
    text: 'باشه. پس بعد از امتحان. من جزوه را هم میآورم که دستم یک چیزی باشد.',
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
    text: 'باشه، عجله نیست. فردا سر کلاس سلام میکنم؛ همان کافیه.',
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
    text: 'فهمیدم. مرسی که راحت گفتی. فردا سر کلاس مثل قبل، فقط سلام.',
    nextNodeId: null,
  },
};
