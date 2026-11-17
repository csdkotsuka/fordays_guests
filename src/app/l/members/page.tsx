'use client';
import { UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Avatar, Empty, PageTitle, Row, useToast } from '@/components/ui';
import { Sheet } from '@/components/ui/Sheet';
import { REFERRAL_LABEL } from '@/lib/labels';
import { addMember, membersOf, referralsOf, useDB } from '@/lib/store';
import type { User } from '@/lib/types';

export default function Page() {
  return <AppShell mode="leader">{({ user }) => <Members user={user} />}</AppShell>;
}

function Members({ user }: { user: User }) {
  const db = useDB();
  const toast = useToast();
  const list = membersOf(db, user.uuid);
  const [addOpen, setAddOpen] = useState(false);
  const [sel, setSel] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', memberNo: '' });

  const closeAdd = () => {
    setAddOpen(false);
    setForm({ name: '', memberNo: '' });
  };

  const validNo = form.memberNo === '' || /^\d{7}$/.test(form.memberNo);

  return (
    <>
      <PageTitle>メンバー</PageTitle>

      <button className="btn-primary mb-4 !min-h-[72px]" onClick={() => setAddOpen(true)}>
        <UserPlus size={28} /> メンバーを追加
      </button>

      {list.length === 0 ? (
        <Empty icon={Users} label="メンバーがいません" />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((m) => {
            const refs = referralsOf(db, m.uuid);
            return (
              <Row
                key={m.uuid}
                onClick={() => setSel(m)}
                left={<Avatar name={m.name} />}
                title={m.name}
                sub={m.memberNo || 'イベント案内のみ'}
                right={
                  <div className="text-right text-base font-bold">
                    <div className="accent">紹介 {refs.length}人</div>
                    <div className="text-sm text-black/50">{m.points}pt</div>
                  </div>
                }
              />
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
              await addMember({ leaderUuid: user.uuid, name: form.name, memberNo: form.memberNo });
              toast('追加しました');
              closeAdd();
            } catch (err) {
              toast((err as Error).message);
            }
          }}
        >
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

      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel?.name}>
        {sel && <MemberDetail member={sel} />}
      </Sheet>
    </>
  );
}

function MemberDetail({ member }: { member: User }) {
  const db = useDB();
  const refs = referralsOf(db, member.uuid);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="glass rounded-3xl py-4">
          <div className="text-sm font-bold text-black/50">紹介</div>
          <div className="accent text-[2rem] font-bold">{refs.length}人</div>
        </div>
        <div className="glass rounded-3xl py-4">
          <div className="text-sm font-bold text-black/50">ポイント</div>
          <div className="text-[2rem] font-bold">{member.points}pt</div>
        </div>
      </div>

      <h3 className="h2">紹介した人</h3>
      {refs.length === 0 ? (
        <p className="py-4 text-center text-black/45">まだいません</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {refs.map((r) => (
            <li key={r.uuid} className="glass flex items-center justify-between rounded-2xl px-4 py-3 font-bold">
              <span>{r.name}</span>
              <span className="text-sm text-black/55">{REFERRAL_LABEL[r.status]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
