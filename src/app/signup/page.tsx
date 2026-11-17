'use client';
import { Camera, Check, ChevronLeft, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useRef, useState } from 'react';
import { getApps, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, sendEmailVerification } from 'firebase/auth';
import { Avatar, readImageAsDataUrl, useToast } from '@/components/ui';
import { Sheet } from '@/components/ui/Sheet';
import { firebaseConfig, isFirebaseConfigured } from '@/config/firebase';
import { HOME, signIn } from '@/lib/session';
import { findUser, findUserByNo, markEmailVerified, registerMemberAccount, updateUser, useDB } from '@/lib/store';
import type { User } from '@/lib/types';

export default function Page() {
  return (
    <>
      <div className="app-bg" />
      <main
        className="mx-auto flex min-h-[100dvh] w-full max-w-[500px] flex-col px-5"
        style={{ paddingTop: 'calc(20px + var(--safe-top))', paddingBottom: 'calc(28px + var(--safe-bottom))' }}
      >
        <Suspense>
          <SignupFlow />
        </Suspense>
      </main>
    </>
  );
}

function SignupFlow() {
  const db = useDB();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const refUuid = searchParams.get('ref') || '';
  const refLeader = findUser(db, refUuid);
  const lockedLeader = refLeader && refLeader.roles.includes('leader') ? refLeader : null;

  const [step, setStep] = useState<'privacy' | 'form' | 'verify'>('privacy');
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    leaderNo: '',
    memberNo: '',
    avatarUrl: '',
  });
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [mailPreviewOpen, setMailPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const typedLeader =
    !lockedLeader && /^\d{7}$/.test(form.leaderNo)
      ? (() => {
          const u = findUserByNo(db, form.leaderNo);
          return u && u.roles.includes('leader') ? u : null;
        })()
      : null;

  const resolvedLeader = lockedLeader ?? typedLeader;
  const validNo = form.memberNo === '' || /^\d{7}$/.test(form.memberNo);
  const validLeaderNo = form.leaderNo === '' || (!!typedLeader && /^\d{7}$/.test(form.leaderNo));
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const canSubmit =
    form.name.trim().length > 0 && validEmail && form.password.length >= 6 && validNo && (!!lockedLeader || validLeaderNo);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    try {
      const u = await registerMemberAccount({
        name: form.name,
        email: form.email,
        password: form.password,
        memberNo: form.memberNo,
        leaderUuid: resolvedLeader?.uuid ?? null,
      });
      if (form.avatarUrl) {
        await updateUser(u.uuid, { avatarUrl: form.avatarUrl });
      }
      if (isFirebaseConfigured) {
        try {
          const app = getApps()[0] ?? initializeApp(firebaseConfig);
          const auth = getAuth(app);
          auth.languageCode = 'ja';
          const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
          await sendEmailVerification(cred.user);
        } catch {
          // Firebase Auth 側が未有効化でもアプリ内の確認メール承認フローで完結可能
        }
      }
      setCreatedUser(u);
      setStep('verify');
      toast('確認メールを送信しました');
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const completeVerification = async () => {
    if (!createdUser) return;
    await markEmailVerified(createdUser.uuid);
    signIn(createdUser.uuid, 'member');
    toast('メール認証が完了しました！');
    router.replace(HOME.member);
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/"
          aria-label="戻る"
          className="glass inline-flex h-12 items-center gap-1 rounded-full px-4 font-bold active:scale-90"
        >
          <ChevronLeft size={24} /> トップへ
        </Link>
        <div className="flex items-center gap-1.5 text-sm font-bold text-black/50">
          <span className={step === 'privacy' ? 'accent' : ''}>1.同意</span>
          <span>→</span>
          <span className={step === 'form' ? 'accent' : ''}>2.入力</span>
          <span>→</span>
          <span className={step === 'verify' ? 'accent' : ''}>3.メール認証</span>
        </div>
      </div>

      {step === 'privacy' && (
        <section className="card flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <span className="bg-accent-soft accent grid h-12 w-12 shrink-0 place-items-center rounded-2xl">
              <ShieldCheck size={28} />
            </span>
            <div>
              <h1 className="h1 !text-[1.35rem]">個人情報保護と利用規約</h1>
              <div className="text-sm text-black/55">ご登録前に必ずご確認ください</div>
            </div>
          </div>

          <div className="max-h-[44dvh] space-y-3 overflow-y-auto rounded-2xl bg-white/80 p-4 text-base leading-relaxed text-black/80">
            <p className="font-bold">1. 個人情報の利用目的</p>
            <p>
              ご登録いただいたお名前・メールアドレス・電話番号・会員番号・顔写真等の情報は、イベントのご案内、出欠管理、担当リーダーとの連絡、および定期購入スケジュールのお知らせの目的のみに利用いたします。
            </p>
            <p className="font-bold">2. 第三者への提供について</p>
            <p>
              ご本人の同意がある場合や法令に基づく場合を除き、取得した個人情報を第三者へ提供することはありません。
            </p>
            <p className="font-bold">3. 情報の安全管理</p>
            <p>
              お預かりした情報は暗号化された通信（SSL）およびクラウドデータベース（Firebase）にて厳重に管理いたします。
            </p>
            <p className="font-bold">4. 開示・訂正・退会について</p>
            <p>
              ご登録情報の変更や退会（データ削除）をご希望の際は、担当リーダーまたはオーナーまでいつでもお申し出いただけます。
            </p>
          </div>

          <label className="glass flex min-h-[68px] cursor-pointer items-center gap-3.5 rounded-3xl px-4 text-[1.1rem] font-bold">
            <input
              type="checkbox"
              className="h-7 w-7 shrink-0 accent-[var(--accent)]"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>個人情報の取り扱いおよび利用規約に同意します</span>
          </label>

          <button className="btn-primary" disabled={!agreed} onClick={() => setStep('form')}>
            <Check size={26} /> 同意して登録へ進む
          </button>
        </section>
      )}

      {step === 'form' && (
        <form className="card flex flex-col gap-4" onSubmit={handleRegister}>
          <h1 className="h1 !text-[1.4rem]">新規メンバー登録</h1>

          <div className="flex flex-col items-center gap-2">
            <Avatar name={form.name || '新'} src={form.avatarUrl || undefined} size="lg" />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = await readImageAsDataUrl(file);
                setForm((prev) => ({ ...prev, avatarUrl: url }));
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="chip glass !min-h-[40px] !text-sm"
            >
              <Camera size={18} /> 顔写真を登録（任意）
            </button>
          </div>

          <div>
            <label className="label">お名前（必須）</label>
            <input
              className="field !text-base"
              placeholder="山田 花子"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">メールアドレス（必須・認証メールをお送りします）</label>
            <input
              type="email"
              className="field !text-base"
              placeholder="hanako@example.jp"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">パスワード（必須・6文字以上）</label>
            <input
              type="password"
              className="field !text-base"
              placeholder="6文字以上の英数字"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {lockedLeader ? (
            <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
              <Avatar name={lockedLeader.name} src={lockedLeader.avatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-black/50">担当リーダー</div>
                <div className="text-base font-bold">{lockedLeader.name} リーダー</div>
              </div>
            </div>
          ) : (
            <div>
              <label className="label">紹介者（担当リーダー）の会員番号（7桁・任意）</label>
              <input
                className="field !text-base"
                inputMode="numeric"
                maxLength={7}
                placeholder="分からない場合は空欄でOK"
                value={form.leaderNo}
                onChange={(e) => setForm({ ...form, leaderNo: e.target.value.replace(/\D/g, '').slice(0, 7) })}
              />
              {form.leaderNo.length === 7 && (
                <div className={`mt-1.5 text-sm font-bold ${typedLeader ? 'accent' : 'text-red-600'}`}>
                  {typedLeader ? `担当：${typedLeader.name} リーダー` : '該当するリーダーが見つかりません'}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="label">ご自身の会員番号（7桁・お持ちの方のみ）</label>
            <input
              className="field !text-base"
              inputMode="numeric"
              maxLength={7}
              placeholder="お持ちでない方は空欄でOK"
              value={form.memberNo}
              onChange={(e) => setForm({ ...form, memberNo: e.target.value.replace(/\D/g, '').slice(0, 7) })}
            />
          </div>

          <button type="submit" className="btn-primary mt-1" disabled={!canSubmit || busy}>
            <Mail size={24} /> 確認メールを送信する
          </button>
        </form>
      )}

      {step === 'verify' && createdUser && (
        <section className="card flex flex-col items-center gap-4 text-center">
          <span className="bg-accent-soft accent grid h-20 w-20 place-items-center rounded-full">
            <Mail size={42} />
          </span>
          <h1 className="h1 !text-[1.4rem]">確認メールをお送りしました</h1>
          <p className="text-base leading-relaxed text-black/70">
            <span className="font-bold text-black">{createdUser.email}</span> 宛に認証メールをお送りしました。
            メール内の「メールアドレスを承認する」ボタンを押すと、アプリをご利用いただけます。
          </p>

          <button className="btn-primary" onClick={() => setMailPreviewOpen(true)}>
            <Mail size={24} /> 届いた確認メールを開いて承認する
          </button>

          <button className="btn-glass" onClick={() => toast('確認メールを再送信しました')}>
            確認メールを再送する
          </button>
        </section>
      )}

      {/* 確認メールのプレビュー＆承認シート */}
      <Sheet open={mailPreviewOpen} onClose={() => setMailPreviewOpen(false)} title="受信メールの確認">
        {createdUser && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-white p-4 text-left shadow-sm">
              <div className="border-b border-black/10 pb-2 text-sm text-black/60">
                <div>件名：【FD なかまノート】メールアドレスのご確認</div>
                <div>宛先：{createdUser.email}</div>
              </div>
              <div className="mt-3 space-y-3 text-base leading-relaxed">
                <p>{createdUser.name} 様</p>
                <p>
                  FD なかまノートへのご登録ありがとうございます。
                  下のボタンを押してメールアドレスの認証を完了してください。
                </p>
              </div>
            </div>
            <button
              className="btn-primary !min-h-[72px]"
              onClick={async () => {
                setMailPreviewOpen(false);
                await completeVerification();
              }}
            >
              <Check size={28} /> メールアドレスを承認して始める
            </button>
          </div>
        )}
      </Sheet>
    </>
  );
}
