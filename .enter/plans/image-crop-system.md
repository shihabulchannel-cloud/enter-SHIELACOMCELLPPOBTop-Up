# Perbaikan Frontend/UI — Hero Slider, Banner DB, Invoice, Validasi Form, Cara Transaksi

## Context

Backend inti (Digiflazz, Duitku, webhook, auth, admin-api, RLS, signature) sudah diperbaiki dan **tidak akan disentuh** di task ini. Task ini murni frontend/UI, KECUALI satu pengecualian yang sudah disetujui user secara eksplisit: menambah 1 tabel Supabase baru (`sc_banners`) + 1 blok action baru (murni ditambahkan, tidak mengubah action lama) di `admin-api` khusus untuk simpan Banner — supaya banner benar-benar tersimpan di database dan tampil ke semua pengunjung, bukan hanya di browser admin sendiri (root cause: `bannerStore` saat ini pakai `localStorage`).

Semua perbaikan lain (Hero Slider responsive, help text ukuran gambar, Invoice, validasi form dinamis per kategori, halaman Cara Transaksi) adalah **pure frontend**, tidak menyentuh Edge Function/Digiflazz/Duitku sama sekali.

---

## 1. Banner tersimpan di Database (bukan localStorage)

**Root cause terkonfirmasi:** `bannerStore` (`src/lib/store.ts`) pakai `localStorage` key `sc_banners_v2`. Admin upload banner di browsernya sendiri → tidak muncul di browser pengunjung lain.

**Perubahan (Enter Cloud):**
- Migration baru: tabel `sc_banners` (id, title, subtitle, badge, button1_text, button1_link, button2_text, button2_link, banner_link, image_url, theme, active, display_order, created_at, updated_at).
  - RLS: `public SELECT` (true, semua baris — sama seperti `sc_products`), INSERT/UPDATE/DELETE **hanya via service_role** (ditulis lewat admin-api, sama pola dengan `sc_products`).
- `supabase/functions/admin-api/index.ts`: **tambah blok action baru** `banner_insert`, `banner_update`, `banner_delete`, `banner_reorder` (copy pola `product_insert/update/delete` yang sudah ada). Tidak ada baris kode lama yang diubah/dihapus.

**Perubahan Frontend:**
- `src/components/admin/BannerManager.tsx`: ganti sumber data dari `bannerStore` (localStorage) ke query Supabase langsung (public read) + panggil `admin-api` (action `banner_*`, header `X-Admin-Token` — pola sama seperti `ProductManager.tsx`) untuk create/update/delete/reorder. Upload gambar pindah dari `onBase64` → `onUrl` + `folder: 'banners'` (upload ke Supabase Storage via `uploadToStorage` yang sudah ada di `cms-api.ts`, sama seperti `CmsCategoryManager.tsx`) — hasilnya `image_url`, bukan base64 lagi.
- `src/components/home/HeroSlider.tsx`: baca banner dari Supabase (`sc_banners`, filter `active=true`, order by `display_order`) alih-alih `bannerStore.get()`. Tambah **realtime subscription** (`supabase.channel(...).on('postgres_changes', ...)`, pola sama seperti `OrderStatus.tsx`) agar perubahan admin langsung tampil tanpa refresh.
- Data lama di `bannerStore` (localStorage) otomatis diabaikan setelah migrasi; tidak perlu migrasi data karena defaultnya kosong/hardcode text saja.

---

## 2. Hero Slider — Perbaikan Responsive Mobile (`src/components/home/HeroSlider.tsx`)

**Root cause:** Section pakai `position: absolute inset-0` untuk tiap slide (teknik crossfade) di dalam container dengan **height tetap** (`clamp(480px, 36vw, 560px)`). Di mobile, konten di-stack vertikal (`flex-col`: gambar dulu `order-1`, lalu teks+tombol `order-2`) — total tinggi konten stack ini sering **melebihi** tinggi container yang di-clamp, sehingga:
- Konten terpotong oleh `overflow-hidden` pada section, ATAU
- Tombol CTA (elemen paling akhir/bawah) berbenturan dengan dots indicator yang di-pin `absolute bottom-4` relatif ke SELURUH section (bukan ke gambar saja).

