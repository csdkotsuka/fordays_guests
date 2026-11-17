'use client';
import {
  Bell,
  Check,
  ChevronLeft,
  Copy,
  ExternalLink,
  MapPin,
  MessageCircle,
  Pencil,
  Trash2,
  UserPlus,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { CopyBox } from '@/components/CopyBox';
import { Avatar, Empty, useToast } from '@/components/ui';
import { Sheet } from '@/components/ui/Sheet';
import { fmtDate, fmtTime, toLocalInput } from '@/lib/date';
import { RSVP_LABEL } from '@/lib/labels';
import { eventLineText } from '@/lib/lineText';
import { showLocalNotification } from '@/lib/pwa';
import {
  deleteEvent,
  findUser,
  invitationsOfEvent,
  inviteMembers,
  membersOf,
  remindPending,
  saveEvent,
  useDB,
} from '@/lib/store';
import type { RsvpStatus, User } from '@/lib/types';

export default function Page() {
  return (
    <AppShell mode="leader">
      {({ user }) => (
        <Suspense>
          <Detail user={user} />
        </Suspense>
      )}
    </AppShell>
  );
}

const BADGE_CLS: Record<RsvpStatus, string> = {
  yes: 'bg-accent text-white',
  pending: 'bg-amber-100 text-amber-900',
  no: 'bg-black/5 text-black/45',
};

function Detail({ user }: { user: User }) {
  const id = useSearchParams().get('id') || '';
  const db = useDB();
  const router = useRouter();
  const toast = useToast();
  const ev = db.events.find((e) => e.uuid === id && e.leaderUuid === user.uuid);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [lineOpen, setLineOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [editForm, setEditForm] = useState({ title: '', startAt: '', place: '', mapUrl: '', note: '' });

  if (!ev) return <Empty icon={ChevronLeft} label="イベントが見つかりません" />;

  const invs = invitationsOfEvent(db, ev.uuid);
  const invitedSet = new Set(invs.map((i) => i.memberUuid));
  const uninvited = membersOf(db, user.uuid).filter((m) => !invitedSet.has(m.uuid));

  const yes = invs.filter((i) => i.status === 'yes');
  const comps = yes.reduce((n, i) => n + i.companionUuids.length, 0);
  const pending = invs.filter((i) => i.status === 'pending');
  const no = invs.filter((i) => i.status === 'no');

  const openEdit = () => {
    setEditForm({
      title: ev.title,
      startAt: toLocalInput(ev.startAt),
      place: ev.place,
      mapUrl: ev.mapUrl ?? '',
      note: ev.note,
    });
    setEditOpen(true);
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Link href="/l/events/" className="glass inline-flex min-h-[52px] items-center gap-1 rounded-full px-4 font-bold">
          <ChevronLeft size={24} /> 一覧
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={openEdit}
            className="glass inline-flex min-h-[48px] items-center gap-2 rounded-full px-4 text-base font-bold"
          >
            <Pencil size={20} className="accent" /> 編集
          </button>
          <button
            onClick={async () => {
              if (!confirm('このイベントを削除しますか？')) return;
              await deleteEvent(user.uuid, ev.uuid);
              toast('削除しました');
              router.replace('/l/events/');
            }}
            aria-label="削除"
            className="glass grid h-12 w-12 place-items-center rounded-full text-red-600"
          >
            <Trash2 size={22} />
          </button>
        </div>
      </div>

      <section className="card mb-4 flex flex-col gap-3">
        <h1 className="h1">{ev.title}</h1>
        <div className="text-lg font-bold text-black/70">
          {fmtDate(ev.startAt)} {fmtTime(ev.startAt)}〜
        </div>
        {ev.place && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-base text-black/70">
            <span className="flex items-center gap-1.5 font-bold">
              <MapPin size={20} className="accent shrink-0" /> {ev.place}
            </span>
            {ev.mapUrl && (
              <a
                href={ev.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="chip bg-accent-soft accent !min-h-[40px] !px-4 !text-base"
              >
                <ExternalLink size={18} /> Googleマップを開く
              </a>
            )}
          </div>
        )}
        {ev.note && <p className="rounded-2xl bg-white/60 px-4 py-3 text-base leading-relaxed">{ev.note}</p>}

        <div className="mt-1 grid grid-cols-3 gap-2 text-center">
          <CountBox label="参加" value={yes.length + comps} sub={comps ? `同行 ${comps}` : undefined} accent />
          <CountBox label="未返答" value={pending.length} warn />
          <CountBox label="不参加" value={no.length} />
        </div>
      </section>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <button
          className="btn-primary !px-4"
          onClick={() => {
            setSel(uninvited.map((m) => m.uuid));
            setInviteOpen(true);
          }}
        >
          <UserPlus size={24} /> 招待する
        </button>
        <button className="btn-glass !px-4" onClick={() => setLineOpen(true)}>
          <Copy size={22} /> LINE案内文
        </button>
      </div>

      {pending.length > 0 && (
        <button
          className="btn-soft mb-5"
          onClick={async () => {
            const n = await remindPending(user.uuid, ev.uuid);
            await showLocalNotification('お返事のお願いを送りました', `${ev.title}（${n}人）`, `/m/events/`);
            toast(`${n}人に通知を送りました`);
          }}
        >
          <Bell size={24} /> 未返答の{pending.length}人に通知を送る
        </button>
      )}

      <h2 className="h2 mb-3 px-1">招待したメンバー（{invs.length}人）</h2>
      {invs.length === 0 ? (
        <Empty icon={UserPlus} label="まだ招待していません" />
      ) : (
        <ul className="flex flex-col gap-3">
          {invs.map((inv) => {
            const m = findUser(db, inv.memberUuid);
            if (!m) return null;
            const compNames = inv.companionUuids
              .map((c) => db.referrals.find((r) => r.uuid === c)?.name)
              .filter(Boolean) as string[];
            return (
              <li key={inv.uuid} className="card flex flex-col gap-2 !py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={m.name} src={m.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[1.15rem] font-bold">{m.name}</div>
                    {inv.remindedAt && inv.status === 'pending' && <div className="text-sm text-black/45">通知済み</div>}
                  </div>
                  <Link
                    href={`/messages/?with=${m.uuid}`}
                    aria-label={`${m.name}さんにメッセージ`}
                    className="glass grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--accent)] active:scale-90"
                  >
                    <MessageCircle size={22} />
                  </Link>
                  <span className={`chip !min-h-[40px] !px-3.5 ${BADGE_CLS[inv.status]}`}>{RSVP_LABEL[inv.status]}</span>
                </div>
                {compNames.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-14">
                    {compNames.map((n) => (
                      <span key={n} className="chip bg-white/80 !min-h-[36px] !px-3 !text-base">
                        <UserRound size={16} /> {n}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* イベント編集シート */}
      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title="イベントを編集">
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!editForm.title.trim()) return;
            await saveEvent({
              uuid: ev.uuid,
              leaderUuid: user.uuid,
              title: editForm.title.trim(),
              startAt: new Date(editForm.startAt).toISOString(),
              place: editForm.place.trim(),
              mapUrl: editForm.mapUrl.trim() || undefined,
              note: editForm.note.trim(),
            });
            toast('保存しました');
            setEditOpen(false);
          }}
        >
          <div>
            <label className="label">タイトル</label>
            <input
              className="field"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
          </div>
          <div>
            <label className="label">日時</label>
            <input
              type="datetime-local"
              className="field"
              value={editForm.startAt}
              onChange={(e) => setEditForm({ ...editForm, startAt: e.target.value })}
            />
          </div>
          <div>
            <label className="label">場所（会場名）</label>
            <input
              className="field"
              value={editForm.place}
              onChange={(e) => setEditForm({ ...editForm, place: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Google マップ URL</label>
            <input
              type="url"
              className="field !text-base"
              placeholder="https://maps.google.com/..."
              value={editForm.mapUrl}
              onChange={(e) => setEditForm({ ...editForm, mapUrl: e.target.value })}
            />
          </div>
          <div>
            <label className="label">メモ</label>
            <textarea
              className="field !text-base"
              rows={3}
              value={editForm.note}
              onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={!editForm.title.trim()}>
            保存する
          </button>
        </form>
      </Sheet>

      <Sheet open={inviteOpen} onClose={() => setInviteOpen(false)} title="招待するメンバー">
        {uninvited.length === 0 ? (
          <p className="py-6 text-center text-lg font-bold text-black/50">全員招待済みです</p>
        ) : (
          <div className="flex flex-col gap-3">
            {uninvited.map((m) => {
              const on = sel.includes(m.uuid);
              return (
                <button
                  key={m.uuid}
                  onClick={() => setSel(on ? sel.filter((x) => x !== m.uuid) : [...sel, m.uuid])}
                  className={`flex min-h-[68px] items-center gap-4 rounded-3xl px-5 text-left text-[1.15rem] font-bold ${
                    on ? 'bg-accent text-white' : 'glass'
                  }`}
                >
                  <span className={`grid h-9 w-9 place-items-center rounded-full border-2 ${on ? 'border-white' : 'border-black/20'}`}>
                    {on && <Check size={22} />}
                  </span>
                  <Avatar name={m.name} src={m.avatarUrl} size="sm" />
                  {m.name}
                </button>
              );
            })}
            <button
              className="btn-primary mt-2"
              disabled={sel.length === 0}
              onClick={async () => {
                const n = await inviteMembers(user.uuid, ev.uuid, sel);
                toast(`${n}人を招待しました`);
                setInviteOpen(false);
              }}
            >
              {sel.length}人を招待する
            </button>
          </div>
        )}
      </Sheet>

      <Sheet open={lineOpen} onClose={() => setLineOpen(false)} title="LINE案内文">
        <CopyBox initial={eventLineText(ev, user.name)} />
      </Sheet>
    </>
  );
}

function CountBox({ label, value, sub, accent, warn }: { label: string; value: number; sub?: string; accent?: boolean; warn?: boolean }) {
  return (
    <div
      className={`rounded-3xl py-3 ${
        accent ? 'bg-accent-soft accent' : warn ? 'bg-amber-100/80 text-amber-900' : 'bg-black/5 text-black/55'
      }`}
    >
      <div className="text-sm font-bold">{label}</div>
      <div className="text-[2rem] font-bold leading-tight">{value}</div>
      {sub && <div className="text-xs font-bold">{sub}</div>}
    </div>
  );
}
