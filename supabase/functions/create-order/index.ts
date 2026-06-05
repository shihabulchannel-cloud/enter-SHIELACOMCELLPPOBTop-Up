import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function generateInvoiceId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INV-${date}-${rand}`;
}

const PAYMENT_FEES: Record<string, number> = {
  QRIS: 0, BCAVA: 4000, BRIVA: 4000, MANDIRIVA: 4000, PERMATAVA: 4000,
  BNIVA: 4000, QRISC: 0, OVO: 0, DANA: 0, SHOPEEPAY: 0, GOPAY: 0,
};

function getPaymentFee(method: string): number {
  return PAYMENT_FEES[method] || 0;
}

async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const msgData = encoder.encode(message);
  const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function createTripayTransaction(
  config: Record<string, string>,
  order: { invoice_id: string; amount: number; product_name: string; buyer_name: string; buyer_email: string; buyer_phone: string; payment_method: string },
) {
  const isSandbox = config.sandbox === "true";
  const baseUrl = isSandbox ? "https://tripay.co.id/api-sandbox" : "https://tripay.co.id/api";
  const expiry = Math.floor(Date.now() / 1000) + 3600;
  const signature = await hmacSha256(config.private_key, `${config.merchant_code}${order.invoice_id}${order.amount}`);
  const siteUrl = Deno.env.get("SITE_URL") || "https://shielacomcell.com";
  const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook?gateway=tripay`;

  const res = await fetch(`${baseUrl}/transaction/create`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.api_key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      method: order.payment_method,
      merchant_ref: order.invoice_id,
      amount: order.amount,
      customer_name: order.buyer_name,
      customer_email: order.buyer_email || "customer@email.com",
      customer_phone: order.buyer_phone || "08123456789",
      order_items: [{ name: order.product_name, price: order.amount, quantity: 1 }],
      return_url: `${siteUrl}/order-status/${order.invoice_id}`,
      callback_url: callbackUrl,
      expired_time: expiry,
      signature,
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Tripay error");
  return { payment_code: data.data?.pay_code || data.data?.qr_string || "", payment_url: data.data?.checkout_url || "" };
}

async function createDuitkuTransaction(
  config: Record<string, string>,
  order: { invoice_id: string; amount: number; product_name: string; buyer_name: string; buyer_email: string; payment_method: string },
) {
  const isSandbox = config.sandbox === "true";
  const baseUrl = isSandbox ? "https://sandbox.duitku.com/webapi" : "https://passport.duitku.com/webapi";
  const sigRaw = `${config.merchant_code}${order.invoice_id}${order.amount}${config.api_key}`;
  const sigBytes = new TextEncoder().encode(sigRaw);
  const hashBuf = await crypto.subtle.digest("MD5", sigBytes).catch(() => crypto.subtle.digest("SHA-256", sigBytes));
  const signature = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const siteUrl = Deno.env.get("SITE_URL") || "https://shielacomcell.com";
  const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook?gateway=duitku`;

  const res = await fetch(`${baseUrl}/api/merchant/v2/inquiry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchantCode: config.merchant_code,
      paymentAmount: order.amount,
      merchantOrderId: order.invoice_id,
      productDetails: order.product_name,
      email: order.buyer_email || "customer@email.com",
      paymentMethod: order.payment_method,
      customerVaName: order.buyer_name,
      callbackUrl,
      returnUrl: `${siteUrl}/order-status/${order.invoice_id}`,
      signature,
      expiryPeriod: 60,
    }),
  });
  const data = await res.json();
  if (!data.paymentUrl) throw new Error(data.Message || "Duitku error");
  return { payment_code: data.vaNumber || "", payment_url: data.paymentUrl || "" };
}

function demoPay(method: string, invoiceId: string): { payment_code: string; payment_url: string } {
  const isVA = ["BCAVA", "BRIVA", "MANDIRIVA", "BNIVA", "PERMATAVA"].includes(method);
  return {
    payment_code: isVA ? `${Math.floor(Math.random() * 90000000000) + 10000000000}` : "",
    payment_url: "",
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json();
    const { product_sku, target, target_detail, buyer_name, buyer_email, buyer_whatsapp, payment_method, payment_gateway } = body;

    if (!product_sku || !target || !buyer_name || !payment_method || !payment_gateway) {
      return new Response(JSON.stringify({ error: "Data tidak lengkap" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: product } = await supabase.from("sc_products").select("*").eq("sku", product_sku).eq("active", true).maybeSingle();
    if (!product) return new Response(JSON.stringify({ error: "Produk tidak ditemukan" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: gwConfig } = await supabase.from("sc_payment_configs").select("*").eq("gateway", payment_gateway).maybeSingle();

    const paymentFee = getPaymentFee(payment_method);
    const totalAmount = product.sell_price + paymentFee;
    const invoiceId = generateInvoiceId();

    const config = (gwConfig?.config_json as Record<string, string>) || {};
    let paymentResult = { payment_code: "", payment_url: "" };

    if (gwConfig?.active && config.api_key) {
      try {
        const orderInfo = { invoice_id: invoiceId, amount: totalAmount, product_name: product.name, buyer_name, buyer_email: buyer_email || "", buyer_phone: buyer_whatsapp || "", payment_method };
        if (payment_gateway === "tripay") paymentResult = await createTripayTransaction(config, orderInfo);
        else if (payment_gateway === "duitku") paymentResult = await createDuitkuTransaction(config, orderInfo);
        else paymentResult = demoPay(payment_method, invoiceId);
      } catch (e) {
        console.error("Gateway error:", e);
        paymentResult = demoPay(payment_method, invoiceId);
      }
    } else {
      paymentResult = demoPay(payment_method, invoiceId);
    }

    const { data: newOrder, error: orderError } = await supabase.from("sc_orders").insert({
      invoice_id: invoiceId, product_sku: product.sku, product_name: product.name, product_price: product.sell_price,
      buyer_name, buyer_email: buyer_email || "", buyer_whatsapp: buyer_whatsapp || "",
      target, target_detail: target_detail || "",
      payment_method, payment_gateway, payment_amount: totalAmount, payment_fee: paymentFee,
      payment_status: "pending", payment_code: paymentResult.payment_code, payment_url: paymentResult.payment_url,
      order_status: "waiting_payment",
    }).select().single();

    if (orderError) throw orderError;

    return new Response(JSON.stringify({
      success: true, invoice_id: invoiceId, payment_method, payment_gateway,
      payment_code: paymentResult.payment_code, payment_url: paymentResult.payment_url,
      payment_amount: totalAmount, payment_fee: paymentFee, product_price: product.sell_price,
      product_name: product.name, buyer_name, target,
      expired_at: newOrder.expired_at, order_status: "waiting_payment",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("create-order error:", err);
    return new Response(JSON.stringify({ error: "Terjadi kesalahan. Silakan coba lagi." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
