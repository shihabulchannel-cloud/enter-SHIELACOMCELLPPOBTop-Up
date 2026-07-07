import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Upload, Eye, EyeOff, GripVertical, Edit2, Check, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { bannerStore, type Banner, logAction } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useImageCrop } from '@/hooks/useImageCrop';

type BannerTheme = Banner['theme'];

const EMPTY_FORM = (): Omit<Banner, 'id'> => ({
  title: '', subtitle: '', badge: '',
  button1Text: 'Beli Sekarang', button1Link: '/products',
  button2Text: 'Hubungi WhatsApp', button2Link: '',
  bannerLink: '',
  imageDataUrl: '', theme: 'game', active: true, order: 0,
});

function BannerForm({
  initial, onSave, onCancel,
}: {
  initial?: Partial<Banner>;
  onSave: (data: Omit<Banner, 'id'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<Banner, 'id'>>({ ...EMPTY_FORM(), ...initial });
  const f = (k: keyof typeof form) => (v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const { triggerCrop, cropModal, uploading: imgUploading, error: imgError } = useImageCrop({
    preset:   'hero_slide',
    onBase64: (dataUrl) => setForm(p => ({ ...p, imageDataUrl: dataUrl })),
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4 animate-scale-in">
      {cropModal}
      {/* Image Upload */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">Gambar Banner</label>
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-full sm:w-48 h-28 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {form.imageDataUrl ? (
              <img src={form.imageDataUrl} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-3">
                <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Belum ada gambar</p>
              </div>
            )}
          </div>
          <div>
            <Button onClick={triggerCrop} disabled={imgUploading} size="sm" variant="outline" className="rounded-xl gap-2 mb-2">
              <Upload className="w-4 h-4" /> Upload Gambar
            </Button>
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP — crop otomatis 16:9.</p>
            {imgError && <p className="text-red-500 text-xs mt-1">{imgError}</p>}
          </div>
        </div>
      </div>
      {/* Banner Link — whole-banner CTA when image is used */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Banner Link (opsional)</label>
        <Input
          value={form.bannerLink ?? ''}
          onChange={e => f('bannerLink')(e.target.value)}
          placeholder="https://wa.me/628xx atau /products"
          className="rounded-xl"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Jika banner punya gambar, seluruh area banner akan mengarah ke URL ini saat diklik.
        </p>
      </div>
      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Judul *</label>
          <Input value={form.title} onChange={e => f('title')(e.target.value)} placeholder="Judul banner" className="rounded-xl" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Badge</label>
          <Input value={form.badge} onChange={e => f('badge')(e.target.value)} placeholder="Top Up Game" className="rounded-xl" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Sub Judul</label>
        <Input value={form.subtitle} onChange={e => f('subtitle')(e.target.value)} placeholder="Deskripsi singkat banner" className="rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Tombol 1 (Teks)</label>
          <Input value={form.button1Text} onChange={e => f('button1Text')(e.target.value)} placeholder="Beli Sekarang" className="rounded-xl" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Tombol 1 (Link)</label>
          <Input value={form.button1Link} onChange={e => f('button1Link')(e.target.value)} placeholder="/products" className="rounded-xl" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Tombol 2 (Teks)</label>
          <Input value={form.button2Text} onChange={e => f('button2Text')(e.target.value)} placeholder="Hubungi WhatsApp" className="rounded-xl" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Tombol 2 (Link)</label>
          <Input value={form.button2Link} onChange={e => f('button2Link')(e.target.value)} placeholder="Kosong = WA admin" className="rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Tema Warna</label>
          <select value={form.theme} onChange={e => f('theme')(e.target.value)} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="game">Game (Ungu)</option>
            <option value="pulsa">Pulsa (Hijau)</option>
            <option value="pln">PLN (Kuning)</option>
            <option value="all">Semua (Hijau Tua)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
          <select value={form.active ? 'active' : 'inactive'} onChange={e => f('active')(e.target.value === 'active')} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => { if (form.title) onSave(form); }} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-1 btn-glow">
          <Check className="w-4 h-4" /> Simpan
        </Button>
        <Button onClick={onCancel} size="sm" variant="outline" className="rounded-xl gap-1">
          <X className="w-4 h-4" /> Batal
        </Button>
      </div>
    </div>
  );
}

export default function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [preview, setPreview] = useState<Banner | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  useEffect(() => { setBanners(bannerStore.get()); }, []);

  const refresh = () => setBanners(bannerStore.get());

  const handleAdd = (data: Omit<Banner, 'id'>) => {
    bannerStore.add({ ...data, order: banners.length + 1 });
    refresh(); setAdding(false);
  };

  const handleEdit = (id: string, data: Omit<Banner, 'id'>) => {
    bannerStore.update(id, data); refresh(); setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Hapus banner ini?')) return;
    bannerStore.remove(id); refresh();
  };

  const toggleActive = (banner: Banner) => {
    bannerStore.update(banner.id, { active: !banner.active }); refresh();
    logAction('BANNER_TOGGLE', `${banner.active ? 'Nonaktifkan' : 'Aktifkan'} banner: ${banner.title}`);
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) return;
    const list = [...banners];
    const [moved] = list.splice(dragItem.current, 1);
    list.splice(dragOver.current, 0, moved);
    const reordered = list.map((b, i) => ({ ...b, order: i + 1 }));
    bannerStore.set(reordered);
    setBanners(reordered);
    dragItem.current = null; dragOver.current = null;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Banner & Slider</h2>
          <p className="text-muted-foreground text-sm">{banners.filter(b => b.active).length} aktif dari {banners.length} banner</p>
        </div>
        <Button onClick={() => { setAdding(!adding); setEditing(null); }} size="sm" className="bg-primary text-primary-foreground btn-glow rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Tambah Banner
        </Button>
      </div>

      {adding && <div className="mb-4"><BannerForm onSave={handleAdd} onCancel={() => setAdding(false)} /></div>}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-card rounded-2xl p-4 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-3">
              <h3 className="font-bold">Preview: {preview.title}</h3>
              <button onClick={() => setPreview(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            {preview.imageDataUrl ? (
              <img src={preview.imageDataUrl} alt={preview.title} className="w-full h-48 object-cover rounded-xl mb-3" />
            ) : (
              <div className="w-full h-48 bg-muted rounded-xl flex items-center justify-center mb-3">
                <p className="text-muted-foreground text-sm">Tidak ada gambar</p>
              </div>
            )}
            <p className="font-bold text-foreground">{preview.title}</p>
            <p className="text-muted-foreground text-sm">{preview.subtitle}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {banners.map((banner, i) => (
          <div key={banner.id}>
            {editing === banner.id ? (
              <BannerForm initial={banner} onSave={(data) => handleEdit(banner.id, data)} onCancel={() => setEditing(null)} />
            ) : (
              <div
                className={cn('bg-card border rounded-2xl p-4 transition-all', banner.active ? 'border-border' : 'border-border/30 opacity-60')}
                draggable
                onDragStart={() => { dragItem.current = i; }}
                onDragEnter={() => { dragOver.current = i; }}
                onDragEnd={handleDragEnd}
              >
                <div className="flex items-center gap-3">
                  <div className="cursor-grab text-muted-foreground flex-shrink-0">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="w-16 h-10 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {banner.imageDataUrl ? (
                      <img src={banner.imageDataUrl} alt={banner.title} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground text-sm truncate">{banner.title}</p>
                      <Badge className={cn('text-xs border', banner.active ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border')}>
                        {banner.active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs truncate">{banner.subtitle || 'Tidak ada subtitle'}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setPreview(banner)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Preview">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleActive(banner)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors" title={banner.active ? 'Nonaktifkan' : 'Aktifkan'}>
                      {banner.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-primary" />}
                    </button>
                    <button onClick={() => { setEditing(banner.id); setAdding(false); }} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(banner.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {banners.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Belum ada banner. Tambah banner pertama Anda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
