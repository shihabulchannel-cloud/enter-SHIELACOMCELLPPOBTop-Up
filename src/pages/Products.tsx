import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Loader2, Smartphone, Wifi, Wallet, Gamepad2, Zap, FileText, Tag, Cpu, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import { cn } from '@/lib/utils';
import { getProductsFromDB } from '@/lib/order-api';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  brand: string;
  sell_price: number;
  active: boolean;
}

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pulsa: { label: 'Pulsa', icon: Smartphone, color: 'from-blue-500 to-blue-600' },
  data: { label: 'Paket Data', icon: Wifi, color: 'from-cyan-500 to-cyan-600' },
  ewallet: { label: 'E-Wallet', icon: Wallet, color: 'from-orange-500 to-orange-600' },
  game: { label: 'Top Up Game', icon: Gamepad2, color: 'from-purple-500 to-purple-600' },
  pln: { label: 'PLN / Token Listrik', icon: Zap, color: 'from-yellow-500 to-yellow-600' },
  ppob: { label: 'PPOB / Tagihan', icon: FileText, color: 'from-red-500 to-red-600' },
  voucher: { label: 'Voucher Digital', icon: Tag, color: 'from-pink-500 to-pink-600' },
  token: { label: 'Token PLN', icon: Cpu, color: 'from-amber-500 to-amber-600' },
};

const CATEGORY_ORDER = ['game', 'pulsa', 'data', 'ewallet', 'pln', 'token', 'ppob', 'voucher'];

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProductsFromDB();
      setProducts(data);
    } catch {
      setError('Gagal memuat produk. Silakan refresh halaman.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  // Group by category
  const grouped: Record<string, Product[]> = {};
  products.forEach(p => {
    if (!grouped[p.category_id]) grouped[p.category_id] = [];
    grouped[p.category_id].push(p);
  });

  // Get available categories in order
  const availableCategories = CATEGORY_ORDER.filter(id => grouped[id]?.length);

  // Filter
  const filteredCategories = availableCategories.filter(id => !activeCategory || id === activeCategory);
  const displayGroups = filteredCategories.map(id => ({
    id,
    meta: CATEGORY_META[id] || { label: id, icon: Tag, color: 'from-gray-500 to-gray-600' },
    products: grouped[id].filter(p =>
      !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(g => g.products.length > 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-hero-gradient pt-24 pb-12 md:pt-32 md:pb-16">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">Katalog Produk</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Semua <span className="text-gradient">Produk Digital</span>
            </h1>
            <p className="text-white/60 max-w-lg mx-auto mb-8 text-sm md:text-base">
              Beli langsung tanpa perlu WA — proses otomatis, selesai dalam hitungan menit
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari produk..."
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-primary rounded-xl"
              />
            </div>
          </div>
        </section>

        {/* Category Filter */}
        <section className="bg-background py-4 sticky top-16 lg:top-20 z-30 border-b border-border/50 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn('flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all', !activeCategory ? 'bg-primary text-primary-foreground shadow-green' : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary')}
              >
                Semua
              </button>
              {availableCategories.map(id => {
                const meta = CATEGORY_META[id] || { label: id, icon: Tag };
                const Icon = meta.icon;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveCategory(activeCategory === id ? null : id)}
                    className={cn('flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all', activeCategory === id ? 'bg-primary text-primary-foreground shadow-green' : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary')}
                  >
                    <Icon className="w-4 h-4" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="py-10 bg-background">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Memuat produk...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={loadProducts} variant="outline" className="rounded-xl">
                  <RefreshCw className="w-4 h-4 mr-2" /> Coba Lagi
                </Button>
              </div>
            ) : displayGroups.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Tidak ada produk ditemukan</p>
              </div>
            ) : (
              <div className="space-y-12">
                {displayGroups.map(group => {
                  const Icon = group.meta.icon;
                  // Group products by brand
                  const brands: Record<string, Product[]> = {};
                  group.products.forEach(p => {
                    const b = p.brand || 'Lainnya';
                    if (!brands[b]) brands[b] = [];
                    brands[b].push(p);
                  });
                  return (
                    <div key={group.id}>
                      <div className="flex items-center gap-3 mb-6">
                        <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', group.meta.color)}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">{group.meta.label}</h2>
                        <span className="text-muted-foreground text-sm">({group.products.length} produk)</span>
                      </div>

                      {Object.keys(brands).length > 1 ? (
                        // Show by brand
                        <div className="space-y-8">
                          {Object.entries(brands).map(([brand, prods]) => (
                            <div key={brand}>
                              <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                                <span className="w-1 h-3 rounded-full bg-primary inline-block" />
                                {brand}
                              </p>
                              <ProductGrid products={prods} onBuy={sku => navigate(`/order/${sku}`)} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <ProductGrid products={group.products} onBuy={sku => navigate(`/order/${sku}`)} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

function ProductGrid({ products, onBuy }: { products: Product[]; onBuy: (sku: string) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {products.map(product => (
        <button
          key={product.sku}
          onClick={() => onBuy(product.sku)}
          className="card-hover glass-green neon-border rounded-2xl p-4 cursor-pointer group text-left w-full"
        >
          <p className="font-bold text-foreground text-sm mb-1 group-hover:text-primary transition-colors leading-tight">{product.name}</p>
          <p className="text-muted-foreground text-xs mb-3">{product.brand}</p>
          <p className="text-primary font-bold text-sm">
            {product.sell_price > 0 ? `Rp ${product.sell_price.toLocaleString('id-ID')}` : 'Cek Harga'}
          </p>
          <div className="mt-3 flex items-center gap-1 bg-primary/10 rounded-lg px-2 py-1.5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ShoppingCart className="w-3 h-3 text-primary" />
            <span className="text-primary text-xs font-bold">Beli Sekarang</span>
          </div>
        </button>
      ))}
    </div>
  );
}
