import { useState, useEffect } from 'react';
import { Search, Loader2, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import ProductGrid from '@/components/products/ProductGrid';
import { CATEGORIES, setCategoryMeta } from '@/lib/product-slugs';
import { getProductsFromDB } from '@/lib/order-api';
import { getCmsTopCategories, type CmsCategory } from '@/lib/cms-api';
import { cn } from '@/lib/utils';
import type { ProductItem } from '@/components/products/ProductCard';

export default function Products() {
  const navigate = useNavigate();
  const [search,    setSearch]    = useState('');
  const [results,   setResults]   = useState<ProductItem[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [searched,  setSearched]  = useState(false);
  const [cmsTopCats, setCmsTopCats] = useState<CmsCategory[]>([]);

  // Page SEO
  useEffect(() => { setCategoryMeta(null, null); }, []);

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

        {/* Category Grid */}
        {!search.trim() && (
          <section className="py-12 bg-background">
            <div className="container mx-auto px-4">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Pilih Kategori</h2>
                <p className="text-muted-foreground text-sm">Klik kategori untuk melihat semua produk dan harga</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {CATEGORIES.map(cat => {
                  const Icon    = cat.icon;
                  const cmsCat  = cmsTopCats.find(c => c.slug === cat.slug);
                  const hasCmsThumb = !!cmsCat?.thumbnail_url;
                  return (
                    <Link
                      key={cat.id}
                      to={`/products/${cat.slug}`}
                      className="group card-hover rounded-2xl border border-border bg-card text-center flex flex-col items-center gap-3 hover:border-primary/40 transition-all overflow-hidden"
                    >
                      {/* Thumbnail area */}
                      {hasCmsThumb ? (
                        <div className="w-full aspect-video overflow-hidden">
                          <img
                            src={cmsCat!.thumbnail_url}
                            alt={cat.label}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className={cn(
                          'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 mt-5',
                          cat.gradient,
                        )}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                      )}
                      <div className={cn('pb-4', hasCmsThumb ? 'px-3' : 'px-5')}>
                        <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                          {cat.label}
                        </p>
                        <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2 leading-relaxed">
                          {cat.description.split('.')[0]}
                        </p>
                        <div className="flex items-center justify-center gap-1 text-primary text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                          Lihat Produk <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
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
