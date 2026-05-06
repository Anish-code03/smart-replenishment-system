# Smart Replenishment Agent — CLAUDE.md

Project documentation for Claude Code. Contains architecture, tool inventory, design decisions, and conventions to follow when extending this codebase.

---

## What this project is

An AI-native grocery replenishment agent built on top of Swiggy's Instamart MCP (Model Context Protocol) server. It analyses a user's order history, infers per-product consumption cadences, predicts when each item will run out, pre-builds a cart, and sends a push notification so the user can confirm a restock in one tap — without manually searching for anything.

Submitted to: **Swiggy Builders Club · Instamart MCP v1**

---

## Repository layout

```
Smart-Replenishment-System/
├── CLAUDE.md                   ← this file
├── MEMORY.md                   ← project memory (≤200 lines)
├── README.md                   ← plain-English project overview
├── design.md                   ← Swiggy design system (colours, typography, components)
├── replenishment_plan.md       ← full build plan (from the HTML doc)
├── replenishment_plan.html     ← original design document
├── vercel.json                 ← Vercel cron schedule (08:00 IST daily)
├── .env.example                ← required environment variables
├── package.json
├── tsconfig.json
├── api/
│   ├── whatsapp.ts             ← Vercel serverless webhook (Twilio reply handler)
│   └── cron/
│       └── daily-restock.ts   ← Vercel Cron handler — sends daily WhatsApp prompt
├── ui/
│   └── index.html              ← conversational web UI (open in browser, no build step)
└── src/
    ├── types.ts                ← all shared TypeScript interfaces
    ├── data/
    │   ├── sampleOrders.ts     ← 74 mock orders across 7 SKUs (4 months)
    │   └── sampleProducts.ts   ← 7-product catalog + 2 saved addresses
    └── lib/
        ├── consumptionModel.ts ← frequency inference engine
        ├── mcpClient.ts        ← mock MCP client (drop-in for real MCP)
        ├── cartBuilder.ts      ← cart pre-build + checkout
        ├── whatsappClient.ts   ← Twilio WhatsApp send helpers
        └── demo.ts             ← terminal demo runner (npm run demo)
```

---

## How to run

**Terminal demo (5-phase sequential output):**
```bash
npm install
npm run demo
```

**Conversational web UI (interactive, Swiggy-branded):**
```bash
open ui/index.html
# or just double-click ui/index.html in Finder
```

The web UI runs entirely in-browser with no build step. It shows:
1. Greeting + full consumption model table for all 7 tracked items
2. Restock candidates with ✕ remove buttons per item (editable cart)
3. Live cart total that updates as you remove items
4. MCP tool chain animation (step-by-step with tool names)
5. Push notification card preview
6. Confirm & Order → success receipt

---

## Architecture

```
[Vercel Cron 08:00 IST]
        ↓
[api/cron/daily-restock.ts]
        ↓
[WhatsApp message via Twilio]
  "Are you ready for your daily restock?"
  Reply YES → cart link    Reply NO → skip
        ↓ (user replies YES)
[api/whatsapp.ts webhook]
        ↓
[Sends ui/index.html link to user]
        ↓ (user taps link)
[Conversational Web UI — ui/index.html]
        ↓
[Consumption Model Engine]   ← Supabase: product_cadences table
        ↓                       avg_days_between, last_ordered, predicted_restock_date
[MCP Tool Chain]
   get_orders          → seed / refresh consumption model
   your_go_to_items    → cold-start for new users (requires addressId)
   search_products     → validate availability + current price
   get_addresses       → resolve Home delivery address
   update_cart         → pre-build cart (selectedAddressId + spinId items)
   get_cart            → read back total for notification
        ↓
[checkout]                   ← COD · ≤ ₹1000 cap · addressId required
        ↓
[Feedback Loop]              ← every skip/edit updates model weights
```

---

## MCP tools used

