# Plan: Perbaikan Sistem Transaksi, Realtime Dashboard, dan Payment Gateway

## Context

Setelah audit lengkap, ditemukan 5 masalah utama:

1. **Status transaksi stuck PENDING** — `reseller-order` & `payment-webhook` sudah benar mengirim ke Digiflazz, namun jika response awal "Pending", webhook Digiflazz yang seharusnya update status belum terintegrasi dengan baik. Status normalization juga tidak meng-handle semua varian teks.

2. **AdminOverview menggunakan localStorage** — `AdminOverview` menggunakan `transactionStore.get()` yang adalah localStorage, bukan data DB asli. `TransactionsTable` fetch sekali tanpa subscription. Tidak ada realtime sama sekali.

3. **Dashboard Reseller tidak realtime** — `ResellerDashboard` dan `ResellerHistory` fetch sekali on mount. Ketika status transaksi berubah di DB, UI tidak update kecuali user refresh manual.

4. **Payment Gateway status dari localStorage** — `PaymentGatewaySettings` baca state dari `paymentGatewayStore` (localStorage), bukan dari DB. Saat halaman di-reload, status mungkin tidak sinkron dengan apa yang tersimpan di DB.

5. **SystemPanel Logs hanya localStorage** — Logs ditampilkan dari `systemLogStore` (localStorage), bukan dari tabel `sc_digiflazz_logs` yang sudah ada di DB dari sesi sebelumnya.

---

## Files to Modify

| File | Perubahan |
|------|-----------|
| `supabase/migrations/new` | Enable realtime pada tabel-tabel kritis |
| `supabase/functions/payment-webhook/index.ts` | Perbaiki status normalization + logging ke sc_digiflazz_logs |
| `src/components/admin/AdminOverview.tsx` | Ganti localStorage dengan DB + Supabase realtime subscription |
| `src/pages/AdminDashboard.tsx` | Perbaiki TransactionsTable — unified view sc_orders + sc_reseller_orders + realtime |
| `src/pages/reseller/Dashboard.tsx` | Tambah realtime subscription ke sc_reseller_orders + sc_resellers |
| `src/pages/reseller/History.tsx` | Tambah realtime subscription ke sc_reseller_orders |
| `src/components/admin/PaymentGatewaySettings.tsx` | Load dari DB on mount, status dari DB, test sebenarnya |
| `src/components/admin/SystemPanel.tsx` | Tambah tab "Provider Logs" dari sc_digiflazz_logs |

---

## Files NOT to Touch (aman dari perubahan)

- Semua halaman publik website (beranda, kontak, legal, footer)
- Digiflazz config / ProviderSettings (sudah diperbaiki sesi sebelumnya)
- reseller-auth, reseller-deposit edge functions
- sync-products, digiflazz-webhook (sudah diperbaiki sesi sebelumnya)
- create-order edge function
- check-order edge function
- Database tables yang sudah ada (tidak drop/reset)
- Saldo reseller, produk, konfigurasi provider

---

## Langkah Implementasi

### Step 1: Migration — Enable Realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE sc_reseller_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE sc_resellers;
ALTER PUBLICATION supabase_realtime ADD TABLE sc_deposits;
ALTER PUBLICATION supabase_realtime ADD TABLE sc_digiflazz_logs;
-- sc_orders sudah di-enable sebelumnya
```

### Step 2: Fix payment-webhook edge function

Tambahkan:
- Status normalization yang robust: `Sukses/sukses/Success/completed/delivered → success`, `Gagal/gagal/failed/error/cancelled → failed`
- Logging setiap Digiflazz request/response ke `sc_digiflazz_logs`
- Handle kasus "Pending" dari Digiflazz dengan benar (keep as "processing", biarkan webhook update nanti)

### Step 3: Fix AdminOverview — DB + Realtime

Ganti `transactionStore.get()` dengan query nyata:
```typescript
// Fetch combined orders from both tables
const [{ data: pubOrders }, { data: resOrders }] = await Promise.all([
  supabase.from('sc_orders').select('*').order('created_at', { ascending: false }).limit(50),
  supabase.from('sc_reseller_orders').select('*').order('created_at', { ascending: false }).limit(50),
]);
```

Tambah realtime subscription:
```typescript
const channel = supabase.channel('admin-rt')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'sc_orders' }, reload)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'sc_reseller_orders' }, reload)
  .subscribe();
