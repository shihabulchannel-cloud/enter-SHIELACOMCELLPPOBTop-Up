import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Image, HelpCircle, Receipt, LogOut, Zap, Plus, Trash2, Edit2, Check, X, Menu, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { isAdminLoggedIn, adminLogout } from '@/lib/admin-auth';
import { bannerStore, faqStore, transactionStore, type Banner, type FAQItem, type Transaction } from '@/lib/store';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'banners' | 'faqs' | 'transactions';

const navItems: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'banners', icon: Image, label: 'Banner' },
  { id: 'faqs', icon: HelpCircle, label: 'FAQ' },
  { id: 'transactions', icon: Receipt, label: 'Transaksi' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  processing: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  success: 'bg-green-500/10 text-green-600 border-green-500/30',
  failed: 'bg-red-500/10 text-red-600 border-red-500/30',
};

// ===== BANNER MANAGER =====
function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [newBanner, setNewBanner] = useState({ title: '', subtitle: '', badge: '', theme: 'all' as Banner['theme'] });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setBanners(bannerStore.get());
  }, []);

  const handleAdd = () => {
    if (!newBanner.title.trim()) return;
    bannerStore.add(newBanner);
    setBanners(bannerStore.get());
    setNewBanner({ title: '', subtitle: '', badge: '', theme: 'all' });
    setAdding(false);
  };

  const handleRemove = (id: string) => {
    bannerStore.remove(id);
    setBanners(bannerStore.get());
  };

  const themeLabel: Record<Banner['theme'], string> = {
    game: 'Top Up Game',
    pulsa: 'Pulsa & E-Wallet',
    pln: 'PLN & PPOB',
    all: 'Semua Layanan',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Kelola Banner</h2>
        <Button
          onClick={() => setAdding(!adding)}
          size="sm"
          className="bg-primary text-primary-foreground btn-glow shadow-green rounded-xl gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Banner
        </Button>
      </div>

      {adding && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6 animate-scale-in">
          <h3 className="font-semibold text-foreground mb-4">Banner Baru</h3>
          <div className="space-y-3">
            <Input value={newBanner.title} onChange={e => setNewBanner(p => ({ ...p, title: e.target.value }))} placeholder="Judul banner *" className="rounded-xl" />
            <Input value={newBanner.subtitle} onChange={e => setNewBanner(p => ({ ...p, subtitle: e.target.value }))} placeholder="Sub judul banner" className="rounded-xl" />
            <Input value={newBanner.badge} onChange={e => setNewBanner(p => ({ ...p, badge: e.target.value }))} placeholder="Badge text (e.g. Top Up Game)" className="rounded-xl" />
            <select
              value={newBanner.theme}
              onChange={e => setNewBanner(p => ({ ...p, theme: e.target.value as Banner['theme'] }))}
              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="game">Top Up Game</option>
              <option value="pulsa">Pulsa & E-Wallet</option>
              <option value="pln">PLN & PPOB</option>
              <option value="all">Semua Layanan</option>
            </select>
            <div className="flex gap-2">
              <Button onClick={handleAdd} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-1 btn-glow">
                <Check className="w-4 h-4" /> Simpan
              </Button>
              <Button onClick={() => setAdding(false)} size="sm" variant="outline" className="rounded-xl gap-1">
                <X className="w-4 h-4" /> Batal
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {banners.map((banner, i) => (
          <div key={banner.id} className="bg-card border border-border rounded-2xl p-4 flex items-start justify-between gap-4 group">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{banner.title}</p>
                <p className="text-muted-foreground text-xs mt-0.5 line-clamp-1">{banner.subtitle}</p>
                <Badge className="mt-1 text-xs bg-primary/10 text-primary border-primary/20">{themeLabel[banner.theme]}</Badge>
              </div>
            </div>
            <button
              onClick={() => handleRemove(banner.id)}
              className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== FAQ MANAGER =====
function FAQManager() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ question: '', answer: '' });

  useEffect(() => {
    setFaqs(faqStore.get());
  }, []);

  const handleAdd = () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    faqStore.add(form);
    setFaqs(faqStore.get());
    setForm({ question: '', answer: '' });
    setAdding(false);
  };

  const handleUpdate = (id: string) => {
    if (!form.question.trim() || !form.answer.trim()) return;
    faqStore.update(id, form);
    setFaqs(faqStore.get());
    setEditing(null);
  };

  const handleRemove = (id: string) => {
    faqStore.remove(id);
    setFaqs(faqStore.get());
  };

  const startEdit = (faq: FAQItem) => {
    setForm({ question: faq.question, answer: faq.answer });
    setEditing(faq.id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Kelola FAQ</h2>
        <Button onClick={() => { setAdding(!adding); setEditing(null); }} size="sm" className="bg-primary text-primary-foreground btn-glow shadow-green rounded-xl gap-2">
          <Plus className="w-4 h-4" />
          Tambah FAQ
        </Button>
      </div>

      {adding && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6 animate-scale-in">
          <h3 className="font-semibold text-foreground mb-4">FAQ Baru</h3>
          <div className="space-y-3">
            <Input value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} placeholder="Pertanyaan *" className="rounded-xl" />
            <textarea
              value={form.answer}
              onChange={e => setForm(p => ({ ...p, answer: e.target.value }))}
              placeholder="Jawaban *"
              rows={3}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-2">
              <Button onClick={handleAdd} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-1 btn-glow">
                <Check className="w-4 h-4" /> Simpan
              </Button>
              <Button onClick={() => setAdding(false)} size="sm" variant="outline" className="rounded-xl gap-1">
                <X className="w-4 h-4" /> Batal
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={faq.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            {editing === faq.id ? (
              <div className="p-4 space-y-3">
                <Input value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} placeholder="Pertanyaan" className="rounded-xl" />
                <textarea
                  value={form.answer}
                  onChange={e => setForm(p => ({ ...p, answer: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex gap-2">
                  <Button onClick={() => handleUpdate(faq.id)} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-1 btn-glow">
                    <Check className="w-4 h-4" /> Simpan
                  </Button>
                  <Button onClick={() => setEditing(null)} size="sm" variant="outline" className="rounded-xl gap-1">
                    <X className="w-4 h-4" /> Batal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 flex items-start justify-between gap-4 group">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm">{faq.question}</p>
                    <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{faq.answer}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => startEdit(faq)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleRemove(faq.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== TRANSACTION LIST =====
function TransactionList() {
  const [transactions] = useState<Transaction[]>(transactionStore.get());

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-6">Daftar Transaksi</h2>
      <div className="space-y-3">
        {transactions.map(tx => (
          <div key={tx.id} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-bold text-foreground text-sm">{tx.invoiceId}</p>
                <p className="text-foreground text-sm mt-0.5">{tx.product}</p>
                <p className="text-muted-foreground text-xs">Tujuan: {tx.destination}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">Rp {tx.amount.toLocaleString('id-ID')}</p>
                <Badge className={cn('mt-1 text-xs border font-semibold', statusColors[tx.status])}>
                  {tx.status === 'pending' ? 'Menunggu' : tx.status === 'processing' ? 'Diproses' : tx.status === 'success' ? 'Berhasil' : 'Gagal'}
                </Badge>
                <p className="text-muted-foreground text-xs mt-1">{tx.createdAt}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== OVERVIEW =====
function Overview() {
  const banners = bannerStore.get();
  const faqs = faqStore.get();
  const transactions = transactionStore.get();
  const successTx = transactions.filter(t => t.status === 'success').length;

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-6">Dashboard Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Banner', value: banners.length, icon: Image, color: 'bg-blue-500/10 text-blue-600' },
          { label: 'Total FAQ', value: faqs.length, icon: HelpCircle, color: 'bg-purple-500/10 text-purple-600' },
          { label: 'Total Transaksi', value: transactions.length, icon: Receipt, color: 'bg-orange-500/10 text-orange-600' },
          { label: 'Transaksi Sukses', value: successTx, icon: Check, color: 'bg-primary/10 text-primary' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-card border border-border rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-foreground">{item.value}</p>
              <p className="text-muted-foreground text-xs mt-1">{item.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Transaksi Terbaru</h3>
        <div className="space-y-3">
          {transactions.slice(0, 5).map(tx => (
            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{tx.product}</p>
                <p className="text-xs text-muted-foreground">{tx.invoiceId}</p>
              </div>
              <Badge className={cn('text-xs border font-semibold', statusColors[tx.status])}>
                {tx.status === 'success' ? 'Sukses' : tx.status === 'pending' ? 'Pending' : tx.status === 'processing' ? 'Proses' : 'Gagal'}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== MAIN DASHBOARD =====
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogout = () => {
    adminLogout();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-brand-dark flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-green">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <span className="text-sm font-bold text-white leading-none block">SHIELACOM</span>
              <span className="text-xs text-primary font-semibold leading-none block">ADMIN PANEL</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  activeTab === item.id
                    ? 'bg-primary text-white shadow-green'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
                {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-muted text-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-foreground text-base">{navItems.find(n => n.id === activeTab)?.label}</h1>
              <p className="text-muted-foreground text-xs">SHIELACOM CELL Admin</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            size="sm"
            variant="ghost"
            className="gap-2 text-muted-foreground hover:text-destructive rounded-xl"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {activeTab === 'overview' && <Overview />}
          {activeTab === 'banners' && <BannerManager />}
          {activeTab === 'faqs' && <FAQManager />}
          {activeTab === 'transactions' && <TransactionList />}
        </main>
      </div>
    </div>
  );
}
