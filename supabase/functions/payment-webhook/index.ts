import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-callback-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey("raw", encoder.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function processDigiflazzOrder(supabase: ReturnType<typeof createClient>, order: Record<string, unknown>) {
  const { data: dfConfig } = await supabase.from("sc_digiflazz_config").select("*").eq("active", true).maybeSingle();

  if (!dfConfig || !dfConfig.username || !dfConfig.api_key) {
    console.log("Digiflazz not configured, skipping automatic processing");
    await supabase.from("sc_orders").update({
      order_status: "processing",
      notes: "Menunggu diproses oleh admin",
      updated_at: new Date().toISOString(),
    }).eq("id", order.id);
    return;
  }

  const { data: product } = await supabase.from("sc_products").select("*").eq("sku", order.product_sku as string).maybeSingle();
  if (!product) return;

  const refId = `${order.invoice_id}-${Date.now()}`;
  const signature = await hmacSha256(dfConfig.api_key, `${dfConfig.username}${dfConfig.api_key}${refId}`);

  const dfBody = {
    username: dfConfig.username,
    buyer_sku_code: product.provider_code,
    customer_no: order.target as string,
    ref_id: refId,
    sign: signature,
    testing: true,
  };

  try {
    const res = await fetch("https://api.digiflazz.com/v1/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dfBody),
    });
    const data = await res.json();
    console.log("Digiflazz response:", JSON.stringify(data));

    const dfStatus = data.data?.status;
    await supabase.from("sc_orders").update({
      order_status: dfStatus === "Sukses" ? "success" : dfStatus === "Gagal" ? "failed" : "processing",
      digiflazz_ref: refId,
      digiflazz_sn: data.data?.sn || "",
      notes: data.data?.message || "",
      updated_at: new Date().toISOString(),
    }).eq("id", order.id);
  } catch (e) {
    console.error("Digiflazz API error:", e);
    await supabase.from("sc_orders").update({
      order_status: "processing",
      digiflazz_ref: refId,
      notes: "Sedang diproses",
      updated_at: new Date().toISOString(),
    }).eq("id", order.id);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const url = new URL(req.url);
    const gateway = url.searchParams.get("gateway") || "tripay";

    const body = await req.text();
    const payload = JSON.parse(body);
    console.log(`${gateway} webhook received:`, JSON.stringify(payload));

    let invoiceId = "";
    let isPaid = false;

    if (gateway === "tripay") {
      invoiceId = payload.merchant_ref || "";
      isPaid = payload.status === "PAID";
    } else if (gateway === "duitku") {
      invoiceId = payload.merchantOrderId || "";
      isPaid = payload.resultCode === "00";
    } else if (gateway === "ipaymu") {
      invoiceId = payload.reference_id || "";
      isPaid = payload.status === "berhasil" || payload.status_code === "1";
    }

    if (!invoiceId) {
      console.error("No invoice_id found in webhook payload");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const { data: order } = await supabase.from("sc_orders").select("*").eq("invoice_id", invoiceId).maybeSingle();
    if (!order) {
      console.error(`Order not found: ${invoiceId}`);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    if (order.payment_status === "paid" || order.payment_status === "expired") {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    if (isPaid) {
      await supabase.from("sc_orders").update({
        payment_status: "paid",
        order_status: "processing",
        updated_at: new Date().toISOString(),
      }).eq("id", order.id);

      await processDigiflazzOrder(supabase, { ...order, payment_status: "paid" });
    } else {
      await supabase.from("sc_orders").update({
        payment_status: "failed",
        order_status: "failed",
        updated_at: new Date().toISOString(),
      }).eq("id", order.id);
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("payment-webhook error:", err);
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
