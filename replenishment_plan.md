# Smart Replenishment Agent — Build Plan

> Swiggy Builders Club · Instamart MCP v1
> **Build Verdict: Ship It**

---

## Idea Scorecard

| Dimension | Score |
|---|---|
| User Pain Severity | 9 / 10 |
| MCP Fit (tools available) | 8 / 10 |
| Implementation Effort | Medium |
| Time to Working MVP | 4 weeks |
| Monetisation Potential | High |
| Differentiation | Strong |

**Overall Verdict: Build. Ship. Now.**

---

## 01 — Why This Idea Works

The core insight is a structural mismatch: Swiggy already knows your full order history via `get_orders` and surfaces frequently bought items via `your_go_to_items` — but does absolutely nothing autonomous with that data. The user still opens the app, searches for "milk", adds it, searches for "bread"... every single week.

That is 47% of orders happening purely through habit, where the app adds zero cognitive leverage. Every single one of those sessions is a candidate for automation. The activation energy required is a consumption model and a single notification.

> **The Core Bet:** If you can get the predicted cart to be 80% right, users will confirm it rather than rebuild from scratch. Accuracy doesn't need to be perfect — it needs to be better than starting over.

### What makes it sticky

- **Habit compression.** Turns a 12-minute weekly session into a 10-second confirm tap. Users will not go back once they have this.
- **Data flywheel.** Each correction ("still have eggs — skip") trains the model. Gets smarter every week.
- **Natural upsell surface.** "Your restock is ready — we also noticed you're low on cooking oil. Add it?" opens a clean, non-spammy upsell lane.
- **No new account needed.** Rides entirely on the user's existing Swiggy history. Zero cold start for existing users.
- **Defensible moat.** The longer a user uses the agent, the more personalised it becomes. Hard to replicate elsewhere.

> **Swiggy's narrative fit:** Swiggy launched MCP specifically to enable "AI agents that act on behalf of users." A smart restock agent is the most literal, highest-value interpretation of that vision. Perfect story for a Builders Club submission.

---

## 02 — MCP Tool Fit Analysis

The Instamart MCP server exposes 13 tools. Six of them are a direct fit for this agent. Nothing critical is missing — the only custom work is the consumption model, which lives entirely in your own backend.

| MCP Tool | How this agent uses it | Status |
|---|---|---|
| `get_orders` | Primary data source. Pull full Instamart order history — extract product IDs, quantities, and timestamps. The raw material for your consumption model. | ✅ READY |
| `your_go_to_items` | Bootstrap the initial product candidate list. Cross-reference with order timestamps to seed the model before you have enough history for frequency inference. | ✅ READY |
| `get_addresses` | Resolve delivery address for cart pre-build and confirmation. Required before `update_cart` is called. Always pick the "Home" label, fall back to last-used. | ✅ READY |
| `search_products` | Validate items are still available before adding to cart. Also used for price refresh — confirm the current price matches user's expectation before auto-adding. | ✅ READY |
| `update_cart` | Pre-build the predicted cart. Called after user confirms via notification — replaces entire cart with the replenishment items. This is the core action tool. | ✅ READY |
| `get_cart` | Validate cart state after `update_cart`. Surface total to user before checkout so there are no surprises on the ₹1000 cap or unexpected items. | ✅ READY |
| `checkout` | Final order placement after user confirms cart. COD only in v1. Check total ≤ ₹1000 before calling. Not idempotent — check `get_orders` on 5xx before retry. | ✅ READY |

> **One Gap: No Consumption Model in MCP.** The only thing MCP does not provide is the consumption rate model — the logic that infers "this user buys 2L milk every 4.8 days." That lives in your own backend (a simple Supabase table). This is not a blocker; it is the actual product you are building on top of the MCP primitives.

---

## 03 — System Architecture

Five components. No unnecessary complexity. The agent is a thin AI orchestration layer sitting between Swiggy's MCP server and the user. The consumption model is the only custom backend logic. Everything else delegates to MCP tools.

