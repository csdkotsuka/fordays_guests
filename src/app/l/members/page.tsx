'use client';
import { Camera, MessageCircle, Package, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Avatar, Empty, PageTitle, readImageAsDataUrl, useToast } from '@/components/ui';
import { Sheet } from '@/components/ui/Sheet';
import { PRODUCTS } from '@/data/products';
import { REFERRAL_LABEL } from '@/lib/labels';
import { addMember, findUser, membersOf, referralsOf, updateUser, useDB } from '@/lib/store';
import type { SubscriptionItem, User } from '@/lib/types';

export default function Page() {
  return <AppShell mode="leader">{({ user }) => <Members user={user} />}</AppShell>;
}

const fmtMonth = (ym: string) => {
  const [y, m] = ym.split('-');
  return y && m ? `${y}年${Number(m)}月` : ym;
};

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

      <button className="btn-primary mb-4 !min-h-[72px]" onClick={() => setAddOpen(true)}>
        <UserPlus size={28} /> メンバーを追加
      </button>

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
        {sel && <MemberDetail member={sel} />}
      </Sheet>
    </>
  );
}

function MemberDetail({ member }: { member: User }) {
  const db = useDB();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const refs = referralsOf(db, member.uuid);
  const subs = member.subscriptions ?? [];
  const activeSubs = subs.filter((s) => !s.endMonth);
  const pastSubs = subs.filter((s) => !!s.endMonth);

  return (
    <div className="flex flex-col gap-4">
      {/* 顔写真＋基本情報＋メッセージボタン */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar name={member.name} src={member.avatarUrl} size="lg" />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const dataUrl = await readImageAsDataUrl(file);
              await updateUser(member.uuid, { avatarUrl: dataUrl });
              toast('顔写真を更新しました');
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="顔写真を変更"
            className="bg-accent absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full border-2 border-white text-white shadow"
          >
            <Camera size={16} />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[1.3rem] font-bold">{member.name}</div>
          <div className="text-sm text-black/55">会員番号: {member.memberNo || '未登録'}</div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-1 text-sm font-bold text-[var(--accent)] underline underline-offset-4"
          >
            顔写真を変更する
          </button>
        </div>
      </div>

      <Link href={`/messages/?with=${member.uuid}`} className="btn-primary !min-h-[60px]">
        <MessageCircle size={24} /> メッセージを送る
      </Link>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="glass rounded-3xl py-3">
          <div className="text-sm font-bold text-black/50">紹介</div>
          <div className="accent text-[1.8rem] font-bold">{refs.length}人</div>
        </div>
        <div className="glass rounded-3xl py-3">
          <div className="text-sm font-bold text-black/50">ポイント</div>
          <div className="text-[1.8rem] font-bold">{member.points}pt</div>
        </div>
      </div>

      {/* 定期契約中の商品 */}
      <div>
        <h3 className="h2 mb-2 flex items-center gap-2">
          <Package size={22} className="accent" /> 定期契約中の商品（{activeSubs.length}品）
        </h3>
        {activeSubs.length === 0 ? (
          <p className="glass rounded-2xl py-4 text-center text-base text-black/45">現在契約中の商品はありません</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {activeSubs.map((s) => (
              <SubRow key={s.id} sub={s} active />
            ))}
          </ul>
        )}
      </div>

      {/* 過去の定期購買履歴 */}
      {pastSubs.length > 0 && (
        <div>
          <h3 className="h2 mb-2 text-black/70">過去の定期購買履歴</h3>
          <ul className="flex flex-col gap-2.5">
            {pastSubs.map((s) => (
              <SubRow key={s.id} sub={s} active={false} />
            ))}
          </ul>
        </div>
      )}

      {/* 紹介した人 */}
      <div>
        <h3 className="h2 mb-2">紹介した人</h3>
        {refs.length === 0 ? (
          <p className="glass rounded-2xl py-4 text-center text-base text-black/45">まだいません</p>
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
    </div>
  );
}

function SubRow({ sub, active }: { sub: SubscriptionItem; active: boolean }) {
  const prod = PRODUCTS.find((p) => p.id === sub.productId);
  return (
    <li className={`glass flex items-center gap-3 rounded-2xl p-3 ${active ? '' : 'opacity-75'}`}>
      {prod?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={prod.image} alt="" className="h-14 w-14 shrink-0 rounded-xl bg-white object-contain p-1" />
      ) : (
        <div className="bg-accent-soft accent grid h-14 w-14 shrink-0 place-items-center rounded-xl">
          <Package size={24} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-base font-bold leading-snug">{sub.productName}</div>
        <div className="mt-0.5 text-sm font-bold text-black/60">
          {active
            ? `購買開始：${fmtMonth(sub.startMonth)} 〜 継続中`
            : `購買期間：${fmtMonth(sub.startMonth)} 〜 ${sub.endMonth ? fmtMonth(sub.endMonth) : ''}`}
        </div>
      </div>
      <span
        className={`chip !min-h-[34px] shrink-0 !px-3 !text-xs ${
          active ? 'bg-accent-soft accent' : 'bg-black/10 text-black/55'
        }`}
      >
        {active ? '契約中' : '終了'}
      </span>
    </li>
  );
}
