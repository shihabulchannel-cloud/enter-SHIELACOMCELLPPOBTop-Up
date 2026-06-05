import { useState, useEffect } from 'react';
import { Bell, BellOff, Activity, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  systemLogStore, notificationStore, providerConfigStore, paymentGatewayStore,
  type SystemLog, type AppNotification
} from '@/lib/store';
import { cn } from '@/lib/utils';

type Tab = 'health' | 'logs' | 'notifications';

// ===== SYSTEM HEALTH =====
function HealthPanel() {
  const provider = providerConfigStore.get();
  const payment = paymentGatewayStore.get();

  const services = [
    { name: 'Digiflazz', status: provider.digiflazz.enabled ? 'online' : 'offline', desc: provider.digiflazz.enabled ? `User: ${provider.digiflazz.username}` : 'Belum dikonfigurasi' },
    { name: 'VIP Reseller', status: provider.vipReseller.enabled ? 'online' : 'offline', desc: provider.vipReseller.enabled ? `Member: ${provider.vipReseller.memberId}` : 'Belum dikonfigurasi' },
    { name: 'Duitku', status: payment.duitku.enabled ? 'online' : 'offline', desc: payment.duitku.enabled ? `Merchant: ${payment.duitku.merchantCode}` : 'Belum dikonfigurasi' },
    { name: 'iPaymu', status: payment.ipaymu.enabled ? 'online' : 'offline', desc: payment.ipaymu.enabled ? `VA: ${payment.ipaymu.va}` : 'Belum dikonfigurasi' },
    { name: 'Tripay', status: payment.tripay.enabled ? 'online' : 'offline', desc: payment.tripay.enabled ? `Merchant: ${payment.tripay.merchantCode}` : 'Belum dikonfigurasi' },
    { name: 'LocalStorage DB', status: 'online', desc: 'Database lokal aktif' },
  ];

  const onlineCount = services.filter(s => s.status === 'online').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/30">
        <Activity className="w-5 h-5 text-primary" />
        <div>
          <p className="font-semibold text-foreground text-sm">{onlineCount}/{services.length} Layanan Aktif</p>
          <p className="text-muted-foreground text-xs">Status sistem secara keseluruhan</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {services.map(svc => (
          <div key={svc.name} className={cn('bg-card border rounded-2xl p-4 flex items-center gap-3', svc.status === 'online' ? 'border-border' : 'border-red-500/20')}>
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', svc.status === 'online' ? 'bg-green-500/10' : 'bg-red-500/10')}>
              {svc.status === 'online' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground text-sm">{svc.name}</p>
                <Badge className={cn('text-xs border', svc.status === 'online' ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30')}>
                  {svc.status === 'online' ? 'Online' : 'Offline'}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs truncate">{svc.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== SYSTEM LOGS =====
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
        <p className="text-sm text-muted-foreground">{logs.length} entri log tersimpan</p>
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
          const cfg = TYPE_CFG[notif.type] || TYPE_CFG.info;
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
                <button onClick={() => { notificationStore.markRead(notif.id); refresh(); }} className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0" title="Tandai dibaca">
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

const TABS: { id: Tab; label: string }[] = [
  { id: 'health', label: 'System Health' },
  { id: 'logs', label: 'System Logs' },
  { id: 'notifications', label: 'Notifikasi' },
];

export default function SystemPanel({ defaultTab = 'health' }: { defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  return (
    <div>
      <div className="mb-2">
        <h2 className="text-xl font-bold text-foreground">Sistem</h2>
        <p className="text-muted-foreground text-sm">Monitor kesehatan sistem, log aktivitas, dan notifikasi</p>
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
      {tab === 'notifications' && <NotificationsPanel />}
    </div>
  );
}
