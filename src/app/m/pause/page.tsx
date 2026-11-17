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
          <a href={`tel:${LINKS.supportTel}`} className="btn-glass mt-3 !min-h-[76px] whitespace-nowrap !gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="FORDAYS" className="h-6 w-auto shrink-0" />
            <span className="flex items-center gap-1.5 text-[1.15rem] font-bold">
              <Phone size={22} className="accent shrink-0" /> お客さまダイヤル
            </span>
          </a>
        </>
      )}
    </AppShell>
  );
}
