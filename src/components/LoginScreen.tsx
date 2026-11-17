'use client';
import { ChevronLeft, Fingerprint, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DEMO } from '@/config/app';
import { HOME, MODE_LABEL, signIn } from '@/lib/session';
import { findUserByNo, useDB } from '@/lib/store';
import type { Role } from '@/lib/types';
import { useToast } from './ui';

/**
 * ログイン画面（会員番号7桁 ＋ Passkey ／ パスワード）
 * TODO: 現在はダミー。Passkey(WebAuthn) は Cloudflare Workers で検証 → Firebase カスタムトークン発行の予定（docs/FIREBASE.md）
 */
export function LoginScreen({ role }: { role: Role }) {
  const db = useDB();
  const router = useRouter();
  const toast = useToast();
  const [no, setNo] = useState('');
  const [usePw, setUsePw] = useState(false);
  const [pw, setPw] = useState('');

  useEffect(() => {
    document.documentElement.dataset.mode = role;
  }, [role]);

  const valid = /^\d{7}$/.test(no);

  const login = (memberNo: string) => {
    const u = findUserByNo(db, memberNo);
    if (!u) return toast('会員番号が見つかりません');
    if (!u.roles.includes(role)) return toast(`${MODE_LABEL[role]}の登録がありません`);
    signIn(u.uuid, role);
    router.replace(HOME[role]);
  };

  const demoUsers = db.users.filter((u) => u.roles.includes(role)).slice(0, 3);

  return (
    <>
      <div className="app-bg" />
      <main
        className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col px-5"
        style={{ paddingTop: 'calc(16px + var(--safe-top))', paddingBottom: 'calc(24px + var(--safe-bottom))' }}
      >
        <Link href="/" aria-label="戻る" className="glass grid h-14 w-14 place-items-center rounded-full active:scale-90">
          <ChevronLeft size={30} />
        </Link>

        <div className="mb-8 mt-6 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark.svg" alt="" className="h-20 w-20" />
          <span className="bg-accent rounded-full px-5 py-1.5 text-lg font-bold text-white">{MODE_LABEL[role]}</span>
          <h1 className="h1">ログイン</h1>
        </div>

        <form
          className="card flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) login(no);
          }}
        >
          <div>
            <label className="label" htmlFor="no">
              会員番号
            </label>
            <input
              id="no"
              className="field text-center !text-[1.8rem] font-bold tracking-[0.3em]"
              inputMode="numeric"
              autoComplete="username webauthn"
              placeholder="0000000"
              maxLength={7}
              value={no}
              onChange={(e) => setNo(e.target.value.replace(/\D/g, '').slice(0, 7))}
            />
          </div>

          {!usePw ? (
            <>
              <button type="submit" className="btn-primary" disabled={!valid}>
                <Fingerprint size={28} /> Passkeyでログイン
              </button>
              <button type="button" className="btn-glass" onClick={() => setUsePw(true)}>
                <KeyRound size={24} /> パスワードでログイン
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="label" htmlFor="pw">
                  パスワード
                </label>
                <input
                  id="pw"
                  type="password"
                  className="field"
                  autoComplete="current-password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={!valid || !pw}>
                ログイン
              </button>
              <button type="button" className="btn-glass" onClick={() => setUsePw(false)}>
                <Fingerprint size={24} /> Passkeyに戻る
              </button>
            </>
          )}
        </form>

        {DEMO && demoUsers.length > 0 && (
          <div className="mt-8">
            <div className="mb-2 text-center text-sm font-bold text-black/40">デモ</div>
            <div className="flex flex-wrap justify-center gap-2">
              {demoUsers.map((u) => (
                <button key={u.uuid} onClick={() => login(u.memberNo)} className="chip glass">
                  {u.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
