import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Wallet, ArrowDownToLine, History, ArrowLeftRight, User, Lock, LifeBuoy, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { getResellerSession, resellerLogout, updateResellerBalance } from '@/lib/reseller-auth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const MENU = [
  { path: '/reseller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/reseller/products', label: 'Beli Produk', icon: Package },
  { path: '/reseller/deposit', label: 'Top Up Saldo', icon: ArrowDownToLine },
  { path: '/reseller/history', label: 'Riwayat Transaksi', icon: History },
  { path: '/reseller/mutations', label: 'Mutasi Saldo', icon: ArrowLeftRight },
  { path: '/reseller/profile', label: 'Profil Akun', icon: User },
  { path: '/reseller/support', label: 'Bantuan / Tiket', icon: LifeBuoy },
];

export default function ResellerLayout({ children }: { children: React.ReactNode }) {
  const session = getResellerSession();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [liveBalance, setLiveBalance] = useState(session?.balance ?? 0);

  useEffect(() => {
    if (!session?.reseller_id) return;
    supabase.from('sc_resellers').select('balance').eq('id', session.reseller_id).maybeSingle().then(({ data }) => {
      if (data?.balance !== undefined) { setLiveBalance(data.balance); updateResellerBalance(data.balance); }
    });
  }, [session?.reseller_id]);

  const handleLogout = () => { resellerLogout(); navigate('/reseller/login'); };

  const Sidebar = () => (
    <aside className={cn('fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Reseller</p>
            <p className="font-bold text-foreground truncate">{session?.name || 'Reseller'}</p>
            <p className="text-xs text-muted-foreground">@{session?.username}</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 bg-primary/10 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Saldo Aktif</p>
          <p className="text-xl font-bold text-primary">Rp {liveBalance.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {MENU.map(item => (
          <NavLink key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group', isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all">
          <LogOut className="w-4 h-4" /> Keluar
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Top bar mobile */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-card border-b border-border px-4 h-14 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-muted">
          <Menu className="w-5 h-5" />
        </button>
        <p className="font-bold text-foreground text-sm">Dashboard Reseller</p>
        <div className="text-right">
          <p className="text-xs text-primary font-bold">Rp {liveBalance.toLocaleString('id-ID')}</p>
        </div>
      </header>

      <main className="lg:ml-64 min-h-screen">
        <div className="pt-14 lg:pt-0 p-4 lg:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
