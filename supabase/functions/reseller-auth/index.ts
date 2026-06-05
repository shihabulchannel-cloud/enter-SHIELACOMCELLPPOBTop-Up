import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(data: Record<string, unknown>) {
  return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const body = await req.json();
    const { action, username, password, name, email, whatsapp, reseller_id, old_password, new_password } = body;

    if (action === "register") {
      if (!username || !password || !name) return respond({ error: "Nama, username, dan password wajib diisi" });
      const { data: existing } = await supabase.from("sc_resellers").select("id").eq("username", username).maybeSingle();
      if (existing) return respond({ error: "Username sudah digunakan" });
      const hash = await sha256(password);
      const { data, error } = await supabase.from("sc_resellers").insert({ name, username, password_hash: hash, email: email || "", whatsapp: whatsapp || "", balance: 0, markup: 0, status: "active" }).select().single();
      if (error) return respond({ error: error.message });
      return respond({ success: true, reseller: { id: data.id, username: data.username, name: data.name, balance: data.balance, markup: data.markup, status: data.status } });
    }

    if (action === "login") {
      if (!username || !password) return respond({ error: "Username dan password wajib diisi" });
      const { data: reseller, error: findErr } = await supabase.from("sc_resellers").select("*").eq("username", username).maybeSingle();
      if (findErr) return respond({ error: findErr.message });
      if (!reseller) return respond({ error: "Username atau password salah" });
      if (reseller.status === "suspended") return respond({ error: "Akun Anda telah dibekukan. Hubungi admin." });
      const hash = await sha256(password);
      if (hash !== reseller.password_hash) return respond({ error: "Username atau password salah" });
      await supabase.from("sc_resellers").update({ last_login: new Date().toISOString() }).eq("id", reseller.id);
      return respond({ success: true, reseller: { id: reseller.id, username: reseller.username, name: reseller.name, balance: reseller.balance, markup: reseller.markup, status: reseller.status } });
    }

    if (action === "change_password") {
      if (!reseller_id || !old_password || !new_password) return respond({ error: "Data tidak lengkap" });
      const { data: reseller } = await supabase.from("sc_resellers").select("password_hash").eq("id", reseller_id).maybeSingle();
      if (!reseller) return respond({ error: "Reseller tidak ditemukan" });
      const oldHash = await sha256(old_password);
      if (oldHash !== reseller.password_hash) return respond({ error: "Password lama salah" });
      const newHash = await sha256(new_password);
      await supabase.from("sc_resellers").update({ password_hash: newHash, updated_at: new Date().toISOString() }).eq("id", reseller_id);
      return respond({ success: true });
    }

    if (action === "get_profile") {
      if (!reseller_id) return respond({ error: "reseller_id diperlukan" });
      const { data } = await supabase.from("sc_resellers").select("id,name,username,email,whatsapp,balance,markup,status,created_at,last_login").eq("id", reseller_id).maybeSingle();
      return respond({ success: true, reseller: data });
    }

    if (action === "update_profile") {
      if (!reseller_id) return respond({ error: "reseller_id diperlukan" });
      await supabase.from("sc_resellers").update({ name, email: email || "", whatsapp: whatsapp || "", updated_at: new Date().toISOString() }).eq("id", reseller_id);
      return respond({ success: true });
    }

    return respond({ error: "Action tidak dikenal" });
  } catch (err) {
    return respond({ error: String(err) });
  }
});
