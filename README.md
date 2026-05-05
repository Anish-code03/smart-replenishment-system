# Smart Replenishment Agent 🛒

> A Swiggy Builders Club submission — Instamart MCP v1

---

## What is this?

Every week, millions of people open Swiggy Instamart and manually search for the same things — milk, bread, eggs, oil — the same items they bought last week, and the week before that.

This project automates that. It watches your order history, figures out how often you buy each thing, and on the day you're likely to run out, it sends you a notification with your cart already built. You just tap **Confirm** and the order is placed.

No searching. No adding items one by one. One tap.

---

## How it works (simple version)

```
Your past orders  →  "You buy milk every 5 days"
                  →  "Last bought: May 1st"
                  →  "Predicted runout: May 6th"  ← today
                  →  Cart pre-built: 2× Milk, 1× Bread, 1× Eggs...
                  →  Notification sent: "Your restock is ready — ₹267. Confirm?"
                  →  You tap Confirm → Order placed
```

The smarter part: it gets better over time. If you skip eggs one week ("still have some"), it adjusts. If you edit the quantity, it remembers. Each cycle makes the next prediction more accurate.

---

## Quick start

```bash
# 1. Clone the repo
git clone https://github.com/anishmajumdar03/smart-replenishment-system.git
cd smart-replenishment-system

# 2. Install dependencies
npm install

# 3. Run the demo
npm run demo
```

That's it. The demo runs entirely on sample data — no API keys, no Swiggy account needed.

---

## What you'll see when you run it

The demo simulates a user named Anish who has been ordering groceries on Instamart for 4 months. It plays out in 5 phases:

**Phase 1 — Consumption Model**
Reads 74 past orders and builds a frequency table:
```
Amul Toned Milk      → every 5 days    → due TODAY   [HIGH confidence]
Modern Wheat Bread   → every 7 days    → due TODAY   [HIGH confidence]
Amul Butter          → every 14 days   → due TODAY   [HIGH confidence]
Farm Fresh Eggs      → every 10 days   → overdue     [HIGH confidence]
Fortune Sunflower Oil→ every 34 days   → in 18 days  (skip)
Dettol Handwash      → every 38 days   → in 3 days   (skip)
```

**Phase 2 — Candidate Selection**
Picks the 5 items that are due today or overdue.

**Phase 3 — MCP Tool Chain**
Calls the Swiggy Instamart MCP tools in sequence:
- Looks up your saved home address
- Checks each item is in stock and gets the current price
- Pre-builds your cart
- Reads the cart total back

**Phase 4 — Push Notification**
Shows what the phone notification would look like:
```
┌─────────────────────────────────────────┐
│  Swiggy Instamart                       │
│  🛒 Your weekly restock is ready!      │
│  5 items · ₹267                         │
│  [ Confirm & Order ]  [ Edit ]  [ Skip ]│
└─────────────────────────────────────────┘
```

**Phase 5 — Checkout**
Simulates you tapping Confirm. Order placed. Done.

---

## Project structure

```
├── src/
│   ├── types.ts                  All data structures
│   ├── data/
│   │   ├── sampleOrders.ts       74 mock orders (4 months of history)
│   │   └── sampleProducts.ts     7 products + saved delivery addresses
│   └── lib/
│       ├── consumptionModel.ts   Figures out "how often do I buy this?"
│       ├── mcpClient.ts          Talks to Swiggy's MCP tools (mocked here)
│       ├── cartBuilder.ts        Builds and confirms the cart
│       └── demo.ts               Runs the whole thing end-to-end
├── CLAUDE.md                     Technical docs (architecture, tool list, constraints)
├── MEMORY.md                     Project memory for continuity
├── replenishment_plan.md         Full build plan
└── replenishment_plan.html       Original design document
```

---

## The Swiggy MCP tools it uses

This agent is built entirely on top of tools that Swiggy's MCP server already exposes:

| Tool | What it does here |
|---|---|
| `get_orders` | Reads your full Instamart order history |
| `your_go_to_items` | Seeds the model for new users with no history |
| `get_addresses` | Finds your saved Home address |
| `search_products` | Checks if each item is in stock right now |
| `update_cart` | Builds the predicted restock cart |
| `get_cart` | Reads the cart total to show in the notification |
| `checkout` | Places the order once you confirm |

The only custom logic is the **consumption model** — the part that infers "you buy milk every 5 days." Everything else is pure MCP.

---

## This demo vs the real thing

| What | This demo | Real version |
|---|---|---|
| Order data | 74 hand-crafted sample orders | Live from `get_orders` via Swiggy MCP |
| MCP calls | Local mock (no network) | Real JSON-RPC to Swiggy's MCP server |
| Push notifications | Printed to terminal | FCM / Expo Push to your phone |
| Scheduler | Run manually | Vercel Cron at 08:00 IST daily |
| Database | In-memory | Supabase (product cadences, user prefs) |
| Auth | None needed | OAuth 2.1 + PKCE (Swiggy Builders Club) |

To connect to the real Swiggy MCP, the only file you'd change is `src/lib/mcpClient.ts`. Everything else stays the same.

---

## Roadmap

- [x] Consumption model (frequency inference)
- [x] Mock MCP client with all 7 tools
- [x] Cart builder with ₹1000 cap check
- [x] End-to-end demo with sample data
- [ ] OAuth 2.1 + PKCE flow (Swiggy Builders Club access)
- [ ] Real MCP integration
- [ ] Vercel Cron job
- [ ] FCM push notifications
- [ ] Supabase schema + persistence
- [ ] Feedback loop (skip/edit → model weight updates)
- [ ] "Still have X?" nudge for repeat skips

---

## Tech used

- **TypeScript** — typed throughout
- **tsx** — runs `.ts` files directly, no build step
- **Supabase** (planned) — database for cadence models and user prefs
- **Vercel Cron** (planned) — daily scheduler
- **Swiggy Instamart MCP** — the tool layer this agent is built on

---

## Idea scorecard

| | |
|---|---|
| User pain | 9/10 — people reorder the same groceries every week manually |
| MCP fit | 8/10 — every needed tool already exists |
| Time to MVP | 4 weeks |
| Monetisation | Subscription, Swiggy partnership, upsell surface |
| Verdict | **Build. Ship. Now.** |

---

Built for the **Swiggy Builders Club · Instamart MCP v1** hackathon.
