'use client';
import { Bell, Check, ChevronLeft, Copy, MapPin, Trash2, UserPlus, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { CopyBox } from '@/components/CopyBox';
import { Avatar, Empty, useToast } from '@/components/ui';
import { Sheet } from '@/components/ui/Sheet';
import { fmtDate, fmtTime } from '@/lib/date';
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
  const [sel, setSel] = useState<string[]>([]);

  if (!ev) return <Empty icon={ChevronLeft} label="イベントが見つかりません" />;

  const invs = invitationsOfEvent(db, ev.uuid);
  const invitedSet = new Set(invs.map((i) => i.memberUuid));
  const uninvited = membersOf(db, user.uuid).filter((m) => !invitedSet.has(m.uuid));

  const yes = invs.filter((i) => i.status === 'yes');
  const comps = yes.reduce((n, i) => n + i.companionUuids.length, 0);
  const pending = invs.filter((i) => i.status === 'pending');
  const no = invs.filter((i) => i.status === 'no');

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Link href="/l/events/" className="glass inline-flex min-h-[52px] items-center gap-1 rounded-full px-4 font-bold">
          <ChevronLeft size={24} /> 一覧
        </Link>
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

      <section className="card mb-4 flex flex-col gap-3">
        <h1 className="h1">{ev.title}</h1>
        <div className="text-lg font-bold text-black/70">
          {fmtDate(ev.startAt)} {fmtTime(ev.startAt)}〜
        </div>
        {ev.place && (
          <div className="flex items-center gap-1.5 text-base text-black/60">
            <MapPin size={20} /> {ev.place}
          </div>
        )}
        {ev.note && <p className="rounded-2xl bg-white/60 px-4 py-3 text-base">{ev.note}</p>}

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
                  <Avatar name={m.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[1.15rem] font-bold">{m.name}</div>
                    {inv.remindedAt && inv.status === 'pending' && <div className="text-sm text-black/45">通知済み</div>}
                  </div>
                  <span className={`chip !min-h-[40px] ${BADGE_CLS[inv.status]}`}>{RSVP_LABEL[inv.status]}</span>
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