**Perbaikan struktural (bukan sekadar scale):**
- Height section: mobile → **auto** (mengikuti tinggi konten asli), desktop (`md:` ke atas) → tetap pakai `clamp(...)` seperti sekarang (perilaku desktop TIDAK berubah).
- Slide switching: mobile → render hanya slide aktif secara normal flow (`block` / `hidden`, bukan `absolute` + `opacity`), sehingga tinggi container mengikuti konten. Desktop (`md:` ke atas) → tetap pakai `md:absolute md:inset-0` + crossfade opacity seperti sekarang.
- Arrow (prev/next) & dots: mobile → dipindah agar overlay **hanya di area gambar** (wrap gambar dalam container `relative` sendiri, taruh arrow/dots di dalamnya), bukan relatif ke seluruh section — supaya tidak pernah menimpa tombol CTA yang berada di block teks (di bawah gambar, mobile). Desktop → tetap posisi & perilaku sekarang (relatif ke seluruh section, karena di desktop gambar & teks sejajar, area di bawah dots memang kosong).
- Test breakpoint: 320/360/375/390/412/480/768/1024px — pastikan badge, title, subtitle, tombol tidak terpotong, gambar tidak pecah/crop, spacing konsisten.

---

## 3. Help Text Rekomendasi Ukuran Gambar

Update `src/lib/image-presets.ts` (value only, tidak breaking untuk gambar yang sudah pernah diupload):

| Preset | Lama | Baru | Dipakai di |
|---|---|---|---|
| `logo` | 200×200, 200KB | **512×512, 2MB** | `WebsiteManagement.tsx` (LogoManager) |
| `hero_slide` | 1280×720, 500KB | **1920×700, 3MB** (rasio ~16:6) | `BannerManager.tsx` |
| `thumbnail` | 600×600, 300KB | *(tidak berubah — sudah sesuai)* | `CmsCategoryManager.tsx` (Thumbnail Card kategori) |
| `banner` | 1440×480, 500KB | **1200×400** (rasio tetap 3:1) | `CmsCategoryManager.tsx` (Banner Hero, "Banner Promo") |

Tambahkan **Help Text di bawah tombol upload** (bukan popup) pada 4 lokasi: `LogoManager` (WebsiteManagement.tsx), `BannerManager.tsx`, dan 2 `ImageUpload` di `CmsCategoryManager.tsx` (Thumbnail Card & Banner Hero) — format teks: "Rekomendasi: WxH px · Rasio · Format · Maksimal Y MB", pakai style hint yang sudah ada (`text-xs text-muted-foreground`).

---

## 4. Invoice / Halaman Status Pesanan (`src/pages/OrderStatus.tsx`)

Tanpa mengubah `order-api.ts`, `check-order`, atau field database — murni presentasi ulang data yang sudah tersedia di `sc_orders` (`payment_status`, `order_status`, `product_price`, `payment_fee`, `payment_amount`, dst, sudah ada di schema).

- **Progress Timeline** (baru): 5 langkah — Pesanan Dibuat → Menunggu Pembayaran → Pembayaran Diterima → Pesanan Diproses → Pesanan Selesai. Progress ditentukan dari kombinasi `payment_status` + `order_status` yang sudah ada (mapping murni di frontend, tidak perlu field baru).
- **Status badge** lebih jelas: Menunggu Pembayaran / Lunas / Diproses / Selesai / Expired — mapping dari `payment_status`/`order_status` yang ada.
- **Ringkasan Pembelian** lengkap: Nama Produk, **Kategori** (lookup client-side: `product_sku` → query `sc_products.category_id` → label dari `CATEGORIES` di `product-slugs.ts`, read-only, tanpa ubah schema), Nomor Tujuan, Nominal (`product_price`), Biaya Admin (`payment_fee`), Total Bayar (`payment_amount`) — breakdown, bukan cuma total seperti sekarang.
- **Countdown**: reuse pola `useCountdown` yang sudah ada di `Payment.tsx` (dipindah ke helper bersama atau di-duplicate kecil — tidak mengubah `Payment.tsx`), tampilkan hanya saat status masih menunggu pembayaran.
- **Visual**: card modern + shadow (reuse token desain yang sudah ada: `rounded-2xl`, `shadow-card`/`border-border`), icon per status (reuse `StatusIcon` yang sudah ada, perluas warna/icon untuk status baru), fully responsive (mobile-first, sudah pola container yang dipakai halaman lain).
- Backend/logic **tidak disentuh** — `checkOrder()`, realtime subscription `sc_orders` yang sudah ada tetap dipakai apa adanya.

