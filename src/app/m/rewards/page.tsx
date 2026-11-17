'use client';
import { ExternalLink, Gift, Star, Trophy, UserPlus } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { PageTitle } from '@/components/ui';
import { LINKS } from '@/config/links';
import { REWARD_TIERS, currentTier } from '@/config/rewards';
import { referralsOf, useDB } from '@/lib/store';
import type { User } from '@/lib/types';

export default function Page() {
  return <AppShell mode="member">{({ user }) => <Rewards user={user} />}</AppShell>;
}

function Rewards({ user }: { user: User }) {
  const db = useDB();
  const refs = referralsOf(db, user.uuid).length;
  const pts = user.points;
  const { cur, next } = currentTier(refs, pts);

  return (
    <>
      <PageTitle>わたしの成績</PageTitle>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Stat icon={<UserPlus size={24} />} label="紹介" value={refs} unit="人" />
        <Stat icon={<Star size={24} />} label="ポイント" value={pts} unit="pt" />
      </div>

      {cur && (
        <div className="card mb-4 flex items-center gap-4">
          <span className="bg-accent grid h-16 w-16 place-items-center rounded-full text-white shadow-md">
            <Trophy size={32} />
          </span>
          <div>
            <div className="text-base font-bold text-black/50">いまのランク</div>
            <div className="text-[1.5rem] font-bold">{cur.name}</div>
          </div>
        </div>
      )}

      {next && (
        <section className="card mb-5 flex flex-col gap-4" style={{ background: 'linear-gradient(160deg, rgba(255,255,255,.8), var(--accent-soft))' }}>
          <div className="flex items-center gap-2 text-lg font-bold">
            <Gift className="accent" size={26} /> 次は「{next.name}」
          </div>
          <div className="text-[1.35rem] font-bold">{next.reward}</div>
          <Progress label="紹介" value={refs} goal={next.referrals} unit="人" />
          <Progress label="ポイント" value={pts} goal={next.points} unit="pt" />
        </section>
      )}

      <h2 className="h2 mb-3 px-1">ランク</h2>
      <ol className="flex flex-col gap-3">
        {REWARD_TIERS.map((t) => {
          const reached = refs >= t.referrals && pts >= t.points;
          return (
            <li key={t.name} className={`card flex items-center gap-4 !py-4 ${reached ? '' : 'opacity-60'}`}>
              <span className={`grid h-12 w-12 place-items-center rounded-full ${reached ? 'bg-accent text-white' : 'bg-black/5 text-black/40'}`}>
                <Trophy size={24} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[1.15rem] font-bold">{t.name}</div>
                <div className="text-base text-black/55">
                  {t.referrals}人・{t.points}pt
                </div>
              </div>
              <div className="text-right text-base font-bold">{t.reward}</div>
            </li>
          );
        })}
      </ol>

      {LINKS.rewards && (
        <a href={LINKS.rewards} target="_blank" rel="noopener noreferrer" className="btn-glass mt-5">
          <ExternalLink size={22} /> くわしく
        </a>
      )}
    </>
  );
}

function Stat({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: number; unit: string }) {
  return (
    <div className="card flex flex-col gap-1">
      <span className="accent flex items-center gap-2 text-base font-bold">
        {icon}
        {label}
      </span>
      <span className="text-[2.4rem] font-bold leading-none">
        {value}
        <span className="ml-1 text-lg">{unit}</span>
      </span>
    </div>
  );
}

function Progress({ label, value, goal, unit }: { label: string; value: number; goal: number; unit: string }) {
  const pct = Math.min(100, Math.round((value / goal) * 100));
  const rest = Math.max(0, goal - value);
  return (
    <div>
      <div className="mb-1 flex justify-between text-base font-bold">
        <span>{label}</span>
        <span className="accent">{rest > 0 ? `あと ${rest}${unit}` : '達成'}</span>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-white/80">
        <div className="bg-accent h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
