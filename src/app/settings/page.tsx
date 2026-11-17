'use client';
import { Bell, Calendar, RotateCcw, Type } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { PageTitle, Segmented, useToast } from '@/components/ui';
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
  const [perm, setPerm] = useState<string>('default');
  const [cal, setCal] = useState(user.calendarId ?? '');

  useEffect(() => setPerm(notifyPermission()), []);
  useEffect(() => setCal(user.calendarId ?? ''), [user.calendarId]);

  return (
    <>
      <PageTitle>設定</PageTitle>

      <div className="flex flex-col gap-4">
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
            <label className="flex items-center gap-2 font-bold" htmlFor="cal">
              <Calendar size={22} className="accent" /> Google カレンダー ID
            </label>
            <input
              id="cal"
              className="field !text-base"
              placeholder="xxx@group.calendar.google.com"
              value={cal}
              onChange={(e) => setCal(e.target.value)}
            />
            <button
              className="btn-primary"
              onClick={async () => {
                await updateUser(user.uuid, { calendarId: cal.trim() || null });
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