| Tool | Purpose |
|---|---|
| `get_orders` | Primary data source — full Instamart order history |
| `your_go_to_items` | Bootstrap model for new users (cold-start) |
| `get_addresses` | Resolve `Home` addressId before cart operations |
| `search_products` | Validate in-stock status + current price per item |
| `update_cart` | Pre-build the replenishment cart |
| `get_cart` | Read back cart total to surface in notification |
| `checkout` | Final order placement (COD, ≤ ₹1000, not idempotent) |

---

## Key files and what they own

### `src/types.ts`
Single source of truth for all interfaces: `Order`, `OrderItem`, `Product`, `Address`, `ProductCadence`, `CartItem`, `Cart`, `CartSummary`, `UserPrefs`, `MCPToolCall`, `MCPToolResult`. Never duplicate these inline.

### `src/lib/consumptionModel.ts`
Exports two functions:
- `buildConsumptionModel(orders)` — groups order lines by SKU, computes inter-purchase gaps, returns `ProductCadence[]` with `avgDaysBetween`, `predictedRestockDate`, and `confidence`.
- `getRestockCandidates(cadences, today, lookaheadDays)` — filters to items due within the lookahead window (default 1 day).

Confidence tiers: `>= 4 orders → high`, `2–3 → medium`, `1 → low`.

### `src/lib/mcpClient.ts`
`MockMCPClient` — implements every tool with overloaded `callTool()` signatures. Backed by the sample data files. In production, replace the switch body with real MCP JSON-RPC calls to `https://mcp.swiggy.com/instamart`. Simulates ~80ms network latency per call.

### `src/lib/cartBuilder.ts`
Exports:
- `buildReplenishmentCart(client, candidates)` — resolves address, validates each candidate via `search_products`, calls `update_cart`, reads back via `get_cart`, checks ₹1000 cap.
- `confirmRestockOrder(client, addressId)` — calls `checkout` with `addressId` and `paymentMethod: "COD"`. **Not idempotent** — on 5xx, check `get_orders` for a recent order before retrying.

### `src/data/sampleOrders.ts`
74 orders crafted so that on 2026-05-06 exactly 5 items are due: Milk (every 5d), Bread (7d), Butter (14d), Eggs (10d), Parle-G (21d). Oil (30d) and Dettol (45d) are not due. Dettol's product is also set `inStock: false` in the catalog to demo the skip path.

---

## Real MCP parameter reference

The `callTool()` overload signatures already match the real Swiggy Instamart API (verified against `llms-full.txt`):

| Tool | Key parameter | Value |
|---|---|---|
| `your_go_to_items` | `addressId` | required |
| `search_products` | `addressId` + `query` | text search, not productId |
| `update_cart` | `selectedAddressId` | (not `addressId`) |
| `update_cart` items | `spinId` | variant-level ID (not productId) |
| `checkout` | `addressId` | required; `paymentMethod` optional |
| `get_orders` | — | returns last 15 days only (mock returns 74 orders) |

The full API spec is at `llms-full.txt` (gitignored; regenerate from `https://mcp.swiggy.com/builders/llms-full.txt`).

---

## Connecting to real Swiggy MCP

