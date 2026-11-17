'use client';
import { Check, ChevronLeft, Fingerprint, KeyRound, Mail, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DEMO } from '@/config/app';
import { HOME, MODE_LABEL, signIn } from '@/lib/session';
import { findUserByEmail, findUserByNo, markEmailVerified, useDB } from '@/lib/store';
import type { Role, User } from '@/lib/types';
import { Avatar, useToast } from './ui';
import { Sheet } from './ui/Sheet';

/**
 * ログイン画面（会員番号7桁 または メールアドレス ＋ Passkey ／ パスワード）
 */
export function LoginScreen({ role }: { role: Role }) {
  const db = useDB();
  const router = useRouter();
  const toast = useToast();
  const [idOrEmail, setIdOrEmail] = useState('');
  const [usePw, setUsePw] = useState(false);
  const [pw, setPw] = useState('');
  const [unverifiedUser, setUnverifiedUser] = useState<User | null>(null);

  useEffect(() => {
    document.documentElement.dataset.mode = role;
  }, [role]);

  const trimmed = idOrEmail.trim();
  const valid = /^\d{7}$/.test(trimmed) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

  const login = (input: string, checkPassword?: string) => {
    const k = input.trim();
    const u = /^\d{7}$/.test(k) ? findUserByNo(db, k) : findUserByEmail(db, k);
    if (!u) return toast('会員番号またはメールアドレスが見つかりません');
    if (!u.roles.includes(role)) return toast(`${MODE_LABEL[role]}の登録がありません`);
    if (checkPassword !== undefined && u.password && u.password !== checkPassword) {
      return toast('パスワードが正しくありません');
    }
    if (u.emailVerified === false) {
      setUnverifiedUser(u);
      return;
    }
    signIn(u.uuid, role);
    router.replace(HOME[role]);
  };

  const demoUsers =
    role === 'admin'
      ? db.users.filter((u) => u.roles.includes('admin')).slice(0, 2)
      : role === 'leader'
        ? db.users.filter((u) => u.roles.includes('leader') && !u.leaderUuid).slice(0, 4)
        : db.users.filter((u) => u.roles.includes('member') && !!u.leaderUuid).slice(0, 5);

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

        <div className="mb-6 mt-4 flex flex-col items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark.svg" alt="" className="h-18 w-18" />
          <span className="bg-accent rounded-full px-5 py-1.5 text-lg font-bold text-white">{MODE_LABEL[role]}</span>
          <h1 className="h1">ログイン</h1>
        </div>

        <form
          className="card flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) login(idOrEmail, usePw ? pw : undefined);
          }}
        >
          <div>
            <label className="label" htmlFor="no">
              会員番号（7桁）またはメールアドレス
            </label>
            <input
              id="no"
              className="field text-center !text-[1.35rem] font-bold"
              autoComplete="username webauthn"
              placeholder="1000001 / mail@example.jp"
              value={idOrEmail}
              onChange={(e) => setIdOrEmail(e.target.value)}
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

        {role === 'member' && (
          <Link href="/signup/" className="btn-soft mt-4 !min-h-[60px]">
            <UserPlus size={24} /> はじめての方（新規メンバー登録）
          </Link>
        )}

        {DEMO && demoUsers.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 text-center text-sm font-bold text-black/40">デモ（ワンタップ切替）</div>
            <div className="flex flex-wrap justify-center gap-2">
              {demoUsers.map((u) => (
                <button key={u.uuid} onClick={() => login(u.memberNo || u.email || '')} className="chip glass !pl-2">
                  <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                  {u.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <Sheet open={!!unverifiedUser} onClose={() => setUnverifiedUser(null)} title="メール認証が未完了です">
          {unverifiedUser && (
            <div className="flex flex-col gap-4 text-center">
              <p className="text-base leading-relaxed">
                <span className="font-bold">{unverifiedUser.email}</span> 宛にお送りした確認メールの承認が完了していません。
              </p>
              <button
                className="btn-primary"
                onClick={async () => {
                  await markEmailVerified(unverifiedUser.uuid);
                  signIn(unverifiedUser.uuid, role);
                  toast('メール認証を完了しました');
                  setUnverifiedUser(null);
                  router.replace(HOME[role]);
                }}
              >
                <Check size={26} /> 確認メールを承認してログイン
              </button>
              <button className="btn-glass" onClick={() => toast('確認メールを再送信しました')}>
                <Mail size={22} /> 確認メールを再送する
              </button>
            </div>
          )}
        </Sheet>
      </main>
    </>
  );
}
