import { useState } from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import { Smartphone, Wifi, Wallet, Gamepad2, Zap, FileText, Tag, Cpu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import { cn } from '@/lib/utils';

const WA_NUMBER = '6281234567890';

const categories = [
  {
    id: 'pulsa',
    icon: Smartphone,
    label: 'Pulsa',
    color: 'from-blue-500 to-blue-600',
    products: [
      { name: 'Pulsa 5.000', price: 6000, desc: 'Semua operator' },
      { name: 'Pulsa 10.000', price: 11000, desc: 'Semua operator' },
      { name: 'Pulsa 20.000', price: 21000, desc: 'Semua operator' },
      { name: 'Pulsa 25.000', price: 26000, desc: 'Semua operator' },
      { name: 'Pulsa 50.000', price: 51000, desc: 'Semua operator' },
      { name: 'Pulsa 100.000', price: 101000, desc: 'Semua operator' },
    ],
  },
  {
    id: 'data',
    icon: Wifi,
    label: 'Paket Data',
    color: 'from-cyan-500 to-cyan-600',
    products: [
      { name: 'Paket 1GB/7 Hari', price: 15000, desc: 'Telkomsel' },
      { name: 'Paket 5GB/30 Hari', price: 35000, desc: 'XL Axiata' },
      { name: 'Paket 10GB/30 Hari', price: 65000, desc: 'Indosat' },
      { name: 'Paket 15GB/30 Hari', price: 85000, desc: 'Tri' },
      { name: 'Paket 20GB/30 Hari', price: 110000, desc: 'Smartfren' },
      { name: 'Paket Unlimited', price: 150000, desc: 'Semua operator' },
    ],
  },
  {
    id: 'ewallet',
    icon: Wallet,
    label: 'E-Wallet',
    color: 'from-orange-500 to-orange-600',
    products: [
      { name: 'GoPay 20.000', price: 21000, desc: 'Gojek' },
      { name: 'GoPay 50.000', price: 51500, desc: 'Gojek' },
      { name: 'OVO 50.000', price: 51500, desc: 'OVO' },
      { name: 'DANA 50.000', price: 51500, desc: 'DANA' },
      { name: 'ShopeePay 50.000', price: 51500, desc: 'Shopee' },
      { name: 'LinkAja 50.000', price: 51500, desc: 'LinkAja' },
    ],
  },
  {
    id: 'game',
    icon: Gamepad2,
    label: 'Top Up Game',
    color: 'from-purple-500 to-purple-600',
    products: [
      { name: 'ML 86 Diamonds', price: 20000, desc: 'Mobile Legends' },
      { name: 'ML 172 Diamonds', price: 40000, desc: 'Mobile Legends' },
      { name: 'FF 70 Diamonds', price: 16000, desc: 'Free Fire' },
      { name: 'FF 140 Diamonds', price: 30000, desc: 'Free Fire' },
      { name: 'PUBG 60 UC', price: 18000, desc: 'PUBG Mobile' },
      { name: 'Genshin 60 Primogems', price: 15000, desc: 'Genshin Impact' },
    ],
  },
  {
    id: 'pln',
    icon: Zap,
    label: 'PLN',
    color: 'from-yellow-500 to-yellow-600',
    products: [
      { name: 'Token PLN 20.000', price: 22000, desc: 'Listrik prabayar' },
      { name: 'Token PLN 50.000', price: 52000, desc: 'Listrik prabayar' },
      { name: 'Token PLN 100.000', price: 103000, desc: 'Listrik prabayar' },
      { name: 'Tagihan PLN', price: 0, desc: 'Bayar tagihan pascabayar' },
    ],
  },
  {
    id: 'ppob',
    icon: FileText,
    label: 'PPOB',
    color: 'from-red-500 to-red-600',
    products: [
      { name: 'BPJS Kesehatan', price: 0, desc: 'Iuran bulanan' },
      { name: 'PDAM', price: 0, desc: 'Tagihan air' },
      { name: 'Telkom/IndiHome', price: 0, desc: 'Tagihan internet' },
      { name: 'Cicilan Kredit', price: 0, desc: 'Multifinance' },
      { name: 'Pajak PBB', price: 0, desc: 'Pajak bumi bangunan' },
      { name: 'BPJS TK', price: 0, desc: 'Ketenagakerjaan' },
    ],
  },
  {
    id: 'voucher',
    icon: Tag,
    label: 'Voucher Digital',
    color: 'from-pink-500 to-pink-600',
    products: [
      { name: 'Netflix 1 Bulan', price: 54000, desc: '1 screen' },
      { name: 'Spotify Premium', price: 49000, desc: '1 bulan' },
      { name: 'YouTube Premium', price: 49000, desc: '1 bulan' },
      { name: 'Disney+ Hotstar', price: 49000, desc: '1 bulan' },
      { name: 'Capcut Pro', price: 89000, desc: '1 bulan' },
      { name: 'Canva Pro', price: 99000, desc: '1 bulan' },
    ],
  },
  {
    id: 'token',
    icon: Cpu,
    label: 'Token PLN',
    color: 'from-amber-500 to-amber-600',
    products: [
      { name: 'Token PLN 10.000', price: 11500, desc: 'Semua golongan' },
      { name: 'Token PLN 20.000', price: 21500, desc: 'Semua golongan' },
      { name: 'Token PLN 50.000', price: 52000, desc: 'Semua golongan' },
      { name: 'Token PLN 100.000', price: 103000, desc: 'Semua golongan' },
      { name: 'Token PLN 200.000', price: 205000, desc: 'Semua golongan' },
    ],
  },
];

export default function Products() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = categories.filter(cat =>
    !activeCategory || cat.id === activeCategory
  ).map(cat => ({
    ...cat,
    products: cat.products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.desc.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.products.length > 0);

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
              500+ produk digital tersedia dengan harga terbaik dan proses instan
            </p>
            {/* Search */}
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
        <section className="bg-background py-6 sticky top-16 lg:top-20 z-30 border-b border-border/50 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                  !activeCategory ? 'bg-primary text-primary-foreground shadow-green' : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                )}
              >
                Semua
              </button>
              {categories.map(cat => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                    className={cn(
                      'flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                      activeCategory === cat.id ? 'bg-primary text-primary-foreground shadow-green' : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4 space-y-12">
            {filtered.map(cat => {
              const Icon = cat.icon;
              return (
                <div key={cat.id}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', cat.color)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">{cat.label}</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {cat.products.map((product, i) => (
                      <div
                        key={i}
                        className="card-hover glass-green neon-border rounded-2xl p-4 cursor-pointer group"
                        onClick={() => {
                          const msg = `Halo Admin SHIELACOM CELL, saya ingin membeli ${product.name}`;
                          window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                      >
                        <p className="font-bold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">{product.name}</p>
                        <p className="text-muted-foreground text-xs mb-3">{product.desc}</p>
                        {product.price > 0 ? (
                          <p className="text-primary font-bold text-sm">Rp {product.price.toLocaleString('id-ID')}</p>
                        ) : (
                          <p className="text-primary font-bold text-sm">Cek Harga</p>
                        )}
                        <Button size="sm" className="w-full mt-3 bg-primary text-primary-foreground text-xs rounded-lg btn-glow shadow-green h-8 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ShoppingCart className="w-3 h-3" />
                          Beli
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
