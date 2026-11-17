'use client';
import { Bell, Camera, Fingerprint, KeyRound, Phone, RotateCcw, Type } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Avatar, PageTitle, Segmented, readImageAsDataUrl, useToast } from '@/components/ui';
import { DEMO } from '@/config/app';
import { enableNotifications, notifyPermission, showLocalNotification } from '@/lib/pwa';
import { FONT_LABEL, type FontScale, setFontScale, useFontScale } from '@/lib/prefs';
import { changeUserPassword, resetDemoData, updateUser } from '@/lib/store';
import type { User } from '@/lib/types';

export default function Page() {
  return <AppShell>{({ user }) => <Settings user={user} />}</AppShell>;
}

function Settings({ user }: { user: User }) {
  const scale = useFontScale();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [perm, setPerm] = useState<string>('default');
  const [phone, setPhone] = useState(user.phone ?? '');
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [passkeyDone, setPasskeyDone] = useState(false);

  useEffect(() => {
    setPerm(notifyPermission());
    setPasskeyDone(Boolean(localStorage.getItem(`fd-passkey-${user.uuid}`)));
  }, [user.uuid]);
  useEffect(() => setPhone(user.phone ?? ''), [user.phone]);

  const registerPasskey = async () => {
    if (!window.PublicKeyCredential) {
      toast('この端末はPasskeyに対応していません');
      return;
    }
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const userId = new TextEncoder().encode(user.uuid);
      await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'FORDAYS パートナー手帳' },
          user: { id: userId, name: user.email || user.memberNo || user.uuid, displayName: user.name },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' },
          ],
          authenticatorSelection: { userVerification: 'preferred' },
          timeout: 60000,
        },
      });
      localStorage.setItem(`fd-passkey-${user.uuid}`, '1');
      setPasskeyDone(true);
      toast('この端末にPasskeyを登録しました');
    } catch {
      toast('Passkeyの登録がキャンセルされました');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 6) return toast('新しいパスワードは6文字以上にしてください');
    if (newPw !== newPw2) return toast('確認用パスワードが一致しません');
    try {
      await changeUserPassword(user.uuid, curPw, newPw);
      setCurPw('');
      setNewPw('');
      setNewPw2('');
      toast('パスワードを変更しました');
    } catch (err) {
      toast((err as Error).message);
    }
  };

  return (
    <>
      <PageTitle>設定</PageTitle>

      <div className="flex flex-col gap-4">
        <section className="card flex items-center gap-4">
          <Avatar name={user.name} src={user.avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="text-[1.25rem] font-bold">{user.name}</div>
            <div className="text-sm text-black/50">{user.memberNo || user.email || ''}</div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const dataUrl = await readImageAsDataUrl(file);
                await updateUser(user.uuid, { avatarUrl: dataUrl });
                toast('顔写真を更新しました');
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="chip bg-accent-soft accent mt-2 !min-h-[40px] !px-4 !text-sm"
            >
              <Camera size={18} /> 顔写真を変更
            </button>
          </div>
        </section>

        <section className="card flex flex-col gap-3">
          <div className="flex items-center gap-2 font-bold">
            <Type size={22} className="accent" /> 文字の大きさ
          </div>
          <Segmented
            value={scale}
            onChange={(v: FontScale) => setFontScale(v)}
            options={(['normal', 'large', 'xlarge'] as FontScale[]).map((v) => ({ value: v, label: FONT_LABEL[v] }))}
          />
        </section>

        <section className="card flex flex-col gap-3">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-2">
              <Bell size={22} className="accent" /> 通知
            </span>
            <span className="text-base text-black/55">{perm === 'granted' ? 'オン' : 'オフ'}</span>
          </div>
          {perm === 'granted' ? (
            <button
              className="btn-glass"
              onClick={() => showLocalNotification('通知のテスト', '毎月17日の締め切り前にお知らせします')}
            >
              テスト通知を送る
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={async () => {
                const ok = await enableNotifications();
                setPerm(notifyPermission());
                toast(ok ? '通知をオンにしました' : '通知が許可されませんでした');
              }}
            >
              通知をオンにする
            </button>
          )}
        </section>

        {/* Passkey（生体認証）登録 */}
        <section className="card flex flex-col gap-3">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-2">
              <Fingerprint size={22} className="accent" /> Passkey（顔・指紋認証）
            </span>
            <span className="text-base text-black/55">{passkeyDone ? '登録済み' : '未登録'}</span>
          </div>
          <button type="button" className="btn-glass" onClick={registerPasskey}>
            <Fingerprint size={22} className="accent" /> {passkeyDone ? 'この端末に再登録する' : 'この端末にPasskeyを登録する'}
          </button>
        </section>

        {/* パスワード変更（サポートセンター・リーダー・メンバー共通） */}
        <form className="card flex flex-col gap-3" onSubmit={handlePasswordChange}>
          <div className="flex items-center gap-2 font-bold">
            <KeyRound size={22} className="accent" /> パスワードの変更
          </div>
          {user.password && (
            <input
              type="password"
              className="field !text-base"
              placeholder="現在のパスワード"
              value={curPw}
              onChange={(e) => setCurPw(e.target.value)}
            />
          )}
          <input
            type="password"
            className="field !text-base"
            placeholder="新しいパスワード（6文字以上）"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
          />
          <input
            type="password"
            className="field !text-base"
            placeholder="新しいパスワード（確認用）"
            value={newPw2}
            onChange={(e) => setNewPw2(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={newPw.length < 6 || newPw !== newPw2}>
            パスワードを変更する
          </button>
        </form>

        {user.roles.includes('leader') && (
          <section className="card flex flex-col gap-3">
            <label className="flex items-center gap-2 font-bold" htmlFor="phone">
              <Phone size={22} className="accent" /> 連絡先電話番号（メンバー画面に表示）
            </label>
            <input
              id="phone"
              inputMode="tel"
              className="field !text-base"
              placeholder="090-0000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button
              className="btn-primary"
              onClick={async () => {
                await updateUser(user.uuid, { phone: phone.trim() });
                toast('保存しました');
              }}
            >
              保存
            </button>
          </section>
        )}

        {DEMO && (
          <button
            className="btn-glass mt-4 text-black/50"
            onClick={() => {
              resetDemoData();
              toast('初期データに戻しました');
            }}
          >
            <RotateCcw size={22} /> デモデータを初期化
          </button>
        )}
      </div>
    </>
  );
}
