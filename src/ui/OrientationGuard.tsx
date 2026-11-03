import React, { useEffect, useState } from 'react';

/**
 * دیگر جلوی بازی را نمیگیرد؛ فقط یک یادداشت کوچک میدهد.
 * بازی هم در افقی و هم در عمودی کار میکند.
 */
export const OrientationGuard: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const update = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  if (!isPortrait || dismissed) return null;

  return (
    <div className="portrait-hint" dir="rtl" role="status">
      <span className="portrait-hint-icon" aria-hidden="true">
        ↻
      </span>
      <span>اگر گوشی را افقی بگیری، صحنه جای بیشتری دارد.</span>
      <button type="button" onClick={() => setDismissed(true)} aria-label="بستن یادداشت">
        باشه
      </button>
    </div>
  );
};
