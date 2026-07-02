# Refactor: Halaman Produk Marketplace (URL-based Routing)

## Analisis Codebase Saat Ini

- `/products` → `src/pages/Products.tsx` (satu halaman, filter JS, tidak SEO-friendly)
- Router: React Router v7 dengan `createBrowserRouter`
- Data: `getProductsFromDB()` dari `order-api.ts` → tabel `sc_products`
- CSS: custom utilities `bg-hero-gradient`, `glass`, `card-hover`, `text-gradient`, dll

## Yang TIDAK DIUBAH

Semua file di luar scope produk: `order-api.ts` (logic transaksi), `Admin`, `Reseller`, Auth, Payment, Digiflazz, Edge Functions, database, `store.ts`, `events.ts`, dll.

---

## File Baru (9 file)

### `src/lib/product-slugs.ts`
- Mapping 2 arah: `category_id ↔ slug` (e.g. `data ↔ paket-data`)
- `brandToSlug()` + `slugToBrand()` untuk brand dinamis
- Metadata kategori (label, icon, color, SEO title/description, FAQ, testimonials)

### `src/components/products/ProductCard.tsx`
- Reusable kartu produk, onClick → `/order/:sku`

### `src/components/products/ProductGrid.tsx`
- Grid responsive, lazy render, gunakan ProductCard

### `src/components/products/BrandTabs.tsx`
- Tab brand yang mengubah URL (bukan JS filter)
- Tab "Semua" → `/products/:category`
- Tab brand → `/products/:category/:brand`

### `src/components/products/Breadcrumb.tsx`
- Komponen breadcrumb reusable
- Home > Produk > [Kategori] > [Brand]

### `src/components/products/CategoryBanner.tsx`
- Hero banner per kategori dengan gradient warna berbeda
- Judul, deskripsi, search bar

### `src/components/products/FAQSection.tsx`
- FAQ accordion per kategori (data statis default per kategori)

### `src/components/products/PromoSection.tsx`
- Placeholder promo (siap dikembangkan nanti)

### `src/pages/ProductCatalog.tsx` ← BARU
- Handle BOTH `/products/:category` AND `/products/:category/:brand`
- Gunakan `useParams()` untuk resolve slug → ID
- Fetch dari Supabase per kategori
- Filter brand client-side dari data yang sudah diambil
- Susun: Banner → Breadcrumb → BrandTabs → ProductGrid → FAQ → Promo
- Set document.title + meta description per halaman

---

## File Dimodifikasi (3 file)

### `src/pages/Products.tsx` → Rewrite sebagai Landing Page
- Hero section dengan search
- Grid kategori (tiap kategori: link ke `/products/:slug`)
- CTA section
- TIDAK lagi memuat semua produk

### `src/router.tsx` → Tambah 2 route baru
```
{ path: "/products/:categorySlug",               element: <ProductCatalog /> }
{ path: "/products/:categorySlug/:brandSlug",    element: <ProductCatalog /> }
```
Route `/products` tetap ada (Products landing)

### `src/components/layout/Header.tsx` → Tambah dropdown kategori
- "Produk" tetap link ke `/products` saat diklik
- Hover desktop: dropdown kategori → `/products/:slug`
- Mobile: expand submenu kategori

---

## Backward Compatibility

- `/products` tetap berfungsi (landing page baru)
- `/order/:sku` tidak berubah
- `/payment`, `/order-status` tidak berubah
- Semua admin/reseller routes tidak berubah
- `getProductsFromDB()` tidak diubah (tetap dipakai)

---

## URL yang Terbentuk

| URL | Halaman |
|-----|---------|
| `/products` | Landing (kategori grid) |
| `/products/pulsa` | Semua produk Pulsa |
| `/products/pulsa/telkomsel` | Pulsa Telkomsel |
| `/products/paket-data` | Semua Paket Data |
| `/products/paket-data/xl` | Paket Data XL |
| `/products/top-up-game` | Semua Top Up Game |
| `/products/top-up-game/mobile-legends` | Game MLBB |
| `/products/e-wallet/gopay` | E-Wallet GoPay |
| `/products/token-pln` | Token PLN |
| `/products/ppob` | PPOB |
