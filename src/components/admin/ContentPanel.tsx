import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Star, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  testimonialStore, articleStore, faqStore,
  type Testimonial, type Article, type FAQItem
} from '@/lib/store';
import { readFileAsDataUrl, triggerFileInput } from '@/lib/image-upload';
import { cn } from '@/lib/utils';

type Tab = 'testimonials' | 'articles' | 'faqs';

// ===== TESTIMONIALS =====
function TestimonialsPanel() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const empty = (): Omit<Testimonial, 'id'> => ({
    name: '', role: '', message: '', photoDataUrl: '', rating: 5, active: true, createdAt: new Date().toLocaleDateString()
  });

  useEffect(() => { setItems(testimonialStore.get()); }, []);
  const refresh = () => setItems(testimonialStore.get());

  function TestForm({ initial, onSave, onCancel }: { initial?: Partial<Testimonial>; onSave: (d: Omit<Testimonial, 'id'>) => void; onCancel: () => void }) {
    const [form, setForm] = useState({ ...empty(), ...initial });
    const f = (k: keyof typeof form) => (v: string | number | boolean) => setForm(p => ({ ...p, [k]: v }));

    const handleImgUpload = () => {
      triggerFileInput(async (file) => {
        const dataUrl = await readFileAsDataUrl(file);
        setForm(p => ({ ...p, photoDataUrl: dataUrl }));
      });
    };

    return (
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-scale-in">
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer" onClick={handleImgUpload}>
            {form.photoDataUrl ? <img src={form.photoDataUrl} alt="" className="w-full h-full object-cover" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div><label className="text-xs font-medium text-muted-foreground mb-0.5 block">Nama *</label><Input value={form.name} onChange={e => f('name')(e.target.value)} className="rounded-xl h-9" /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-0.5 block">Jabatan/Role</label><Input value={form.role} onChange={e => f('role')(e.target.value)} placeholder="Reseller Aktif" className="rounded-xl h-9" /></div>
          </div>
        </div>
        <div><label className="text-xs font-medium text-muted-foreground mb-0.5 block">Pesan</label>
          <textarea value={form.message} onChange={e => f('message')(e.target.value)} rows={2} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => f('rating')(s)} className={cn('text-lg', form.rating >= s ? 'text-yellow-400' : 'text-muted-foreground/30')}>★</button>
            ))}
          </div>
          <select value={form.active ? 'active' : 'inactive'} onChange={e => f('active')(e.target.value === 'active')} className="h-9 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="active">Aktif</option><option value="inactive">Nonaktif</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { if (form.name) onSave(form); }} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-1 btn-glow"><Check className="w-4 h-4" /> Simpan</Button>
          <Button onClick={onCancel} size="sm" variant="outline" className="rounded-xl gap-1"><X className="w-4 h-4" /> Batal</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} testimoni</p>
        <Button onClick={() => { setAdding(!adding); setEditing(null); }} size="sm" className="bg-primary text-primary-foreground btn-glow rounded-xl gap-2"><Plus className="w-4 h-4" /> Tambah</Button>
      </div>
      {adding && <TestForm onSave={(d) => { testimonialStore.add(d); refresh(); setAdding(false); }} onCancel={() => setAdding(false)} />}
      {items.map(item => (
        <div key={item.id}>
          {editing === item.id ? (
            <TestForm initial={item} onSave={(d) => { testimonialStore.update(item.id, d); refresh(); setEditing(null); }} onCancel={() => setEditing(null)} />
          ) : (
            <div className={cn('bg-card border rounded-2xl p-4 group', item.active ? 'border-border' : 'border-border/30 opacity-60')}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {item.photoDataUrl ? <img src={item.photoDataUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="font-semibold text-foreground text-sm">{item.name}</p><span className="text-muted-foreground text-xs">{item.role}</span></div>
                  <div className="flex gap-0.5 my-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={cn('w-3 h-3', item.rating >= s ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30')} />)}</div>
                  <p className="text-muted-foreground text-xs line-clamp-2">{item.message}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => { setEditing(item.id); setAdding(false); }} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm('Hapus?')) { testimonialStore.remove(item.id); refresh(); } }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ===== ARTICLES =====
function ArticlesPanel() {
  const [items, setItems] = useState<Article[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const empty = (): Omit<Article, 'id'> => ({ title: '', content: '', thumbnailDataUrl: '', category: 'Tips & Trik', status: 'draft', createdAt: new Date().toLocaleDateString() });
  useEffect(() => { setItems(articleStore.get()); }, []);
  const refresh = () => setItems(articleStore.get());

  function ArticleForm({ initial, onSave, onCancel }: { initial?: Partial<Article>; onSave: (d: Omit<Article, 'id'>) => void; onCancel: () => void }) {
    const [form, setForm] = useState({ ...empty(), ...initial });
    const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

    const handleThumbUpload = () => {
      triggerFileInput(async (file) => {
        const dataUrl = await readFileAsDataUrl(file);
        setForm(p => ({ ...p, thumbnailDataUrl: dataUrl }));
      });
    };

    return (
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-scale-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><label className="text-xs font-medium text-muted-foreground mb-0.5 block">Judul Artikel *</label><Input value={form.title} onChange={e => f('title')(e.target.value)} className="rounded-xl" /></div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-0.5 block">Thumbnail</label>
            <div className="flex items-center gap-2">
              {form.thumbnailDataUrl && <img src={form.thumbnailDataUrl} alt="" className="w-16 h-10 object-cover rounded-lg border border-border" />}
              <Button onClick={handleThumbUpload} size="sm" variant="outline" className="rounded-xl gap-1"><Upload className="w-3 h-3" /> Upload</Button>
            </div>
          </div>
          <div><label className="text-xs font-medium text-muted-foreground mb-0.5 block">Kategori</label><Input value={form.category} onChange={e => f('category')(e.target.value)} placeholder="Tips & Trik" className="rounded-xl" /></div>
          <div><label className="text-xs font-medium text-muted-foreground mb-0.5 block">Status</label>
            <select value={form.status} onChange={e => f('status')(e.target.value)} className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm">
              <option value="draft">Draft</option><option value="published">Published</option>
            </select>
          </div>
          <div className="sm:col-span-2"><label className="text-xs font-medium text-muted-foreground mb-0.5 block">Konten</label>
            <textarea value={form.content} onChange={e => f('content')(e.target.value)} rows={4} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { if (form.title) onSave(form); }} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-1 btn-glow"><Check className="w-4 h-4" /> Simpan</Button>
          <Button onClick={onCancel} size="sm" variant="outline" className="rounded-xl gap-1"><X className="w-4 h-4" /> Batal</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} artikel</p>
        <Button onClick={() => { setAdding(!adding); setEditing(null); }} size="sm" className="bg-primary text-primary-foreground btn-glow rounded-xl gap-2"><Plus className="w-4 h-4" /> Tambah Artikel</Button>
      </div>
      {adding && <ArticleForm onSave={(d) => { articleStore.add(d); refresh(); setAdding(false); }} onCancel={() => setAdding(false)} />}
      {items.map(item => (
        <div key={item.id}>
          {editing === item.id ? (
            <ArticleForm initial={item} onSave={(d) => { articleStore.update(item.id, d); refresh(); setEditing(null); }} onCancel={() => setEditing(null)} />
          ) : (
            <div className="bg-card border border-border rounded-2xl p-4 group hover:border-primary/20 transition-all">
              <div className="flex items-start gap-3">
                <div className="w-16 h-12 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {item.thumbnailDataUrl ? <img src={item.thumbnailDataUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm line-clamp-1">{item.title}</p>
                  <p className="text-muted-foreground text-xs">{item.category} • {item.status === 'published' ? <span className="text-green-600">Published</span> : <span className="text-yellow-600">Draft</span>}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => { setEditing(item.id); setAdding(false); }} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm('Hapus artikel?')) { articleStore.remove(item.id); refresh(); } }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ===== FAQS =====
function FaqsPanel() {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => { setItems(faqStore.get()); }, []);
  const refresh = () => setItems(faqStore.get());

  function FaqForm({ initial, onSave, onCancel }: { initial?: Partial<FAQItem>; onSave: (q: string, a: string) => void; onCancel: () => void }) {
    const [q, setQ] = useState(initial?.question || '');
    const [a, setA] = useState(initial?.answer || '');
    return (
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-scale-in">
        <div><label className="text-xs font-medium text-muted-foreground mb-0.5 block">Pertanyaan *</label><Input value={q} onChange={e => setQ(e.target.value)} placeholder="Ketik pertanyaan..." className="rounded-xl" /></div>
        <div><label className="text-xs font-medium text-muted-foreground mb-0.5 block">Jawaban *</label>
          <textarea value={a} onChange={e => setA(e.target.value)} rows={3} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Ketik jawaban..." />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { if (q && a) onSave(q, a); }} size="sm" className="bg-primary text-primary-foreground rounded-xl gap-1 btn-glow"><Check className="w-4 h-4" /> Simpan</Button>
          <Button onClick={onCancel} size="sm" variant="outline" className="rounded-xl gap-1"><X className="w-4 h-4" /> Batal</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} FAQ</p>
        <Button onClick={() => { setAdding(!adding); setEditing(null); }} size="sm" className="bg-primary text-primary-foreground btn-glow rounded-xl gap-2"><Plus className="w-4 h-4" /> Tambah FAQ</Button>
      </div>
      {adding && <FaqForm onSave={(q, a) => { faqStore.add({ question: q, answer: a }); refresh(); setAdding(false); }} onCancel={() => setAdding(false)} />}
      {items.map((item, i) => (
        <div key={item.id}>
          {editing === item.id ? (
            <FaqForm initial={item} onSave={(q, a) => { faqStore.update(item.id, { question: q, answer: a }); refresh(); setEditing(null); }} onCancel={() => setEditing(null)} />
          ) : (
            <div className="bg-card border border-border rounded-2xl p-4 group hover:border-primary/20 transition-all">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{item.question}</p>
                  <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{item.answer}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => { setEditing(item.id); setAdding(false); }} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm('Hapus FAQ ini?')) { faqStore.remove(item.id); refresh(); } }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'testimonials', label: 'Testimoni' },
  { id: 'articles', label: 'Artikel/Blog' },
  { id: 'faqs', label: 'FAQ' },
];

export default function ContentPanel({ defaultTab = 'testimonials' }: { defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  return (
    <div>
      <div className="mb-2">
        <h2 className="text-xl font-bold text-foreground">Konten Website</h2>
        <p className="text-muted-foreground text-sm">Kelola testimoni, artikel, dan FAQ yang tampil di website</p>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-3 mb-6 border-b border-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn('flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all', tab === t.id ? 'bg-primary text-primary-foreground shadow-green' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'testimonials' && <TestimonialsPanel />}
      {tab === 'articles' && <ArticlesPanel />}
      {tab === 'faqs' && <FaqsPanel />}
    </div>
  );
}
