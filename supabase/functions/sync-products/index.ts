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
  const safe_add = (x: number, y: number) => { const lsw = (x & 0xffff) + (y & 0xffff); return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xffff); };
  const bit_rol = (num: number, cnt: number) => (num << cnt) | (num >>> (32 - cnt));
  const md5_ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => safe_add(bit_rol(safe_add(safe_add(a, F(b, c, d)), safe_add(x, t)), s), b);
  const md5_gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => safe_add(bit_rol(safe_add(safe_add(a, G(b, c, d)), safe_add(x, t)), s), b);
  const md5_hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => safe_add(bit_rol(safe_add(safe_add(a, H(b, c, d)), safe_add(x, t)), s), b);
  const md5_ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => safe_add(bit_rol(safe_add(safe_add(a, I(b, c, d)), safe_add(x, t)), s), b);

  for (let i = 0; i < x.length; i += 16) {
    const [olda, oldb, oldc, oldd] = [a, b, c, d];
    a = md5_ff(a,b,c,d,x[i],7,-680876936); d = md5_ff(d,a,b,c,x[i+1],12,-389564586); c = md5_ff(c,d,a,b,x[i+2],17,606105819); b = md5_ff(b,c,d,a,x[i+3],22,-1044525330);
    a = md5_ff(a,b,c,d,x[i+4],7,-176418897); d = md5_ff(d,a,b,c,x[i+5],12,1200080426); c = md5_ff(c,d,a,b,x[i+6],17,-1473231341); b = md5_ff(b,c,d,a,x[i+7],22,-45705983);
    a = md5_ff(a,b,c,d,x[i+8],7,1770035416); d = md5_ff(d,a,b,c,x[i+9],12,-1958414417); c = md5_ff(c,d,a,b,x[i+10],17,-42063); b = md5_ff(b,c,d,a,x[i+11],22,-1990404162);
    a = md5_ff(a,b,c,d,x[i+12],7,1804603682); d = md5_ff(d,a,b,c,x[i+13],12,-40341101); c = md5_ff(c,d,a,b,x[i+14],17,-1502002290); b = md5_ff(b,c,d,a,x[i+15],22,1236535329);
    a = md5_gg(a,b,c,d,x[i+1],5,-165796510); d = md5_gg(d,a,b,c,x[i+6],9,-1069501632); c = md5_gg(c,d,a,b,x[i+11],14,643717713); b = md5_gg(b,c,d,a,x[i],20,-373897302);
    a = md5_gg(a,b,c,d,x[i+5],5,-701558691); d = md5_gg(d,a,b,c,x[i+10],9,38016083); c = md5_gg(c,d,a,b,x[i+15],14,-660478335); b = md5_gg(b,c,d,a,x[i+4],20,-405537848);
    a = md5_gg(a,b,c,d,x[i+9],5,568446438); d = md5_gg(d,a,b,c,x[i+14],9,-1019803690); c = md5_gg(c,d,a,b,x[i+3],14,-187363961); b = md5_gg(b,c,d,a,x[i+8],20,1163531501);
    a = md5_gg(a,b,c,d,x[i+13],5,-1444681467); d = md5_gg(d,a,b,c,x[i+2],9,-51403784); c = md5_gg(c,d,a,b,x[i+7],14,1735328473); b = md5_gg(b,c,d,a,x[i+12],20,-1926607734);
    a = md5_hh(a,b,c,d,x[i+5],4,-378558); d = md5_hh(d,a,b,c,x[i+8],11,-2022574463); c = md5_hh(c,d,a,b,x[i+11],16,1839030562); b = md5_hh(b,c,d,a,x[i+14],23,-35309556);
    a = md5_hh(a,b,c,d,x[i+1],4,-1530992060); d = md5_hh(d,a,b,c,x[i+4],11,1272893353); c = md5_hh(c,d,a,b,x[i+7],16,-155497632); b = md5_hh(b,c,d,a,x[i+10],23,-1094730640);
    a = md5_hh(a,b,c,d,x[i+13],4,681279174); d = md5_hh(d,a,b,c,x[i],11,-358537222); c = md5_hh(c,d,a,b,x[i+3],16,-722521979); b = md5_hh(b,c,d,a,x[i+6],23,76029189);
    a = md5_hh(a,b,c,d,x[i+9],4,-640364487); d = md5_hh(d,a,b,c,x[i+12],11,-421815835); c = md5_hh(c,d,a,b,x[i+15],16,530742520); b = md5_hh(b,c,d,a,x[i+2],23,-995338651);
    a = md5_ii(a,b,c,d,x[i],6,-198630844); d = md5_ii(d,a,b,c,x[i+7],10,1126891415); c = md5_ii(c,d,a,b,x[i+14],15,-1416354905); b = md5_ii(b,c,d,a,x[i+5],21,-57434055);
    a = md5_ii(a,b,c,d,x[i+12],6,1700485571); d = md5_ii(d,a,b,c,x[i+3],10,-1894986606); c = md5_ii(c,d,a,b,x[i+10],15,-1051523); b = md5_ii(b,c,d,a,x[i+1],21,-2054922799);
    a = md5_ii(a,b,c,d,x[i+8],6,1873313359); d = md5_ii(d,a,b,c,x[i+15],10,-30611744); c = md5_ii(c,d,a,b,x[i+6],15,-1560198380); b = md5_ii(b,c,d,a,x[i+13],21,1309151649);
    a = md5_ii(a,b,c,d,x[i+4],6,-145523070); d = md5_ii(d,a,b,c,x[i+11],10,-1120210379); c = md5_ii(c,d,a,b,x[i+2],15,718787259); b = md5_ii(b,c,d,a,x[i+9],21,-343485551);
    a = safe_add(a, olda); b = safe_add(b, oldb); c = safe_add(c, oldc); d = safe_add(d, oldd);
  }

  const hex = (n: number) => Array.from({ length: 4 }, (_, i) => ((n >> (i * 8)) & 0xff).toString(16).padStart(2, "0")).join("");
  return hex(a) + hex(b) + hex(c) + hex(d);
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

  // Always return 200 so frontend can read the full response body
  const respond = (result: Record<string, unknown>) =>
    new Response(JSON.stringify({ ...result, logs }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    log("=== SYNC PRODUK DIGIFLAZZ DIMULAI ===");

    // Step 1: Load config
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    log("STEP 1: Membaca konfigurasi Digiflazz dari database...");

    const { data: dfConfig, error: cfgErr } = await supabase.from("sc_digiflazz_config").select("*").maybeSingle();
    if (cfgErr) { log(`ERROR: Gagal baca config: ${cfgErr.message}`); return respond({ success: false, error: cfgErr.message }); }
    if (!dfConfig?.username || !dfConfig?.api_key) {
      log("ERROR: Username atau API Key belum diisi di pengaturan Digiflazz.");
      return respond({ success: false, error: "Digiflazz belum dikonfigurasi. Simpan Username dan API Key terlebih dahulu." });
    }
    log(`OK: Username = ${dfConfig.username}, API Key = ***${dfConfig.api_key.slice(-4)}`);

    // Step 2: Build signature
    log("STEP 2: Membuat signature MD5...");
    const signStr = `${dfConfig.username}${dfConfig.api_key}pricelist`;
    const sign = md5(signStr);
    log(`OK: Signature MD5 = ${sign}`);

    // Step 3: Call Digiflazz API
    log("STEP 3: Memanggil API Digiflazz (price-list)...");
    const requestBody = { cmd: "prepaid", username: dfConfig.username, sign };
    log(`Request: POST https://api.digiflazz.com/v1/price-list`);
    log(`Body: ${JSON.stringify({ cmd: "prepaid", username: dfConfig.username, sign: "***" })}`);

    const res = await fetch("https://api.digiflazz.com/v1/price-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    log(`HTTP Status: ${res.status} ${res.statusText}`);
    if (!res.ok) {
      const errText = await res.text();
      log(`ERROR: HTTP ${res.status} - ${errText}`);
      return respond({ success: false, error: `Digiflazz API HTTP Error: ${res.status}`, detail: errText });
    }

    // Step 4: Parse response
    log("STEP 4: Memproses response Digiflazz...");
    const responseData = await res.json();
    const rc = responseData.rc;
    log(`RC (Response Code): ${rc}`);
    log(`Pesan: ${responseData.message || "-"}`);

    if (rc !== "00") {
      log(`ERROR: RC bukan 00 — artinya signature atau kredensial salah!`);
      log(`Detail response: ${JSON.stringify(responseData)}`);
      return respond({ success: false, error: `Digiflazz error RC=${rc}: ${responseData.message || "Kredensial tidak valid"}`, detail: responseData });
    }

    if (!responseData.data || !Array.isArray(responseData.data)) {
      log("ERROR: Field 'data' tidak ada atau bukan array di response Digiflazz");
      log(`Response: ${JSON.stringify(responseData).slice(0, 500)}`);
      return respond({ success: false, error: "Format response Digiflazz tidak valid", detail: responseData });
    }

    const products = responseData.data;
    log(`SUKSES: Diterima ${products.length} produk dari Digiflazz`);

    // Step 5: Save to database in batches
    log("STEP 5: Menyimpan produk ke database (batch 100)...");
    let synced = 0, skipped = 0;
    const dbErrors: string[] = [];
    const BATCH = 100;

    for (let i = 0; i < products.length; i += BATCH) {
      const chunk = products.slice(i, i + BATCH);
      const rows = chunk
        .filter((p: Record<string, unknown>) => p.buyer_sku_code && p.product_name)
        .map((p: Record<string, unknown>) => ({
          sku: p.buyer_sku_code as string,
          name: p.product_name as string,
          category_id: mapCategory(p.category as string || ""),
          brand: (p.brand as string) || "",
          buy_price: parseInt(p.price as string) || 0,
          sell_price: (parseInt(p.price as string) || 0) + 1000,
          active: p.buyer_product_status === true && p.seller_product_status === true,
          provider: "digiflazz",
          provider_code: p.buyer_sku_code as string,
          updated_at: new Date().toISOString(),
        }));

      skipped += chunk.length - rows.length;

      const { error: upsertErr } = await supabase.from("sc_products").upsert(rows, { onConflict: "sku" });
      if (upsertErr) {
        log(`ERROR batch ${i / BATCH + 1}: ${upsertErr.message}`);
        dbErrors.push(upsertErr.message);
        skipped += rows.length;
      } else {
        synced += rows.length;
        log(`Batch ${i / BATCH + 1}/${Math.ceil(products.length / BATCH)}: OK (+${rows.length} produk)`);
      }
    }

    log(`=== SELESAI: ${synced} berhasil, ${skipped} dilewati, ${dbErrors.length} error ===`);
    return respond({ success: true, synced, skipped, total: products.length, db_errors: dbErrors });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`EXCEPTION: ${msg}`);
    return respond({ success: false, error: msg });
  }
});
