'use client';
import { CalendarDays, ExternalLink, MapPin, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { MonthCalendar } from '@/components/MonthCalendar';
import { Empty, PageTitle, Segmented, useToast } from '@/components/ui';
import { Sheet } from '@/components/ui/Sheet';
import { fmtDate, fmtTime, toLocalInput } from '@/lib/date';
import { eventsOf, invitationsOfEvent, inviteMembers, membersOf, saveEvent, useDB } from '@/lib/store';
import type { EventItem, User } from '@/lib/types';

export default function Page() {
  return <AppShell mode="leader">{({ user }) => <LeaderEvents user={user} />}</AppShell>;
}

function defaultStart() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(13, 0, 0, 0);
  return toLocalInput(d.toISOString());
}

function LeaderEvents({ user }: { user: User }) {
  const db = useDB();
  const router = useRouter();
  const toast = useToast();
  const events = eventsOf(db, user.uuid);
  const myMembers = membersOf(db, user.uuid);
  const [view, setView] = useState<'card' | 'cal'>('card');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', startAt: defaultStart(), place: '', mapUrl: '', note: '', inviteAll: true });

  const close = () => {
    setOpen(false);
    setForm({ title: '', startAt: defaultStart(), place: '', mapUrl: '', note: '', inviteAll: true });
  };

  const renderEvent = (ev: EventItem) => {
    const d = new Date(ev.startAt);
    const invs = invitationsOfEvent(db, ev.uuid);
    const yes = invs.filter((i) => i.status === 'yes');
    const comps = yes.reduce((n, i) => n + i.companionUuids.length, 0);
    const pending = invs.filter((i) => i.status === 'pending').length;
    const no = invs.filter((i) => i.status === 'no').length;
    return (
      <div key={ev.uuid} className="card flex flex-col gap-3">
        <Link href={`/l/events/detail/?id=${ev.uuid}`} className="flex gap-4 transition active:scale-[0.99]">
          <div className="bg-accent flex h-[72px] w-[72px] shrink-0 flex-col items-center justify-center rounded-3xl text-white shadow-md">
            <span className="text-sm font-bold">{d.getMonth() + 1}月</span>
            <span className="text-[1.9rem] font-bold leading-none">{d.getDate()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="h2 leading-snug">{ev.title}</h2>
            <div className="text-base text-black/60">
              {fmtDate(d)} {fmtTime(d)}
            </div>
          </div>
        </Link>

        {ev.place && (
          <div className="flex items-center justify-between gap-2 text-base text-black/70">
            <span className="flex min-w-0 items-center gap-1.5">
              <MapPin size={18} className="accent shrink-0" />
              <span className="truncate">{ev.place}</span>
            </span>
            {ev.mapUrl && (
              <a
                href={ev.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="chip bg-accent-soft accent !min-h-[36px] shrink-0 !px-3 !text-sm"
              >
                <ExternalLink size={15} /> 地図
              </a>
            )}
          </div>
        )}

        <Link href={`/l/events/detail/?id=${ev.uuid}`} className="flex flex-col gap-3">
          {ev.note && <p className="rounded-2xl bg-white/60 px-4 py-2.5 text-base leading-relaxed">{ev.note}</p>}
          <div className="grid grid-cols-3 gap-2 text-center text-base font-bold">
            <div className="bg-accent-soft accent rounded-2xl py-2">
              参加 {yes.length}
              {comps > 0 ? `+${comps}` : ''}
            </div>
            <div className="rounded-2xl bg-amber-100/80 py-2 text-amber-900">未返答 {pending}</div>
            <div className="rounded-2xl bg-black/5 py-2 text-black/50">不参加 {no}</div>
          </div>
        </Link>
      </div>
    );
  };

  return (
    <>
      <PageTitle>イベント</PageTitle>

      <button className="btn-primary mb-4 !min-h-[72px]" onClick={() => setOpen(true)}>
        <Plus size={28} /> 新しいイベント
      </button>

      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'card', label: 'カード' },
          { value: 'cal', label: 'カレンダー' },
        ]}
      />

      {events.length === 0 ? (
        <Empty icon={CalendarDays} label="イベントはありません" />
      ) : view === 'cal' ? (
        <MonthCalendar events={events} renderEvent={renderEvent} />
      ) : (
        <div className="flex flex-col gap-3">{events.map(renderEvent)}</div>
      )}

      <Sheet open={open} onClose={close} title="新しいイベント">
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.title.trim()) return;
            const ev = await saveEvent({
              leaderUuid: user.uuid,
              title: form.title.trim(),
              startAt: new Date(form.startAt).toISOString(),
              place: form.place.trim(),
              mapUrl: form.mapUrl.trim() || undefined,
              note: form.note.trim(),
            });
            if (form.inviteAll && myMembers.length > 0) {
              await inviteMembers(
                user.uuid,
                ev.uuid,
                myMembers.map((m) => m.uuid),
              );
            }
            toast('作成しました');
            close();
            router.push(`/l/events/detail/?id=${ev.uuid}`);
          }}
        >
          <div>
            <label className="label">タイトル</label>
            <input className="field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
          </div>
          <div>
            <label className="label">日時</label>
            <input
              type="datetime-local"
              className="field"
              value={form.startAt}
              onChange={(e) => setForm({ ...form, startAt: e.target.value })}
            />
          </div>
          <div>
            <label className="label">場所（会場名）</label>
            <input
              className="field"
              placeholder="松山市 コミュニティセンター"
              value={form.place}
              onChange={(e) => setForm({ ...form, place: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Google マップ URL</label>
            <input
              type="url"
              className="field !text-base"
              placeholder="https://maps.google.com/..."
              value={form.mapUrl}
              onChange={(e) => setForm({ ...form, mapUrl: e.target.value })}
            />
          </div>
          <div>
            <label className="label">メモ</label>
            <textarea
              className="field !text-base"
              rows={3}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
          {myMembers.length > 0 && (
            <label className="glass flex min-h-[60px] items-center gap-3 rounded-2xl px-4 text-[1.1rem] font-bold">
              <input
                type="checkbox"
                className="h-6 w-6 accent-[var(--accent)]"
                checked={form.inviteAll}
                onChange={(e) => setForm({ ...form, inviteAll: e.target.checked })}
              />
              メンバー全員を招待（{myMembers.length}人）
            </label>
          )}
          <button type="submit" className="btn-primary" disabled={!form.title.trim()}>
            作成
          </button>
        </form>
      </Sheet>
    </>
  );
}
