import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ShoppingCart, ArrowDownToLine, TrendingUp, Package, ArrowLeftRight } from 'lucide-react';
import { getResellerSession } from '@/lib/reseller-auth';
import { supabase } from '@/integrations/supabase/client';
import ResellerLayout from './Layout';

export default function ResellerDashboard() {
  const session = getResellerSession();
  const [stats, setStats] = useState({ orders: 0, success: 0, failed: 0, totalDeposit: 0 });
  const [recentOrders, setRecentOrders] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      const { data: orders } = await supabase.from('sc_reseller_orders').select('*').eq('reseller_id', session.reseller_id).order('created_at', { ascending: false }).limit(5);
      const { data: allOrders } = await supabase.from('sc_reseller_orders').select('order_status').eq('reseller_id', session.reseller_id);
      const { data: deposits } = await supabase.from('sc_deposits').select('amount').eq('reseller_id', session.reseller_id).eq('status', 'approved');
      setRecentOrders(orders || []);
      const totalDeposit = (deposits || []).reduce((sum: number, d: Record<string, unknown>) => sum + (d.amount as number), 0);
      const success = (allOrders || []).filter((o: Record<string, unknown>) => o.order_status === 'success').length;
      const failed = (allOrders || []).filter((o: Record<string, unknown>) => o.order_status === 'failed').length;
      setStats({ orders: (allOrders || []).length, success, failed, totalDeposit });
    };
    load();
  }, [session?.reseller_id]);

  const STATUS_COLOR: Record<string, string> = { success: 'text-green-600 bg-green-500/10', failed: 'text-red-500 bg-red-500/10', processing: 'text-yellow-600 bg-yellow-500/10' };
  const STATUS_LABEL: Record<string, string> = { success: 'Berhasil', failed: 'Gagal', processing: 'Diproses' };

  return (
    <ResellerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Selamat datang, {session?.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Saldo Aktif', value: `Rp ${(session?.balance ?? 0).toLocaleString('id-ID')}`, icon: Wallet, color: 'text-primary bg-primary/10', link: '/reseller/deposit' },
          { label: 'Total Deposit', value: `Rp ${stats.totalDeposit.toLocaleString('id-ID')}`, icon: ArrowDownToLine, color: 'text-blue-500 bg-blue-500/10', link: '/reseller/deposit' },
          { label: 'Transaksi Berhasil', value: stats.success.toString(), icon: TrendingUp, color: 'text-green-600 bg-green-500/10', link: '/reseller/history' },
          { label: 'Total Order', value: stats.orders.toString(), icon: ShoppingCart, color: 'text-purple-500 bg-purple-500/10', link: '/reseller/history' },
        ].map(card => (
          <Link key={card.label} to={card.link} className="bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-all hover:shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Transaksi Terbaru</h2>
            <Link to="/reseller/history" className="text-xs text-primary hover:underline">Lihat semua</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Belum ada transaksi</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <div key={o.id as string} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{o.product_name as string}</p>
                    <p className="text-xs text-muted-foreground">{o.target as string} · {new Date(o.created_at as string).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">Rp {(o.product_price as number).toLocaleString('id-ID')}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[o.order_status as string] || 'text-muted-foreground bg-muted'}`}>{STATUS_LABEL[o.order_status as string] || o.order_status as string}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground flex items-center gap-2 mb-4"><ArrowLeftRight className="w-4 h-4 text-primary" /> Menu Cepat</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/reseller/products', label: 'Beli Produk', icon: ShoppingCart, color: 'bg-primary/10 text-primary' },
              { to: '/reseller/deposit', label: 'Top Up Saldo', icon: ArrowDownToLine, color: 'bg-blue-500/10 text-blue-500' },
              { to: '/reseller/history', label: 'Riwayat', icon: Package, color: 'bg-purple-500/10 text-purple-500' },
              { to: '/reseller/mutations', label: 'Mutasi Saldo', icon: ArrowLeftRight, color: 'bg-green-500/10 text-green-600' },
            ].map(item => (
              <Link key={item.to} to={item.to} className="flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all text-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}><item.icon className="w-5 h-5" /></div>
                <span className="text-xs font-medium text-foreground">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ResellerLayout>
  );
}
