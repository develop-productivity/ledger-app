import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import type { EntryType } from '@/core/ledger';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface CategoryMeta {
  icon: IconName;
  color: string;
}

const EXPENSE: Record<string, CategoryMeta> = {
  餐饮: { icon: 'restaurant', color: '#FF8A4C' },
  交通: { icon: 'car', color: '#3BA7F5' },
  购物: { icon: 'bag-handle', color: '#F0609E' },
  居住: { icon: 'home', color: '#8E6CEF' },
  娱乐: { icon: 'game-controller', color: '#F5B731' },
  医疗: { icon: 'medkit', color: '#EF5B5B' },
  学习: { icon: 'school', color: '#22B8A6' },
  人情: { icon: 'gift', color: '#E8749A' },
  通讯: { icon: 'phone-portrait', color: '#5C7CFA' },
  其他: { icon: 'ellipsis-horizontal', color: '#8A94A6' },
};

const INCOME: Record<string, CategoryMeta> = {
  工资: { icon: 'cash', color: '#2BB673' },
  副业: { icon: 'briefcase', color: '#14A39A' },
  理财: { icon: 'trending-up', color: '#3BA7F5' },
  红包: { icon: 'mail', color: '#EF5B5B' },
  其他: { icon: 'ellipsis-horizontal', color: '#8A94A6' },
};

const FALLBACK: CategoryMeta = { icon: 'pricetag', color: '#8A94A6' };

export function categoryMeta(type: EntryType, name: string): CategoryMeta {
  return (type === 'income' ? INCOME : EXPENSE)[name] ?? FALLBACK;
}
