import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── JWT Verification ─────────────────────────────────────────────────────────
async function verifyAdminJWT(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const sigBytes = Uint8Array.from(
      atob(parts[2].replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0),
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    if (!valid) return false;

    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    // Token kadaluarsa
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return false;
    // Harus role admin
    if (payload.role !== "admin") return false;
    return true;
  } catch {
    return false;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // 1. Validasi JWT admin
  // PENTING: token admin custom dibaca dari header X-Admin-Token, BUKAN Authorization.
  // Header Authorization dipakai gateway platform untuk kredensial proyek (anon/service key)
  // yang otomatis disisipkan oleh Supabase client SDK — jika ditimpa dengan JWT custom,
  // gateway menolak request SEBELUM sampai ke kode ini ("non-2xx status code").
  const token = req.headers.get("X-Admin-Token") || "";
  if (!token) return respond({ error: "Unauthorized: token tidak ada" }, 401);

  const jwtSecret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const isAdmin = await verifyAdminJWT(token, jwtSecret);
  if (!isAdmin) return respond({ error: "Unauthorized: token tidak valid atau kadaluarsa" }, 401);

  // 2. Koneksi database dengan service_role (bisa mutasi semua tabel)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    jwtSecret,
  );

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return respond({ error: "Request body tidak valid" }, 400);
  }

  const { action, payload } = body as { action: string; payload: Record<string, unknown> };

  try {
    // ── PRODUK ────────────────────────────────────────────────────────────────

    if (action === "product_update") {
      const { id, data } = payload as { id: string; data: Record<string, unknown> };
      const { error } = await supabase.from("sc_products").update(data).eq("id", id);
      if (error) return respond({ error: error.message }, 500);
      return respond({ success: true });
    }

    if (action === "product_insert") {
      const { data } = payload as { data: Record<string, unknown> };
      const { error } = await supabase.from("sc_products").insert(data);
      if (error) return respond({ error: error.message }, 500);
      return respond({ success: true });
    }

    if (action === "product_delete") {
      const { id } = payload as { id: string };
      const { error } = await supabase.from("sc_products").delete().eq("id", id);
      if (error) return respond({ error: error.message }, 500);
      return respond({ success: true });
    }

    if (action === "product_toggle") {
      const { id, active } = payload as { id: string; active: boolean };
      const { error } = await supabase
        .from("sc_products")
        .update({ active, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return respond({ error: error.message }, 500);
      return respond({ success: true });
    }

    if (action === "product_reset_mode") {
      const { id } = payload as { id: string };
      const { error } = await supabase
        .from("sc_products")
        .update({ price_mode: "auto", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return respond({ error: error.message }, 500);
      return respond({ success: true });
    }

    // ── KONFIGURASI DIGIFLAZZ ─────────────────────────────────────────────────

    if (action === "digiflazz_save") {
      const { data } = payload as { data: Record<string, unknown> };
      const { error } = await supabase
        .from("sc_digiflazz_config")
        .upsert({ ...data, updated_at: new Date().toISOString() }, { onConflict: "provider" });
      if (error) return respond({ error: error.message }, 500);
      return respond({ success: true });
    }

    // ── KONFIGURASI PAYMENT GATEWAY ───────────────────────────────────────────

    if (action === "payment_save") {
      const { data } = payload as { data: Record<string, unknown> };
      const { error } = await supabase
        .from("sc_payment_configs")
        .upsert({ ...data, updated_at: new Date().toISOString() }, { onConflict: "gateway" });
      if (error) return respond({ error: error.message }, 500);
      return respond({ success: true });
    }

    return respond({ error: `Action tidak dikenal: ${action}` }, 400);

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[admin-api] ${action} error:`, msg);
    return respond({ error: msg }, 500);
  }
});
