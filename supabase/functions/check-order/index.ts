import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const url = new URL(req.url);
    const invoiceId = url.searchParams.get("invoice_id");

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "invoice_id diperlukan" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order, error } = await supabase
      .from("sc_orders")
      .select("*")
      .eq("invoice_id", invoiceId)
      .maybeSingle();

    if (error || !order) {
      return new Response(JSON.stringify({ error: "Order tidak ditemukan" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isExpired = order.payment_status === "pending" && new Date(order.expired_at) < new Date();
    // Don't auto-expire manual orders that already have a proof submitted (awaiting admin review)
    if (isExpired && order.order_status === "waiting_payment" && !order.payment_proof_url) {
      await supabase.from("sc_orders").update({ payment_status: "expired", order_status: "failed", updated_at: new Date().toISOString() }).eq("id", order.id);
      order.payment_status = "expired";
      order.order_status = "failed";
    }

    return new Response(JSON.stringify({ success: true, order }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("check-order error:", err);
    return new Response(JSON.stringify({ error: "Terjadi kesalahan" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
