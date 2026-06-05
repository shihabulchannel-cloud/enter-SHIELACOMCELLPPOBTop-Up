import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { md5 } from "https://esm.sh/js-md5@0.8.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function mapCategory(category: string): string {
  const c = (category || "").toLowerCase();
  if (c.includes("pulsa")) return "pulsa";
  if (c.includes("data") || c.includes("paket")) return "data";
  if (c.includes("game") || c.includes("voucher") || c.includes("diamond") || c.includes("garena") || c.includes("codashop")) return "game";
  if (c.includes("pln") || c.includes("token listrik")) return "pln";
  if (c.includes("gopay") || c.includes("ovo") || c.includes("dana") || c.includes("shopee") || c.includes("wallet") || c.includes("e-money")) return "ewallet";
  if (c.includes("bpjs") || c.includes("internet") || c.includes("tv") || c.includes("pdam") || c.includes("tagihan") || c.includes("multifinance")) return "ppob";
  return "pulsa";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: dfConfig } = await supabase.from("sc_digiflazz_config").select("*").maybeSingle();
    if (!dfConfig?.username || !dfConfig?.api_key) {
      return new Response(JSON.stringify({ error: "Digiflazz belum dikonfigurasi. Isi username dan API Key terlebih dahulu." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Signature resmi Digiflazz: md5(username + api_key + "pricelist")
    const sign = md5(`${dfConfig.username}${dfConfig.api_key}pricelist`);

    console.log("Fetching Digiflazz price list for username:", dfConfig.username);

    const res = await fetch("https://api.digiflazz.com/v1/price-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd: "prepaid", username: dfConfig.username, sign }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Digiflazz HTTP error:", res.status, errText);
      return new Response(JSON.stringify({ error: `Digiflazz API error: ${res.status}`, detail: errText }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const responseData = await res.json();
    console.log("Digiflazz response rc:", responseData.rc, "data count:", responseData.data?.length);

    if (!responseData.data || !Array.isArray(responseData.data)) {
      return new Response(JSON.stringify({ error: "Gagal mengambil price list dari Digiflazz", detail: responseData }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const products = responseData.data;
    let synced = 0;
    let skipped = 0;

    for (const p of products) {
      if (!p.buyer_sku_code || !p.product_name) { skipped++; continue; }
      const categoryId = mapCategory(p.category || "");
      const price = parseInt(p.price) || 0;
      const { error } = await supabase.from("sc_products").upsert({
        sku: p.buyer_sku_code,
        name: p.product_name,
        category_id: categoryId,
        brand: p.brand || "",
        buy_price: price,
        sell_price: price + 1000,
        active: p.buyer_product_status === true && p.seller_product_status === true,
        provider: "digiflazz",
        provider_code: p.buyer_sku_code,
        updated_at: new Date().toISOString(),
      }, { onConflict: "sku" });

      if (error) { console.error("upsert error:", error.message); skipped++; } else synced++;
    }

    return new Response(JSON.stringify({ success: true, synced, skipped, total: products.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sync-products error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
