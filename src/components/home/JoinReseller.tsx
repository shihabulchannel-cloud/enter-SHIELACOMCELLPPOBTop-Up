import { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { siteSettingsStore } from '@/lib/store';
import { subscribeToStore } from '@/lib/events';

const WA_MESSAGE = encodeURIComponent('Halo Admin SHIELACOM CELL, saya ingin mendaftar sebagai reseller.');

const benefits = [
  'Harga lebih murah dari harga normal',
  'Margin keuntungan bebas ditentukan sendiri',
  'Tanpa modal stok produk',
  'Sistem transaksi otomatis 24 jam',
  'Dukungan dan bimbingan dari admin',
  'Akses ke semua kategori produk',
];

export default function JoinReseller() {
  const [settings, setSettings] = useState(siteSettingsStore.get());

  useEffect(() => {
    return subscribeToStore('siteSettings', () => setSettings(siteSettingsStore.get()));
  }, []);

  const waNumber = settings.whatsapp || '6281234567890';
  const waLink = `https://wa.me/${waNumber}?text=${WA_MESSAGE}`;
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Wave Top */}
      <div className="absolute top-0 left-0 right-0 overflow-hidden leading-none rotate-180">
        <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full h-12 md:h-16 fill-background">
          <path d="M0,20 C400,80 800,0 1200,50 L1200,0 L0,0 Z" />
        </svg>
      </div>

      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-primary/10 blur-2xl" />
      </div>

      <div className="relative container mx-auto px-4 pt-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">Program Reseller</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight">
                Gabung Menjadi{' '}
                <span className="text-gradient">Reseller</span>{' '}
                SHIELACOM CELL
              </h2>
              <p className="text-white/60 mb-8 text-sm md:text-base leading-relaxed">
                Bergabunglah dengan ribuan reseller sukses kami. Mulai bisnis digital Anda sekarang dengan modal minimal dan keuntungan maksimal!
              </p>
              <Button
                size="lg"
                className="bg-primary text-white hover:bg-primary-dark btn-glow shadow-green rounded-xl gap-2 font-bold text-base px-8"
                asChild
              >
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-5 h-5" />
                  DAFTAR RESELLER
                </a>
              </Button>
            </div>

            {/* Right - Benefits */}
            <div className="glass-green neon-border rounded-3xl p-6 md:p-8">
              <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </span>
                Keuntungan Reseller
              </h3>
              <div className="space-y-4">
                {benefits.map((benefit, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 group"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-white/80 text-sm group-hover:text-white transition-colors">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Bottom */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
        <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full h-12 md:h-16 fill-background">
          <path d="M0,60 C200,0 800,80 1200,20 L1200,80 L0,80 Z" />
        </svg>
      </div>
    </section>
  );
}
