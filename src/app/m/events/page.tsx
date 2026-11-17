'use client';
import { CalendarDays, Check, ExternalLink, MapPin, Plus, UserRound, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { MonthCalendar } from '@/components/MonthCalendar';
import { Empty, PageTitle, Segmented, useToast } from '@/components/ui';
import { Sheet } from '@/components/ui/Sheet';
import { fmtDate, fmtTime } from '@/lib/date';
import { addReferral, invitationsOfMember, referralsOf, respondInvitation, useDB } from '@/lib/store';
import type { EventItem, Invitation, User } from '@/lib/types';

export default function Page() {
  return <AppShell mode="member">{({ user }) => <Events user={user} />}</AppShell>;
}

function Events({ user }: { user: User }) {
  const db = useDB();
  const [view, setView] = useState<'card' | 'cal'>('card');
  const [answering, setAnswering] = useState<Invitation | null>(null);
  const toast = useToast();

  const items = useMemo(
    () =>
      invitationsOfMember(db, user.uuid)
        .map((inv) => ({ inv, ev: db.events.find((e) => e.uuid === inv.eventUuid) }))
        .filter((x): x is { inv: Invitation; ev: EventItem } => !!x.ev)
        .sort((a, b) => a.ev.startAt.localeCompare(b.ev.startAt)),
    [db, user.uuid],
  );

  const renderCard = (ev: EventItem, inv: Invitation) => (
    <EventCard
      key={inv.uuid}
      ev={ev}
      inv={inv}
      companions={inv.companionUuids.map((c) => db.referrals.find((r) => r.uuid === c)?.name).filter(Boolean) as string[]}
      onYes={() => setAnswering(inv)}
      onNo={async () => {
        await respondInvitation(user.uuid, inv.uuid, 'no', []);
        toast('お返事しました');
      }}
    />
  );

  return (
    <>
      <PageTitle>イベント</PageTitle>

      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'card', label: 'カード' },
          { value: 'cal', label: 'カレンダー' },
        ]}
      />

      {items.length === 0 ? (
        <Empty icon={CalendarDays} label="イベントはありません" />
      ) : view === 'cal' ? (
        <MonthCalendar
          events={items.map((x) => x.ev)}
          renderEvent={(ev) => {
            const found = items.find((x) => x.ev.uuid === ev.uuid);
            return found ? renderCard(found.ev, found.inv) : null;
          }}
        />
      ) : (
        <div className="flex flex-col gap-4">{items.map(({ inv, ev }) => renderCard(ev, inv))}</div>
      )}

      <CompanionSheet user={user} inv={answering} onClose={() => setAnswering(null)} />
    </>
  );
}

function EventCard({
  ev,
  inv,
  companions,
  onYes,
  onNo,
}: {
  ev: EventItem;
  inv: Invitation;
  companions: string[];
  onYes: () => void;
  onNo: () => void;
}) {
  const d = new Date(ev.startAt);
  return (
    <article className="card flex flex-col gap-4">
      <div className="flex gap-4">
        <div className="bg-accent flex h-[76px] w-[76px] shrink-0 flex-col items-center justify-center rounded-3xl text-white shadow-md">
          <span className="text-sm font-bold">{d.getMonth() + 1}月</span>
          <span className="text-[2rem] font-bold leading-none">{d.getDate()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="h2 leading-snug">{ev.title}</h2>
          <div className="mt-1 text-base text-black/60">
            {fmtDate(d)} {fmtTime(d)}
          </div>
          {ev.place && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-base text-black/65">
              <span className="flex items-center gap-1">
                <MapPin size={18} className="accent shrink-0" />
                <span>{ev.place}</span>
              </span>
              {ev.mapUrl && (
                <a
                  href={ev.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chip bg-accent-soft accent !min-h-[34px] !px-3 !text-xs"
                >
                  <ExternalLink size={14} /> 地図を見る
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      {ev.note && <p className="rounded-2xl bg-white/60 px-4 py-3 text-base leading-relaxed">{ev.note}</p>}

      {inv.status === 'pending' ? (
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-primary" onClick={onYes}>
            <Check size={26} /> 参加
          </button>
          <button className="btn-glass" onClick={onNo}>
            <X size={26} /> 不参加
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div
            className={`flex min-h-[56px] items-center justify-center gap-2 rounded-full text-lg font-bold ${
              inv.status === 'yes' ? 'bg-accent-soft accent' : 'bg-black/5 text-black/50'
            }`}
          >
            {inv.status === 'yes' ? <Check size={24} /> : <X size={24} />}
            {inv.status === 'yes' ? '参加' : '不参加'}
          </div>
          {companions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {companions.map((n) => (
                <span key={n} className="chip bg-white/70 !min-h-[40px] !text-base">
                  <UserRound size={18} /> {n}
                </span>
              ))}
            </div>
          )}
          {inv.status === 'yes' ? (
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-soft !min-h-[52px]" onClick={onYes}>
                一緒に行く人
              </button>
              <button className="btn-glass !min-h-[52px]" onClick={onNo}>
                不参加に変更
              </button>
            </div>
          ) : (
            <button className="btn-soft !min-h-[52px]" onClick={onYes}>
              参加に変更
            </button>
          )}
        </div>
      )}
    </article>
  );
}

/** 参加時：誰を連れて行くか */
function CompanionSheet({ user, inv, onClose }: { user: User; inv: Invitation | null; onClose: () => void }) {
  const db = useDB();
  const toast = useToast();
  const mine = referralsOf(db, user.uuid);
  const [sel, setSel] = useState<string[] | null>(null);
  const [newName, setNewName] = useState('');
  const selected = sel ?? inv?.companionUuids ?? [];

  const close = () => {
    setSel(null);
    setNewName('');
    onClose();
  };
  const toggle = (id: string) => setSel(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <Sheet open={!!inv} onClose={close} title="一緒に行く人">
      <div className="flex flex-col gap-3">
        {mine.map((r) => {
          const on = selected.includes(r.uuid);
          return (
            <button
              key={r.uuid}
              onClick={() => toggle(r.uuid)}
              className={`flex min-h-[68px] items-center gap-4 rounded-3xl px-5 text-left text-[1.15rem] font-bold transition ${
                on ? 'bg-accent text-white shadow-md' : 'glass'
              }`}
            >
              <span className={`grid h-9 w-9 place-items-center rounded-full border-2 ${on ? 'border-white bg-white/25' : 'border-black/20'}`}>
                {on && <Check size={22} />}
              </span>
              {r.name}
            </button>
          );
        })}

        <div className="glass flex items-center gap-2 rounded-3xl p-2">
          <input
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[1.15rem] outline-none"
            placeholder="新しい人のお名前"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            className="bg-accent grid h-14 w-14 shrink-0 place-items-center rounded-full text-white disabled:opacity-30"
            disabled={!newName.trim()}
            aria-label="追加"
            onClick={async () => {
              const r = await addReferral({ referrerUuid: user.uuid, name: newName });
              setSel([...selected, r.uuid]);
              setNewName('');
            }}
          >
            <Plus size={28} />
          </button>
        </div>

        <button
          className="btn-primary mt-2"
          onClick={async () => {
            if (!inv) return;
            await respondInvitation(user.uuid, inv.uuid, 'yes', selected);
            toast('お返事しました');
            close();
          }}
        >
          <Check size={26} /> {selected.length ? `${selected.length}人と参加` : 'ひとりで参加'}
        </button>
      </div>
    </Sheet>
  );
}
