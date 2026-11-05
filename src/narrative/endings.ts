import {
  AfternoonChoice,
  AtmosphereChoice,
  BeginningValueChoice,
  EndingVariant,
  HappinessChoice,
  QuestionnaireAnswers,
} from '../types/game';

const HAPPINESS_NOTES: Record<HappinessChoice, string> = {
  music: 'یه آهنگ کوتاه، با هدفون، بین دو کلاس',
  talking: 'چند دقیقه گپ با کسی که خوب میشناسدت',
  going_out: 'پنج دقیقه بیرون زدن از ساختمان',
  unexpected: 'یه اتفاق کوچیک که برنامه روز را عوض کرد',
  simple_things: 'چای داغ، یا یه میز مرتب',
};

const AFTERNOON_PLANS: Record<AfternoonChoice, string> = {
  cafe: 'کافه کنار کتابخانه، یه چای، بدون عجله',
  walk: 'یه دور تو محوطه تا سرِدر و برگشتن',
  movie: 'چند دقیقه حرف درباره یه فیلم کوتاه',
  games: 'یه بازی ساده سر میز کافه',
  adventure: 'بیرون زدن بیبرنامه و برگشتن هر وقت شد',
};

const PLACE_NOTES: Record<AtmosphereChoice, string> = {
  starry_sky: 'پشت بام خوابگاه، وقتی چراغهای محوطه کم میشوند',
  flowers_gardens: 'کنار باغچه جلوی دانشکده',
  city_night: 'پلههای بیرونی، رو به چراغهای خیابان',
  minimalist: 'ردیف آخر کتابخانه، جایی که کسی نشسته نیست',
  nature: 'زیر درختهای پشت ساختمان قدیمی',
};

const VALUE_NOTES: Record<BeginningValueChoice, string> = {
  honesty: 'حرف ساده و راست، حتی اگر کوتاه باشد',
  humor: 'یک شوخی که مصنوعی نباشد',
  attention_to_detail: 'حواس جمع به همان خط خالی برگه',
  trust: 'بتوانی «نه» بگویی و چیزی عجیب نشود',
  time: 'کسی برای جواب سلام عجله نکند',
};

export interface EndingPresentation {
  eyebrow: string;
  title: string;
  quote: string;
  summary: string;
  details: string[];
  buttonLabel: string;
}

const VARIANT_COPY: Record<
  EndingVariant,
  { title: string; quote: string; endingClause: string }
> = {
  yes: {
    title: 'پس پنجشنبه، قبل از کلاس.',
    quote: '«قرار نبود چیز عجیبی باشد.»',
    endingClause: 'یه قرار ساده برای چک کردن برگهها گذاشته شد',
  },
  slow: {
    title: 'همین خط، فعلاً کافی بود.',
    quote: '«لازم نیست امروز تصمیمی گرفته شود.»',
    endingClause: 'قرار شد عجله نشود',
  },
  no: {
    title: 'همکلاسی ماندیم.',
    quote: '«همینجا تمام شد، بدون دلخوری.»',
    endingClause: 'همانجا، با احترام، تمام شد',
  },
};

export function getEndingPresentation(
  answers: QuestionnaireAnswers,
  variant: EndingVariant
): EndingPresentation {
  const happiness = answers.happiness
    ? HAPPINESS_NOTES[answers.happiness]
    : 'یه چای داغ بین دو کلاس';
  const place = answers.atmosphere
    ? PLACE_NOTES[answers.atmosphere]
    : 'همان ردیف آخر کلاس';
  const value = answers.beginningValue
    ? VALUE_NOTES[answers.beginningValue]
    : 'راحت بودن، قبل از هر چیز دیگر';
  const copy = VARIANT_COPY[variant];

  const details = [
    `چیزی که آن روز حالت را سر جا آورد: ${happiness}.`,
    `جایی که دلت میخواست جزوه را همانجا مرور کنی: ${place}.`,
    `چیزی که برایت مهم بود: ${value}.`,
  ];

  if (variant === 'no') {
    details.push('پسر همان پسر دو ردیف جلوتر ماند؛ اسمی رد و بدل نشد.');
  } else {
    const plan = answers.afternoon
      ? AFTERNOON_PLANS[answers.afternoon]
      : 'یه چای بعد از کلاس، هر وقت شد';
    details.push(`قرار احتمالی: ${plan}.`);
  }

  return {
    eyebrow: 'پایان این روز',
    title: copy.title,
    quote: copy.quote,
    summary: `امروز از یه برگهٔ چاپی شروع شد که خط آخرش خالی بود، با یه سوال کوتاه سر کلاس ادامه پیدا کرد و جلوی در لابی ${copy.endingClause}. هیچ چیز عجیبی اتفاق نیفتاد؛ فقط چند دقیقه حرف زدیم.`,
    details,
    buttonLabel: 'یک روز دیگر از اول',
  };
}
