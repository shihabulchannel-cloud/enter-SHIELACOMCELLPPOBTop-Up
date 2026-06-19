import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Users, Receipt, Bell, CheckCircle2, Clock, XCircle, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { depositStore, registrationStore, notificationStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// Unified order type for display
interface UnifiedOrder {
  id: string;
  invoice_id: string;
  product_name: string;
  target: string;
  amount: number;
  order_status: string;
  created_at: string;
  type: 'public' | 'reseller';
  buyer_name?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  waiting_payment: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  processing: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  success: 'bg-green-500/10 text-green-600 border-green-500/30',
  failed: 'bg-red-500/10 text-red-600 border-red-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  waiting_payment: 'Menunggu Bayar',
  processing: 'Diproses',
  success: 'Sukses',
  failed: 'Gagal',
  pending: 'Pending',
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminOverview({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [allOrders, setAllOrders] = useState<UnifiedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [productCount, setProductCount] = useState(0);
  const [resellerCount, setResellerCount] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const deposits = depositStore.get();
  const regs = registrationStore.get();
  const notifications = notificationStore.get().filter(n => !n.read);
  const pendingDeposits = deposits.filter(d => d.status === 'pending').length;
  const pendingRegs = regs.filter(r => r.status === 'pending').length;

  const loadData = useCallback(async () => {
    const today = todayISO();
    const [
      { data: pubOrders },
      { data: resOrders },
      { count: prodCount },
      { count: resCnt },
    ] = await Promise.all([
      supabase.from('sc_orders').select('id,invoice_id,product_name,target,payment_amount,order_status,created_at,buyer_name')
        .order('created_at', { ascending: false }).limit(200),
      supabase.from('sc_reseller_orders').select('id,invoice_id,product_name,target,product_price,order_status,created_at,reseller_name')
        .order('created_at', { ascending: false }).limit(200),
      supabase.from('sc_products').select('id', { count: 'exact', head: true }).eq('active', true),
      supabase.from('sc_resellers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    const pub: UnifiedOrder[] = (pubOrders || []).map(o => ({
      id: o.id, invoice_id: o.invoice_id, product_name: o.product_name,
      target: o.target, amount: o.payment_amount || 0, order_status: o.order_status,
      created_at: o.created_at, type: 'public', buyer_name: o.buyer_name,
    }));

    const res: UnifiedOrder[] = (resOrders || []).map(o => ({
      id: o.id, invoice_id: o.invoice_id, product_name: o.product_name,
      target: o.target, amount: o.product_price || 0, order_status: o.order_status,
      created_at: o.created_at, type: 'reseller', buyer_name: o.reseller_name,
    }));

    const merged = [...pub, ...res].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setAllOrders(merged);
    setProductCount(prodCount || 0);
    setResellerCount(resCnt || 0);
    setLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    loadData();

    // Realtime subscriptions
    const channel = supabase.channel('admin-overview-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sc_orders' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sc_reseller_orders' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sc_resellers' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sc_deposits' }, () => loadData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  // Stats
  const today = todayISO();
  const todayOrders = allOrders.filter(o => o.created_at.startsWith(today));
  const successOrders = allOrders.filter(o => o.order_status === 'success');
  const todayRevenue = successOrders.filter(o => o.created_at.startsWith(today)).reduce((s, o) => s + o.amount, 0);
  const pendingCount = allOrders.filter(o => ['processing', 'pending', 'waiting_payment'].includes(o.order_status)).length;
  const failedCount = allOrders.filter(o => o.order_status === 'failed').length;

  const statCards = [
    { label: 'Total Transaksi', value: allOrders.length, sub: `${todayOrders.length} hari ini`, icon: Receipt, color: 'bg-primary/10 text-primary', action: () => onNavigate('transactions') },
    { label: 'Total Reseller', value: resellerCount, sub: 'Aktif', icon: Users, color: 'bg-blue-500/10 text-blue-600', action: () => onNavigate('resellers') },
    { label: 'Omset Hari Ini', value: `Rp ${(todayRevenue / 1000).toFixed(0)}k`, sub: `${successOrders.length} tx sukses`, icon: TrendingUp, color: 'bg-emerald-500/10 text-emerald-600', action: () => onNavigate('reports') },
    { label: 'Produk Aktif', value: productCount, sub: 'Di database', icon: CheckCircle2, color: 'bg-purple-500/10 text-purple-600', action: () => onNavigate('products') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Selamat datang di Admin Panel SHIELACOM CELL</p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Update: {lastRefresh.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button onClick={loadData} className="p-2 rounded-xl hover:bg-muted transition-colors" title="Refresh">
            {loading ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" /> : <RefreshCw className="w-4 h-4 text-muted-foreground" />}
          </button>
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Realtime
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 md:p-5 animate-pulse">
              <div className="w-10 h-10 bg-muted rounded-xl mb-3" />
              <div className="h-7 bg-muted rounded w-16 mb-1" />
              <div className="h-3 bg-muted rounded w-24" />
            </div>
          ))
        ) : statCards.map(card => {
          const Icon = card.icon;
          return (
            <button key={card.label} onClick={card.action}
              className="bg-card border border-border rounded-2xl p-4 md:p-5 text-left hover:border-primary/30 hover:shadow-card transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-muted-foreground text-xs mt-1">{card.label}</p>
              <p className="text-muted-foreground/60 text-xs">{card.sub}</p>
            </button>
          );
        })}
      </div>

      {/* Transaction Status Summary */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{successOrders.length}</p>
            <p className="text-xs text-green-700 font-medium mt-0.5">Sukses</p>
          </div>
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-xs text-yellow-700 font-medium mt-0.5">Pending / Proses</p>
          </div>
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{failedCount}</p>
            <p className="text-xs text-red-600 font-medium mt-0.5">Gagal</p>
          </div>
        </div>
      )}

      {/* Alert Cards */}
      {(pendingDeposits > 0 || pendingRegs > 0 || notifications.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {pendingDeposits > 0 && (
            <button onClick={() => onNavigate('deposits')} className="flex items-center gap-3 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors text-left">
              <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-yellow-800 dark:text-yellow-400 text-sm">{pendingDeposits} Deposit Pending</p>
                <p className="text-xs text-yellow-600">Perlu konfirmasi</p>
              </div>
            </button>
          )}
          {pendingRegs > 0 && (
            <button onClick={() => onNavigate('registrations')} className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors text-left">
              <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-800 dark:text-blue-400 text-sm">{pendingRegs} Pendaftaran Baru</p>
                <p className="text-xs text-blue-600">Perlu diproses</p>
              </div>
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={() => onNavigate('notifications')} className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors text-left">
              <Bell className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-semibold text-primary text-sm">{notifications.length} Notifikasi Baru</p>
                <p className="text-xs text-primary/70">Belum dibaca</p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Recent Transactions + Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Transaksi Terbaru</h3>
            <button onClick={() => onNavigate('transactions')} className="text-primary text-xs flex items-center gap-1 hover:underline">
              Lihat semua <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-1">
              {allOrders.slice(0, 7).map((tx) => (
                <div key={`${tx.type}-${tx.id}`} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0 gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0', tx.type === 'reseller' ? 'bg-purple-500/10 text-purple-600' : 'bg-blue-500/10 text-blue-600')}>
                        {tx.type === 'reseller' ? 'RES' : 'PUB'}
                      </span>
                      <p className="text-sm font-medium text-foreground truncate">{tx.product_name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{tx.invoice_id}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <Badge className={cn('text-xs border font-semibold', STATUS_COLORS[tx.order_status] || STATUS_COLORS.processing)}>
                      {STATUS_LABELS[tx.order_status] || tx.order_status}
                    </Badge>
                  </div>
                </div>
              ))}
              {allOrders.length === 0 && <p className="text-center py-6 text-muted-foreground text-sm">Belum ada transaksi</p>}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Ringkasan Keuangan</h3>
            <span className="text-xs text-muted-foreground">Real-time dari database</span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-border/30 animate-pulse">
                  <div className="h-4 bg-muted rounded w-28" />
                  <div className="h-4 bg-muted rounded w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Total Omset (Sukses)', value: `Rp ${successOrders.reduce((s, o) => s + o.amount, 0).toLocaleString('id-ID')}`, color: 'text-foreground' },
                { label: 'Omset Hari Ini', value: `Rp ${todayRevenue.toLocaleString('id-ID')}`, color: 'text-primary' },
                { label: 'Transaksi Sukses', value: successOrders.length.toString(), color: 'text-emerald-600' },
                { label: 'Transaksi Pending/Proses', value: pendingCount.toString(), color: 'text-yellow-600' },
                { label: 'Transaksi Gagal', value: failedCount.toString(), color: 'text-red-500' },
                { label: 'Total Semua Transaksi', value: allOrders.length.toString(), color: 'text-muted-foreground' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={`font-bold text-sm ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
