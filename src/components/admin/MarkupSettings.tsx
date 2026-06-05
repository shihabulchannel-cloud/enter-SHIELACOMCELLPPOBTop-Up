import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Percent, DollarSign, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { markupStore, categoryStore, productStore, type MarkupRule, type Category, type Product, logAction } from '@/lib/store';
import { cn } from '@/lib/utils';

function MarkupForm({
  categories, products, initial, onSave, onCancel
}: {
  categories: Category[];
  products: Product[];
  initial?: Partial<MarkupRule>;
  onSave: (data: Omit<MarkupRule, 'id'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    type: 'category' as MarkupRule['type'],
    targetId: '',
    targetName: '',
    value: 1000,
    isPercentage: false,
    ...initial,
  });

  const targetOptions = form.type === 'category'
    ? categories.map(c => ({ id: c.id, name: c.name }))
    : form.type === 'product'
      ? products.map(p => ({ id: p.id, name: p.name }))
      : [{ id: 'global', name: 'Semua Produk' }];

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-scale-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipe Aturan</label>
          <select value={form.type} onChange={e => {
            const t = e.target.value as MarkupRule['type'];
            setForm(p => ({ ...p, type: t, targetId: '', targetName: t === 'global' ? 'Semua Produk' : '' }));
          }} className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="global">Global</option>
            <option value="category">Per Kategori</option>
            <option value="product">Per Produk</option>
          </select>
        </div>
        {form.type !== 'global' && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Target</label>
            <select value={form.targetId} onChange={e => {
              const opt = targetOptions.find(o => o.id === e.target.value);
              setForm(p => ({ ...p, targetId: e.target.value, targetName: opt?.name || '' }));
            }} className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm">
              <option value="">Pilih...</option>
              {targetOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Nilai Markup</label>
          <Input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: +e.target.value }))} className="rounded-xl h-9" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipe Nilai</label>
          <select value={form.isPercentage ? 'pct' : 'flat'} onChange={e => setForm(p => ({ ...p, isPercentage: e.target.value === 'pct' }))} className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="flat">Nominal (Rp)</option>
            <option value="pct">Persentase (%)</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => {
          const isValid = form.type === 'global' || (form.targetId && form.targetName);
          if (isValid) onSave({ type: form.type, targetId: form.type === 'global' ? 'global' : form.targetId, targetName: form.type === 'global' ? 'Semua Produk' : form.targetName, value: form.value, isPercentage: form.isPercentage });
        }} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-1 btn-glow">
          <Check className="w-4 h-4" /> Simpan
        </Button>
        <Button onClick={onCancel} size="sm" variant="outline" className="rounded-xl gap-1">
          <X className="w-4 h-4" /> Batal
        </Button>
      </div>
    </div>
  );
}

export default function MarkupSettings() {
  const [rules, setRules] = useState<MarkupRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    setRules(markupStore.get());
    setCategories(categoryStore.get());
    setProducts(productStore.get());
  }, []);

  const refresh = () => setRules(markupStore.get());

  const handleAdd = (data: Omit<MarkupRule, 'id'>) => {
    const all = markupStore.get();
    const n = { ...data, id: Date.now().toString() };
    markupStore.set([...all, n]);
    logAction('MARKUP_ADD', `Tambah markup ${data.targetName}: ${data.isPercentage ? data.value + '%' : 'Rp ' + data.value.toLocaleString('id-ID')}`);
    refresh(); setAdding(false);
  };

  const handleEdit = (id: string, data: Omit<MarkupRule, 'id'>) => {
    markupStore.set(markupStore.get().map(r => r.id === id ? { ...data, id } : r));
    logAction('MARKUP_UPDATE', `Update markup ${id}`);
    refresh(); setEditing(null);
  };

  const handleDelete = (id: string) => {
    markupStore.set(markupStore.get().filter(r => r.id !== id));
    logAction('MARKUP_DELETE', `Hapus markup ${id}`);
    refresh();
  };

  const typeColors: Record<MarkupRule['type'], string> = {
    global: 'bg-red-500/10 text-red-600 border-red-500/30',
    category: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    product: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  };
  const typeLabels: Record<MarkupRule['type'], string> = {
    global: 'Global', category: 'Kategori', product: 'Produk',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Markup Harga</h2>
          <p className="text-muted-foreground text-sm">{rules.length} aturan markup aktif</p>
        </div>
        <Button onClick={() => { setAdding(!adding); setEditing(null); }} size="sm" className="bg-primary text-primary-foreground btn-glow rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Tambah Aturan
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Aturan markup diterapkan secara berurutan: <span className="font-medium text-foreground">Produk</span> (prioritas tertinggi) &rarr; <span className="font-medium text-foreground">Kategori</span> &rarr; <span className="font-medium text-foreground">Global</span>. Markup ditambahkan ke harga jual produk.
        </p>
      </div>

      {adding && (
        <div className="mb-4">
          <MarkupForm categories={categories} products={products} onSave={handleAdd} onCancel={() => setAdding(false)} />
        </div>
      )}

      <div className="space-y-2">
        {rules.map(rule => (
          <div key={rule.id}>
            {editing === rule.id ? (
              <MarkupForm initial={rule} categories={categories} products={products} onSave={(data) => handleEdit(rule.id, data)} onCancel={() => setEditing(null)} />
            ) : (
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 group hover:border-primary/30 transition-all">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', rule.isPercentage ? 'bg-blue-500/10' : 'bg-primary/10')}>
                  {rule.isPercentage ? <Percent className="w-4 h-4 text-blue-600" /> : <DollarSign className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground text-sm">{rule.targetName}</p>
                    <Badge className={cn('text-xs border', typeColors[rule.type])}>{typeLabels[rule.type]}</Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Markup: {rule.isPercentage ? `${rule.value}%` : `Rp ${rule.value.toLocaleString('id-ID')}`}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => { setEditing(rule.id); setAdding(false); }} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(rule.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {rules.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Belum ada aturan markup. Tambahkan aturan pertama Anda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
