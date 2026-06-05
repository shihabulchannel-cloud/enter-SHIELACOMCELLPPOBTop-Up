import { useState, useEffect } from 'react';
import { Save, FileText, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type LegalTab = 'refund_policy' | 'privacy_policy' | 'terms_conditions' | 'company_info';

const LEGAL_TABS: { key: LegalTab; label: string }[] = [
  { key: 'refund_policy', label: 'Refund Policy' },
  { key: 'privacy_policy', label: 'Kebijakan Privasi' },
  { key: 'terms_conditions', label: 'Syarat & Ketentuan' },
  { key: 'company_info', label: 'Info Perusahaan' },
];

interface LegalPageData { id?: string; page_key: string; title: string; content: string; last_updated: string; }
interface CompanyData { id?: string; business_name: string; address: string; city: string; province: string; postal_code: string; whatsapp: string; email: string; operating_hours: string; maps_url: string; }

const DEFAULT_COMPANY: CompanyData = { business_name: 'SHIELACOM CELL', address: '', city: '', province: '', postal_code: '', whatsapp: '', email: '', operating_hours: 'Senin-Minggu: 08.00 - 22.00 WIB', maps_url: '' };

// ===== LEGAL PAGE EDITOR =====
function LegalEditor({ pageKey }: { pageKey: 'refund_policy' | 'privacy_policy' | 'terms_conditions' }) {
  const [data, setData] = useState<LegalPageData>({ page_key: pageKey, title: '', content: '', last_updated: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('sc_legal_pages').select('*').eq('page_key', pageKey).maybeSingle()
      .then(({ data: d }) => { if (d) setData(d); setLoading(false); });
  }, [pageKey]);

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...data, last_updated: new Date().toISOString().split('T')[0], updated_at: new Date().toISOString() };
    if (data.id) {
      await supabase.from('sc_legal_pages').update(payload).eq('id', data.id);
    } else {
      const { data: inserted } = await supabase.from('sc_legal_pages').upsert({ ...payload, page_key: pageKey }, { onConflict: 'page_key' }).select().single();
      if (inserted) setData(inserted as LegalPageData);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  };

  const URL_MAP: Record<string, string> = { refund_policy: '/refund-policy', privacy_policy: '/privacy-policy', terms_conditions: '/terms-and-conditions' };

  if (loading) return <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <a href={URL_MAP[pageKey]} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">{URL_MAP[pageKey]} ↗</a>
        {saved && <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3 h-3" /> Tersimpan!</span>}
      </div>
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">Judul Halaman</label>
        <Input value={data.title} onChange={e => setData(d => ({ ...d, title: e.target.value }))} placeholder="Judul halaman" className="rounded-xl" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">Konten</label>
        <p className="text-xs text-muted-foreground mb-2">Gunakan <code className="bg-muted px-1 rounded">## JUDUL BAGIAN</code> untuk sub-judul dan <code className="bg-muted px-1 rounded">- item</code> untuk daftar.</p>
        <textarea
          value={data.content}
          onChange={e => setData(d => ({ ...d, content: e.target.value }))}
          rows={18}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          placeholder="Tulis konten halaman di sini..."
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">Tanggal Pembaruan</label>
        <Input type="date" value={data.last_updated?.split('T')[0] || ''} onChange={e => setData(d => ({ ...d, last_updated: e.target.value }))} className="rounded-xl w-48" />
      </div>
      <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground btn-glow rounded-xl gap-2 h-10">
        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
        Simpan Perubahan
      </Button>
    </div>
  );
}

