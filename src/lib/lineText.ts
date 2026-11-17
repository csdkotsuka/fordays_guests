import type { EventItem } from './types';
import { fmtDate, fmtTime } from './date';

export function getAppOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://fordays-guests.pages.dev';
}

export function eventInviteUrl(eventUuid: string) {
  return `${getAppOrigin()}/e/?id=${eventUuid}`;
}

/** LINE 一斉案内用の文面を作る（イベント専用ページへのリンク＆地図URL付き） */
export function eventLineText(ev: EventItem, leaderName: string) {
  const url = eventInviteUrl(ev.uuid);
  const lines = [
    `【${ev.title}】のご案内`,
    '',
    `📅 ${fmtDate(ev.startAt)} ${fmtTime(ev.startAt)}〜`,
    ev.place ? `📍 ${ev.place}` : '',
    ev.mapUrl ? `🗺️ 地図: ${ev.mapUrl}` : '',
    ev.note ? `\n${ev.note}` : '',
    '',
    '▼ 参加・不参加のお返事はこちら',
    url,
    '',
    'お友だちとのご参加も大歓迎です😊',
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

/** LINE アプリを起動する URL */
export const lineOpenAppUrl = 'https://line.me/R/nv/chat';
