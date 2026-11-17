'use client';
import { ExternalLink, FileText, Phone } from 'lucide-react';
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { DeadlineCard } from '@/components/DeadlineCard';
import { PageTitle } from '@/components/ui';
import { Sheet } from '@/components/ui/Sheet';
import { LINKS } from '@/config/links';

// TODO: マニュアルPDF受領後は LINKS.changeManualPdf を設定（PDF表示 → 変更ページへ）
const STEPS = ['マイページにログイン', '「定期購入」を開く', '製品を選び直す', '「変更を確定」を押す'];

export default function Page() {
  return <AppShell mode="member">{() => <Change />}</AppShell>;
}

function Change() {
  const [pdf, setPdf] = useState(false);

  return (
    <>
      <PageTitle>定期購入の変更</PageTitle>
      <div className="mb-5">
        <DeadlineCard compact />
      </div>

      {LINKS.changeManualPdf ? (
        <button className="btn-glass mb-5 !min-h-[76px]" onClick={() => setPdf(true)}>
          <FileText size={28} className="accent" /> マニュアルを見る
        </button>
      ) : (
        <ol className="mb-5 flex flex-col gap-3">
          {STEPS.map((s, i) => (
            <li key={s} className="card flex items-center gap-4 !py-4">
              <span className="bg-accent grid h-12 w-12 shrink-0 place-items-center rounded-full text-xl font-bold text-white">{i + 1}</span>
              <span className="text-[1.2rem] font-bold">{s}</span>
            </li>
          ))}
        </ol>
      )}

      <a href={LINKS.changeOrder} target="_blank" rel="noopener noreferrer" className="btn-primary !min-h-[76px] !text-[1.3rem]">
        <ExternalLink size={28} /> 変更ページへ
      </a>
      <a href={`tel:${LINKS.supportTel}`} className="btn-glass mt-3">
        <Phone size={24} /> お客さまダイヤル
      </a>

      <Sheet open={pdf} onClose={() => setPdf(false)} title="マニュアル">
        <div className="flex flex-col gap-4">
          <iframe title="マニュアル" src={LINKS.changeManualPdf} className="h-[60dvh] w-full rounded-2xl border-0 bg-white" />
          <a href={LINKS.changeOrder} target="_blank" rel="noopener noreferrer" className="btn-primary">
            <ExternalLink size={26} /> 変更ページへ
          </a>
        </div>
      </Sheet>
    </>
  );
}