// Cleanup on unmount: supabase.removeChannel(channel)
```

Hitung stats dari DB:
- Hari ini (today's date filter)
- Omset = sum(payment_amount) dari sc_orders + sum(product_price) dari sc_reseller_orders dengan status success
- Pending count dari kedua tabel
- Success/failed count

### Step 4: Fix TransactionsTable in AdminDashboard

- Gabungkan sc_orders + sc_reseller_orders dalam satu view (unified)
- Tag setiap row sebagai "Publik" atau "Reseller"
- Realtime subscription update tanpa refresh
- Filter: semua, menunggu, proses, sukses, gagal
- Tambah kolom "Tipe" (Publik/Reseller)

### Step 5: Fix Reseller Dashboard Realtime

Di `src/pages/reseller/Dashboard.tsx`:
```typescript
useEffect(() => {
  // Initial load
  load();
  // Realtime subscription
  const channel = supabase.channel(`reseller-${session.reseller_id}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'sc_reseller_orders',
      filter: `reseller_id=eq.${session.reseller_id}`
    }, () => load())
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'sc_resellers',
      filter: `id=eq.${session.reseller_id}`
    }, (payload) => {
      const newBalance = payload.new?.balance;
      if (newBalance !== undefined) {
        setBalance(newBalance);
        updateResellerBalance(newBalance);
      }
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}, [session?.reseller_id]);
```

Di `src/pages/reseller/History.tsx` — tambah subscription serupa.

### Step 6: Fix PaymentGatewaySettings — Load from DB

```typescript
// On mount, load from DB
useEffect(() => {
  supabase.from('sc_payment_configs').select('*')
    .then(({ data }) => {
      // Set state for each gateway from DB
      data?.forEach(cfg => {
        const json = cfg.config_json as Record<string, string>;
        if (cfg.gateway === 'duitku') {
          setDuitkuCfg({ merchantCode: json.merchant_code || '', apiKey: json.api_key || '', ..., enabled: cfg.active });
        }
        // etc. for tripay, ipaymu
      });
    });
}, []);
```

Setelah save → re-read dari DB untuk confirm. Tampilkan badge status dari `cfg.active` DB, bukan localStorage.

### Step 7: Fix SystemPanel — Provider Logs Tab

Tambah tab ke-4: **"Provider Logs"** yang menampilkan `sc_digiflazz_logs`:
- Load 50 log terbaru
- Filter by action: transaction, cek_saldo, webhook, price_list
- Expand untuk lihat request body + response body
- Color code: success = hijau, failed = merah
- Refresh button + realtime update

---

## Status Normalization (shared helper)

Buat fungsi yang dipakai di payment-webhook dan bisa di-reference di frontend:

```typescript
function normalizeDigiflazzStatus(status: string | undefined): 'success' | 'failed' | 'processing' {
  if (!status) return 'processing';
  const s = status.toLowerCase().trim();
  if (['sukses', 'success', 'completed', 'delivered'].includes(s)) return 'success';
  if (['gagal', 'failed', 'error', 'cancelled', 'cancel'].includes(s)) return 'failed';
  return 'processing';  // pending, process, waiting, etc
}
```

---

## Verification

Setelah implementasi:
1. Buka Admin → Dashboard → stats harus tampil dari DB, bukan 0
2. Buat transaksi reseller → status berubah otomatis di dashboard reseller tanpa refresh
3. Buka Admin → Transaksi → tampil gabungan sc_orders + sc_reseller_orders
4. Perubahan status di DB → admin dashboard update < 2 detik
5. Admin → Payment Gateway → simpan → status langsung aktif tanpa reload
6. Admin → Sistem → Provider Logs → tampil log dari DB
7. Reseller History → status update otomatis tanpa refresh
