import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Check, X, Search, RefreshCw, Database, ToggleLeft, ToggleRight, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface DbProduct {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  brand: string;
  buy_price: number;
  sell_price: number;
  price_mode: string;   // 'auto' | 'manual'
  active: boolean;
  provider: string;
  provider_code: string;
  created_at: string;
  updated_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  pulsa: 'Pulsa', data: 'Paket Data', game: 'Top Up Game',
  ewallet: 'E-Wallet', pln: 'PLN / Token', ppob: 'PPOB / Tagihan', voucher: 'Voucher',
};

function ProductRow({ product, onEdit, onToggle, onDelete, onResetToAuto }: {
  product: DbProduct;
  onEdit: (p: DbProduct) => void;
  onToggle: (p: DbProduct) => void;
  onDelete: (p: DbProduct) => void;
  onResetToAuto: (p: DbProduct) => void;
}) {
  const isManual = product.price_mode === 'manual';

  return (
    <div className={cn(
      'bg-card border rounded-2xl p-3 flex items-center gap-3 group transition-all',
      product.active ? 'border-border' : 'border-border/30 opacity-60',
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-foreground text-sm truncate">{product.name}</p>
          <Badge className="text-xs bg-muted text-muted-foreground border-border">
            {CATEGORY_LABELS[product.category_id] || product.category_id}
          </Badge>
          <Badge className="text-xs bg-muted text-muted-foreground border-border">
            {product.brand || '-'}
          </Badge>
          {isManual && (
            <Badge className="text-xs bg-amber-500/10 text-amber-600 border border-amber-500/30 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              Harga Manual
            </Badge>
          )}
          {!product.active && (
            <Badge className="text-xs bg-red-500/10 text-red-500 border-red-500/30">Nonaktif</Badge>
          )}
        </div>
        <div className="flex gap-3 mt-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
          <span className="text-xs text-muted-foreground">Modal: Rp {product.buy_price.toLocaleString('id-ID')}</span>
          <span className="text-xs text-primary font-medium">Jual: Rp {product.sell_price.toLocaleString('id-ID')}</span>
          <span className="text-xs text-emerald-600 font-medium">
            Profit: Rp {(product.sell_price - product.buy_price).toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {/* Tombol Reset ke Auto — hanya muncul jika sedang mode manual */}
        {isManual && (
          <button
            onClick={() => onResetToAuto(product)}
            className="p-1.5 rounded-lg hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600 transition-colors"
            title="Reset harga ke Auto (akan dihitung ulang saat sync)"
          >
            <Unlock className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onEdit(product)}
          className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
          title="Edit produk (harga jual akan dikunci ke mode Manual)"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onToggle(product)}
          className={cn(
            'p-1.5 rounded-lg transition-colors text-muted-foreground',
            product.active
              ? 'hover:bg-red-500/10 hover:text-red-500'
              : 'hover:bg-green-500/10 hover:text-green-500',
          )}
          title={product.active ? 'Nonaktifkan' : 'Aktifkan'}
        >
          {product.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
        </button>
        <button
          onClick={() => onDelete(product)}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Hapus"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ProductForm({ initial, onSave, onCancel }: {
  initial?: Partial<DbProduct>;
  onSave: (data: Partial<DbProduct>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name:          initial?.name          || '',
    sku:           initial?.sku           || '',
    category_id:   initial?.category_id   || 'pulsa',
    brand:         initial?.brand         || '',
    buy_price:     initial?.buy_price     || 0,
    sell_price:    initial?.sell_price    || 0,
    provider_code: initial?.provider_code || '',
    active:        initial?.active        !== false,
  });
  const f = (k: keyof typeof form) => (v: string | number | boolean) =>
    setForm(p => ({ ...p, [k]: v }));

  const isEditing = !!initial?.id;

  return (
    <div className="bg-card border border-primary/30 rounded-2xl p-5 space-y-4 mb-4">
      <div>
        <h3 className="font-semibold text-foreground text-sm">
          {isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}
        </h3>
        {isEditing && (
          <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Setelah disimpan, harga jual akan dikunci ke mode <strong>Manual</strong> dan tidak akan diubah saat Sinkron Digiflazz.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Nama Produk *</label>
          <Input value={form.name} onChange={e => f('name')(e.target.value)} placeholder="Nama produk" className="rounded-xl h-9" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">SKU *</label>
          <Input value={form.sku} onChange={e => f('sku')(e.target.value)} placeholder="TSEL10" className="rounded-xl h-9" disabled={isEditing} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Kategori</label>
          <select value={form.category_id} onChange={e => f('category_id')(e.target.value)} className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm">
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Brand</label>
          <Input value={form.brand} onChange={e => f('brand')(e.target.value)} placeholder="Telkomsel, MLBB..." className="rounded-xl h-9" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Harga Modal (Rp)</label>
          <Input type="number" value={form.buy_price} onChange={e => f('buy_price')(+e.target.value)} className="rounded-xl h-9" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Harga Jual (Rp)
            {isEditing && <span className="text-amber-600 ml-1">(akan dikunci Manual)</span>}
          </label>
          <Input type="number" value={form.sell_price} onChange={e => f('sell_price')(+e.target.value)} className="rounded-xl h-9" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Kode Provider</label>
          <Input value={form.provider_code} onChange={e => f('provider_code')(e.target.value)} placeholder="TSEL10" className="rounded-xl h-9" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
          <select value={form.active ? 'active' : 'inactive'} onChange={e => f('active')(e.target.value === 'active')} className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => { if (form.name && form.sku) onSave(form); }}
          size="sm"
          className="bg-primary text-primary-foreground rounded-xl gap-1 btn-glow"
        >
          <Check className="w-4 h-4" /> Simpan
        </Button>
        <Button onClick={onCancel} size="sm" variant="outline" className="rounded-xl gap-1">
          <X className="w-4 h-4" /> Batal
        </Button>
      </div>
    </div>
  );
}

export default function ProductManager() {
  const [products,     setProducts]     = useState<DbProduct[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [adding,       setAdding]       = useState(false);
  const [editing,      setEditing]      = useState<DbProduct | null>(null);
  const [search,       setSearch]       = useState('');
  const [filterCat,    setFilterCat]    = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sc_products')
      .select('*')
      .order('category_id')
      .order('brand')
      .order('sell_price');
    setProducts((data || []) as DbProduct[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  /* ── Simpan perubahan produk ── */
  const handleSave = async (form: Partial<DbProduct>) => {
    if (editing) {
      // Edit produk yang sudah ada → kunci ke mode MANUAL
      await supabase
        .from('sc_products')
        .update({
          ...form,
          price_mode: 'manual',          // ← Kunci harga manual
          updated_at: new Date().toISOString(),
        })
        .eq('id', editing.id);
      setEditing(null);
    } else {
      // Tambah produk baru secara manual → langsung MANUAL
      await supabase
        .from('sc_products')
        .insert({
          ...form,
          provider:   'manual',
          price_mode: 'manual',          // ← Produk manual selalu dikunci
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      setAdding(false);
    }
    loadProducts();
  };

  /* ── Reset harga ke AUTO ── */
  const handleResetToAuto = async (p: DbProduct) => {
    if (!confirm(`Reset harga "${p.name}" ke mode AUTO?\n\nHarga jual akan dihitung ulang oleh sistem saat Sinkron Digiflazz berikutnya.`)) return;
    await supabase
      .from('sc_products')
      .update({ price_mode: 'auto', updated_at: new Date().toISOString() })
      .eq('id', p.id);
    loadProducts();
  };

  /* ── Aktifkan / Nonaktifkan ── */
  const handleToggle = async (p: DbProduct) => {
    await supabase
      .from('sc_products')
      .update({ active: !p.active, updated_at: new Date().toISOString() })
      .eq('id', p.id);
    loadProducts();
  };

  /* ── Hapus ── */
  const handleDelete = async (p: DbProduct) => {
    if (!confirm(`Hapus produk "${p.name}"?`)) return;
    await supabase.from('sc_products').delete().eq('id', p.id);
    loadProducts();
  };

  const filtered = products.filter(p => {
    const matchSearch  = !search      || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat     = !filterCat   || p.category_id === filterCat;
    const matchStatus  = !filterStatus || (filterStatus === 'active' ? p.active : !p.active);
    return matchSearch && matchCat && matchStatus;
  });

  const activeCount = products.filter(p => p.active).length;
  const manualCount = products.filter(p => p.price_mode === 'manual').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Daftar Produk</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            {activeCount} aktif dari {products.length} produk
            {manualCount > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-600">
                &bull; <Lock className="w-3 h-3" /> {manualCount} harga dikunci manual
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadProducts} size="sm" variant="outline" className="rounded-xl gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button
            onClick={() => { setAdding(!adding); setEditing(null); }}
            size="sm"
            className="bg-primary text-primary-foreground btn-glow rounded-xl gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah
          </Button>
        </div>
      </div>

      {adding  && <ProductForm onSave={handleSave} onCancel={() => setAdding(false)} />}
      {editing && <ProductForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[150px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama/SKU/brand..."
            className="pl-9 rounded-xl h-9"
          />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="h-9 rounded-xl border border-input bg-background px-3 text-sm">
          <option value="">Semua Kategori</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-9 rounded-xl border border-input bg-background px-3 text-sm">
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Memuat produk dari database...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(product => (
            <ProductRow
              key={product.id}
              product={product}
              onEdit={setEditing}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onResetToAuto={handleResetToAuto}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>
                {products.length === 0
                  ? 'Belum ada produk. Sync dari Digiflazz di menu Provider.'
                  : 'Tidak ada produk yang cocok dengan filter.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
