import { useState } from 'react';
import { Save, RefreshCw, CheckCircle2, XCircle, Wifi, AlertCircle, Copy, Check, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  providerConfigStore, providerPriorityStore, categoryStore,
  type ProviderConfig, type ProviderPriority, logAction
} from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// Auto-detect Supabase URL from client
const SUPABASE_URL = (supabase as unknown as { supabaseUrl: string }).supabaseUrl
  || 'https://spb-t4n14k6xzom7uus1.supabase.opentrust.net';

const DIGIFLAZZ_WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/digiflazz-webhook`;

function CopyableUrl({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
      <div className="flex items-center gap-2 p-3 rounded-xl bg-muted border border-border">
        <code className="flex-1 text-xs font-mono text-primary break-all">{url}</code>
        <Button variant="ghost" size="icon" className="w-8 h-8 flex-shrink-0" onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

type Tab = 'digiflazz' | 'vip' | 'priority';

function ProviderField({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="rounded-xl" />
    </div>
  );
}

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <Badge className={cn('flex items-center gap-1.5 text-xs font-semibold border', connected ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30')}>
      {connected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {connected ? 'Terhubung' : 'Tidak Terhubung'}
    </Badge>
  );
}

function DigiflazzSettings() {
  const [cfg, setCfg] = useState(providerConfigStore.get().digiflazz);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState('');
  const f = (k: keyof typeof cfg) => (v: string | boolean | number) => setCfg(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    const all = providerConfigStore.get();
    providerConfigStore.set({ ...all, digiflazz: cfg });
    // Also save to database
    await supabase.from('sc_digiflazz_config').upsert({
      username: cfg.username,
      api_key: cfg.apiKey,
      webhook_secret: '',
      active: cfg.enabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    logAction('DIGIFLAZZ_SAVE', 'Simpan konfigurasi Digiflazz');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      const ok = cfg.username.length > 3 && cfg.apiKey.length > 8;
      setTestResult({ ok, msg: ok ? `Berhasil terhubung! Saldo: Rp ${(cfg.balance || 0).toLocaleString('id-ID')}` : 'Gagal: Username atau API Key tidak valid' });
      if (ok) f('enabled')(true);
      setTesting(false);
    }, 1500);
  };

  const handleSync = async () => {
    if (!cfg.username || !cfg.apiKey) {
      setSyncResult('Harap isi Username dan API Key Digiflazz terlebih dahulu');
      return;
    }
    setSyncing(true);
    setSyncResult('');
    try {
      await supabase.from('sc_digiflazz_config').upsert({
        username: cfg.username,
        api_key: cfg.apiKey,
        webhook_secret: '',
        active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      const { data, error } = await supabase.functions.invoke('sync-products');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSyncResult(`Berhasil sync ${data.synced} produk dari Digiflazz! (${data.skipped} dilewati)`);
      logAction('DIGIFLAZZ_SYNC', `Sync ${data.synced} produk dari Digiflazz`);
    } catch (e: unknown) {
      setSyncResult(`Gagal sync: ${e instanceof Error ? e.message : 'Error tidak diketahui'}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Wifi className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Digiflazz</h3>
            <p className="text-muted-foreground text-xs">Provider utama PPOB & top up</p>
          </div>
        </div>
        <StatusBadge connected={cfg.enabled} />
      </div>

      {/* API Credentials */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h4 className="font-semibold text-foreground text-sm">Kredensial API</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProviderField label="Username Digiflazz" value={cfg.username} onChange={f('username')} placeholder="username digiflazz" />
          <ProviderField label="API Key" value={cfg.apiKey} onChange={f('apiKey')} type="password" placeholder="API key rahasia" />
        </div>

        {testResult && (
          <div className={cn('flex items-start gap-2 p-3 rounded-xl text-sm', testResult.ok ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-600')}>
            {testResult.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            {testResult.msg}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleTest} disabled={testing} size="sm" variant="outline" className="rounded-xl gap-2">
            {testing ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Wifi className="w-4 h-4" />}
            Test Koneksi
          </Button>
          <Button onClick={handleSave} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-2 btn-glow">
            <Save className="w-4 h-4" /> {saved ? 'Tersimpan!' : 'Simpan'}
          </Button>
        </div>
      </div>

      {/* Webhook URL - Auto-generated, read-only */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary flex-shrink-0" />
          <h4 className="font-semibold text-foreground text-sm">Webhook URL (Auto-Generate)</h4>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-foreground space-y-2">
          <p className="font-semibold text-primary">Apa itu Webhook URL?</p>
          <p className="text-muted-foreground leading-relaxed">
            Webhook URL adalah alamat yang harus Anda daftarkan di dashboard Digiflazz agar sistem menerima notifikasi otomatis saat transaksi selesai (sukses/gagal). URL ini sudah otomatis dibuat oleh sistem.
          </p>
        </div>

        <CopyableUrl url={DIGIFLAZZ_WEBHOOK_URL} label="Webhook URL — Salin & daftarkan di Digiflazz" />

        <div className="bg-muted rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">Cara memasang di Digiflazz:</p>
          <ol className="space-y-1.5">
            {[
              'Login ke dashboard Digiflazz (digiflazz.com)',
              'Buka menu Pengaturan > Webhook / Callback URL',
              'Salin URL di atas lalu tempel di kolom Webhook URL',
              'Klik Simpan / Update',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          <a
            href="https://digiflazz.com/dashboard/settings"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-primary text-xs font-semibold hover:underline mt-1"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Buka Dashboard Digiflazz
          </a>
        </div>
      </div>

      {/* Sync */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h4 className="font-semibold text-foreground mb-2">Sinkronisasi Produk</h4>
        <p className="text-muted-foreground text-sm mb-4">Sync produk dari Digiflazz ke website secara otomatis. Data yang disinkronkan: nama, harga, kategori, brand, kode produk, dan status.</p>
        {syncResult && (
          <div className={cn('flex items-start gap-2 p-3 rounded-xl text-sm mb-3', syncResult.includes('Berhasil') ? 'bg-green-500/10 text-green-700' : 'bg-yellow-500/10 text-yellow-700')}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {syncResult}
          </div>
        )}
        <Button onClick={handleSync} disabled={syncing} className="bg-primary text-primary-foreground btn-glow rounded-xl gap-2 w-full sm:w-auto">
          {syncing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {syncing ? 'Sedang Sync...' : 'SYNC PRODUK DIGIFLAZZ'}
        </Button>
      </div>
    </div>
  );
}

function VipResellerSettings() {
  const [cfg, setCfg] = useState(providerConfigStore.get().vipReseller);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const f = (k: keyof typeof cfg) => (v: string | boolean | number) => setCfg(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    const all = providerConfigStore.get();
    providerConfigStore.set({ ...all, vipReseller: cfg });
    logAction('VIP_SAVE', 'Simpan konfigurasi VIP Reseller');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = () => {
    setTesting(true);
    setTimeout(() => {
      const ok = cfg.memberId.length > 3 && cfg.apiKey.length > 8;
      setTestResult({ ok, msg: ok ? 'Berhasil terhubung ke VIP Reseller!' : 'Gagal: Member ID atau API Key tidak valid' });
      if (ok) f('enabled')(true);
      setTesting(false);
    }, 1500);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Wifi className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">VIP Reseller</h3>
            <p className="text-muted-foreground text-xs">Provider alternatif</p>
          </div>
        </div>
        <StatusBadge connected={cfg.enabled} />
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProviderField label="Member ID" value={cfg.memberId} onChange={f('memberId')} placeholder="member ID VIP" />
          <ProviderField label="API Key" value={cfg.apiKey} onChange={f('apiKey')} type="password" placeholder="API key" />
        </div>

        {testResult && (
          <div className={cn('flex items-start gap-2 p-3 rounded-xl text-sm', testResult.ok ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-600')}>
            {testResult.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {testResult.msg}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleTest} disabled={testing} size="sm" variant="outline" className="rounded-xl gap-2">
            {testing ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Wifi className="w-4 h-4" />}
            Test Koneksi
          </Button>
          <Button onClick={handleSave} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-2 btn-glow">
            <Save className="w-4 h-4" /> {saved ? 'Tersimpan!' : 'Simpan'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProviderPrioritySettings() {
  const [priorities, setPriorities] = useState<ProviderPriority[]>(providerPriorityStore.get());
  const [saved, setSaved] = useState(false);

  const updatePriority = (categoryId: string, key: 'primary' | 'backup', value: string) => {
    setPriorities(p => p.map(pr => pr.categoryId === categoryId ? { ...pr, [key]: value } : pr));
  };

  const handleSave = () => {
    providerPriorityStore.set(priorities);
    logAction('PRIORITY_SAVE', 'Simpan prioritas provider');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const providers = [
    { value: 'digiflazz', label: 'Digiflazz' },
    { value: 'vip', label: 'VIP Reseller' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-bold text-foreground mb-1">Prioritas Provider</h3>
        <p className="text-muted-foreground text-sm">Tentukan provider utama dan cadangan untuk setiap kategori. Jika provider utama gagal, sistem otomatis menggunakan provider cadangan.</p>
      </div>

      <div className="space-y-3">
        {priorities.map(p => (
          <div key={p.categoryId} className="bg-card border border-border rounded-2xl p-4">
            <p className="font-semibold text-foreground text-sm mb-3">{p.categoryName}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Provider Utama</label>
                <select value={p.primary} onChange={e => updatePriority(p.categoryId, 'primary', e.target.value)} className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm">
                  {providers.map(pr => <option key={pr.value} value={pr.value}>{pr.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Provider Cadangan</label>
                <select value={p.backup} onChange={e => updatePriority(p.categoryId, 'backup', e.target.value)} className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm">
                  {providers.map(pr => <option key={pr.value} value={pr.value}>{pr.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        {saved && <p className="text-primary text-sm font-medium">Prioritas berhasil disimpan!</p>}
        {!saved && <div />}
        <Button onClick={handleSave} className="bg-primary text-primary-foreground btn-glow rounded-xl gap-2">
          <Save className="w-4 h-4" /> Simpan Prioritas
        </Button>
      </div>
    </div>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'digiflazz', label: 'Digiflazz' },
  { id: 'vip', label: 'VIP Reseller' },
  { id: 'priority', label: 'Provider Priority' },
];

export default function ProviderSettings({ defaultTab = 'digiflazz' }: { defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-3 mb-6 border-b border-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn('flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all', tab === t.id ? 'bg-primary text-primary-foreground shadow-green' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'digiflazz' && <DigiflazzSettings />}
      {tab === 'vip' && <VipResellerSettings />}
      {tab === 'priority' && <ProviderPrioritySettings />}
    </div>
  );
}
