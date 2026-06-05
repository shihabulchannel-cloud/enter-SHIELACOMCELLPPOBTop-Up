import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Globe, Image, Package, Tag, Zap, CreditCard, TrendingUp, Users,
  FileText, BarChart2, Activity, Bell, LogOut, Menu, X, ChevronRight, Shield, Loader2
} from 'lucide-react';
import { isAdminLoggedIn, adminLogout } from '@/lib/admin-auth';
import { notificationStore, logAction, depositStore, registrationStore } from '@/lib/store';
import AdminOverview from '@/components/admin/AdminOverview';
import WebsiteManagement from '@/components/admin/WebsiteManagement';
import BannerManager from '@/components/admin/BannerManager';
import ProductManager from '@/components/admin/ProductManager';
import CategoryManager from '@/components/admin/CategoryManager';
import ProviderSettings from '@/components/admin/ProviderSettings';
import PaymentGatewaySettings from '@/components/admin/PaymentGatewaySettings';
import MarkupSettings from '@/components/admin/MarkupSettings';
import ResellerPanel from '@/components/admin/ResellerPanel';
import ContentPanel from '@/components/admin/ContentPanel';
import ReportsPanel from '@/components/admin/ReportsPanel';
import SystemPanel from '@/components/admin/SystemPanel';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// ============================================================
// NAV CONFIG
// ============================================================
type SectionKey =
  | 'overview'
  | 'website' | 'banners'
  | 'products' | 'categories'
  | 'provider' | 'payment' | 'markup'
  | 'resellers' | 'deposits' | 'registrations'
  | 'testimonials' | 'articles' | 'faqs'
  | 'transactions' | 'reports'
  | 'health' | 'logs' | 'notifications';

interface NavItem {
  key: SectionKey;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

function buildNav(unreadNotifs: number, pendingDeposits: number, pendingRegs: number): NavGroup[] {
  return [
    {
      group: 'Utama',
      items: [
        { key: 'overview', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'Website',
      items: [
        { key: 'website', label: 'Pengaturan Website', icon: Globe },
        { key: 'banners', label: 'Banner & Slider', icon: Image },
      ],
    },
    {
      group: 'Produk',
      items: [
        { key: 'products', label: 'Daftar Produk', icon: Package },
        { key: 'categories', label: 'Kategori', icon: Tag },
        { key: 'provider', label: 'Provider (Digiflazz)', icon: Zap },
        { key: 'payment', label: 'Payment Gateway', icon: CreditCard },
        { key: 'markup', label: 'Markup Harga', icon: TrendingUp },
      ],
    },
    {
      group: 'Reseller',
      items: [
        { key: 'resellers', label: 'Daftar Reseller', icon: Users },
        { key: 'deposits', label: 'Deposit', icon: CreditCard, badge: pendingDeposits || undefined },
        { key: 'registrations', label: 'Pendaftaran', icon: FileText, badge: pendingRegs || undefined },
      ],
    },
    {
      group: 'Konten',
      items: [
        { key: 'testimonials', label: 'Testimoni', icon: FileText },
        { key: 'articles', label: 'Artikel/Blog', icon: FileText },
        { key: 'faqs', label: 'FAQ', icon: FileText },
      ],
    },
    {
      group: 'Laporan',
      items: [
        { key: 'transactions', label: 'Transaksi', icon: BarChart2 },
        { key: 'reports', label: 'Statistik', icon: TrendingUp },
      ],
    },
    {
      group: 'Sistem',
      items: [
        { key: 'health', label: 'System Health', icon: Activity },
        { key: 'logs', label: 'System Logs', icon: FileText },
        { key: 'notifications', label: 'Notifikasi', icon: Bell, badge: unreadNotifs || undefined },
      ],
    },
  ];
}

// ============================================================
// TRANSACTIONS TABLE (real DB orders)
// ============================================================
function TransactionsTable() {
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    supabase.from('sc_orders').select('*').order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => { setOrders(data || []); setLoading(false); });
  }, []);

