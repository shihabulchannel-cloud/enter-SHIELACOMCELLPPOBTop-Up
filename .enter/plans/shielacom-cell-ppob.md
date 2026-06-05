# Rencana: Sistem Reseller Tunggal SHIELACOM CELL

## Context
Sistem reseller lama menggunakan `localStorage` (tidak persisten, tidak aman).  
Perlu dibangun ulang dengan database Supabase, auth terpisah dari admin, dan dashboard reseller lengkap.  
**Tidak mengubah** konfigurasi Digiflazz, Payment Gateway, produk, transaksi, atau pengaturan website yang ada.

---

## Apa yang TIDAK DIUBAH
- Tabel: `sc_digiflazz_config`, `sc_payment_configs`, `sc_orders`, `sc_products`, `sc_admin_accounts`
- Edge functions: `create-order`, `check-order`, `payment-webhook`, `digiflazz-webhook`, `sync-products`
- Admin pages: semua kecuali `ResellerPanel.tsx` (hanya dikerjakan ulang)
- Banner, Logo, Footer, Produk, Transaksi, Pengaturan website

---

## Phase 1 — Database Migration (aman, additive only)

### Tabel Baru
```sql
-- 1. sc_resellers — akun reseller
CREATE TABLE sc_resellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  email text DEFAULT '',
  whatsapp text DEFAULT '',
  balance integer DEFAULT 0,
  markup integer DEFAULT 0, -- markup global reseller (Rp)
  status text DEFAULT 'active', -- active | suspended
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- 2. sc_bank_accounts — rekening admin untuk deposit
CREATE TABLE sc_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. sc_deposits — pengajuan top up saldo reseller
CREATE TABLE sc_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id uuid REFERENCES sc_resellers(id) ON DELETE CASCADE,
  reseller_name text NOT NULL,
  amount integer NOT NULL,
  bank_target text DEFAULT '',
  proof_image text DEFAULT '', -- base64 atau URL
  status text DEFAULT 'pending', -- pending | approved | rejected
  reject_reason text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. sc_wallet_mutations — mutasi saldo reseller
CREATE TABLE sc_wallet_mutations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id uuid REFERENCES sc_resellers(id) ON DELETE CASCADE,
  reseller_name text NOT NULL,
  type text NOT NULL, -- deposit | debit | transaction | refund | manual_add | manual_deduct
  amount integer NOT NULL,
  balance_before integer NOT NULL,
  balance_after integer NOT NULL,
  description text DEFAULT '',
  ref_id text DEFAULT '', -- invoice_id atau deposit_id
  created_at timestamptz DEFAULT now()
);

-- 5. sc_support_tickets — tiket bantuan reseller
CREATE TABLE sc_support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id uuid REFERENCES sc_resellers(id) ON DELETE CASCADE,
  reseller_name text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'open', -- open | replied | closed
  admin_reply text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. sc_reseller_orders — order dari reseller (berbeda dari sc_orders publik)
CREATE TABLE sc_reseller_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id uuid REFERENCES sc_resellers(id) ON DELETE CASCADE,
  reseller_name text NOT NULL,
  product_sku text NOT NULL,
  product_name text NOT NULL,
  product_price integer NOT NULL, -- harga beli (buy_price dari sc_products)
  markup integer NOT NULL DEFAULT 0,
  sell_price integer NOT NULL, -- product_price + markup
  target text NOT NULL,
  target_detail text DEFAULT '',
  order_status text DEFAULT 'processing', -- processing | success | failed
  digiflazz_ref text DEFAULT '',
  digiflazz_sn text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### RLS Policies
- Semua tabel reseller: service_role = ALL, public = NONE (auth via edge function)
- `sc_bank_accounts`: public SELECT WHERE active=true (reseller bisa lihat rekening aktif)

---

## Phase 2 — Edge Functions

### 1. `reseller-auth` (baru)
Actions:
- `register` → hash SHA-256, insert sc_resellers, return session token
- `login` → verify hash, update last_login, return session token (24h expiry)
- `change_password` → verify old hash, update to new hash

Pattern identik dengan `admin-login` (Web Crypto API SHA-256 + base64 JSON token).

### 2. `reseller-deposit` (baru)
Actions:
- `submit` → insert sc_deposits, status=pending (hanya reseller terautentikasi)
- `approve` → admin action: update status=approved, tambah balance, insert sc_wallet_mutations
- `reject` → admin action: update status=rejected + reject_reason
- `list` → list deposit reseller atau semua (admin)

### 3. `reseller-order` (baru)
Actions:
- `buy` → cek saldo cukup, kurangi saldo, insert sc_reseller_orders, kirim ke Digiflazz
- Pattern sama seperti `payment-webhook` processDigiflazzOrder

---

## Phase 3 — Reseller Auth Module (Frontend)

### File Baru: `src/lib/reseller-auth.ts`
- Identik dengan `admin-auth.ts` tapi key `shielacom_reseller_v1`
- Interfaces: `ResellerSession { id, username, name, balance, markup, status, expires_at }`
- Functions: `resellerLogin`, `resellerLogout`, `isResellerLoggedIn`, `getResellerSession`

### File Baru: `src/components/reseller/ResellerRoute.tsx`
- Protected route wrapper: jika tidak login → redirect ke `/reseller/login`

---

## Phase 4 — Reseller Dashboard Pages

### Struktur Route
```
/reseller/login        → Login reseller
/reseller/register     → Daftar reseller  
/reseller/dashboard    → Dashboard (protected)
/reseller/products     → Beli produk (protected)
/reseller/deposit      → Top up saldo (protected)
/reseller/history      → Riwayat transaksi (protected)
/reseller/mutations    → Mutasi saldo (protected)
/reseller/profile      → Profil & ubah password (protected)
/reseller/support      → Tiket bantuan (protected)
```

### File Baru: `src/pages/reseller/Layout.tsx`
Sidebar/header reseller dengan menu 9 item (sesuai spec).  
Tampilkan nama reseller + saldo di header.

### Halaman (semua di `src/pages/reseller/`):
- `Login.tsx` — form login, link ke register
- `Register.tsx` — form daftar, redirect ke login setelah berhasil
- `Dashboard.tsx` — stats card: saldo, total transaksi, total deposit, recent orders
- `Products.tsx` — katalog produk dari `sc_products` dengan markup reseller, tombol Beli
- `Deposit.tsx` — form nominal + pilih rekening admin + upload bukti (input file → FileReader base64)
- `History.tsx` — list `sc_reseller_orders` milik reseller ini
- `Mutations.tsx` — list `sc_wallet_mutations` milik reseller ini
- `Profile.tsx` — info akun + form ganti password
- `Support.tsx` — list tiket + form buat tiket baru

---

## Phase 5 — Admin Updates

### Update: `src/components/admin/ResellerPanel.tsx`
Rebuild menggunakan database Supabase. Tab:
- **Daftar Reseller**: baca `sc_resellers`, tombol kelola saldo (manual add/deduct via `reseller-deposit`), suspend/aktifkan, lihat markup, ubah markup
- **Deposit**: baca `sc_deposits`, lihat bukti transfer (modal image), tombol Approve/Reject + alasan penolakan
- **Mutasi**: baca `sc_wallet_mutations` dengan filter reseller
- **Tiket**: baca `sc_support_tickets`, balas tiket

### File Baru: `src/components/admin/BankAccountSettings.tsx`
CRUD bank accounts dari `sc_bank_accounts`. Ditambahkan ke AdminDashboard sebagai section baru.

### Update: `src/pages/AdminDashboard.tsx`
- Tambah `'bank-accounts'` ke `SectionKey`
- Tambah menu item "Rekening Deposit" di sidebar (group Reseller)
- Render `<BankAccountSettings />` untuk section tersebut

---

## Phase 6 — Marketing Page Update

### Update: `src/pages/Reseller.tsx`
- Hapus array `tiers` (Basic/Premium)
- Ganti dengan satu card "Program Reseller SHIELACOM CELL"
- Fitur: Beli produk digital, atur markup sendiri, dashboard reseller, riwayat transaksi
- Tombol: "Daftar Sekarang" → `/reseller/register` | "Login Reseller" → `/reseller/login`

---

## Phase 7 — Router Update

### Update: `src/router.tsx`
Tambah routes:
```typescript
/reseller/login, /reseller/register (public)
/reseller/dashboard, /reseller/products, /reseller/deposit,
/reseller/history, /reseller/mutations, /reseller/profile, /reseller/support
(semua wrapped ResellerRoute)
```

---

## Urutan Implementasi
1. Database migration
2. Edge functions (reseller-auth, reseller-deposit, reseller-order)
3. `src/lib/reseller-auth.ts`
4. `src/pages/reseller/` semua halaman + Layout
5. `src/components/reseller/ResellerRoute.tsx`
6. `src/components/admin/BankAccountSettings.tsx`
7. Update `ResellerPanel.tsx`
8. Update `AdminDashboard.tsx`
9. Update `Reseller.tsx` (marketing)
10. Update `router.tsx`
11. Lint check

---

## Verifikasi
- [ ] Reseller bisa daftar, login, logout
- [ ] Reseller bisa lihat produk dengan markup
- [ ] Reseller bisa submit deposit + upload bukti
- [ ] Admin bisa approve/reject deposit → saldo otomatis masuk
- [ ] Reseller bisa beli produk → saldo berkurang otomatis
- [ ] Mutasi saldo tercatat setiap transaksi
- [ ] Admin tidak bisa diakses reseller (route protection)
- [ ] Konfigurasi Digiflazz, Payment Gateway, Produk, Transaksi TIDAK berubah
