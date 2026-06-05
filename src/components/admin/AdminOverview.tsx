import { useState, useEffect } from 'react';
import { TrendingUp, Users, Receipt, Bell, CheckCircle2, Clock, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  transactionStore, resellerStore, depositStore, registrationStore,
  notificationStore, productStore, type Transaction
} from '@/lib/store';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  processing: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  success: 'bg-green-500/10 text-green-600 border-green-500/30',
  failed: 'bg-red-500/10 text-red-600 border-red-500/30',
};

export default function AdminOverview({ onNavigate }: { onNavigate: (s: string) => void }) {
  const transactions = transactionStore.get();
  const resellers = resellerStore.get();
  const deposits = depositStore.get();
  const regs = registrationStore.get();
  const products = productStore.get();
  const notifications = notificationStore.get().filter(n => !n.read);

  const todayTx = transactions.filter(t => t.status === 'success');
  const omset = todayTx.reduce((a, t) => a + t.amount, 0);
  const profit = todayTx.reduce((a, t) => a + (t.profit || 0), 0);
  const pendingDeposits = deposits.filter(d => d.status === 'pending').length;
  const pendingRegs = regs.filter(r => r.status === 'pending').length;

  const statCards = [
    { label: 'Total Transaksi', value: transactions.length, icon: Receipt, color: 'bg-primary/10 text-primary', action: () => onNavigate('transactions') },
    { label: 'Total Reseller', value: resellers.length, icon: Users, color: 'bg-blue-500/10 text-blue-600', action: () => onNavigate('resellers') },
    { label: 'Omset (Semua)', value: `Rp ${(omset/1000).toFixed(0)}k`, icon: TrendingUp, color: 'bg-emerald-500/10 text-emerald-600', action: () => onNavigate('reports') },
    { label: 'Produk Aktif', value: products.filter(p => p.active).length, icon: CheckCircle2, color: 'bg-purple-500/10 text-purple-600', action: () => onNavigate('products') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground text-sm mt-1">Selamat datang di Admin Panel SHIELACOM CELL</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map(card => {
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
            </button>
          );
        })}
      </div>

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

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Transaksi Terbaru</h3>
            <button onClick={() => onNavigate('transactions')} className="text-primary text-xs flex items-center gap-1 hover:underline">
              Lihat semua <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {transactions.slice(0, 5).map((tx: Transaction) => (
              <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.product}</p>
                  <p className="text-xs text-muted-foreground">{tx.invoiceId}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <Badge className={cn('text-xs border font-semibold', STATUS_COLORS[tx.status])}>
                    {tx.status === 'success' ? 'Sukses' : tx.status === 'pending' ? 'Pending' : tx.status === 'processing' ? 'Proses' : 'Gagal'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Ringkasan Keuangan</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Total Omset', value: `Rp ${omset.toLocaleString('id-ID')}`, color: 'text-foreground' },
              { label: 'Total Profit', value: `Rp ${profit.toLocaleString('id-ID')}`, color: 'text-primary' },
              { label: 'Transaksi Sukses', value: todayTx.length.toString(), color: 'text-emerald-600' },
              { label: 'Transaksi Gagal', value: transactions.filter(t => t.status === 'failed').length.toString(), color: 'text-red-500' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`font-bold text-sm ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
