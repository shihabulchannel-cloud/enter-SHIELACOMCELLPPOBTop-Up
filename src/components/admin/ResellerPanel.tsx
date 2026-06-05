import { useState, useEffect } from 'react';
import { Plus, Check, X, User, Wallet, Pencil, Ban, CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type Tab = 'resellers' | 'deposits' | 'tickets';

interface Reseller { id: string; name: string; username: string; email: string; whatsapp: string; balance: number; markup: number; status: string; created_at: string; }
interface Deposit { id: string; reseller_name: string; amount: number; bank_target: string; status: string; reject_reason: string; created_at: string; proof_image?: string; }
interface Ticket { id: string; reseller_name: string; subject: string; message: string; status: string; admin_reply: string; created_at: string; }

// ===== RESELLERS TAB =====
function ResellersTab() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [balanceModal, setBalanceModal] = useState<Reseller | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceNote, setBalanceNote] = useState('');
  const [balanceType, setBalanceType] = useState<'add' | 'deduct'>('add');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [newForm, setNewForm] = useState({ name: '', username: '', password: '', email: '', whatsapp: '', markup: '0' });

  const loadResellers = async () => {
    setLoading(true);
    const { data } = await supabase.from('sc_resellers').select('*').order('created_at', { ascending: false });
    setResellers(data || []);
    setLoading(false);
  };

  useEffect(() => { loadResellers(); }, []);

  const handleAddReseller = async () => {
    if (!newForm.name || !newForm.username || !newForm.password) { setMsg('Nama, username, dan password wajib diisi'); return; }
    const { data, error } = await supabase.functions.invoke('reseller-auth', { body: { action: 'register', name: newForm.name, username: newForm.username, password: newForm.password, email: newForm.email, whatsapp: newForm.whatsapp } });
    if (error || data?.error) { setMsg(data?.error || error?.message || 'Gagal'); return; }
    // Set markup
    if (+newForm.markup > 0) {
      const { data: created } = await supabase.from('sc_resellers').select('id').eq('username', newForm.username).maybeSingle();
      if (created) await supabase.from('sc_resellers').update({ markup: +newForm.markup }).eq('id', created.id);
    }
    setMsg('Reseller berhasil ditambahkan');
    setAdding(false);
    setNewForm({ name: '', username: '', password: '', email: '', whatsapp: '', markup: '0' });
    loadResellers();
  };

  const handleSuspend = async (r: Reseller) => {
    const newStatus = r.status === 'active' ? 'suspended' : 'active';
    await supabase.from('sc_resellers').update({ status: newStatus }).eq('id', r.id);
    loadResellers();
  };

  const handleMarkupUpdate = async (r: Reseller, markup: string) => {
    await supabase.from('sc_resellers').update({ markup: +markup }).eq('id', r.id);
    setEditId(null);
    loadResellers();
  };

  const handleAdjustBalance = async () => {
    if (!balanceModal || !balanceAmount) return;
    setBalanceLoading(true);
    const { data, error } = await supabase.functions.invoke('reseller-deposit', { body: { action: 'manual_adjust', reseller_id: balanceModal.id, amount: +balanceAmount, type: balanceType, reason: balanceNote } });
    if (error || data?.error) setMsg(data?.error || error?.message || 'Gagal');
    else { setMsg(`Saldo berhasil ${balanceType === 'add' ? 'ditambah' : 'dikurangi'}`); setBalanceModal(null); setBalanceAmount(''); setBalanceNote(''); loadResellers(); }
    setBalanceLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{resellers.filter(r => r.status === 'active').length} aktif dari {resellers.length} reseller</p>
        <Button onClick={() => setAdding(!adding)} size="sm" className="bg-primary text-primary-foreground btn-glow rounded-xl gap-2">
          {adding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {adding ? 'Batal' : 'Tambah Reseller'}
        </Button>
      </div>

      {msg && <div className="bg-primary/10 text-primary text-sm px-4 py-2 rounded-xl">{msg}</div>}

      {adding && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-scale-in">
          <h3 className="font-semibold text-foreground text-sm">Tambah Reseller Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'name', label: 'Nama *', placeholder: 'Nama lengkap' },
              { key: 'username', label: 'Username *', placeholder: 'username' },
              { key: 'password', label: 'Password *', placeholder: 'Min. 6 karakter', type: 'password' },
              { key: 'whatsapp', label: 'WhatsApp', placeholder: '08xxxxxxxxxx' },
              { key: 'email', label: 'Email', placeholder: 'email@contoh.com' },
              { key: 'markup', label: 'Markup (Rp)', placeholder: '0', type: 'number' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
                <Input type={type || 'text'} value={newForm[key as keyof typeof newForm]} onChange={e => setNewForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="rounded-xl h-9" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddReseller} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-1 btn-glow"><Check className="w-4 h-4" /> Simpan</Button>
            <Button onClick={() => setAdding(false)} size="sm" variant="outline" className="rounded-xl"><X className="w-4 h-4" /> Batal</Button>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div> : (
        <div className="space-y-2">
          {resellers.map(r => (
            <div key={r.id} className={cn('bg-card border rounded-2xl p-4 transition-all', r.status === 'suspended' ? 'border-red-500/30 opacity-70' : 'border-border')}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground">{r.name}</p>
                    <span className="text-xs text-muted-foreground">@{r.username}</span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', r.status === 'active' ? 'text-green-600 bg-green-500/10' : 'text-red-500 bg-red-500/10')}>{r.status === 'active' ? 'Aktif' : 'Suspend'}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    <p className="text-xs text-muted-foreground">Saldo: <span className="font-semibold text-primary">Rp {r.balance.toLocaleString('id-ID')}</span></p>
                    <p className="text-xs text-muted-foreground">Markup: Rp {r.markup.toLocaleString('id-ID')}</p>
                    {r.whatsapp && <p className="text-xs text-muted-foreground">WA: {r.whatsapp}</p>}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => { setBalanceModal(r); setBalanceAmount(''); setBalanceNote(''); setBalanceType('add'); }} className="rounded-xl gap-1 h-8 text-xs"><Wallet className="w-3 h-3" /> Saldo</Button>
                  {editId === r.id ? (
                    <EditMarkup reseller={r} onSave={handleMarkupUpdate} onCancel={() => setEditId(null)} />
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setEditId(r.id)} className="rounded-xl gap-1 h-8 text-xs"><Pencil className="w-3 h-3" /> Markup</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleSuspend(r)} className={cn('rounded-xl gap-1 h-8 text-xs', r.status === 'active' ? 'text-red-500 hover:bg-red-500/10' : 'text-green-600 hover:bg-green-500/10')}>
                    {r.status === 'active' ? <><Ban className="w-3 h-3" /> Suspend</> : <><CheckCircle2 className="w-3 h-3" /> Aktifkan</>}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Balance Modal */}
      {balanceModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-foreground">Kelola Saldo: {balanceModal.name}</h3>
            <p className="text-sm text-muted-foreground">Saldo saat ini: <span className="font-bold text-primary">Rp {balanceModal.balance.toLocaleString('id-ID')}</span></p>
            <div className="flex gap-2">
              <button onClick={() => setBalanceType('add')} className={cn('flex-1 py-2 rounded-xl border text-sm font-medium', balanceType === 'add' ? 'bg-green-500 text-white border-green-500' : 'border-border hover:bg-muted')}>Tambah</button>
              <button onClick={() => setBalanceType('deduct')} className={cn('flex-1 py-2 rounded-xl border text-sm font-medium', balanceType === 'deduct' ? 'bg-red-500 text-white border-red-500' : 'border-border hover:bg-muted')}>Kurangi</button>
            </div>
            <Input type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} placeholder="Nominal (Rp)" className="rounded-xl" />
            <Input value={balanceNote} onChange={e => setBalanceNote(e.target.value)} placeholder="Catatan (opsional)" className="rounded-xl" />
            <div className="flex gap-2">
              <Button onClick={handleAdjustBalance} disabled={balanceLoading} className="flex-1 bg-primary text-primary-foreground rounded-xl btn-glow">
                {balanceLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Konfirmasi'}
              </Button>
              <Button variant="outline" onClick={() => setBalanceModal(null)} className="rounded-xl">Batal</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditMarkup({ reseller, onSave, onCancel }: { reseller: Reseller; onSave: (r: Reseller, m: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState(String(reseller.markup));
  return (
    <div className="flex gap-1 items-center">
      <Input type="number" value={val} onChange={e => setVal(e.target.value)} className="rounded-xl h-8 w-24 text-xs" placeholder="Markup" />
      <Button size="sm" onClick={() => onSave(reseller, val)} className="rounded-xl h-8 px-2 bg-primary text-primary-foreground"><Check className="w-3 h-3" /></Button>
      <Button size="sm" variant="outline" onClick={onCancel} className="rounded-xl h-8 px-2"><X className="w-3 h-3" /></Button>
    </div>
  );
}

// ===== DEPOSITS TAB =====
function DepositsTab() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [proofModal, setProofModal] = useState<string | null>(null);

  const loadDeposits = async () => {
    setLoading(true);
    let q = supabase.from('sc_deposits').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setDeposits(data || []);
    setLoading(false);
  };
  useEffect(() => { loadDeposits(); }, [filter]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    await supabase.functions.invoke('reseller-deposit', { body: { action: 'approve', deposit_id: id } });
    setActionLoading(null);
    loadDeposits();
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal);
    await supabase.functions.invoke('reseller-deposit', { body: { action: 'reject', deposit_id: rejectModal, reject_reason: rejectReason || 'Ditolak admin' } });
    setActionLoading(null);
    setRejectModal(null);
    setRejectReason('');
    loadDeposits();
  };

  const STATUS: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: 'Menunggu', color: 'text-yellow-600 bg-yellow-500/10', icon: Clock },
    approved: { label: 'Disetujui', color: 'text-green-600 bg-green-500/10', icon: CheckCircle2 },
    rejected: { label: 'Ditolak', color: 'text-red-500 bg-red-500/10', icon: XCircle },
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {[['pending', 'Menunggu'], ['approved', 'Disetujui'], ['rejected', 'Ditolak'], ['all', 'Semua']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={cn('px-4 py-1.5 rounded-xl text-sm font-medium border transition-all', filter === v ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>{l}</button>
        ))}
      </div>

      {loading ? <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div> : (
        deposits.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">Tidak ada deposit</p> : (
          <div className="space-y-3">
            {deposits.map(d => {
              const s = STATUS[d.status] || STATUS.pending;
              return (
                <div key={d.id} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground">Rp {d.amount.toLocaleString('id-ID')}</p>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1', s.color)}><s.icon className="w-3 h-3" />{s.label}</span>
                      </div>
                      <p className="text-sm text-foreground mt-0.5">{d.reseller_name}</p>
                      <p className="text-xs text-muted-foreground">{d.bank_target}</p>
                      <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      {d.reject_reason && <p className="text-xs text-red-500 mt-0.5">Alasan: {d.reject_reason}</p>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {d.proof_image && (
                        <Button size="sm" variant="outline" onClick={() => setProofModal(d.proof_image!)} className="rounded-xl gap-1 h-8 text-xs"><Eye className="w-3 h-3" /> Bukti</Button>
                      )}
                      {d.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => handleApprove(d.id)} disabled={actionLoading === d.id} className="bg-green-600 text-white rounded-xl gap-1 h-8 text-xs hover:bg-green-700">
                            {actionLoading === d.id ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 className="w-3 h-3" /> Setujui</>}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setRejectModal(d.id); setRejectReason(''); }} className="rounded-xl gap-1 h-8 text-xs text-red-500 hover:bg-red-500/10"><XCircle className="w-3 h-3" /> Tolak</Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-foreground">Tolak Deposit</h3>
            <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Alasan penolakan (opsional)" className="rounded-xl" />
            <div className="flex gap-2">
              <Button onClick={handleReject} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl">Konfirmasi Tolak</Button>
              <Button variant="outline" onClick={() => setRejectModal(null)} className="rounded-xl">Batal</Button>
            </div>
          </div>
        </div>
      )}

      {/* Proof image modal */}
      {proofModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setProofModal(null)}>
          <div className="max-w-lg w-full">
            <img src={proofModal} alt="Bukti transfer" className="w-full rounded-2xl" />
            <p className="text-white/70 text-center text-sm mt-2">Klik di luar untuk menutup</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== TICKETS TAB =====
function TicketsTab() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const loadTickets = async () => {
    setLoading(true);
    const { data } = await supabase.from('sc_support_tickets').select('*').order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };
  useEffect(() => { loadTickets(); }, []);

  const handleReply = async (id: string) => {
    await supabase.from('sc_support_tickets').update({ status: 'replied', admin_reply: replyText, updated_at: new Date().toISOString() }).eq('id', id);
    setReplyId(null);
    setReplyText('');
    loadTickets();
  };

  const handleClose = async (id: string) => {
    await supabase.from('sc_support_tickets').update({ status: 'closed', updated_at: new Date().toISOString() }).eq('id', id);
    loadTickets();
  };

  const STATUS: Record<string, { label: string; color: string }> = {
    open: { label: 'Menunggu', color: 'text-yellow-600 bg-yellow-500/10' },
    replied: { label: 'Dibalas', color: 'text-blue-500 bg-blue-500/10' },
    closed: { label: 'Selesai', color: 'text-green-600 bg-green-500/10' },
  };

  return (
    <div className="space-y-3">
      {loading ? <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div> : (
        tickets.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">Tidak ada tiket</p> : (
          <div className="space-y-3">
            {tickets.map(t => {
              const s = STATUS[t.status] || STATUS.open;
              return (
                <div key={t.id} className="bg-card border border-border rounded-2xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">{t.reseller_name} · {new Date(t.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', s.color)}>{s.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl p-3">{t.message}</p>
                  {t.admin_reply && <div className="bg-primary/5 border border-primary/20 rounded-xl p-3"><p className="text-xs font-semibold text-primary mb-1">Balasan Anda:</p><p className="text-sm text-foreground">{t.admin_reply}</p></div>}
                  {replyId === t.id ? (
                    <div className="space-y-2">
                      <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Tulis balasan..." rows={3} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleReply(t.id)} className="bg-primary text-primary-foreground rounded-xl btn-glow">Kirim Balasan</Button>
                        <Button size="sm" variant="outline" onClick={() => setReplyId(null)} className="rounded-xl">Batal</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setReplyId(t.id); setReplyText(t.admin_reply || ''); }} className="rounded-xl h-8 text-xs">Balas</Button>
                      {t.status !== 'closed' && <Button size="sm" variant="outline" onClick={() => handleClose(t.id)} className="rounded-xl h-8 text-xs text-green-600">Tutup Tiket</Button>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function ResellerPanel() {
  const [tab, setTab] = useState<Tab>('resellers');

  const TABS: { key: Tab; label: string }[] = [
    { key: 'resellers', label: 'Reseller' },
    { key: 'deposits', label: 'Deposit' },
    { key: 'tickets', label: 'Tiket Bantuan' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Manajemen Reseller</h2>
        <p className="text-muted-foreground text-sm">Kelola akun reseller, deposit, dan tiket bantuan</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition-all', tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resellers' && <ResellersTab />}
      {tab === 'deposits' && <DepositsTab />}
      {tab === 'tickets' && <TicketsTab />}
    </div>
  );
}
