// ── Smart Replenishment Agent — Demo Runner ──
// Simulates the full end-to-end flow using sample order data.
// Run: npx tsx src/demo.ts

import { SAMPLE_ORDERS, DEMO_USER } from './data/sampleOrders.js';
import { buildConsumptionModel, getRestockCandidates } from './lib/consumptionModel.js';
import { MockMCPClient } from './lib/mcpClient.js';
import { buildReplenishmentCart, confirmRestockOrder } from './lib/cartBuilder.js';
import type { ProductCadence } from './types.js';

// ── ANSI colour helpers (zero dependencies) ──
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  orange: '\x1b[38;5;214m',
  green:  '\x1b[38;5;83m',
  red:    '\x1b[38;5;203m',
  yellow: '\x1b[38;5;227m',
  blue:   '\x1b[38;5;117m',
  grey:   '\x1b[38;5;245m',
  white:  '\x1b[97m',
};

const fmt = {
  header:  (s: string) => `${c.bold}${c.orange}${s}${c.reset}`,
  section: (s: string) => `${c.bold}${c.white}${s}${c.reset}`,
  ok:      (s: string) => `${c.green}${s}${c.reset}`,
  warn:    (s: string) => `${c.yellow}${s}${c.reset}`,
  err:     (s: string) => `${c.red}${s}${c.reset}`,
  muted:   (s: string) => `${c.grey}${s}${c.reset}`,
  tool:    (s: string) => `${c.blue}${s}${c.reset}`,
  price:   (n: number) => `${c.orange}₹${n}${c.reset}`,
  badge: (label: string, color: string) => `${color}[${label}]${c.reset}`,
};

function divider(char = '─', width = 72) {
  console.log(fmt.muted(char.repeat(width)));
}

function step(emoji: string, label: string, tool?: string) {
  const toolTag = tool ? `  ${fmt.tool(`← ${tool}`)}` : '';
  console.log(`\n  ${emoji}  ${fmt.section(label)}${toolTag}`);
}

function confidenceBadge(conf: ProductCadence['confidence']) {
  if (conf === 'high')   return fmt.ok('[HIGH]');
  if (conf === 'medium') return fmt.warn('[MED]');
  return fmt.err('[LOW]');
}

