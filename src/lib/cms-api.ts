/**
 * CMS API — service layer untuk sc_cms_categories + sc_cms_media + Storage
 * Tidak menyentuh tabel Digiflazz, Payment, Order, atau Products.
 */
import { supabase } from '@/integrations/supabase/client';

// ============================================================
// TYPES
// ============================================================

export interface CmsCategory {
  id:              string;
  slug:            string;
  name:            string;
  parent_slug:     string | null;
  brand_name:      string;
  thumbnail_url:   string;
  banner_url:      string;
  icon_url:        string;
  bg_color:        string;
  description:     string;
  seo_title:       string;
  seo_description: string;
  display_order:   number;
  is_active:       boolean;
  created_at:      string;
  updated_at:      string;
}

export interface CmsMedia {
  id:            string;
  file_name:     string;
  original_name: string;
  file_url:      string;
  file_size:     number;
  file_type:     string;
  media_type:    string;
  alt_text:      string;
  created_at:    string;
}

export type CmsCategoryInput = Omit<CmsCategory, 'id' | 'created_at' | 'updated_at'>;

// ============================================================
// STORAGE UPLOAD
// ============================================================

export async function uploadToStorage(
  file: File,
  folder: 'thumbnails' | 'banners' | 'icons' | 'backgrounds' = 'thumbnails',
): Promise<{ url: string; fileName: string }> {
  const ext   = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const ts    = Date.now();
  const rand  = Math.random().toString(36).slice(2, 7);
  const fname = `${folder}/${ts}_${rand}.${ext}`;

  const { error } = await supabase.storage
    .from('cms-media')
    .upload(fname, file, { cacheControl: '3600', upsert: false });

  if (error) throw new Error(`Upload gagal: ${error.message}`);

  const { data } = supabase.storage.from('cms-media').getPublicUrl(fname);
  if (!data?.publicUrl) throw new Error('Gagal mendapatkan URL gambar');

  return { url: data.publicUrl, fileName: fname };
}

// ============================================================
// CATEGORY CRUD
// ============================================================

/** Fetch semua top-level categories (parent_slug IS NULL) */
export async function getCmsTopCategories(): Promise<CmsCategory[]> {
  const { data, error } = await supabase
    .from('sc_cms_categories')
    .select('*')
    .is('parent_slug', null)
    .order('display_order')
    .order('name');
  if (error) throw error;
  return (data as CmsCategory[]) || [];
}

/** Fetch sub-categories untuk parent tertentu */
export async function getCmsSubCategories(parentSlug: string): Promise<CmsCategory[]> {
  const { data, error } = await supabase
    .from('sc_cms_categories')
    .select('*')
    .eq('parent_slug', parentSlug)
    .order('display_order')
    .order('name');
  if (error) throw error;
  return (data as CmsCategory[]) || [];
}

/** Fetch semua categories (top + sub) sekaligus */
export async function getAllCmsCategories(): Promise<CmsCategory[]> {
  const { data, error } = await supabase
    .from('sc_cms_categories')
    .select('*')
    .order('display_order')
    .order('name');
  if (error) throw error;
  return (data as CmsCategory[]) || [];
}

/** Upsert: jika ada ID → update, jika tidak → insert */
export async function saveCmsCategory(cat: CmsCategoryInput & { id?: string }): Promise<CmsCategory> {
  if (cat.id) {
    // Update
    const { id, ...rest } = cat;
    const { data, error } = await supabase
      .from('sc_cms_categories')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as CmsCategory;
  } else {
    // Insert
    const { data, error } = await supabase
      .from('sc_cms_categories')
      .insert(cat)
      .select()
      .single();
    if (error) throw error;
    return data as CmsCategory;
  }
}

export async function deleteCmsCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('sc_cms_categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/** Fetch satu category berdasarkan slug dan parent */
export async function getCmsCategoryBySlug(
  slug: string,
  parentSlug: string | null,
): Promise<CmsCategory | null> {
  let query = supabase
    .from('sc_cms_categories')
    .select('*')
    .eq('slug', slug);

  if (parentSlug) {
    query = query.eq('parent_slug', parentSlug);
  } else {
    query = query.is('parent_slug', null);
  }

  const { data } = await query.maybeSingle();
  return (data as CmsCategory | null);
}

// ============================================================
// MEDIA LIBRARY
// ============================================================

export async function getMediaLibrary(): Promise<CmsMedia[]> {
  const { data, error } = await supabase
    .from('sc_cms_media')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as CmsMedia[]) || [];
}

export async function saveMedia(media: Omit<CmsMedia, 'id' | 'created_at'>): Promise<CmsMedia> {
  const { data, error } = await supabase
    .from('sc_cms_media')
    .insert(media)
    .select()
    .single();
  if (error) throw error;
  return data as CmsMedia;
}

export async function deleteMedia(id: string, fileUrl: string): Promise<void> {
  // Ekstrak path dari URL Storage
  try {
    const url      = new URL(fileUrl);
    const pathPart = url.pathname.split('/cms-media/')[1];
    if (pathPart) {
      await supabase.storage.from('cms-media').remove([pathPart]);
    }
  } catch {
    // Abaikan jika URL tidak valid
  }
  const { error } = await supabase.from('sc_cms_media').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// HELPER: Brands dari sc_products untuk sebuah category
// ============================================================
export async function getAvailableBrands(categoryId: string): Promise<string[]> {
  const { data } = await supabase
    .from('sc_products')
    .select('brand')
    .eq('category_id', categoryId)
    .eq('active', true);
  if (!data) return [];
  const brands = [...new Set(data.map((r: { brand: string }) => r.brand).filter(Boolean))].sort();
  return brands;
}
