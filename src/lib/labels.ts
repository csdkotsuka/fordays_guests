import type { ReferralStatus, RsvpStatus } from './types';

export const REFERRAL_LABEL: Record<ReferralStatus, string> = { introduced: '紹介', joined: '参加', registered: '登録' };
export const RSVP_LABEL: Record<RsvpStatus, string> = { pending: '未返答', yes: '参加', no: '不参加' };
