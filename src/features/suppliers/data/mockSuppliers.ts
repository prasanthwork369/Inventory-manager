/**
 * Temporary typed data, standing in for the web reference's seed.ts
 * `seedSuppliers`. This is now the ONE canonical supplier seed in the
 * app — Stock's own mockSuppliers.ts (from the Stock phase) has been
 * removed; stockProvider.ts's getStockSuppliers() reads this list
 * through suppliersProvider.ts instead (see stockProvider.ts's header).
 *
 * No `outstanding` here — it's a derived financial aggregate, not
 * intrinsic party data (see types.ts's SupplierDetailSummary), so it's
 * never part of this seed.
 */
import type { Supplier } from '../types';

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Sharma Distributors',
    phone: '+91 98450 11223',
    email: 'orders@sharmadist.in',
    address: 'Shop 22, Wholesale Market, Bengaluru',
    notes: 'Delivers every Tuesday and Friday.',
    isActive: true,
    createdAt: daysAgoIso(210),
    updatedAt: daysAgoIso(12),
  },
  {
    id: 'sup-2',
    name: 'Metro Electronics Supply',
    phone: '+91 99001 45678',
    email: 'sales@metroelec.com',
    address: 'SP Road, Bengaluru',
    notes: '30-day credit terms.',
    isActive: true,
    createdAt: daysAgoIso(180),
    updatedAt: daysAgoIso(20),
  },
  {
    id: 'sup-3',
    name: 'Fresh Foods Wholesale',
    phone: '+91 90080 33445',
    email: 'fresh@ffw.in',
    address: 'Yeshwanthpur APMC Yard',
    notes: '',
    isActive: true,
    createdAt: daysAgoIso(150),
    updatedAt: daysAgoIso(9),
  },
  {
    id: 'sup-4',
    name: 'Urban Threads Pvt Ltd',
    phone: '+91 88670 55667',
    email: 'contact@urbanthreads.in',
    address: 'Tirupur, Tamil Nadu',
    notes: 'Minimum order 50 pieces.',
    isActive: true,
    createdAt: daysAgoIso(95),
    updatedAt: daysAgoIso(30),
  },
  {
    id: 'sup-5',
    name: 'GlowKart Cosmetics',
    phone: '+91 78290 99887',
    email: 'b2b@glowkart.in',
    address: 'Commercial Street, Bengaluru',
    notes: '',
    isActive: true,
    createdAt: daysAgoIso(60),
    updatedAt: daysAgoIso(6),
  },
];
