# Plan: Manual Payment System (Fallback)

## Context
Add a "Transfer Bank / QRIS Manual" payment option for public buyers as a fallback while payment gateways are not yet configured. Customer orders, uploads payment proof, admin verifies, then system automatically submits to Digiflazz. All existing features (Digiflazz, reseller, dashboard, products) are untouched.

---

## Root Cause / Existing Architecture

- `sc_orders` is the orders table; `order_status` and `payment_status` drive the flow
- `Payment.tsx` → `/payment/:invoiceId` handles the payment waiting page
- `create-order` edge function creates the order and optionally calls payment gateways
- `sc_bank_accounts` table already exists (for reseller deposits) — reuse it
- `ResellerDeposit.tsx` already shows the pattern for file upload (base64 via FileReader) — reuse
- `BankAccountSettings.tsx` already exists — reuse in admin manual config panel
- `payment-methods.ts` is the central list of payment methods

---

## What Will Change

| File | Change type |
|---|---|
| `supabase/migrations/migration_manual_pay` | NEW — add columns to sc_orders, new sc_manual_payment_config table |
| `supabase/functions/process-manual-order/index.ts` | NEW — admin approve/reject with idempotency + Digiflazz submit |
| `supabase/functions/submit-payment-proof/index.ts` | NEW — customer uploads proof (base64), updates order |
| `src/lib/payment-methods.ts` | ADD — MANUAL method to list |
| `src/lib/order-api.ts` | ADD — payment_proof_url to OrderStatus interface |
| `src/pages/Payment.tsx` | ADD — manual payment section (QRIS + bank + upload proof) |
| `src/pages/OrderStatus.tsx` | ADD — handle rejected/cancelled statuses |
| `src/pages/CekTransaksi.tsx` | ADD — waiting_verification status display |
| `src/components/admin/ManualPaymentSettings.tsx` | NEW — QRIS + bank config for admin |
| `src/components/admin/PaymentVerification.tsx` | NEW — admin approve/reject payments |
| `src/pages/AdminDashboard.tsx` | ADD — nav items + section routing for manual payment |

## What Will NOT Change
- ProviderSettings, Digiflazz integration, reseller system, existing orders
- All gateway payment methods (Tripay, Duitku, iPaymu)
- ProductManager, CategoryManager, all content/legal pages
- ResellerPanel, ResellerDashboard, Deposits

---

## Database Migration (backward-compatible, additive only)

```sql
-- Add columns to sc_orders (safe, additive)
ALTER TABLE sc_orders
  ADD COLUMN IF NOT EXISTS payment_proof_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS reject_reason text DEFAULT '',
  ADD COLUMN IF NOT EXISTS manual_payment_type text DEFAULT '',
  ADD COLUMN IF NOT EXISTS digiflazz_sent boolean NOT NULL DEFAULT false;

-- QRIS config table (one row)
CREATE TABLE IF NOT EXISTS sc_manual_payment_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qris_image_url text DEFAULT '',
  qris_active boolean DEFAULT false,
  default_method text DEFAULT 'bank',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE sc_manual_payment_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_manual_cfg" ON sc_manual_payment_config FOR ALL TO public USING (true) WITH CHECK (true);

-- sort_order for bank accounts
ALTER TABLE sc_bank_accounts ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sc_manual_payment_config;
ALTER TABLE sc_manual_payment_config REPLICA IDENTITY FULL;
```

---

## New Edge Function: `submit-payment-proof`

Input: `{ invoice_id, image_base64, image_type, manual_payment_type }`
- Validate invoice exists and is MANUAL + payment_status = 'pending'
- Validate base64 size < 7MB (≈ 5MB file)
- Update sc_orders: payment_proof_url = image_base64, manual_payment_type
- Return: { success: true }

---

## New Edge Function: `process-manual-order`

Input: `{ invoice_id, action: 'approve' | 'reject', reject_reason? }`

**APPROVE flow:**
1. Fetch order from sc_orders
2. Validate: payment_status = 'pending', digiflazz_sent = false, payment_proof_url != ''
3. Atomic idempotency lock: `UPDATE sc_orders SET digiflazz_sent = true WHERE invoice_id = $1 AND digiflazz_sent = false`
4. If rows affected = 0 → return "sudah diproses"
5. Update: payment_status = 'paid', order_status = 'processing'
6. Load Digiflazz config from sc_digiflazz_config
7. Load product from sc_products by sku
8. Call Digiflazz /v1/transaction with proper MD5 signature
9. Log to sc_digiflazz_logs
10. Update order: order_status = normalizeStatus(df_status), digiflazz_sn, notes, digiflazz_ref
11. Return result

