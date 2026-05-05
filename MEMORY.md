# MEMORY.md — Smart Replenishment Agent

Project memory for continuity across sessions. ≤200 lines. Update, don't append.

---

## What we built

A grocery auto-restock agent for Swiggy Instamart. It reads a user's order history,
learns how often they buy each product, predicts when they'll run out, pre-builds a
cart, and sends a push notification for one-tap confirmation. Built for the Swiggy
Builders Club hackathon using Instamart's MCP server tools.

---

## Current state (as of 2026-05-06)

- Demo is fully functional with sample data (`npm run demo`)
- All 5 phases work: model → candidates → MCP chain → notification → checkout
- MockMCPClient simulates all 7 MCP tools locally (no real API calls)
- Sample data has 74 orders across 7 SKUs crafted for 2026-05-06 demo date
- 5 items come up as due: Milk, Bread, Butter, Eggs, Parle-G → total ₹267
- Oil and Dettol intentionally NOT due; Dettol also set out-of-stock to demo skip
- GitHub repo created and pushed (public)

---

## Key decisions made

**Why TypeScript + tsx?**
Zero compile step for demo purposes. `npx tsx src/demo.ts` just works.

**Why MockMCPClient instead of a real HTTP stub?**
Keeps the demo self-contained (no API keys, no network). The interface is identical
to what a real MCP client would expose — swap the internals, nothing else changes.

**Why flat one-item-per-order structure in sample data?**
Easier to reason about cadence inference. Real Instamart orders bundle multiple items;
the parser handles both via `flatMap(o => o.items)`.

**Why ₹1000 cart cap?**
Instamart MCP v1 imposes this limit. The cart builder checks and warns; trimming
logic (sort by priority, drop from bottom) is stubbed for v1.

**checkout is NOT idempotent.**
This is the highest-severity constraint. On any 5xx, always check `get_orders` for
a recent order (within 2 min) before retrying. Documented in CLAUDE.md and in code.

---

## Files that matter most

| File | What it owns |
|---|---|
| `src/types.ts` | Every shared interface — single source of truth |
| `src/lib/consumptionModel.ts` | Frequency inference, candidate selection |
| `src/lib/mcpClient.ts` | Mock MCP — swap internals for real API |
| `src/lib/cartBuilder.ts` | Cart pre-build + checkout (idempotency warning here) |
| `src/data/sampleOrders.ts` | 74 orders, dates engineered for 2026-05-06 demo |
| `src/demo.ts` | Entry point, ANSI terminal output, 5-phase flow |

---

## What's next (to make it real)

1. Apply for Swiggy Builders Club MCP access
2. Implement OAuth 2.1 + PKCE flow → store session tokens in Supabase
3. Replace MockMCPClient internals with real JSON-RPC calls to Swiggy's endpoint
4. Set up Vercel Cron (`api/cron/daily-restock.ts`) for 08:00 IST daily
5. Integrate FCM / Expo Push for real notifications
6. Build feedback loop: every skip/edit → update `product_cadences` weights
7. Add "Still have X?" prompt for items skipped 2+ weeks in a row
8. Supabase schema: `product_cadences`, `user_prefs`, `restock_events`

---

## Risks to keep in mind

- **Checkout idempotency** — never retry `checkout` without checking `get_orders` first
- **Token expiry (5-day TTL)** — handle 401 per user, notify to re-auth
- **Cold start** — new users: seed from `your_go_to_items`, default 7-day cadence
- **User trust** — always require explicit confirmation; never silent auto-order

---

## Collaboration notes

- User: Anish Majumdar (majumdaranish03@gmail.com)
- Project is a Swiggy Builders Club submission
- Keep code minimal — no premature abstractions, no comments on obvious things
- Terminal output style: ANSI colours via raw escape codes (no chalk dependency)
- Responses should be short and direct
