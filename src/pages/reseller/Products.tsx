import { useEffect, useState } from 'react';
import { ShoppingCart, Search, CheckCircle2, XCircle, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getResellerSession, updateResellerBalance } from '@/lib/reseller-auth';
import { supabase } from '@/integrations/supabase/client';
import ResellerLayout from './Layout';
import { cn } from '@/lib/utils';

interface Product { id: string; sku: string; name: string; category_id: string; brand: string; buy_price: number; active: boolean; }

const CATEGORY_LABELS: Record<string, string> = { pulsa: 'Pulsa', data: 'Paket Data', game: 'Top Up Game', ewallet: 'E-Wallet', pln: 'PLN / Token', ppob: 'PPOB', };

export default function ResellerProducts() {
  const session = getResellerSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [target, setTarget] = useState('');
  const [targetDetail, setTargetDetail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; sn?: string } | null>(null);

  useEffect(() => {
    supabase.from('sc_products').select('*').eq('active', true).order('category_id').order('brand').order('buy_price').then(({ data }) => setProducts(data || []));
  }, []);

  const markup = session?.markup ?? 0;
  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return (!q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)) && (!filterCat || p.category_id === filterCat);
  });

  const handleBuy = async () => {
    if (!selected || !target.trim()) return;
    setLoading(true);
    setResult(null);
    const { data, error } = await supabase.functions.invoke('reseller-order', { body: { reseller_id: session?.reseller_id, product_sku: selected.sku, target: target.trim(), target_detail: targetDetail.trim() } });
    if (error || data?.error) {
      setResult({ ok: false, msg: data?.error || error?.message || 'Transaksi gagal' });
    } else {
      setResult({ ok: data.order_status !== 'failed', msg: data.order_status === 'success' ? `Berhasil! SN: ${data.sn || '-'}` : data.order_status === 'failed' ? 'Transaksi gagal, saldo dikembalikan' : 'Transaksi sedang diproses', sn: data.sn });
      if (data.new_balance !== undefined) updateResellerBalance(data.new_balance);
    }
    setLoading(false);
  };

  return (
    <ResellerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Beli Produk</h1>
        <p className="text-muted-foreground text-sm">Markup Anda: <span className="text-primary font-semibold">Rp {markup.toLocaleString('id-ID')}/produk</span></p>
      </div>

      {/* Buy form */}
      {selected && (
        <div className="bg-card border border-primary/30 rounded-2xl p-5 mb-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-foreground">{selected.name}</h3>
              <p className="text-muted-foreground text-sm">{selected.brand} · {CATEGORY_LABELS[selected.category_id]}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary text-lg">Rp {(selected.buy_price + markup).toLocaleString('id-ID')}</p>
              {markup > 0 && <p className="text-xs text-muted-foreground">Modal: Rp {selected.buy_price.toLocaleString('id-ID')} + markup Rp {markup.toLocaleString('id-ID')}</p>}
            </div>
          </div>
          <Input value={target} onChange={e => setTarget(e.target.value)} placeholder="Nomor HP / ID Target" className="rounded-xl" />
          {(selected.category_id === 'game') && <Input value={targetDetail} onChange={e => setTargetDetail(e.target.value)} placeholder="Server ID (jika diperlukan)" className="rounded-xl" />}
          {result && (
            <div className={cn('flex items-center gap-2 p-3 rounded-xl text-sm', result.ok ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-600')}>
              {result.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
              {result.msg}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleBuy} disabled={loading || !target.trim()} className="bg-primary text-primary-foreground rounded-xl btn-glow gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
              Beli Sekarang
            </Button>
            <Button variant="outline" onClick={() => { setSelected(null); setResult(null); setTarget(''); }} className="rounded-xl">Batal</Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[150px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk..." className="pl-9 rounded-xl h-9" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="h-9 rounded-xl border border-input bg-background px-3 text-sm">
          <option value="">Semua Kategori</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(p => (
          <button key={p.id} onClick={() => { setSelected(p); setResult(null); setTarget(''); }} className={cn('text-left bg-card border rounded-2xl p-4 hover:border-primary/40 hover:shadow-sm transition-all', selected?.id === p.id ? 'border-primary bg-primary/5' : 'border-border')}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{CATEGORY_LABELS[p.category_id] || p.category_id}</span>
              {markup > 0 && <span className="text-xs text-green-600 flex items-center gap-1"><Tag className="w-3 h-3" />+{markup.toLocaleString()}</span>}
            </div>
            <p className="font-semibold text-foreground text-sm leading-snug">{p.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{p.brand}</p>
            <p className="font-bold text-primary mt-2">Rp {(p.buy_price + markup).toLocaleString('id-ID')}</p>
          </button>
        ))}
      </div>
    </ResellerLayout>
  );
}
