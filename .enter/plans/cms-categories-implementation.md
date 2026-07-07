# CMS Kategori — Implementation Plan

## Analisis Existing Codebase

### Existing Yang Tidak Boleh Diubah:
- `src/lib/product-slugs.ts` — CATEGORIES hardcoded, digunakan oleh ProductCatalog
- `src/components/admin/CategoryManager.tsx` — kelola internal product categories (localStorage)
- `supabase/functions/` — semua edge functions (Digiflazz, Payment, Webhook)
- `sc_products`, `sc_orders`, dll — tidak ada perubahan tabel lama

### Existing Yang AKAN Dimodifikasi (Additive Only):
- `src/pages/AdminDashboard.tsx` — tambah 2 nav item baru
- `src/pages/ProductCatalog.tsx` — tambah sub-category grid logic (jika CMS ada data)
- `src/pages/Products.tsx` — gunakan CMS thumbnail (dengan fallback ke existing)
- `src/components/products/CategoryBanner.tsx` — gunakan CMS banner (dengan fallback)

---

## Database & Storage

### Tabel Baru: `sc_cms_categories`
Menyimpan data visual untuk kategori (top-level) DAN sub-kategori (brand/provider):
```sql
id, slug, name, parent_slug, brand_name, thumbnail_url, banner_url, 
icon_url, bg_color, description, seo_title, seo_description,
display_order, is_active, created_at, updated_at
```

**Contoh data:**
- Top-level: slug='pulsa', parent_slug=null → visual untuk halaman Pulsa
- Sub-level: slug='telkomsel', parent_slug='pulsa', brand_name='Telkomsel' → Telkomsel card

### Tabel Baru: `sc_cms_media`
Media Library — semua gambar yang pernah diupload:
```sql
id, file_name, original_name, file_url, file_size, file_type, 
media_type, alt_text, created_at
```

### Storage Bucket: `cms-media` (public)
Struktur folder:
- `cms-media/thumbnails/` — thumbnail cards
- `cms-media/banners/` — hero banners
- `cms-media/icons/` — icons

### RLS Policies:
- Anon: SELECT only pada kedua tabel
- Anon: INSERT (admin panel menggunakan anon key)
- Storage: anon INSERT + SELECT untuk bucket `cms-media`

---

## Files Yang Dibuat (Baru)

### 1. `supabase/migrations/migration_20260707_cms`
Schema migration + storage bucket + RLS policies

### 2. `src/lib/cms-api.ts`
API functions:
- `uploadToStorage(file, folder)` → Supabase Storage URL
- `getCmsCategories(parentSlug?)` → top-level atau sub
- `saveCmsCategory(data)` → upsert
- `deleteCmsCategory(id)` → delete
- `getMediaLibrary()` → all uploaded media
- `deleteMedia(id, fileUrl)` → hapus dari DB + Storage
- `getAvailableBrands(categoryId)` → brands dari sc_products

### 3. `src/components/admin/CmsCategoryManager.tsx`
Admin panel dengan 3 tab:
- **Kategori Utama** — manage 7 top-level categories (edit thumbnail, banner, SEO)
- **Sub-Kategori** — manage sub-cats per category (pilih parent, upload thumbnail)
- **Media Library** — semua gambar, upload/delete/copy URL

Features:
- Upload gambar → Supabase Storage → preview langsung
- Dropdown brands dari database (tidak manual entry)
- Form inline dengan preview

### 4. `src/components/products/SubCategoryGrid.tsx`
Grid component untuk halaman customer:
- Tampil sub-kategori dengan CMS thumbnail
- Fallback ke branded placeholder jika thumbnail belum diset
- Responsive: 2-3-4 kolom
- Lazy loading + skeleton loading

---

## Files Yang Dimodifikasi

### 5. `src/pages/AdminDashboard.tsx`
Tambah 2 nav items dalam grup "Produk":
- `'cms_categories'` → "CMS Kategori" (icon: Layers)
- Import `CmsCategoryManager`

### 6. `src/pages/ProductCatalog.tsx`
Logic tambahan (non-breaking):
- Jika `brandSlug` === undefined: fetch CMS sub-categories untuk `categorySlug`
- Jika ada sub-categories di CMS: tampilkan `SubCategoryGrid` DULU, sembunyikan product list
- Jika tidak ada sub-categories: tampilkan product list seperti biasa (existing behavior)
- Jika `brandSlug` ada: existing behavior (filter by brand, tampilkan produk)

### 7. `src/pages/Products.tsx`
- Fetch CMS category thumbnails saat load
- Tampilkan thumbnail CMS pada category cards (fallback ke gradient icon existing)

### 8. `src/components/products/CategoryBanner.tsx`
- Cek CMS banner URL untuk category
- Jika ada: tampilkan sebagai img
- Jika tidak: tampilkan existing gradient banner

---

## Flow Admin (Upload Gambar)
```
Admin klik "Upload Thumbnail"
  → browser file picker terbuka
  → pilih gambar
  → preview langsung muncul
  → klik "Simpan"
  → upload ke Supabase Storage (cms-media/thumbnails/)
  → URL disimpan ke sc_cms_categories
  → selesai
```

## Flow Customer (Halaman Top Up Game)
```
Buka /products/top-up-game
  → ProductCatalog load
  → fetch CMS sub-categories WHERE parent_slug='top-up-game'
  → ada data (ML, FF, PUBG, dll)
  → tampilkan SubCategoryGrid dengan thumbnails
  
  → customer klik "Mobile Legends"
  → navigate to /products/top-up-game/mobile-legends
  → ProductCatalog load dengan brandSlug='mobile-legends'
  → tampilkan produk Mobile Legends
```

---

## Urutan Implementasi (Step-by-Step)

1. ✅ Database migration + storage bucket
2. ✅ CMS API library
3. ✅ SubCategoryGrid component
4. ✅ CmsCategoryManager admin panel
5. ✅ AdminDashboard: tambah nav + import
6. ✅ ProductCatalog: sub-category grid logic
7. ✅ Products.tsx: CMS thumbnails
8. ✅ CategoryBanner: CMS banner

---

## Validasi Setelah Implementasi
- Digiflazz: tidak ada perubahan
- Payment Gateway: tidak ada perubahan
- Checkout/Order: tidak ada perubahan
- CategoryManager lama: masih ada dan berfungsi
- ProductCatalog tanpa CMS data: tampil seperti biasa (fallback)
- ProductCatalog dengan CMS data: tampil sub-category grid
