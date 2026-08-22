/**
 * Temporary typed data, standing in for the web reference's seed.ts
 * `seedCustomers`. No `outstanding` here — it's a derived financial
 * aggregate, not intrinsic party data (see types.ts's
 * CustomerDetailSummary), so it's never part of this seed.
 */
import type { Customer } from '../types';

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cus-1',
    name: 'Anita Rao',
    phone: '+91 98860 22110',
    email: 'anita.rao@gmail.com',
    address: '4th Cross, Domlur',
    notes: 'Prefers UPI.',
    isActive: true,
    createdAt: daysAgoIso(140),
    updatedAt: daysAgoIso(2),
  },
  {
    id: 'cus-2',
    name: 'Rakesh Kumar',
    phone: '+91 97400 88221',
    email: '',
    address: 'HAL 2nd Stage',
    notes: 'Buys in bulk for his office pantry.',
    isActive: true,
    createdAt: daysAgoIso(110),
    updatedAt: daysAgoIso(9),
  },
  {
    id: 'cus-3',
    name: 'Priya Menon',
    phone: '+91 90350 66112',
    email: 'priya.m@outlook.com',
    address: 'Koramangala 5th Block',
    notes: '',
    isActive: true,
    createdAt: daysAgoIso(85),
    updatedAt: daysAgoIso(5),
  },
  {
    id: 'cus-4',
    name: 'Imran Shaikh',
    phone: '+91 96320 41255',
    email: '',
    address: 'Frazer Town',
    notes: '',
    isActive: true,
    createdAt: daysAgoIso(60),
    updatedAt: daysAgoIso(14),
  },
  {
    id: 'cus-5',
    name: 'Deepa Textiles',
    phone: '+91 80410 77332',
    email: 'accounts@deepatex.in',
    address: 'Chickpet',
    notes: 'Business account, monthly settlement.',
    isActive: true,
    createdAt: daysAgoIso(40),
    updatedAt: daysAgoIso(3),
  },
];
