// 定期購入の変更締め切り（毎月17日）
export const DEADLINE_DAY = 17;
export const NOTIFY_DAYS_BEFORE = [3, 1, 0]; // 3日前・前日・当日

export function nextDeadline(from = new Date()): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), DEADLINE_DAY);
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  if (today > d) d.setMonth(d.getMonth() + 1);
  return d;
}

export function daysUntil(target: Date, from = new Date()): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  return Math.round((b - a) / 86400000);
}

const WD = ['日', '月', '火', '水', '木', '金', '土'];
export const fmtDate = (d: Date | string) => {
  const x = typeof d === 'string' ? new Date(d) : d;
  return `${x.getMonth() + 1}月${x.getDate()}日（${WD[x.getDay()]}）`;
};
export const fmtTime = (d: Date | string) => {
  const x = typeof d === 'string' ? new Date(d) : d;
  return `${x.getHours()}:${String(x.getMinutes()).padStart(2, '0')}`;
};
export const fmtDateTime = (d: Date | string) => `${fmtDate(d)} ${fmtTime(d)}`;

/** <input type="datetime-local"> 用 */
export const toLocalInput = (iso: string) => {
  const x = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
};
