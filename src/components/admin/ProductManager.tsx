import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Upload, Image as ImageIcon, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { productStore, categoryStore, markupStore, type Product, type Category } from '@/lib/store';
import { readFileAsDataUrl, triggerFileInput } from '@/lib/image-upload';
import { cn } from '@/lib/utils';

function getMarkupForProduct(product: Product): number {
  const rules = markupStore.get();
  const productRule = rules.find(r => r.type === 'product' && r.targetId === product.id);
  if (productRule) return productRule.isPercentage ? Math.round(product.buyPrice * productRule.value / 100) : productRule.value;
  const catRule = rules.find(r => r.type === 'category' && r.targetId === product.categoryId);
  if (catRule) return catRule.isPercentage ? Math.round(product.buyPrice * catRule.value / 100) : catRule.value;
  const globalRule = rules.find(r => r.type === 'global');
  if (globalRule) return globalRule.isPercentage ? Math.round(product.buyPrice * globalRule.value / 100) : globalRule.value;
  return 0;
}

function ProductForm({
  initial, categories, onSave, onCancel
}: {
  initial?: Partial<Product>;
  categories: Category[];
  onSave: (data: Omit<Product, 'id'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<Product, 'id'>>({
    name: '', photoDataUrl: '', categoryId: categories[0]?.id || '', provider: 'digiflazz',
    providerCode: '', brand: '', buyPrice: 0, sellPrice: 0, active: true,
    createdAt: new Date().toLocaleDateString(),
    ...initial,
  });
  const [imgError, setImgError] = useState('');
  const f = (k: keyof typeof form) => (v: string | number | boolean) => setForm(p => ({ ...p, [k]: v }));

  const handleImgUpload = () => {
    triggerFileInput(async (file) => {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        setForm(p => ({ ...p, photoDataUrl: dataUrl }));
        setImgError('');
      } catch (e: unknown) {
        setImgError(e instanceof Error ? e.message : 'Upload gagal');
      }
    });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4 animate-scale-in">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer" onClick={handleImgUpload}>
          {form.photoDataUrl ? (
            <img src={form.photoDataUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <Upload className="w-6 h-6 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground mt-1">Upload</p>
            </div>
          )}
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nama Produk *</label>
            <Input value={form.name} onChange={e => f('name')(e.target.value)} placeholder="Nama produk" className="rounded-xl h-9" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Kategori</label>
            <select value={form.categoryId} onChange={e => f('categoryId')(e.target.value)} className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Provider</label>
            <select value={form.provider} onChange={e => f('provider')(e.target.value)} className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm">
              <option value="digiflazz">Digiflazz</option>
              <option value="vip">VIP Reseller</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Brand</label>
            <Input value={form.brand} onChange={e => f('brand')(e.target.value)} placeholder="Telkomsel, MLBB..." className="rounded-xl h-9" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Harga Modal</label>
            <Input type="number" value={form.buyPrice} onChange={e => f('buyPrice')(+e.target.value)} className="rounded-xl h-9" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Harga Jual</label>
            <Input type="number" value={form.sellPrice} onChange={e => f('sellPrice')(+e.target.value)} className="rounded-xl h-9" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Kode Provider</label>
            <Input value={form.providerCode} onChange={e => f('providerCode')(e.target.value)} placeholder="TSEL10" className="rounded-xl h-9" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
            <select value={form.active ? 'active' : 'inactive'} onChange={e => f('active')(e.target.value === 'active')} className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm">
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>
      {imgError && <p className="text-red-500 text-xs">{imgError}</p>}
      <div className="flex gap-2">
        <Button onClick={() => { if (form.name) onSave(form); }} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-1 btn-glow">
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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');

  useEffect(() => {
    setProducts(productStore.get());
    setCategories(categoryStore.get());
  }, []);

  const refresh = () => setProducts(productStore.get());

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || id;

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || p.categoryId === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Daftar Produk</h2>
          <p className="text-sm text-muted-foreground">{products.filter(p => p.active).length} aktif dari {products.length} produk</p>
        </div>
        <Button onClick={() => { setAdding(!adding); setEditing(null); }} size="sm" className="bg-primary text-primary-foreground btn-glow rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Tambah Produk
        </Button>
      </div>

      {adding && (
        <div className="mb-4">
          <ProductForm categories={categories} onSave={(data) => { productStore.add(data); refresh(); setAdding(false); }} onCancel={() => setAdding(false)} />
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
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map(product => (
          <div key={product.id}>
            {editing === product.id ? (
              <ProductForm
                initial={product}
                categories={categories}
                onSave={(data) => { productStore.update(product.id, data); refresh(); setEditing(null); }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div className={cn('bg-card border rounded-2xl p-3 flex items-center gap-3 group transition-all', product.active ? 'border-border' : 'border-border/30 opacity-60')}>
                <div className="w-10 h-10 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {product.photoDataUrl ? <img src={product.photoDataUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground text-sm truncate">{product.name}</p>
                    <Badge className="text-xs bg-muted text-muted-foreground border-border">{getCategoryName(product.categoryId)}</Badge>
                    {!product.active && <Badge className="text-xs bg-red-500/10 text-red-500 border-red-500/30">Nonaktif</Badge>}
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground">Modal: Rp {product.buyPrice.toLocaleString('id-ID')}</span>
                    <span className="text-xs text-primary font-medium">Jual: Rp {product.sellPrice.toLocaleString('id-ID')}</span>
                    <span className="text-xs text-emerald-600 font-medium">
                      Profit: Rp {(product.sellPrice - product.buyPrice + getMarkupForProduct(product)).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => { setEditing(product.id); setAdding(false); }} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { productStore.update(product.id, { active: !product.active }); refresh(); }} className={cn('p-1.5 rounded-lg transition-colors text-muted-foreground', product.active ? 'hover:bg-red-500/10 hover:text-red-500' : 'hover:bg-green-500/10 hover:text-green-500')}>
                    {product.active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { if (confirm('Hapus produk ini?')) { productStore.remove(product.id); refresh(); } }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Tidak ada produk ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