---

## 5. Validasi Form Dinamis per Kategori (`src/pages/Order.tsx`)

**Root cause terkonfirmasi (query database real):** `category_id` yang benar-benar dipakai di `sc_products` adalah: `pulsa`(158), `game`(79), `ewallet`(49), `data`(37), `voucher`(27), `pln`(5), `aktivasi`(4), `ppob`(3). `TARGET_CONFIG` di `Order.tsx` **tidak punya entry untuk `voucher` dan `aktivasi`** → otomatis fallback ke hint `pulsa` ("Masukkan nomor HP tujuan pengisian pulsa") — ini yang menyebabkan bug "beli Token PLN tapi teks bantuan bilang pulsa" jika kategori produk tersebut ter-mapping ke selain `pln` (mis. produk yang belum match keyword `mapCategory()` di `sync-products`, bukan hal yang bisa diperbaiki dari frontend — **tidak disentuh** karena itu bagian Digiflazz sync yang protected). Yang **bisa** & akan diperbaiki dari frontend:

- Tambah entry `voucher`: label "Email / User ID Tujuan", hint "Masukkan email, User ID, atau nomor HP sesuai jenis voucher yang dibeli (Google Play, Garena, PB Cash, Playstation, dll)".
- Tambah entry `aktivasi`: label "Nomor HP", hint "Masukkan nomor HP yang akan diaktivasi kartu perdana / paketnya".
- `ppob` (BPJS, TV kabel, dst — semuanya satu `category_id` di database, tidak ada kategori terpisah per biller): tambah **sub-deteksi berbasis `product.brand`/`product.name`** (murni frontend, tidak ubah kategori/database) untuk hint lebih spesifik:
  - Brand mengandung "BPJS" → "Masukkan Nomor Virtual Account BPJS"
  - Brand/nama mengandung "PDAM" → "Masukkan ID Pelanggan PDAM"
  - Brand/nama mengandung "TELKOM"/"INDIHOME" → "Masukkan Nomor Telepon Rumah / ID Pelanggan Indihome"
  - Brand/nama mengandung "TV"/"VISION"/"GOL" (TV kabel) → "Masukkan ID Pelanggan / Smart Card"
  - Default `ppob` (tidak match keyword manapun) → hint generik "Masukkan ID Pelanggan / Nomor Akun sesuai layanan"
- `pln` (aktual = Token PLN prepaid di database ini): hint dipertegas "Masukkan nomor meter listrik / ID pelanggan PLN (10–12 digit)" — label & hint sudah cukup benar, hanya dirapikan.
- Kategori lain yang sudah benar (`pulsa`, `data`, `ewallet`, `game`) — **tidak diubah**.

---

## 6. Halaman Cara Transaksi — Hapus Hero Duplikat (`src/pages/CaraTransaksi.tsx`)

`CaraTransaksi.tsx` punya Hero section sendiri (badge "Panduan" + judul "Cara Transaksi" + subtitle statis), lalu me-render `<HowToTransact />` yang **juga** punya Hero section sendiri di dalamnya (badge "Panduan Transaksi" + judul "Cara Transaksi" + subtitle + timeline animasi). Ini yang dimaksud "dua Hero Section".

**Perbaikan:** Hapus blok `<section className="bg-hero-gradient pt-24...">...</section>` (Hero pertama) di `CaraTransaksi.tsx`. Biarkan `<HowToTransact />` (yang sudah punya Hero + timeline animasi) sebagai satu-satunya Hero. **Tidak mengubah** `HowToTransact.tsx` sama sekali (animasi timeline & urutan langkah tetap).

