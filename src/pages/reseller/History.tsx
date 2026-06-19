import { useEffect, useState, useCallback } from 'react';
import { History, Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getResellerSession } from '@/lib/reseller-auth';
import { supabase } from '@/integrations/supabase/client';
import ResellerLayout from './Layout';
import { cn } from '@/lib/utils';

interface Order {
  id: string;
  invoice_id: string;
  product_name: string;
  product_price: number;
  markup: number;
  target: string;
  order_status: string;
  digiflazz_sn: string;
  notes: string;
  created_at: string;
}

const STATUS: Record<string, { label: string; color: string }> = {
  success:    { label: 'Berhasil', color: 'text-green-600 bg-green-500/10' },
  failed:     { label: 'Gagal',    color: 'text-red-500 bg-red-500/10' },
  processing: { label: 'Diproses', color: 'text-yellow-600 bg-yellow-500/10' },
  pending:    { label: 'Pending',  color: 'text-yellow-600 bg-yellow-500/10' },
};

export default function ResellerHistory() {
  const session = getResellerSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const load = useCallback(async () => {
    if (!session?.reseller_id) return;
    const { data } = await supabase
      .from('sc_reseller_orders')
      .select('*')
      .eq('reseller_id', session.reseller_id)
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
    setLastUpdate(new Date());
  }, [session?.reseller_id]);

  useEffect(() => {
    if (!session?.reseller_id) return;
    load();

    // Realtime subscription
    const channel = supabase.channel(`reseller-history-${session.reseller_id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'sc_reseller_orders',
        filter: `reseller_id=eq.${session.reseller_id}`,
      }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.reseller_id]);

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return (!q || o.product_name.toLowerCase().includes(q) || o.target.toLowerCase().includes(q) || o.invoice_id.toLowerCase().includes(q))
      && (!filterStatus || o.order_status === filterStatus);
  });

  const totalSpent = orders.filter(o => o.order_status === 'success').reduce((s, o) => s + o.product_price, 0);

  return (
    <ResellerLayout>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Riwayat Transaksi</h1>
          <p className="text-muted-foreground text-sm">
            Total {orders.length} transaksi · Pengeluaran: Rp {totalSpent.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Realtime
          </span>
          <button onClick={load} className="p-2 rounded-xl hover:bg-muted transition-colors" title="Refresh manual">
            <RefreshCw className={cn('w-4 h-4 text-muted-foreground', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {!loading && (
        <p className="text-xs text-muted-foreground/60 mb-3">
          Update terakhir: {lastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[150px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk/target/invoice..." className="pl-9 rounded-xl h-9" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-9 rounded-xl border border-input bg-background px-3 text-sm">
          <option value="">Semua Status</option>
          <option value="success">Berhasil</option>
          <option value="processing">Diproses</option>
          <option value="failed">Gagal</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <History className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">Belum ada transaksi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => {
            const s = STATUS[o.order_status] || { label: o.order_status, color: 'text-muted-foreground bg-muted' };
            return (
              <div key={o.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{o.product_name}</p>
                    <p className="text-sm text-muted-foreground">Target: {o.target}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {o.invoice_id} · {new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {o.digiflazz_sn && <p className="text-xs text-green-600 font-mono mt-0.5">SN: {o.digiflazz_sn}</p>}
                    {!o.digiflazz_sn && o.notes && o.order_status === 'failed' && (
                      <p className="text-xs text-red-500 mt-0.5">Keterangan: {o.notes}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-foreground">Rp {o.product_price.toLocaleString('id-ID')}</p>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block', s.color)}>{s.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ResellerLayout>
  );
}
