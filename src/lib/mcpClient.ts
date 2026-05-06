import type {
  Order,
  Product,
  Address,
  Cart,
  CartItem,
  MCPToolResult,
} from '../types.js';
import { PRODUCTS, ADDRESSES } from '../data/sampleProducts.js';
import { SAMPLE_ORDERS } from '../data/sampleOrders.js';

// ── Mock MCP Client ──
// Simulates the Swiggy Instamart MCP server tool responses.
// In production, replace callTool() with real MCP JSON-RPC calls.

export class MockMCPClient {
  private cart: CartItem[] = [];
  private addressId = '';

  async callTool(name: 'get_orders'): Promise<MCPToolResult<{ orders: Order[] }>>;
  async callTool(name: 'your_go_to_items', args: { addressId: string }): Promise<MCPToolResult<{ products: Product[] }>>;
  async callTool(name: 'get_addresses'): Promise<MCPToolResult<{ addresses: Address[] }>>;
  async callTool(
    name: 'search_products',
    args: { addressId: string; query: string }
  ): Promise<MCPToolResult<{ products: Product[] }>>;
  async callTool(
    name: 'update_cart',
    args: { selectedAddressId: string; items: { spinId: string; quantity: number }[] }
  ): Promise<MCPToolResult<{ success: boolean }>>;
  async callTool(name: 'get_cart'): Promise<MCPToolResult<{ cart: Cart }>>;
  async callTool(
    name: 'checkout',
    args: { addressId: string; paymentMethod?: string }
  ): Promise<MCPToolResult<{ orderId: string; total: number }>>;

  async callTool(name: string, args?: Record<string, unknown>): Promise<MCPToolResult<unknown>> {
    // Simulate network latency
    await delay(80);

    switch (name) {
      case 'get_orders':
        return { success: true, data: { orders: SAMPLE_ORDERS } };

      case 'your_go_to_items': {
        // Return the top 5 most frequently ordered products
        const freq: Record<string, number> = {};
        for (const o of SAMPLE_ORDERS) {
          for (const i of o.items) {
            freq[i.productId] = (freq[i.productId] ?? 0) + 1;
          }
        }
        const topIds = Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([id]) => id);
        return {
          success: true,
          data: { products: topIds.map(id => PRODUCTS[id]).filter(Boolean) },
        };
      }

      case 'get_addresses':
        return { success: true, data: { addresses: ADDRESSES } };

      case 'search_products': {
        const query = (args as { query: string }).query;
        const match = PRODUCTS[query] ?? null;
        return {
          success: true,
          data: { products: match ? [match] : [] },
        };
      }

      case 'update_cart': {
        const { selectedAddressId, items } = args as {
          selectedAddressId: string;
          items: { spinId: string; quantity: number }[];
        };
        this.addressId = selectedAddressId;
        this.cart = items
          .map(({ spinId, quantity }) => {
            const p = PRODUCTS[spinId];
            if (!p) return null;
            return {
              spinId,
              productName: p.name,
              quantity,
              unitPrice: p.price,
              lineTotal: p.price * quantity,
            };
          })
          .filter((i): i is CartItem => i !== null);
        return { success: true, data: { success: true } };
      }

      case 'get_cart': {
        const total = this.cart.reduce((s, i) => s + i.lineTotal, 0);
        return {
          success: true,
          data: {
            cart: {
              items: this.cart,
              itemCount: this.cart.length,
              total,
              addressId: this.addressId,
            },
          },
        };
      }

      case 'checkout': {
        // ⚠ Not idempotent — in production check get_orders before retrying on 5xx
        const total = this.cart.reduce((s, i) => s + i.lineTotal, 0);
        const orderId = `ORD_${Date.now()}`;
        return { success: true, data: { orderId, total } };
      }

      default:
        throw new Error(`Unknown MCP tool: ${name}`);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
