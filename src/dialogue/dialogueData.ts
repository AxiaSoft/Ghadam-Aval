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
 * ============================================================================
 * راهنمای ویرایش متن‌ها و دیالوگ‌های بازی:
 * تمام متن‌های صفحات، سوال‌ها، زیرنویس کات‌سین‌ها و دیالوگ‌های لابی در همین یک فایل
 * جمع‌آوری شده‌اند (با لحن با روح، احساسی، واقعی و امروزی — بدون حالت دکلمه‌ای).
 * ============================================================================
 */

// حداقل زمان نمایش هر متنِ کات‌سین (به میلی‌ثانیه — ۵۰۰۰ معادل ۵ ثانیه)
export const CUTSCENE_MIN_DURATION_MS = 5000;
export const CUTSCENE_MIN_DURATION_SEC = 5;

// ============================================================================
// بخش ۱: متن‌های صفحه شروع، پایان محترمانه و صفحه پایانی
// ============================================================================
export const SCREEN_TEXTS = {
  mainTitle: 'قدم اول',
  introDescription:
    'گاهی همه‌چیز از یه روزِ معمولیِ دانشگاه و یه مکثِ کوتاه شروع می‌شه — ساده، واقعی و کاملاً به انتخابِ تو.',
  startButton: 'شروع داستان',
  resumeButton: 'ادامه‌ی داستان ذخیره‌شده',

  respectfulHeader: 'با احترام و آرزوی بهترین‌ها',
  respectfulYesMessage:
    'ممنون که چند لحظه وقت گذاشتی. از ته دل امیدوارم رابطه‌ت و روزهات همیشه پر از حسِ خوب، آرامش و لبخند باشه.',
  returnToStartButton: 'بازگشت به صفحه‌ی اول',

  finalHeader: 'فصل پایانی',
  finalTitle: 'گاهی بهترین آشنایی‌ها خیلی ساده شروع می‌شن.',
  finalQuote: '«شاید این فقط شروع یه آشناییِ خوب باشه.»',
  playAgainButton: 'بازگشت به منو',
  soonMeetText: 'بزودی همدگیر رو ملاقات خواهیم کرد :)',
};

// ============================================================================
// بخش ۲: سوال‌های چهارگانه‌ی شخصیت + سوال آخر (وضعیت رابطه)
// ============================================================================
export interface QuestionnaireStep {
  key: keyof QuestionnaireAnswers;
  chapterLabel: string;
  question: string;
  options: {
    id: HappinessChoice | AfternoonChoice | AtmosphereChoice | BeginningValueChoice;
    label: string;
  }[];
}

export const QUESTIONNAIRE_STEPS: QuestionnaireStep[] = [
  {
    key: 'happiness',
    chapterLabel: 'سوال اول',
    question: 'معمولاً چه چیزتره بیشتر از همه حالت رو خوب می‌کنه؟',
    options: [
      { id: 'music', label: 'گوش دادن به موزیک' },
      { id: 'talking', label: 'گپ زدن با آدم‌هایی که دوستشون داری' },
      { id: 'going_out', label: 'بیرون رفتن و عوض کردن حال‌وهوا' },
      { id: 'unexpected', label: 'اتفاق‌های خوب و یهویی' },
      { id: 'simple_things', label: 'دلخوشی‌های ساده و کوچیکِ روزمره' },
    ],
  },
  {
    key: 'afternoon',
    chapterLabel: 'سوال دوم',
    question: 'یه بعدازظهر آزاد داشته باشی چطوری می‌گذرونیش؟',
    options: [
      { id: 'cafe', label: 'رفتن به یه کافه‌ی دنج' },
      { id: 'walk', label: 'قدم زدن تو هوای آزاد' },
      { id: 'movie', label: 'دیدن یه فیلم یا سریال خوب' },
      { id: 'games', label: 'بازی کردن و سرگرمی' },
      { id: 'adventure', label: 'بیرون زدن بدون برنامه‌ی قبلی' },
    ],
  },
  {
    key: 'atmosphere',
    chapterLabel: 'سوال سوم',
    question: 'کدوم فضا و حال‌وهوا رو بیشتر دوست داری؟',
    options: [
      { id: 'starry_sky', label: 'آسمون پرستاره‌ی شب' },
      { id: 'flowers_gardens', label: 'فضای سبز و پر از گل‌وگیاه' },
      { id: 'city_night', label: 'نورهای شهر توی شب' },
      { id: 'minimalist', label: 'جاهای خلوت، ساده و آروم' },
      { id: 'nature', label: 'طبیعت و هوای تازه' },
    ],
  },
  {
    key: 'beginningValue',
    chapterLabel: 'سوال چهارم',
    question: 'توی شروعِ یه آشنایی، چی برات از همه مهم‌تره؟',
    options: [
      { id: 'honesty', label: 'صداقت و روراست بودن' },
      { id: 'humor', label: 'شوخ‌طبعی و انرژی خوب' },
      { id: 'attention_to_detail', label: 'توجه به جزئیات کوچیک' },
      { id: 'trust', label: 'حسِ اعتماد و راحتی' },
      { id: 'time', label: 'آروم پیش رفتن و عجله نکردن' },
    ],
  },
];

