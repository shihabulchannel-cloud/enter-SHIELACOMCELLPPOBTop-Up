import { useEffect, useRef, useState } from 'react';
import { Search, Hash, CreditCard, Loader2, CheckCircle2, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { icon: ShoppingBag, title: 'Pilih Produk', desc: 'Pilih kategori dan produk yang ingin dibeli dari katalog lengkap kami', step: '01' },
  { icon: Hash, title: 'Masukkan Nomor Tujuan', desc: 'Masukkan nomor HP, ID Game, atau nomor tujuan dengan benar', step: '02' },
  { icon: Search, title: 'Pilih Nominal', desc: 'Pilih nominal atau paket yang sesuai dengan kebutuhan Anda', step: '03' },
  { icon: CreditCard, title: 'Bayar', desc: 'Lakukan pembayaran via transfer bank, e-wallet, atau metode lainnya', step: '04' },
  { icon: Loader2, title: 'Sistem Memproses', desc: 'Sistem kami akan memproses transaksi secara otomatis dan real-time', step: '05' },
  { icon: CheckCircle2, title: 'Transaksi Berhasil', desc: 'Produk langsung dikirim ke tujuan dan notifikasi sukses diterima', step: '06' },
];

export default function HowToTransact() {
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
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Wave Top */}
      <div className="absolute top-0 left-0 right-0 overflow-hidden leading-none rotate-180">
        <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full h-12 md:h-16 fill-background">
          <path d="M0,0 C300,80 900,0 1200,60 L1200,0 L0,0 Z" />
        </svg>
      </div>

      <div className="absolute inset-0 bg-hero-gradient" />

      <div className="relative container mx-auto px-4 pt-8" ref={ref}>
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">Panduan Transaksi</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
            Cara <span className="text-gradient">Transaksi</span>
          </h2>
          <p className="text-white/60 max-w-lg mx-auto text-sm md:text-base">
            Proses transaksi mudah dan cepat dalam 6 langkah sederhana
          </p>
        </div>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Center line - desktop */}
          <div className="hidden md:block absolute left-1/2 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary/60 via-primary to-primary/60 -translate-x-1/2" />

          <div className="space-y-6 md:space-y-0">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isLeft = i % 2 === 0;
              return (
                <div
                  key={i}
                  className={cn(
                    'relative flex items-start md:items-center gap-4 md:gap-0 opacity-0',
                    active && (isLeft ? 'animate-fade-left' : 'animate-fade-right'),
                    'md:flex-row'
                  )}
                  style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'forwards' }}
                >
                  {/* Left side (desktop) */}
                  <div className={cn('hidden md:flex md:w-1/2 md:pr-8', isLeft ? 'justify-end' : 'justify-start md:order-3 md:pl-8 md:pr-0')}>
                    {isLeft && (
                      <div className="glass-green neon-border rounded-2xl p-5 max-w-xs text-right">
                        <div className="text-primary/40 text-4xl font-black mb-1">{step.step}</div>
                        <h3 className="font-bold text-white text-base mb-2">{step.title}</h3>
                        <p className="text-white/60 text-sm">{step.desc}</p>
                      </div>
                    )}
                  </div>

                  {/* Center Icon */}
                  <div className="flex-shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2 z-10">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary shadow-green flex items-center justify-center">
                      <Icon className={cn('w-6 h-6 text-white', step.icon === Loader2 && active && 'animate-spin')} />
                    </div>
                  </div>

                  {/* Right side (desktop) / Content (mobile) */}
                  <div className={cn('flex-1 md:w-1/2', isLeft ? 'md:pl-8 md:order-3' : 'md:pr-8 md:order-1 md:text-right')}>
                    {/* Mobile */}
                    <div className="md:hidden glass-green neon-border rounded-2xl p-4">
                      <div className="text-primary/40 text-2xl font-black mb-1">{step.step}</div>
                      <h3 className="font-bold text-white text-sm mb-1">{step.title}</h3>
                      <p className="text-white/60 text-xs">{step.desc}</p>
                    </div>
                    {/* Desktop right side */}
                    {!isLeft && (
                      <div className="hidden md:block glass-green neon-border rounded-2xl p-5 max-w-xs">
                        <div className="text-primary/40 text-4xl font-black mb-1">{step.step}</div>
                        <h3 className="font-bold text-white text-base mb-2">{step.title}</h3>
                        <p className="text-white/60 text-sm">{step.desc}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Wave Bottom */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
        <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full h-12 md:h-16 fill-background">
          <path d="M0,40 C300,0 900,80 1200,20 L1200,80 L0,80 Z" />
        </svg>
      </div>
    </section>
  );
}
