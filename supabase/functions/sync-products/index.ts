import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey("raw", encoder.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function mapCategory(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("pulsa")) return "pulsa";
  if (c.includes("data") || c.includes("paket")) return "data";
  if (c.includes("game") || c.includes("voucher game") || c.includes("diamond") || c.includes("garena")) return "game";
  if (c.includes("pln") || c.includes("token")) return "pln";
  if (c.includes("gopay") || c.includes("ovo") || c.includes("dana") || c.includes("shopee") || c.includes("wallet")) return "ewallet";
  if (c.includes("bpjs") || c.includes("internet") || c.includes("tv") || c.includes("pdam")) return "ppob";
  return "pulsa";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: dfConfig } = await supabase.from("sc_digiflazz_config").select("*").maybeSingle();
    if (!dfConfig?.username || !dfConfig?.api_key) {
      return new Response(JSON.stringify({ error: "Digiflazz belum dikonfigurasi" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sign = await hmacSha256(dfConfig.api_key, `${dfConfig.username}${dfConfig.api_key}pricelist`);

    const res = await fetch("https://api.digiflazz.com/v1/price-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd: "prepaid", username: dfConfig.username, sign }),
    });

    const responseData = await res.json();
    if (!responseData.data || !Array.isArray(responseData.data)) {
      return new Response(JSON.stringify({ error: "Gagal mengambil price list dari Digiflazz", detail: responseData }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const products = responseData.data;
    let synced = 0;
    let skipped = 0;

    for (const p of products) {
      if (!p.buyer_sku_code || !p.product_name) continue;
      const categoryId = mapCategory(p.category || "");
      const { error } = await supabase.from("sc_products").upsert({
        sku: p.buyer_sku_code,
        name: p.product_name,
        category_id: categoryId,
        brand: p.brand || "",
        buy_price: parseInt(p.price) || 0,
        sell_price: parseInt(p.price) + 1000 || 1000,
        active: p.buyer_product_status && p.seller_product_status,
        provider: "digiflazz",
        provider_code: p.buyer_sku_code,
        updated_at: new Date().toISOString(),
      }, { onConflict: "sku" });

      if (error) { console.error(error); skipped++; } else synced++;
    }

    return new Response(JSON.stringify({ success: true, synced, skipped, total: products.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sync-products error:", err);
    return new Response(JSON.stringify({ error: "Terjadi kesalahan saat sync produk" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