export const RELATIONSHIP_PROMPT = {
  chapterLabel: 'سوال آخر',
  question: 'الان با کسی تو رابطه‌ای؟',
  options: {
    yes: 'بله، هستم.',
    no: 'نه، نیستم.',
  },
};

// ============================================================================
// بخش ۳: متن‌های کات‌سین‌ها در طول مراحل بازی (محاوره‌ای و روان)
// ============================================================================
export const CUTSCENE_CAPTIONS = {
  worldTransform: 'کم‌کم اون فضای سرد و خاکستری کنار می‌ره و همه‌جا رنگ و نور می‌گیره...',
  universityEnter: 'کلاس‌های صبح تازه دارن شروع می‌شن...',
  classroomEntry:
    'کلاس هنوز آرومه و بچه‌ها کم‌کم دارن می‌شینن؛ یه صندلی خالی ردیف‌های عقب هست.',
  classroomBeat1: 'می‌ری عقبِ کلاس می‌شینی و استاد درس رو شروع می‌کنه.',
  classroomBeat2:
    'چند ردیف جلوتر، یکی از بچه‌ها با خودکارش ور می‌ره و انگار یه کم حواسش پرته.',
  classroomBeat3:
    'وسط درس، یه لحظه برمی‌گرده عقب و خیلی کوتاه به سمت تو نگاه می‌کنه...',
  classroomBeat4:
    '...ولی همین که می‌بینه حواست جمع شد، یه کم هول می‌شه و سریع رو برمی‌گردونه سمت تخته.',
  classroomBeat5: 'زنگ پایان کلاس می‌خوره و سر و صدای جمع کردن کیف و جزوه‌ها بلند می‌شه.',
  classroomBeat6:
    'موقع بیرون رفتن از کلاس، یه لحظه کنار میزش مکث می‌کنه؛ انگار می‌خواد چیزی بگه ولی پشیمون می‌شه.',

  lobbyBeat1:
    'بعد از کلاس، لابی شلوغه و تقریباً همه دو‌به‌دو نشستن و گرمِ صحبت با بغل‌دستیشون هستن.',
  lobbyBeat2: 'تو هم روبه‌روی دوستت نشستی و دارین از کلاسِ امروز حرف می‌زنین.',
  lobbyBeat3:
    'اما اون‌طرفِ لابی، بین این‌همه آدم که دارن با کناریشون حرف می‌زنن، فقط اون تنها و ساکت نشسته و تو فکره...',
  lobbyBeat4: '...و هر چند لحظه یه بار، از همون دور زیرچشمی به سمت تو نگاه می‌کنه.',
  lobbyBeat5: 'وسط صحبت با دوستت خنده‌تون می‌گیره و حواستون به گپِ خودتونه.',
  lobbyBeat6:
    'یه لحظه روی صندلی میاد جلو، انگار می‌خواد دلش رو به دریا بزنه و پاشه بیاد سمتت...',
  lobbyBeat7:
    '...ولی باز منصرف می‌شه، یه نفس عمیق می‌کشه و دوباره تکیه می‌ده به صندلی.',
  lobbyReadyToLeave: 'صحبتت با دوستت تموم می‌شه و بلند می‌شی که کم‌کم از لابی بری بیرون...',
  lobbyLeavingTrigger:
    'همین که راه می-afتی سمت درِ خروجی... صدای قدم‌های تندِ یه نفر از پشت سرت میاد.',
};

