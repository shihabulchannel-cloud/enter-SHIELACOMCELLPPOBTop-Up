import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { invoice_id, image_base64, image_type, manual_payment_type } = await req.json();

    if (!invoice_id || !image_base64) {
      return respond({ error: "invoice_id dan image_base64 wajib diisi" }, 400);
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (image_type && !allowedTypes.includes(image_type)) {
      return respond({ error: "Format file harus JPG atau PNG" }, 400);
    }

    const { data: order } = await supabase
      .from("sc_orders")
      .select("*")
      .eq("invoice_id", invoice_id)
      .maybeSingle();

    if (!order) return respond({ error: "Order tidak ditemukan" }, 404);
    if (order.payment_method !== "MANUAL") return respond({ error: "Order ini bukan pembayaran manual" }, 400);
    if (order.payment_proof_url) return respond({ error: "Bukti pembayaran sudah pernah dikirim" }, 400);
    if (order.payment_status === "paid" || order.payment_status === "rejected") {
      return respond({ error: "Pembayaran sudah diproses" }, 400);
    }

    const paymentProofUrl = image_base64.startsWith("data:")
      ? image_base64
      : `data:${image_type || "image/jpeg"};base64,${image_base64}`;

    const { error: updateError } = await supabase
      .from("sc_orders")
      .update({
        payment_proof_url: paymentProofUrl,
        manual_payment_type: manual_payment_type || "bank",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("[submit-payment-proof] Update error:", updateError.message);
      return respond({ error: "Gagal menyimpan bukti pembayaran" }, 500);
    }

    console.log(`[submit-payment-proof] Proof submitted for ${invoice_id}`);
    return respond({ success: true, message: "Bukti pembayaran berhasil dikirim" });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[submit-payment-proof] Exception:", msg);
    return respond({ error: "Terjadi kesalahan. Silakan coba lagi." }, 500);
  }
});
