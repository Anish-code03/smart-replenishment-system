import type { Product, Address } from '../types.js';

// ── Product catalog (mock Instamart inventory) ──
export const PRODUCTS: Record<string, Product> = {
  SKU_001: {
    id: 'SKU_001',
    name: 'Amul Toned Milk',
    brand: 'Amul',
    unit: '1 L',
    price: 25,
    inStock: true,
    category: 'Dairy',
  },
  SKU_002: {
    id: 'SKU_002',
    name: 'Modern Whole Wheat Bread',
    brand: 'Modern',
    unit: '400 g',
    price: 35,
    inStock: true,
    category: 'Bakery',
  },
  SKU_003: {
    id: 'SKU_003',
    name: 'Amul Butter',
    brand: 'Amul',
    unit: '100 g',
    price: 55,
    inStock: true,
    category: 'Dairy',
  },
  SKU_004: {
    id: 'SKU_004',
    name: 'Farm Fresh Eggs',
    brand: 'Farm Fresh',
    unit: '6 pcs',
    price: 72,
    inStock: true,
    category: 'Eggs',
  },
  SKU_005: {
    id: 'SKU_005',
    name: 'Fortune Sunflower Oil',
    brand: 'Fortune',
    unit: '1 L',
    price: 148,
    inStock: true,
    category: 'Oils',
  },
  SKU_006: {
    id: 'SKU_006',
    name: 'Dettol Handwash',
    brand: 'Dettol',
    unit: '250 ml',
    price: 99,
    inStock: false, // out of stock — will be skipped during cart build
    category: 'Personal Care',
  },
  SKU_007: {
    id: 'SKU_007',
    name: "Parle-G Biscuits",
    brand: 'Parle',
    unit: '800 g',
    price: 55,
    inStock: true,
    category: 'Snacks',
  },
};

// ── Saved delivery addresses ──
export const ADDRESSES: Address[] = [
  {
    id: 'ADDR_001',
    label: 'Home',
    line1: '42, Koramangala 4th Block',
    city: 'Bengaluru',
    pincode: '560034',
  },
  {
    id: 'ADDR_002',
    label: 'Office',
    line1: '91Springboard, Koramangala',
    city: 'Bengaluru',
    pincode: '560095',
  },
];