  const STATUS_CFG: Record<string, { label: string; cls: string }> = {
    waiting_payment: { label: 'Menunggu Bayar', cls: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
    processing: { label: 'Diproses', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
    success: { label: 'Sukses', cls: 'bg-green-500/10 text-green-600 border-green-500/30' },
    failed: { label: 'Gagal', cls: 'bg-red-500/10 text-red-500 border-red-500/30' },
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.order_status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Riwayat Transaksi</h2>
          <p className="text-muted-foreground text-sm">{orders.length} total order</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'waiting_payment', 'processing', 'success', 'failed'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition-all', filter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-primary/10')}>
              {s === 'all' ? 'Semua' : STATUS_CFG[s]?.label || s}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Memuat data...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Invoice</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Produk</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Tujuan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Pembeli</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Metode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const status = String(o.order_status || 'waiting_payment');
                  const cfg = STATUS_CFG[status] || STATUS_CFG.waiting_payment;
                  return (
                    <tr key={String(o.id)} className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 text-xs font-medium text-primary font-mono">{String(o.invoice_id || '')}</td>
                      <td className="px-4 py-3 text-sm text-foreground max-w-[140px] truncate">{String(o.product_name || '')}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{String(o.target || '')}{o.target_detail ? ` (${o.target_detail})` : ''}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{String(o.buyer_name || '')}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground text-right">Rp {Number(o.payment_amount || 0).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{String(o.payment_method || '')}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-semibold px-2 py-1 rounded-full border', cfg.cls)}>{cfg.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(String(o.created_at)).toLocaleString('id-ID')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">Belum ada transaksi</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CONTENT ROUTER
// ============================================================
function SectionContent({ section, navigate: nav }: { section: SectionKey; navigate: (s: SectionKey) => void }) {
  switch (section) {
    case 'overview': return <AdminOverview onNavigate={(s) => nav(s as SectionKey)} />;
    case 'website': return <WebsiteManagement defaultSection="general" />;
    case 'banners': return <BannerManager />;
    case 'products': return <ProductManager />;
    case 'categories': return <CategoryManager />;
    case 'provider': return <ProviderSettings defaultTab="digiflazz" />;
    case 'payment': return <PaymentGatewaySettings />;
    case 'markup': return <MarkupSettings />;
    case 'resellers': return <ResellerPanel defaultTab="resellers" />;
    case 'deposits': return <ResellerPanel defaultTab="deposits" />;
    case 'registrations': return <ResellerPanel defaultTab="registrations" />;
    case 'testimonials': return <ContentPanel defaultTab="testimonials" />;
    case 'articles': return <ContentPanel defaultTab="articles" />;
    case 'faqs': return <ContentPanel defaultTab="faqs" />;
    case 'transactions': return <TransactionsTable />;
    case 'reports': return <ReportsPanel />;
    case 'health': return <SystemPanel defaultTab="health" />;
    case 'logs': return <SystemPanel defaultTab="logs" />;
    case 'notifications': return <SystemPanel defaultTab="notifications" />;
    default: return <AdminOverview onNavigate={(s) => nav(s as SectionKey)} />;
  }
}

// ============================================================
// MAIN DASHBOARD
// ============================================================
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [section, setSection] = useState<SectionKey>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [pendingDeposits, setPendingDeposits] = useState(0);
  const [pendingRegs, setPendingRegs] = useState(0);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/admin');
      return;
    }
    refreshBadges();
    logAction('LOGIN', 'Admin membuka dashboard');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshBadges = () => {
    setUnreadNotifs(notificationStore.unread());
    setPendingDeposits(depositStore.get().filter((d) => d.status === 'pending').length);
    setPendingRegs(registrationStore.get().filter((r) => r.status === 'pending').length);
  };

  const navGroups = buildNav(unreadNotifs, pendingDeposits, pendingRegs);

  const handleNavigate = (key: SectionKey) => {
    setSection(key);
    setSidebarOpen(false);
    refreshBadges();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logAction('LOGOUT', 'Admin logout dari dashboard');
    adminLogout();
    navigate('/admin');
  };

  const currentNavItem = navGroups.flatMap(g => g.items).find(i => i.key === section);

  const Sidebar = ({ mobile }: { mobile?: boolean }) => (
    <div className={cn('flex flex-col h-full', mobile ? 'w-full' : '')}>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm leading-none">SHIELACOM CELL</p>
            <p className="text-muted-foreground text-xs mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-hidden px-3 py-3 space-y-4">
        {navGroups.map(group => (
          <div key={group.group}>
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider px-2 mb-1">{group.group}</p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon;
                const active = section === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavigate(item.key)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all text-left',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge ? (
                      <span className={cn('text-xs font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1', active ? 'bg-white/30 text-white' : 'bg-red-500 text-white')}>
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border space-y-1">
        <button onClick={() => window.open('/', '_blank')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-left">
          <Globe className="w-4 h-4 flex-shrink-0" />
          <span>Lihat Website</span>
        </button>
        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all text-left">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 flex-shrink-0 bg-card border-r border-border sticky top-0 h-screen overflow-hidden">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-card border-r border-border z-10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <p className="font-bold text-sm text-foreground">Menu</p>
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="h-[calc(100%-57px)] overflow-y-auto">
              <Sidebar mobile />
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 md:px-6 h-14 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <span>Admin</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">{currentNavItem?.label || 'Dashboard'}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => handleNavigate('notifications')} className="relative p-2 rounded-xl hover:bg-muted transition-colors">
              <Bell className="w-4 h-4 text-foreground" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6">
          <SectionContent section={section} navigate={handleNavigate} />
        </main>
      </div>
    </div>
  );
}
