import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'shielacom_admin_v3';

export interface AdminSession {
  admin_id: string;
  username: string;
  display_name: string;
  email: string;
  expires_at: number; // unix ms
  session_token: string; // signed JWT from server
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function adminLogin(
  username: string,
  password: string,
): Promise<{ success: boolean; error?: string; admin?: string }> {
  const { data, error } = await supabase.functions.invoke('admin-login', {
    body: { username, password },
  });

  if (error) return { success: false, error: 'Gagal menghubungi server' };
  if (data?.error) return { success: false, error: data.error };

  // JWT payload (tidak diverifikasi sisi client — hanya untuk membaca info user)
  // Verifikasi signature dilakukan di server (edge function admin-login)
  const parts: string[] = (data.session_token as string).split('.');
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch { /* tidak bisa parse, tetap lanjut */ }

  const session: AdminSession = {
    admin_id: (payload.sub as string) || data.admin?.id || '',
    username: (payload.username as string) || data.admin?.username || '',
    display_name: (payload.display_name as string) || data.admin?.display_name || '',
    email: (payload.email as string) || data.admin?.email || '',
    expires_at: ((payload.exp as number) || 0) * 1000, // convert to ms
    session_token: data.session_token,
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // Hapus session lama jika ada
  localStorage.removeItem('shielacom_admin_v2');
  localStorage.removeItem('shielacom_admin_session');
  return { success: true, admin: session.username };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export function adminLogout(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('shielacom_admin_v2');
  localStorage.removeItem('shielacom_admin_session');
}

// ─── Auth Check ───────────────────────────────────────────────────────────────

export function isAdminLoggedIn(): boolean {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw) as AdminSession;
    // Cek expired (gunakan unix ms)
    if (session.expires_at <= Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }
    // Token harus ada dan berformat JWT (3 bagian dipisah titik)
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

export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    if (session.expires_at <= Date.now()) {
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

// ─── Change Password ──────────────────────────────────────────────────────────

export async function changeAdminPassword(
  adminId: string,
  oldPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('admin-login', {
    body: {
      action: 'change_password',
      admin_id: adminId,
      old_password: oldPassword,
      new_password: newPassword,
    },
  });
  if (error) return { success: false, error: 'Gagal menghubungi server' };
  if (data?.error) return { success: false, error: data.error };
  return { success: true };
}