```
───────────────────────────────────────────────────────────────────────────
                      SMART REPLENISHMENT AGENT
───────────────────────────────────────────────────────────────────────────

┌──────────────────┐        (daily cron)
│   VERCEL CRON    │  ──────►  [ Replenishment Scheduler ]
│  runs at 08:00   │          Checks: is today a predicted restock day?
└──────────────────┘          For each user whose model says YES ↓

                                    ↓

┌───────────────────────────────────────────────────────┐
│              CONSUMPTION MODEL ENGINE                 │
│   (Supabase: product_cadences table)                 │
│                                                       │
│   product_id │ avg_days_between │ last_ordered │ qty  │
│   ──────────   ────────────────   ──────────────────  │
│   SKU_00123  │      4.8         │   2025-05-01 │  2   │
│   SKU_00456  │      7.2         │   2025-04-29 │  1   │
│   SKU_00789  │      3.1         │   2025-05-03 │  4   │
└───────────────────────────────────────────────────────┘

              Model computes: predicted_restock_date = last_ordered + avg_days
              Items where predicted_restock_date ≤ today + 1 → candidate cart

                                    ↓

┌───────────────────────────────────────────────────────┐
│            MCP TOOL CHAIN (per candidate cart)        │
└───────────────────────────────────────────────────────┘

   get_orders        ──────► seed / refresh consumption model (nightly)
   your_go_to_items  ──────► bootstrap model for new users (cold start)
   search_products   ──────► validate availability + current price per item
   get_addresses     ──────► resolve "Home" addressId for cart
   update_cart       ──────► pre-build cart with validated items + quantities
   get_cart          ──────► surface total to user in notification

                                    ↓

┌───────────────────────────────────────────────────────┐
│              USER NOTIFICATION SURFACE                │
│  Push (FCM / Expo):                                   │
│  "🛒 Your weekly restock is ready — 8 items, ₹847"   │
│  [ Confirm & Order ]   [ Edit Cart ]   [ Skip ]       │
└───────────────────────────────────────────────────────┘

                                    ↓
                         ┌──────────┴──────────┐
                         ↓                     ↓
              User taps CONFIRM          User taps EDIT
                         ↓                     ↓
                    checkout()         Open cart in app
                    COD · ≤ ₹1000      for manual tweaks
                         ↓
             Order placed. Track via
             track_order(orderId)

FEEDBACK LOOP: Every "Skip" or cart edit → update model weights for that SKU
               "Still have eggs" → push last_ordered forward by 3 days
               Model improves passively with each weekly cycle
```

---

## 04 — 4-Week Execution Plan

Working MVP in 28 days. Solo or 2-person team. Each week ends with a testable deliverable. No week is a dead sprint — something works at the end of every 7 days.

### Week 01 — Auth + Data Layer
> Goal: Can read order history

- **D1** — Apply Swiggy Builders Club access. Start OAuth 2.1 + PKCE flow setup.
- **D2** — Wire `get_orders` + `your_go_to_items`. Dump raw data to console.
- **D3** — Design Supabase schema: `product_cadences`, `user_prefs`, `restock_events`.
- **D4** — Build order history parser — extract product_id, qty, timestamp per order line.
- **D5** — Write basic frequency inference: avg_days_between_purchases per SKU.

**🏁 MILESTONE: Console shows "Milk: restock in 2 days" from real history**

### Week 02 — Cart Builder
> Goal: Can pre-build a cart

- **D8** — Wire `search_products` — validate each candidate item is in stock + get current price.
- **D9** — Wire `get_addresses` — resolve Home address ID for cart context.
- **D10** — Implement `update_cart` call with candidate items + quantities.
- **D11** — Wire `get_cart` — read back total and item list for confirmation display.
- **D12** — Add ₹1000 cap check. If over: sort by priority score, trim from bottom.

**🏁 MILESTONE: Agent pre-builds real Instamart cart from predicted items**

### Week 03 — Notification + Confirm
> Goal: End-to-end, one tap

