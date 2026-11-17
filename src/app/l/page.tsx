'use client';
import { CalendarDays, MessageCircle, Settings, Users } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Row, Tile } from '@/components/ui';
import { fmtDate, fmtTime } from '@/lib/date';
import { eventsOf, invitationsOfEvent, membersOf, useDB } from '@/lib/store';
import type { User } from '@/lib/types';

export default function Page() {
  return <AppShell mode="leader">{({ user }) => <LeaderHome user={user} />}</AppShell>;
}

function LeaderHome({ user }: { user: User }) {
  const db = useDB();
  const members = membersOf(db, user.uuid);
  const events = eventsOf(db, user.uuid);
  const upcoming = events.filter((e) => new Date(e.startAt).getTime() >= Date.now() - 86400000);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="h1 mt-1">{user.name} リーダー</h1>

      <div className="grid grid-cols-2 gap-3">
        <Tile href="/l/events/" icon={CalendarDays} label="イベント" badge={upcoming.length || undefined} />
        <Tile href="/l/members/" icon={Users} label="メンバー" badge={members.length || undefined} />
        <Tile href="/messages/" icon={MessageCircle} label="メッセージ" />
        <Tile href="/settings/" icon={Settings} label="設定" />
      </div>

      {upcoming.length > 0 && (
        <section className="mt-2 flex flex-col gap-3">
          <h2 className="h2 px-1">直近のイベント</h2>
          {upcoming.slice(0, 4).map((ev) => {
            const invs = invitationsOfEvent(db, ev.uuid);
            const yes = invs.filter((i) => i.status === 'yes').length;
            const pending = invs.filter((i) => i.status === 'pending').length;
            return (
              <Row
                key={ev.uuid}
                href={`/l/events/detail/?id=${ev.uuid}`}
                title={ev.title}
                sub={`${fmtDate(ev.startAt)} ${fmtTime(ev.startAt)}`}
                right={
                  <div className="flex items-center gap-2 text-base font-bold">
                    <span className="accent">参加 {yes}</span>
                    {pending > 0 && <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">未 {pending}</span>}
                  </div>
                }
              />
            );
          })}
        </section>
      )}
    </div>
  );
}
