'use client';
import { ArrowLeftRight, LogOut, Menu, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { MENU } from '@/config/menu';
import { checkDeadlineReminder, registerSW } from '@/lib/pwa';
import { applyFontScale } from '@/lib/prefs';
import { HOME, MODE_LABEL, setMode, signOut, useSession } from '@/lib/session';
import { findUser, unreadCountFor, useDB } from '@/lib/store';
import type { Mode, User } from '@/lib/types';
import { Sheet } from './ui/Sheet';
import { useToast } from './ui';

const MODE_COLOR: Record<Mode, string> = { member: '#f7323f', leader: '#2e7d4f', admin: '#3d3a39' };

/** ログイン後の共通レイアウト */
export function AppShell({ mode, children }: { mode?: Mode; children: (ctx: { user: User; mode: Mode }) => ReactNode }) {
  const session = useSession();
  const db = useDB();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const user = findUser(db, session?.userUuid);
  const current: Mode = mode ?? session?.mode ?? 'member';

  useEffect(() => {
    setReady(true);
    applyFontScale();
    registerSW().then(() => checkDeadlineReminder());
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace('/');
      return;
    }
    if (db.users.length && !user) {
      // 古い／無効なセッションが残っていた場合はクリアしてからトップへ戻す（リダイレクトループ防止）
      signOut();
      router.replace('/');
      return;
    }
    if (user && !user.roles.includes(current)) {
      router.replace(HOME[user.roles[0]]);
      return;
    }
    if (mode && session.mode !== mode) setMode(mode);
    document.documentElement.dataset.mode = current;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', MODE_COLOR[current]);
  }, [ready, session, user, current, mode, router, db.users.length]);

  if (!ready || !user || !user.roles.includes(current)) return <div className="app-bg" />;

  return (
    <>
      <div className="app-bg" />
      <Header user={user} mode={current} />
      <main className="mx-auto w-full max-w-[560px] px-4 pb-10" style={{ paddingTop: 'calc(96px + var(--safe-top))' }}>
        {children({ user, mode: current })}
      </main>
      <footer className="pb-6 text-center text-sm text-black/35" style={{ paddingBottom: 'calc(20px + var(--safe-bottom))' }}>
        © FORDAYS パートナー手帳
      </footer>
    </>
  );
}

function Header({ user, mode }: { user: User; mode: Mode }) {
  const db = useDB();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const others = (['member', 'leader', 'admin'] as Mode[]).filter((r) => r !== mode && user.roles.includes(r));
  const unread = unreadCountFor(db, user.uuid);
  const isSupportAdmin = user.roles.includes('admin');

  useEffect(() => setOpen(false), [pathname]);

  const switchTo = (m: Mode) => {
    setMode(m);
    setOpen(false);
    router.push(HOME[m]);
    toast(`${MODE_LABEL[m]}の画面です`);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 px-3" style={{ paddingTop: 'calc(10px + var(--safe-top))' }}>
        <div className="glass mx-auto flex h-[68px] max-w-[560px] items-center gap-2 rounded-full pl-4 pr-2">
          <Link href={HOME[mode]} className="flex shrink-0 items-center" aria-label="ホーム">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="FORDAYS" className="h-7 w-auto" />
          </Link>
          <div className="flex flex-1 items-center justify-center gap-1.5">
            <span className="bg-accent whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-bold text-white shadow-sm">
              {MODE_LABEL[mode]}
            </span>
            {/* 大塚・内藤（admin権限あり）の2名のみヘッダーにサポート切替ボタンを表示 */}
            {isSupportAdmin && mode !== 'admin' && (
              <button
                onClick={() => switchTo('admin')}
                className="glass flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold text-[#231815] active:scale-95"
              >
                <Shield size={14} /> サポート
              </button>
            )}
          </div>
          <button
            onClick={() => setOpen(true)}
            aria-label="メニュー"
            className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/70 active:scale-90"
          >
            <Menu size={30} />
            {unread > 0 && (
              <span className="bg-fd-red absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[0.7rem] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
        </div>
      </header>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        variant="side"
        title={
          <span className="flex flex-col">
            <span>{user.name} さん</span>
            <span className="text-base font-normal text-black/50">{user.memberNo || user.email}</span>
          </span>
        }
      >
        <nav className="flex flex-col gap-2">
          {MENU[mode].map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            const showBadge = href === '/messages/' && unread > 0;
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-[64px] items-center gap-4 rounded-2xl px-4 text-[1.15rem] font-bold transition active:scale-[0.98] ${
                  active ? 'bg-accent-soft accent' : 'hover:bg-black/5'
                }`}
              >
                <Icon size={28} />
                <span className="flex-1">{label}</span>
                {showBadge && (
                  <span className="bg-fd-red grid h-7 min-w-7 place-items-center rounded-full px-2 text-sm font-bold text-white">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {others.length > 0 && (
          <div className="mt-5 flex flex-col gap-3 border-t border-black/10 pt-5">
            {others.map((m) => (
              <button
                key={m}
                onClick={() => switchTo(m)}
                className="btn text-white"
                style={{ background: MODE_COLOR[m], boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4)' }}
              >
                <ArrowLeftRight size={26} />
                {MODE_LABEL[m]}の画面へ
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => {
            signOut();
            router.replace('/');
          }}
          className="mt-5 flex min-h-[60px] w-full items-center justify-center gap-3 rounded-2xl text-lg font-bold text-black/50"
        >
          <LogOut size={24} /> ログアウト
        </button>
      </Sheet>
    </>
  );
}
