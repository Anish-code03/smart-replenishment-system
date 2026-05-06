// ── Shared TypeScript interfaces for the Smart Replenishment Agent ──

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  orderedAt: string; // ISO date string
}

export interface Order {
  orderId: string;
  placedAt: string; // ISO date string
  total: number;
  items: OrderItem[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  unit: string;
  price: number;
  inStock: boolean;
  category: string;
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  city: string;
  pincode: string;
}

export interface ProductCadence {
  productId: string;
  productName: string;
  avgDaysBetween: number;
  lastOrderedAt: Date;
  lastQty: number;
  predictedRestockDate: Date;
  confidence: 'high' | 'medium' | 'low';
  orderCount: number;
}

export interface CartItem {
  spinId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Cart {
  items: CartItem[];
  itemCount: number;
  total: number;
  addressId: string;
}

export interface CartSummary {
  cart: Cart;
  warning: 'cart_cap_exceeded' | null;
}

export interface UserPrefs {
  id: string;
  name: string;
  email: string;
  pushToken: string;
  restockEnabled: boolean;
  preferredTimeIST: string;
}

export interface MCPToolCall {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface MCPToolResult<T> {
  success: boolean;
  data: T;
}
