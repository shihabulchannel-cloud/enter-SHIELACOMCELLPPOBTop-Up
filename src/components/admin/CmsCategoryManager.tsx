import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Trash2, Edit2, Check, X, Upload, Image as ImageIcon,
  Layers, ChevronDown, Loader2, Eye, EyeOff, RefreshCw, Copy,
  ArrowUpDown, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  getCmsTopCategories, getCmsSubCategories, saveCmsCategory,
  deleteCmsCategory, getMediaLibrary, saveMedia, deleteMedia,
  uploadToStorage, getAvailableBrands,
  type CmsCategory, type CmsMedia, type CmsCategoryInput,
} from '@/lib/cms-api';
import { CATEGORIES } from '@/lib/product-slugs';
import { useImageCrop } from '@/hooks/useImageCrop';
import type { ImagePresetKey } from '@/components/admin/ImageCropModal';
import { IMAGE_PRESETS } from '@/lib/image-presets';

// ============================================================
// TAB
// ============================================================
type Tab = 'top' | 'sub' | 'media';

// ============================================================
// SMART IMAGE UPLOAD — with crop modal
// ============================================================
type Folder = 'thumbnails' | 'banners' | 'icons' | 'backgrounds';

const FOLDER_TO_PRESET: Record<Folder, ImagePresetKey> = {
  thumbnails:  'thumbnail',
  banners:     'banner',
  icons:       'logo',
  backgrounds: 'thumbnail',
};

