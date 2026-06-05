import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function md5(input: string): string {
  const str = unescape(encodeURIComponent(input));
  const x: number[] = [];
  for (let i = 0; i < str.length; i++) x[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8);
  const l = str.length * 8;
  x[l >> 5] |= 0x80 << (l % 32);
  x[(((l + 64) >>> 9) << 4) + 14] = l;
  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
  const F = (x: number, y: number, z: number) => (x & y) | (~x & z);
  const G = (x: number, y: number, z: number) => (x & z) | (y & ~z);
  const H = (x: number, y: number, z: number) => x ^ y ^ z;
  const I = (x: number, y: number, z: number) => y ^ (x | ~z);
  const sa = (x: number, y: number) => { const lsw = (x & 0xffff) + (y & 0xffff); return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xffff); };
  const br = (n: number, c: number) => (n << c) | (n >>> (32 - c));
  const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => sa(br(sa(sa(a, F(b, c, d)), sa(x, t)), s), b);
  const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => sa(br(sa(sa(a, G(b, c, d)), sa(x, t)), s), b);
  const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => sa(br(sa(sa(a, H(b, c, d)), sa(x, t)), s), b);
  const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => sa(br(sa(sa(a, I(b, c, d)), sa(x, t)), s), b);
  for (let i = 0; i < x.length; i += 16) {
    const [oa, ob, oc, od] = [a, b, c, d];
    a=ff(a,b,c,d,x[i],7,-680876936);d=ff(d,a,b,c,x[i+1],12,-389564586);c=ff(c,d,a,b,x[i+2],17,606105819);b=ff(b,c,d,a,x[i+3],22,-1044525330);
    a=ff(a,b,c,d,x[i+4],7,-176418897);d=ff(d,a,b,c,x[i+5],12,1200080426);c=ff(c,d,a,b,x[i+6],17,-1473231341);b=ff(b,c,d,a,x[i+7],22,-45705983);
    a=ff(a,b,c,d,x[i+8],7,1770035416);d=ff(d,a,b,c,x[i+9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,-42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);
    a=ff(a,b,c,d,x[i+12],7,1804603682);d=ff(d,a,b,c,x[i+13],12,-40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);b=ff(b,c,d,a,x[i+15],22,1236535329);
    a=gg(a,b,c,d,x[i+1],5,-165796510);d=gg(d,a,b,c,x[i+6],9,-1069501632);c=gg(c,d,a,b,x[i+11],14,643717713);b=gg(b,c,d,a,x[i],20,-373897302);
    a=gg(a,b,c,d,x[i+5],5,-701558691);d=gg(d,a,b,c,x[i+10],9,38016083);c=gg(c,d,a,b,x[i+15],14,-660478335);b=gg(b,c,d,a,x[i+4],20,-405537848);
    a=gg(a,b,c,d,x[i+9],5,568446438);d=gg(d,a,b,c,x[i+14],9,-1019803690);c=gg(c,d,a,b,x[i+3],14,-187363961);b=gg(b,c,d,a,x[i+8],20,1163531501);
    a=gg(a,b,c,d,x[i+13],5,-1444681467);d=gg(d,a,b,c,x[i+2],9,-51403784);c=gg(c,d,a,b,x[i+7],14,1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);
    a=hh(a,b,c,d,x[i+5],4,-378558);d=hh(d,a,b,c,x[i+8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16,1839030562);b=hh(b,c,d,a,x[i+14],23,-35309556);
    a=hh(a,b,c,d,x[i+1],4,-1530992060);d=hh(d,a,b,c,x[i+4],11,1272893353);c=hh(c,d,a,b,x[i+7],16,-155497632);b=hh(b,c,d,a,x[i+10],23,-1094730640);
    a=hh(a,b,c,d,x[i+13],4,681279174);d=hh(d,a,b,c,x[i],11,-358537222);c=hh(c,d,a,b,x[i+3],16,-722521979);b=hh(b,c,d,a,x[i+6],23,76029189);
    a=hh(a,b,c,d,x[i+9],4,-640364487);d=hh(d,a,b,c,x[i+12],11,-421815835);c=hh(c,d,a,b,x[i+15],16,530742520);b=hh(b,c,d,a,x[i+2],23,-995338651);
    a=ii(a,b,c,d,x[i],6,-198630844);d=ii(d,a,b,c,x[i+7],10,1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);b=ii(b,c,d,a,x[i+5],21,-57434055);
    a=ii(a,b,c,d,x[i+12],6,1700485571);d=ii(d,a,b,c,x[i+3],10,-1894986606);c=ii(c,d,a,b,x[i+10],15,-1051523);b=ii(b,c,d,a,x[i+1],21,-2054922799);
    a=ii(a,b,c,d,x[i+8],6,1873313359);d=ii(d,a,b,c,x[i+15],10,-30611744);c=ii(c,d,a,b,x[i+6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21,1309151649);
    a=ii(a,b,c,d,x[i+4],6,-145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+2],15,718787259);b=ii(b,c,d,a,x[i+9],21,-343485551);
    a=sa(a,oa); b=sa(b,ob); c=sa(c,oc); d=sa(d,od);
  }
  const hex = (n: number) => Array.from({length:4}, (_,i) => ((n>>(i*8))&0xff).toString(16).padStart(2,"0")).join("");
  return hex(a)+hex(b)+hex(c)+hex(d);
}

function makeInvoiceId(): string {
  return `RES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const { reseller_id, product_sku, target, target_detail } = await req.json();
    if (!reseller_id || !product_sku || !target) return new Response(JSON.stringify({ error: "reseller_id, product_sku, dan target wajib diisi" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // 1. Load reseller
    const { data: reseller } = await supabase.from("sc_resellers").select("*").eq("id", reseller_id).maybeSingle();
    if (!reseller) return new Response(JSON.stringify({ error: "Reseller tidak ditemukan" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (reseller.status === "suspended") return new Response(JSON.stringify({ error: "Akun Anda dibekukan" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // 2. Load product
    const { data: product } = await supabase.from("sc_products").select("*").eq("sku", product_sku).eq("active", true).maybeSingle();
    if (!product) return new Response(JSON.stringify({ error: "Produk tidak tersedia" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const productPrice = product.buy_price;
    const markup = reseller.markup || 0;
    const sellPrice = productPrice + markup;

    // 3. Check balance
    if (reseller.balance < productPrice) {
      return new Response(JSON.stringify({ error: `Saldo tidak mencukupi. Saldo Anda: Rp${reseller.balance.toLocaleString()}, dibutuhkan: Rp${productPrice.toLocaleString()}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 4. Deduct balance
    const newBalance = reseller.balance - productPrice;
    await supabase.from("sc_resellers").update({ balance: newBalance, updated_at: new Date().toISOString() }).eq("id", reseller_id);

    // 5. Create order record
    const invoiceId = makeInvoiceId();
    const { data: order, error: orderErr } = await supabase.from("sc_reseller_orders").insert({
      reseller_id, reseller_name: reseller.name, invoice_id: invoiceId,
      product_sku, product_name: product.name, product_price: productPrice,
      markup, sell_price: sellPrice, target, target_detail: target_detail || "",
      order_status: "processing",
    }).select().single();
    if (orderErr) {
      // Rollback balance
      await supabase.from("sc_resellers").update({ balance: reseller.balance }).eq("id", reseller_id);
      return new Response(JSON.stringify({ error: orderErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 6. Add wallet mutation
    await supabase.from("sc_wallet_mutations").insert({
      reseller_id, reseller_name: reseller.name, type: "transaction",
      amount: productPrice, balance_before: reseller.balance, balance_after: newBalance,
      description: `Pembelian ${product.name} → ${target}`, ref_id: invoiceId,
    });

    // 7. Send to Digiflazz
    const { data: dfConfig } = await supabase.from("sc_digiflazz_config").select("*").eq("provider", "digiflazz").order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (dfConfig?.username && dfConfig?.api_key) {
      const refId = `${invoiceId}-${Date.now()}`;
      const sign = md5(`${dfConfig.username}${dfConfig.api_key}${refId}`);
      try {
        const res = await fetch("https://api.digiflazz.com/v1/transaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: dfConfig.username, buyer_sku_code: product.provider_code, customer_no: target, ref_id: refId, sign, testing: dfConfig.testing === true }),
        });
        const dfData = await res.json();
        const dfStatus = dfData.data?.status;
        const orderStatus = dfStatus === "Sukses" ? "success" : dfStatus === "Gagal" ? "failed" : "processing";
        await supabase.from("sc_reseller_orders").update({
          order_status: orderStatus, digiflazz_ref: refId,
          digiflazz_sn: dfData.data?.sn || "", notes: dfData.data?.message || "", updated_at: new Date().toISOString(),
        }).eq("id", order.id);

        // If failed, refund balance
        if (orderStatus === "failed") {
          await supabase.from("sc_resellers").update({ balance: reseller.balance }).eq("id", reseller_id);
          await supabase.from("sc_wallet_mutations").insert({
            reseller_id, reseller_name: reseller.name, type: "refund",
            amount: productPrice, balance_before: newBalance, balance_after: reseller.balance,
            description: `Refund gagal: ${product.name}`, ref_id: invoiceId,
          });
        }
        return new Response(JSON.stringify({ success: true, invoice_id: invoiceId, order_status: orderStatus, sn: dfData.data?.sn || "", new_balance: orderStatus === "failed" ? reseller.balance : newBalance }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (e) {
        console.error("Digiflazz error:", e);
      }
    }

    return new Response(JSON.stringify({ success: true, invoice_id: invoiceId, order_status: "processing", new_balance: newBalance }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
