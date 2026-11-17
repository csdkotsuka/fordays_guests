'use client';
import { Bell, Camera, Phone, RotateCcw, Type } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Avatar, PageTitle, Segmented, readImageAsDataUrl, useToast } from '@/components/ui';
import { DEMO } from '@/config/app';
import { enableNotifications, notifyPermission, showLocalNotification } from '@/lib/pwa';
import { FONT_LABEL, type FontScale, setFontScale, useFontScale } from '@/lib/prefs';
import { resetDemoData, updateUser } from '@/lib/store';
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

  useEffect(() => setPerm(notifyPermission()), []);
  useEffect(() => setPhone(user.phone ?? ''), [user.phone]);

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
