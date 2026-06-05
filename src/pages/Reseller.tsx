import JoinReseller from '@/components/home/JoinReseller';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import { CheckCircle2, TrendingUp, Users, Zap } from 'lucide-react';

const stats = [
  { icon: Users, value: '5000+', label: 'Reseller Aktif' },
  { icon: TrendingUp, value: '50jt+', label: 'Omset/Bulan' },
  { icon: Zap, value: '24/7', label: 'Support Reseller' },
];

const tiers = [
  {
    name: 'Reseller Basic',
    price: 'Gratis',
    color: 'from-blue-500 to-blue-600',
    features: ['Harga lebih murah', 'Akses semua produk', 'Support WhatsApp', 'Dashboard transaksi'],
  },
  {
    name: 'Reseller Premium',
    price: 'Hubungi Admin',
    color: 'from-primary to-primary-dark',
    featured: true,
    features: ['Harga spesial terbaik', 'Akses semua produk', 'Priority support', 'Dashboard premium', 'Laporan penjualan', 'Bonus & incentive'],
  },
];

export default function Reseller() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-hero-gradient pt-24 pb-16 md:pt-32 md:pb-20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">Program Reseller</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Jadilah <span className="text-gradient">Reseller</span> Kami
            </h1>
            <p className="text-white/60 max-w-lg mx-auto text-sm md:text-base mb-8">
              Bergabung dengan ribuan reseller sukses yang telah mempercayai SHIELACOM CELL sebagai mitra bisnis digital mereka
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center glass rounded-2xl px-6 py-4">
                    <Icon className="w-6 h-6 text-primary mx-auto mb-1" />
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-white/60 text-xs">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Tiers */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
                Pilih <span className="text-gradient">Paket Reseller</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`rounded-3xl border p-6 md:p-8 ${tier.featured ? 'border-primary/40 shadow-green bg-primary/5' : 'border-border/50 bg-card'}`}
                >
                  {tier.featured && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-4">
                      <Zap className="w-3 h-3" />
                      REKOMENDASI
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4`}>
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">{tier.name}</h3>
                  <p className="text-primary font-bold text-2xl mb-6">{tier.price}</p>
                  <ul className="space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`https://wa.me/6281234567890?text=${encodeURIComponent(`Halo Admin SHIELACOM CELL, saya ingin mendaftar sebagai reseller ${tier.name}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-6 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all btn-glow ${tier.featured ? 'bg-primary text-primary-foreground shadow-green hover:bg-primary-dark' : 'border border-primary text-primary hover:bg-primary/10'}`}
                  >
                    Daftar Sekarang
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <JoinReseller />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
