import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const bodyText = await req.text();
    console.log("[digiflazz-webhook] Raw body:", bodyText);

    let body: Record<string, unknown> = {};
    try { body = JSON.parse(bodyText); } catch { return new Response("OK", { status: 200, headers: corsHeaders }); }

    const { data: dfData } = body;
    if (!dfData) return new Response("OK", { status: 200, headers: corsHeaders });

    const { ref_id, status, sn, buyer_last_saldo, message, rc } = dfData as Record<string, string>;
    console.log(`[digiflazz-webhook] ref_id=${ref_id}, status=${status}, rc=${rc}, sn=${sn}`);

    if (!ref_id) return new Response("OK", { status: 200, headers: corsHeaders });

    // Log webhook to sc_digiflazz_logs
    await supabase.from("sc_digiflazz_logs").insert({
      action: "webhook",
      ref_id: ref_id,
      response_body: bodyText,
      http_status: 200,
      df_rc: String(rc || ""),
      df_status: String(status || ""),
      df_message: String(message || ""),
      df_sn: String(sn || ""),
      success: status === "Sukses",
    });

    // Update last_balance if available
    if (buyer_last_saldo !== undefined) {
      const bal = Number(buyer_last_saldo);
      if (!isNaN(bal)) {
        await supabase.from("sc_digiflazz_config").update({
          last_balance: bal,
          last_balance_checked: new Date().toISOString(),
        }).eq("provider", "digiflazz");
      }
    }

    // Invoice ID is ref_id minus the trailing timestamp segment
    // Pattern: INV-YYYYMMDD-XXXX-TIMESTAMP or RES-XXXXX-XXXX-TIMESTAMP
    const parts = ref_id.split("-");
    const invoiceId = parts.slice(0, -1).join("-");
    console.log(`[digiflazz-webhook] Parsed invoiceId=${invoiceId}`);

    let orderStatus = "processing";
    if (status === "Sukses") orderStatus = "success";
    else if (status === "Gagal") orderStatus = "failed";

    // Try sc_orders first (public orders)
    const { data: order } = await supabase.from("sc_orders").select("*").eq("invoice_id", invoiceId).maybeSingle();
    if (order) {
      console.log(`[digiflazz-webhook] Found in sc_orders: ${order.id}`);
      await supabase.from("sc_orders").update({
        order_status: orderStatus,
        digiflazz_sn: sn || "",
        notes: message || "",
        updated_at: new Date().toISOString(),
      }).eq("id", order.id);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Try sc_reseller_orders (reseller orders) — BUG FIX
    const { data: resellerOrder } = await supabase.from("sc_reseller_orders").select("*").eq("invoice_id", invoiceId).maybeSingle();
    if (resellerOrder) {
      console.log(`[digiflazz-webhook] Found in sc_reseller_orders: ${resellerOrder.id}`);
      const prevStatus = resellerOrder.order_status;
      await supabase.from("sc_reseller_orders").update({
        order_status: orderStatus,
        digiflazz_sn: sn || "",
        notes: message || "",
        updated_at: new Date().toISOString(),
      }).eq("id", resellerOrder.id);

      // If webhook says failed but order was processing, refund the balance
      if (orderStatus === "failed" && prevStatus !== "failed" && prevStatus !== "success") {
        const { data: reseller } = await supabase.from("sc_resellers").select("balance").eq("id", resellerOrder.reseller_id).maybeSingle();
        if (reseller) {
          const refundedBalance = (reseller.balance || 0) + resellerOrder.product_price;
          await supabase.from("sc_resellers").update({ balance: refundedBalance }).eq("id", resellerOrder.reseller_id);
          await supabase.from("sc_wallet_mutations").insert({
            reseller_id: resellerOrder.reseller_id, reseller_name: resellerOrder.reseller_name,
            type: "refund", amount: resellerOrder.product_price,
            balance_before: reseller.balance, balance_after: refundedBalance,
            description: `Refund via webhook: ${resellerOrder.product_name} — ${message}`,
            ref_id: resellerOrder.invoice_id,
          });
          console.log(`[digiflazz-webhook] Refund issued: Rp${resellerOrder.product_price} to reseller ${resellerOrder.reseller_id}`);
        }
      }
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    console.warn(`[digiflazz-webhook] Order not found for invoiceId=${invoiceId} (ref_id=${ref_id})`);
    return new Response("OK", { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error("[digiflazz-webhook] Error:", err);
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
