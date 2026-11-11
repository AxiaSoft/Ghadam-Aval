import type { EndingVariant } from '../types/game';

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

export function getEndingPresentation(variant: EndingVariant): EndingPresentation {
  const copy = VARIANT_COPY[variant];
  const details = variant === 'no'
    ? ['پسر همان پسر دو ردیف جلوتر ماند؛ اسمی رد و بدل نشد.']
    : [];

  return {
    eyebrow: 'پایان این روز',
    title: copy.title,
    quote: copy.quote,
    summary: `امروز از یه برگهٔ چاپی شروع شد که خط آخرش خالی بود، با یه سوال کوتاه سر کلاس ادامه پیدا کرد و جلوی در لابی ${copy.endingClause}. هیچ چیز عجیبی اتفاق نیفتاد؛ فقط چند دقیقه حرف زدیم.`,
    details,
    buttonLabel: 'یک روز دیگر از اول',
  };
}