1. Apply for Builders Club access at [developers.swiggy.com](https://developers.swiggy.com)
2. Implement OAuth 2.1 + PKCE flow to obtain a session token (5-day TTL)
3. In `mcpClient.ts`, replace `MockMCPClient.callTool()` internals with:
   ```typescript
   const response = await fetch('https://mcp.swiggy.com/im', {
     method: 'POST',
     headers: { Authorization: `Bearer ${sessionToken}`, 'Content-Type': 'application/json' },
     body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/call', params: { name, arguments: args } }),
   });
   ```
4. Handle token expiry: catch 401 / JSON-RPC -32001, mark user as `needs_reauth`, notify via push.
5. `search_products` queries must be product name strings — resolve `productId → name` before calling.
6. `consumptionModel.ts` needs zero changes. `cartBuilder.ts` and `demo.ts` need zero changes.

---

## Critical constraints (never violate)

- `checkout` is **not idempotent**. On any 5xx, call `get_orders` and check for a recent order before retrying. Double-orders are real money.
- Cart total must be ≤ ₹1000 before calling `checkout` in v1. Sort candidates by priority and trim from the bottom if over cap.
- MCP session tokens expire after 5 days. The cron job must handle 401s gracefully per user — never fail all users because one token expired.
- Never auto-place an order without explicit user confirmation (notification tap). Cart pre-build is fine; silent checkout is not.

---

## Success metrics (beta cohort)

| Metric | Target |
|---|---|
| Cart confirm rate | > 40% |
| Cart accuracy (items kept) | > 75% |
| Time saved per week | > 10 min |
| Week-4 retention | > 70% |

---

## UI conventions (see design.md for full spec)

- **Design tokens:** All colours, spacing, and radius values live in CSS custom properties at the top of `ui/index.html`. Never hardcode hex values inline.
- **Conversation engine:** Agent messages always show a typing indicator (3-dot bounce) before appearing. Use the `agentSay(html, typingMs)` helper — never append a bubble directly.
- **Candidate removal:** Clicking ✕ triggers a CSS `removed` class (translateX + opacity), waits 300ms, then splices from `state.candidates` and re-renders. Never skip the animation.
- **MCP steps:** Always generated dynamically from `getMCPSteps()` so they reflect whichever candidates remain after user edits. Never hardcode step count.
- **Cart total:** Always computed live from `state.candidates` via `cartTotal()`. Never store as a separate variable.

## WhatsApp integration

**Flow:** Vercel Cron → `api/cron/daily-restock.ts` sends a WhatsApp message daily at 08:00 IST. User replies YES or NO. `api/whatsapp.ts` receives the Twilio webhook and responds accordingly.

**Key files:**
- `src/lib/whatsappClient.ts` — three helpers: `sendRestockPrompt`, `sendRestockLink`, `sendSkipConfirmation`
- `api/whatsapp.ts` — Twilio webhook; validates signature, routes YES → link, NO → skip
- `api/cron/daily-restock.ts` — Vercel Cron entry point
- `vercel.json` — cron schedule: `30 2 * * *` (02:30 UTC = 08:00 IST)

**Required env vars** (see `.env.example`):

| Variable | Description |
|---|---|
| `TWILIO_ACCOUNT_SID` | From Twilio Console |
| `TWILIO_AUTH_TOKEN` | From Twilio Console |
| `TWILIO_WHATSAPP_FROM` | Sandbox: `whatsapp:+14155238886` |
| `USER_WHATSAPP_NUMBER` | Recipient number with country code |
| `APP_BASE_URL` | Deployed app URL (used to build the cart link) |

**Sandbox setup:** Join the Twilio WhatsApp sandbox by sending `join <sandbox-keyword>` to the sandbox number. Set webhook URL in Twilio Console → Messaging → Sandbox Settings → `When a message comes in`: `https://your-app.vercel.app/api/whatsapp`.

**Twilio signature validation** is enforced in `api/whatsapp.ts` — requests without a valid `x-twilio-signature` header return 403.

---

## Tech stack

| Layer | Choice |
|---|---|
| Language | TypeScript 5.x (backend/CLI + Vercel functions) + Vanilla JS (UI) |
| Runtime | Node.js via `tsx` (demo) + Vercel serverless (API) |
| UI | Single-file HTML — no framework, no build step, open directly in browser |
| Design | Swiggy brand colours (see design.md), Inter font via Google Fonts |
| Scheduler | Vercel Cron (daily 08:00 IST) |
| Notifications | Twilio WhatsApp API (YES/NO prompt → cart link) |
| Database | Supabase (product_cadences, user_prefs, restock_events) |
| MCP transport | JSON-RPC 2.0 over HTTPS |
| Auth | OAuth 2.1 + PKCE |
