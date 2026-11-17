'use client';
import { CalendarDays, ExternalLink, HeartHandshake, MapPin, UserRound, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { MonthCalendar } from '@/components/MonthCalendar';
import { UserDetailContent } from '@/components/UserDetailContent';
import { Avatar, Empty, PageTitle, Segmented } from '@/components/ui';
import { Sheet } from '@/components/ui/Sheet';
import { fmtDate, fmtTime } from '@/lib/date';
import { RSVP_LABEL } from '@/lib/labels';
import { eventsOf, findUser, invitationsOfEvent, membersOf, useDB } from '@/lib/store';
import type { EventItem, RsvpStatus } from '@/lib/types';

export default function Page() {
  return <AppShell mode="admin">{() => <Admin />}</AppShell>;
}

type Tab = 'leader' | 'member' | 'event';

const BADGE_CLS: Record<RsvpStatus, string> = {
  yes: 'bg-accent text-white',
  pending: 'bg-amber-100 text-amber-900',
  no: 'bg-black/5 text-black/45',
};

function Admin() {
  const db = useDB();
  const [tab, setTab] = useState<Tab>('leader');
  const [evView, setEvView] = useState<'card' | 'cal'>('cal');
  const [selUserUuid, setSelUserUuid] = useState<string | null>(null);
  const [selEventUuid, setSelEventUuid] = useState<string | null>(null);

  const leaders = useMemo(
    () => db.users.filter((u) => u.roles.includes('leader') && !u.roles.includes('admin') && !u.leaderUuid),
    [db.users],
  );
  const members = useMemo(() => db.users.filter((u) => u.roles.includes('member')), [db.users]);
  const allEvents = useMemo(
    () => db.events.slice().sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [db.events],
  );

  const selUser = findUser(db, selUserUuid);
  const selEvent = db.events.find((e) => e.uuid === selEventUuid) ?? null;

  const renderEventCard = (ev: EventItem) => {
    const d = new Date(ev.startAt);
    const organizer = findUser(db, ev.leaderUuid);
    const invs = invitationsOfEvent(db, ev.uuid);
    const yes = invs.filter((i) => i.status === 'yes');
    const comps = yes.reduce((n, i) => n + i.companionUuids.length, 0);
    const pending = invs.filter((i) => i.status === 'pending').length;
    const no = invs.filter((i) => i.status === 'no').length;

    return (
      <article
        key={ev.uuid}
        onClick={() => setSelEventUuid(ev.uuid)}
        className="card flex cursor-pointer flex-col gap-3 transition active:scale-[0.98]"
      >
        {organizer && (
          <div className="flex items-center gap-2.5 border-b border-black/10 pb-2.5">
            <Avatar name={organizer.name} src={organizer.avatarUrl} size="sm" />
            <span className="text-base font-bold">主催：{organizer.name} リーダー</span>
          </div>
        )}

        <div className="flex gap-4">
          <div className="bg-accent flex h-[70px] w-[70px] shrink-0 flex-col items-center justify-center rounded-3xl text-white shadow-md">
            <span className="text-xs font-bold">{d.getMonth() + 1}月</span>
            <span className="text-[1.8rem] font-bold leading-none">{d.getDate()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="h2 leading-snug">{ev.title}</h3>
            <div className="mt-1 text-base text-black/65">
              {fmtDate(d)} {fmtTime(d)}〜
            </div>
          </div>
        </div>

        {ev.place && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-base text-black/70">
            <span className="flex items-center gap-1.5">
              <MapPin size={18} className="accent shrink-0" />
              <span>{ev.place}</span>
            </span>
            {ev.mapUrl && (
              <a
                href={ev.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="chip bg-accent-soft accent !min-h-[34px] !px-3 !text-xs"
              >
                <ExternalLink size={14} /> 地図
              </a>
            )}
          </div>
        )}

        {ev.note && <p className="rounded-2xl bg-white/60 px-4 py-2.5 text-base leading-relaxed">{ev.note}</p>}

        <div className="grid grid-cols-3 gap-2 text-center text-sm font-bold">
          <div className="bg-accent-soft accent rounded-2xl py-2">
            参加 {yes.length}
            {comps > 0 ? `+${comps}` : ''}
          </div>
          <div className="rounded-2xl bg-amber-100/80 py-2 text-amber-900">未返答 {pending}</div>
          <div className="rounded-2xl bg-black/5 py-2 text-black/50">不参加 {no}</div>
        </div>
      </article>
    );
  };

  return (
    <>
      <PageTitle>オーナー</PageTitle>

      {/* クリックで絞り込みできるダッシュボードカード */}
      <div className="mb-5 grid grid-cols-3 gap-3 text-center">
        <TabBox
          active={tab === 'leader'}
          onClick={() => setTab('leader')}
          icon={<Users size={26} />}
          label="リーダー"
          value={leaders.length}
        />
        <TabBox
          active={tab === 'member'}
          onClick={() => setTab('member')}
          icon={<HeartHandshake size={26} />}
          label="メンバー"
          value={members.length}
        />
        <TabBox
          active={tab === 'event'}
          onClick={() => setTab('event')}
          icon={<CalendarDays size={26} />}
          label="イベント"
          value={allEvents.length}
        />
      </div>

      {tab === 'leader' && (
        <>
          <h2 className="h2 mb-3 px-1">リーダー一覧（{leaders.length}人）</h2>
          <ul className="flex flex-col gap-3">
            {leaders.map((l) => {
              const mCount = membersOf(db, l.uuid).length;
              const eCount = eventsOf(db, l.uuid).length;
              const activeSubs = (l.subscriptions ?? []).filter((s) => !s.endMonth).length;
              return (
                <li key={l.uuid}>
                  <button
                    onClick={() => setSelUserUuid(l.uuid)}
                    className="card flex w-full items-center gap-3.5 !py-4 text-left transition active:scale-[0.98]"
                  >
                    <Avatar name={l.name} src={l.avatarUrl} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[1.15rem] font-bold">{l.name}</div>
                      <div className="text-sm text-black/55">
                        {l.memberNo} ／ 定期 {activeSubs}品
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-sm font-bold">
                      <div>担当 {mCount}人</div>
                      <div className="text-black/50">イベント {eCount}件</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {tab === 'member' && (
        <>
          <h2 className="h2 mb-3 px-1">メンバー一覧（{members.length}人）</h2>
          <ul className="flex flex-col gap-3">
            {members.map((m) => {
              const leader = findUser(db, m.leaderUuid);
              const activeSubs = (m.subscriptions ?? []).filter((s) => !s.endMonth).length;
              return (
                <li key={m.uuid}>
                  <button
                    onClick={() => setSelUserUuid(m.uuid)}
                    className="card flex w-full items-center gap-3.5 !py-4 text-left transition active:scale-[0.98]"
                  >
                    <Avatar name={m.name} src={m.avatarUrl} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[1.15rem] font-bold">{m.name}</div>
                      <div className="text-sm text-black/55">
                        {m.memberNo || '番号なし'}
                        {leader ? ` ／ 担当: ${leader.name}` : ''}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-sm font-bold">
                      <div>定期 {activeSubs}品</div>
                      <div className="text-black/50">{m.points}pt</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {tab === 'event' && (
        <>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="h2">全イベント一覧（{allEvents.length}件）</h2>
          </div>
          <Segmented
            value={evView}
            onChange={setEvView}
            options={[
              { value: 'cal', label: 'カレンダー' },
              { value: 'card', label: 'カード' },
            ]}
          />
          {evView === 'cal' ? (
            <MonthCalendar events={allEvents} renderEvent={renderEventCard} />
          ) : (
            <div className="flex flex-col gap-3">{allEvents.map(renderEventCard)}</div>
          )}
        </>
      )}

      {/* リーダー・メンバー詳細シート（購入履歴＋イベント参加履歴） */}
      <Sheet open={!!selUser} onClose={() => setSelUserUuid(null)} title={selUser?.name}>
        {selUser && <UserDetailContent target={selUser} showMessageButton={false} />}
      </Sheet>

      {/* イベント案内先＆返信状況シート */}
      <Sheet open={!!selEvent} onClose={() => setSelEventUuid(null)} title={selEvent?.title}>
        {selEvent && <EventRsvpSheet event={selEvent} />}
      </Sheet>
    </>
  );
}

function EventRsvpSheet({ event }: { event: EventItem }) {
  const db = useDB();
  const organizer = findUser(db, event.leaderUuid);
  const invs = invitationsOfEvent(db, event.uuid);
  const yes = invs.filter((i) => i.status === 'yes');
  const pending = invs.filter((i) => i.status === 'pending');
  const no = invs.filter((i) => i.status === 'no');

  return (
    <div className="flex flex-col gap-4">
      <div className="glass rounded-2xl p-3.5 text-base">
        <div className="font-bold">
          {fmtDate(event.startAt)} {fmtTime(event.startAt)}〜
        </div>
        {organizer && <div className="text-sm text-black/60">主催：{organizer.name} リーダー</div>}
        {event.place && <div className="text-sm text-black/60">場所：{event.place}</div>}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm font-bold">
        <div className="bg-accent-soft accent rounded-2xl py-2.5">参加 {yes.length}</div>
        <div className="rounded-2xl bg-amber-100/80 py-2.5 text-amber-900">未返答 {pending.length}</div>
        <div className="rounded-2xl bg-black/5 py-2.5 text-black/50">不参加 {no.length}</div>
      </div>

      <h3 className="h2">案内を送ったメンバー（{invs.length}人）</h3>
      {invs.length === 0 ? (
        <Empty icon={Users} label="案内を送ったメンバーはいません" />
      ) : (
        <ul className="flex flex-col gap-2">
          {invs.map((inv) => {
            const m = findUser(db, inv.memberUuid);
            if (!m) return null;
            const compNames = inv.companionUuids
              .map((c) => db.referrals.find((r) => r.uuid === c)?.name)
              .filter(Boolean) as string[];
            return (
              <li key={inv.uuid} className="glass flex flex-col gap-1.5 rounded-2xl px-3.5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={m.name} src={m.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1 truncate font-bold">{m.name}</div>
                  <span className={`chip !min-h-[34px] !px-3 !text-xs ${BADGE_CLS[inv.status]}`}>
                    {RSVP_LABEL[inv.status]}
                  </span>
                </div>
                {compNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-12">
                    {compNames.map((n) => (
                      <span key={n} className="chip bg-white/80 !min-h-[30px] !px-2.5 !text-xs">
                        <UserRound size={14} /> {n}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TabBox({
  active,
  onClick,
  icon,
  label,
  value,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-glass p-4 transition active:scale-95 ${
        active ? 'bg-accent text-white shadow-lg ring-4 ring-black/10' : 'card'
      }`}
    >
      <span className={active ? 'text-white' : 'accent'}>{icon}</span>
      <span className={`text-sm font-bold ${active ? 'text-white/90' : 'text-black/55'}`}>{label}</span>
      <span className="text-[1.9rem] font-bold leading-none">{value}</span>
    </button>
  );
}