- **D15** — Set up Vercel Cron job — runs daily 08:00 IST, checks restock candidates per user.
- **D16** — Integrate FCM / Expo Push. Send "Your cart is ready" notification with total.
- **D17** — Build confirm endpoint — user taps → calls `checkout` → returns order ID.
- **D18** — Build edit flow — taps "Edit Cart" → deep-link opens Instamart cart in app.
- **D19** — Build skip + snooze. "Skip" → push last_ordered + avg_days. "Snooze 2 days" → defer.

**🏁 MILESTONE: Full flow works on real phone — notification → order placed**

### Week 04 — Feedback + Polish
> Goal: Ready for demo video

- **D22** — Build feedback capture — record every edit/skip and adjust model weights per SKU.
- **D23** — Add "Still have X?" friction prompt for items skipped 2+ weeks in a row.
- **D24** — Build minimal settings UI — enable/disable restock agent, set preferred time.
- **D25** — Add retry logic — 5xx on checkout → check `get_orders` before retrying (not idempotent!).
- **D26** — Record demo video. Submit to Swiggy Builders Club with use case + metrics story.

**🏁 MILESTONE: Demo submitted. Working product in hands of real users.**

---

## 05 — Code Skeleton

The three files that matter most. Everything else is wiring and UI.

### `lib/consumption-model.ts`

```typescript
// Infer purchase frequency per SKU from raw order history

interface ProductCadence {
  productId: string;
  avgDaysBetween: number;
  lastOrderedAt: Date;
  lastQty: number;
  predictedRestockDate: Date;
  confidence: 'high' | 'medium' | 'low';
}

export function buildConsumptionModel(
  orders: InstamrtOrder[]
): ProductCadence[] {
  // Group order lines by product_id
  const byProduct = groupBy(
    orders.flatMap(o => o.items),
    item => item.productId
  );

  return Object.entries(byProduct).map(([productId, entries]) => {
    // Sort by date ascending
    const sorted = entries.sort((a, b) =>
      new Date(a.orderedAt).getTime() - new Date(b.orderedAt).getTime()
    );

    // Compute gaps between purchases (in days)
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i].orderedAt).getTime()
        - new Date(sorted[i-1].orderedAt).getTime()) / 86_400_000;
      gaps.push(diff);
    }

    const avgDays = gaps.length > 0
      ? gaps.reduce((a, b) => a + b, 0) / gaps.length
      : 7; // default to weekly if only 1 purchase

    const last = sorted[sorted.length - 1];
    const predictedRestockDate = new Date(
      new Date(last.orderedAt).getTime() + avgDays * 86_400_000
    );

    return {
      productId,
      avgDaysBetween: Math.round(avgDays * 10) / 10,
      lastOrderedAt: new Date(last.orderedAt),
      lastQty: last.quantity,
      predictedRestockDate,
      // confidence based on data points: >4 = high, 2–4 = medium, 1 = low
      confidence: sorted.length >= 4 ? 'high'
                : sorted.length >= 2 ? 'medium' : 'low',
    };
  });
}
```

### `lib/cart-builder.ts`

```typescript
// Build and validate the predicted replenishment cart via MCP

export async function buildReplenishmentCart(
  client: MCPClient,
  candidates: ProductCadence[]
): Promise<CartSummary> {
  // Step 1 — Resolve address
  const addresses = await client.callTool({ name: "get_addresses" });
  const home = addresses.data.find(a => a.label === "Home")
    ?? addresses.data[0];
  if (!home) throw new Error("No saved address found");

  // Step 2 — Validate each candidate item: in stock + price check
  const validItems: CartItem[] = [];
  for (const c of candidates) {
    const result = await client.callTool({
      name: "search_products",
      arguments: { addressId: home.id, query: c.productId }
    });
    const product = result.data.products[0];
    if (product?.inStock) {
      validItems.push({ itemId: product.id, quantity: c.lastQty });
    }
    // Out-of-stock items silently skipped (substitution engine = Pain Point 05)
  }

  // Step 3 — Pre-build cart
  await client.callTool({
    name: "update_cart",
    arguments: { items: validItems }
  });

  // Step 4 — Read back cart for confirmation display
  const cart = await client.callTool({ name: "get_cart" });

  // Step 5 — Cap check (₹1000 limit in v1)
  if (cart.data.total > 1000) {
    return { cart: cart.data, warning: "cart_cap_exceeded" };
  }

  return { cart: cart.data, warning: null };
}

// Confirm and place the order (called after user taps "Confirm")
export async function confirmRestockOrder(
  client: MCPClient
): Promise<string> {
  const order = await client.callTool({
    name: "checkout",
    arguments: { paymentMethod: "COD" }
  });
  // ⚠ checkout is NOT idempotent — on 5xx, check get_orders before retry
  return order.data.orderId;
}
```

