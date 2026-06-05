import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'shielacom_reseller_v1';

export interface ResellerSession {
  reseller_id: string;
  username: string;
  name: string;
  balance: number;
  markup: number;
  status: string;
  expires_at: number;
  session_token: string;
}

export async function resellerLogin(username: string, password: string): Promise<{ success: boolean; error?: string; reseller?: ResellerSession }> {
  try {
    const { data, error } = await supabase.functions.invoke('reseller-auth', { body: { action: 'login', username, password } });
    if (error) return { success: false, error: error.message };
    if (data?.error) return { success: false, error: data.error };
    const session: ResellerSession = { ...data.reseller, session_token: data.session_token, expires_at: Date.now() + 24 * 60 * 60 * 1000 };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, reseller: session };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error tidak diketahui' };
  }
}

export async function resellerRegister(params: { name: string; username: string; password: string; email?: string; whatsapp?: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('reseller-auth', { body: { action: 'register', ...params } });
    if (error) return { success: false, error: error.message };
    if (data?.error) return { success: false, error: data.error };
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error tidak diketahui' };
  }
}

export function resellerLogout() {
  localStorage.removeItem(SESSION_KEY);
}

export function isResellerLoggedIn(): boolean {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const session: ResellerSession = JSON.parse(raw);
    if (session.expires_at < Date.now()) { localStorage.removeItem(SESSION_KEY); return false; }
    return true;
  } catch { return false; }
}

export function getResellerSession(): ResellerSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: ResellerSession = JSON.parse(raw);
    if (session.expires_at < Date.now()) { localStorage.removeItem(SESSION_KEY); return null; }
    return session;
  } catch { return null; }
}

export function updateResellerBalance(newBalance: number) {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const session = JSON.parse(raw);
    session.balance = newBalance;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch { /* ignore */ }
}

export async function changeResellerPassword(resellerId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('reseller-auth', { body: { action: 'change_password', reseller_id: resellerId, old_password: oldPassword, new_password: newPassword } });
    if (error) return { success: false, error: error.message };
    if (data?.error) return { success: false, error: data.error };
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error tidak diketahui' };
  }
}
