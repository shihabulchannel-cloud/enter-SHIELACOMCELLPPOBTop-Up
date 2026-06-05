import { useEffect, useState } from 'react';
import { History, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getResellerSession } from '@/lib/reseller-auth';
import { supabase } from '@/integrations/supabase/client';
import ResellerLayout from './Layout';
import { cn } from '@/lib/utils';

interface Order { id: string; invoice_id: string; product_name: string; product_price: number; markup: number; target: string; order_status: string; digiflazz_sn: string; created_at: string; }

const STATUS: Record<string, { label: string; color: string }> = {
  success: { label: 'Berhasil', color: 'text-green-600 bg-green-500/10' },
  failed: { label: 'Gagal', color: 'text-red-500 bg-red-500/10' },
  processing: { label: 'Diproses', color: 'text-yellow-600 bg-yellow-500/10' },
};

export default function ResellerHistory() {
  const session = getResellerSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!session) return;
    supabase.from('sc_reseller_orders').select('*').eq('reseller_id', session.reseller_id).order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []));
  }, [session?.reseller_id]);

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return (!q || o.product_name.toLowerCase().includes(q) || o.target.toLowerCase().includes(q) || o.invoice_id.toLowerCase().includes(q))
      && (!filterStatus || o.order_status === filterStatus);
  });

  const totalSpent = orders.filter(o => o.order_status === 'success').reduce((s, o) => s + o.product_price, 0);

  return (
    <ResellerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Riwayat Transaksi</h1>
        <p className="text-muted-foreground text-sm">Total {orders.length} transaksi · Pengeluaran: Rp {totalSpent.toLocaleString('id-ID')}</p>
      </div>

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

      {filtered.length === 0 ? (
        <div className="text-center py-16"><History className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" /><p className="text-muted-foreground">Belum ada transaksi</p></div>
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
                    <p className="text-xs text-muted-foreground mt-0.5">{o.invoice_id} · {new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    {o.digiflazz_sn && <p className="text-xs text-green-600 font-mono mt-0.5">SN: {o.digiflazz_sn}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-foreground">Rp {o.product_price.toLocaleString('id-ID')}</p>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', s.color)}>{s.label}</span>
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
