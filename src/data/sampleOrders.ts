import type { Order } from '../types.js';

// ── 4 months of realistic Instamart order history ──
// Today = 2026-05-06. Orders crafted so the model predicts restocks due today.
//
// Cadences baked into the data:
//   SKU_001  Milk         ~4.8 days  → last 2026-05-01 → due 2026-05-06 ✓
//   SKU_002  Bread        ~7.0 days  → last 2026-04-29 → due 2026-05-06 ✓
//   SKU_003  Butter       ~14.0 days → last 2026-04-22 → due 2026-05-06 ✓
//   SKU_004  Eggs         ~10.0 days → last 2026-04-25 → due 2026-05-05 ✓
//   SKU_007  Parle-G      ~21.0 days → last 2026-04-15 → due 2026-05-06 ✓
//   SKU_005  Oil          ~30.0 days → last 2026-04-20 → due 2026-05-20 ✗
//   SKU_006  Dettol       ~45.0 days → last 2026-04-01 → due 2026-05-16 ✗

let _orderId = 1;
const oid = () => `ORD_${String(_orderId++).padStart(4, '0')}`;

function order(date: string, items: Order['items']): Order {
  return {
    orderId: oid(),
    placedAt: date,
    total: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    items,
  };
}

function item(
  productId: string,
  productName: string,
  quantity: number,
  unitPrice: number,
  orderedAt: string
): Order['items'][0] {
  return { productId, productName, quantity, unitPrice, orderedAt };
}

// ── Milk purchase dates (every ~4.8 days from 2026-01-05) ──
const milkDates = [
  '2026-01-05', '2026-01-10', '2026-01-15', '2026-01-20', '2026-01-25',
  '2026-01-30', '2026-02-04', '2026-02-09', '2026-02-14', '2026-02-19',
  '2026-02-24', '2026-03-01', '2026-03-06', '2026-03-11', '2026-03-16',
  '2026-03-21', '2026-03-26', '2026-03-31', '2026-04-05', '2026-04-10',
  '2026-04-15', '2026-04-20', '2026-04-26', '2026-05-01',
];

// ── Bread purchase dates (every ~7 days from 2026-01-07) ──
const breadDates = [
  '2026-01-07', '2026-01-14', '2026-01-21', '2026-01-28',
  '2026-02-04', '2026-02-11', '2026-02-18', '2026-02-25',
  '2026-03-04', '2026-03-11', '2026-03-18', '2026-03-25',
  '2026-04-01', '2026-04-08', '2026-04-15', '2026-04-22', '2026-04-29',
];

// ── Butter purchase dates (every ~14 days from 2026-01-10) ──
const butterDates = [
  '2026-01-10', '2026-01-24', '2026-02-07', '2026-02-21',
  '2026-03-07', '2026-03-21', '2026-04-04', '2026-04-22',
];

// ── Eggs purchase dates (every ~10 days from 2026-01-06) ──
const eggsDates = [
  '2026-01-06', '2026-01-16', '2026-01-26', '2026-02-05',
  '2026-02-15', '2026-02-25', '2026-03-07', '2026-03-17',
  '2026-03-27', '2026-04-06', '2026-04-16', '2026-04-25',
];

// ── Parle-G purchase dates (every ~21 days from 2026-01-12) ──
const biscuitDates = [
  '2026-01-12', '2026-02-02', '2026-02-23', '2026-03-16',
  '2026-04-06', '2026-04-15',
];

// ── Oil purchase dates (every ~30 days, last 2026-04-20 → due 2026-05-20) ──
const oilDates = [
  '2026-01-08', '2026-02-07', '2026-03-09', '2026-04-20',
];

// ── Dettol purchase dates (every ~45 days, last 2026-04-01 → due 2026-05-16) ──
const dettolDates = [
  '2026-01-15', '2026-03-01', '2026-04-01',
];

// ── Combine into a flat list of orders, one item per order for clarity ──
export const SAMPLE_ORDERS: Order[] = [
  // Milk orders
  ...milkDates.map(d =>
    order(d, [item('SKU_001', 'Amul Toned Milk', 2, 25, d)])
  ),
  // Bread orders
  ...breadDates.map(d =>
    order(d, [item('SKU_002', 'Modern Whole Wheat Bread', 1, 35, d)])
  ),
  // Butter orders
  ...butterDates.map(d =>
    order(d, [item('SKU_003', 'Amul Butter', 1, 55, d)])
  ),
  // Eggs orders
  ...eggsDates.map(d =>
    order(d, [item('SKU_004', 'Farm Fresh Eggs', 1, 72, d)])
  ),
  // Parle-G orders
  ...biscuitDates.map(d =>
    order(d, [item('SKU_007', "Parle-G Biscuits", 1, 55, d)])
  ),
  // Oil orders
  ...oilDates.map(d =>
    order(d, [item('SKU_005', 'Fortune Sunflower Oil', 1, 148, d)])
  ),
  // Dettol orders
  ...dettolDates.map(d =>
    order(d, [item('SKU_006', 'Dettol Handwash', 1, 99, d)])
  ),
].sort((a, b) => a.placedAt.localeCompare(b.placedAt));

// ── User profile ──
export const DEMO_USER = {
  id: 'USR_001',
  name: 'Anish Majumdar',
  email: 'anish@example.com',
  pushToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  restockEnabled: true,
  preferredTimeIST: '08:00',
};
