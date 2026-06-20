import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── MD5 (pure JS) ───────────────────────────────────────────────────────────
function md5(input: string): string {
  const str = unescape(encodeURIComponent(input));
  const x: number[] = [];
  for (let i = 0; i < str.length; i++) x[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8);
  const l = str.length * 8;
  x[l >> 5] |= 0x80 << (l % 32);
  x[(((l + 64) >>> 9) << 4) + 14] = l;
  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
  const F=(x:number,y:number,z:number)=>(x&y)|(~x&z),G=(x:number,y:number,z:number)=>(x&z)|(y&~z),H=(x:number,y:number,z:number)=>x^y^z,I=(x:number,y:number,z:number)=>y^(x|~z);
  const sa=(x:number,y:number)=>{const lsw=(x&0xffff)+(y&0xffff);return(((x>>16)+(y>>16)+(lsw>>16))<<16)|(lsw&0xffff);};
  const br=(n:number,c:number)=>(n<<c)|(n>>>(32-c));
  const ff=(a:number,b:number,c:number,d:number,x:number,s:number,t:number)=>sa(br(sa(sa(a,F(b,c,d)),sa(x,t)),s),b);
  const gg=(a:number,b:number,c:number,d:number,x:number,s:number,t:number)=>sa(br(sa(sa(a,G(b,c,d)),sa(x,t)),s),b);
  const hh=(a:number,b:number,c:number,d:number,x:number,s:number,t:number)=>sa(br(sa(sa(a,H(b,c,d)),sa(x,t)),s),b);
  const ii=(a:number,b:number,c:number,d:number,x:number,s:number,t:number)=>sa(br(sa(sa(a,I(b,c,d)),sa(x,t)),s),b);
  for (let i=0;i<x.length;i+=16){const[oa,ob,oc,od]=[a,b,c,d];
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

async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey("raw", encoder.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ─── Shared status normalizer ────────────────────────────────────────────────
function normalizeDigiflazzStatus(status: string | undefined): "success" | "failed" | "processing" {
  if (!status) return "processing";
  const s = status.toLowerCase().trim();
  if (["sukses", "success", "completed", "delivered", "berhasil", "paid"].includes(s)) return "success";
  if (["gagal", "failed", "error", "cancelled", "cancel", "reject", "rejected"].includes(s)) return "failed";
  return "processing"; // "Pending" and unknown → stay as processing
}

// ─── Log to DB ───────────────────────────────────────────────────────────────
async function logToDb(
  supabase: ReturnType<typeof createClient>,
  action: string,
  data: {
    ref_id?: string; invoice_id?: string;
    request_body?: string; response_body?: string;
    http_status?: number; df_rc?: string; df_status?: string;
    df_message?: string; df_sn?: string; success?: boolean;
  }
) {
  await supabase.from("sc_digiflazz_logs").insert({
    action, ref_id: data.ref_id || "", invoice_id: data.invoice_id || "",
    request_body: data.request_body || "", response_body: data.response_body || "",
    http_status: data.http_status || 0, df_rc: data.df_rc || "",
    df_status: data.df_status || "", df_message: data.df_message || "",
    df_sn: data.df_sn || "", success: data.success || false,
  });
}

// ─── Build customer_no from target + target_detail ──────────────────────────
// Rules (Digiflazz):
//   - Pulsa/Data/PLN/PPOB/E-Wallet: customer_no = target (nomor HP / ID pelanggan)
//   - Game tanpa Zone ID          : customer_no = target (user_id saja)
//   - Game dengan Zone ID         : customer_no = target(target_detail)
//     Contoh: Mobile Legends → 989386302(2222)
function buildCustomerNo(target: string, targetDetail: string | null | undefined): string {
  const t = (target || "").trim();
  const td = (targetDetail || "").trim();
  if (td) return `${t}(${td})`;
  return t;
}

// ─── Process Digiflazz transaction ─────────────────────────────────────────
async function processDigiflazzOrder(supabase: ReturnType<typeof createClient>, order: Record<string, unknown>) {
  const { data: dfConfig } = await supabase
    .from("sc_digiflazz_config").select("*").eq("provider", "digiflazz")
    .order("updated_at", { ascending: false }).limit(1).maybeSingle();

  if (!dfConfig?.username || !dfConfig?.api_key) {
    console.warn("[payment-webhook] Digiflazz config missing — order stays processing");
    await supabase.from("sc_orders").update({
      order_status: "processing", notes: "Menunggu diproses admin", updated_at: new Date().toISOString()
    }).eq("id", order.id);
    return;
  }

  const { data: product } = await supabase.from("sc_products").select("*")
    .eq("sku", order.product_sku as string).maybeSingle();
  if (!product) {
    console.warn("[payment-webhook] Product not found:", order.product_sku);
    return;
  }

  // Build customer_no — includes zone_id for games that need it
  const customerNo = buildCustomerNo(order.target as string, order.target_detail as string);
  const refId = `${order.invoice_id}-${Date.now()}`;
  const sign = md5(`${dfConfig.username}${dfConfig.api_key}${refId}`);
  const isTesting = dfConfig.testing === true;

  const requestPayload = {
    username: dfConfig.username,
    buyer_sku_code: product.provider_code,
    customer_no: customerNo,
    ref_id: refId,
    sign,
    testing: isTesting,
  };
  const requestBody = JSON.stringify(requestPayload);

  console.log(`[payment-webhook] Digiflazz request — invoice=${order.invoice_id}, sku=${product.provider_code}`);
  console.log(`[payment-webhook]   target="${order.target}", target_detail="${order.target_detail}", customer_no="${customerNo}"`);
  console.log(`[payment-webhook]   ref_id=${refId}, testing=${isTesting}`);

  let responseText = "";
  let httpStatus = 0;
  let dfStatus: "success" | "failed" | "processing" = "processing";
  let dfRc = "", dfMessage = "", dfSn = "";

  try {
    const res = await fetch("https://api.digiflazz.com/v1/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
    });
    httpStatus = res.status;
    responseText = await res.text();
    console.log(`[payment-webhook] Digiflazz response HTTP=${httpStatus}: ${responseText}`);

    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(responseText); } catch { /* keep empty */ }

    const inner = parsed.data as Record<string, unknown> | undefined;
    dfRc = String(inner?.rc || parsed.rc || "");
    dfMessage = String(inner?.message || parsed.message || "");
    dfSn = String(inner?.sn || "");
    const rawStatus = String(inner?.status || "");
    dfStatus = normalizeDigiflazzStatus(rawStatus);

    // Top-level error (no inner data object) → treat as failed
    // Note: "Pending" status always comes inside the data object, so this won't affect Pending
    if (!inner && dfRc && dfRc !== "00") {
      dfStatus = "failed";
    }

    console.log(`[payment-webhook] Parsed: status="${rawStatus}", normalized="${dfStatus}", rc="${dfRc}", message="${dfMessage}"`);

    // Log to DB
    await logToDb(supabase, "transaction", {
      ref_id: refId, invoice_id: String(order.invoice_id || ""),
      request_body: requestBody, response_body: responseText,
      http_status: httpStatus, df_rc: dfRc, df_status: rawStatus,
      df_message: dfMessage, df_sn: dfSn, success: dfStatus === "success",
    });

    await supabase.from("sc_orders").update({
      order_status: dfStatus,
      digiflazz_ref: refId,
      digiflazz_sn: dfSn,
      notes: dfMessage,
      updated_at: new Date().toISOString(),
    }).eq("id", order.id);

    console.log(`[payment-webhook] Order ${order.invoice_id} → ${dfStatus} (rc=${dfRc})`);

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[payment-webhook] Network error:", msg);
    await logToDb(supabase, "transaction", {
      ref_id: refId, invoice_id: String(order.invoice_id || ""),
      request_body: requestBody, response_body: `NETWORK_ERROR: ${msg}`,
      http_status: 0, df_rc: "NET_ERR", df_message: msg, success: false,
    });
    await supabase.from("sc_orders").update({
      order_status: "processing", digiflazz_ref: refId,
      notes: `Network error: ${msg}`, updated_at: new Date().toISOString(),
    }).eq("id", order.id);
  }
}

// ─── CORS ────────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-callback-token, x-callback-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── MAIN ────────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const url = new URL(req.url);
    const gateway = url.searchParams.get("gateway") || "tripay";
    const body = await req.text();

    console.log(`[payment-webhook] gateway=${gateway}, body length=${body.length}`);

    let payload: Record<string, unknown> = {};
    try { payload = JSON.parse(body); } catch {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Log the incoming webhook
    await logToDb(supabase, "webhook", {
      invoice_id: String(payload.merchant_ref || payload.merchantOrderId || payload.reference_id || ""),
      request_body: body, response_body: "",
      http_status: 200, df_message: `Payment webhook from ${gateway}`, success: true,
    });

    let invoiceId = "", isPaid = false;

    if (gateway === "tripay") {
      const { data: gwConfig } = await supabase.from("sc_payment_configs").select("*").eq("gateway", "tripay").maybeSingle();
      const privateKey = (gwConfig?.config_json as Record<string, string>)?.private_key || "";
      if (privateKey) {
        const callbackSig = req.headers.get("x-callback-signature") || "";
        const expectedSig = await hmacSha256(privateKey, body);
        if (callbackSig && callbackSig !== expectedSig) {
          console.warn("[payment-webhook] Tripay signature mismatch");
          return new Response("Signature invalid", { status: 400 });
        }
      }
      invoiceId = String(payload.merchant_ref || "");
      isPaid = payload.status === "PAID";
    } else if (gateway === "duitku") {
      invoiceId = String(payload.merchantOrderId || "");
      isPaid = payload.resultCode === "00";
    } else if (gateway === "ipaymu") {
      invoiceId = String(payload.reference_id || "");
      isPaid = payload.status === "berhasil" || payload.status_code === "1";
    } else {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    if (!invoiceId) {
      console.warn("[payment-webhook] No invoice ID found in payload");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const { data: order } = await supabase.from("sc_orders").select("*").eq("invoice_id", invoiceId).maybeSingle();
    if (!order) {
      console.warn(`[payment-webhook] Order not found: ${invoiceId}`);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }
    if (order.payment_status === "paid" || order.payment_status === "expired") {
      console.log(`[payment-webhook] Order ${invoiceId} already finalized: ${order.payment_status}`);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    if (isPaid) {
      await supabase.from("sc_orders").update({
        payment_status: "paid", order_status: "processing",
        updated_at: new Date().toISOString()
      }).eq("id", order.id);
      // Fire & forget Digiflazz — passes full order row including target_detail
      processDigiflazzOrder(supabase, { ...order, payment_status: "paid" });
    } else {
      await supabase.from("sc_orders").update({
        payment_status: "failed", order_status: "failed",
        updated_at: new Date().toISOString()
      }).eq("id", order.id);
    }

    return new Response("OK", { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error("[payment-webhook] Unhandled error:", err);
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
