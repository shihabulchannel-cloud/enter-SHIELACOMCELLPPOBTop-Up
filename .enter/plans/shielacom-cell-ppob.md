# SHIELACOM CELL — Full Automated Transaction System
## (UniPin/Codashop/Tokogame Style)

## Context
Transform the website from a "redirect to WhatsApp" model to a fully automated PPOB e-commerce platform. Customers can browse, select, pay, and receive digital products entirely on the website without any manual intervention. WhatsApp is used only for support and reseller registration.

---

## Architecture

### Supabase Database (3 core tables)

**`sc_products`** — Product catalog synced from Digiflazz
```sql
id, sku, name, category_id, brand, description,
buy_price, sell_price, markup, active,
provider, provider_code, created_at
```

**`sc_orders`** — Customer orders
```sql
id, invoice_id (unique), product_sku, product_name, product_price,
buyer_name, buyer_email, buyer_whatsapp,
target (game_id / phone / account),
target_detail (server_id, etc),
payment_method, payment_gateway, payment_amount, payment_fee,
payment_status (pending/paid/expired/failed),
payment_code (VA number / QRIS / instructions),
payment_url,
order_status (waiting_payment/processing/success/failed/refunded),
digiflazz_ref, digiflazz_status,
notes, created_at, updated_at, expired_at
```

**`sc_payment_configs`** — Payment gateway configs (admin-managed)
```sql
gateway (duitku/ipaymu/tripay), config_json (encrypted), active
```

### Supabase Edge Functions (5 functions)

1. **`create-order`** — Create order + initiate payment
   - Input: product_sku, target, buyer info, payment_method, gateway
   - Creates order in DB with invoice_id
   - Calls Duitku/iPaymu/Tripay API to get payment code/URL
   - Returns: invoice_id, payment_instructions, payment_url, expired_at

2. **`payment-webhook`** — Receive callback from payment gateway
   - Validates webhook signature
   - Updates order payment_status → 'paid'
   - Immediately calls Digiflazz to process the order
   - Updates order_status → 'processing'

3. **`digiflazz-webhook`** — Receive callback from Digiflazz
   - Updates order_status → 'success' or 'failed'
   - On 'failed': triggers refund process

4. **`check-order`** — Public endpoint to check order status
   - Input: invoice_id + buyer_email (or whatsapp)
   - Returns full order status for customer display

5. **`sync-products`** — Sync products from Digiflazz price list API
   - Called manually from admin dashboard
   - Also scheduled periodic sync

### Frontend New Pages & Components

**New Routes:**
- `/order/:productSku` — Order page for specific product
- `/payment/:invoiceId` — Payment instructions page
- `/order-status/:invoiceId` — Order result/tracking page

**New Components:**
- `src/components/order/OrderForm.tsx` — Unified order form
  - Target input (game ID+server, phone number, VA number)
  - Buyer info (name, email/WA for receipt)
  - Product variant selector (denomination selector)
- `src/components/order/PaymentMethodSelector.tsx`
  - Group by type: QRIS, Virtual Account, Transfer Bank, E-Wallet
  - Show fee per method
- `src/components/order/OrderSummary.tsx` — Price breakdown before confirm
- `src/components/order/PaymentInstructions.tsx` — Show VA number / QRIS / transfer instructions with copy button + countdown timer

**Updated Pages:**
- `src/pages/Products.tsx` — Product cards now link to `/order/:sku` instead of WA
- `src/pages/CekTransaksi.tsx` — Updated to call `check-order` edge function
- `src/pages/Order.tsx` (new) — Full order flow: select variant → fill form → pay
- `src/pages/Payment.tsx` (new) — Payment instructions with status polling
- `src/pages/OrderStatus.tsx` (new) — Success/failed receipt page

---

## Customer Transaction Flow

```
1. [Browse Products] → /products or / (homepage)
2. [Click Product Card] → /order/:productSku
3. [Order Page]
   - Select denomination (e.g. 86 Diamonds, 172 Diamonds)
   - Enter target (Game UserID + ServerID OR phone number)
   - Enter buyer name + email/WA
   - Select payment method (QRIS / VA / Transfer)
   - See total price breakdown
   - Click "Bayar Sekarang"
4. [API: create-order] → invoice_id created, payment initiated
5. [Payment Page] /payment/:invoiceId
   - Show payment instructions (VA number / QRIS image / transfer details)
   - Countdown timer (1 hour expiry)
   - Auto-poll status every 5 seconds
   - WhatsApp "confirm payment" button (optional manual confirm)
6. [Webhook: payment-gateway → Digiflazz] (AUTOMATIC)
7. [Order Status Page] /order-status/:invoiceId
   - SUCCESS: Show SN/serial number, receipt download
   - FAILED: Show error message + refund info
   - PROCESSING: Show progress animation
```

---

## Supabase Migration SQL

