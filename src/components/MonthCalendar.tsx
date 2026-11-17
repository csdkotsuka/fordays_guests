'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { fmtTime } from '@/lib/date';
import type { EventItem } from '@/lib/types';

const WD = ['日', '月', '火', '水', '木', '金', '土'];

const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/**
 * アプリ内蔵の月間カレンダー（Googleカレンダー不要・高齢者向けに大きな文字で表示）
 */
export function MonthCalendar({
  events,
  renderEvent,
}: {
  events: EventItem[];
  renderEvent: (ev: EventItem) => React.ReactNode;
}) {
  const initial = useMemo(() => {
    const first = events[0] ? new Date(events[0].startAt) : new Date();
    return new Date(first.getFullYear(), first.getMonth(), 1);
  }, [events]);

  const [month, setMonth] = useState<Date>(initial);
  const [selectedDay, setSelectedDay] = useState<number | null>(() => {
    const first = events[0] ? new Date(events[0].startAt) : null;
    return first ? first.getDate() : new Date().getDate();
  });

  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDow = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();

  const byDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const ev of events) {
      const d = new Date(ev.startAt);
      const k = keyOf(d);
      map.set(k, [...(map.get(k) ?? []), ev]);
    }
    return map;
  }, [events]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayKey = keyOf(new Date());
  const selectedEvents = selectedDay ? (byDay.get(`${year}-${m}-${selectedDay}`) ?? []) : [];

  const moveMonth = (delta: number) => {
    const next = new Date(year, m + delta, 1);
    setMonth(next);
    const firstInNext = events
      .map((e) => new Date(e.startAt))
      .find((d) => d.getFullYear() === next.getFullYear() && d.getMonth() === next.getMonth());
    setSelectedDay(firstInNext ? firstInNext.getDate() : null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="card !p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => moveMonth(-1)}
            aria-label="前の月"
            className="glass grid h-12 w-12 place-items-center rounded-full active:scale-90"
          >
            <ChevronLeft size={26} />
          </button>
          <div className="text-[1.35rem] font-bold">
            {year}年 {m + 1}月
          </div>
          <button
            onClick={() => moveMonth(1)}
            aria-label="次の月"
            className="glass grid h-12 w-12 place-items-center rounded-full active:scale-90"
          >
            <ChevronRight size={26} />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 text-center text-sm font-bold">
          {WD.map((w, i) => (
            <div key={w} className={i === 0 ? 'text-red-500' : i === 6 ? 'text-sky-600' : 'text-black/50'}>
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, idx) => {
            if (!d) return <div key={`e-${idx}`} className="h-14" />;
            const k = `${year}-${m}-${d}`;
            const dayEvents = byDay.get(k) ?? [];
            const has = dayEvents.length > 0;
            const isSelected = selectedDay === d;
            const isToday = k === todayKey;
            const dow = (firstDow + d - 1) % 7;

            return (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`relative flex h-16 flex-col items-center justify-start rounded-2xl pt-1.5 transition active:scale-95 ${
                  isSelected
                    ? 'bg-accent text-white shadow-md'
                    : has
                      ? 'bg-accent-soft accent font-bold'
                      : isToday
                        ? 'bg-white/90 ring-2 ring-black/20'
                        : 'hover:bg-white/50'
                }`}
              >
                <span
                  className={`text-lg font-bold leading-none ${
                    isSelected ? 'text-white' : dow === 0 ? 'text-red-500' : dow === 6 ? 'text-sky-600' : ''
                  }`}
                >
                  {d}
                </span>
                {has && (
                  <span
                    className={`mt-1 max-w-full truncate rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold leading-tight ${
                      isSelected ? 'bg-white text-[var(--accent-deep)]' : 'bg-accent text-white'
                    }`}
                  >
                    {fmtTime(dayEvents[0].startAt)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="flex flex-col gap-3">
          <div className="px-1 text-lg font-bold">
            {m + 1}月{selectedDay}日の予定（{selectedEvents.length}件）
          </div>
          {selectedEvents.length === 0 ? (
            <div className="card py-6 text-center text-base font-bold text-black/45">この日の予定はありません</div>
          ) : (
            selectedEvents.map((ev) => <div key={ev.uuid}>{renderEvent(ev)}</div>)
          )}
        </div>
      )}
    </div>
  );
}
