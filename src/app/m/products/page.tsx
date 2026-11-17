'use client';
import { ExternalLink, Search, ShoppingBag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Empty, PageTitle } from '@/components/ui';
import { Sheet } from '@/components/ui/Sheet';
import { PRODUCTS, PRODUCT_GROUPS, type Product } from '@/data/products';

export default function Page() {
  return <AppShell mode="member">{() => <Products />}</AppShell>;
}

const ALL = 'すべて';
const shortGroup = (g: string) => g.replace('化粧品／スキンケア・メイク', 'スキンケア');

function Products() {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState(ALL);
  const [sel, setSel] = useState<Product | null>(null);

  const list = useMemo(() => {
    const k = q.trim();
    return PRODUCTS.filter(
      (p) => (group === ALL || p.group === group) && (!k || `${p.name}${p.category}${p.summary}`.includes(k)),
    );
  }, [q, group]);

  return (
    <>
      <PageTitle>製品</PageTitle>

      <div className="glass mb-3 flex items-center gap-2 rounded-full px-4">
        <Search size={24} className="text-black/40" />
        <input
          className="min-h-[60px] flex-1 bg-transparent text-[1.15rem] outline-none"
          placeholder="さがす"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {[ALL, ...PRODUCT_GROUPS].map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`chip shrink-0 whitespace-nowrap ${group === g ? 'bg-accent text-white shadow-md' : 'glass'}`}
          >
            {shortGroup(g)}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Empty icon={ShoppingBag} label="見つかりません" />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {list.map((p) => (
            <button key={p.id} onClick={() => setSel(p)} className="card flex flex-col gap-2 !p-3 text-left transition active:scale-[0.97]">
              <div className="aspect-square w-full overflow-hidden rounded-[20px] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" loading="lazy" className="h-full w-full object-contain p-2" />
              </div>
              <div className="line-clamp-2 text-base font-bold leading-snug">{p.name}</div>
              <div className="accent mt-auto text-base font-bold">{p.price}</div>
            </button>
          ))}
        </div>
      )}

      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel?.category}>
        {sel && (
          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-[24px] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sel.image} alt="" className="mx-auto h-56 object-contain p-3" />
            </div>
            <div>
              <h2 className="text-[1.35rem] font-bold leading-snug">{sel.name}</h2>
              {sel.sub && <div className="text-base text-black/50">{sel.sub}</div>}
              <div className="accent mt-1 text-[1.3rem] font-bold">{sel.price}</div>
            </div>
            {sel.summary && <p className="rounded-2xl bg-white/70 px-4 py-3 text-[1.05rem] leading-relaxed">{sel.summary}</p>}
            {sel.shopUrl && (
              <a href={sel.shopUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                <ShoppingBag size={26} /> 購入・変更ページへ
              </a>
            )}
            {sel.officialUrl && (
              <a href={sel.officialUrl} target="_blank" rel="noopener noreferrer" className="btn-glass">
                <ExternalLink size={22} /> 公式サイト
              </a>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}
