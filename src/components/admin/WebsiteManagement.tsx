import { useState } from 'react';
import { Save, Upload, Globe, FileText, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  siteSettingsStore, socialMediaStore, seoStore, cmsStore,
  type SiteSettings, type SocialMedia, type SeoSettings, type CmsContent, logAction
} from '@/lib/store';
import { readFileAsDataUrl, triggerFileInput } from '@/lib/image-upload';
import { cn } from '@/lib/utils';

type SubSection = 'general' | 'logo' | 'cms' | 'footer' | 'seo' | 'social';

function SectionHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      {desc && <p className="text-muted-foreground text-sm mt-1">{desc}</p>}
    </div>
  );
}

function SaveBar({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-border mt-6">
      {saved && <p className="text-primary text-sm font-medium animate-fade-up">Perubahan disimpan!</p>}
      {!saved && <div />}
      <Button onClick={onSave} className="bg-primary text-primary-foreground btn-glow rounded-xl gap-2">
        <Save className="w-4 h-4" /> Simpan Perubahan
      </Button>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, type = 'text', hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="rounded-xl" />
      {hint && <p className="text-muted-foreground text-xs mt-1">{hint}</p>}
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
      <textarea
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

// ===== GENERAL SETTINGS =====
function GeneralSettings() {
  const [form, setForm] = useState<SiteSettings>(siteSettingsStore.get());
  const [saved, setSaved] = useState(false);
  const f = (k: keyof SiteSettings) => (v: string) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => {
    siteSettingsStore.set(form);
    document.title = form.siteName;
    logAction('SITE_SETTINGS', 'Update pengaturan umum website');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };
  return (
    <div>
      <SectionHeader title="Pengaturan Umum" desc="Atur informasi dasar website Anda" />
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Nama Website" value={form.siteName} onChange={f('siteName')} placeholder="SHIELACOM CELL" />
          <TextField label="Tagline" value={form.tagline} onChange={f('tagline')} placeholder="Transaksi Digital Cepat..." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="WhatsApp" value={form.whatsapp} onChange={f('whatsapp')} placeholder="6281234567890" hint="Format: 62xxx (tanpa +)" />
          <TextField label="Email" value={form.email} onChange={f('email')} type="email" placeholder="cs@example.com" />
        </div>
        <TextField label="Alamat" value={form.address} onChange={f('address')} placeholder="Indonesia" />
        <SaveBar onSave={handleSave} saved={saved} />
      </div>
    </div>
  );
}

// ===== LOGO UPLOAD =====
function LogoManager() {
  const [settings, setSettings] = useState<SiteSettings>(siteSettingsStore.get());
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = () => {
    triggerFileInput(async (file) => {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const updated = { ...settings, logoDataUrl: dataUrl };
        setSettings(updated);
        siteSettingsStore.set(updated);
        logAction('LOGO_UPLOAD', 'Upload logo baru');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Upload gagal');
        setTimeout(() => setError(''), 3000);
      }
    });
  };

  const handleRemove = () => {
    const updated = { ...settings, logoDataUrl: '' };
    setSettings(updated);
    siteSettingsStore.set(updated);
    logAction('LOGO_REMOVE', 'Hapus logo');
  };

  return (
    <div>
      <SectionHeader title="Logo Website" desc="Upload logo untuk ditampilkan di header dan footer" />
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-32 h-20 rounded-2xl border-2 border-dashed border-border flex items-center justify-center bg-muted overflow-hidden">
            {settings.logoDataUrl ? (
              <img src={settings.logoDataUrl} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <div className="text-center">
                <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Belum ada logo</p>
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground mb-2">Format: PNG, SVG, WEBP</p>
            <p className="text-xs text-muted-foreground mb-4">Rekomendasi ukuran: 200x60px. Maksimal 2MB.</p>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleUpload} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-2 btn-glow">
                <Upload className="w-4 h-4" /> Upload Logo
              </Button>
              {settings.logoDataUrl && (
                <Button onClick={handleRemove} size="sm" variant="outline" className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10">
                  Hapus Logo
                </Button>
              )}
            </div>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            {saved && <p className="text-primary text-xs mt-2 font-medium">Logo berhasil diperbarui!</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== CMS CONTENT =====
function CmsEditor() {
  const [form, setForm] = useState<CmsContent>(cmsStore.get());
  const [saved, setSaved] = useState(false);
  const f = (k: keyof CmsContent) => (v: string) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => {
    cmsStore.set(form);
    logAction('CMS_UPDATE', 'Update konten CMS website');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };
  return (
    <div>
      <SectionHeader title="CMS Konten" desc="Ubah teks dan konten yang tampil di website" />
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="border-b border-border pb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-primary" /> Hero Section
          </h3>
          <div className="space-y-3">
            <TextField label="Judul Hero" value={form.heroTitle} onChange={f('heroTitle')} />
            <TextField label="Subtitle Hero" value={form.heroSubtitle} onChange={f('heroSubtitle')} />
          </div>
        </div>
        <div className="border-b border-border pb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-blue-500" /> Section Lainnya
          </h3>
          <div className="space-y-3">
            <TextField label="Judul Keunggulan" value={form.featuresTitle} onChange={f('featuresTitle')} />
            <TextField label="Subtitle Keunggulan" value={form.featuresSubtitle} onChange={f('featuresSubtitle')} />
            <TextField label="Judul Cara Transaksi" value={form.howToTitle} onChange={f('howToTitle')} />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-orange-500" /> Reseller & Footer
          </h3>
          <div className="space-y-3">
            <TextField label="Judul Section Reseller" value={form.resellerTitle} onChange={f('resellerTitle')} />
            <TextField label="Subtitle Reseller" value={form.resellerSubtitle} onChange={f('resellerSubtitle')} />
            <TextAreaField label="Deskripsi Footer" value={form.footerAbout} onChange={f('footerAbout')} rows={2} />
          </div>
        </div>
        <SaveBar onSave={handleSave} saved={saved} />
      </div>
    </div>
  );
}

// ===== SEO =====
function SeoManager() {
  const [form, setForm] = useState<SeoSettings>(seoStore.get());
  const [saved, setSaved] = useState(false);
  const f = (k: keyof SeoSettings) => (v: string) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => {
    seoStore.set(form);
    document.title = form.metaTitle;
    logAction('SEO_UPDATE', 'Update pengaturan SEO');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleOgUpload = () => {
    triggerFileInput(async (file) => {
      const dataUrl = await readFileAsDataUrl(file);
      setForm(p => ({ ...p, ogImageDataUrl: dataUrl }));
    });
  };

  return (
    <div>
      <SectionHeader title="SEO Management" desc="Optimasi mesin pencari untuk website Anda" />
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <TextField label="Meta Title" value={form.metaTitle} onChange={f('metaTitle')} placeholder="Judul halaman untuk SEO" hint="Rekomendasi: 50-60 karakter" />
        <TextAreaField label="Meta Description" value={form.metaDescription} onChange={f('metaDescription')} placeholder="Deskripsi singkat website" rows={3} />
        <TextField label="Keywords" value={form.keywords} onChange={f('keywords')} placeholder="pulsa murah, top up game, token pln..." hint="Pisahkan dengan koma" />
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">OG Image (Social Share Image)</label>
          <div className="flex items-center gap-4">
            {form.ogImageDataUrl && (
              <img src={form.ogImageDataUrl} alt="OG" className="w-24 h-14 object-cover rounded-lg border border-border" />
            )}
            <Button onClick={handleOgUpload} size="sm" variant="outline" className="rounded-xl gap-2">
              <Upload className="w-4 h-4" /> Upload OG Image
            </Button>
          </div>
        </div>
        <SaveBar onSave={handleSave} saved={saved} />
      </div>
    </div>
  );
}

// ===== SOCIAL MEDIA =====
function SocialMediaManager() {
  const [form, setForm] = useState<SocialMedia>(socialMediaStore.get());
  const [saved, setSaved] = useState(false);
  const f = (k: keyof SocialMedia) => (v: string) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => {
    socialMediaStore.set(form);
    logAction('SOCIAL_UPDATE', 'Update sosial media');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };
  const fields: { key: keyof SocialMedia; label: string; placeholder: string }[] = [
    { key: 'whatsapp', label: 'WhatsApp', placeholder: '6281234567890' },
    { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
    { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@...' },
    { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/...' },
    { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@...' },
  ];
  return (
    <div>
      <SectionHeader title="Sosial Media" desc="Atur link sosial media yang tampil di website" />
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(f2 => (
            <TextField key={f2.key} label={f2.label} value={form[f2.key]} onChange={f(f2.key)} placeholder={f2.placeholder} />
          ))}
        </div>
        <SaveBar onSave={handleSave} saved={saved} />
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====
const subSections = [
  { id: 'general', label: 'Pengaturan Umum' },
  { id: 'logo', label: 'Logo Website' },
  { id: 'cms', label: 'CMS Konten' },
  { id: 'seo', label: 'SEO' },
  { id: 'social', label: 'Sosial Media' },
];

export default function WebsiteManagement({ defaultSection = 'general' }: { defaultSection?: SubSection }) {
  const [active, setActive] = useState<SubSection>(defaultSection);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-3 mb-6 border-b border-border">
        {subSections.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s.id as SubSection)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              active === s.id ? 'bg-primary text-primary-foreground shadow-green' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      {active === 'general' && <GeneralSettings />}
      {active === 'logo' && <LogoManager />}
      {active === 'cms' && <CmsEditor />}
      {active === 'seo' && <SeoManager />}
      {active === 'social' && <SocialMediaManager />}
    </div>
  );
}
