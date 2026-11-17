// ハンバーガーメニューの定義（AGENTS.md §3）
// 新機能はここに1行足すだけでメニューに出る。

import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  Gift,
  Home,
  MessageCircle,
  PauseCircle,
  RefreshCcw,
  Settings,
  ShoppingBag,
  UserPlus,
  Users,
} from 'lucide-react';
import type { Mode } from '@/lib/types';

export interface MenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const MENU: Record<Mode, MenuItem[]> = {
  member: [
    { href: '/m/', label: 'ホーム', icon: Home },
    { href: '/m/events/', label: 'イベント', icon: CalendarDays },
    { href: '/messages/', label: 'メッセージ', icon: MessageCircle },
    { href: '/m/refer/', label: 'お友だち紹介', icon: UserPlus },
    { href: '/m/rewards/', label: 'わたしの成績', icon: Gift },
    { href: '/m/products/', label: '製品', icon: ShoppingBag },
    { href: '/m/change/', label: '定期購入の変更', icon: RefreshCcw },
    { href: '/m/pause/', label: '一時休止', icon: PauseCircle },
    { href: '/settings/', label: '設定', icon: Settings },
  ],
  leader: [
    { href: '/l/', label: 'ホーム', icon: Home },
    { href: '/l/events/', label: 'イベント', icon: CalendarDays },
    { href: '/l/members/', label: 'メンバー', icon: Users },
    { href: '/messages/', label: 'メッセージ', icon: MessageCircle },
    { href: '/settings/', label: '設定', icon: Settings },
  ],
  admin: [
    { href: '/admin/', label: 'ホーム', icon: Home },
    { href: '/settings/', label: '設定', icon: Settings },
  ],
};