// ===== COMPANY INFO EDITOR =====
function CompanyInfoEditor() {
  const [data, setData] = useState<CompanyData>(DEFAULT_COMPANY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from('sc_company_info').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data: d }) => { if (d) setData(d); setLoading(false); });
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.business_name.trim()) e.business_name = 'Nama usaha wajib diisi';
    if (!data.address.trim()) e.address = 'Alamat wajib diisi';
    if (!data.whatsapp.trim()) e.whatsapp = 'Nomor WhatsApp wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = { ...data, updated_at: new Date().toISOString() };
    if (data.id) {
      await supabase.from('sc_company_info').update(payload).eq('id', data.id);
    } else {
      const { data: inserted } = await supabase.from('sc_company_info').insert(payload).select().single();
      if (inserted) setData(inserted as CompanyData);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  };

  const f = (k: keyof CompanyData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setData(d => ({ ...d, [k]: e.target.value }));
    setErrors(er => { const n = { ...er }; delete n[k]; return n; });
  };

  if (loading) return <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-5">
      {saved && <div className="bg-green-500/10 border border-green-500/20 text-green-700 text-sm px-4 py-2 rounded-xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Informasi perusahaan berhasil disimpan!</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { key: 'business_name', label: 'Nama Usaha *', placeholder: 'SHIELACOM CELL' },
          { key: 'whatsapp', label: 'Nomor WhatsApp *', placeholder: '6281234567890' },
          { key: 'email', label: 'Email', placeholder: 'cs@shielacomcell.com', type: 'email' },
          { key: 'operating_hours', label: 'Jam Operasional', placeholder: 'Senin-Minggu: 08.00 - 22.00 WIB' },
        ].map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
            <Input type={type || 'text'} value={data[key as keyof CompanyData]} onChange={f(key as keyof CompanyData)} placeholder={placeholder} className={cn('rounded-xl', errors[key] && 'border-red-500')} />
            {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
          </div>
        ))}
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">Alamat Lengkap *</label>
        <textarea value={data.address} onChange={f('address')} rows={2} placeholder="Jl. Contoh No. 123, RT/RW..." className={cn('w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none', errors.address && 'border-red-500')} />
        {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { key: 'city', label: 'Kota', placeholder: 'Jakarta' },
          { key: 'province', label: 'Provinsi', placeholder: 'DKI Jakarta' },
          { key: 'postal_code', label: 'Kode Pos', placeholder: '12345' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
            <Input value={data[key as keyof CompanyData]} onChange={f(key as keyof CompanyData)} placeholder={placeholder} className="rounded-xl" />
          </div>
        ))}
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">Google Maps Embed URL <span className="text-muted-foreground font-normal">(Opsional)</span></label>
        <Input value={data.maps_url} onChange={f('maps_url')} placeholder="https://www.google.com/maps/embed?pb=..." className="rounded-xl" />
        <p className="text-xs text-muted-foreground mt-1">Dari Google Maps: klik Bagikan → Sematkan peta → Salin URL dari atribut src iframe</p>
      </div>

      {/* Preview */}
      <div className="bg-muted/30 border border-border rounded-2xl p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Preview Footer</p>
        <div className="text-sm space-y-1">
          <p className="font-bold text-foreground">{data.business_name || 'NAMA USAHA'}</p>
          {data.address && <p className="text-muted-foreground">Alamat: {data.address}{data.city ? `, ${data.city}` : ''}{data.province ? `, ${data.province}` : ''}{data.postal_code ? ` ${data.postal_code}` : ''}</p>}
          {data.whatsapp && <p className="text-muted-foreground">WhatsApp: {data.whatsapp}</p>}
          {data.email && <p className="text-muted-foreground">Email: {data.email}</p>}
          {data.operating_hours && <p className="text-muted-foreground">Jam Operasional: {data.operating_hours}</p>}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground btn-glow rounded-xl gap-2 h-10">
        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
        Simpan Informasi Perusahaan
      </Button>
    </div>
  );
}

// ===== MAIN =====
export default function LegalSettings() {
  const [tab, setTab] = useState<LegalTab>('refund_policy');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Halaman Legal & Info Perusahaan</h2>
        <p className="text-muted-foreground text-sm">Edit konten halaman legal dan informasi perusahaan yang tampil di website</p>
      </div>

      <div className="flex gap-1 border-b border-border flex-wrap">
        {LEGAL_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap', tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {t.key === 'company_info' ? <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{t.label}</span> : <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />{t.label}</span>}
          </button>
        ))}
      </div>

      {tab === 'company_info' ? (
        <CompanyInfoEditor />
      ) : (
        <LegalEditor pageKey={tab as 'refund_policy' | 'privacy_policy' | 'terms_conditions'} />
      )}
    </div>
  );
}
