'use client';
import { CalendarDays, Gift, MessageCircle, PauseCircle, Phone, RefreshCcw, ShoppingBag, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { DeadlineCard } from '@/components/DeadlineCard';
import { Avatar, Tile } from '@/components/ui';
import { lineOpenAppUrl } from '@/lib/lineText';
import { findUser, invitationsOfMember, useDB } from '@/lib/store';
import type { User } from '@/lib/types';

export default function Page() {
  return <AppShell mode="member">{({ user }) => <Home user={user} />}</AppShell>;
}

function Home({ user }: { user: User }) {
  const db = useDB();
  const pending = invitationsOfMember(db, user.uuid).filter((i) => i.status === 'pending').length;
  const leader = findUser(db, user.leaderUuid);

  return (
    <div className="flex flex-col gap-4">
      <div className="mt-1 flex items-center gap-3">
        <Avatar name={user.name} src={user.avatarUrl} />
        <h1 className="h1">{user.name} さん</h1>
      </div>

      {pending > 0 && (
        <Link href="/m/events/" className="btn-primary !min-h-[76px] !justify-between !px-6">
          <span className="flex items-center gap-3">
            <CalendarDays size={28} /> イベントのお返事
          </span>
          <span className="grid h-10 min-w-10 place-items-center rounded-full bg-white px-2 text-lg text-[var(--accent-deep)]">
            {pending}
          </span>
        </Link>
      )}

      <DeadlineCard />

      <div className="grid grid-cols-2 gap-3">
        <Tile href="/m/events/" icon={CalendarDays} label="イベント" badge={pending || undefined} />
        <Tile href="/messages/" icon={MessageCircle} label="メッセージ" />
        <Tile href="/m/refer/" icon={UserPlus} label="お友だち紹介" />
        <Tile href="/m/rewards/" icon={Gift} label="わたしの成績" />
        <Tile href="/m/products/" icon={ShoppingBag} label="製品" />
        <Tile href="/m/change/" icon={RefreshCcw} label="定期購入の変更" />
        <Tile href="/m/pause/" icon={PauseCircle} label="一時休止" />
      </div>

      {leader && (
        <section className="card flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={leader.name} src={leader.avatarUrl} size="sm" />
            <span className="text-base font-bold text-black/70">担当：{leader.name} リーダー</span>
          </div>
          <Link href="/messages/" className="btn-primary !min-h-[60px]">
            <MessageCircle size={24} /> アプリ内でメッセージ
          </Link>
          <div className={leader.phone ? 'grid grid-cols-2 gap-3' : 'flex flex-col'}>
            <a
              href={lineOpenAppUrl}
              className="btn !min-h-[56px] !px-4 text-white"
              style={{ background: '#06C755' }}
            >
              <MessageCircle size={22} /> LINEを開く
            </a>
            {leader.phone && (
              <a href={`tel:${leader.phone}`} className="btn-glass !min-h-[56px] !px-4">
                <Phone size={22} className="accent" /> 電話する
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
