/**
 * Banner API — service layer untuk sc_banners (Hero Slider).
 * Data tersimpan di database (Enter Cloud), bukan localStorage, sehingga
 * banner yang diupload admin tampil ke semua pengunjung.
 *
 * Tabel: sc_banners (RLS: public SELECT; mutasi via admin-api service_role).
 */
import { supabase } from '@/integrations/supabase/client';
import { getAdminSession } from '@/lib/admin-auth';

export type BannerTheme = 'game' | 'pulsa' | 'pln' | 'all';

export interface DbBanner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  button1_text: string;
  button1_link: string;
  button2_text: string;
  button2_link: string;
  banner_link: string;   // URL klik seluruh banner (saat ada gambar)
  image_url: string;     // public Storage URL (folder: banners)
  theme: BannerTheme;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/** Public read: banner aktif, urut by display_order (untuk HeroSlider pengunjung). */
export async function fetchActiveBanners(): Promise<DbBanner[]> {
  const { data, error } = await supabase
    .from('sc_banners')
    .select('*')
    .eq('active', true)
    .order('display_order')
    .order('created_at');
  if (error) throw error;
  return (data as DbBanner[]) || [];
}

/** Admin read: semua banner (urut by display_order). */
export async function fetchAllBanners(): Promise<DbBanner[]> {
  const { data, error } = await supabase
    .from('sc_banners')
    .select('*')
    .order('display_order')
    .order('created_at');
  if (error) throw error;
  return (data as DbBanner[]) || [];
}

/** Panggil admin-api untuk mutasi banner (insert/update/delete/reorder).
 *  Token dikirim via header X-Admin-Token (pola sama seperti ProductManager). */
export async function adminBannerApi(action: string, payload: Record<string, unknown>) {
  const session = getAdminSession();
  const { data, error } = await supabase.functions.invoke('admin-api', {
    body: { action, payload },
    headers: { 'X-Admin-Token': session?.session_token ?? '' },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}
