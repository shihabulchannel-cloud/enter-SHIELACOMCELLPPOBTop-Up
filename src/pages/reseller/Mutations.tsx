import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from 'lucide-react';
import { getResellerSession } from '@/lib/reseller-auth';
import { supabase } from '@/integrations/supabase/client';
import ResellerLayout from './Layout';
import { cn } from '@/lib/utils';

interface Mutation { id: string; type: string; amount: number; balance_before: number; balance_after: number; description: string; ref_id: string; created_at: string; }

const TYPE_CONFIG: Record<string, { label: string; icon: typeof ArrowUpRight; color: string; sign: string }> = {
  deposit: { label: 'Deposit', icon: ArrowDownLeft, color: 'text-green-600 bg-green-500/10', sign: '+' },
  transaction: { label: 'Pembelian', icon: ArrowUpRight, color: 'text-red-500 bg-red-500/10', sign: '-' },
  refund: { label: 'Refund', icon: ArrowDownLeft, color: 'text-blue-500 bg-blue-500/10', sign: '+' },
  manual_add: { label: 'Tambah Admin', icon: ArrowDownLeft, color: 'text-green-600 bg-green-500/10', sign: '+' },
  manual_deduct: { label: 'Kurang Admin', icon: ArrowUpRight, color: 'text-orange-500 bg-orange-500/10', sign: '-' },
};

export default function ResellerMutations() {
  const session = getResellerSession();
  const [mutations, setMutations] = useState<Mutation[]>([]);

  useEffect(() => {
    if (!session) return;
    supabase.from('sc_wallet_mutations').select('*').eq('reseller_id', session.reseller_id).order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => setMutations(data || []));
  }, [session?.reseller_id]);

  return (
    <ResellerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mutasi Saldo</h1>
        <p className="text-muted-foreground text-sm">{mutations.length} mutasi tercatat</p>
      </div>

      {mutations.length === 0 ? (
        <div className="text-center py-16"><ArrowLeftRight className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" /><p className="text-muted-foreground">Belum ada mutasi saldo</p></div>
      ) : (
        <div className="space-y-3">
          {mutations.map(m => {
            const c = TYPE_CONFIG[m.type] || { label: m.type, icon: ArrowLeftRight, color: 'text-muted-foreground bg-muted', sign: '' };
            const isCredit = ['deposit', 'refund', 'manual_add'].includes(m.type);
            return (
              <div key={m.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', c.color)}>
                  <c.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{c.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={cn('font-bold', isCredit ? 'text-green-600' : 'text-red-500')}>{c.sign}Rp {m.amount.toLocaleString('id-ID')}</p>
                  <p className="text-xs text-muted-foreground">Sisa: Rp {m.balance_after.toLocaleString('id-ID')}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ResellerLayout>
  );
}