function padEnd(str: string, len: number) {
  return str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length);
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Main demo ──────────────────────────────────────────────────────────────
async function main() {
  console.clear();

  // ── Header ────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(72));
  console.log(fmt.header('  SMART REPLENISHMENT AGENT  ') +
    fmt.muted('  Swiggy Instamart · Builders Club Demo'));
  console.log('═'.repeat(72));
  console.log(fmt.muted(`  User : ${DEMO_USER.name} (${DEMO_USER.email})`));
  console.log(fmt.muted(`  Date : 2026-05-06  (simulated "today")`));
  console.log(fmt.muted(`  Mode : ${DEMO_USER.restockEnabled ? 'Restock Agent ENABLED' : 'DISABLED'}`));
  console.log('═'.repeat(72) + '\n');

  await sleep(400);

  // ── PHASE 1: Build Consumption Model ──────────────────────────────────────
  console.log(fmt.header('\n▶  PHASE 1 — CONSUMPTION MODEL'));
  divider();
  step('📦', `Loading ${SAMPLE_ORDERS.length} orders from history`, 'get_orders');
  await sleep(300);

  const model = buildConsumptionModel(SAMPLE_ORDERS);

  console.log('\n  ' + fmt.muted('Product               Avg Days  Orders  Last Purchased  Predicted Restock  Conf'));
  console.log('  ' + fmt.muted('─'.repeat(86)));

  const TODAY = new Date('2026-05-06');

  for (const m of model) {
    const daysLeft = (m.predictedRestockDate.getTime() - TODAY.getTime()) / 86_400_000;
    const dueSoon   = daysLeft <= 1;
    const dateStr   = m.predictedRestockDate.toISOString().slice(0, 10);
    const lastStr   = m.lastOrderedAt.toISOString().slice(0, 10);
    const daysTag   = dueSoon
      ? fmt.ok('  DUE NOW ')
      : fmt.muted(`  in ${Math.ceil(daysLeft).toString().padStart(2)} days`);

    console.log(
      '  ' +
      padEnd(m.productName, 22) +
      padEnd(`${m.avgDaysBetween}d`, 10) +
      padEnd(`${m.orderCount}`, 8) +
      padEnd(lastStr, 16) +
      `${dateStr}` +
      daysTag + '  ' +
      confidenceBadge(m.confidence)
    );
  }

  await sleep(400);

  // ── PHASE 2: Identify Restock Candidates ─────────────────────────────────
  console.log(fmt.header('\n▶  PHASE 2 — RESTOCK CANDIDATES (due today or overdue)'));
  divider();

  const candidates = getRestockCandidates(model, TODAY, 1);

  if (candidates.length === 0) {
    console.log(fmt.ok('\n  No restocks due today. Nothing to do.'));
    return;
  }

  step('🔍', `${candidates.length} items identified as due for restock`);
  await sleep(200);

  for (const c of candidates) {
    const overdue = c.predictedRestockDate < TODAY;
    const tag = overdue ? fmt.warn('(overdue)') : fmt.ok('(due today)');
    console.log(
      `     • ${padEnd(c.productName, 30)} qty ${c.lastQty}  ${tag}`
    );
  }

  await sleep(400);

  // ── PHASE 3: MCP Tool Chain ───────────────────────────────────────────────
  console.log(fmt.header('\n▶  PHASE 3 — MCP TOOL CHAIN'));
  divider();

  const client = new MockMCPClient();

  step('📍', 'Resolving delivery address', 'get_addresses');
  await sleep(200);
  console.log(fmt.ok('     → Home: 42, Koramangala 4th Block, Bengaluru 560034'));

  step('🔎', 'Validating item availability + prices', 'search_products');
  await sleep(300);

  // Show per-item validation
  for (const cand of candidates) {
    await sleep(120);
    // peek at the product catalog to show status without re-running the full builder
    const { PRODUCTS } = await import('./data/sampleProducts.js');
    const p = PRODUCTS[cand.productId];
    if (p?.inStock) {
      console.log(`     ${fmt.ok('✓')} ${padEnd(cand.productName, 28)} ₹${p.price} × ${cand.lastQty} = ₹${p.price * cand.lastQty}`);
    } else {
      console.log(`     ${fmt.err('✗')} ${padEnd(cand.productName, 28)} ${fmt.err('OUT OF STOCK — skipping')}`);
    }
  }

  step('🛒', 'Pre-building replenishment cart', 'update_cart');
  await sleep(200);

  const { cart, warning, skipped } = await buildReplenishmentCart(client, candidates);

  step('📋', 'Reading back cart for confirmation display', 'get_cart');
  await sleep(150);

  // ── PHASE 4: Notification Preview ────────────────────────────────────────
  console.log(fmt.header('\n▶  PHASE 4 — PUSH NOTIFICATION'));
  divider();
  console.log(`
  ┌─────────────────────────────────────────────────┐
  │  ${c.orange}Swiggy Instamart${c.reset}                                 │
  │                                                 │
  │  🛒 ${c.bold}Your weekly restock is ready!${c.reset}           │
  │                                                 │
  │  ${c.white}${cart.itemCount} items  ·  ${fmt.price(cart.total)}                              ${c.reset}│
  │                                                 │
  │  ${c.green}[ Confirm & Order ]${c.reset}  ${c.grey}[ Edit Cart ]${c.reset}  ${c.grey}[ Skip ]${c.reset}  │
  └─────────────────────────────────────────────────┘
  `.replace(/^/gm, '  '));

  if (skipped.length > 0) {
    console.log(fmt.warn(`  ⚠  Skipped (out of stock): ${skipped.join(', ')}`));
  }

  if (warning === 'cart_cap_exceeded') {
    console.log(fmt.err('\n  ⚠  Cart total exceeds ₹1000 cap. Trimming lowest-priority items.'));
  }

  await sleep(600);

  // ── PHASE 5: Simulate User Confirmation ──────────────────────────────────
  console.log(fmt.header('\n▶  PHASE 5 — USER CONFIRMS → CHECKOUT'));
  divider();
  step('👆', 'User taps  [ Confirm & Order ]');
  await sleep(400);

  step('💳', 'Placing order via COD', 'checkout');
  await sleep(300);

  const { orderId, total } = await confirmRestockOrder(client, cart.addressId);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(72));
  console.log(fmt.header('  ORDER PLACED SUCCESSFULLY'));
  console.log('═'.repeat(72));
  console.log(`\n  ${fmt.ok('✓')}  Order ID   : ${c.bold}${orderId}${c.reset}`);
  console.log(`  ${fmt.ok('✓')}  Payment    : Cash on Delivery`);
  console.log(`  ${fmt.ok('✓')}  Total      : ${fmt.price(total)}`);
  console.log(`  ${fmt.ok('✓')}  Delivery   : 42, Koramangala 4th Block, Bengaluru`);
  console.log('\n  Items ordered:');

  for (const item of cart.items) {
    console.log(
      `     • ${padEnd(item.productName, 28)} qty ${item.quantity}  →  ₹${item.lineTotal}`
    );
  }

  console.log('\n' + '═'.repeat(72));
  console.log(fmt.muted('  Feedback loop: cart edits & skips will update model weights next cycle.'));
  console.log(fmt.muted('  Next restock check: tomorrow at 08:00 IST via Vercel Cron.'));
  console.log('═'.repeat(72) + '\n');
}

main().catch(err => {
  console.error('\n' + fmt.err('Fatal error:'), err);
  process.exit(1);
});