```sql
-- Products
CREATE TABLE sc_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  category_id text NOT NULL,
  brand text DEFAULT '',
  description text DEFAULT '',
  buy_price integer NOT NULL DEFAULT 0,
  sell_price integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  provider text DEFAULT 'digiflazz',
  provider_code text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sc_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active products" ON sc_products FOR SELECT USING (active = true);
CREATE POLICY "Service role full access" ON sc_products USING (true) WITH CHECK (true);

-- Orders
CREATE TABLE sc_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id text UNIQUE NOT NULL,
  product_sku text NOT NULL,
  product_name text NOT NULL,
  product_price integer NOT NULL,
  buyer_name text NOT NULL,
  buyer_email text DEFAULT '',
  buyer_whatsapp text DEFAULT '',
  target text NOT NULL,
  target_detail text DEFAULT '',
  payment_method text DEFAULT '',
  payment_gateway text DEFAULT '',
  payment_amount integer NOT NULL,
  payment_fee integer DEFAULT 0,
  payment_status text DEFAULT 'pending',
  payment_code text DEFAULT '',
  payment_url text DEFAULT '',
  order_status text DEFAULT 'waiting_payment',
  digiflazz_ref text DEFAULT '',
  digiflazz_sn text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expired_at timestamptz DEFAULT (now() + interval '1 hour')
);
ALTER TABLE sc_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert orders" ON sc_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view own order by invoice" ON sc_orders FOR SELECT USING (true);
CREATE POLICY "Service role update orders" ON sc_orders FOR UPDATE USING (true);

-- Payment Configs
CREATE TABLE sc_payment_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway text UNIQUE NOT NULL,
  config_json jsonb DEFAULT '{}',
  active boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE sc_payment_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON sc_payment_configs USING (false);

-- Digiflazz Config
CREATE TABLE sc_digiflazz_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text DEFAULT '',
  api_key text DEFAULT '',
  webhook_secret text DEFAULT '',
  active boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE sc_digiflazz_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON sc_digiflazz_config USING (false);

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE sc_orders;
```

---

## Edge Functions

### `create-order/index.ts`
- Validates product exists and is active (query `sc_products`)
- Generates `invoice_id` = `INV-{YYYYMMDD}-{random6}`
- Reads payment gateway config from `sc_payment_configs`
- Calls chosen gateway API to create payment:
  - **Tripay**: POST to `/transaction/create`
  - **Duitku**: POST to `/api/merchant/createInvoice`
  - **iPaymu**: POST to `/v2/payment`
- Inserts order to `sc_orders`
- Returns `{ invoice_id, payment_code, payment_url, payment_amount, expired_at }`

### `payment-webhook/index.ts`
- Handles POST from Duitku, iPaymu, Tripay (detects by `gateway` query param)
- Validates signature
- Finds order by invoice_id/reference
- Updates `payment_status = 'paid'`
- Calls Digiflazz API to place order (`transaction` endpoint)
- Updates `order_status = 'processing'`, saves `digiflazz_ref`
- Returns 200 OK

### `digiflazz-webhook/index.ts`
- Receives callback from Digiflazz
- Finds order by `digiflazz_ref`
- Updates `order_status` and `digiflazz_sn` (serial number)
- If status = 'Gagal': triggers refund logic

### `check-order/index.ts`
- GET `?invoice_id=INV-xxx`
- Returns order status, product name, target, timestamps
- Used by frontend polling and CekTransaksi page

### `sync-products/index.ts`
- Calls Digiflazz `price-list` API
- Upserts products to `sc_products`
- Called from admin dashboard

---

## Files to Create/Modify

### New Files:
- `supabase/functions/create-order/index.ts`
- `supabase/functions/payment-webhook/index.ts`
- `supabase/functions/digiflazz-webhook/index.ts`
- `supabase/functions/check-order/index.ts`
- `supabase/functions/sync-products/index.ts`
- `src/pages/Order.tsx` — Full order flow page
- `src/pages/Payment.tsx` — Payment instructions with countdown + polling
- `src/pages/OrderStatus.tsx` — Success/failed receipt
- `src/components/order/OrderForm.tsx`
- `src/components/order/PaymentMethodSelector.tsx`
- `src/components/order/OrderSummary.tsx`
- `src/components/order/PaymentInstructions.tsx`
- `src/lib/order-api.ts` — Frontend API calls to edge functions

### Modified Files:
- `src/pages/Products.tsx` — Cards link to `/order/:sku`
- `src/pages/CekTransaksi.tsx` — Use `check-order` edge function
- `src/router.tsx` — Add 3 new routes
- `src/components/admin/ProviderSettings.tsx` — Sync products from DB

---

## Payment Gateway Integration Notes

### Tripay (Primary)
- Endpoint: `https://tripay.co.id/api/transaction/create`
- Callback: receives `signature`, `invoice_ref`, `payment_method`, `status`
- Supported channels: BRIVA, BCAVA, MANDIRI, QRIS, OVO, DANA, SHOPEEPAY

### Duitku
- Endpoint: `https://passport.duitku.com/webapi/api/merchant/v2/inquiry`
- Callback: receives `merchantOrderId`, `resultCode`, `amount`

### iPaymu
- Endpoint: `https://sandbox.ipaymu.com/api/v2/payment`  
- Callback: receives `trx_id`, `status`, `va`

---

## Secrets Required (supabase_add_secret)
- `TRIPAY_API_KEY`
- `TRIPAY_MERCHANT_CODE`  
- `TRIPAY_PRIVATE_KEY`
- `DUITKU_MERCHANT_CODE`
- `DUITKU_API_KEY`
- `IPAYMU_VA`
- `IPAYMU_API_KEY`
- `DIGIFLAZZ_USERNAME`
- `DIGIFLAZZ_API_KEY`

---

## Verification
1. Admin goes to dashboard → Pengaturan Provider → Input Digiflazz credentials → Test Connection
2. Admin goes to Sync Products → products imported to Supabase
3. Admin goes to Payment Gateway → Configure Tripay/Duitku/iPaymu
4. Customer visits `/products` → clicks product → `/order/:sku` opens
5. Customer fills form → clicks Bayar → `create-order` called
6. Payment page shows VA/QRIS → simulated payment
7. Webhook fires → Digiflazz order placed → status updates to success
8. Customer can check status at `/order-status/:invoiceId`
