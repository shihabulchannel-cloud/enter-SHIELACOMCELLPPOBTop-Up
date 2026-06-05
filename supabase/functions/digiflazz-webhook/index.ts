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
    const body = await req.json();
    console.log("Digiflazz webhook:", JSON.stringify(body));

    const { data: dfData } = body;
    if (!dfData) return new Response("OK", { status: 200, headers: corsHeaders });

    const { ref_id, status, sn, buyer_last_saldo, message } = dfData;
    if (!ref_id) return new Response("OK", { status: 200, headers: corsHeaders });

    const invoiceId = ref_id.split("-").slice(0, -1).join("-");

    const { data: order } = await supabase.from("sc_orders").select("*").eq("invoice_id", invoiceId).maybeSingle();
    if (!order) {
      console.error(`Order not found for ref_id: ${ref_id}`);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    let orderStatus = "processing";
    if (status === "Sukses") orderStatus = "success";
    else if (status === "Gagal") orderStatus = "failed";

    await supabase.from("sc_orders").update({
      order_status: orderStatus,
      digiflazz_sn: sn || "",
      notes: message || "",
      updated_at: new Date().toISOString(),
    }).eq("id", order.id);

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("digiflazz-webhook error:", err);
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
