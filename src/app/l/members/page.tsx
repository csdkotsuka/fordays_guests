'use client';
import { Camera, Link2, MessageCircle, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { UserDetailContent } from '@/components/UserDetailContent';
import { Avatar, Empty, PageTitle, readImageAsDataUrl, useToast } from '@/components/ui';
import { Sheet } from '@/components/ui/Sheet';
import { copyText, getAppOrigin } from '@/lib/lineText';
import { addMember, findUser, membersOf, referralsOf, useDB } from '@/lib/store';
import type { User } from '@/lib/types';

export default function Page() {
  return <AppShell mode="leader">{({ user }) => <Members user={user} />}</AppShell>;
}

function Members({ user }: { user: User }) {
  const db = useDB();
  const toast = useToast();
  const list = membersOf(db, user.uuid);
  const [addOpen, setAddOpen] = useState(false);
  const [selUuid, setSelUuid] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', memberNo: '', avatarUrl: '' });
  const addPhotoRef = useRef<HTMLInputElement>(null);

  const sel = findUser(db, selUuid);

  const closeAdd = () => {
    setAddOpen(false);
    setForm({ name: '', memberNo: '', avatarUrl: '' });
  };

  const validNo = form.memberNo === '' || /^\d{7}$/.test(form.memberNo);

  return (
    <>
      <PageTitle>メンバー（{list.length}人）</PageTitle>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <button className="btn-primary !min-h-[68px] !px-4 !text-base" onClick={() => setAddOpen(true)}>
          <UserPlus size={24} /> メンバー追加
        </button>
        <button
          className="btn-glass !min-h-[68px] !px-4 !text-base"
          onClick={async () => {
            const url = `${getAppOrigin()}/signup/?ref=${user.uuid}`;
            if (await copyText(url)) toast('招待リンクをコピーしました');
          }}
        >
          <Link2 size={22} className="accent" /> 招待リンク
        </button>
      </div>

      {list.length === 0 ? (
        <Empty icon={Users} label="メンバーがいません" />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((m) => {
            const refs = referralsOf(db, m.uuid);
            const activeSubs = (m.subscriptions ?? []).filter((s) => !s.endMonth);
            return (
              <div key={m.uuid} className="card flex items-center gap-3 !py-3.5">
                <button
                  onClick={() => setSelUuid(m.uuid)}
                  className="flex min-w-0 flex-1 items-center gap-3.5 text-left active:scale-[0.99]"
                >
                  <Avatar name={m.name} src={m.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[1.15rem] font-bold">{m.name}</div>
                    <div className="truncate text-sm text-black/55">
                      {activeSubs.length > 0 ? `定期契約 ${activeSubs.length}品` : m.memberNo || 'イベント案内のみ'}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-sm font-bold">
                    <div className="accent">紹介 {refs.length}人</div>
                    <div className="text-black/50">{m.points}pt</div>
                  </div>
                </button>
                <Link
                  href={`/messages/?with=${m.uuid}`}
                  aria-label={`${m.name}さんにメッセージ`}
                  className="glass grid h-12 w-12 shrink-0 place-items-center rounded-full text-[var(--accent)] active:scale-90"
                >
                  <MessageCircle size={24} />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={addOpen} onClose={closeAdd} title="メンバーを追加">
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await addMember({
                leaderUuid: user.uuid,
                name: form.name,
                memberNo: form.memberNo,
                avatarUrl: form.avatarUrl || undefined,
              });
              toast('追加しました');
              closeAdd();
            } catch (err) {
              toast((err as Error).message);
            }
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <Avatar name={form.name || '新'} src={form.avatarUrl || undefined} size="lg" />
            <input
              ref={addPhotoRef}
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
              onClick={() => addPhotoRef.current?.click()}
              className="chip glass !min-h-[42px] !text-sm"
            >
              <Camera size={18} /> 顔写真を選ぶ
            </button>
          </div>
          <div>
            <label className="label">お名前</label>
            <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          </div>
          <div>
            <label className="label">会員番号（7桁・空欄でもOK）</label>
            <input
              className="field text-center !text-[1.6rem] font-bold tracking-[0.25em]"
              inputMode="numeric"
              maxLength={7}
              placeholder="なしでも登録できます"
              value={form.memberNo}
              onChange={(e) => setForm({ ...form, memberNo: e.target.value.replace(/\D/g, '').slice(0, 7) })}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={!form.name.trim() || !validNo}>
            追加
          </button>
        </form>
      </Sheet>

      <Sheet open={!!sel} onClose={() => setSelUuid(null)} title={sel?.name}>
        {sel && <UserDetailContent target={sel} />}
      </Sheet>
    </>
  );
}
