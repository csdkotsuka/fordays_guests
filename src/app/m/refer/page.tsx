'use client';
import { Phone, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Avatar, Empty, PageTitle, useToast } from '@/components/ui';
import { Sheet } from '@/components/ui/Sheet';
import { fmtDate } from '@/lib/date';
import { addReferral, referralsOf, useDB } from '@/lib/store';
import { REFERRAL_LABEL } from '@/lib/labels';
import type { User } from '@/lib/types';

export default function Page() {
  return <AppShell mode="member">{({ user }) => <Refer user={user} />}</AppShell>;
}

function Refer({ user }: { user: User }) {
  const db = useDB();
  const toast = useToast();
  const list = referralsOf(db, user.uuid).slice().reverse();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', memo: '' });

  const close = () => {
    setOpen(false);
    setForm({ name: '', phone: '', memo: '' });
  };

  return (
    <>
      <PageTitle>お友だち紹介</PageTitle>

      <button className="btn-primary mb-5 !min-h-[76px] !text-[1.3rem]" onClick={() => setOpen(true)}>
        <UserPlus size={30} /> 紹介する
      </button>

      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="h2">紹介した人</h2>
        <span className="accent text-xl font-bold">{list.length}人</span>
      </div>

      {list.length === 0 ? (
        <Empty icon={Users} label="まだいません" />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((r) => (
            <li key={r.uuid} className="card flex items-center gap-4 !py-4">
              <Avatar name={r.name} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[1.15rem] font-bold">{r.name}</div>
                <div className="text-base text-black/50">{fmtDate(r.createdAt)}</div>
              </div>
              <span className={`chip !min-h-[40px] ${r.status === 'introduced' ? 'bg-black/5 text-black/60' : 'bg-accent-soft accent'}`}>
                {REFERRAL_LABEL[r.status]}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={open} onClose={close} title="紹介する">
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.name.trim()) return;
            await addReferral({ referrerUuid: user.uuid, ...form });
            toast('登録しました');
            close();
          }}
        >
          <div>
            <label className="label">お名前</label>
            <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          </div>
          <div>
            <label className="label">
              <Phone size={16} className="mr-1 inline" />
              電話番号
            </label>
            <input
              className="field"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label">メモ</label>
            <input className="field" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary" disabled={!form.name.trim()}>
            登録
          </button>
        </form>
      </Sheet>
    </>
  );
}
