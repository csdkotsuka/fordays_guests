'use client';
import { CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { daysUntil, fmtDate, nextDeadline } from '@/lib/date';

export function DeadlineCard({ compact = false }: { compact?: boolean }) {
  const d = nextDeadline();
  const days = daysUntil(d);
  const urgent = days <= 3;

  return (
    <section
      className={`card relative overflow-hidden ${urgent ? 'ring-4 ring-[var(--accent)]/40' : ''}`}
      style={urgent ? { background: 'linear-gradient(160deg, rgba(255,255,255,.75), var(--accent-soft))' } : undefined}
    >
      <div className="flex items-center gap-2 text-base font-bold text-black/60">
        <CalendarClock size={22} className="accent" /> 定期購入の締め切り
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="text-[1.5rem] font-bold">{fmtDate(d)}</div>
        <div className="accent whitespace-nowrap font-bold">
          {days === 0 ? (
            <span className="text-[2rem]">今日</span>
          ) : (
            <>
              <span className="text-lg">あと</span>
              <span className="mx-1 text-[2.6rem] leading-none">{days}</span>
              <span className="text-lg">日</span>
            </>
          )}
        </div>
      </div>
      {!compact && (
        <Link href="/m/change/" className="btn-primary mt-4">
          変更する
        </Link>
      )}
    </section>
  );
}
