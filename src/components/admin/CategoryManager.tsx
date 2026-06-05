import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { categoryStore, type Category } from '@/lib/store';
import { cn } from '@/lib/utils';

const ICON_OPTIONS = ['Smartphone', 'Wifi', 'Wallet', 'Gamepad2', 'Zap', 'FileText', 'Tag', 'Cpu', 'CreditCard', 'ShoppingBag'];
const COLOR_OPTIONS = [
  { label: 'Biru', value: 'from-blue-500 to-blue-600' },
  { label: 'Cyan', value: 'from-cyan-500 to-cyan-600' },
  { label: 'Oranye', value: 'from-orange-500 to-orange-600' },
  { label: 'Ungu', value: 'from-purple-500 to-purple-600' },
  { label: 'Kuning', value: 'from-yellow-500 to-yellow-600' },
  { label: 'Merah', value: 'from-red-500 to-red-600' },
  { label: 'Pink', value: 'from-pink-500 to-pink-600' },
  { label: 'Amber', value: 'from-amber-500 to-amber-600' },
  { label: 'Hijau', value: 'from-green-500 to-green-600' },
  { label: 'Teal', value: 'from-teal-500 to-teal-600' },
];

function CategoryForm({
  initial, onSave, onCancel,
}: {
  initial?: Partial<Category>;
  onSave: (data: Omit<Category, 'id'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: '', icon: 'Tag', color: 'from-blue-500 to-blue-600', active: true,
    ...initial,
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-scale-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Nama Kategori *</label>
          <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Contoh: Pulsa" className="rounded-xl" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Icon</label>
          <select value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
            {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Warna</label>
          <select value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
            {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
          <select value={form.active ? 'active' : 'inactive'} onChange={e => setForm(p => ({ ...p, active: e.target.value === 'active' }))} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>
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

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => { setCategories(categoryStore.get()); }, []);
  const refresh = () => setCategories(categoryStore.get());

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Kategori Produk</h2>
          <p className="text-sm text-muted-foreground">{categories.length} kategori tersedia</p>
        </div>
        <Button onClick={() => { setAdding(!adding); setEditing(null); }} size="sm" className="bg-primary text-primary-foreground btn-glow rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Tambah Kategori
        </Button>
      </div>

      {adding && (
        <div className="mb-4">
          <CategoryForm onSave={(data) => { categoryStore.add(data); refresh(); setAdding(false); }} onCancel={() => setAdding(false)} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map(cat => (
          <div key={cat.id}>
            {editing === cat.id ? (
              <CategoryForm
                initial={cat}
                onSave={(data) => { categoryStore.update(cat.id, data); refresh(); setEditing(null); }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div className={cn('bg-card border rounded-2xl p-4 flex items-center gap-3 group transition-all', cat.active ? 'border-border' : 'border-border/30 opacity-60')}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center flex-shrink-0`}>
                  <Tag className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{cat.name}</p>
                  <p className="text-muted-foreground text-xs">{cat.icon} • {cat.active ? 'Aktif' : 'Nonaktif'}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(cat.id); setAdding(false); }} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { categoryStore.update(cat.id, { active: !cat.active }); refresh(); }} className={cn('p-1.5 rounded-lg transition-colors text-muted-foreground', cat.active ? 'hover:bg-red-500/10 hover:text-red-500' : 'hover:bg-green-500/10 hover:text-green-500')}>
                    {cat.active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { if (confirm('Hapus kategori?')) { categoryStore.remove(cat.id); refresh(); } }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
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
