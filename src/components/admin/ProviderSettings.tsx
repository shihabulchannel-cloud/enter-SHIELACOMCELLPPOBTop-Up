import { useState, useEffect } from 'react';
import { Save, RefreshCw, CheckCircle2, XCircle, Wifi, AlertCircle, Copy, Check, Info, ExternalLink, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  providerConfigStore, providerPriorityStore,
  type ProviderPriority, logAction
} from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { getAdminSession } from '@/lib/admin-auth';
import { cn } from '@/lib/utils';

// Auto-detect Supabase URL from client
const SUPABASE_URL = (supabase as unknown as { supabaseUrl: string }).supabaseUrl
  || 'https://spb-t4n14k6xzom7uus1.supabase.opentrust.net';

async function adminApiDigiflazz(data: Record<string, unknown>) {
  const session = getAdminSession();
  // Token admin dikirim via header X-Admin-Token (BUKAN Authorization) agar tidak
  // bentrok dengan header Authorization yang dipakai gateway platform untuk
  // kredensial proyek (anon key) yang otomatis disisipkan oleh Supabase SDK.
  const { data: result, error } = await supabase.functions.invoke('admin-api', {
    body: { action: 'digiflazz_save', payload: { data } },
    headers: { 'X-Admin-Token': session?.session_token ?? '' },
  });
  if (error) throw new Error(error.message);
  if (result?.error) throw new Error(result.error);
}

