import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, X, Building2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface BankAccount { id: string; bank_name: string; account_number: string; account_name: string; active: boolean; created_at: string; }

export default function BankAccountSettings() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ bank_name: '', account_number: '', account_name: '' });
  const [msg, setMsg] = useState('');

  const loadAccounts = async () => {
    setLoading(true);
    const { data } = await supabase.from('sc_bank_accounts').select('*').order('created_at', { ascending: false });
    setAccounts(data || []);
    setLoading(false);
  };
  useEffect(() => { loadAccounts(); }, []);

  const handleAdd = async () => {
    if (!form.bank_name || !form.account_number || !form.account_name) { setMsg('Semua kolom wajib diisi'); return; }
    await supabase.from('sc_bank_accounts').insert({ ...form, active: true });
    setMsg('Rekening berhasil ditambahkan');
    setAdding(false);
    setForm({ bank_name: '', account_number: '', account_name: '' });
    loadAccounts();
  };

  const handleToggle = async (acc: BankAccount) => {
    await supabase.from('sc_bank_accounts').update({ active: !acc.active }).eq('id', acc.id);
    loadAccounts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus rekening ini?')) return;
    await supabase.from('sc_bank_accounts').delete().eq('id', id);
    loadAccounts();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-foreground flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Rekening Bank Admin</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Rekening tujuan deposit reseller</p>
        </div>
        <Button onClick={() => setAdding(!adding)} size="sm" className="bg-primary text-primary-foreground btn-glow rounded-xl gap-2">
          {adding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {adding ? 'Batal' : 'Tambah Rekening'}
        </Button>
      </div>

      {msg && <div className="bg-primary/10 text-primary text-sm px-4 py-2 rounded-xl">{msg}</div>}

      {adding && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-scale-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: 'bank_name', label: 'Nama Bank', placeholder: 'BCA / BRI / BNI / Mandiri' },
              { key: 'account_number', label: 'Nomor Rekening', placeholder: '1234567890' },
              { key: 'account_name', label: 'Nama Pemilik', placeholder: 'Nama pemilik rekening' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
                <Input value={form[key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="rounded-xl h-9" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-1 btn-glow"><Check className="w-4 h-4" /> Simpan</Button>
            <Button onClick={() => setAdding(false)} size="sm" variant="outline" className="rounded-xl"><X className="w-4 h-4" /> Batal</Button>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-4"><div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div> : (
        accounts.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-border rounded-2xl">
            <Building2 className="w-8 h-8 mx-auto text-muted-foreground opacity-30 mb-2" />
            <p className="text-muted-foreground text-sm">Belum ada rekening. Tambah rekening untuk menerima deposit reseller.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map(acc => (
              <div key={acc.id} className={cn('bg-card border rounded-2xl p-4 flex items-center gap-4', acc.active ? 'border-border' : 'border-border opacity-60')}>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground">{acc.bank_name}</p>
                  <p className="text-lg font-mono text-primary">{acc.account_number}</p>
                  <p className="text-sm text-muted-foreground">a.n. {acc.account_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggle(acc)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all', acc.active ? 'text-green-600 border-green-500/30 bg-green-500/10' : 'text-muted-foreground border-border')}>
                    {acc.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {acc.active ? 'Aktif' : 'Nonaktif'}
                  </button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(acc.id)} className="rounded-xl h-8 px-2.5 text-red-500 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
