import { useState, useEffect, useCallback } from 'react';
import { QrCode, Upload, Loader2, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import BankAccountSettings from './BankAccountSettings';

interface ManualConfig {
  id: string;
  qris_image_url: string;
  qris_active: boolean;
  default_method: string;
}

export default function ManualPaymentSettings() {
  const [tab, setTab] = useState<'qris' | 'bank'>('qris');
  const [config, setConfig] = useState<ManualConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // QRIS form state
  const [qrisPreview, setQrisPreview] = useState('');
  const [qrisActive, setQrisActive] = useState(false);
  const [defaultMethod, setDefaultMethod] = useState<'bank' | 'qris'>('bank');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sc_manual_payment_config')
      .select('*')
      .limit(1)
      .maybeSingle();
    if (data) {
      const cfg = data as ManualConfig;
      setConfig(cfg);
      setQrisPreview(cfg.qris_image_url || '');
      setQrisActive(cfg.qris_active || false);
      setDefaultMethod((cfg.default_method as 'bank' | 'qris') || 'bank');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleQrisFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(f.type)) {
      setResult({ ok: false, msg: 'Format file harus JPG atau PNG' });
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setResult({ ok: false, msg: 'Ukuran file maksimal 5MB' });
      return;
    }
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setQrisPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const saveQris = async () => {
    setSaving(true);
    setResult(null);
    const updates = {
      qris_image_url: qrisPreview,
      qris_active: qrisActive,
      default_method: defaultMethod,
      updated_at: new Date().toISOString(),
    };
    let err;
    if (config?.id) {
      ({ error: err } = await supabase.from('sc_manual_payment_config').update(updates).eq('id', config.id));
    } else {
      ({ error: err } = await supabase.from('sc_manual_payment_config').insert(updates));
    }
    setSaving(false);
    if (err) {
      setResult({ ok: false, msg: err.message });
    } else {
      setResult({ ok: true, msg: 'Konfigurasi QRIS berhasil disimpan!' });
      load();
    }
  };

  const TABS = [
    { key: 'qris' as const, label: 'QRIS', icon: QrCode },
    { key: 'bank' as const, label: 'Rekening Bank', icon: ImageIcon },
  ];

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-foreground">Pengaturan Pembayaran Manual</h2>
        <p className="text-muted-foreground text-sm">Konfigurasi QRIS dan rekening bank untuk pembayaran manual pembeli umum</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all',
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* QRIS Tab */}
      {tab === 'qris' && (
        <div className="max-w-lg space-y-5">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <>
              {/* Active toggle */}
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">QRIS Aktif</p>
                  <p className="text-muted-foreground text-sm">Tampilkan opsi QRIS pada halaman pembayaran manual</p>
                </div>
                <button onClick={() => setQrisActive(v => !v)} className="text-primary">
                  {qrisActive
                    ? <ToggleRight className="w-10 h-10" />
                    : <ToggleLeft className="w-10 h-10 text-muted-foreground" />}
                </button>
              </div>

              {/* Default method */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="font-semibold text-foreground mb-3">Metode Default</p>
                <div className="flex gap-2">
                  {(['bank', 'qris'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setDefaultMethod(m)}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                        defaultMethod === m
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      )}
                    >
                      {m === 'bank' ? 'Transfer Bank' : 'QRIS'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Tab mana yang muncul pertama saat pembeli membuka halaman pembayaran</p>
              </div>

              {/* QRIS Image */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="font-semibold text-foreground mb-3">Gambar QRIS</p>
                <label className={cn(
                  'block rounded-xl border-2 border-dashed transition-all cursor-pointer text-center p-4',
                  qrisPreview ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/50'
                )}>
                  <input type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleQrisFile} className="hidden" />
                  {qrisPreview ? (
                    <div>
                      <img src={qrisPreview} alt="QRIS Preview" className="max-h-48 mx-auto rounded-lg mb-2" />
                      <p className="text-xs text-muted-foreground">Klik untuk ganti gambar</p>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground">Klik untuk upload gambar QRIS</p>
                      <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG • Maks 5MB</p>
                    </div>
                  )}
                </label>
              </div>

              {result && (
                <div className={cn('flex items-center gap-2 p-3 rounded-xl text-sm', result.ok ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-600')}>
                  {result.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {result.msg}
                </div>
              )}

              <Button onClick={saveQris} disabled={saving} className="bg-primary text-primary-foreground btn-glow rounded-xl gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : <><CheckCircle2 className="w-4 h-4" />Simpan Konfigurasi QRIS</>}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Bank Tab */}
      {tab === 'bank' && (
        <div>
          <BankAccountSettings />
        </div>
      )}
    </div>
  );
}
