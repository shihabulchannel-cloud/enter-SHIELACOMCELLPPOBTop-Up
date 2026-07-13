import { useState, useEffect } from 'react';
import { Save, Wifi, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { logAction } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { getAdminSession } from '@/lib/admin-auth';
import { cn } from '@/lib/utils';

// ─── DB helper (via secure admin-api Edge Function) ──────────────────────────
async function saveGatewayToDb(gateway: string, configJson: Record<string, unknown>, active: boolean) {
  const session = getAdminSession();
  const { data, error } = await supabase.functions.invoke('admin-api', {
    body: { action: 'payment_save', payload: { data: { gateway, config_json: configJson, active } } },
    headers: { Authorization: `Bearer ${session?.session_token ?? ''}` },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}

async function loadGatewayFromDb(gateway: string) {
  const { data } = await supabase.from('sc_payment_configs')
    .select('config_json, active').eq('gateway', gateway).maybeSingle();
  return data;
}

type GwTab = 'duitku' | 'ipaymu' | 'tripay';

function GwField({ label, value, onChange, type = 'text', placeholder, readonly }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; readonly?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} className="rounded-xl" readOnly={readonly} />
    </div>
  );
}

function GwStatusBadge({ active, loading }: { active: boolean; loading: boolean }) {
  if (loading) return <Badge className="border text-xs"><Loader2 className="w-3 h-3 animate-spin mr-1" /> Memuat...</Badge>;
  return (
    <Badge className={cn('text-xs font-semibold border', active
      ? 'bg-green-500/10 text-green-600 border-green-500/30'
      : 'bg-muted text-muted-foreground border-border')}>
      {active ? '● Aktif (dari database)' : '○ Nonaktif'}
    </Badge>
  );
}

// ─── DUITKU ──────────────────────────────────────────────────────────────────
// URL backend (Enter Cloud) & domain toko — dipakai sebagai default Callback/Return URL
const DUITKU_DEFAULT_CALLBACK_URL = 'https://spb-t4n14k6xzom7uus1.supabase.opentrust.net/functions/v1/payment-webhook?gateway=duitku';
const DUITKU_DEFAULT_RETURN_URL = 'https://shielacomcell.my.id/order-status';

function DuitkuSettings() {
  const [cfg, setCfg] = useState({
    merchantCode: '', apiKey: '',
    callbackUrl: DUITKU_DEFAULT_CALLBACK_URL, returnUrl: DUITKU_DEFAULT_RETURN_URL,
    enabled: false,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);
  const [saveError, setSaveError] = useState('');
  const f = (k: keyof typeof cfg) => (v: string | boolean) => setCfg(p => ({ ...p, [k]: v }));

  // Load from DB on mount
  useEffect(() => {
    loadGatewayFromDb('duitku').then(data => {
      if (data) {
        const j = data.config_json as Record<string, string>;
        setCfg({
          merchantCode: j.merchant_code || '',
          apiKey: j.api_key || '',
          callbackUrl: j.callback_url || DUITKU_DEFAULT_CALLBACK_URL,
          returnUrl: j.return_url || DUITKU_DEFAULT_RETURN_URL,
          enabled: data.active,
        });
      }
      setDbLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!cfg.merchantCode || !cfg.apiKey) {
      setSaveError('Merchant Code dan API Key wajib diisi'); return;
    }
    setSaving(true); setSaveError('');
    try {
      await saveGatewayToDb('duitku', {
        merchant_code: cfg.merchantCode, api_key: cfg.apiKey,
        callback_url: cfg.callbackUrl, return_url: cfg.returnUrl,
        sandbox: 'false',
      }, true);
      f('enabled')(true);
      logAction('DUITKU_SAVE', 'Simpan konfigurasi Duitku — aktif dari database');
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  };

  const handleDeactivate = async () => {
    setSaving(true);
    try {
      await saveGatewayToDb('duitku', { merchant_code: cfg.merchantCode, api_key: cfg.apiKey }, false);
      f('enabled')(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
          <Wifi className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">Duitku</h3>
          <p className="text-muted-foreground text-xs">Payment Gateway</p>
        </div>
        <div className="ml-auto"><GwStatusBadge active={cfg.enabled} loading={dbLoading} /></div>
      </div>

      {cfg.enabled && (
        <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">Duitku aktif dan tersimpan di database. Transaksi akan menggunakan konfigurasi ini secara otomatis.</p>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        {dbLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GwField label="Merchant Code" value={cfg.merchantCode} onChange={f('merchantCode')} placeholder="D1234" />
              <GwField label="API Key" value={cfg.apiKey} onChange={f('apiKey')} type="password" placeholder="API key Duitku" />
              <GwField label="Callback URL" value={cfg.callbackUrl} onChange={f('callbackUrl')} placeholder="https://yourdomain.com/callback/duitku" />
              <GwField label="Return URL" value={cfg.returnUrl} onChange={f('returnUrl')} placeholder="https://yourdomain.com/payment/return" />
            </div>
            {saveError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{saveError}
              </div>
            )}
            <div className="flex gap-2 items-center flex-wrap">
              <Button onClick={handleSave} disabled={saving} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-2 btn-glow">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saved ? 'Tersimpan & Aktif!' : saving ? 'Menyimpan...' : 'Simpan & Aktifkan'}
              </Button>
              {cfg.enabled && (
                <Button onClick={handleDeactivate} disabled={saving} size="sm" variant="outline" className="rounded-xl text-xs text-muted-foreground">
                  Nonaktifkan
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── IPAYMU ──────────────────────────────────────────────────────────────────
function IpaymuSettings() {
  const [cfg, setCfg] = useState({ va: '', apiKey: '', callbackUrl: '', returnUrl: '', enabled: false });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);
  const [saveError, setSaveError] = useState('');
  const f = (k: keyof typeof cfg) => (v: string | boolean) => setCfg(p => ({ ...p, [k]: v }));

  useEffect(() => {
    loadGatewayFromDb('ipaymu').then(data => {
      if (data) {
        const j = data.config_json as Record<string, string>;
        setCfg({ va: j.va || '', apiKey: j.api_key || '', callbackUrl: j.callback_url || '', returnUrl: j.return_url || '', enabled: data.active });
      }
      setDbLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!cfg.va || !cfg.apiKey) { setSaveError('VA dan API Key wajib diisi'); return; }
    setSaving(true); setSaveError('');
    try {
      await saveGatewayToDb('ipaymu', { va: cfg.va, api_key: cfg.apiKey, callback_url: cfg.callbackUrl, return_url: cfg.returnUrl, sandbox: 'false' }, true);
      f('enabled')(true);
      logAction('IPAYMU_SAVE', 'Simpan konfigurasi iPaymu — aktif dari database');
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) { setSaveError(e instanceof Error ? e.message : String(e)); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async () => {
    setSaving(true);
    try { await saveGatewayToDb('ipaymu', { va: cfg.va, api_key: cfg.apiKey }, false); f('enabled')(false); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
          <Wifi className="w-5 h-5 text-white" />
        </div>
        <div><h3 className="font-bold text-foreground">iPaymu</h3><p className="text-muted-foreground text-xs">Payment Gateway</p></div>
        <div className="ml-auto"><GwStatusBadge active={cfg.enabled} loading={dbLoading} /></div>
      </div>
      {cfg.enabled && (
        <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">iPaymu aktif dan tersimpan di database.</p>
        </div>
      )}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        {dbLoading ? <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GwField label="Virtual Account (VA)" value={cfg.va} onChange={f('va')} placeholder="0000000000000" />
              <GwField label="API Key" value={cfg.apiKey} onChange={f('apiKey')} type="password" placeholder="API key iPaymu" />
              <GwField label="Callback URL" value={cfg.callbackUrl} onChange={f('callbackUrl')} placeholder="https://yourdomain.com/callback/ipaymu" />
              <GwField label="Return URL" value={cfg.returnUrl} onChange={f('returnUrl')} placeholder="https://yourdomain.com/payment/return" />
            </div>
            {saveError && <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 text-red-600 text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{saveError}</div>}
            <div className="flex gap-2 items-center flex-wrap">
              <Button onClick={handleSave} disabled={saving} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-2 btn-glow">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saved ? 'Tersimpan & Aktif!' : saving ? 'Menyimpan...' : 'Simpan & Aktifkan'}
              </Button>
              {cfg.enabled && <Button onClick={handleDeactivate} disabled={saving} size="sm" variant="outline" className="rounded-xl text-xs text-muted-foreground">Nonaktifkan</Button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── TRIPAY ──────────────────────────────────────────────────────────────────
function TripaySettings() {
  const [cfg, setCfg] = useState({ apiKey: '', merchantCode: '', privateKey: '', callbackUrl: '', enabled: false });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);
  const [saveError, setSaveError] = useState('');
  const f = (k: keyof typeof cfg) => (v: string | boolean) => setCfg(p => ({ ...p, [k]: v }));

  useEffect(() => {
    loadGatewayFromDb('tripay').then(data => {
      if (data) {
        const j = data.config_json as Record<string, string>;
        setCfg({ apiKey: j.api_key || '', merchantCode: j.merchant_code || '', privateKey: j.private_key || '', callbackUrl: j.callback_url || '', enabled: data.active });
      }
      setDbLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!cfg.apiKey || !cfg.merchantCode) { setSaveError('API Key dan Merchant Code wajib diisi'); return; }
    setSaving(true); setSaveError('');
    try {
      await saveGatewayToDb('tripay', { api_key: cfg.apiKey, merchant_code: cfg.merchantCode, private_key: cfg.privateKey, callback_url: cfg.callbackUrl, sandbox: 'false' }, true);
      f('enabled')(true);
      logAction('TRIPAY_SAVE', 'Simpan konfigurasi Tripay — aktif dari database');
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) { setSaveError(e instanceof Error ? e.message : String(e)); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async () => {
    setSaving(true);
    try { await saveGatewayToDb('tripay', { api_key: cfg.apiKey, merchant_code: cfg.merchantCode, private_key: cfg.privateKey }, false); f('enabled')(false); }
    finally { setSaving(false); }
  };

  // Generate callback URL hint
  const supabaseUrl = (supabase as unknown as { supabaseUrl: string }).supabaseUrl || '';
  const callbackHint = supabaseUrl ? `${supabaseUrl}/functions/v1/payment-webhook?gateway=tripay` : '';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
          <Wifi className="w-5 h-5 text-white" />
        </div>
        <div><h3 className="font-bold text-foreground">Tripay</h3><p className="text-muted-foreground text-xs">Payment Gateway</p></div>
        <div className="ml-auto"><GwStatusBadge active={cfg.enabled} loading={dbLoading} /></div>
      </div>
      {cfg.enabled && (
        <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">Tripay aktif dan tersimpan di database.</p>
        </div>
      )}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        {dbLoading ? <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GwField label="API Key" value={cfg.apiKey} onChange={f('apiKey')} type="password" placeholder="T-xxx" />
              <GwField label="Merchant Code" value={cfg.merchantCode} onChange={f('merchantCode')} placeholder="T12345" />
              <GwField label="Private Key" value={cfg.privateKey} onChange={f('privateKey')} type="password" placeholder="Private key Tripay" />
              <GwField label="Callback URL (isi di dashboard Tripay)" value={cfg.callbackUrl || callbackHint} onChange={f('callbackUrl')} placeholder={callbackHint} />
            </div>
            {callbackHint && (
              <div className="p-3 bg-muted rounded-xl text-xs text-muted-foreground">
                <strong>URL Callback untuk Tripay:</strong><br />
                <code className="font-mono text-primary break-all">{callbackHint}</code>
              </div>
            )}
            {saveError && <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 text-red-600 text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{saveError}</div>}
            <div className="flex gap-2 items-center flex-wrap">
              <Button onClick={handleSave} disabled={saving} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-2 btn-glow">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saved ? 'Tersimpan & Aktif!' : saving ? 'Menyimpan...' : 'Simpan & Aktifkan'}
              </Button>
              {cfg.enabled && <Button onClick={handleDeactivate} disabled={saving} size="sm" variant="outline" className="rounded-xl text-xs text-muted-foreground">Nonaktifkan</Button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
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
        <p className="text-muted-foreground text-sm">Status dibaca langsung dari database — aktif tanpa deploy ulang</p>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-3 mb-6 border-b border-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn('flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all', tab === t.id ? 'bg-primary text-primary-foreground shadow-green' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl text-xs text-blue-700 mb-6">
        <strong>Info:</strong> Setelah klik "Simpan &amp; Aktifkan", konfigurasi langsung tersimpan di database dan gateway langsung aktif — tidak perlu deploy ulang atau refresh halaman.
      </div>
      {tab === 'duitku' && <DuitkuSettings />}
      {tab === 'ipaymu' && <IpaymuSettings />}
      {tab === 'tripay' && <TripaySettings />}
    </div>
  );
}
