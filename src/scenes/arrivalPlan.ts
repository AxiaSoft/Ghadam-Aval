export interface ArrivalObjective {
  id: string;
  label: string;
  hint: string;
  caption: string;
  position: [number, number, number];
  radius: number;
}
/** The target and its hint are defined together to avoid pointing at the wrong prop. */
export const ARRIVAL_PLAN: Record<1 | 2, readonly [ArrivalObjective, ArrivalObjective]> = {
  1: [
    { id: 'search-bag', label: 'جست‌وجوی کیف', hint: 'کیفت را روی نیمکت بررسی کن؛ کارت دانشجویی‌ات را پیدا نمی‌کنی.', caption: 'کیف را می‌گردی؛ کارت دانشجویی در جیب معمولش نیست.', position: [2.7, 0, -0.9], radius: 1.45 },
    { id: 'check-board', label: 'بررسی تابلوی اشیای پیداشده', hint: 'تابلوی اشیای پیداشده را کنار کتابخانه بررسی کن.', caption: 'کارتت زیر برگه‌های اشیای پیداشده روی تابلوست.', position: [-3, 0, -2.1], radius: 1.45 },
  ],
  2: [
    { id: 'take-card', label: 'برداشتن کارت دانشجویی', hint: 'کارت را از روی تابلو بردار.', caption: 'کارت را برمی‌داری و در جیب کیف می‌گذاری.', position: [-3, 0, -2.1], radius: 1.45 },
    { id: 'go-to-entrance', label: 'رفتن به ورودی دانشکده', hint: 'به سمت ورودی دانشکده برو.', caption: 'با کارت به سمت ورودی دانشکده می‌روی.', position: [0, 0, -5.1], radius: 1.45 },
  ],
};
