import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function makeToken(payload: Record<string, unknown>): string {
  return btoa(JSON.stringify({ ...payload, expires_at: Date.now() + 24 * 60 * 60 * 1000 }));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const { action, username, password, name, email, whatsapp, reseller_id, old_password, new_password } = await req.json();

    if (action === "register") {
      if (!username || !password || !name) return new Response(JSON.stringify({ error: "Nama, username, dan password wajib diisi" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: existing } = await supabase.from("sc_resellers").select("id").eq("username", username).maybeSingle();
      if (existing) return new Response(JSON.stringify({ error: "Username sudah digunakan" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const hash = await sha256(password);
      const { data, error } = await supabase.from("sc_resellers").insert({ name, username, password_hash: hash, email: email || "", whatsapp: whatsapp || "", balance: 0, markup: 0, status: "active" }).select().single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const token = makeToken({ reseller_id: data.id, username: data.username, name: data.name, balance: data.balance, markup: data.markup, status: data.status });
      return new Response(JSON.stringify({ success: true, session_token: token, reseller: { id: data.id, username: data.username, name: data.name, balance: data.balance, markup: data.markup, status: data.status } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "login") {
      if (!username || !password) return new Response(JSON.stringify({ error: "Username dan password wajib diisi" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: reseller } = await supabase.from("sc_resellers").select("*").eq("username", username).maybeSingle();
      if (!reseller) return new Response(JSON.stringify({ error: "Username atau password salah" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (reseller.status === "suspended") return new Response(JSON.stringify({ error: "Akun Anda telah dibekukan. Hubungi admin." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const hash = await sha256(password);
      if (hash !== reseller.password_hash) return new Response(JSON.stringify({ error: "Username atau password salah" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await supabase.from("sc_resellers").update({ last_login: new Date().toISOString() }).eq("id", reseller.id);
      const token = makeToken({ reseller_id: reseller.id, username: reseller.username, name: reseller.name, balance: reseller.balance, markup: reseller.markup, status: reseller.status });
      return new Response(JSON.stringify({ success: true, session_token: token, reseller: { id: reseller.id, username: reseller.username, name: reseller.name, balance: reseller.balance, markup: reseller.markup, status: reseller.status } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "change_password") {
      if (!reseller_id || !old_password || !new_password) return new Response(JSON.stringify({ error: "Data tidak lengkap" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: reseller } = await supabase.from("sc_resellers").select("password_hash").eq("id", reseller_id).maybeSingle();
      if (!reseller) return new Response(JSON.stringify({ error: "Reseller tidak ditemukan" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const oldHash = await sha256(old_password);
      if (oldHash !== reseller.password_hash) return new Response(JSON.stringify({ error: "Password lama salah" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const newHash = await sha256(new_password);
      await supabase.from("sc_resellers").update({ password_hash: newHash, updated_at: new Date().toISOString() }).eq("id", reseller_id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "get_profile") {
      if (!reseller_id) return new Response(JSON.stringify({ error: "reseller_id diperlukan" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data } = await supabase.from("sc_resellers").select("id,name,username,email,whatsapp,balance,markup,status,created_at,last_login").eq("id", reseller_id).maybeSingle();
      return new Response(JSON.stringify({ success: true, reseller: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update_profile") {
      if (!reseller_id) return new Response(JSON.stringify({ error: "reseller_id diperlukan" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await supabase.from("sc_resellers").update({ name, email: email || "", whatsapp: whatsapp || "", updated_at: new Date().toISOString() }).eq("id", reseller_id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Action tidak dikenal" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
