# Plan: Premium Hero Slider Redesign

## Context
User wants a full premium redesign of HeroSlider with 2-column fintech layout (Stripe/Midtrans/Xendit level).
Current slider: simple gradient + CMS text overlay.
Goal: Add rich inline SVG illustrations for each theme, glassmorphism cards, particles, animations — without breaking any existing system.

## Files to Change

1. **`src/index.css`** — add keyframe animations
2. **`src/components/home/HeroSlider.tsx`** — complete rewrite (2-col layout + SVG visuals per theme)
3. **`src/lib/store.ts`** — add `bannerLink: ''` to all D_BANNERS defaults (TypeScript compatibility)

BannerManager.tsx already has all required admin features — no changes needed there.

---

## Strategy

### Behavior rules (unchanged)
- Banner with `imageDataUrl` → fullscreen image, hide all CMS text, whole-banner clickable
- Banner without image → 2-column premium design (NEW)
- Autoplay 5s, prev/next, dots, swipe — unchanged

### 2-Column layout (no image)
```
┌──────────────────────────────────┐
│  Left 50%       │  Right 50%     │
│  Badge          │  SVG Visual    │
│  Title          │  (theme-based) │
│  Subtitle       │                │
│  CTA Buttons    │                │
└──────────────────────────────────┘
Mobile: stacks vertically, visual hidden on xs
```

### Slide Themes & Visuals

**Slide 1 — pulsa (green):**
- Gradient: `from-emerald-950 via-green-900 to-teal-950`
- Visual: Phone mockup (SVG rect + rounded corners) + floating e-wallet icons (GoPay/DANA/OVO/ShopeePay as colored circles with letter) + glass "Transaksi Berhasil" card + floating green particles

**Slide 2 — game (purple):**
- Gradient: `from-purple-950 via-violet-900 to-indigo-950`
- Visual: Gaming controller SVG + floating Diamond/Coin icons + ML/FF/PUBG glass cards + neon glow ring + sparkle particles

**Slide 3 — pln (orange/amber):**
- Gradient: `from-orange-950 via-amber-900 to-yellow-950`
- Visual: Payment dashboard card (SVG) + floating utility icons (⚡PLN, 💧PDAM, WiFi, Shield/BPJS) + transaction list decoration

**Slide 4 — all (blue-green):**
- Gradient: `from-slate-950 via-teal-950 to-emerald-950`
- Visual: Bar chart + line chart SVG + floating badges ("Komisi", "+30%") + network dots decoration

---

## Animation Keyframes (index.css)

```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
}
@keyframes float-x {
  0%, 100% { transform: translateX(0px) translateY(0px); }
  33% { transform: translateX(-8px) translateY(-6px); }
  66% { transform: translateX(8px) translateY(-10px); }
}
@keyframes pulse-glow {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}
@keyframes particle-drift {
  0% { transform: translateY(0) translateX(0); opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translateY(-80px) translateX(20px); opacity: 0; }
}
@keyframes slide-left {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes slide-right {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}
```

Tailwind utility classes to apply:
- `.animate-float` → `animation: float 3s ease-in-out infinite`
- `.animate-float-slow` → `animation: float 4.5s ease-in-out infinite`
- `.animate-float-x` → `animation: float-x 5s ease-in-out infinite`
- `.animate-pulse-glow` → `animation: pulse-glow 2.5s ease-in-out infinite`
- `.animate-slide-left` → `animation: slide-left 0.5s ease-out forwards`
- `.animate-slide-right` → `animation: slide-right 0.5s ease-out forwards`

---

## Component Architecture

```
HeroSlider
 ├── SlideContent (per banner)
 │    ├── [hasImage] → fullscreen img + clickable overlay (unchanged)
 │    └── [no image] → 2-col layout
 │         ├── LeftCol: Badge + H1 + Subtitle + CTAs (animated slide-left)
 │         └── RightCol: <ThemeVisual theme={banner.theme} /> (animated slide-right)
 │
 └── ThemeVisual (new component, same file)
      ├── PulsaVisual (pulsa)
      ├── GameVisual (game)
      ├── PlnVisual (pln)
      └── AllVisual (all)
```

All SVG visuals are inline TSX — zero external dependencies, lightweight.

### Glass Card component (reused across visuals):
```tsx
function GlassCard({ children, className }) {
  return (
    <div className={cn("backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-lg", className)}>
      {children}
    </div>
  );
}
```

### Particle component (scattered dots):
```tsx
function Particles({ color = 'bg-white', count = 8 }) {
  // Hardcoded positions array (no random — SSR safe, no rerenders)
  // Each particle: absolute positioned, different animation delays
}
```

---

## THEME_CONFIG update

Current THEME_CONFIG only has gradient/badge/btnClass. 
New version adds `bg` (full gradient string for `className`):

```typescript
const THEME_CONFIG = {
  pulsa:  { bg: 'from-emerald-950 via-green-900 to-teal-950', badge: '...', btnClass: '...', particleColor: 'bg-emerald-400' },
  game:   { bg: 'from-purple-950 via-violet-900 to-indigo-950', badge: '...', btnClass: '...', particleColor: 'bg-purple-400' },
  pln:    { bg: 'from-orange-950 via-amber-900 to-yellow-950', badge: '...', btnClass: '...', particleColor: 'bg-amber-400' },
  all:    { bg: 'from-slate-950 via-teal-950 to-emerald-950', badge: '...', btnClass: '...', particleColor: 'bg-teal-400' },
};
```

---

## store.ts change

D_BANNERS: add `bannerLink: ''` to all 4 default banner objects so TypeScript is happy.

Also update D_BANNERS to match better with new 4-slide plan:
- Slide 1: theme `pulsa` — Pulsa & E-Wallet
- Slide 2: theme `game` — Top Up Game
- Slide 3: theme `pln` — PPOB (orange)
- Slide 4: theme `all` — Reseller / All Services

---

## Verification

After implementing:
1. Build passes with 0 lint errors
2. 4 default slides render with 2-column layout
3. Banners with uploaded images still show fullscreen + clickable
4. Admin BannerManager: add/edit/delete/reorder all still work
5. Autoplay, prev/next buttons, swipe, dots all functional
6. No changes to any backend/API/payment/database code