### `api/cron/daily-restock.ts` (Vercel Cron)

```typescript
// Runs daily at 08:00 IST — check which users need a restock today

export async function GET() {
  const today = new Date();

  // Load all users with active restock agent
  const users = await db
    .from('user_prefs')
    .select('*')
    .eq('restock_enabled', true);

  for (const user of users.data) {
    // Fetch their cadence model from DB
    const cadences = await db
      .from('product_cadences')
      .select('*')
      .eq('user_id', user.id);

    // Items predicted to run out today or tomorrow
    const restockCandidates = cadences.data.filter(c => {
      const daysUntilRestock = (
        new Date(c.predicted_restock_date).getTime() - today.getTime()
      ) / 86_400_000;
      return daysUntilRestock <= 1; // due today or tomorrow
    });

    if (restockCandidates.length === 0) continue;

    // Build the cart using their MCP session
    const mcpClient = await getMCPClientForUser(user.id);
    const { cart, warning } = await buildReplenishmentCart(
      mcpClient, restockCandidates
    );

    // Fire push notification
    await sendPushNotification(user.pushToken, {
      title: `🛒 Your weekly restock is ready`,
      body: `${cart.itemCount} items · ₹${cart.total} · Tap to confirm`,
      data: { cartTotal: cart.total, warning, userId: user.id }
    });
  }

  return Response.json({ ok: true });
}
```

---

## 06 — Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Sparse order history — new users have <3 Instamart orders | High | Medium | Cold-start via `your_go_to_items` as seed. Default to 7-day cadence for unknown items. Show confidence indicator on notification ("Based on 2 orders — your first suggested cart"). |
| Checkout not idempotent — double order on 5xx retry | Medium | High | On any 5xx from `checkout`, call `get_orders` first and check if an order was placed in the last 2 minutes before retrying. Never retry blindly. |
| User feels cart auto-add is intrusive / creepy | Medium | Medium | Hard opt-in only. Cart is pre-built but notification says "ready to review" — user must tap to confirm. Never auto-place without explicit confirmation. Make "Disable Agent" one tap. |
| MCP session token expires (5-day TTL) during cron | High | Medium | Catch 401 / JSON-RPC -32001 per user. Mark user as "needs reauth" in DB. Send notification: "Reconnect Swiggy to keep your restock agent running." Re-run after reauth. |

---

## 07 — Success Metrics — Beta Cohort (4 Weeks)

Run with 20–50 opted-in users from your network first. These are the numbers that tell you if the idea has legs before you scale.

| Metric | Target | Description |
|---|---|---|
| Cart Confirm Rate | > 40% | % of users who tap "Confirm" when shown a pre-built restock cart |
| Cart Accuracy | > 75% | Items in pre-built cart that user keeps without editing |
| Time Saved / Week | > 10 min | vs. manual session (measure via session length in Swiggy app baseline) |
| Week 4 Retention | > 70% | % of beta users still using the agent after 4 weeks |

> **The Story for Swiggy:** The Builders Club submission narrative: "We reduced the cognitive load of repeat grocery ordering from a 12-minute weekly search session to a single notification confirmation, using exclusively the tools your MCP server already exposes." That is a clean, verifiable, high-value story — with a demo video showing a notification → order placed in under 10 seconds.

---

*Smart Replenishment Agent — Build Plan · Swiggy Builders Club · Instamart MCP v1 · 13 Tools · 4 Weeks to MVP*
