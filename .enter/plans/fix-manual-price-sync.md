# Fix: Manual Price Override vs Digiflazz Sync

## Root Cause

Saat ini sync-products mempertahankan **margin** (selisih sell-buy), bukan **sell_price** itu sendiri.

Contoh masalah:
- Admin set sell_price = 25.000 untuk produk dengan buy_price = 20.000 (margin = 5.000)
- Digiflazz update buy_price → 21.000
- Sync menghitung: sell_price = 21.000 + 5.000 = 26.000 ← **berbeda dari yang admin set!**

## Solusi: Kolom `price_mode`

Tambahkan kolom `price_mode text DEFAULT 'auto'` pada tabel `sc_products`:
- `'auto'`   → sell_price dihitung ulang saat sync (behaviour existing)
- `'manual'` → sell_price TIDAK pernah disentuh saat sync

---

## Perubahan (3 file)

### 1. Database Migration
```sql
ALTER TABLE sc_products
  ADD COLUMN IF NOT EXISTS price_mode text NOT NULL DEFAULT 'auto';
```

### 2. `supabase/functions/sync-products/index.ts`
- Baca `price_mode` & `buy_price` dari tabel saat STEP 4.5
- Untuk setiap produk Digiflazz:
  - Produk **baru** → `price_mode = 'auto'`, sell = buy + 1000
  - Produk **ada, mode AUTO** → sell = new_buy + old_margin (behaviour saat ini)
  - Produk **ada, mode MANUAL** → sell = existing sell_price (TIDAK DIUBAH)
- Sertakan `price_mode` di setiap row upsert

### 3. `src/components/admin/ProductManager.tsx`
- Tambahkan `price_mode` ke interface `DbProduct`
- `handleSave` (edit produk Digiflazz) → simpan `price_mode: 'manual'`
- `handleSave` (tambah produk baru manual) → simpan `price_mode: 'manual'`
- `ProductRow` tampilkan badge kunci "Harga Manual" jika `price_mode === 'manual'`
- Tombol "Reset ke Auto" di ProductRow untuk membatalkan override

---

## Yang TIDAK berubah
- Sistem markup Global/Kategori/Produk
- Markup Reseller
- Konfigurasi Digiflazz / API
- Payment Gateway & alur transaksi
- Tampilan website & struktur UI
- Semua fungsi slider, auth, routing
