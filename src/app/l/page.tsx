'use client';
import { CalendarDays, Megaphone, Settings, Users } from 'lucide-react';
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

  return (
    <div className="flex flex-col gap-4">
      <h1 className="h1 mt-1">{user.name} リーダー</h1>

      <div className="grid grid-cols-2 gap-3">
        <Tile href="/l/events/" icon={CalendarDays} label="イベント" badge={events.length || undefined} />
        <Tile href="/l/members/" icon={Users} label="メンバー" badge={members.length || undefined} />
        <Tile href="/l/announce/" icon={Megaphone} label="LINE案内文" />
        <Tile href="/settings/" icon={Settings} label="設定" />
      </div>

      {events.length > 0 && (
        <section className="mt-2 flex flex-col gap-3">
          <h2 className="h2 px-1">直近のイベント</h2>
          {events.slice(0, 3).map((ev) => {
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
