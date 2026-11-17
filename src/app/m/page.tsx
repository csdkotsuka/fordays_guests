'use client';
import { CalendarDays, Gift, PauseCircle, RefreshCcw, ShoppingBag, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { DeadlineCard } from '@/components/DeadlineCard';
import { Tile } from '@/components/ui';
import { invitationsOfMember, useDB } from '@/lib/store';

export default function Page() {
  return <AppShell mode="member">{({ user }) => <Home userUuid={user.uuid} name={user.name} />}</AppShell>;
}

function Home({ userUuid, name }: { userUuid: string; name: string }) {
  const db = useDB();
  const pending = invitationsOfMember(db, userUuid).filter((i) => i.status === 'pending').length;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="h1 mt-1">{name} さん</h1>

      {pending > 0 && (
        <Link href="/m/events/" className="btn-primary !min-h-[76px] !justify-between !px-6">
          <span className="flex items-center gap-3">
            <CalendarDays size={28} /> イベントのお返事
          </span>
          <span className="grid h-10 min-w-10 place-items-center rounded-full bg-white px-2 text-lg text-[var(--accent-deep)]">{pending}</span>
        </Link>
      )}

      <DeadlineCard />

      <div className="grid grid-cols-2 gap-3">
        <Tile href="/m/events/" icon={CalendarDays} label="イベント" badge={pending || undefined} />
        <Tile href="/m/refer/" icon={UserPlus} label="お友だち紹介" />
        <Tile href="/m/rewards/" icon={Gift} label="わたしの成績" />
        <Tile href="/m/products/" icon={ShoppingBag} label="製品" />
        <Tile href="/m/change/" icon={RefreshCcw} label="定期購入の変更" />
        <Tile href="/m/pause/" icon={PauseCircle} label="一時休止" />
      </div>
    </div>
  );
}
