# SHIELACOM CELL — Admin Dashboard Upgrade Plan

## Context
Major upgrade of AdminDashboard.tsx from 4-tab panel to a full PPOB platform admin comparable to Digiflazz/Orderkuota. All data stored in localStorage with FileReader API for image uploads. Real-time website updates via custom DOM events.

## Architecture

### Event Bus (real-time website updates)
`src/lib/events.ts` — emit/subscribe pattern
- `notifyUpdate(key)` dispatches CustomEvent
- `useStoreData(fn, key)` hook for live-updating components

### Expanded Store (`src/lib/store.ts` — full rewrite)
New types added (keeping old ones):
- `SiteSettings` — name, tagline, logo (base64), contact
- `SocialMedia` — wa, fb, ig, tiktok, telegram, yt
- `SeoSettings` — metaTitle, description, keywords, ogImage (base64)
- `CmsContent` — hero/section text editable from admin
- `Banner` (upgraded) — imageDataUrl, button1/2, active, order
- `Product` — photoDataUrl, categoryId, provider, buyPrice, sellPrice, providerCode, brand, active
- `Category` — name, icon, color, active
- `ProviderConfig` — digiflazz (username, apiKey, webhook), vipReseller (memberId, apiKey)
- `PaymentGateway` — duitku, ipaymu, tripay configs
- `ProviderPriority` — per-category primary/backup
- `MarkupRule` — categoryId/productId, value, isPercentage
- `Reseller` — name, email, wa, username, password (hashed), balance, status
- `ResellerRegistration` — name, email, wa, message, status, createdAt
- `Deposit` — resellerId, amount, status (pending→approved adds balance)
- `WalletMutation` — type, amount, balance, description
- `Testimonial` — name, role, message, photoDataUrl, rating, active
- `Article` — title, content (rich text), thumbnailDataUrl, status
- `SystemLog` — action, description, user, createdAt
- `Notification` — type, title, message, read

### Image Upload Helper (`src/lib/image-upload.ts`)
- `readFileAsDataUrl(file)` → Promise<string>
- `ImageUploadButton` component — hidden input + styled button

### New AdminDashboard (`src/pages/AdminDashboard.tsx` — full rewrite)
Sidebar with collapsible groups + scrollable nav, mobile overlay, top bar with notifications badge.

Sections (activeSection state):
- `overview` → Overview
- `site-settings` → Pengaturan Umum
- `logo` → Logo Website  
- `banners` → Banner & Slider
- `cms` → CMS Konten
- `seo` → SEO
- `social` → Sosial Media
- `products` → Daftar Produk
- `categories` → Kategori
- `digiflazz` → Digiflazz
- `vip` → VIP Reseller
- `priority` → Provider Priority
- `duitku` → Duitku
- `ipaymu` → iPaymu
- `tripay` → Tripay
- `markup` → Markup Harga
- `resellers` → Daftar Reseller
- `registrations` → Pendaftaran
- `deposits` → Deposit
- `mutations` → Mutasi Wallet
- `testimonials` → Testimoni
- `articles` → Blog/Artikel
- `faqs` → FAQ
- `reports` → Laporan
- `health` → System Health
- `logs` → System Logs
- `notifications` → Notifikasi

### Admin Section Components (split into focused files)
`src/components/admin/`
- `AdminOverview.tsx` — stats cards + recent activity
- `WebsiteManagement.tsx` — site settings, logo, CMS, SEO, social
- `BannerManager.tsx` — CRUD + image upload + active toggle + reorder
- `ProductManager.tsx` — CRUD + image upload + markup display
- `CategoryManager.tsx` — CRUD for categories
- `ProviderSettings.tsx` — Digiflazz, VIP, Priority, Sync
- `PaymentGatewaySettings.tsx` — Duitku, iPaymu, Tripay
- `MarkupSettings.tsx` — per-category, per-product, percentage rules
- `ResellerPanel.tsx` — Resellers, Registrations, Deposits, Mutations
- `ContentPanel.tsx` — Testimonials, Articles, FAQ
- `ReportsPanel.tsx` — daily/weekly/monthly stats
- `SystemPanel.tsx` — Health monitoring, Logs, Notifications

### Website Component Updates (real-time from store)
- `Header.tsx` — logo from siteSettings.logoDataUrl, siteName
- `Footer.tsx` — socialMedia from store, contact from siteSettings
- `HeroSlider.tsx` — banners with imageDataUrl, active filter
- `StatsCounter.tsx` — uses cmsContent stats
- `ProductCategories.tsx` — categories from store
- `JoinReseller.tsx` — CMS text from store
- `Features.tsx` — CMS features from store

## Key Working Features
1. Image upload: FileReader → base64 → localStorage → displayed in website
2. Site settings → document.title updated, header/footer updated live
3. Banner active toggle → slider shows only active banners
4. Reseller deposit approve → balance added to reseller account
5. Digiflazz sync button → adds 20 sample products from Digiflazz catalog
6. Markup rules → applied to displayed product prices
7. System logs → every admin action recorded
8. Notifications → badge count on top bar

## Files to Create/Modify
**New:**
- `src/lib/events.ts`
- `src/lib/image-upload.ts`
- `src/components/admin/AdminOverview.tsx`
- `src/components/admin/WebsiteManagement.tsx`
- `src/components/admin/BannerManager.tsx`
- `src/components/admin/ProductManager.tsx`
- `src/components/admin/CategoryManager.tsx`
- `src/components/admin/ProviderSettings.tsx`
- `src/components/admin/PaymentGatewaySettings.tsx`
- `src/components/admin/MarkupSettings.tsx`
- `src/components/admin/ResellerPanel.tsx`
- `src/components/admin/ContentPanel.tsx`
- `src/components/admin/ReportsPanel.tsx`
- `src/components/admin/SystemPanel.tsx`

**Rewrite:**
- `src/lib/store.ts`
- `src/pages/AdminDashboard.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/home/HeroSlider.tsx`
