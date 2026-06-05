# SHIELACOM CELL - PPOB & Digital Top-Up Website

## Context
Building a complete professional PPOB and digital top-up website for "SHIELACOM CELL" brand. The site features a green (#16a34a) / white / dark (#111827) color scheme with a modern, premium, mobile-first design.

## Design System Changes

### index.css
- Primary: HSL 142 71% 45% (green #16a34a)
- Dark surface: HSL 222 47% 11% (#111827)
- Add gradient tokens, glow effects, neon green shadows
- Add wave/curve divider CSS utilities
- Add keyframe animations: fade-in, slide-up, counter, pulse-glow, ripple

### tailwind.config.ts
- Map brand-green, brand-dark tokens
- Add custom animations: float, pulse-glow, shimmer, slide-up, fade-in
- Add custom box-shadow utilities

## File Architecture

### Router (src/router.tsx)
Add routes:
- `/` → Home
- `/products` → Products
- `/cara-transaksi` → Cara Transaksi
- `/faq` → FAQ
- `/cek-transaksi` → Cek Transaksi
- `/reseller` → Reseller
- `/kontak` → Kontak
- `/admin` → Admin Login
- `/admin/dashboard` → Admin Dashboard (protected)

### Pages
- `src/pages/Index.tsx` — Home (assembles all sections)
- `src/pages/Products.tsx` — All product categories with cards
- `src/pages/CaraTransaksi.tsx` — Step-by-step timeline
- `src/pages/FAQ.tsx` — Accordion FAQ with admin editable
- `src/pages/CekTransaksi.tsx` — Transaction checker form
- `src/pages/Reseller.tsx` — Reseller info + join CTA
- `src/pages/Kontak.tsx` — Contact page
- `src/pages/Admin.tsx` — Admin login page
- `src/pages/AdminDashboard.tsx` — Admin dashboard

### Layout Components
- `src/components/layout/Header.tsx` — Sticky, blur on scroll, mobile menu
- `src/components/layout/Footer.tsx` — Full footer with links, socials, contacts
- `src/components/layout/WhatsAppFloat.tsx` — Floating WA button with pulse

### Home Sections
- `src/components/home/HeroSlider.tsx` — Full-width banner slider (4 slides, auto-play, swipe, dots, arrows)
- `src/components/home/StatsCounter.tsx` — Animated counter (100k+ txn, 500+ products, 24/7 service)
- `src/components/home/ProductCategories.tsx` — 8 category cards with icons
- `src/components/home/Features.tsx` — 6 keunggulan cards with hover effects
- `src/components/home/HowToTransact.tsx` — 6-step timeline
- `src/components/home/FAQSection.tsx` — Accordion FAQ section
- `src/components/home/JoinReseller.tsx` — Reseller CTA section

### Admin Components
- `src/components/admin/AdminLayout.tsx` — Admin sidebar/nav layout
- `src/components/admin/BannerManager.tsx` — Add/remove/reorder banners
- `src/components/admin/FAQManager.tsx` — CRUD for FAQ items
- `src/components/admin/TransactionManager.tsx` — View/manage transactions

### Shared Utilities
- `src/lib/admin-auth.ts` — Simple localStorage-based admin auth (username: admin, password: Admin@12345)
- `src/lib/store.ts` — LocalStorage state for banners, FAQs, transactions

## Key Design Features
1. **Wave/Curve Dividers** between all sections (SVG-based)
2. **Glassmorphism** cards with backdrop-blur
3. **Neon green glow** on CTAs and hover states
4. **Ripple effect** on all buttons (CSS keyframes)
5. **Scroll-triggered animations** using Intersection Observer
6. **Mobile-first** responsive: grid cols auto-adjust from 1 → 2 → 3 → 4
7. **Sticky header** with blur glass effect on scroll

## Admin Features
- Login at `/admin` with credentials admin / Admin@12345
- Session persisted in localStorage
- Dashboard with tabs: Banners, FAQs, Produk, Transaksi
- All data stored in localStorage (no backend needed for demo)
- Protected route redirect if not authenticated

## WhatsApp Integration
- All CTA buttons link to: https://wa.me/NOMOR_ADMIN
- Reseller join message: "Halo Admin SHIELACOM CELL, saya ingin mendaftar sebagai reseller."
- Floating WA button always visible bottom-right

## Verification
- All menu links navigate correctly
- Hero slider auto-plays, has arrows, dots, swipe support
- Stats counters animate when scrolled into view
- FAQ accordion opens/closes smoothly
- Cek Transaksi shows colored status badges
- Admin login works with admin/Admin@12345
- Admin can add/delete banners and FAQs
- WhatsApp float button visible on all pages
- All pages responsive on mobile/tablet/desktop
