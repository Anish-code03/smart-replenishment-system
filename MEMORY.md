# MEMORY.md — Smart Replenishment Agent

Project memory for continuity across sessions. ≤200 lines. Update, don't append.

---

## What we built

A grocery auto-restock agent for Swiggy Instamart (Builders Club hackathon). It reads a
user's order history, learns how often they buy each product, predicts runout dates, and
either (a) runs a terminal demo showing the full 5-phase pipeline, or (b) opens a
conversational web UI where the user can review and edit their restock cart before confirming.

---

## Current state (as of 2026-05-06)

### Terminal demo (`npm run demo`)
- Fully functional, 5-phase ANSI terminal output
- All phases work: consumption model → candidates → MCP chain → notification → checkout
- MockMCPClient simulates all 7 MCP tools locally (no real API)
- 74 orders across 7 SKUs crafted to make 5 items due on 2026-05-06

### Web UI (`ui/index.html` — open in browser)
- Conversational agent interface with Swiggy branding (design.md colours)
- Phase 1: Greeting + full consumption model table (all 7 items, status-coded)
- Phase 2: 5 restock candidate cards with live ✕ remove buttons — user can edit cart
- Live cart total bar updates on every removal
- Phase 3: "Build Cart →" triggers animated MCP tool chain (steps keyed to remaining items)
- Phase 4: Swiggy-styled push notification card with Confirm / Edit / Skip
- Phase 5: Success receipt with order ID and itemised total
- No build step — just double-click the file

### GitHub
- Public repo: https://github.com/Anish-code03/smart-replenishment-system
- All files committed and pushed

---

## Key decisions

**Conversational UI approach (not sequential dump)**
User wanted editable flow — show all items, let them cross out what they still have,
then build the cart from what remains. MCP steps dynamically generated from the final
candidate list so they're always accurate.

**Single-file HTML for UI**
No React, no build step. `ui/index.html` opens directly in any browser. All state in a
plain JS object. Chosen for demo simplicity — easy to share, no setup friction.

**`agentSay()` + typing indicator pattern**
Every agent message shows a 3-dot bounce animation before appearing. Enforced through
the `agentSay(html, typingMs)` helper — never bypass it with direct DOM appends.

**MCP steps generated dynamically**
`getMCPSteps()` builds the step list from `state.candidates` at call time. If the user
removes 2 items before clicking Build Cart, only 3 search_products calls show — not 5.

**Removal animation before splice**
✕ click adds `removed` CSS class (translateX + fade), waits 300ms, THEN splices from
state and re-renders. Removing before animation completes causes layout jump — don't.

**MockMCPClient: swap internals only**
The TypeScript mock and the JS UI both follow the same tool call sequence. To connect
real Swiggy MCP, replace MockMCPClient internals (or the JS fetch calls) with real
JSON-RPC. consumptionModel.ts and cartBuilder.ts need zero changes.

**checkout is NOT idempotent**
On any 5xx, always check get_orders for a recent order (within 2 min) before retrying.
Documented in CLAUDE.md, code comments, and this file. Never retry blindly.

---

## Files that matter most

| File | What it owns |
|---|---|
| `ui/index.html` | Conversational UI — all state, flow, and rendering |
| `design.md` | Swiggy design tokens — colours, typography, components |
| `src/types.ts` | Every shared interface — single source of truth |
| `src/lib/consumptionModel.ts` | Frequency inference + candidate selection |
| `src/lib/mcpClient.ts` | Mock MCP — swap internals for real API |
| `src/lib/cartBuilder.ts` | Cart pre-build + checkout (idempotency critical) |
| `src/data/sampleOrders.ts` | 74 orders, dates engineered for 2026-05-06 demo |
| `src/demo.ts` | Terminal entry point, ANSI output |

---

## Swiggy design tokens (quick ref)

| Token | Value | Usage |
|---|---|---|
| `--orange` | `#FC8019` | Primary brand, CTAs |
| `--dark` | `#282C3F` | Header, titles |
| `--green` | `#60B246` | Success, confirmed |
| `--red` | `#DB3236` | Error, overdue, out-of-stock |
| `--text-primary` | `#3D4152` | Body text |
| `--text-secondary` | `#686B78` | Captions, meta |
| `--bg` | `#F2F2F2` | Page background |

Full spec in design.md.

---

## What's next (to make it real)

1. Swiggy Builders Club MCP access (OAuth 2.1 + PKCE)
2. Replace MockMCPClient internals with real JSON-RPC calls
3. Vercel Cron (`api/cron/daily-restock.ts`) at 08:00 IST daily
4. FCM / Expo Push for real phone notifications
5. Supabase: `product_cadences`, `user_prefs`, `restock_events` tables
6. Feedback loop: every ✕ remove or skip → update model weights per SKU

---

## Collaboration notes

- User: Anish Majumdar (majumdaranish03@gmail.com) · GitHub: Anish-code03
- Project is a Swiggy Builders Club hackathon submission
- User prefers short, direct responses — no trailing summaries
- UI approach: conversational (agent speaks first, user edits, then confirms)
- No comments on obvious code; comments only for non-obvious constraints
- No external dependencies in the UI — vanilla JS + CSS only
