'use client';
import { ChevronRight, HeartHandshake, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { HOME, useSession } from '@/lib/session';

export default function Entry() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.replace(HOME[session.mode]);
    else document.documentElement.dataset.mode = 'member';
  }, [session, router]);

  return (
    <>
      <div className="app-bg" />
      <main
        className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col px-5"
        style={{ paddingTop: 'calc(40px + var(--safe-top))', paddingBottom: 'calc(24px + var(--safe-bottom))' }}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark.svg" alt="" className="h-32 w-32 drop-shadow-sm" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="FORDAYS" className="h-10 w-auto opacity-90" />
        </div>

        <div className="flex flex-col gap-3.5">
          <RoleButton href="/login/member/" color="#f7323f" icon={<HeartHandshake size={34} />} label="メンバーの方" />
          <RoleButton href="/login/leader/" color="#2e7d4f" icon={<Users size={34} />} label="リーダーの方" />
          <Link href="/signup/" className="btn-soft mt-1 !min-h-[68px]">
            <UserPlus size={26} /> はじめての方（新規登録）
          </Link>
        </div>

        <Link href="/login/admin/" className="mt-6 self-center px-6 py-3 text-base font-bold text-black/40">
          オーナー
        </Link>
      </main>
    </>
  );
}

function RoleButton({ href, color, icon, label }: { href: string; color: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="glass flex min-h-[92px] items-center gap-4 rounded-[32px] px-5 transition active:scale-[0.97]">
      <span className="grid h-16 w-16 place-items-center rounded-full text-white shadow-md" style={{ background: color }}>
        {icon}
      </span>
      <span className="flex-1 text-[1.4rem] font-bold">{label}</span>
      <ChevronRight size={30} className="text-black/30" />
    </Link>
  );
}
