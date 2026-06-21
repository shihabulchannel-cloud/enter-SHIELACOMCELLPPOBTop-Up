import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Globe, Image, Package, Tag, Zap, CreditCard, TrendingUp, Users,
  FileText, BarChart2, Activity, Bell, LogOut, Menu, X, ChevronRight, Shield, Loader2,
  UserCog, KeyRound, CheckCircle2, AlertCircle, RefreshCw, Banknote, ClipboardCheck
} from 'lucide-react';
import { isAdminLoggedIn, adminLogout, getAdminSession, changeAdminPassword } from '@/lib/admin-auth';
import { notificationStore, logAction } from '@/lib/store';
import AdminOverview from '@/components/admin/AdminOverview';
import WebsiteManagement from '@/components/admin/WebsiteManagement';
import BannerManager from '@/components/admin/BannerManager';
import ProductManager from '@/components/admin/ProductManager';
import CategoryManager from '@/components/admin/CategoryManager';
import ProviderSettings from '@/components/admin/ProviderSettings';
import PaymentGatewaySettings from '@/components/admin/PaymentGatewaySettings';
import MarkupSettings from '@/components/admin/MarkupSettings';
import ResellerPanel from '@/components/admin/ResellerPanel';
import BankAccountSettings from '@/components/admin/BankAccountSettings';
import LegalSettings from '@/components/admin/LegalSettings';
import ContentPanel from '@/components/admin/ContentPanel';
import ReportsPanel from '@/components/admin/ReportsPanel';
import SystemPanel from '@/components/admin/SystemPanel';
import ManualPaymentSettings from '@/components/admin/ManualPaymentSettings';
import PaymentVerification from '@/components/admin/PaymentVerification';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================
// NAV CONFIG
// ============================================================
type SectionKey =
  | 'overview' | 'profile'
  | 'website' | 'banners'
  | 'products' | 'categories'
  | 'provider' | 'payment' | 'markup'
  | 'manual_config' | 'manual_payments'
  | 'resellers' | 'deposits' | 'bank_accounts'
  | 'testimonials' | 'articles' | 'faqs' | 'legal'
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

