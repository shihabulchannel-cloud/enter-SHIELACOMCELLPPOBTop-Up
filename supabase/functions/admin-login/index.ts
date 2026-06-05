import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json() as Record<string, string>;
    const { username, password, action, admin_id, old_password, new_password } = body;

    // ---- CHANGE PASSWORD ----
    if (action === "change_password") {
      if (!admin_id || !old_password || !new_password) {
        return new Response(JSON.stringify({ error: "Data tidak lengkap" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const oldHash = await sha256(old_password);
      const newHash = await sha256(new_password);

      const { data: admin } = await supabase
        .from("sc_admin_accounts")
        .select("id, password_hash")
        .eq("id", admin_id)
        .maybeSingle();

      if (!admin || admin.password_hash !== oldHash) {
        return new Response(JSON.stringify({ error: "Password lama tidak sesuai" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("sc_admin_accounts").update({
        password_hash: newHash,
        updated_at: new Date().toISOString(),
      }).eq("id", admin_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- LOGIN ----
    if (!username || !password) {
      return new Response(JSON.stringify({ error: "Username dan password wajib diisi" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const passwordHash = await sha256(password);
    console.log(`Login attempt: ${username}`);

    const { data: admin, error } = await supabase
      .from("sc_admin_accounts")
      .select("id, username, display_name, email, last_login")
      .eq("username", username)
      .eq("password_hash", passwordHash)
      .maybeSingle();

    if (error || !admin) {
      await new Promise((r) => setTimeout(r, 500));
      return new Response(JSON.stringify({ error: "Username atau password salah" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update last_login
    await supabase.from("sc_admin_accounts").update({
      last_login: new Date().toISOString(),
    }).eq("id", admin.id);

    const sessionData = {
      admin_id: admin.id,
      username: admin.username,
      display_name: admin.display_name,
      email: admin.email,
      expires_at: Date.now() + 24 * 60 * 60 * 1000,
    };

    const sessionToken = btoa(JSON.stringify(sessionData));

    return new Response(
      JSON.stringify({
        success: true,
        session_token: sessionToken,
        admin: {
          id: admin.id,
          username: admin.username,
          display_name: admin.display_name,
          email: admin.email,
          last_login: admin.last_login,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("admin-login error:", err);
    return new Response(JSON.stringify({ error: "Terjadi kesalahan sistem" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
