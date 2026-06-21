import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── PBKDF2 Password Hashing ──────────────────────────────────────────────────

async function hashPasswordPBKDF2(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" },
    key,
    256,
  );
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(bits)));
  return `pbkdf2:${saltB64}:${hashB64}`;
}

async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  if (stored.startsWith("pbkdf2:")) {
    const parts = stored.split(":");
    if (parts.length !== 3) return false;
    const salt = Uint8Array.from(atob(parts[1]), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" },
      key,
      256,
    );
    return btoa(String.fromCharCode(...new Uint8Array(bits))) === parts[2];
  }
  // Legacy SHA-256 fallback
  const sha = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password),
  );
  return (
    Array.from(new Uint8Array(sha))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("") === stored
  );
}

// ─── JWT (HMAC-SHA256) ────────────────────────────────────────────────────────

function b64url(input: string | Uint8Array): string {
  const str =
    typeof input === "string"
      ? input
      : String.fromCharCode(...input);
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function createJWT(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${header}.${body}`),
  );
  return `${header}.${body}.${b64url(new Uint8Array(sig))}`;
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 menit

async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  identifier: string,
  attemptType: string,
): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count } = await supabase
    .from("sc_login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("identifier", identifier)
    .eq("attempt_type", attemptType)
    .eq("success", false)
    .gte("created_at", since);
  return (count ?? 0) >= MAX_ATTEMPTS;
}

async function recordAttempt(
  supabase: ReturnType<typeof createClient>,
  identifier: string,
  attemptType: string,
  success: boolean,
) {
  await supabase.from("sc_login_attempts").insert({
    identifier,
    attempt_type: attemptType,
    success,
  });
}

// ─── Audit Logging ────────────────────────────────────────────────────────────

async function auditLog(
  supabase: ReturnType<typeof createClient>,
  actorType: string,
  actorId: string,
  actorName: string,
  action: string,
  details: Record<string, unknown> = {},
) {
  await supabase.from("sc_audit_logs").insert({
    actor_type: actorType,
    actor_id: actorId,
    actor_name: actorName,
    action,
    details,
  });
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  const respond = (data: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const JWT_SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = (await req.json()) as Record<string, string>;
    const {
      action,
      username,
      password,
      admin_id,
      old_password,
      new_password,
      session_token,
    } = body;

    // ── VERIFY TOKEN ──
    if (action === "verify_token") {
      if (!session_token) return respond({ valid: false });
      try {
        const parts = session_token.split(".");
        if (parts.length !== 3) return respond({ valid: false });
        const key = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(JWT_SECRET),
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
        if (!valid) return respond({ valid: false });
        const payload = JSON.parse(
          atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
        );
        if (
          payload.exp &&
          payload.exp < Math.floor(Date.now() / 1000)
        )
          return respond({ valid: false, error: "Token kadaluarsa" });
        return respond({ valid: true, payload });
      } catch {
        return respond({ valid: false });
      }
    }

    // ── CHANGE PASSWORD ──
    if (action === "change_password") {
      if (!admin_id || !old_password || !new_password)
        return respond({ error: "Data tidak lengkap" }, 400);

      const { data: admin } = await supabase
        .from("sc_admin_accounts")
        .select("id, password_hash, password_version")
        .eq("id", admin_id)
        .maybeSingle();

      if (!admin) return respond({ error: "Admin tidak ditemukan" }, 404);

      const ok = await verifyPassword(old_password, admin.password_hash);
      if (!ok)
        return respond({ error: "Password lama tidak sesuai" }, 400);

      const newHash = await hashPasswordPBKDF2(new_password);
      await supabase
        .from("sc_admin_accounts")
        .update({
          password_hash: newHash,
          password_version: "pbkdf2",
          updated_at: new Date().toISOString(),
        })
        .eq("id", admin_id);

      await auditLog(supabase, "admin", admin_id, "", "password_changed");
      return respond({ success: true });
    }

    // ── LOGIN ──
    if (!username || !password)
      return respond(
        { error: "Username dan password wajib diisi" },
        400,
      );

    // Rate limit check
    const blocked = await checkRateLimit(supabase, username, "admin");
    if (blocked) {
      await auditLog(supabase, "admin", "", username, "login_blocked", {
        reason: "rate_limit",
      });
      return respond(
        {
          error:
            "Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.",
        },
        429,
      );
    }

    const { data: admin, error } = await supabase
      .from("sc_admin_accounts")
      .select("id, username, display_name, email, last_login, password_hash, password_version")
      .eq("username", username)
      .maybeSingle();

    if (error || !admin) {
      await recordAttempt(supabase, username, "admin", false);
      await new Promise((r) => setTimeout(r, 500));
      return respond({ error: "Username atau password salah" }, 401);
    }

    const passwordOk = await verifyPassword(password, admin.password_hash);
    if (!passwordOk) {
      await recordAttempt(supabase, username, "admin", false);
      await auditLog(supabase, "admin", admin.id, admin.username, "login_failed");
      await new Promise((r) => setTimeout(r, 500));
      return respond({ error: "Username atau password salah" }, 401);
    }

    // Login berhasil — upgrade hash jika masih sha256
    const updateFields: Record<string, string> = {
      last_login: new Date().toISOString(),
    };
    if (!admin.password_hash.startsWith("pbkdf2:")) {
      updateFields.password_hash = await hashPasswordPBKDF2(password);
      updateFields.password_version = "pbkdf2";
    }
    await supabase
      .from("sc_admin_accounts")
      .update(updateFields)
      .eq("id", admin.id);

    await recordAttempt(supabase, username, "admin", true);
    await auditLog(supabase, "admin", admin.id, admin.username, "login_success");

    const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    const payload = {
      sub: admin.id,
      username: admin.username,
      display_name: admin.display_name,
      email: admin.email,
      role: "admin",
      exp,
      iat: Math.floor(Date.now() / 1000),
    };

    const sessionToken = await createJWT(payload, JWT_SECRET);

    return respond({
      success: true,
      session_token: sessionToken,
      admin: {
        id: admin.id,
        username: admin.username,
        display_name: admin.display_name,
        email: admin.email,
        last_login: admin.last_login,
      },
    });
  } catch (err) {
    console.error("admin-login error:", err);
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan sistem" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
