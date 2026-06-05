import { useEffect, useState } from 'react';
import { ArrowDownToLine, Upload, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getResellerSession } from '@/lib/reseller-auth';
import { supabase } from '@/integrations/supabase/client';
import ResellerLayout from './Layout';
import { cn } from '@/lib/utils';

interface BankAccount { id: string; bank_name: string; account_number: string; account_name: string; }
interface Deposit { id: string; amount: number; bank_target: string; status: string; reject_reason: string; created_at: string; }

export default function ResellerDeposit() {
  const session = getResellerSession();
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [proof, setProof] = useState<string>('');
  const [proofName, setProofName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadData = async () => {
    const { data: b } = await supabase.from('sc_bank_accounts').select('*').eq('active', true);
    const { data: d } = await supabase.from('sc_deposits').select('*').eq('reseller_id', session?.reseller_id).order('created_at', { ascending: false }).limit(20);
    setBanks(b || []);
    setDeposits(d || []);
    if (b && b.length > 0 && !selectedBank) setSelectedBank(`${b[0].bank_name} - ${b[0].account_number} (${b[0].account_name})`);
  };

  useEffect(() => { loadData(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert('Ukuran file maksimal 3MB'); return; }
    setProofName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setProof(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || +amount < 10000) { setResult({ ok: false, msg: 'Minimal deposit Rp10.000' }); return; }
    if (!proof) { setResult({ ok: false, msg: 'Upload bukti transfer terlebih dahulu' }); return; }
    setLoading(true);
    setResult(null);
    const { data, error } = await supabase.functions.invoke('reseller-deposit', { body: { action: 'submit', reseller_id: session?.reseller_id, amount: +amount, bank_target: selectedBank, proof_image: proof } });
    if (error || data?.error) setResult({ ok: false, msg: data?.error || error?.message || 'Gagal submit deposit' });
    else { setResult({ ok: true, msg: 'Deposit berhasil dikirim! Menunggu verifikasi admin.' }); setAmount(''); setProof(''); setProofName(''); loadData(); }
    setLoading(false);
  };

  const STATUS: Record<string, { label: string; icon: typeof Clock; color: string }> = {
    pending: { label: 'Menunggu', icon: Clock, color: 'text-yellow-600 bg-yellow-500/10' },
    approved: { label: 'Disetujui', icon: CheckCircle2, color: 'text-green-600 bg-green-500/10' },
    rejected: { label: 'Ditolak', icon: XCircle, color: 'text-red-500 bg-red-500/10' },
  };

  return (
    <ResellerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Top Up Saldo</h1>
        <p className="text-muted-foreground text-sm">Isi saldo reseller Anda untuk mulai bertransaksi</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-bold text-foreground flex items-center gap-2"><ArrowDownToLine className="w-4 h-4 text-primary" /> Form Top Up</h2>

          {banks.length === 0 ? (
            <div className="bg-yellow-500/10 rounded-xl p-4 text-sm text-yellow-700">Tidak ada rekening aktif. Hubungi admin.</div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Rekening Tujuan</p>
                {banks.map(bank => (
                  <button key={bank.id} onClick={() => setSelectedBank(`${bank.bank_name} - ${bank.account_number} (${bank.account_name})`)}
                    className={cn('w-full text-left p-4 rounded-xl border mb-2 transition-all', selectedBank.includes(bank.account_number) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30')}>
                    <p className="font-bold text-foreground">{bank.bank_name}</p>
                    <p className="text-lg font-mono text-primary">{bank.account_number}</p>
                    <p className="text-sm text-muted-foreground">a.n. {bank.account_name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Nominal Deposit (Rp)</label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Minimal 10.000" min="10000" className="rounded-xl" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Bukti Transfer</label>
              <label className="flex items-center gap-3 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 transition-all">
                <Upload className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{proofName || 'Klik untuk upload foto bukti transfer (max 3MB)'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
              {proof && <img src={proof} alt="preview" className="mt-2 rounded-xl max-h-48 w-full object-contain bg-muted" />}
            </div>

            {result && (
              <div className={cn('flex items-start gap-2 p-3 rounded-xl text-sm', result.ok ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-600')}>
                {result.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                {result.msg}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground rounded-xl btn-glow h-11 font-semibold gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ArrowDownToLine className="w-4 h-4" /> Kirim Bukti Transfer</>}
            </Button>
          </form>
        </div>

        {/* History */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-4">Riwayat Deposit</h2>
          {deposits.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">Belum ada riwayat deposit</p> : (
            <div className="space-y-3">
              {deposits.map(d => {
                const s = STATUS[d.status] || STATUS.pending;
                return (
                  <div key={d.id} className="p-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-foreground">Rp {d.amount.toLocaleString('id-ID')}</p>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1', s.color)}><s.icon className="w-3 h-3" />{s.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{d.bank_target} · {new Date(d.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    {d.status === 'rejected' && d.reject_reason && <p className="text-xs text-red-500 mt-1">Alasan: {d.reject_reason}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ResellerLayout>
  );
}
