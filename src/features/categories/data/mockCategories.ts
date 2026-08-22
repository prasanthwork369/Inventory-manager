/**
 * Temporary typed data. Uses the exact same category ids the Products
 * feature's own mock data (src/features/products/data/mockProducts.ts)
 * already references via `categoryId`, so product counts and the
 * Categories<->Products cross-link resolve correctly today. Enriches
 * Products' lightweight {id,name} list with the fields this feature
 * actually owns (icon, description, isActive, timestamps) — Categories is
 * the domain owner of this data; Products only ever needed a name lookup.
 */
import type { Category } from '../types';

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-electronics',
    name: 'Electronics',
    description: 'Gadgets, cables and accessories',
    icon: '🔌',
    isActive: true,
    createdAt: daysAgoIso(220),
    updatedAt: daysAgoIso(20),
  },
  {
    id: 'cat-groceries',
    name: 'Groceries',
    description: 'Everyday food and pantry items',
    icon: '🛒',
    isActive: true,
    createdAt: daysAgoIso(220),
    updatedAt: daysAgoIso(15),
  },
  {
    id: 'cat-apparel',
    name: 'Apparel',
    description: 'Clothing and accessories',
    icon: '👕',
    isActive: true,
    createdAt: daysAgoIso(200),
    updatedAt: daysAgoIso(30),
  },
  {
    id: 'cat-home',
    name: 'Home & Kitchen',
    description: 'Household and kitchen essentials',
    icon: '🪑',
    isActive: true,
    createdAt: daysAgoIso(180),
    updatedAt: daysAgoIso(10),
  },
  {
    id: 'cat-stationery',
    name: 'Stationery',
    description: 'Office and school supplies',
    icon: '📦',
    isActive: true,
    createdAt: daysAgoIso(210),
    updatedAt: daysAgoIso(40),
  },
  {
    id: 'cat-personal-care',
    name: 'Personal Care',
    description: 'Health and personal hygiene',
    icon: '🧴',
    isActive: true,
    createdAt: daysAgoIso(150),
    updatedAt: daysAgoIso(5),
  },
];
