'use client';
import { CalendarDays, Check, ExternalLink, Home, MapPin, MessageCircle, Phone, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Empty, useToast } from '@/components/ui';
import { fmtDate, fmtTime } from '@/lib/date';
import { lineOpenAppUrl } from '@/lib/lineText';
import { signIn, useSession } from '@/lib/session';
import {
  findUser,
  invitationsOfEvent,
  membersOf,
  respondByGuestName,
  respondInvitation,
  useDB,
} from '@/lib/store';

export default function Page() {
  return (
    <>
      <div className="app-bg" />
      <main
        className="mx-auto flex min-h-[100dvh] w-full max-w-[520px] flex-col px-4"
        style={{ paddingTop: 'calc(24px + var(--safe-top))', paddingBottom: 'calc(32px + var(--safe-bottom))' }}
      >
        <Suspense>
          <EventPublicInvite />
        </Suspense>
      </main>
    </>
  );
}

function EventPublicInvite() {
  const id = useSearchParams().get('id') || '';
  const db = useDB();
  const session = useSession();
  const toast = useToast();

  const ev = db.events.find((e) => e.uuid === id);
  const currentUser = findUser(db, session?.userUuid);
  const [guestName, setGuestName] = useState(currentUser?.name ?? '');
  const [doneStatus, setDoneStatus] = useState<'yes' | 'no' | null>(null);

  if (!ev) {
    return (
      <div className="my-auto flex flex-col gap-4">
        <Empty icon={CalendarDays} label="イベントが見つかりません" />
        <Link href="/" className="btn-primary">
          トップへ
        </Link>
      </div>
    );
  }

  const leader = findUser(db, ev.leaderUuid);
  const d = new Date(ev.startAt);
  const invs = invitationsOfEvent(db, ev.uuid);
  const myInv = currentUser ? invs.find((i) => i.memberUuid === currentUser.uuid) : null;
  const leaderMembers = membersOf(db, ev.leaderUuid);

  const handleReply = async (status: 'yes' | 'no') => {
    try {
      if (currentUser && myInv) {
        await respondInvitation(currentUser.uuid, myInv.uuid, status, myInv.companionUuids);
      } else {
        const nameToUse = (currentUser?.name || guestName).trim();
        if (!nameToUse) {
          toast('お名前を選択または入力してください');
          return;
        }
        const member = await respondByGuestName(ev.uuid, nameToUse, status);
        if (!currentUser) {
          signIn(member.uuid, 'member');
        }
      }
      setDoneStatus(status);
      toast(status === 'yes' ? '「参加」でお返事しました' : '「不参加」でお返事しました');
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const currentStatus = doneStatus ?? (myInv && myInv.status !== 'pending' ? myInv.status : null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="FORDAYS" className="h-7 w-auto" />
        {leader && <span className="text-base font-bold text-black/60">{leader.name} よりご案内</span>}
      </div>

      <article className="card flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="bg-accent flex h-[80px] w-[80px] shrink-0 flex-col items-center justify-center rounded-3xl text-white shadow-md">
            <span className="text-sm font-bold">{d.getMonth() + 1}月</span>
            <span className="text-[2.1rem] font-bold leading-none">{d.getDate()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="h1 !text-[1.4rem] leading-snug">{ev.title}</h1>
            <div className="mt-1 text-lg font-bold text-black/70">
              {fmtDate(d)} {fmtTime(d)}〜
            </div>
          </div>
        </div>

        {ev.place && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-lg font-bold text-black/70">
            <span className="flex items-center gap-2">
              <MapPin size={22} className="accent shrink-0" />
              <span>{ev.place}</span>
            </span>
            {ev.mapUrl && (
              <a
                href={ev.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="chip bg-accent-soft accent !min-h-[40px] !px-3.5 !text-sm"
              >
                <ExternalLink size={16} /> 地図を見る
              </a>
            )}
          </div>
        )}

        {ev.note && <p className="rounded-2xl bg-white/75 px-4 py-3.5 text-[1.1rem] leading-relaxed">{ev.note}</p>}

        {!currentUser && (
          <div className="flex flex-col gap-2 pt-1">
            <label className="label !mb-0">あなたのお名前</label>
            {leaderMembers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {leaderMembers.map((m) => (
                  <button
                    key={m.uuid}
                    type="button"
                    onClick={() => setGuestName(m.name)}
                    className={`chip ${guestName === m.name ? 'bg-accent text-white shadow-md' : 'glass'}`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}
            <input
              className="field"
              placeholder="お名前を入力"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
          </div>
        )}

        {currentStatus ? (
          <div className="flex flex-col gap-3">
            <div
              className={`flex min-h-[64px] items-center justify-center gap-2 rounded-full text-xl font-bold ${
                currentStatus === 'yes' ? 'bg-accent-soft accent' : 'bg-black/5 text-black/55'
              }`}
            >
              {currentStatus === 'yes' ? <Check size={28} /> : <X size={28} />}
              {currentStatus === 'yes' ? '参加でお返事済み' : '不参加でお返事済み'}
            </div>
            <button
              className="btn-glass !min-h-[54px]"
              onClick={() => handleReply(currentStatus === 'yes' ? 'no' : 'yes')}
            >
              {currentStatus === 'yes' ? '不参加に変更する' : '参加に変更する'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button className="btn-primary !min-h-[72px] !text-[1.3rem]" onClick={() => handleReply('yes')}>
              <Check size={28} /> 参加
            </button>
            <button className="btn-glass !min-h-[72px] !text-[1.3rem]" onClick={() => handleReply('no')}>
              <X size={28} /> 不参加
            </button>
          </div>
        )}
      </article>

      {leader && (
        <section className="card flex flex-col gap-3">
          <div className="text-base font-bold text-black/60">{leader.name} さんに連絡する</div>
          <div className="grid grid-cols-2 gap-3">
            <a
              href={lineOpenAppUrl}
              className="btn !min-h-[60px] text-white"
              style={{ background: '#06C755' }}
            >
              <MessageCircle size={24} /> LINEを開く
            </a>
            {leader.phone ? (
              <a href={`tel:${leader.phone}`} className="btn-glass !min-h-[60px]">
                <Phone size={24} className="accent" /> 電話する
              </a>
            ) : (
              <Link href="/m/" className="btn-glass !min-h-[60px]">
                <Home size={24} /> アプリへ
              </Link>
            )}
          </div>
        </section>
      )}

      <Link href="/m/events/" className="btn-glass">
        <Home size={24} /> ほかのイベントを見る
      </Link>
    </div>
  );
}
