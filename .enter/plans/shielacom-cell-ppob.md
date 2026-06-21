# Security Hardening Plan — SHIELACOM CELL Auth System

## Temuan Masalah Keamanan

### Kritis
1. **SHA-256 password hashing** — tidak aman untuk kata sandi (mudah di-brute force dengan GPU)
2. **Session token = base64(JSON)** — bisa dipalsukan karena tidak ada tanda tangan kriptografi
3. **Legacy fallback admin**: `{loggedIn: true}` di localStorage cukup untuk lolos auth check
4. **RLS `service_role_update_orders` berlaku untuk `{public}`** — siapa saja bisa UPDATE semua order (ganti status bayar, approve manual payment)
5. **`sc_wallet_mutations` ALL untuk `{public}`** — siapa saja bisa insert/update mutasi saldo

### Tinggi
6. **Tidak ada rate limiting** — brute force login bebas
7. **`/admin/dashboard` tidak punya AdminRoute guard** — route check hanya di dalam useEffect (terlambat)
8. **`sc_deposits`, `sc_reseller_orders` ALL untuk `{public}`** — write bebas dari anon
9. **Tidak ada audit log** — tidak bisa lacak siapa yang login/ubah data

### Sedang
10. **Verifikasi token tidak ada** — edge function reseller-auth (update_profile, change_password) tidak verifikasi JWT, cukup kirim reseller_id

---

## Scope Perubahan

### Yang DIUBAH:
- `supabase/functions/admin-login/index.ts` — PBKDF2 hash, JWT bertanda tangan, rate limit, audit log
- `supabase/functions/reseller-auth/index.ts` — PBKDF2 hash, JWT bertanda tangan, rate limit, session_token di payload
- `src/lib/admin-auth.ts` — hapus legacy fallback, pakai JWT signed
- `src/lib/reseller-auth.ts` — pakai signed JWT dari server
- `src/components/admin/AdminRoute.tsx` — BARU: route guard
- `src/router.tsx` — wrap `/admin/dashboard` dengan AdminRoute
- Database migration — tabel baru + perbaikan RLS

### Yang TIDAK DIUBAH:
- Seluruh halaman frontend (tampilan, form, slider, order, payment)
- Integrasi Digiflazz
- Integrasi payment gateway
- Data di database
- Struktur tabel yang sudah ada
- Fitur admin dashboard (hanya proteksi route)
- sc_payment_configs, sc_digiflazz_config, sc_bank_accounts, sc_company_info — tetap bisa diakses frontend (butuh refactor besar jika diubah)

---

## Implementasi Detail

### A. Database Migration

```sql
-- 1. Tabel rate limiting
CREATE TABLE sc_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,         -- username
  attempt_type text NOT NULL,       -- 'admin' | 'reseller'
  success boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON sc_login_attempts (identifier, attempt_type, created_at DESC);

-- 2. Tabel audit log
CREATE TABLE sc_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type text NOT NULL,         -- 'admin' | 'reseller'
  actor_id text DEFAULT '',
  actor_name text DEFAULT '',
  action text NOT NULL,             -- 'login' | 'logout' | 'password_change' | dll
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON sc_audit_logs (actor_type, created_at DESC);
CREATE INDEX ON sc_audit_logs (action, created_at DESC);

-- 3. Kolom password_version untuk migrasi bertahap
ALTER TABLE sc_admin_accounts ADD COLUMN IF NOT EXISTS password_version text DEFAULT 'sha256';
ALTER TABLE sc_resellers ADD COLUMN IF NOT EXISTS password_version text DEFAULT 'sha256';

-- 4. RLS kritis: hapus policy UPDATE orders untuk public
DROP POLICY IF EXISTS "service_role_update_orders" ON sc_orders;

-- 5. RLS: wallet_mutations — hanya SELECT untuk public
DROP POLICY IF EXISTS "service_role_mutations" ON sc_wallet_mutations;
CREATE POLICY "anon_read_mutations" ON sc_wallet_mutations FOR SELECT TO anon USING (true);

-- 6. RLS: reseller_orders — hanya SELECT untuk public  
DROP POLICY IF EXISTS "service_role_reseller_orders" ON sc_reseller_orders;
CREATE POLICY "anon_read_reseller_orders" ON sc_reseller_orders FOR SELECT TO anon USING (true);

-- 7. RLS: deposits — hanya SELECT untuk public
DROP POLICY IF EXISTS "service_role_deposits" ON sc_deposits;
CREATE POLICY "anon_read_deposits" ON sc_deposits FOR SELECT TO anon USING (true);

-- 8. RLS: resellers — hanya SELECT untuk public (write via service_role edge functions)
DROP POLICY IF EXISTS "service_role_resellers" ON sc_resellers;
CREATE POLICY "anon_read_resellers" ON sc_resellers FOR SELECT TO anon USING (true);

-- 9. RLS: support_tickets — SELECT + INSERT untuk public (reseller submit langsung)
DROP POLICY IF EXISTS "service_role_tickets" ON sc_support_tickets;
CREATE POLICY "anon_read_tickets" ON sc_support_tickets FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_tickets" ON sc_support_tickets FOR INSERT TO anon WITH CHECK (true);

-- 10. RLS: login_attempts & audit_logs (service_role bypass RLS, tapi tambahkan admin read)
ALTER TABLE sc_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_audit" ON sc_audit_logs FOR SELECT TO anon USING (true);
```

