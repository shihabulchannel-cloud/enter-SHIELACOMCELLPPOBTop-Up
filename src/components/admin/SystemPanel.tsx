import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Activity, FileText, CheckCircle2, XCircle, Clock, RefreshCw, ChevronDown, ChevronUp, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  systemLogStore, notificationStore,
  type SystemLog, type AppNotification
} from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type Tab = 'health' | 'logs' | 'provider_logs' | 'notifications';

// ===== SYSTEM HEALTH — reads from DB =====
function HealthPanel() {
  const [dbData, setDbData] = useState<{
    digiflazz: { username: string; active: boolean; last_synced: string | null; last_balance: number };
    gateways: { gateway: string; active: boolean; config_json: Record<string, string> }[];
    tableStats: { orders: number; resellerOrders: number; resellers: number; products: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [{ data: df }, { data: gws }, { count: orders }, { count: resOrders }, { count: resellers }, { count: products }] = await Promise.all([
      supabase.from('sc_digiflazz_config').select('username,active,last_synced,last_balance').eq('provider', 'digiflazz').maybeSingle(),
      supabase.from('sc_payment_configs').select('gateway,active,config_json'),
      supabase.from('sc_orders').select('id', { count: 'exact', head: true }),
      supabase.from('sc_reseller_orders').select('id', { count: 'exact', head: true }),
      supabase.from('sc_resellers').select('id', { count: 'exact', head: true }),
      supabase.from('sc_products').select('id', { count: 'exact', head: true }).eq('active', true),
    ]);
    setDbData({
      digiflazz: { username: df?.username || '', active: df?.active || false, last_synced: df?.last_synced || null, last_balance: df?.last_balance || 0 },
      gateways: (gws || []) as { gateway: string; active: boolean; config_json: Record<string, string> }[],
      tableStats: { orders: orders || 0, resellerOrders: resOrders || 0, resellers: resellers || 0, products: products || 0 },
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const gwLabel: Record<string, string> = { duitku: 'Duitku', ipaymu: 'iPaymu', tripay: 'Tripay' };

  const services = dbData ? [
    {
      name: 'Digiflazz',
      status: dbData.digiflazz.active ? 'online' : 'offline',
      desc: dbData.digiflazz.active
        ? `User: ${dbData.digiflazz.username} · Saldo: Rp ${(dbData.digiflazz.last_balance || 0).toLocaleString('id-ID')}`
        : 'Belum dikonfigurasi',
      sub: dbData.digiflazz.last_synced ? `Sync: ${new Date(dbData.digiflazz.last_synced).toLocaleString('id-ID')}` : 'Belum pernah sync',
    },
    ...dbData.gateways.map(gw => ({
      name: gwLabel[gw.gateway] || gw.gateway,
      status: gw.active ? 'online' : 'offline',
      desc: gw.active ? `Aktif (merchant: ${gw.config_json?.merchant_code || gw.config_json?.va || '—'})` : 'Belum dikonfigurasi',
      sub: '',
    })),
    {
      name: 'Database',
      status: 'online',
      desc: `${dbData.tableStats.orders} order publik · ${dbData.tableStats.resellerOrders} order reseller · ${dbData.tableStats.products} produk aktif`,
      sub: `${dbData.tableStats.resellers} reseller terdaftar`,
    },
  ] : [];

  const onlineCount = services.filter(s => s.status === 'online').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/30 flex-1">
          <Activity className="w-5 h-5 text-primary" />
          <div>
            <p className="font-semibold text-foreground text-sm">{loading ? '...' : `${onlineCount}/${services.length} Layanan Aktif`}</p>
            <p className="text-muted-foreground text-xs">Status sistem dari database · Realtime</p>
          </div>
        </div>
        <button onClick={load} className="p-2 ml-3 rounded-xl hover:bg-muted" title="Refresh">
          <RefreshCw className={cn('w-4 h-4 text-muted-foreground', loading && 'animate-spin')} />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse h-20" />
        )) : services.map(svc => (
          <div key={svc.name} className={cn('bg-card border rounded-2xl p-4 flex items-start gap-3', svc.status === 'online' ? 'border-border' : 'border-red-500/20')}>
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', svc.status === 'online' ? 'bg-green-500/10' : 'bg-red-500/10')}>
              {svc.status === 'online' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground text-sm">{svc.name}</p>
                <Badge className={cn('text-xs border', svc.status === 'online' ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30')}>
                  {svc.status === 'online' ? 'Online' : 'Offline'}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs truncate">{svc.desc}</p>
              {svc.sub && <p className="text-muted-foreground/60 text-xs">{svc.sub}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== SYSTEM LOGS (localStorage) =====
function LogsPanel() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  useEffect(() => { setLogs(systemLogStore.get()); }, []);

  const ACTION_COLORS: Record<string, string> = {
    LOGIN: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    DIGIFLAZZ_SYNC: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    DEPOSIT_APPROVE: 'bg-green-500/10 text-green-600 border-green-500/30',
    DEPOSIT_REJECT: 'bg-red-500/10 text-red-500 border-red-500/30',
    RESELLER_SUSPEND: 'bg-red-500/10 text-red-500 border-red-500/30',
    RESELLER_ACTIVATE: 'bg-green-500/10 text-green-600 border-green-500/30',
    REG_APPROVE: 'bg-green-500/10 text-green-600 border-green-500/30',
    REG_REJECT: 'bg-red-500/10 text-red-500 border-red-500/30',
  };
  const getColor = (action: string) => ACTION_COLORS[action] || 'bg-muted text-muted-foreground border-border';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{logs.length} entri log admin tersimpan (localStorage)</p>
        <Button onClick={() => { systemLogStore.set([]); setLogs([]); }} size="sm" variant="outline" className="rounded-xl text-xs">Bersihkan Log</Button>
      </div>
      <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-hidden">
        {logs.map(log => (
          <div key={log.id} className="bg-card border border-border rounded-xl p-3 flex items-start gap-3">
            <Badge className={cn('text-xs border flex-shrink-0', getColor(log.action))}>{log.action}</Badge>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{log.description}</p>
              <p className="text-muted-foreground text-xs">{log.user} • {log.createdAt}</p>
            </div>
          </div>
        ))}
        {logs.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Belum ada log aktivitas</p>}
      </div>
    </div>
  );
}

// ===== PROVIDER LOGS (sc_digiflazz_logs DB) =====
interface DbLog {
  id: string; action: string; ref_id: string; invoice_id: string;
  request_body: string; response_body: string;
  http_status: number; df_rc: string; df_status: string;
  df_message: string; df_sn: string; success: boolean; created_at: string;
}

function ProviderLogsPanel() {
  const [logs, setLogs] = useState<DbLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const query = supabase.from('sc_digiflazz_logs').select('*').order('created_at', { ascending: false }).limit(100);
    const { data } = actionFilter ? query.eq('action', actionFilter) : query;
    setLogs((data || []) as DbLog[]);
    setLoading(false);
  }, [actionFilter]);

  useEffect(() => { load(); }, [load]);

  // Realtime for live updates
  useEffect(() => {
    const channel = supabase.channel('provider-logs-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sc_digiflazz_logs' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const ACTION_COLORS: Record<string, string> = {
    transaction: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    cek_saldo: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
    webhook: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
    price_list: 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30',
  };

  const prettyJson = (raw: string) => { try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; } };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground flex-1">{logs.length} log provider dari database</p>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="h-8 rounded-xl border border-input bg-background px-3 text-xs">
          <option value="">Semua Aksi</option>
          <option value="transaction">Transaksi</option>
          <option value="cek_saldo">Cek Saldo</option>
          <option value="webhook">Webhook</option>
          <option value="price_list">Price List</option>
        </select>
        <button onClick={load} className="p-1.5 rounded-xl hover:bg-muted" title="Refresh">
          <RefreshCw className={cn('w-4 h-4 text-muted-foreground', loading && 'animate-spin')} />
        </button>
        <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <Database className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground text-sm">Belum ada log provider. Lakukan transaksi atau cek saldo untuk melihat log.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-hidden">
          {logs.map(log => (
            <div key={log.id} className={cn('border rounded-xl overflow-hidden', log.success ? 'border-green-500/20' : 'border-red-500/20')}>
              <div
                className={cn('flex items-center gap-3 p-3 cursor-pointer', log.success ? 'bg-green-500/5 hover:bg-green-500/10' : 'bg-red-500/5 hover:bg-red-500/10')}
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
              >
                {log.success ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-xs font-bold uppercase px-2 py-0.5 rounded-md border', ACTION_COLORS[log.action] || 'bg-muted text-muted-foreground border-border')}>
                      {log.action}
                    </span>
                    {log.df_rc && <span className="text-xs text-muted-foreground font-mono">RC={log.df_rc}</span>}
                    {log.df_status && (
                      <span className={cn('text-xs font-semibold', log.df_status.toLowerCase().includes('sukses') || log.df_status.toLowerCase().includes('success') ? 'text-green-600' : log.df_status.toLowerCase().includes('gagal') || log.df_status.toLowerCase().includes('fail') ? 'text-red-600' : 'text-yellow-600')}>
                        {log.df_status}
                      </span>
                    )}
                    {log.df_sn && <span className="text-xs text-green-600 font-mono">SN: {log.df_sn.slice(0, 16)}...</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.df_message || log.invoice_id || log.ref_id || '—'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString('id-ID')}</p>
                  {expanded === log.id ? <ChevronUp className="w-3.5 h-3.5 ml-auto mt-0.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto mt-0.5 text-muted-foreground" />}
                </div>
              </div>
              {expanded === log.id && (
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
                    ].filter(f => f.value && f.value !== '—').map(f => (
                      <div key={f.label}>
                        <p className="text-muted-foreground">{f.label}</p>
                        <p className="font-mono font-medium text-foreground break-all">{f.value}</p>
                      </div>
                    ))}
                  </div>
                  {log.request_body && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Request</p>
                      <pre className="text-xs bg-slate-900 text-green-300 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap break-all max-h-32">{prettyJson(log.request_body)}</pre>
                    </div>
                  )}
                  {log.response_body && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Response Digiflazz</p>
                      <pre className="text-xs bg-slate-900 text-yellow-300 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap break-all max-h-40">{prettyJson(log.response_body)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== NOTIFICATIONS =====
function NotificationsPanel() {
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  useEffect(() => { setNotifs(notificationStore.get()); }, []);
  const refresh = () => setNotifs(notificationStore.get());

  const TYPE_CFG = {
    transaction: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: CheckCircle2 },
    deposit: { color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: Activity },
    registration: { color: 'bg-purple-500/10 text-purple-600 border-purple-500/30', icon: Bell },
    failed_product: { color: 'bg-red-500/10 text-red-500 border-red-500/30', icon: XCircle },
    info: { color: 'bg-muted text-muted-foreground border-border', icon: Bell },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{notifs.filter(n => !n.read).length} notifikasi belum dibaca</p>
        <Button onClick={() => { notificationStore.markAllRead(); refresh(); }} size="sm" variant="outline" className="rounded-xl gap-1 text-xs">
          <BellOff className="w-3 h-3" /> Tandai Semua Dibaca
        </Button>
      </div>
      <div className="space-y-2">
        {notifs.map(notif => {
          const cfg = TYPE_CFG[notif.type as keyof typeof TYPE_CFG] || TYPE_CFG.info;
          const Icon = cfg.icon;
          return (
            <div key={notif.id} className={cn('bg-card border rounded-xl p-3 flex items-start gap-3 transition-all', notif.read ? 'border-border opacity-60' : 'border-primary/20 bg-primary/5')}>
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', cfg.color.split(' ')[0])}>
                <Icon className={cn('w-4 h-4', cfg.color.split(' ')[1])} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('font-semibold text-sm', notif.read ? 'text-muted-foreground' : 'text-foreground')}>{notif.title}</p>
                <p className="text-muted-foreground text-xs">{notif.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground text-xs">{notif.createdAt}</span>
                  {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                </div>
              </div>
              {!notif.read && (
                <button onClick={() => { notificationStore.markRead(notif.id); refresh(); }} className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                  <BellOff className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
        {notifs.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Tidak ada notifikasi</p>}
      </div>
    </div>
  );
}

// ===== MAIN =====
const TABS: { id: Tab; label: string }[] = [
  { id: 'health', label: 'System Health' },
  { id: 'logs', label: 'System Logs' },
  { id: 'provider_logs', label: 'Provider Logs' },
  { id: 'notifications', label: 'Notifikasi' },
];

export default function SystemPanel({ defaultTab = 'health' }: { defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  return (
    <div>
      <div className="mb-2">
        <h2 className="text-xl font-bold text-foreground">Sistem</h2>
        <p className="text-muted-foreground text-sm">Monitor kesehatan sistem, log aktivitas, dan log provider real-time dari database</p>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-3 mb-6 border-b border-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn('flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all', tab === t.id ? 'bg-primary text-primary-foreground shadow-green' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'health' && <HealthPanel />}
      {tab === 'logs' && <LogsPanel />}
      {tab === 'provider_logs' && <ProviderLogsPanel />}
      {tab === 'notifications' && <NotificationsPanel />}
    </div>
  );
}