function buildNav(unreadNotifs: number, pendingDeposits: number, pendingManual: number): NavGroup[] {
  return [
    {
      group: 'Utama',
      items: [
        { key: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { key: 'profile', label: 'Profil & Keamanan', icon: UserCog },
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
      group: 'Pembayaran Manual',
      items: [
        { key: 'manual_config', label: 'Pengaturan Manual', icon: Banknote },
        { key: 'manual_payments', label: 'Verifikasi Pembayaran', icon: ClipboardCheck, badge: pendingManual || undefined },
      ],
    },
    {
      group: 'Reseller',
      items: [
        { key: 'resellers', label: 'Daftar Reseller', icon: Users },
        { key: 'deposits', label: 'Deposit', icon: CreditCard, badge: pendingDeposits || undefined },
        { key: 'bank_accounts', label: 'Rekening Bank', icon: CreditCard },
      ],
    },
    {
      group: 'Konten',
      items: [
        { key: 'testimonials', label: 'Testimoni', icon: FileText },
        { key: 'articles', label: 'Artikel/Blog', icon: FileText },
        { key: 'faqs', label: 'FAQ', icon: FileText },
        { key: 'legal', label: 'Halaman Legal', icon: FileText },
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
// TRANSACTIONS TABLE — unified sc_orders + sc_reseller_orders + realtime
// ============================================================
interface UnifiedTx {
  _key: string;
  type: 'public' | 'reseller';
  invoice_id: string;
  product_name: string;
  target: string;
  target_detail?: string;
  buyer_name: string;
  amount: number;
  payment_method?: string;
  order_status: string;
  digiflazz_sn?: string;
  notes?: string;
  created_at: string;
}

function TransactionsTable() {
  const [rows, setRows] = useState<UnifiedTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadAll = useCallback(async () => {
    const [{ data: pub }, { data: res }] = await Promise.all([
      supabase.from('sc_orders').select('id,invoice_id,product_name,target,target_detail,buyer_name,payment_amount,payment_method,order_status,digiflazz_sn,notes,created_at')
        .order('created_at', { ascending: false }).limit(300),
      supabase.from('sc_reseller_orders').select('id,invoice_id,product_name,target,reseller_name,product_price,order_status,digiflazz_sn,notes,created_at')
        .order('created_at', { ascending: false }).limit(300),
    ]);
    const pubRows: UnifiedTx[] = (pub || []).map(o => ({
      _key: `pub-${o.id}`, type: 'public',
      invoice_id: o.invoice_id, product_name: o.product_name,
      target: o.target, target_detail: o.target_detail,
      buyer_name: o.buyer_name || '—',
      amount: o.payment_amount || 0,
      payment_method: o.payment_method,
      order_status: o.order_status || 'waiting_payment',
      digiflazz_sn: o.digiflazz_sn,
      notes: o.notes,
      created_at: o.created_at,
    }));
    const resRows: UnifiedTx[] = (res || []).map(o => ({
      _key: `res-${o.id}`, type: 'reseller',
      invoice_id: o.invoice_id, product_name: o.product_name,
      target: o.target, buyer_name: o.reseller_name || '—',
      amount: o.product_price || 0,
      payment_method: 'Saldo Reseller',
      order_status: o.order_status || 'processing',
      digiflazz_sn: o.digiflazz_sn,
      notes: o.notes,
      created_at: o.created_at,
    }));
    const merged = [...pubRows, ...resRows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setRows(merged);
    setLoading(false);
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    loadAll();
    const channel = supabase.channel('transactions-table-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sc_orders' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sc_reseller_orders' }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadAll]);

  const STATUS_CFG: Record<string, { label: string; cls: string }> = {
    waiting_payment: { label: 'Menunggu Bayar', cls: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
    pending:         { label: 'Pending',          cls: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
    processing:      { label: 'Diproses',          cls: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
    success:         { label: 'Sukses',            cls: 'bg-green-500/10 text-green-600 border-green-500/30' },
    failed:          { label: 'Gagal',             cls: 'bg-red-500/10 text-red-500 border-red-500/30' },
  };

  const FILTER_OPTIONS = [
    { value: 'all', label: 'Semua' },
    { value: 'waiting_payment', label: 'Menunggu Bayar' },
    { value: 'processing', label: 'Diproses' },
    { value: 'success', label: 'Sukses' },
    { value: 'failed', label: 'Gagal' },
    { value: '__public', label: 'Pembeli Umum' },
    { value: '__reseller', label: 'Reseller' },
  ];

  const filtered = rows.filter(o => {
    if (filter === 'all') return true;
    if (filter === '__public') return o.type === 'public';
    if (filter === '__reseller') return o.type === 'reseller';
    return o.order_status === filter;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Semua Transaksi</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-muted-foreground text-sm">{rows.length} total (Publik + Reseller)</p>
            <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Realtime
            </span>
          </div>
          {!loading && <p className="text-xs text-muted-foreground/60 mt-0.5">Update: {lastUpdate.toLocaleTimeString('id-ID')}</p>}
        </div>
        <button onClick={loadAll} className="p-2 rounded-xl hover:bg-muted" title="Refresh">
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <RefreshCw className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTER_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => setFilter(opt.value)} className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition-all', filter === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-primary/10')}>
            {opt.label}
          </button>
        ))}
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Memuat transaksi...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Tipe</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Invoice</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Produk</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Tujuan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Pembeli/Reseller</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">SN / Keterangan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const cfg = STATUS_CFG[o.order_status] || STATUS_CFG.processing;
                  return (
                    <tr key={o._key} className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3">
                        <span className={cn('text-[10px] font-bold px-2 py-1 rounded-md', o.type === 'reseller' ? 'bg-purple-500/10 text-purple-600' : 'bg-blue-500/10 text-blue-600')}>
                          {o.type === 'reseller' ? 'RESELLER' : 'PUBLIK'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-primary font-mono">{o.invoice_id}</td>
                      <td className="px-4 py-3 text-sm text-foreground max-w-[130px] truncate">{o.product_name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{o.target}{o.target_detail ? ` (${o.target_detail})` : ''}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{o.buyer_name}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground text-right">Rp {o.amount.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-semibold px-2 py-1 rounded-full border', cfg.cls)}>{cfg.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px]">
                        {o.digiflazz_sn ? <span className="text-green-600 font-mono">SN: {o.digiflazz_sn}</span> : o.notes ? <span className="truncate block">{o.notes}</span> : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(o.created_at).toLocaleString('id-ID')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">Tidak ada transaksi</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ADMIN PROFILE / CHANGE PASSWORD
// ============================================================
function AdminProfile() {
  const session = getAdminSession();
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleChange = async () => {
    if (!oldPass || !newPass || !confirmPass) {
      setResult({ ok: false, msg: 'Semua field wajib diisi' }); return;
    }
    if (newPass !== confirmPass) {
      setResult({ ok: false, msg: 'Password baru tidak cocok' }); return;
    }
    if (newPass.length < 8) {
      setResult({ ok: false, msg: 'Password baru minimal 8 karakter' }); return;
    }
    if (!session?.admin_id) {
      setResult({ ok: false, msg: 'Sesi tidak valid, harap login ulang' }); return;
    }
    setLoading(true);
    setResult(null);
    const res = await changeAdminPassword(session.admin_id, oldPass, newPass);
    setLoading(false);
    if (res.success) {
      setResult({ ok: true, msg: 'Password berhasil diubah!' });
      setOldPass(''); setNewPass(''); setConfirmPass('');
    } else {
      setResult({ ok: false, msg: res.error || 'Gagal mengubah password' });
    }
  };

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Profil & Keamanan</h2>
        <p className="text-muted-foreground text-sm">Kelola akun admin Anda</p>
      </div>

      {/* Account Info */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground text-lg">{session?.display_name || 'Admin'}</p>
            <p className="text-muted-foreground text-sm">@{session?.username || 'admin'}</p>
            {session?.email && <p className="text-muted-foreground text-xs">{session.email}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Username</p>
            <p className="font-semibold text-foreground">{session?.username || '—'}</p>
          </div>
          <div className="bg-muted rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Role</p>
            <p className="font-semibold text-primary">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-foreground">Ganti Password</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Password Lama</label>
            <Input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} placeholder="Masukkan password lama" className="rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Password Baru</label>
            <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Minimal 8 karakter" className="rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Konfirmasi Password Baru</label>
            <Input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Ulangi password baru" className="rounded-xl" onKeyDown={e => e.key === 'Enter' && handleChange()} />
          </div>

          {result && (
            <div className={cn('flex items-center gap-2 p-3 rounded-xl text-sm', result.ok ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-600')}>
              {result.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              {result.msg}
            </div>
          )}

          <Button onClick={handleChange} disabled={loading} className="bg-primary text-primary-foreground btn-glow rounded-xl gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
          </Button>
        </div>
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
    case 'profile': return <AdminProfile />;
    case 'website': return <WebsiteManagement defaultSection="general" />;
    case 'banners': return <BannerManager />;
    case 'products': return <ProductManager />;
    case 'categories': return <CategoryManager />;
    case 'provider': return <ProviderSettings defaultTab="digiflazz" />;
    case 'payment': return <PaymentGatewaySettings />;
    case 'markup': return <MarkupSettings />;
    case 'manual_config': return <ManualPaymentSettings />;
    case 'manual_payments': return <PaymentVerification />;
    case 'resellers': return <ResellerPanel />;
    case 'deposits': return <ResellerPanel />;
    case 'bank_accounts': return <div className="space-y-6"><h2 className="text-xl font-bold text-foreground">Pengaturan Rekening Bank</h2><BankAccountSettings /></div>;
    case 'legal': return <LegalSettings />;
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
  const [pendingManual, setPendingManual] = useState(0);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/admin');
      return;
    }
    refreshBadges();
    logAction('LOGIN', 'Admin membuka dashboard');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshBadges = async () => {
    setUnreadNotifs(notificationStore.unread());
    const [{ count: dep }, { count: manual }] = await Promise.all([
      supabase.from('sc_deposits').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('sc_orders').select('id', { count: 'exact', head: true }).eq('payment_method', 'MANUAL').neq('payment_proof_url', '').eq('payment_status', 'pending'),
    ]);
    setPendingDeposits(dep || 0);
    setPendingManual(manual || 0);
  };

  const navGroups = buildNav(unreadNotifs, pendingDeposits, pendingManual);

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
        {/* Admin info */}
        <button
          onClick={() => handleNavigate('profile')}
          className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-left mb-1', section === 'profile' ? 'bg-primary/10' : 'hover:bg-muted')}
        >
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Shield className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{getAdminSession()?.display_name || 'Admin'}</p>
            <p className="text-xs text-muted-foreground truncate">@{getAdminSession()?.username || 'admin'}</p>
          </div>
          <UserCog className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        </button>
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
      <aside className="hidden md:flex flex-col w-60 xl:w-64 flex-shrink-0 bg-card border-r border-border sticky top-0 h-screen overflow-hidden">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
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
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors">
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
