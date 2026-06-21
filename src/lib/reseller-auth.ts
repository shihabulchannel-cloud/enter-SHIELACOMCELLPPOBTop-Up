import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'shielacom_reseller_v2';

export interface ResellerSession {
  reseller_id: string;
  username: string;
  name: string;
  balance: number;
  markup: number;
  status: string;
  expires_at: number; // unix ms
  session_token: string; // signed JWT dari server
}

// ─── Decode JWT payload (client-side, tidak memverifikasi signature) ──────────
function decodeJWTPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function resellerLogin(
  username: string,
  password: string,
): Promise<{ success: boolean; error?: string; reseller?: ResellerSession }> {
  try {
    const { data, error } = await supabase.functions.invoke('reseller-auth', {
      body: { action: 'login', username, password },
    });
    if (error) return { success: false, error: error.message };
    if (data?.error) return { success: false, error: data.error };

    // Ambil payload dari JWT yang sudah ditandatangani server
    const jwt: string = data.session_token;
    const payload = decodeJWTPayload(jwt);

    const session: ResellerSession = {
      reseller_id: (payload?.sub as string) || data.reseller?.id || '',
      username: (payload?.username as string) || data.reseller?.username || '',
      name: (payload?.name as string) || data.reseller?.name || '',
      balance: (payload?.balance as number) ?? data.reseller?.balance ?? 0,
      markup: (payload?.markup as number) ?? data.reseller?.markup ?? 0,
      status: (payload?.status as string) || data.reseller?.status || 'active',
      expires_at: ((payload?.exp as number) || 0) * 1000,
      session_token: jwt,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    // Hapus session lama jika ada
    localStorage.removeItem('shielacom_reseller_v1');
    return { success: true, reseller: session };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Error tidak diketahui',
    };
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function resellerRegister(params: {
  name: string;
  username: string;
  password: string;
  email?: string;
  whatsapp?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('reseller-auth', {
      body: { action: 'register', ...params },
    });
    if (error) return { success: false, error: error.message };
    if (data?.error) return { success: false, error: data.error };
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Error tidak diketahui',
    };
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export function resellerLogout() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('shielacom_reseller_v1');
}

// ─── Auth Check ───────────────────────────────────────────────────────────────

export function isResellerLoggedIn(): boolean {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const session: ResellerSession = JSON.parse(raw);
    if (session.expires_at < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }
    // Token harus berformat JWT (3 bagian dipisah titik)
    if (!session.session_token || session.session_token.split('.').length !== 3) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Get Session ──────────────────────────────────────────────────────────────

export function getResellerSession(): ResellerSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: ResellerSession = JSON.parse(raw);
    if (session.expires_at < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    if (!session.session_token || session.session_token.split('.').length !== 3) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

// ─── Update Balance (local cache) ─────────────────────────────────────────────

export function updateResellerBalance(newBalance: number) {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const session = JSON.parse(raw);
    session.balance = newBalance;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch { /* ignore */ }
}

// ─── Change Password ──────────────────────────────────────────────────────────

export async function changeResellerPassword(
  resellerId: string,
  oldPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('reseller-auth', {
      body: {
        action: 'change_password',
        reseller_id: resellerId,
        old_password: oldPassword,
        new_password: newPassword,
      },
    });
    if (error) return { success: false, error: error.message };
    if (data?.error) return { success: false, error: data.error };
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Error tidak diketahui',
    };
  }
}
