import { TrendingUp, Receipt, Users, DollarSign } from 'lucide-react';
import { transactionStore, resellerStore, depositStore } from '@/lib/store';

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: React.FC<{ className?: string }>; color: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-primary font-medium text-xs mt-0.5">{sub}</p>}
      <p className="text-muted-foreground text-xs mt-1">{label}</p>
    </div>
  );
}

export default function ReportsPanel() {
  const transactions = transactionStore.get();
  const resellers = resellerStore.get();
  const deposits = depositStore.get();

  const success = transactions.filter(t => t.status === 'success');
  const failed = transactions.filter(t => t.status === 'failed');
  const omset = success.reduce((a, t) => a + t.amount, 0);
  const profit = success.reduce((a, t) => a + (t.profit || 0), 0);
  const totalDeposit = deposits.filter(d => d.status === 'approved').reduce((a, d) => a + d.amount, 0);
  const totalBalance = resellers.reduce((a, r) => a + r.balance, 0);

  const catCount: Record<string, number> = {};
  transactions.forEach(t => {
    const cat = t.product.includes('ML') || t.product.includes('FF') || t.product.includes('Game') ? 'Game' :
      t.product.includes('Pulsa') || t.product.includes('Data') ? 'Pulsa & Data' :
        t.product.includes('PLN') || t.product.includes('Token') ? 'PLN' :
          t.product.includes('GoPay') || t.product.includes('OVO') || t.product.includes('DANA') ? 'E-Wallet' : 'Lainnya';
    catCount[cat] = (catCount[cat] || 0) + 1;
  });
  const sortedCat = Object.entries(catCount).sort((a, b) => b[1] - a[1]);
  const maxCat = sortedCat[0]?.[1] || 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Laporan & Statistik</h2>
        <p className="text-muted-foreground text-sm">Ringkasan performa bisnis SHIELACOM CELL</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Omset" value={`Rp ${(omset/1000).toFixed(0)}K`} sub={`dari ${success.length} transaksi`} icon={TrendingUp} color="bg-primary/10 text-primary" />
        <StatCard label="Total Profit" value={`Rp ${(profit/1000).toFixed(0)}K`} sub={`avg Rp ${success.length ? Math.round(profit/success.length).toLocaleString('id-ID') : 0}/tx`} icon={DollarSign} color="bg-emerald-500/10 text-emerald-600" />
        <StatCard label="Total Transaksi" value={transactions.length.toString()} sub={`${failed.length} gagal`} icon={Receipt} color="bg-blue-500/10 text-blue-600" />
        <StatCard label="Total Reseller" value={resellers.length.toString()} sub={`Balance: Rp ${(totalBalance/1000).toFixed(0)}K`} icon={Users} color="bg-purple-500/10 text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Transaction Status */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Status Transaksi</h3>
          {[
            { label: 'Berhasil', count: success.length, pct: transactions.length ? (success.length/transactions.length*100).toFixed(0) : 0, color: 'bg-green-500' },
            { label: 'Gagal', count: failed.length, pct: transactions.length ? (failed.length/transactions.length*100).toFixed(0) : 0, color: 'bg-red-500' },
            { label: 'Pending', count: transactions.filter(t=>t.status==='pending').length, pct: transactions.length ? (transactions.filter(t=>t.status==='pending').length/transactions.length*100).toFixed(0) : 0, color: 'bg-yellow-500' },
            { label: 'Diproses', count: transactions.filter(t=>t.status==='processing').length, pct: transactions.length ? (transactions.filter(t=>t.status==='processing').length/transactions.length*100).toFixed(0) : 0, color: 'bg-blue-500' },
          ].map(item => (
            <div key={item.label} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-foreground">{item.count} ({item.pct}%)</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%`, transition: 'width 1s ease' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Top Categories */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Produk Terlaris</h3>
          {sortedCat.slice(0, 5).map(([cat, count]) => (
            <div key={cat} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{cat}</span>
                <span className="font-medium text-foreground">{count} transaksi</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(count/maxCat*100).toFixed(0)}%`, transition: 'width 1s ease' }} />
              </div>
            </div>
          ))}
          {sortedCat.length === 0 && <p className="text-muted-foreground text-sm">Belum ada data</p>}
        </div>
      </div>

      {/* Deposit Summary */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Ringkasan Deposit Reseller</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Deposit Masuk', value: `Rp ${totalDeposit.toLocaleString('id-ID')}`, color: 'text-primary' },
            { label: 'Deposit Pending', value: deposits.filter(d=>d.status==='pending').length + ' deposit', color: 'text-yellow-600' },
            { label: 'Total Saldo Reseller', value: `Rp ${totalBalance.toLocaleString('id-ID')}`, color: 'text-blue-600' },
          ].map(item => (
            <div key={item.label} className="text-center p-4 bg-muted/30 rounded-2xl">
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-muted-foreground text-xs mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