---

## 7. Audit Mobile Umum

Sudah di-scan (`StatsCounter`, `HeroSlider`, layout umum) — tidak ditemukan overflow/fixed-width bermasalah lain selain Hero Slider. Setelah perbaikan di atas, lakukan verifikasi visual cepat di breakpoint utama (375px, 768px) untuk halaman: Beranda, Order, Payment, OrderStatus, Cara Transaksi.

---

## Implementation checklist

- [passed] Migration baru: tabel `sc_banners` + RLS (public select true; insert/update/delete hanya service_role)
- [passed] `admin-api/index.ts`: tambah action `banner_insert`, `banner_update`, `banner_delete`, `banner_reorder` (murni tambahan, tidak ubah action lama)
- [passed] `BannerManager.tsx`: pindah dari `bannerStore` (localStorage) ke Supabase (`sc_banners` + admin-api), upload gambar via `folder: 'banners'` → `image_url`
- [passed] `HeroSlider.tsx`: baca dari `sc_banners` (bukan `bannerStore`) + realtime subscription
- [manual-required] `HeroSlider.tsx`: restrukturisasi height (mobile auto / desktop clamp) dan posisi arrow+dots (mobile relatif ke gambar, desktop relatif ke section) — verifikasi di 320/360/375/390/412/480/768/1024px, tombol CTA tidak pernah tertutup dots
- [passed] `image-presets.ts`: update `logo` → 512×512/2MB, `hero_slide` → 1920×700/3MB, `banner` → 1200×400 (rasio 3:1 tetap)
- [passed] Tambah help text ukuran gambar (bukan popup) di: `LogoManager`, `BannerManager`, `CmsCategoryManager` (Thumbnail Card & Banner Hero)
- [passed] `OrderStatus.tsx`: tambah progress timeline 5 langkah, status badge lengkap, ringkasan pembelian dengan breakdown (Kategori, Nominal, Biaya Admin, Total), countdown, card modern — tanpa ubah `order-api.ts`/`check-order`
- [passed] `Order.tsx` `TARGET_CONFIG`: tambah `voucher`, `aktivasi`; tambah sub-deteksi brand/nama untuk `ppob` (BPJS/PDAM/Telkom/TV); perbaiki teks `pln`
- [passed] `CaraTransaksi.tsx`: hapus Hero section pertama (duplikat), pertahankan `HowToTransact` apa adanya

## Verification checklist

- [manual-required] Upload banner baru di Admin Panel → langsung tampil di Beranda (buka di browser/incognito lain, tanpa refresh manual berkat realtime) — buktikan data dari DB bukan localStorage
- [manual-required] Hero Slider di 320px/375px/390px/768px/1024px: badge+judul+subtitle+tombol tidak terpotong, tombol tidak tertutup dots, gambar tidak pecah
- [manual-required] Upload Logo, Banner Slider, Thumbnail Kategori, Banner Hero di Admin Panel masing-masing menampilkan help text ukuran yang benar di bawah tombol upload
- [passed] Order.tsx: beli produk kategori `voucher` dan `aktivasi` → helper text sesuai (bukan fallback "pulsa")
- [passed] Order.tsx: beli produk `ppob` dengan brand mengandung "BPJS" → hint BPJS; tanpa keyword cocok → hint generik ppob
- [manual-required] OrderStatus.tsx: order dengan status pending/paid/success/failed masing-masing menampilkan progress timeline & badge yang sesuai; breakdown Nominal+Biaya Admin+Total sesuai data asli order
- [passed] CaraTransaksi.tsx: hanya 1 Hero section tampil, timeline animasi & urutan langkah tidak berubah
- [manual-required] Regression: Login Admin, Login Customer, Provider Digiflazz, Sinkronisasi Produk, Payment Gateway (Duitku), Checkout, CMS Kategori tetap berfungsi normal tanpa error "Edge Function returned a non-2xx status code"
- [manual-required] Lint & build project berhasil tanpa error