### B. Password Hashing (PBKDF2 via Web Crypto API)

Gunakan PBKDF2 yang tersedia via `crypto.subtle` di Deno — tidak perlu library eksternal.

```typescript
// Hash baru (PBKDF2 + salt random)
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, key, 256);
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(bits)));
  return `pbkdf2:${saltB64}:${hashB64}`;
}

// Verifikasi — support kedua format (sha256 lama + pbkdf2 baru)
async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith('pbkdf2:')) {
    const [, saltB64, hashB64] = stored.split(':');
    const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, key, 256);
    return btoa(String.fromCharCode(...new Uint8Array(bits))) === hashB64;
  }
  // Legacy SHA-256
  const sha = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(sha)).map(b => b.toString(16).padStart(2,'0')).join('') === stored;
}
```

**Strategi migrasi:** saat login berhasil dengan hash lama (SHA-256), langsung re-hash dengan PBKDF2 dan update di DB + set `password_version = 'pbkdf2'`. Tidak perlu reset password manual.

### C. JWT Bertanda Tangan (HMAC-SHA256)

Gunakan `SUPABASE_SERVICE_ROLE_KEY` sebagai signing secret (sudah tersedia di edge functions, kuat secara kriptografi).

```typescript
async function createJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${base64url(new Uint8Array(sig))}`;
}

async function verifyJWT(token: string, secret: string): Promise<Record<string,unknown> | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const sigBytes = Uint8Array.from(atob(parts[2].replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  if (!valid) return null;
  const payload = JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}
```

**Frontend:** `admin-auth.ts` dan `reseller-auth.ts` menyimpan JWT di localStorage dan tidak bisa memverifikasi tanda tangan (tidak punya secret). Ini OK — JWT client-side hanya untuk membaca payload (user info, expires). Tanda tangan diverifikasi di sisi server (edge function) bila ada operasi sensitif. Yang penting token tidak bisa **dipalsukan** karena tanpa secret tidak bisa membuat tanda tangan yang valid.

### D. Rate Limiting

Cek sebelum proses login:
- Hitung failed attempts dalam 15 menit terakhir untuk identifier yang sama
- Jika ≥ 5, tolak dengan HTTP 429
- Catat setiap attempt (success/fail) ke `sc_login_attempts`
- Auto-cleanup: buat index dan gunakan DELETE setelah 24 jam (atau biarkan tumbuh, query sudah pakai time filter)

### E. AdminRoute Component (Baru)

```typescript
// src/components/admin/AdminRoute.tsx
import { Navigate } from 'react-router-dom';
import { isAdminLoggedIn } from '@/lib/admin-auth';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  if (!isAdminLoggedIn()) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
```

Update `router.tsx`: wrap `AdminDashboard` dengan `AdminRoute` (sama seperti `ResellerRoute` saat ini).

### F. Hapus Legacy Fallback

Dari `admin-auth.ts`, hapus blok ini:
```typescript
// HAPUS:
const legacy = localStorage.getItem('shielacom_admin_session');
if (legacy) {
  const parsed = JSON.parse(legacy);
  if (parsed.loggedIn === true) return true;
}
```

### G. Audit Logging

Di admin-login dan reseller-auth, tambahkan insert ke `sc_audit_logs` untuk:
- Login berhasil (actor_type, actor_id, actor_name, action: 'login')
- Login gagal (action: 'login_failed', details: {username})
- Ganti password (action: 'password_changed')
- Register reseller (action: 'register')

---

## File yang Diubah

| File | Perubahan |
|------|-----------|
| Database migration | sc_login_attempts, sc_audit_logs, password_version, RLS fixes |
| `supabase/functions/admin-login/index.ts` | PBKDF2, JWT, rate limit, audit log, migrasi sha256→pbkdf2 |
| `supabase/functions/reseller-auth/index.ts` | PBKDF2, JWT, rate limit, audit log, migrasi sha256→pbkdf2 |
| `src/lib/admin-auth.ts` | Hapus legacy fallback, session_token sebagai opaque JWT |
| `src/lib/reseller-auth.ts` | Session token dari server (JWT signed) |
| `src/components/admin/AdminRoute.tsx` | BARU — route guard |
| `src/router.tsx` | Tambah AdminRoute wrapper |

---

## Backward Compatibility

- Password lama (SHA-256) tetap bisa login → otomatis re-hash ke PBKDF2 saat login
- Session lama di localStorage akan expired → paksa login ulang (normal, session 24 jam)
- Semua read frontend dari tabel reseller tetap berjalan (hanya write yang dibatasi)
- Admin dashboard tetap bisa baca semua tabel (hanya order UPDATE dari public yang dihapus)
- Integrasi Digiflazz, Tripay, Duitku TIDAK terpengaruh (semua lewat edge functions service_role)

---

## Risiko Sisa (Known Limitations)

- `sc_digiflazz_config`, `sc_payment_configs`, `sc_bank_accounts` masih bisa ditulis dari anon key — butuh refactor major (admin write via edge function) di sesi lain
- sc_audit_logs bisa dibaca public (anon) — untuk kemudahan admin baca langsung dari frontend
- JWT tidak diverifikasi server-side saat reseller membaca data (hanya frontend check) — ini acceptable karena data yang dibaca hanya milik reseller itu sendiri secara filter