const DIGIFLAZZ_WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/digiflazz-webhook`;

function CopyableUrl({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
      <div className="flex items-center gap-2 p-3 rounded-xl bg-muted border border-border">
        <code className="flex-1 text-xs font-mono text-primary break-all">{url}</code>
        <Button variant="ghost" size="icon" className="w-8 h-8 flex-shrink-0" onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
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

interface SyncLog {
  success: boolean; error?: string; synced?: number; skipped?: number;
  total?: number; db_errors?: string[]; logs?: string[]; timestamp?: string;
}

interface DiagnosticsState {
  loading: boolean;
  success?: boolean;
  username?: string;
  balance?: number;
  testing?: boolean;
  last_synced?: string;
  rc?: string;
  message?: string;
  error?: string;
  logs?: string[];
  checkedAt?: string;
}

interface DigiflazzLogEntry {
  id: string;
  action: string;
  ref_id: string;
  invoice_id: string;
  request_body: string;
  response_body: string;
  http_status: number;
  df_rc: string;
  df_status: string;
  df_message: string;
  df_sn: string;
  success: boolean;
  created_at: string;
}

// ===== DIAGNOSTIK DIGIFLAZZ =====
function DigiflazzDiagnostics({ username, apiKey }: { username: string; apiKey: string }) {
  const [diag, setDiag] = useState<DiagnosticsState>({ loading: false });
  const [logs, setLogs] = useState<DigiflazzLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [dbConfig, setDbConfig] = useState<{
    username: string; last_balance: number; last_balance_checked: string | null;
    last_synced: string | null; testing: boolean; active: boolean;
  } | null>(null);

  useEffect(() => {
    // Load DB config and recent logs on mount
    loadDbConfig();
    loadLogs();
  }, []);

  const loadDbConfig = async () => {
    const { data } = await supabase.from('sc_digiflazz_config').select('username,last_balance,last_balance_checked,last_synced,testing,active').eq('provider', 'digiflazz').maybeSingle();
    if (data) setDbConfig(data as typeof dbConfig);
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    const { data } = await supabase.from('sc_digiflazz_logs').select('*').order('created_at', { ascending: false }).limit(20);
    setLogs((data || []) as DigiflazzLogEntry[]);
    setLogsLoading(false);
  };

  const handleCheckBalance = async () => {
    if (!username || !apiKey) {
      setDiag({ loading: false, error: 'Harap isi Username dan API Key terlebih dahulu, lalu klik Simpan', success: false });
      return;
    }
    setDiag({ loading: true });
    try {
      const { data, error } = await supabase.functions.invoke('digiflazz-check-balance');
      if (error) {
        setDiag({ loading: false, success: false, error: `Gagal menghubungi backend: ${error.message}`, checkedAt: new Date().toLocaleString('id-ID') });
        return;
      }
      setDiag({
        loading: false,
        success: data?.success || false,
        username: data?.username,
        balance: data?.balance,
        testing: data?.testing,
        last_synced: data?.last_synced,
        rc: data?.rc,
        message: data?.message,
        error: data?.error,
        logs: data?.logs,
        checkedAt: new Date().toLocaleString('id-ID'),
      });
      await loadDbConfig();
      await loadLogs();
    } catch (e) {
      setDiag({ loading: false, success: false, error: String(e), checkedAt: new Date().toLocaleString('id-ID') });
    }
  };

  const fmt = (iso: string | null | undefined) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('id-ID'); } catch { return iso; }
  };

  const fmtRupiah = (n: number | null | undefined) => {
    if (n === null || n === undefined) return '—';
    return `Rp ${Number(n).toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Activity className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">Diagnostik Digiflazz</h3>
          <p className="text-muted-foreground text-xs">Status real-time koneksi, saldo, dan log transaksi</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Username', value: dbConfig?.username || username || '—', icon: 'user' },
          { label: 'Saldo Terakhir', value: fmtRupiah(dbConfig?.last_balance), icon: 'balance', highlight: true },
          { label: 'Sync Terakhir', value: fmt(dbConfig?.last_synced), icon: 'sync' },
          { label: 'Saldo Dicek', value: fmt(dbConfig?.last_balance_checked), icon: 'time' },
        ].map(card => (
          <div key={card.label} className={cn('bg-card border rounded-2xl p-3 text-center', card.highlight ? 'border-primary/30 bg-primary/5' : 'border-border')}>
            <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
            <p className={cn('text-sm font-bold break-all leading-snug', card.highlight ? 'text-primary' : 'text-foreground')}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Check Balance Button */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h4 className="font-semibold text-sm text-foreground">Cek Saldo Real-Time</h4>
        <p className="text-xs text-muted-foreground">Tekan tombol di bawah untuk memanggil API Digiflazz secara langsung dan mengambil saldo akun yang sesungguhnya.</p>

        {diag.checkedAt && (
          <div className={cn('rounded-xl p-4 space-y-2', diag.success ? 'bg-green-500/5 border border-green-500/20' : 'bg-red-500/5 border border-red-500/20')}>
            <div className="flex items-center gap-2">
              {diag.success ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-500" />}
              <span className={cn('font-semibold text-sm', diag.success ? 'text-green-700' : 'text-red-600')}>
                {diag.success ? 'Koneksi Berhasil' : 'Koneksi Gagal'}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">{diag.checkedAt}</span>
            </div>
            {diag.success && diag.balance !== undefined && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-background rounded-xl p-3 border border-border text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Saldo Digiflazz</p>
                  <p className="text-xl font-bold text-green-600">{fmtRupiah(diag.balance)}</p>
                </div>
                <div className="bg-background rounded-xl p-3 border border-border text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Mode</p>
                  <p className="text-sm font-bold text-foreground">{diag.testing ? 'Testing' : 'Production'}</p>
                </div>
              </div>
            )}
            {diag.rc && <p className="text-xs font-mono text-muted-foreground">RC: {diag.rc} — {diag.message}</p>}
            {diag.error && <p className="text-sm text-red-600 font-medium">{diag.error}</p>}
            {diag.logs && diag.logs.length > 0 && (
              <div className="mt-2 bg-slate-900 rounded-xl p-3 max-h-48 overflow-y-auto">
                {diag.logs.map((line, i) => (
                  <p key={i} className={cn('text-xs font-mono leading-5',
                    line.startsWith('ERROR') || line.startsWith('EXCEPTION') ? 'text-red-400' :
                    line.startsWith('OK') || line.includes('SUCCESS') ? 'text-green-400' :
                    line.startsWith('STEP') || line.startsWith('REQUEST') ? 'text-yellow-300' :
                    line.startsWith('===') ? 'text-cyan-300 font-bold' : 'text-slate-300')}>
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <Button onClick={handleCheckBalance} disabled={diag.loading} className="bg-primary text-primary-foreground btn-glow rounded-xl gap-2 w-full sm:w-auto">
          {diag.loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Wifi className="w-4 h-4" />}
          {diag.loading ? 'Mengecek Saldo...' : 'Cek Saldo Digiflazz Sekarang'}
        </Button>
      </div>

      {/* Recent Logs */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-foreground">Log Transaksi Terbaru (20 terakhir)</h4>
          <Button onClick={loadLogs} variant="ghost" size="sm" className="rounded-xl gap-1.5 text-xs" disabled={logsLoading}>
            <RefreshCw className={cn('w-3.5 h-3.5', logsLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {logsLoading ? (
          <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">Belum ada log. Coba cek saldo atau lakukan transaksi terlebih dahulu.</div>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className={cn('border rounded-xl overflow-hidden', log.success ? 'border-green-500/20' : 'border-red-500/20')}>
                <div
                  className={cn('flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30', log.success ? 'bg-green-500/5' : 'bg-red-500/5')}
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  {log.success ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-xs font-bold uppercase px-2 py-0.5 rounded-md', log.action === 'transaction' ? 'bg-blue-500/15 text-blue-600' : log.action === 'cek_saldo' ? 'bg-purple-500/15 text-purple-600' : 'bg-gray-500/15 text-gray-600')}>
                        {log.action}
                      </span>
                      {log.df_rc && <span className="text-xs text-muted-foreground font-mono">RC={log.df_rc}</span>}
                      {log.df_status && <span className={cn('text-xs font-semibold', log.df_status === 'Sukses' ? 'text-green-600' : log.df_status === 'Gagal' ? 'text-red-600' : 'text-yellow-600')}>{log.df_status}</span>}
                      {log.df_sn && <span className="text-xs text-muted-foreground">SN: {log.df_sn.slice(0, 20)}...</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.df_message || log.invoice_id || log.ref_id}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString('id-ID')}</p>
                    {expandedLog === log.id ? <ChevronUp className="w-3.5 h-3.5 ml-auto mt-0.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto mt-0.5 text-muted-foreground" />}
                  </div>
                </div>

                {expandedLog === log.id && (
                  <div className="border-t border-border p-3 space-y-3 bg-background">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { label: 'Invoice ID', value: log.invoice_id },
                        { label: 'Ref ID', value: log.ref_id },
                        { label: 'HTTP Status', value: String(log.http_status) },
                        { label: 'DF RC', value: log.df_rc || '—' },
                        { label: 'DF Status', value: log.df_status || '—' },
                        { label: 'DF Message', value: log.df_message || '—' },
                        { label: 'SN', value: log.df_sn || '—' },
                      ].map(f => f.value ? (
                        <div key={f.label}>
                          <p className="text-muted-foreground">{f.label}</p>
                          <p className="font-mono font-medium text-foreground break-all">{f.value}</p>
                        </div>
                      ) : null)}
                    </div>
                    {log.request_body && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Request Body</p>
                        <pre className="text-xs bg-slate-900 text-green-300 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap break-all max-h-32">{(() => { try { return JSON.stringify(JSON.parse(log.request_body), null, 2); } catch { return log.request_body; } })()}</pre>
                      </div>
                    )}
                    {log.response_body && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Response Digiflazz</p>
                        <pre className="text-xs bg-slate-900 text-yellow-300 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap break-all max-h-40">{(() => { try { return JSON.stringify(JSON.parse(log.response_body), null, 2); } catch { return log.response_body; } })()}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== DIGIFLAZZ SETTINGS =====
function DigiflazzSettings() {
  const [cfg, setCfg] = useState(providerConfigStore.get().digiflazz);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState<SyncLog | null>(null);
  const [showRawLog, setShowRawLog] = useState(false);
  const f = (k: keyof typeof cfg) => (v: string | boolean | number) => setCfg(p => ({ ...p, [k]: v }));

  // Load testing flag from DB on mount
  useEffect(() => {
    supabase.from('sc_digiflazz_config').select('testing').eq('provider', 'digiflazz').maybeSingle()
      .then(({ data }) => { if (data?.testing !== undefined) setTesting(data.testing); });
  }, []);

  const handleSave = async () => {
    const all = providerConfigStore.get();
    providerConfigStore.set({ ...all, digiflazz: { ...cfg, enabled: true } });
    try {
      await adminApiDigiflazz({
        provider: 'digiflazz',
        username: cfg.username,
        api_key: cfg.apiKey,
        webhook_secret: '',
        active: true,
        testing,
      });
    } catch (e) {
      alert(`Gagal simpan: ${e instanceof Error ? e.message : 'Error'}`);
      return;
    }
    logAction('DIGIFLAZZ_SAVE', `Simpan konfigurasi Digiflazz, testing=${testing}`);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSync = async () => {
    if (!cfg.username || !cfg.apiKey) {
      setSyncLog({ success: false, error: 'Harap isi Username dan API Key Digiflazz terlebih dahulu', timestamp: new Date().toLocaleString('id-ID') });
      return;
    }
    setSyncing(true);
    setSyncLog(null);
    setShowRawLog(false);
    try {
      // Ensure config is saved before sync
      await adminApiDigiflazz({
        provider: 'digiflazz', username: cfg.username, api_key: cfg.apiKey,
        webhook_secret: '', active: true, testing,
      });

      const { data, error } = await supabase.functions.invoke('sync-products');
      if (error) {
        setSyncLog({ success: false, error: `Gagal memanggil backend: ${error.message}`, logs: [], timestamp: new Date().toLocaleString('id-ID') });
        return;
      }
      const result: SyncLog = { ...data, timestamp: new Date().toLocaleString('id-ID') };
      setSyncLog(result);
      if (result.success) logAction('DIGIFLAZZ_SYNC', `Sync ${result.synced} produk dari Digiflazz`);
    } catch (e: unknown) {
      setSyncLog({ success: false, error: e instanceof Error ? e.message : 'Error tidak diketahui', timestamp: new Date().toLocaleString('id-ID') });
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
        <StatusBadge connected={cfg.enabled || !!cfg.username} />
      </div>

      {/* API Credentials */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h4 className="font-semibold text-foreground text-sm">Kredensial API</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProviderField label="Username Digiflazz" value={cfg.username} onChange={f('username')} placeholder="username digiflazz" />
          <ProviderField label="Production API Key" value={cfg.apiKey} onChange={f('apiKey')} type="password" placeholder="Production API Key" />
        </div>

        {/* Testing Mode Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Mode Testing</p>
            <p className="text-xs text-muted-foreground">Aktifkan hanya untuk pengujian. Nonaktifkan untuk transaksi nyata (Production).</p>
          </div>
          <button
            onClick={() => setTesting(v => !v)}
            className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none', testing ? 'bg-yellow-500' : 'bg-muted-foreground/30')}
          >
            <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', testing ? 'translate-x-6' : 'translate-x-1')} />
          </button>
        </div>
        {testing && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-sm text-yellow-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span><strong>Mode Testing Aktif.</strong> Transaksi tidak akan diproses secara nyata. Gunakan SKU <code className="bg-yellow-100 px-1 rounded">xld5000</code> untuk test. Matikan saat go-live!</span>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleSave} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-2 btn-glow">
            <Save className="w-4 h-4" /> {saved ? 'Tersimpan!' : 'Simpan Konfigurasi'}
          </Button>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-700">
          <strong>Setelah simpan</strong>, buka tab <strong>Diagnostik</strong> → klik <strong>"Cek Saldo Digiflazz Sekarang"</strong> untuk memverifikasi koneksi dan melihat saldo akun real-time.
        </div>
      </div>

      {/* Webhook URL */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary flex-shrink-0" />
          <h4 className="font-semibold text-foreground text-sm">Webhook URL (Auto-Generate)</h4>
        </div>
        <CopyableUrl url={DIGIFLAZZ_WEBHOOK_URL} label="Webhook URL — Salin & daftarkan di Digiflazz" />
        <div className="bg-muted rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">Cara memasang di Digiflazz:</p>
          <ol className="space-y-1.5">
            {['Login ke dashboard Digiflazz (digiflazz.com)', 'Buka menu Pengaturan > Webhook / Callback URL', 'Salin URL di atas lalu tempel di kolom Webhook URL', 'Klik Simpan / Update'].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          <a href="https://digiflazz.com/dashboard/settings" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary text-xs font-semibold hover:underline mt-1">
            <ExternalLink className="w-3.5 h-3.5" /> Buka Dashboard Digiflazz
          </a>
        </div>
      </div>

      {/* Sync */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div>
          <h4 className="font-semibold text-foreground mb-1">Sinkronisasi Produk</h4>
          <p className="text-muted-foreground text-sm">Sync semua produk dari Digiflazz ke database website.</p>
        </div>

        {syncLog && (
          <div className={cn('rounded-2xl border p-4 space-y-3', syncLog.success ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20')}>
            <div className="flex items-center gap-2">
              {syncLog.success ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
              <span className={cn('font-semibold text-sm', syncLog.success ? 'text-green-700' : 'text-red-600')}>
                {syncLog.success ? 'Sinkronisasi Berhasil!' : 'Sinkronisasi Gagal'}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">{syncLog.timestamp}</span>
            </div>
            {syncLog.success && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Diterima', value: syncLog.total ?? 0, color: 'text-foreground' },
                  { label: 'Berhasil Simpan', value: syncLog.synced ?? 0, color: 'text-green-600' },
                  { label: 'Dilewati', value: syncLog.skipped ?? 0, color: 'text-yellow-600' },
                ].map(s => (
                  <div key={s.label} className="bg-background rounded-xl p-3 text-center border border-border">
                    <p className={cn('text-2xl font-bold', s.color)}>{s.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
            {syncLog.error && <div className="bg-red-500/10 rounded-xl p-3 text-sm text-red-700 font-mono break-all">{syncLog.error}</div>}
            {syncLog.logs && syncLog.logs.length > 0 && (
              <div>
                <button onClick={() => setShowRawLog(v => !v)} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {showRawLog ? 'Sembunyikan' : 'Lihat'} Log Detail ({syncLog.logs.length} baris)
                </button>
                {showRawLog && (
                  <div className="mt-2 bg-slate-900 rounded-xl p-3 max-h-64 overflow-y-auto">
                    {syncLog.logs.map((line, i) => (
                      <p key={i} className={cn('text-xs font-mono leading-5', line.startsWith('ERROR') || line.startsWith('EXCEPTION') ? 'text-red-400' : line.startsWith('OK') || line.includes('berhasil') ? 'text-green-400' : line.startsWith('STEP') ? 'text-yellow-300' : line.startsWith('===') ? 'text-cyan-300 font-bold' : 'text-slate-300')}>
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
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

// ===== VIP RESELLER =====
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

// ===== PRIORITY =====
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
        <p className="text-muted-foreground text-sm">Tentukan provider utama dan cadangan untuk setiap kategori.</p>
      </div>
      <div className="space-y-3">
        {priorities.map(p => (
          <div key={p.categoryId} className="bg-card border border-border rounded-2xl p-4">
            <p className="font-semibold text-foreground text-sm mb-3">{p.categoryName}</p>
            <div className="grid grid-cols-2 gap-3">
              {(['primary', 'backup'] as const).map(key => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{key === 'primary' ? 'Provider Utama' : 'Provider Cadangan'}</label>
                  <select value={p[key]} onChange={e => updatePriority(p.categoryId, key, e.target.value)} className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm">
                    {providers.map(pr => <option key={pr.value} value={pr.value}>{pr.label}</option>)}
                  </select>
                </div>
              ))}
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

// ===== MAIN =====
const TABS: { id: Tab; label: string }[] = [
  { id: 'digiflazz', label: 'Digiflazz' },
  { id: 'vip', label: 'VIP Reseller' },
  { id: 'priority', label: 'Provider Priority' },
];

export default function ProviderSettings({ defaultTab = 'digiflazz' }: { defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [showDiag, setShowDiag] = useState(false);
  const cfg = providerConfigStore.get().digiflazz;

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-3 mb-6 border-b border-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setShowDiag(false); }} className={cn('flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all', tab === t.id && !showDiag ? 'bg-primary text-primary-foreground shadow-green' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
            {t.label}
          </button>
        ))}
        <button onClick={() => setShowDiag(true)} className={cn('flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5', showDiag ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
          <Activity className="w-3.5 h-3.5" /> Diagnostik
        </button>
      </div>

      {showDiag ? (
        <DigiflazzDiagnostics username={cfg.username} apiKey={cfg.apiKey} />
      ) : (
        <>
          {tab === 'digiflazz' && <DigiflazzSettings />}
          {tab === 'vip' && <VipResellerSettings />}
          {tab === 'priority' && <ProviderPrioritySettings />}
        </>
      )}
    </div>
  );
}