// ============================================================================
// توابع کمکی برای شخصی‌سازی متن‌ها
// ============================================================================
export function getPersonalizedObjectMessage(
  obj: MissionObjectChoice,
  answers: QuestionnaireAnswers
): string {
  const valueMap: Record<string, string> = {
    honesty: 'روراستی و سادگی',
    humor: 'لبخند و حسِ خوب',
    attention_to_detail: 'دقت به چیزهای کوچیک',
    trust: 'اعتماد و آرامش خاطر',
    time: 'حوصله و عجله نکردن',
  };
  const valuePhrase = valueMap[answers.beginningValue ?? 'honesty'] ?? 'روراستی و آرامش';

  if (obj === 'star') {
    return `یه ستاره‌ی روشن وسط مسیر — انگار یادت می‌ندازه یه شروعِ خوب، اول از همه ${valuePhrase} می‌خواد.`;
  }
  if (obj === 'flower') {
    return `گلی که آروم رو به نور باز شده — درست مثل رابطه‌هایی که بی‌عجله و با ${valuePhrase} شکل می‌گیرن.`;
  }
  return `یه کتابِ باز با صفحه‌های سفید — مثل یه آشنایی تازه که قراره با ${valuePhrase} جلو بره.`;
}

function getAfternoonSuggestion(afternoon?: AfternoonChoice): string {
  switch (afternoon) {
    case 'cafe':
      return 'یه روز بعد از کلاس بریم یه کافه‌ی دنج یه قهوه بخوریم';
    case 'walk':
      return 'یه روز بعد از کلاس یه کم تو محوطه یا بیرون قدم بزنیم';
    case 'movie':
      return 'یه وقت آزاد پیدا کنیم و راجع به فیلم و چیزایی که دوست داریم گپ بزنیم';
    case 'games':
      return 'یه روز سر فرصت بشینیم یه کم بیشتر گپ بزنیم';
    case 'adventure':
      return 'یه روز بی‌برنامه بریم بیرون یه چرخی بزنیم';
    default:
      return 'یه روز سر فرصت یه قهوه بخوریم و بیشتر حرف بزنیم';
  }
}

function getBeginningValueEcho(val?: BeginningValueChoice): string {
  switch (val) {
    case 'honesty':
      return 'گفتم بدون مقدمه و حاشیه، خیلی روراست خودِ حرفم رو بزنم.';
    case 'humor':
      return 'البته الان از استرس هرچی جمله‌ی خوب تو ذهنم چیده بودم پرید!';
    case 'attention_to_detail':
      return 'از همون چند جلسه‌ی پیش، همین آروم بودن و حال‌وهوات خیلی توجهم رو جلب کرده بود.';
    case 'trust':
      return 'فقط دلم می‌خواست خیلی محترمانه جلو بیام که یه وقت معذب نشی.';
    case 'time':
      return 'اصلاً هم نمی‌خواستم یهویی معذبت کنم، فقط گفتم یه سلامی بدم که باب آشنایی باز بشه.';
    default:
      return 'گفتم حداقل صادقانه جلو بیام و حرفم رو بزنم.';
  }
}

