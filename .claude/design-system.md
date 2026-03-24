# Planner Hub — Design System

RTL-first Arabic SaaS. Target languages: Arabic (current), Hebrew, English (future).
Font stack: Tajawal (Arabic), Heebo (Hebrew), system sans-serif (English).

---

## Color Tokens

All values shown as hex for readability. CSS uses HSL via `hsl(var(--token))`.

### Light Theme (`:root`)

| Token                    | Hex       | HSL (approx)       | Usage                              |
|--------------------------|-----------|--------------------|------------------------------------|
| `--primary`              | `#95df1e` | `84 76% 50%`       | CTAs, active states, brand accent  |
| `--primary-foreground`   | `#000000` | `0 0% 0%`          | Text on primary background         |
| `--background`           | `#fafbfa` | `100 5% 98%`       | Page canvas (off-white, not harsh) |
| `--foreground`           | `#333333` | `0 0% 20%`         | Body text                          |
| `--card`                 | `#ffffff` | `0 0% 100%`        | Card surface                       |
| `--card-foreground`      | `#333333` | `0 0% 20%`         | Card text                          |
| `--popover`              | `#ffffff` | `0 0% 100%`        | Popover/dropdown surface           |
| `--popover-foreground`   | `#333333` | `0 0% 20%`         | Popover text                       |
| `--secondary`            | `#f3f4f6` | `220 14% 96%`      | Secondary surfaces, chip bg        |
| `--secondary-foreground` | `#4e583f` | `87 17% 30%`       | Text on secondary                  |
| `--muted`                | `#f9fafb` | `210 20% 98%`      | Subtle backgrounds                 |
| `--muted-foreground`     | `#6b7280` | `220 9% 46%`       | Placeholders, helper text          |
| `--accent`               | `#eaffcf` | `84 100% 90%`      | Soft highlight (e.g. accent-shell) |
| `--accent-foreground`    | `#000000` | `0 0% 0%`          | Text on accent                     |
| `--destructive`          | `#ef4444` | `0 84% 60%`        | Error, delete actions              |
| `--destructive-foreground`| `#ffffff`| `0 0% 100%`        | Text on destructive                |
| `--border`               | `#e5e7eb` | `220 13% 91%`      | Card, input, divider borders       |
| `--input`                | `#e5e7eb` | `220 13% 91%`      | Input borders                      |
| `--ring`                 | `#95df1e` | `84 76% 50%`       | Focus ring                         |

### Dark Theme (`.dark`)

| Token                    | Hex       | HSL (approx)       | Usage                              |
|--------------------------|-----------|--------------------|------------------------------------|
| `--primary`              | `#95df1e` | `84 76% 50%`       | Same lime — consistent brand       |
| `--primary-foreground`   | `#000000` | `0 0% 0%`          | Black text on lime                 |
| `--background`           | `#171717` | `0 0% 9%`          | Page canvas                        |
| `--foreground`           | `#e5e5e5` | `0 0% 90%`         | Body text                          |
| `--card`                 | `#262626` | `0 0% 15%`         | Card surface                       |
| `--card-foreground`      | `#e5e5e5` | `0 0% 90%`         | Card text                          |
| `--secondary`            | `#262626` | `0 0% 15%`         | Secondary surfaces                 |
| `--secondary-foreground` | `#e5e5e5` | `0 0% 90%`         | Text on secondary                  |
| `--muted`                | `#262626` | `0 0% 15%`         | Subtle backgrounds                 |
| `--muted-foreground`     | `#a3a3a3` | `0 0% 64%`         | Placeholders, helper text          |
| `--border`               | `#404040` | `0 0% 25%`         | Card, input, divider borders       |
| `--input`                | `#404040` | `0 0% 25%`         | Input borders                      |
| `--ring`                 | `#9ddf36` | `83 72% 55%`       | Focus ring (slightly brighter)     |
| `--destructive`          | `#ef4444` | `0 84% 60%`        | Same red                           |

### Chart Palette (Dark)

| Token       | Hex       | Notes                    |
|-------------|-----------|--------------------------|
| `--chart-1` | `#6da01b` | Deep lime                |
| `--chart-2` | `#a3f02b` | Bright lime              |
| `--chart-3` | `#69991d` | Muted lime               |
| `--chart-4` | `#68a505` | Olive lime               |
| `--chart-5` | `#cef789` | Pale lime highlight      |

### Sidebar (Dark)

| Token                         | Hex       |
|-------------------------------|-----------|
| `--sidebar`                   | `#171717` |
| `--sidebar-foreground`        | `#e5e5e5` |
| `--sidebar-primary`           | `#95df1e` |
| `--sidebar-primary-foreground`| `#000000` |
| `--sidebar-accent`            | `#95df1e` |
| `--sidebar-accent-foreground` | `#000000` |
| `--sidebar-border`            | `#404040` |
| `--sidebar-ring`              | `#95df1e` |

---

## Shape & Elevation

| Property      | Value          | Notes                                     |
|---------------|----------------|-------------------------------------------|
| `--radius`    | `0.375rem`     | Base radius. Components scale off this.   |
| Shadow color  | `#0000000d`    | `rgba(0,0,0,0.05)` — very subtle          |
| Shadow        | `1px 1px 2px 1px rgba(0,0,0,0.05)` | Flat, not elevated |
| Card accents  | `radial-gradient` at top-right | Light: 6–8% opacity. Dark: 14–18%. |

**Radius scale used in components:**

