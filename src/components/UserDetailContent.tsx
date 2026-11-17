'use client';
import { CalendarDays, Camera, MessageCircle, Package } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import { Avatar, readImageAsDataUrl, useToast } from '@/components/ui';
import { PRODUCTS } from '@/data/products';
import { fmtDate, fmtTime } from '@/lib/date';
import { REFERRAL_LABEL, RSVP_LABEL } from '@/lib/labels';
import {
  eventsOf,
  invitationsOfMember,
  referralsOf,
  updateUser,
  useDB,
} from '@/lib/store';
import type { EventItem, SubscriptionItem, User } from '@/lib/types';

const fmtMonth = (ym: string) => {
  const [y, m] = ym.split('-');
  return y && m ? `${y}年${Number(m)}月` : ym;
};

/** リーダー・事務局共通のユーザー詳細（顔写真・購買履歴・イベント参加履歴・紹介一覧） */
export function UserDetailContent({
  target,
  showMessageButton = true,
  allowPhotoEdit = true,
}: {
  target: User;
  showMessageButton?: boolean;
  allowPhotoEdit?: boolean;
}) {
  const db = useDB();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const refs = referralsOf(db, target.uuid);
  const subs = target.subscriptions ?? [];
  const activeSubs = subs.filter((s) => !s.endMonth);
  const pastSubs = subs.filter((s) => !!s.endMonth);

  // 参加・招待されたイベント履歴（リーダー自身が主催したイベントも含める）
  const invitedItems = invitationsOfMember(db, target.uuid)
    .map((inv) => ({
      ev: db.events.find((e) => e.uuid === inv.eventUuid),
      status: inv.status,
    }))
    .filter((x): x is { ev: EventItem; status: 'yes' | 'no' | 'pending' } => !!x.ev);

  const hostedItems = target.roles.includes('leader')
    ? eventsOf(db, target.uuid).map((ev) => ({ ev, status: 'host' as const }))
    : [];

  const eventHistory = [...invitedItems, ...hostedItems].sort((a, b) =>
    b.ev.startAt.localeCompare(a.ev.startAt),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar name={target.name} src={target.avatarUrl} size="lg" />
          {allowPhotoEdit && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const dataUrl = await readImageAsDataUrl(file);
                  await updateUser(target.uuid, { avatarUrl: dataUrl });
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
            </>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[1.3rem] font-bold">{target.name}</div>
          <div className="text-sm text-black/55">会員番号: {target.memberNo || '未登録'}</div>
          {target.phone && <div className="text-sm text-black/55">TEL: {target.phone}</div>}
          {allowPhotoEdit && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-1 text-sm font-bold text-[var(--accent)] underline underline-offset-4"
            >
              顔写真を変更する
            </button>
          )}
        </div>
      </div>

      {showMessageButton && (
        <Link href={`/messages/?with=${target.uuid}`} className="btn-primary !min-h-[60px]">
          <MessageCircle size={24} /> メッセージを送る
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="glass rounded-3xl py-3">
          <div className="text-sm font-bold text-black/50">紹介</div>
          <div className="accent text-[1.8rem] font-bold">{refs.length}人</div>
        </div>
        <div className="glass rounded-3xl py-3">
          <div className="text-sm font-bold text-black/50">ポイント</div>
          <div className="text-[1.8rem] font-bold">{target.points}pt</div>
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

      {/* イベント参加履歴 */}
      <div>
        <h3 className="h2 mb-2 flex items-center gap-2">
          <CalendarDays size={22} className="accent" /> イベント参加履歴（{eventHistory.length}件）
        </h3>
        {eventHistory.length === 0 ? (
          <p className="glass rounded-2xl py-4 text-center text-base text-black/45">参加履歴はありません</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {eventHistory.map(({ ev, status }) => (
              <li key={`${ev.uuid}-${status}`} className="glass flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-bold">{ev.title}</div>
                  <div className="text-sm text-black/55">
                    {fmtDate(ev.startAt)} {fmtTime(ev.startAt)}
                  </div>
                </div>
                <span
                  className={`chip !min-h-[34px] shrink-0 !px-3 !text-xs ${
                    status === 'host'
                      ? 'bg-accent text-white'
                      : status === 'yes'
                        ? 'bg-accent-soft accent'
                        : status === 'pending'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-black/10 text-black/50'
                  }`}
                >
                  {status === 'host' ? '主催' : RSVP_LABEL[status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

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
