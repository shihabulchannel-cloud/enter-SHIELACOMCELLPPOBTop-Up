import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'shielacom_admin_v2';

export interface AdminSession {
  admin_id: string;
  username: string;
  display_name: string;
  email: string;
  expires_at: number;
  session_token: string;
}

export async function adminLogin(username: string, password: string): Promise<{ success: boolean; error?: string; admin?: AdminSession['username'] }> {
  const { data, error } = await supabase.functions.invoke('admin-login', {
    body: { username, password },
  });

  if (error) return { success: false, error: 'Gagal menghubungi server' };
  if (data?.error) return { success: false, error: data.error };

  const sessionData = JSON.parse(atob(data.session_token)) as AdminSession;
  sessionData.session_token = data.session_token;

  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  return { success: true, admin: sessionData.username };
}

export function adminLogout(): void {
  localStorage.removeItem(SESSION_KEY);
  // Also clear old session key for migration
  localStorage.removeItem('shielacom_admin_session');
}

export function isAdminLoggedIn(): boolean {
  try {
    // Check new session
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const session = JSON.parse(raw) as AdminSession;
      if (session.expires_at > Date.now()) return true;
      // Expired - remove it
      localStorage.removeItem(SESSION_KEY);
    }

    // Legacy fallback (for existing sessions before migration)
    const legacy = localStorage.getItem('shielacom_admin_session');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (parsed.loggedIn === true) return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    if (session.expires_at <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function changeAdminPassword(adminId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('admin-login', {
    body: { action: 'change_password', admin_id: adminId, old_password: oldPassword, new_password: newPassword },
  });
  if (error) return { success: false, error: 'Gagal menghubungi server' };
  if (data?.error) return { success: false, error: data.error };
  return { success: true };
}