// ============================================================================
// بخش ۴: دیالوگ‌های لابی (با روح، احساسی و واقعی — بدون حالت دکلمه‌ای)
// ============================================================================
export const DIALOGUE_NODES: Record<string, DialogueNode> = {
  leave_male_call: {
    id: 'leave_male_call',
    speaker: 'male',
    speakerLabel: 'او',
    rtl: true,
    maleEmotion: 'nervous',
    femaleEmotion: 'curious',
    cameraPreset: 'male_close',
    text: 'ببخشید... سلام. دیدم داری می‌ری از لابی... راستش هر بار که می‌خواستم صدا بزنم، یه لحظه متوقف می‌شدم. ولی فکر کردم اگر همین حالا نگویم، شاید دوباره فرصت نیاد.',
    choices: [
      {
        id: 'leave_resp_lobby_contrast',
        text: 'سلام! بله، می‌روم. اتفاقاً دیدم تو لابی همه با همسایه‌شون حرف می‌زنن جز تو. همیشه سوال می‌کردم که چطور هستی.',
        rtl: true,
        nextNodeId: 'leave_female_lobby_contrast',
      },
      {
        id: 'leave_resp_warm',
        text: 'سلام! راستش یک دو بار در کلاس متوجه شدم می‌نگاهی می‌کنی. خوب بود که اومدی جلو.',
        rtl: true,
        nextNodeId: 'leave_female_warm',
      },
    ],
  },

  leave_female_lobby_contrast: {
    id: 'leave_female_lobby_contrast',
    speaker: 'female',
    speakerLabel: 'تو',
    rtl: true,
    maleEmotion: 'shy',
    femaleEmotion: 'warm_smile',
    cameraPreset: 'female_close',
    text: 'سلام! بله، می‌روم. اتفاقاً دیدم تو لابی همه با همسایه‌شون حرف می‌زنن جز تو. همیشه سوال می‌کردم که چطور هستی و چه فكري می‌کنی.',
    nextNodeId: 'male_confession_warm',
  },

  leave_female_warm: {
    id: 'leave_female_warm',
    speaker: 'female',
    speakerLabel: 'تو',
    rtl: true,
    maleEmotion: 'shy',
    femaleEmotion: 'warm_smile',
    cameraPreset: 'female_close',
    text: 'سلام! راستش یک دو بار در کلاس متوجه شدم می‌نگاهی می‌کنی. خوب بود که اومدی جلو و سلام گفتی.',
    nextNodeId: 'male_confession_warm',
  },

  // ادامه گفت‌وگو (با روح، vulnerable، شخصی‌سازی‌شده با جواب‌های پرسش‌نامه)
  male_confession_warm: {
    id: 'male_confession_warm',
    speaker: 'male',
    speakerLabel: 'او',
    rtl: true,
    maleEmotion: 'warm_smile',
    femaleEmotion: 'warm_smile',
    cameraPreset: 'male_close',
    text: 'راستش، تابلو بودم نه؟ چند وقتیه که تو کلاس را می‌بینم و دلم می‌خواست با تو حرف بزنم، فقط نمیدونستم چطوری شروعش کنم.',
    dynamicText: (answers) =>
      `راستش، تابلو بودم نه؟ چند وقتیه که تو کلاس را می‌بینم و دلم می‌خواست با تو حرف بزنم، فقط نمیدونستم چطوری شروعش کنم. ${getBeginningValueEcho(answers.beginningValue)}`,
    choices: [
      {
        id: 'mid_1',
        text: 'نه، دقیقاً برعکس. همین سادگی و صادقگی که گفتی، هزار دراز شدن بهتر است.',
        rtl: true,
        nextNodeId: 'female_mid_sincere',
      },
      {
        id: 'mid_2',
        text: 'پس کل مدت که در گوشه ساکت نشسته بودی، داشتی فکر می‌کردی جلو بیای یا نه؟',
        rtl: true,
        nextNodeId: 'female_mid_playful',
      },
      {
        id: 'mid_3',
        text: 'اصلاً انتظارش رو نداشتم، ولی مرسی که با این همه محترمانه اومدی جلو.',
        rtl: true,
        nextNodeId: 'female_mid_gentle',
      },
    ],
  },

  female_mid_sincere: {
    id: 'female_mid_sincere',
    speaker: 'female',
    speakerLabel: 'تو',
    rtl: true,
    maleEmotion: 'warm_smile',
    femaleEmotion: 'warm_smile',
    cameraPreset: 'female_close',
    text: 'نه، دقیقاً برعکس. همین سادگی و صادقگی که گفتی، با احساسِ realist و ارزشی است.',
    nextNodeId: 'male_invitation',
  },

  female_mid_playful: {
    id: 'female_mid_playful',
    speaker: 'female',
    speakerLabel: 'تو',
    rtl: true,
    maleEmotion: 'happy_laugh',
    femaleEmotion: 'happy_laugh',
    cameraPreset: 'female_close',
    text: 'پس کل مدت که در گوشه ساکت نشسته بودی، داشتی فکر می‌کردی جلو بیای یا نه؟',
    nextNodeId: 'male_laugh_bridge',
  },

  male_laugh_bridge: {
    id: 'male_laugh_bridge',
    speaker: 'male',
    speakerLabel: 'او',
    rtl: true,
    maleEmotion: 'happy_laugh',
    femaleEmotion: 'warm_smile',
    cameraPreset: 'male_close',
    text: 'دقیقاً مچم رو گرفتی! صد بار خواستم پاشم بیام، هر دفعه گفتم الان درست نیست... تا دیدم داری از لابی می‌ری بیرون و گفتم یا حالا یا هرگز.',
    nextNodeId: 'male_invitation',
  },

  female_mid_gentle: {
    id: 'female_mid_gentle',
    speaker: 'female',
    speakerLabel: 'تو',
    rtl: true,
    maleEmotion: 'hopeful',
    femaleEmotion: 'thoughtful',
    cameraPreset: 'female_close',
    text: 'راستش اصلاً انتظارش رو نداشتم، ولی مرسی که با این همه محترمانه و آرام اومدی جلو.',
    nextNodeId: 'male_invitation',
  },

  // پیشنهاد راحت و بی‌فشار پسر و انتخاب نهایی دختر
  male_invitation: {
    id: 'male_invitation',
    speaker: 'male',
    speakerLabel: 'او',
    rtl: true,
    maleEmotion: 'hopeful',
    femaleEmotion: 'warm_smile',
    cameraPreset: 'two_shot',
    text: 'خلاصه خیلی خوشحال شدم ایستادی و حرف زدیم.',
    dynamicText: (answers) =>
      `خلاصه خیلی خوشحال شدم ایستادی و حرف زدیم. اصلاً نمی‌خوام عجله‌ای باشه؛ فقط اگه تو هم موافق باشی، خوشحال می‌شم ${getAfternoonSuggestion(answers.afternoon)} و یه کم بیشتر با هم آشنا بشیم. نظرت چیه؟`,
    choices: [
      {
        id: 'final_yes_warm',
        text: 'آره چرا که نه، منم خوشحال می‌شم بیشتر با هم آشنا بشیم.',
        rtl: true,
        nextNodeId: 'ending_female_yes',
      },
      {
        id: 'final_slow',
        text: 'فکر خوبیه، بذار آروم و بی‌عجله پیش بریم و بیشتر همو بشناسیم.',
        rtl: true,
        nextNodeId: 'ending_female_slow',
      },
      {
        id: 'final_polite_no',
        text: 'مرسی از لطفت و اینکه با این همه محترمانه گفتی، ولی ترجیح می‌دم فعلاً همون هم‌کلاسی بمونیم.',
        rtl: true,
        nextNodeId: 'ending_female_no',
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
    text: 'آره چرا که نه، منم خوشحال می‌شم بیشتر با هم آشنا بشیم.',
    nextNodeId: 'ending_male_happy',
  },

  ending_female_slow: {
    id: 'ending_female_slow',
    speaker: 'female',
    speakerLabel: 'تو',
    rtl: true,
    maleEmotion: 'hopeful',
    femaleEmotion: 'hopeful',
    cameraPreset: 'female_close',
    text: 'فکر خوبیه، بذار آروم و بی‌عجله پیش بریم و بیشتر همو بشناسیم.',
    nextNodeId: 'ending_male_happy',
  },

  ending_male_happy: {
    id: 'ending_male_happy',
    speaker: 'male',
    speakerLabel: 'او',
    rtl: true,
    maleEmotion: 'warm_smile',
    femaleEmotion: 'warm_smile',
    cameraPreset: 'two_shot',
    text: 'عالیه، پس حتماً هماهنگ می‌کنیم؛ هر وقت که تو راحت باشی. مرسی که یه لحظه وایسادی... روزت خیلی خوب باشه!',
    nextNodeId: null,
  },

  ending_female_no: {
    id: 'ending_female_no',
    speaker: 'female',
    speakerLabel: 'تو',
    rtl: true,
    maleEmotion: 'thoughtful',
    femaleEmotion: 'neutral',
    cameraPreset: 'female_close',
    text: 'مرسی از لطفت و اینکه با این همه محترمانه گفتی، ولی ترجیح می‌دم فعلاً همون هم‌کلاسی بمونیم.',
    nextNodeId: 'ending_male_respectful',
  },

  ending_male_respectful: {
    id: 'ending_male_respectful',
    speaker: 'male',
    speakerLabel: 'او',
    rtl: true,
    maleEmotion: 'warm_smile',
    femaleEmotion: 'warm_smile',
    cameraPreset: 'two_shot',
    text: 'کاملاً درک می‌کنم، مرسی که با این همه راحت و روراست گفتی. بازم خوشحالم، امیدوارم روز خوبی داشته باشی.',
    nextNodeId: null,
  },
};