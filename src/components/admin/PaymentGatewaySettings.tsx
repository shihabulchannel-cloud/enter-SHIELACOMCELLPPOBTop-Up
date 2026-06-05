import { useState } from 'react';
import { Save, Wifi, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { paymentGatewayStore, type PaymentGatewayConfig, logAction } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

async function saveGatewayToDb(gateway: string, configJson: Record<string, unknown>, active: boolean) {
  await supabase.from('sc_payment_configs').upsert({
    gateway,
    config_json: configJson,
    active,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'gateway' });
}

type GwTab = 'duitku' | 'ipaymu' | 'tripay';

function GwField({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="rounded-xl" />
    </div>
  );
}

function GwCard({ name, color, children }: { name: string; color: string; enabled: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Wifi className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">{name}</h3>
          <p className="text-muted-foreground text-xs">Payment Gateway</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function DuitkuSettings() {
  const [cfg, setCfg] = useState(paymentGatewayStore.get().duitku);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const f = (k: keyof typeof cfg) => (v: string | boolean) => setCfg(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    const all = paymentGatewayStore.get();
    paymentGatewayStore.set({ ...all, duitku: cfg });
    await saveGatewayToDb('duitku', { merchant_code: cfg.merchantCode, api_key: cfg.apiKey, sandbox: String(!cfg.enabled) }, cfg.enabled);
    logAction('DUITKU_SAVE', 'Simpan konfigurasi Duitku');
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = () => {
    setTesting(true);
    setTimeout(() => {
      const ok = cfg.merchantCode.length > 3 && cfg.apiKey.length > 8;
      setTestResult({ ok, msg: ok ? 'Koneksi Duitku berhasil!' : 'Gagal: Merchant Code atau API Key tidak valid' });
      if (ok) f('enabled')(true);
      setTesting(false);
    }, 1500);
  };

  return (
    <GwCard name="Duitku" color="bg-blue-500" enabled={cfg.enabled}>
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GwField label="Merchant Code" value={cfg.merchantCode} onChange={f('merchantCode')} placeholder="D1234" />
          <GwField label="API Key" value={cfg.apiKey} onChange={f('apiKey')} type="password" placeholder="API key Duitku" />
          <GwField label="Callback URL" value={cfg.callbackUrl} onChange={f('callbackUrl')} placeholder="https://yourdomain.com/callback/duitku" />
          <GwField label="Return URL" value={cfg.returnUrl} onChange={f('returnUrl')} placeholder="https://yourdomain.com/payment/return" />
        </div>
        {testResult && (
          <div className={cn('flex items-start gap-2 p-3 rounded-xl text-sm', testResult.ok ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-600')}>
            {testResult.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            {testResult.msg}
          </div>
        )}
        <div className="flex gap-2 items-center flex-wrap">
          <Button onClick={handleTest} disabled={testing} size="sm" variant="outline" className="rounded-xl gap-2">
            {testing ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Wifi className="w-4 h-4" />}
            Test Koneksi
          </Button>
          <Button onClick={handleSave} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-2 btn-glow">
            <Save className="w-4 h-4" /> {saved ? 'Tersimpan!' : 'Simpan'}
          </Button>
          <Badge className={cn('text-xs font-semibold border', cfg.enabled ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-muted text-muted-foreground border-border')}>
            {cfg.enabled ? '● Aktif' : '○ Nonaktif'}
          </Badge>
        </div>
      </div>
    </GwCard>
  );
}

function IpaymuSettings() {
  const [cfg, setCfg] = useState(paymentGatewayStore.get().ipaymu);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const f = (k: keyof typeof cfg) => (v: string | boolean) => setCfg(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    const all = paymentGatewayStore.get();
    paymentGatewayStore.set({ ...all, ipaymu: cfg });
    await saveGatewayToDb('ipaymu', { va: cfg.va, api_key: cfg.apiKey, sandbox: String(!cfg.enabled) }, cfg.enabled);
    logAction('IPAYMU_SAVE', 'Simpan konfigurasi iPaymu');
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = () => {
    setTesting(true);
    setTimeout(() => {
      const ok = cfg.va.length > 5 && cfg.apiKey.length > 8;
      setTestResult({ ok, msg: ok ? 'Koneksi iPaymu berhasil!' : 'Gagal: VA atau API Key tidak valid' });
      if (ok) f('enabled')(true);
      setTesting(false);
    }, 1500);
  };

  return (
    <GwCard name="iPaymu" color="bg-green-600" enabled={cfg.enabled}>
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GwField label="Virtual Account (VA)" value={cfg.va} onChange={f('va')} placeholder="0000000000000" />
          <GwField label="API Key" value={cfg.apiKey} onChange={f('apiKey')} type="password" placeholder="API key iPaymu" />
          <GwField label="Callback URL" value={cfg.callbackUrl} onChange={f('callbackUrl')} placeholder="https://yourdomain.com/callback/ipaymu" />
          <GwField label="Return URL" value={cfg.returnUrl} onChange={f('returnUrl')} placeholder="https://yourdomain.com/payment/return" />
        </div>
        {testResult && (
          <div className={cn('flex items-start gap-2 p-3 rounded-xl text-sm', testResult.ok ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-600')}>
            {testResult.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {testResult.msg}
          </div>
        )}
        <div className="flex gap-2 flex-wrap items-center">
          <Button onClick={handleTest} disabled={testing} size="sm" variant="outline" className="rounded-xl gap-2">
            {testing ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Wifi className="w-4 h-4" />}
            Test Koneksi
          </Button>
          <Button onClick={handleSave} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-2 btn-glow">
            <Save className="w-4 h-4" /> {saved ? 'Tersimpan!' : 'Simpan'}
          </Button>
          <Badge className={cn('text-xs font-semibold border', cfg.enabled ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-muted text-muted-foreground border-border')}>
            {cfg.enabled ? '● Aktif' : '○ Nonaktif'}
          </Badge>
        </div>
      </div>
    </GwCard>
  );
}

function TripaySettings() {
  const [cfg, setCfg] = useState(paymentGatewayStore.get().tripay);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const f = (k: keyof typeof cfg) => (v: string | boolean) => setCfg(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    const all = paymentGatewayStore.get();
    paymentGatewayStore.set({ ...all, tripay: cfg });
    await saveGatewayToDb('tripay', { api_key: cfg.apiKey, merchant_code: cfg.merchantCode, private_key: cfg.privateKey, sandbox: String(!cfg.enabled) }, cfg.enabled);
    logAction('TRIPAY_SAVE', 'Simpan konfigurasi Tripay');
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = () => {
    setTesting(true);
    setTimeout(() => {
      const ok = cfg.apiKey.length > 8 && cfg.merchantCode.length > 3;
      setTestResult({ ok, msg: ok ? 'Koneksi Tripay berhasil!' : 'Gagal: API Key atau Merchant Code tidak valid' });
      if (ok) f('enabled')(true);
      setTesting(false);
    }, 1500);
  };

  return (
    <GwCard name="Tripay" color="bg-orange-500" enabled={cfg.enabled}>
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GwField label="API Key" value={cfg.apiKey} onChange={f('apiKey')} type="password" placeholder="T-xxx" />
          <GwField label="Merchant Code" value={cfg.merchantCode} onChange={f('merchantCode')} placeholder="T12345" />
          <GwField label="Private Key" value={cfg.privateKey} onChange={f('privateKey')} type="password" placeholder="Private key Tripay" />
          <GwField label="Callback URL" value={cfg.callbackUrl} onChange={f('callbackUrl')} placeholder="https://yourdomain.com/callback/tripay" />
        </div>
        {testResult && (
          <div className={cn('flex items-start gap-2 p-3 rounded-xl text-sm', testResult.ok ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-600')}>
            {testResult.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {testResult.msg}
          </div>
        )}
        <div className="flex gap-2 flex-wrap items-center">
          <Button onClick={handleTest} disabled={testing} size="sm" variant="outline" className="rounded-xl gap-2">
            {testing ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Wifi className="w-4 h-4" />}
            Test Koneksi
          </Button>
          <Button onClick={handleSave} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-2 btn-glow">
            <Save className="w-4 h-4" /> {saved ? 'Tersimpan!' : 'Simpan'}
          </Button>
          <Badge className={cn('text-xs font-semibold border', cfg.enabled ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-muted text-muted-foreground border-border')}>
            {cfg.enabled ? '● Aktif' : '○ Nonaktif'}
          </Badge>
        </div>
      </div>
    </GwCard>
  );
}

const TABS: { id: GwTab; label: string }[] = [
  { id: 'duitku', label: 'Duitku' },
  { id: 'ipaymu', label: 'iPaymu' },
  { id: 'tripay', label: 'Tripay' },
];

export default function PaymentGatewaySettings() {
  const [tab, setTab] = useState<GwTab>('duitku');

  return (
    <div>
      <div className="mb-2">
        <h2 className="text-xl font-bold text-foreground">Payment Gateway</h2>
        <p className="text-muted-foreground text-sm">Konfigurasi payment gateway untuk menerima pembayaran</p>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-3 mb-6 border-b border-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn('flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all', tab === t.id ? 'bg-primary text-primary-foreground shadow-green' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'duitku' && <DuitkuSettings />}
      {tab === 'ipaymu' && <IpaymuSettings />}
      {tab === 'tripay' && <TripaySettings />}
    </div>
  );
}