```
rounded-xl           → calc(var(--radius) + 0.375rem)  ≈ 0.75rem
rounded-2xl          → calc(var(--radius) + 0.75rem)   ≈ 1.125rem
rounded-3xl (cards)  → calc(var(--radius) + 0.85rem)   ≈ 1.225rem
```

---

## Surface Hierarchy

Components use layered CSS variables for backgrounds, applied via utility classes:

| Class            | Light bg                             | Dark bg                                   | Use for              |
|------------------|--------------------------------------|-------------------------------------------|----------------------|
| `app-shell`      | Off-white canvas gradient            | `#171717` canvas                          | Page root            |
| `surface-shell`  | White + 2.5% lime glow               | Dark card + 14% lime glow                 | Primary cards        |
| `surface-subtle` | Soft gray muted                      | Dark muted                                | Secondary/inner areas|
| `accent-shell`   | Light lime (`#eaffcf` tinted)        | Lime tint                                 | Highlighted sections |

---

## Icon Chips

```
.icon-chip (light): bg-primary (#95df1e), text-black — full lime fill
.icon-chip (dark):  bg-background/80, text-primary — transparent bg, lime icon
```

Per-module color overrides via additional Tailwind classes:
- **Planner**: `bg-primary/[0.12] text-primary` (lime tint)
- **Budget**: `bg-emerald-500/[0.12] text-emerald-600` (green tint)
- **Meals**: `bg-pink-500/[0.12] text-pink-600` (pink tint)
- **Habits**: `bg-orange-500/[0.12] text-orange-600`
- **Life**: `bg-rose-500/[0.12] text-rose-600`
- **Monthly**: `bg-sky-500/[0.12] text-sky-600`
- **Goals**: `bg-violet-500/[0.12] text-violet-600`
- **Tasks**: `bg-cyan-500/[0.12] text-cyan-600`
- **Travel**: `bg-amber-500/[0.12] text-amber-700`

---

## Typography

| Role          | Weight  | Size (mobile → desktop) | Class                        |
|---------------|---------|--------------------------|------------------------------|
| Page title    | 800     | `text-4xl` → `text-5xl` | `font-extrabold tracking-tight` |
| Section title | 700–800 | `text-xl` → `text-2xl`  | `font-extrabold`             |
| Card title    | 700     | `text-xl` → `text-2xl`  | `CardTitle`                  |
| Body          | 400     | `text-base`              | `leading-8`                  |
| Caption/note  | 600     | `text-xs`                | `text-muted-foreground`      |
| Metric value  | 900     | `text-2xl`               | `font-black`                 |

Font families:
- **Arabic**: `Tajawal` (weights: 300 400 500 700 800)
- **Hebrew**: `Heebo` (weights: 300 400 500 600 700 800)
- **English** (future): system sans-serif fallback

---

## RTL Layout Rules

This app is **RTL-first**. All layout decisions assume `dir="rtl"`.

### Flexbox in RTL (`dir="rtl"`)

| DOM order  | Visual position (RTL) |
|------------|-----------------------|
| First child  | Visual RIGHT (reading start) |
| Last child   | Visual LEFT (reading end)    |

### Navbar pattern
```
DOM: [Brand (logo + name)] [Actions (theme + logout)]
Visual (RTL): Brand → RIGHT | Actions → LEFT
```

### Hero buttons
```
justify-start = visual RIGHT in RTL ✓ (content aligns to reading start)
justify-end   = visual LEFT in RTL ✗ (pushes content away from text)
```

### Text alignment
- All primary text: `text-right`
- Numbers/amounts: use `direction: ltr; unicode-bidi: bidi-override` via `.rtl-number`

### Utility classes for RTL layout
| Class             | Behavior                              |
|-------------------|---------------------------------------|
| `rtl-title-row`   | `flex items-start gap-3 text-right`   |
| `rtl-title-stack` | `text-right` block                    |
| `rtl-meta-row`    | `flex items-center gap-3 text-right`  |
| `rtl-actions-inline` | `inline-flex items-center gap-2`   |

---

## Component Patterns

### Module Card (Active)
- `surface-shell` base
- Radial gradient accent at top-right: **light 7%, dark 15–17%**
- Badge "جاهز الآن" in module accent color
- 2-column stat grid inside
- Dashed CTA row at bottom with arrow chip

### Metric Card
- `surface-shell` base
- Icon chip (12×12 = h-12 w-12) on the left in RTL
- Label → value (font-black text-2xl) → note stack on right

### Upcoming Module Card
- `surface-subtle` base with `border-dashed`
- "قريبًا" secondary badge
- No hover navigation (not clickable yet)

### Navbar
- `sticky top-0 z-50`
- `bg-background/90 backdrop-blur-md`
- `border-b border-border/50`
- Brand: logo icon + app name (both on visual right)
- Actions: ThemeToggle + ghost logout button (visual left)

---

## Do / Don't

| Do                                              | Don't                                              |
|-------------------------------------------------|----------------------------------------------------|
| Use `justify-start` for RTL-aligned flex rows   | Use `justify-end` to "align right" in RTL          |
| Put brand first in navbar DOM for RTL           | Put actions first (they'll appear on the right)    |
| Use `ghost` variant for nav-level logout        | Use `destructive` variant in top nav (too alarming)|
| Use `app-shell` on page root                    | Add custom `min-h-screen` + gradient manually      |
| Split light/dark accent opacity with `dark:`    | Apply dark-mode accent opacity to both themes      |
| Keep `--surface-glow` subtle in light (≤3%)     | Let lime glow wash over all cards in light mode    |
| Use `Tajawal` for Arabic text                   | Use default Latin fonts for Arabic                 |
