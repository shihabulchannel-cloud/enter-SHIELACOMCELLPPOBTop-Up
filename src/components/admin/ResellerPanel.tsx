import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, User, Wallet, ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  resellerStore, registrationStore, depositStore, walletMutationStore,
  type Reseller, type ResellerRegistration, type Deposit, type WalletMutation, logAction
} from '@/lib/store';
import { cn } from '@/lib/utils';

type Tab = 'resellers' | 'registrations' | 'deposits' | 'mutations';

// ===== RESELLER TAB =====
function ResellerTab() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [balanceModal, setBalanceModal] = useState<Reseller | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceNote, setBalanceNote] = useState('');
  const [balanceType, setBalanceType] = useState<'add' | 'deduct'>('add');

  useEffect(() => { setResellers(resellerStore.get()); }, []);
  const refresh = () => setResellers(resellerStore.get());

  const emptyForm = (): Omit<Reseller, 'id'> => ({
    name: '', email: '', whatsapp: '', username: '', password: '',
    balance: 0, status: 'active', createdAt: new Date().toLocaleDateString(),
  });
  const [form, setForm] = useState(emptyForm());
  const f = (k: keyof typeof form) => (v: string | number) => setForm(p => ({ ...p, [k]: v }));

  const handleAddReseller = () => {
    if (!form.name || !form.username) return;
    resellerStore.add(form);
    refresh(); setAdding(false); setForm(emptyForm());
  };

  const handleAdjustBalance = () => {
    if (!balanceModal) return;
    const amt = parseInt(balanceAmount) || 0;
    if (amt <= 0) return;
    depositStore.addManual(balanceModal.id, balanceType === 'add' ? amt : -amt, balanceNote || (balanceType === 'add' ? 'Deposit manual' : 'Debit manual'));
    refresh();
    setBalanceModal(null); setBalanceAmount(''); setBalanceNote('');
  };

  const ResellerForm = ({ initial, onSave, onCancel }: { initial?: Partial<Reseller>; onSave: () => void; onCancel: () => void }) => {
    const [lForm, setLForm] = useState({ ...emptyForm(), ...initial });
    const lf = (k: keyof typeof lForm) => (v: string | number) => setLForm(p => ({ ...p, [k]: v }));
    return (
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-scale-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Nama *</label><Input value={lForm.name} onChange={e => lf('name')(e.target.value)} className="rounded-xl h-9" /></div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Username *</label><Input value={lForm.username} onChange={e => lf('username')(e.target.value)} className="rounded-xl h-9" /></div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Password</label><Input type="password" value={lForm.password} onChange={e => lf('password')(e.target.value)} placeholder="Kosong = tidak diubah" className="rounded-xl h-9" /></div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1 block">WhatsApp</label><Input value={lForm.whatsapp} onChange={e => lf('whatsapp')(e.target.value)} className="rounded-xl h-9" /></div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label><Input type="email" value={lForm.email} onChange={e => lf('email')(e.target.value)} className="rounded-xl h-9" /></div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
            <select value={lForm.status} onChange={e => lf('status')(e.target.value)} className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm">
              <option value="active">Aktif</option><option value="suspended">Suspend</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { if (lForm.name && lForm.username) { if (initial?.id) resellerStore.update(initial.id, lForm); else resellerStore.add(lForm); refresh(); onSave(); } }} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-1 btn-glow">
            <Check className="w-4 h-4" /> Simpan
          </Button>
          <Button onClick={onCancel} size="sm" variant="outline" className="rounded-xl gap-1"><X className="w-4 h-4" /> Batal</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{resellers.filter(r => r.status === 'active').length} aktif dari {resellers.length} reseller</p>
        <Button onClick={() => { setAdding(!adding); setEditing(null); }} size="sm" className="bg-primary text-primary-foreground btn-glow rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Tambah Reseller
        </Button>
      </div>

      {adding && <ResellerForm onSave={() => { setAdding(false); refresh(); }} onCancel={() => setAdding(false)} />}

      {/* Balance Modal */}
      {balanceModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setBalanceModal(null)}>
          <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-foreground mb-1">Kelola Saldo</h3>
            <p className="text-muted-foreground text-sm mb-4">{balanceModal.name} — Saldo: Rp {balanceModal.balance.toLocaleString('id-ID')}</p>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setBalanceType('add')} className={cn('flex-1 py-2 rounded-xl border text-sm font-medium transition-all', balanceType === 'add' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted')}>Tambah Saldo</button>
                <button onClick={() => setBalanceType('deduct')} className={cn('flex-1 py-2 rounded-xl border text-sm font-medium transition-all', balanceType === 'deduct' ? 'bg-red-500 text-white border-red-500' : 'border-border text-muted-foreground hover:bg-muted')}>Kurangi Saldo</button>
              </div>
              <Input type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} placeholder="Jumlah (Rp)" className="rounded-xl" />
              <Input value={balanceNote} onChange={e => setBalanceNote(e.target.value)} placeholder="Keterangan" className="rounded-xl" />
              <div className="flex gap-2">
                <Button onClick={handleAdjustBalance} className="flex-1 bg-primary text-primary-foreground btn-glow rounded-xl">Konfirmasi</Button>
                <Button onClick={() => setBalanceModal(null)} variant="outline" className="rounded-xl">Batal</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {resellers.map(r => (
        <div key={r.id}>
          {editing === r.id ? (
            <ResellerForm initial={r} onSave={() => { setEditing(null); refresh(); }} onCancel={() => setEditing(null)} />
          ) : (
            <div className={cn('bg-card border rounded-2xl p-4 group transition-all', r.status === 'active' ? 'border-border' : 'border-red-500/30 bg-red-500/5')}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground text-sm">{r.name}</p>
                    <Badge className={cn('text-xs border', r.status === 'active' ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30')}>
                      {r.status === 'active' ? 'Aktif' : 'Suspend'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">@{r.username} • {r.whatsapp}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-primary hidden sm:block">Rp {r.balance.toLocaleString('id-ID')}</span>
                  <button onClick={() => { setBalanceModal(r); }} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Kelola Saldo">
                    <Wallet className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditing(r.id); setAdding(false); }} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { resellerStore.update(r.id, { status: r.status === 'active' ? 'suspended' : 'active' }); logAction(r.status === 'active' ? 'RESELLER_SUSPEND' : 'RESELLER_ACTIVATE', `${r.status === 'active' ? 'Suspend' : 'Aktifkan'} reseller: ${r.name}`); refresh(); }} className="p-1.5 rounded-lg hover:bg-yellow-500/10 text-muted-foreground hover:text-yellow-600 transition-colors">
                    {r.status === 'active' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { if (confirm(`Hapus reseller ${r.name}?`)) { resellerStore.remove(r.id); refresh(); } }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm font-bold text-primary sm:hidden">Saldo: Rp {r.balance.toLocaleString('id-ID')}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ===== REGISTRATIONS TAB =====
function RegistrationsTab() {
  const [regs, setRegs] = useState<ResellerRegistration[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { setRegs(registrationStore.get()); }, []);
  const refresh = () => setRegs(registrationStore.get());

  const STATUS_CFG = {
    pending: { label: 'Pending', cls: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
    approved: { label: 'Disetujui', cls: 'bg-green-500/10 text-green-600 border-green-500/30' },
    rejected: { label: 'Ditolak', cls: 'bg-red-500/10 text-red-500 border-red-500/30' },
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{regs.filter(r => r.status === 'pending').length} pendaftaran pending</p>
      {regs.map(reg => (
        <div key={reg.id} className="bg-card border border-border rounded-2xl overflow-hidden">
          <button onClick={() => setOpen(open === reg.id ? null : reg.id)} className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left">
            <User className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground text-sm">{reg.name}</p>
                <Badge className={cn('text-xs border', STATUS_CFG[reg.status].cls)}>{STATUS_CFG[reg.status].label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{reg.whatsapp} • {reg.createdAt.split('T')[0]}</p>
            </div>
            {open === reg.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {open === reg.id && (
            <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Email: </span><span className="text-foreground">{reg.email}</span></div>
                <div><span className="text-muted-foreground">WA: </span><span className="text-foreground">{reg.whatsapp}</span></div>
              </div>
              {reg.message && <p className="text-sm text-foreground bg-muted rounded-xl px-3 py-2">{reg.message}</p>}
              {reg.status === 'pending' && (
                <div className="flex gap-2">
                  <Button onClick={() => { registrationStore.update(reg.id, { status: 'approved' }); logAction('REG_APPROVE', `Setujui pendaftaran: ${reg.name}`); refresh(); }} size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Setujui
                  </Button>
                  <Button onClick={() => { registrationStore.update(reg.id, { status: 'rejected' }); logAction('REG_REJECT', `Tolak pendaftaran: ${reg.name}`); refresh(); }} size="sm" variant="outline" className="rounded-xl gap-2 text-red-500 border-red-500/30 hover:bg-red-500/10">
                    <XCircle className="w-4 h-4" /> Tolak
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      {regs.length === 0 && <p className="text-center py-8 text-muted-foreground">Belum ada pendaftaran reseller</p>}
    </div>
  );
}

// ===== DEPOSITS TAB =====
function DepositsTab() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  useEffect(() => { setDeposits(depositStore.get()); }, []);
  const refresh = () => setDeposits(depositStore.get());

  const STATUS_CFG = {
    pending: { label: 'Pending', cls: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', Icon: Clock },
    approved: { label: 'Disetujui', cls: 'bg-green-500/10 text-green-600 border-green-500/30', Icon: CheckCircle2 },
    rejected: { label: 'Ditolak', cls: 'bg-red-500/10 text-red-500 border-red-500/30', Icon: XCircle },
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{deposits.filter(d => d.status === 'pending').length} deposit menunggu konfirmasi</p>
      {deposits.map(dep => {
        const cfg = STATUS_CFG[dep.status];
        const Icon = cfg.Icon;
        return (
          <div key={dep.id} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground text-sm">{dep.resellerName}</p>
                  <Badge className={cn('text-xs border flex items-center gap-1', cfg.cls)}>
                    <Icon className="w-3 h-3" />{cfg.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{dep.method} • {dep.note}</p>
                <p className="text-xs text-muted-foreground">{dep.createdAt}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-bold text-foreground text-sm">Rp {dep.amount.toLocaleString('id-ID')}</span>
                {dep.status === 'pending' && (
                  <div className="flex gap-1">
                    <button onClick={() => { depositStore.approve(dep.id); refresh(); }} className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 transition-colors" title="Setujui">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => { depositStore.reject(dep.id); refresh(); }} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors" title="Tolak">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {deposits.length === 0 && <p className="text-center py-8 text-muted-foreground">Belum ada riwayat deposit</p>}
    </div>
  );
}

// ===== MUTATIONS TAB =====
function MutationsTab() {
  const [mutations, setMutations] = useState<WalletMutation[]>([]);
  const [filterReseller, setFilterReseller] = useState('');
  const resellers = resellerStore.get();
  useEffect(() => { setMutations(walletMutationStore.get()); }, []);

  const filtered = filterReseller ? mutations.filter(m => m.resellerId === filterReseller) : mutations;

  const typeColors: Record<string, string> = {
    deposit: 'text-green-600',
    debit: 'text-red-500',
    transaction: 'text-blue-600',
    refund: 'text-orange-500',
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select value={filterReseller} onChange={e => setFilterReseller(e.target.value)} className="h-9 rounded-xl border border-input bg-background px-3 text-sm flex-1">
          <option value="">Semua Reseller</option>
          {resellers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
      {filtered.map(mut => (
        <div key={mut.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm">{mut.resellerName}</p>
            <p className="text-muted-foreground text-xs">{mut.description}</p>
            <p className="text-muted-foreground text-xs">{mut.createdAt}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={cn('font-bold text-sm', typeColors[mut.type])}>
              {mut.amount > 0 ? '+' : ''}Rp {mut.amount.toLocaleString('id-ID')}
            </p>
            <p className="text-muted-foreground text-xs">→ Rp {mut.balanceAfter.toLocaleString('id-ID')}</p>
          </div>
        </div>
      ))}
      {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Belum ada mutasi wallet</p>}
    </div>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'resellers', label: 'Daftar Reseller' },
  { id: 'registrations', label: 'Pendaftaran' },
  { id: 'deposits', label: 'Deposit' },
  { id: 'mutations', label: 'Mutasi Wallet' },
];

export default function ResellerPanel({ defaultTab = 'resellers' }: { defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  return (
    <div>
      <div className="mb-2">
        <h2 className="text-xl font-bold text-foreground">Manajemen Reseller</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-3 mb-6 border-b border-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn('flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all', tab === t.id ? 'bg-primary text-primary-foreground shadow-green' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'resellers' && <ResellerTab />}
      {tab === 'registrations' && <RegistrationsTab />}
      {tab === 'deposits' && <DepositsTab />}
      {tab === 'mutations' && <MutationsTab />}
    </div>
  );
}
