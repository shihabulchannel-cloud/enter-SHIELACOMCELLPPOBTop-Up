import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Pure JS MD5 implementation (no external dep needed)
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
    const [oa,ob,oc,od]=[a,b,c,d];
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
    a=sa(a,oa);b=sa(b,ob);c=sa(c,oc);d=sa(d,od);
  }
  const hex=(n:number)=>Array.from({length:4},(_,i)=>((n>>(i*8))&0xff).toString(16).padStart(2,"0")).join("");
  return hex(a)+hex(b)+hex(c)+hex(d);
}

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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const logs: string[] = [];
  const log = (msg: string) => { console.log(msg); logs.push(msg); };
  const respond = (result: Record<string, unknown>) =>
    new Response(JSON.stringify({ ...result, logs }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    log("=== SYNC PRODUK DIGIFLAZZ DIMULAI ===");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    log("STEP 1: Membaca konfigurasi Digiflazz dari database...");
    const { data: dfConfig, error: cfgErr } = await supabase
      .from("sc_digiflazz_config")
      .select("*")
      .eq("provider", "digiflazz")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cfgErr) { log(`ERROR: ${cfgErr.message}`); return respond({ success: false, error: cfgErr.message }); }
    if (!dfConfig) return respond({ success: false, error: "Konfigurasi Digiflazz tidak ditemukan." });
    if (!dfConfig.username || !dfConfig.api_key) return respond({ success: false, error: "Username atau API Key belum diisi." });
    log(`OK: username=${dfConfig.username}`);

    log("STEP 2: Membuat signature MD5...");
    const sign = md5(`${dfConfig.username}${dfConfig.api_key}pricelist`);
    log(`OK: sign=${sign}`);

    log("STEP 3: Memanggil Digiflazz API price-list...");
    const res = await fetch("https://api.digiflazz.com/v1/price-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd: "prepaid", username: dfConfig.username, sign }),
    });
    log(`HTTP Status: ${res.status}`);

    if (!res.ok) {
      const errText = await res.text();
      return respond({ success: false, error: `HTTP ${res.status}: ${errText}` });
    }

    log("STEP 4: Parsing response...");
    const responseData = await res.json();
    const rc = responseData.rc;
    const apiMsg = responseData.message || "-";
    log(`Keys: ${Object.keys(responseData).join(", ")}, RC=${rc ?? "tidak ada"}, message=${apiMsg}`);

    // Handle sukses: data adalah array langsung
    if (!Array.isArray(responseData.data)) {
      const innerData = responseData.data;
      if (innerData && typeof innerData === "object" && innerData.rc) {
        const iRc = String(innerData.rc);
        const iMsg = String(innerData.message || "Error Digiflazz");
        log(`ERROR: data.rc=${iRc} — ${iMsg}`);
        if (iRc === "83") return respond({ success: false, error: `Rate limit Digiflazz: ${iMsg}. Tunggu beberapa menit lalu coba lagi.` });
        return respond({ success: false, error: `Digiflazz RC=${iRc}: ${iMsg}` });
      }
      if (rc && rc !== "00") return respond({ success: false, error: `Digiflazz RC=${rc}: ${apiMsg}` });
      log(`ERROR: data bukan array: ${JSON.stringify(responseData).slice(0, 300)}`);
      return respond({ success: false, error: `Format response tidak valid: ${JSON.stringify(responseData).slice(0, 150)}` });
    }

    const products = responseData.data;
    log(`OK: ${products.length} produk diterima`);

    log("STEP 5: Menyimpan ke database (batch 100)...");
    let synced = 0, skipped = 0;
    const dbErrors: string[] = [];
    const BATCH = 100;

    for (let i = 0; i < products.length; i += BATCH) {
      const chunk = products.slice(i, i + BATCH);
      const rows = chunk
        .filter((p: Record<string, unknown>) => p.buyer_sku_code && p.product_name)
        .map((p: Record<string, unknown>) => ({
          sku: String(p.buyer_sku_code),
          name: String(p.product_name),
          category_id: mapCategory(String(p.category || "")),
          brand: String(p.brand || ""),
          buy_price: parseInt(String(p.price)) || 0,
          sell_price: (parseInt(String(p.price)) || 0) + 1000,
          active: p.buyer_product_status === true && p.seller_product_status === true,
          provider: "digiflazz",
          provider_code: String(p.buyer_sku_code),
          updated_at: new Date().toISOString(),
        }));

      skipped += chunk.length - rows.length;
      if (rows.length === 0) continue;

      const { error: upsertErr } = await supabase.from("sc_products").upsert(rows, { onConflict: "sku" });
      if (upsertErr) {
        log(`ERROR batch ${Math.floor(i / BATCH) + 1}: ${upsertErr.message}`);
        dbErrors.push(upsertErr.message);
        skipped += rows.length;
      } else {
        synced += rows.length;
        if ((Math.floor(i / BATCH) + 1) % 5 === 0 || i + BATCH >= products.length) {
          log(`Batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(products.length / BATCH)} — tersimpan: ${synced}`);
        }
      }
    }

    // SAVE last_synced timestamp
    const now = new Date().toISOString();
    await supabase.from("sc_digiflazz_config").update({
      last_synced: now,
      updated_at: now,
    }).eq("provider", "digiflazz");

    log(`=== SELESAI: ${synced} berhasil, ${skipped} dilewati ===`);
    return respond({ success: true, synced, skipped, total: products.length, db_errors: dbErrors });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`EXCEPTION: ${msg}`);
    return respond({ success: false, error: msg });
  }
});
