import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import ProductGrid from '@/components/products/ProductGrid';
import { CATEGORIES, setCategoryMeta } from '@/lib/product-slugs';
import { categoryStore, type Category } from '@/lib/store';
import { getProductsFromDB } from '@/lib/order-api';
import { getCmsTopCategories, type CmsCategory } from '@/lib/cms-api';
import { cn } from '@/lib/utils';
import type { ProductItem } from '@/components/products/ProductCard';

export default function Products() {
  const navigate = useNavigate();
  const [search,      setSearch]      = useState('');
  const [results,     setResults]     = useState<ProductItem[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [searched,    setSearched]    = useState(false);
  const [cmsTopCats,  setCmsTopCats]  = useState<CmsCategory[]>([]);
  const [customCats,  setCustomCats]  = useState<Category[]>([]);

  // Page SEO
  useEffect(() => { setCategoryMeta(null, null); }, []);

  // Load custom categories from admin's CategoryManager (localStorage)
  useEffect(() => {
    const builtinIds = new Set(CATEGORIES.map(c => c.id));
    const all = categoryStore.get().filter(c => c.active && !builtinIds.has(c.id));
    setCustomCats(all);
  }, []);

  // Fetch CMS top-level category thumbnails
  useEffect(() => {
    getCmsTopCategories()
      .then(data => setCmsTopCats(data.filter(c => c.is_active)))
      .catch(() => {});
  }, []);

  // Debounced live search across all categories
  useEffect(() => {
    if (!search.trim()) { setResults([]); setSearched(false); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await getProductsFromDB();
        const q    = search.toLowerCase();
        setResults(
          (data as ProductItem[]).filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q),
          ),
        );
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="bg-hero-gradient pt-24 pb-14 md:pt-32 md:pb-20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">Katalog Produk</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Semua <span className="text-gradient">Produk Digital</span>
            </h1>
            <p className="text-white/60 max-w-lg mx-auto mb-8 text-sm md:text-base">
              Pulsa, paket data, top up game, e-wallet, token listrik &amp; tagihan — proses otomatis, selesai dalam hitungan menit.
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari produk semua kategori..."
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-primary rounded-xl"
              />
            </div>
          </div>
        </section>

        {/* Search Results */}
        {(search.trim() || loading) && (
          <section className="py-8 bg-background border-b border-border">
            <div className="container mx-auto px-4">
              {loading ? (
                <div className="flex items-center gap-2 py-8 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-muted-foreground text-sm">Mencari produk...</span>
                </div>
              ) : searched ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    {results.length > 0
                      ? `Ditemukan ${results.length} produk untuk "${search}"`
                      : `Tidak ada produk untuk "${search}"`}
                  </p>
                  <ProductGrid products={results} emptyMessage={`Tidak ada produk untuk "${search}".`} />
                </>
              ) : null}
            </div>
          </section>
        )}

        {/* Category Grid — Arena Gamers style */}
        {!search.trim() && (
          <section className="py-12 bg-background">
            <div className="container mx-auto px-4">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Pilih Kategori</h2>
                <p className="text-muted-foreground text-sm">Klik kategori untuk melihat semua produk dan harga</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {CATEGORIES.map(cat => {
                  const Icon       = cat.icon;
                  const cmsCat     = cmsTopCats.find(c => c.slug === cat.slug);
                  const thumbUrl   = cmsCat?.thumbnail_url;
                  return (
                    <Link
                      key={cat.id}
                      to={`/products/${cat.slug}`}
                      className="group relative block overflow-hidden rounded-2xl aspect-square shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                    >
                      {/* Cover: CMS image or gradient fallback */}
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={cat.label}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className={cn('absolute inset-0 bg-gradient-to-br', cat.gradient)}>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Icon className="w-16 h-16 text-white/20" />
                          </div>
                        </div>
                      )}

                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                      {/* Text content */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-white font-bold text-sm leading-tight drop-shadow-sm">
                          {cat.label}
                        </h3>
                        <p className="mt-0.5 text-white/65 text-xs line-clamp-1">
                          {cat.description.split('.')[0]}
                        </p>
                      </div>

                      {/* Subtle shine on hover */}
                      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/5" />
                    </Link>
                  );
                })}

                {/* Custom categories created by admin */}
                {customCats.map(cat => (
                  <Link
                    key={cat.id}
                    to={`/products/${cat.id}`}
                    className="group relative block overflow-hidden rounded-2xl aspect-square shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className={cn('absolute inset-0 bg-gradient-to-br', cat.color)}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Search className="w-16 h-16 text-white/20" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-white font-bold text-sm leading-tight drop-shadow-sm">
                        {cat.name}
                      </h3>
                    </div>
                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/5" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        {!search.trim() && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                Tidak menemukan produk yang dicari?
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Hubungi kami via WhatsApp, kami siap membantu 24 jam.
              </p>
              <Button
                onClick={() => navigate('/kontak')}
                variant="outline"
                className="rounded-xl gap-2 border-primary/40 text-primary hover:bg-primary/10"
              >
                Hubungi Kami
              </Button>
            </div>
          </section>
        )}

      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