function ImageUpload({
  label,
  value,
  folder,
  preset: presetOverride,
  onUploaded,
}: {
  label:        string;
  value:        string;
  folder:       Folder;
  preset?:      ImagePresetKey;   // overrides FOLDER_TO_PRESET default
  onUploaded:   (url: string) => void;
}) {
  const presetKey = presetOverride ?? FOLDER_TO_PRESET[folder];
  const { triggerCrop, cropModal, uploading, error } = useImageCrop({
    preset: presetKey,
    folder,
    onUrl: onUploaded,
  });

  return (
    <div>
      {cropModal}
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <div className="flex items-start gap-3">
        {/* Preview */}
        <div
          className={cn(
            'flex-shrink-0 flex items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted',
            folder === 'banners' ? 'w-32 h-16' : 'w-16 h-16',
          )}
        >
          {value ? (
            <img src={value} alt={label} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={triggerCrop}
            disabled={uploading}
            className="rounded-xl gap-1.5 text-xs h-8"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? 'Mengupload...' : 'Upload'}
          </Button>
          {value && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onUploaded('')}
              className="rounded-xl gap-1 text-xs h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="w-3 h-3" /> Hapus
            </Button>
          )}
          <p className="text-xs text-muted-foreground">{IMAGE_PRESETS[presetKey].helpText}</p>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CATEGORY FORM (modal/inline)
// ============================================================
const COLOR_OPTIONS = [
  { label: 'Biru',   value: 'from-blue-500 to-blue-700' },
  { label: 'Cyan',   value: 'from-cyan-500 to-cyan-700' },
  { label: 'Ungu',   value: 'from-purple-500 to-purple-700' },
  { label: 'Oranye', value: 'from-orange-500 to-orange-700' },
  { label: 'Kuning', value: 'from-yellow-500 to-yellow-700' },
  { label: 'Merah',  value: 'from-red-500 to-red-700' },
  { label: 'Pink',   value: 'from-pink-500 to-pink-700' },
  { label: 'Hijau',  value: 'from-green-500 to-green-700' },
  { label: 'Teal',   value: 'from-teal-500 to-teal-700' },
  { label: 'Amber',  value: 'from-amber-500 to-amber-700' },
];

interface CategoryFormProps {
  initial?:   Partial<CmsCategory>;
  isSub?:     boolean;
  parentSlug?: string;
  onSaved:    (cat: CmsCategory) => void;
  onCancel:   () => void;
}

function CategoryForm({ initial, isSub, parentSlug, onSaved, onCancel }: CategoryFormProps) {
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [brands,       setBrands]       = useState<string[]>([]);
  const [form, setForm] = useState<CmsCategoryInput>({
    slug:            initial?.slug            ?? '',
    name:            initial?.name            ?? '',
    parent_slug:     initial?.parent_slug     ?? (isSub ? (parentSlug ?? null) : null),
    brand_name:      initial?.brand_name      ?? '',
    thumbnail_url:   initial?.thumbnail_url   ?? '',
    banner_url:      initial?.banner_url      ?? '',
    icon_url:        initial?.icon_url        ?? '',
    bg_color:        initial?.bg_color        ?? 'from-blue-500 to-blue-700',
    description:     initial?.description     ?? '',
    seo_title:       initial?.seo_title       ?? '',
    seo_description: initial?.seo_description ?? '',
    display_order:   initial?.display_order   ?? 0,
    is_active:       initial?.is_active       ?? true,
  });

  // Load available brands untuk sub-kategori
  useEffect(() => {
    if (!isSub) return;
    const ps = parentSlug ?? form.parent_slug;
    if (!ps) return;
    // Map parent_slug ke category_id dari CATEGORIES
    const cat = CATEGORIES.find(c => c.slug === ps);
    if (!cat) return;
    getAvailableBrands(cat.id).then(setBrands).catch(() => {});
  }, [isSub, parentSlug, form.parent_slug]);

  const set = (k: keyof CmsCategoryInput) => (v: unknown) =>
    setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      setError('Nama dan slug wajib diisi'); return;
    }
    setSaving(true); setError('');
    try {
      const saved = await saveCmsCategory({ ...form, id: initial?.id });
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
      {/* === Basic Info === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nama *</label>
          <Input
            value={form.name}
            onChange={e => {
              const n = e.target.value;
              set('name')(n);
              if (!initial?.slug) set('slug')(autoSlug(n));
            }}
            placeholder="Contoh: Telkomsel"
            className="rounded-xl"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Slug *</label>
          <Input
            value={form.slug}
            onChange={e => set('slug')(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            placeholder="telkomsel"
            className="rounded-xl font-mono text-sm"
          />
        </div>

        {/* Brand Name (sub-kategori) */}
        {isSub && (
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Brand Name (nama brand di database produk) *
            </label>
            {brands.length > 0 ? (
              <select
                value={form.brand_name}
                onChange={e => set('brand_name')(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">— Pilih Brand —</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            ) : (
              <Input
                value={form.brand_name}
                onChange={e => set('brand_name')(e.target.value)}
                placeholder="Telkomsel (harus sama persis dengan nama brand di produk)"
                className="rounded-xl"
              />
            )}
          </div>
        )}

        {/* Parent category (sub) */}
        {isSub && !parentSlug && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Kategori Induk</label>
            <select
              value={form.parent_slug ?? ''}
              onChange={e => set('parent_slug')(e.target.value || null)}
              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">— Pilih Kategori —</option>
              {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
            </select>
          </div>
        )}

        {/* Color */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Warna Fallback</label>
          <select
            value={form.bg_color}
            onChange={e => set('bg_color')(e.target.value)}
            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Urutan Tampil</label>
          <Input
            type="number"
            value={form.display_order}
            onChange={e => set('display_order')(parseInt(e.target.value) || 0)}
            className="rounded-xl"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
          <select
            value={form.is_active ? 'active' : 'inactive'}
            onChange={e => set('is_active')(e.target.value === 'active')}
            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* === Image Uploads === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-border">
        <ImageUpload
          label="Thumbnail Card"
          value={form.thumbnail_url}
          folder="thumbnails"
          preset={isSub ? 'subcategory' : 'thumbnail'}
          onUploaded={url => set('thumbnail_url')(url)}
        />
        <ImageUpload
          label="Banner Hero"
          value={form.banner_url}
          folder="banners"
          onUploaded={url => set('banner_url')(url)}
        />
        <ImageUpload
          label="Icon"
          value={form.icon_url}
          folder="icons"
          onUploaded={url => set('icon_url')(url)}
        />
      </div>

      {/* === SEO === */}
      <div className="space-y-3 pt-1 border-t border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">SEO</p>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Deskripsi</label>
          <Input
            value={form.description}
            onChange={e => set('description')(e.target.value)}
            placeholder="Deskripsi singkat"
            className="rounded-xl"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Meta Title</label>
          <Input
            value={form.seo_title}
            onChange={e => set('seo_title')(e.target.value)}
            placeholder="SEO Title"
            className="rounded-xl"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Meta Description</label>
          <Input
            value={form.seo_description}
            onChange={e => set('seo_description')(e.target.value)}
            placeholder="SEO Description (max 160 karakter)"
            maxLength={160}
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Actions */}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} size="sm" className="bg-primary text-primary-foreground btn-glow rounded-xl gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? 'Menyimpan...' : 'Simpan'}
        </Button>
        <Button onClick={onCancel} size="sm" variant="outline" className="rounded-xl gap-1">
          <X className="w-4 h-4" /> Batal
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// TOP-LEVEL CATEGORIES TAB
// ============================================================
function TopCategoriesTab() {
  const [cats,    setCats]    = useState<CmsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding,  setAdding]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setCats(await getCmsTopCategories()); } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return;
    await deleteCmsCategory(id);
    load();
  };

  // Merge: tampilkan semua CATEGORIES dari product-slugs, overlay dengan CMS data
  const merged = CATEGORIES.map(c => {
    const cms = cats.find(x => x.slug === c.slug);
    return { catSlug: c.slug, catLabel: c.label, cms };
  });

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" /> Memuat...
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-muted-foreground">Atur thumbnail, banner, dan SEO untuk tiap kategori utama.</p>
        </div>
        <Button onClick={load} size="sm" variant="outline" className="rounded-xl gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {adding && (
        <div className="mb-5">
          <CategoryForm
            isSub={false}
            onSaved={() => { load(); setAdding(false); }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      <div className="space-y-3">
        {merged.map(({ catSlug, catLabel, cms }) => (
          <div key={catSlug}>
            {editing === catSlug ? (
              <CategoryForm
                initial={cms ?? { slug: catSlug, name: catLabel }}
                isSub={false}
                onSaved={() => { load(); setEditing(null); }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 group hover:border-primary/30 transition-all">
                {/* Thumbnail preview */}
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-border',
                  !cms?.thumbnail_url && `bg-gradient-to-br ${cms?.bg_color ?? 'from-blue-500 to-blue-700'}`,
                )}>
                  {cms?.thumbnail_url ? (
                    <img src={cms.thumbnail_url} alt={catLabel} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-lg">{catLabel.slice(0, 2)}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{catLabel}</p>
                  <p className="text-xs text-muted-foreground font-mono">/{catSlug}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {cms?.thumbnail_url && <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">Thumbnail</span>}
                    {cms?.banner_url    && <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full">Banner</span>}
                    {!cms              && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Belum diatur</span>}
                    {cms && !cms.is_active && <span className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">Nonaktif</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditing(catSlug)}
                    className="p-2 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {cms && (
                    <button
                      onClick={() => handleDelete(cms.id)}
                      className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SUB-CATEGORIES TAB
// ============================================================
function SubCategoriesTab() {
  const [selectedParent, setSelectedParent] = useState(CATEGORIES[0]?.slug ?? 'pulsa');
  const [cats,    setCats]    = useState<CmsCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding,  setAdding]  = useState(false);

  const load = useCallback(async () => {
    if (!selectedParent) return;
    setLoading(true);
    try { setCats(await getCmsSubCategories(selectedParent)); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }, [selectedParent]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus sub-kategori ini?')) return;
    await deleteCmsCategory(id);
    load();
  };

  const parentCat = CATEGORIES.find(c => c.slug === selectedParent);

  return (
    <div>
      {/* Parent selector */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Pilih Kategori Induk</label>
          <select
            value={selectedParent}
            onChange={e => { setSelectedParent(e.target.value); setEditing(null); setAdding(false); }}
            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>
        </div>
        <div className="flex gap-2 items-end">
          <Button
            onClick={() => { setAdding(true); setEditing(null); }}
            size="sm"
            className="bg-primary text-primary-foreground btn-glow rounded-xl gap-1.5 h-10"
          >
            <Plus className="w-4 h-4" /> Tambah Sub-Kategori
          </Button>
          <Button onClick={load} size="sm" variant="outline" className="rounded-xl gap-1.5 h-10">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {parentCat && (
        <p className="text-sm text-muted-foreground mb-4">
          Sub-kategori untuk <strong>{parentCat.label}</strong> — ditampilkan sebagai grid di halaman <code className="text-xs bg-muted px-1 py-0.5 rounded">/products/{selectedParent}</code>
        </p>
      )}

      {adding && (
        <div className="mb-5">
          <CategoryForm
            isSub={true}
            parentSlug={selectedParent}
            onSaved={() => { load(); setAdding(false); }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> Memuat...
        </div>
      ) : cats.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border">
          <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">Belum ada sub-kategori</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tambahkan sub-kategori (provider/brand) untuk ditampilkan sebagai grid di halaman produk.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {cats.map(cat => (
            <div key={cat.id}>
              {editing === cat.id ? (
                <CategoryForm
                  initial={cat}
                  isSub={true}
                  parentSlug={selectedParent}
                  onSaved={() => { load(); setEditing(null); }}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <div className={cn(
                  'bg-card border rounded-2xl p-4 flex items-center gap-4 group hover:border-primary/30 transition-all',
                  cat.is_active ? 'border-border' : 'border-border/40 opacity-60',
                )}>
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-border',
                    !cat.thumbnail_url && `bg-gradient-to-br ${cat.bg_color}`,
                  )}>
                    {cat.thumbnail_url ? (
                      <img src={cat.thumbnail_url} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold">{cat.name.slice(0, 2)}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">/{cat.slug}</span>
                      {cat.brand_name && <span className="ml-2 text-primary">→ brand: "{cat.brand_name}"</span>}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {cat.thumbnail_url && <span className="text-[10px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded-full">Thumbnail</span>}
                      {cat.banner_url    && <span className="text-[10px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded-full">Banner</span>}
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">#{cat.display_order}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditing(cat.id)} className="p-2 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MEDIA LIBRARY TAB
// ============================================================
function MediaLibraryTab() {
  const [media,     setMedia]     = useState<CmsMedia[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search,    setSearch]    = useState('');
  const [preview,   setPreview]   = useState<CmsMedia | null>(null);
  const [copied,    setCopied]    = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setMedia(await getMediaLibrary()); } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = () => {
    triggerFileInput(async (file) => {
      setUploading(true);
      try {
        const folder = file.name.toLowerCase().includes('banner') ? 'banners'
          : file.name.toLowerCase().includes('icon') ? 'icons'
          : 'thumbnails';
        const { url, fileName } = await uploadToStorage(file, folder as 'thumbnails' | 'banners' | 'icons' | 'backgrounds');
        await saveMedia({
          file_name:     fileName,
          original_name: file.name,
          file_url:      url,
          file_size:     file.size,
          file_type:     file.type,
          media_type:    'image',
          alt_text:      '',
        });
        load();
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Upload gagal');
      } finally {
        setUploading(false);
      }
    });
  };

  const handleDelete = async (m: CmsMedia) => {
    if (!confirm(`Hapus "${m.original_name || m.file_name}"?`)) return;
    await deleteMedia(m.id, m.file_url);
    load();
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const filtered = media.filter(m =>
    !search || m.original_name.toLowerCase().includes(search.toLowerCase()) ||
    m.file_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari gambar..."
            className="pl-9 rounded-xl"
          />
        </div>
        <Button onClick={handleUpload} disabled={uploading} size="sm" className="bg-primary text-primary-foreground btn-glow rounded-xl gap-1.5 h-10">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Mengupload...' : 'Upload Gambar'}
        </Button>
        <Button onClick={load} size="sm" variant="outline" className="rounded-xl gap-1.5 h-10">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mb-4">{media.length} gambar tersimpan</p>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> Memuat...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border">
          <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">Belum ada gambar</p>
          <p className="text-sm text-muted-foreground mt-1">Klik "Upload Gambar" untuk menambahkan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(m => (
            <div key={m.id} className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all">
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={m.file_url}
                  alt={m.original_name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="p-2">
                <p className="text-[10px] text-muted-foreground truncate" title={m.original_name}>
                  {m.original_name || m.file_name.split('/').pop()}
                </p>
                {m.file_size > 0 && (
                  <p className="text-[10px] text-muted-foreground/60">
                    {(m.file_size / 1024).toFixed(0)} KB
                  </p>
                )}
              </div>
              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => setPreview(m)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCopy(m.file_url, m.id)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                  title="Copy URL"
                >
                  {copied === m.id ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(m)}
                  className="p-2 bg-red-500/60 hover:bg-red-500/80 rounded-lg text-white transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm text-foreground truncate">{preview.original_name || preview.file_name}</p>
              <button onClick={() => setPreview(null)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={preview.file_url} alt={preview.original_name} className="w-full max-h-64 object-contain rounded-xl border border-border bg-muted" />
            <div className="mt-3 flex gap-2">
              <Input value={preview.file_url} readOnly className="rounded-xl text-xs font-mono" />
              <Button size="sm" onClick={() => handleCopy(preview.file_url, preview.id)} className="rounded-xl gap-1 flex-shrink-0">
                {copied === preview.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function CmsCategoryManager() {
  const [tab, setTab] = useState<Tab>('top');

  const TABS: { key: Tab; label: string }[] = [
    { key: 'top',   label: 'Kategori Utama' },
    { key: 'sub',   label: 'Sub-Kategori' },
    { key: 'media', label: 'Media Library' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">CMS Kategori</h2>
        <p className="text-sm text-muted-foreground">
          Kelola thumbnail, banner, dan visual kategori produk. Perubahan otomatis tampil di website.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-2xl mb-6 w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              tab === t.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'top'   && <TopCategoriesTab />}
      {tab === 'sub'   && <SubCategoriesTab />}
      {tab === 'media' && <MediaLibraryTab />}
    </div>
  );
}
