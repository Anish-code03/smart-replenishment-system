# Design System — Smart Replenishment Agent

Based on Swiggy's official brand design language. All UI components in this project follow these tokens.

---

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--orange` | `#FC8019` | Primary brand, CTAs, highlights |
| `--orange-dark` | `#E8710A` | Hover states on orange |
| `--orange-light` | `#FFF3E8` | Orange tint backgrounds, chips |
| `--dark` | `#282C3F` | Header, dark surfaces, titles |
| `--green` | `#60B246` | Success states, confirmed orders, in-stock |
| `--green-light` | `#EBF5E6` | Success tint backgrounds |
| `--red` | `#DB3236` | Error states, out-of-stock, overdue |
| `--red-light` | `#FDECEA` | Error tint backgrounds |
| `--text-primary` | `#3D4152` | Body text, labels |
| `--text-secondary` | `#686B78` | Captions, meta, muted text |
| `--border` | `#D4D5D9` | Dividers, card outlines |
| `--bg` | `#F2F2F2` | Page background, row alternates |
| `--white` | `#FFFFFF` | Cards, bubbles, surfaces |
| `--shadow` | `rgba(40,44,63,0.10)` | Card drop shadows |

---

## Typography

**Font:** Inter (Google Fonts) — Swiggy uses their proprietary "Okra"; Inter is the closest open match.

| Role | Size | Weight |
|---|---|---|
| App title | 16px | 600 |
| Section label | 11px, uppercase, 0.1em tracking | 600 |
| Body / bubble text | 14px | 400 |
| Card title | 15px | 600 |
| Caption / meta | 12px | 400 |
| Monospace (tool names) | 11px | 400 — `SF Mono`, `Fira Code`, monospace |
| Cart total | 18–20px | 700 |

---

## Spacing & Radius

| Token | Value |
|---|---|
| Base radius | `12px` |
| Button radius | `8px` |
| Chip radius | `20px` (pill) |
| Base padding (card) | `16px` |
| Conversation left indent | `46px` (avatar width + gap) |

---

## Components

### Agent Message Bubble
- White card, `border-radius: 0 12px 12px 12px` (top-left square = coming from avatar)
- Box shadow: `0 1px 4px var(--shadow)`
- Avatar: 36×36px circle, `#FC8019`, emoji center
- Animate in with `fadeSlideIn` (translateY 10px → 0, opacity 0 → 1, 0.3s)

### Typing Indicator
- Same structure as bubble, contains 3 animated dots
- Dots animate vertically with stagger (0.2s delay each)
- Replaces content once agent response is ready

### Consumption Model Table
- Dark header row (`#282C3F`) with uppercase column labels
- Alternating row backgrounds: white / `--bg`
- Status badges: pill-shaped, background tint matching status color
- Confidence badges: `high` green, `medium` orange, `low` red

### Restock Candidate Card
- White card with left border accent: `3px solid var(--orange)` (overdue: `--red`)
- Layout: emoji | name + meta | price | ✕ button
- Remove button: 28×28px circle, hover state `--red-light`
- Remove animation: `translateX(100%)` + `opacity: 0` over 280ms, then splice from DOM

### Cart Total Bar
- `--orange-light` background, 1px orange-tinted border
- Shows live total that updates on each removal

### MCP Chain Progress
- White card, `border-radius: 12px`
- Each step: icon + monospace tool tag + label
- States: pending (⏳ grey) → active (⟳ orange) → done (✓ green)

### Push Notification Card
- Dark header (`#282C3F`) mimicking a phone notification
- Swiggy orange icon, app name, timestamp
- Body: title, subtitle, item chips, total, 3 action buttons
- Confirm button: full orange; Edit/Skip: ghost outline

### Success Card
- Centered layout, trophy/party emoji
- Order ID in monospace chip
- Itemized receipt rows + total row
- Subtle divider, delivery address footer

---

## Interaction States

| Element | Default | Hover | Active |
|---|---|---|---|
| Primary button | `#FC8019` | `#E8710A`, `translateY(-1px)` | `translateY(0)` |
| Secondary button | transparent, `--border` | orange border + text | — |
| Candidate remove (✕) | `--bg`, grey | `--red-light`, red | — |
| Model table row | white / `--bg` | `--bg` | — |

---

## Animation

```css
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30%           { transform: translateY(-6px); opacity: 1; }
}
```

- All new elements use `fadeSlideIn` at `0.3s ease`
- Typing dots use staggered `typing` keyframes
- Action bar uses `transform: translateY(100%)` for slide-up/down

---

## Responsive

| Breakpoint | Behaviour |
|---|---|
| `≤ 600px` | Consumption model hides Cadence + History columns; cards stack full-width |
| All | Chat area max-width `720px`, centered |
| All | Action bar always full-width, fixed bottom |
