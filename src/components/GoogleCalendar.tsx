'use client';

/** Google カレンダー（月表示）の埋め込み。カレンダーは「一般公開」設定が必要 */
export function GoogleCalendar({ calendarId }: { calendarId: string }) {
  const src =
    'https://calendar.google.com/calendar/embed?' +
    new URLSearchParams({
      src: calendarId,
      ctz: 'Asia/Tokyo',
      mode: 'MONTH',
      hl: 'ja',
      showTitle: '0',
      showPrint: '0',
      showTabs: '0',
      showCalendars: '0',
      showTz: '0',
    }).toString();
  return (
    <div className="glass overflow-hidden rounded-glass p-2">
      <iframe title="カレンダー" src={src} className="h-[560px] w-full rounded-[22px] border-0 bg-white" loading="lazy" />
    </div>
  );
}