**REJECT flow:**
1. Validate: payment_status = 'pending', digiflazz_sent = false
2. Update: payment_status = 'rejected', order_status = 'cancelled', reject_reason
3. Return success

---

## Frontend: Payment.tsx (manual payment section)

When `order.payment_method === 'MANUAL'` or `order.payment_gateway === 'manual'`:

Show three sections:
1. **Instruksi**: "Lakukan transfer ke rekening berikut atau scan QRIS"
2. **QRIS** (if sc_manual_payment_config.qris_active = true): Show QRIS image with download button
3. **Bank Accounts**: List from sc_bank_accounts (active=true) with copy buttons
4. **Upload Bukti**: 
   - File input (jpg/jpeg/png, max 5MB)
   - Preview image
   - Submit button → calls submit-payment-proof edge function
   - After success: show "Bukti Terkirim — Menunggu Verifikasi Admin"

Status progression in Payment.tsx:
- `payment_proof_url = ''` → "Belum upload bukti"
- `payment_proof_url != ''` AND `payment_status = 'pending'` → "Menunggu Verifikasi"
- `payment_status = 'paid'` → redirect to OrderStatus

---

## Frontend: OrderStatus.tsx additions

Add handling for:
- `payment_status === 'rejected'` → "Pembayaran Ditolak" (red) + show reject_reason
- `order_status === 'cancelled'` → "Pesanan Dibatalkan"

---

## Frontend: CekTransaksi.tsx additions

Add to STATUS_CONFIG:
```typescript
waiting_verification: { label: 'Menunggu Verifikasi', icon: Clock, color: '...' }
```
Logic: if `order.payment_method === 'MANUAL'` AND `payment_proof_url` present AND status = waiting_payment → show "Menunggu Verifikasi"

---

## Admin: ManualPaymentSettings.tsx (new)

Tabs: **QRIS** | **Rekening Bank**

QRIS tab:
- Upload QR image (jpg/png, preview)
- Toggle aktif/nonaktif
- Simpan ke sc_manual_payment_config

Rekening Bank tab:
- Reuse/embed existing BankAccountSettings component (which reads sc_bank_accounts)
- Note: this is the same table used for reseller deposits

---

## Admin: PaymentVerification.tsx (new)

- Query: `sc_orders WHERE payment_method = 'MANUAL' AND payment_proof_url != '' ORDER BY created_at DESC`
- Group: Pending (payment_status='pending') | Selesai (paid/rejected)
- Each card shows: invoice, buyer name, product, target, amount, waktu upload, proof image preview (thumbnail)
- SETUJUI button → calls process-manual-order?action=approve (with loading + error)
- TOLAK button → modal for reason input, then process-manual-order?action=reject
- Realtime subscription to sc_orders (payment_method=MANUAL)
- Badge on nav item showing pending count

---

## AdminDashboard.tsx changes

Add to nav group "Laporan" OR new group "Pembayaran Manual":
```typescript
{ key: 'manual_payments', label: 'Verifikasi Pembayaran', icon: ClipboardCheck, badge: pendingManualPayments }
{ key: 'manual_config', label: 'Pengaturan Bayar Manual', icon: Settings2 }
```

Add to SectionContent router:
```typescript
case 'manual_payments': return <PaymentVerification />;
case 'manual_config': return <ManualPaymentSettings />;
```

Add state variable `pendingManualPayments` to track count via DB query.

---

## Payment Methods: payment-methods.ts

Add:
```typescript
{ id: 'MANUAL', label: 'Transfer Bank / QRIS Manual', gateway: 'manual', fee: 0, group: 'Transfer Manual' }
```

GROUP_COLORS: `'Transfer Manual': 'from-teal-500 to-teal-600'`

---

## order-api.ts: OrderStatus interface additions

```typescript
payment_proof_url: string;
reject_reason: string;
manual_payment_type: string;
digiflazz_sent: boolean;
```

---

## Verification / Test Cases

1. Customer selects "Transfer Manual" → creates order → redirected to /payment/:id
2. Payment page shows QRIS + bank accounts (if configured)
3. Customer uploads proof (jpg < 5MB) → proof saved → status shows "Menunggu Verifikasi"
4. Customer refreshes → still shows "Menunggu Verifikasi" (realtime keeps status)
5. Admin sees order in "Verifikasi Pembayaran" with proof preview
6. Admin clicks SETUJUI → order sent to Digiflazz → status updates to processing/success/failed
7. Admin clicks TOLAK → order cancelled with reason shown to customer
8. Double-click SETUJUI → second call rejected (idempotency lock)
9. Customer sees realtime update without refresh
10. Mobile responsive layout verified
11. Expired invoice (> 30 min): customer sees expired notice, cannot upload proof after expiry
