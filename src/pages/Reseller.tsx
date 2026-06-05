import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import { CheckCircle2, TrendingUp, Users, Zap, Wallet, ShoppingCart, LifeBuoy, ArrowDownToLine, Shield, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const stats = [
  { icon: Users, value: '5000+', label: 'Reseller Aktif' },
  { icon: TrendingUp, value: '50jt+', label: 'Omset/Bulan' },
  { icon: Zap, value: '24/7', label: 'Support Reseller' },
];

const BENEFITS = [
  { icon: ShoppingCart, title: 'Harga Lebih Murah', desc: 'Dapatkan harga beli lebih hemat dari harga umum untuk semua produk kami.' },
  { icon: Wallet, title: 'Atur Markup Sendiri', desc: 'Bebas tentukan keuntungan Anda sendiri sesuai dengan target pasar.' },
  { icon: Shield, title: 'Saldo Digital', desc: 'Isi saldo sekali, gunakan untuk transaksi ratusan jenis produk kapan saja.' },
  { icon: ArrowDownToLine, title: 'Top Up Mudah', desc: 'Isi saldo via transfer bank, konfirmasi otomatis setelah admin verifikasi.' },
  { icon: BarChart2, title: 'Laporan Lengkap', desc: 'Pantau semua transaksi, mutasi saldo, dan riwayat deposit di satu dashboard.' },
  { icon: LifeBuoy, title: 'Support Responsif', desc: 'Tim admin kami siap membantu via tiket bantuan atau WhatsApp.' },
];

const FEATURES = [
  'Akses semua produk (Pulsa, Data, Game, E-Wallet, PLN, PPOB)',
  'Dashboard reseller lengkap',
  'Sistem saldo digital (e-wallet reseller)',
  'Beli produk langsung dari dashboard',
  'Riwayat transaksi & mutasi saldo',
  'Pengaturan markup keuntungan sendiri',
  'Top up saldo via transfer bank',
  'Laporan harian/bulanan',
  'Tiket bantuan & support admin',
  'Pendaftaran gratis, tanpa biaya apapun',
  'Proses transaksi otomatis via Digiflazz',
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
              <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">Program Reseller — Gratis!</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Jadilah <span className="text-gradient">Reseller</span> Kami
            </h1>
            <p className="text-white/60 max-w-lg mx-auto text-sm md:text-base mb-8">
              Daftar gratis, isi saldo, dan mulai jual produk digital dengan harga lebih murah. Atur sendiri keuntungan Anda.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <Link to="/reseller/register">
                <Button className="bg-primary text-primary-foreground btn-glow rounded-xl px-8 h-12 font-semibold gap-2">
                  <Users className="w-4 h-4" /> Daftar Gratis Sekarang
                </Button>
              </Link>
              <Link to="/reseller/login">
                <Button variant="outline" className="rounded-xl px-8 h-12 font-semibold border-white/20 text-white hover:bg-white/10">
                  Login Reseller
                </Button>
              </Link>
            </div>
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

        {/* Single tier info */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
                Satu <span className="text-gradient">Paket Reseller</span>, Semua Fitur
              </h2>
              <p className="text-muted-foreground">Tidak ada tier, tidak ada biaya bulanan. Daftar gratis dan nikmati semua fitur.</p>
            </div>

            <div className="bg-card border border-primary/30 rounded-3xl p-6 md:p-10 shadow-green max-w-2xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-1"><Zap className="w-3 h-3" /> RESELLER</div>
                  <p className="text-3xl font-bold text-foreground">Gratis</p>
                  <p className="text-muted-foreground text-sm">Tanpa biaya pendaftaran, tanpa iuran bulanan</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
                {FEATURES.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    {f}
                  </div>
                ))}
              </div>
              <Link to="/reseller/register">
                <Button className="w-full bg-primary text-primary-foreground btn-glow rounded-xl h-12 font-semibold gap-2">
                  <Users className="w-4 h-4" /> Daftar Reseller Gratis
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Kenapa Bergabung?</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {BENEFITS.map((b) => (
                <div key={b.title} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-sm transition-all">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <b.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Siap Mulai Berjualan?</h2>
            <p className="text-muted-foreground mb-6">Daftar sekarang, isi saldo, dan mulai transaksi dalam hitungan menit.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/reseller/register"><Button className="bg-primary text-primary-foreground btn-glow rounded-xl px-8 h-11 font-semibold gap-2"><Users className="w-4 h-4" /> Daftar Sekarang</Button></Link>
              <Link to="/reseller/login"><Button variant="outline" className="rounded-xl px-8 h-11 font-semibold">Login Reseller</Button></Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
