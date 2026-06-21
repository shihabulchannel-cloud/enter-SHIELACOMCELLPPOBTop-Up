import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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
): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count } = await supabase
    .from("sc_login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("identifier", identifier)
    .eq("attempt_type", "reseller")
    .eq("success", false)
    .gte("created_at", since);
  return (count ?? 0) >= MAX_ATTEMPTS;
}

async function recordAttempt(
  supabase: ReturnType<typeof createClient>,
  identifier: string,
  success: boolean,
) {
  await supabase.from("sc_login_attempts").insert({
    identifier,
    attempt_type: "reseller",
    success,
  });
}

async function auditLog(
  supabase: ReturnType<typeof createClient>,
  actorId: string,
  actorName: string,
  action: string,
  details: Record<string, unknown> = {},
) {
  await supabase.from("sc_audit_logs").insert({
    actor_type: "reseller",
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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const JWT_SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const body = await req.json();
    const {
      action,
      username,
      password,
      name,
      email,
      whatsapp,
      reseller_id,
      old_password,
      new_password,
    } = body;

    // ── REGISTER ──
    if (action === "register") {
      if (!username || !password || !name)
        return respond({
          error: "Nama, username, dan password wajib diisi",
        });
      if (password.length < 6)
        return respond({ error: "Password minimal 6 karakter" });
      const { data: existing } = await supabase
        .from("sc_resellers")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (existing) return respond({ error: "Username sudah digunakan" });
      const hash = await hashPasswordPBKDF2(password);
      const { data, error } = await supabase
        .from("sc_resellers")
        .insert({
          name,
          username,
          password_hash: hash,
          password_version: "pbkdf2",
          email: email || "",
          whatsapp: whatsapp || "",
          balance: 0,
          markup: 0,
          status: "active",
        })
        .select()
        .single();
      if (error) return respond({ error: error.message });
      await auditLog(supabase, data.id, data.username, "register", {
        name,
      });
      return respond({
        success: true,
        reseller: {
          id: data.id,
          username: data.username,
          name: data.name,
          balance: data.balance,
          markup: data.markup,
          status: data.status,
        },
      });
    }

    // ── LOGIN ──
    if (action === "login") {
      if (!username || !password)
        return respond({ error: "Username dan password wajib diisi" });

      // Rate limit check
      const blocked = await checkRateLimit(supabase, username);
      if (blocked) {
        return respond(
          {
            error:
              "Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.",
          },
          429,
        );
      }

      const { data: reseller, error: findErr } = await supabase
        .from("sc_resellers")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (findErr) return respond({ error: findErr.message });
      if (!reseller) {
        await recordAttempt(supabase, username, false);
        return respond({ error: "Username atau password salah" });
      }
      if (reseller.status === "suspended")
        return respond({
          error: "Akun Anda telah dibekukan. Hubungi admin.",
        });

      const passwordOk = await verifyPassword(password, reseller.password_hash);
      if (!passwordOk) {
        await recordAttempt(supabase, username, false);
        await auditLog(supabase, reseller.id, reseller.username, "login_failed");
        return respond({ error: "Username atau password salah" });
      }

      // Login berhasil — upgrade hash jika masih sha256
      const updateFields: Record<string, unknown> = {
        last_login: new Date().toISOString(),
      };
      if (!reseller.password_hash.startsWith("pbkdf2:")) {
        updateFields.password_hash = await hashPasswordPBKDF2(password);
        updateFields.password_version = "pbkdf2";
      }
      await supabase
        .from("sc_resellers")
        .update(updateFields)
        .eq("id", reseller.id);

      await recordAttempt(supabase, username, true);
      await auditLog(supabase, reseller.id, reseller.username, "login_success");

      const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
      const jwtPayload = {
        sub: reseller.id,
        username: reseller.username,
        name: reseller.name,
        balance: reseller.balance,
        markup: reseller.markup,
        status: reseller.status,
        role: "reseller",
        exp,
        iat: Math.floor(Date.now() / 1000),
      };
      const sessionToken = await createJWT(jwtPayload, JWT_SECRET);

      return respond({
        success: true,
        session_token: sessionToken,
        reseller: {
          id: reseller.id,
          username: reseller.username,
          name: reseller.name,
          balance: reseller.balance,
          markup: reseller.markup,
          status: reseller.status,
        },
      });
    }

    // ── CHANGE PASSWORD ──
    if (action === "change_password") {
      if (!reseller_id || !old_password || !new_password)
        return respond({ error: "Data tidak lengkap" });
      if (new_password.length < 6)
        return respond({ error: "Password baru minimal 6 karakter" });
      const { data: reseller } = await supabase
        .from("sc_resellers")
        .select("password_hash, username")
        .eq("id", reseller_id)
        .maybeSingle();
      if (!reseller) return respond({ error: "Reseller tidak ditemukan" });
      const oldOk = await verifyPassword(old_password, reseller.password_hash);
      if (!oldOk) return respond({ error: "Password lama salah" });
      const newHash = await hashPasswordPBKDF2(new_password);
      await supabase
        .from("sc_resellers")
        .update({
          password_hash: newHash,
          password_version: "pbkdf2",
          updated_at: new Date().toISOString(),
        })
        .eq("id", reseller_id);
      await auditLog(
        supabase,
        reseller_id,
        reseller.username,
        "password_changed",
      );
      return respond({ success: true });
    }

    // ── GET PROFILE ──
    if (action === "get_profile") {
      if (!reseller_id) return respond({ error: "reseller_id diperlukan" });
      const { data } = await supabase
        .from("sc_resellers")
        .select(
          "id,name,username,email,whatsapp,balance,markup,status,created_at,last_login",
        )
        .eq("id", reseller_id)
        .maybeSingle();
      return respond({ success: true, reseller: data });
    }

    // ── UPDATE PROFILE ──
    if (action === "update_profile") {
      if (!reseller_id) return respond({ error: "reseller_id diperlukan" });
      await supabase
        .from("sc_resellers")
        .update({
          name,
          email: email || "",
          whatsapp: whatsapp || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", reseller_id);
      await auditLog(supabase, reseller_id, name || "", "profile_updated");
      return respond({ success: true });
    }

    return respond({ error: "Action tidak dikenal" });
  } catch (err) {
    console.error("reseller-auth error:", err);
    return respond({ error: String(err) });
  }
});
