import type { CartItem, CartSummary, ProductCadence } from '../types.js';
import type { MockMCPClient } from './mcpClient.js';

const CART_CAP_INR = 1000;

// ── Cart Builder ──
// Validates candidate items via MCP, pre-builds the cart, returns summary.

export async function buildReplenishmentCart(
  client: MockMCPClient,
  candidates: ProductCadence[]
): Promise<CartSummary & { skipped: string[] }> {

  // Step 1 — Resolve Home address
  const addrResult = await client.callTool('get_addresses');
  const home =
    addrResult.data.addresses.find(a => a.label === 'Home') ??
    addrResult.data.addresses[0];
  if (!home) throw new Error('No saved delivery address found');

  // Step 2 — Validate each candidate: in stock + current price
  const validItems: CartItem[] = [];
  const skipped: string[] = [];

  for (const c of candidates) {
    const result = await client.callTool('search_products', {
      addressId: home.id,
      query: c.productId,
    });
    const product = result.data.products[0];
    if (product?.inStock) {
      validItems.push({
        spinId: product.id,
        productName: product.name,
        quantity: c.lastQty,
        unitPrice: product.price,
        lineTotal: product.price * c.lastQty,
      });
    } else {
      skipped.push(c.productName);
    }
  }

  // Step 3 — Pre-build cart
  await client.callTool('update_cart', {
    selectedAddressId: home.id,
    items: validItems.map(i => ({ spinId: i.spinId, quantity: i.quantity })),
  });

  // Step 4 — Read back cart total for confirmation display
  const cartResult = await client.callTool('get_cart');
  const cart = cartResult.data.cart;

  // Step 5 — ₹1000 cap check
  const warning = cart.total > CART_CAP_INR ? 'cart_cap_exceeded' : null;

  return { cart, warning, skipped };
}

// Called after the user taps "Confirm & Order"
export async function confirmRestockOrder(
  client: MockMCPClient,
  addressId: string
): Promise<{ orderId: string; total: number }> {
  const result = await client.callTool('checkout', { addressId, paymentMethod: 'COD' });
  // ⚠ checkout is NOT idempotent — on 5xx, call get_orders before retrying
  return result.data;
}
