import type { EventItem } from './types';
import { fmtDate, fmtTime } from './date';

/** LINE 一斉案内用の文面を作る */
export function eventLineText(ev: EventItem, leaderName: string) {
  const lines = [
    `【${ev.title}】のご案内`,
    '',
    `📅 ${fmtDate(ev.startAt)} ${fmtTime(ev.startAt)}〜`,
    ev.place ? `📍 ${ev.place}` : '',
    ev.note ? `\n${ev.note}` : '',
    '',
    '参加・不参加はアプリからお返事ください。',
    `お友だちもお誘いください😊`,
    '',
    `${leaderName}`,
  ];
  return lines.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n').trim();
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export const lineShareUrl = (text: string) => `https://line.me/R/share?text=${encodeURIComponent(text)}`;
