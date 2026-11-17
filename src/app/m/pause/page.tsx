'use client';
import { ExternalLink, PauseCircle, Phone } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { DeadlineCard } from '@/components/DeadlineCard';
import { PageTitle } from '@/components/ui';
import { LINKS } from '@/config/links';

export default function Page() {
  return (
    <AppShell mode="member">
      {() => (
        <>
          <PageTitle>一時休止</PageTitle>
          <div className="mb-6 flex justify-center py-4">
            <span className="bg-accent-soft accent grid h-28 w-28 place-items-center rounded-full">
              <PauseCircle size={64} />
            </span>
          </div>
          <div className="mb-5">
            <DeadlineCard compact />
          </div>
          {/* TODO: 正式な休止手続きページURLを LINKS.pauseOrder に設定 */}
          <a href={LINKS.pauseOrder} target="_blank" rel="noopener noreferrer" className="btn-primary !min-h-[76px] !text-[1.3rem]">
            <ExternalLink size={28} /> 休止の手続きへ
          </a>
          <a href={`tel:${LINKS.supportTel}`} className="btn-glass mt-3">
            <Phone size={24} /> お客さまダイヤル
          </a>
        </>
      )}
    </AppShell>
  );
}
