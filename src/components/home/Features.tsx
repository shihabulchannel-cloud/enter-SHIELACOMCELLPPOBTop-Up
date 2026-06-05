import { useEffect, useRef, useState } from 'react';
import { Zap, DollarSign, Shield, Headphones, Clock, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  { icon: Zap, title: 'Transaksi Instan', desc: 'Proses otomatis real-time, transaksi selesai dalam hitungan detik', color: 'from-yellow-500 to-amber-600' },
  { icon: DollarSign, title: 'Harga Murah', desc: 'Harga terbaik dan kompetitif untuk semua jenis produk digital', color: 'from-green-500 to-emerald-600' },
  { icon: Shield, title: 'Aman & Terpercaya', desc: 'Sistem keamanan berlapis, transaksi Anda selalu terlindungi', color: 'from-blue-500 to-indigo-600' },
  { icon: Headphones, title: 'Customer Service', desc: 'Tim support siap membantu 24 jam setiap hari', color: 'from-purple-500 to-violet-600' },
  { icon: Clock, title: 'Online 24 Jam', desc: 'Layanan tersedia kapanpun Anda butuhkan, tanpa terkecuali', color: 'from-pink-500 to-rose-600' },
  { icon: Smartphone, title: 'Mobile Friendly', desc: 'Tampilan optimal di semua perangkat, mudah digunakan semua kalangan', color: 'from-teal-500 to-cyan-600' },
];

export default function Features() {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative py-16 md:py-24 bg-background overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4" ref={ref}>
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-xs font-semibold uppercase tracking-wider">Keunggulan</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
            Kenapa Pilih <span className="text-gradient">SHIELACOM CELL</span>?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">
            Kami hadir dengan solusi digital terlengkap dan pelayanan terbaik untuk kepuasan Anda
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className={cn(
                  'card-hover rounded-2xl p-6 border border-border/50 bg-card group opacity-0',
                  active && 'animate-fade-up'
                )}
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}
              >
                <div className={cn(
                  'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300',
                  feature.color
                )}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-foreground text-base md:text-lg mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                {/* Hover line */}
                <div className="h-0.5 w-0 bg-primary mt-4 group-hover:w-full transition-all duration-300 rounded-full" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
