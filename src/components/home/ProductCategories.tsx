import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Wifi, Wallet, Gamepad2, Zap, FileText, Tag, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  { icon: Smartphone, label: 'Pulsa', desc: 'Semua Operator', color: 'from-blue-500 to-blue-600' },
  { icon: Wifi, label: 'Paket Data', desc: 'Internet Murah', color: 'from-cyan-500 to-cyan-600' },
  { icon: Wallet, label: 'E-Wallet', desc: 'GoPay, OVO, DANA', color: 'from-orange-500 to-orange-600' },
  { icon: Gamepad2, label: 'Top Up Game', desc: '200+ Game', color: 'from-purple-500 to-purple-600' },
  { icon: Zap, label: 'PLN', desc: 'Token & Tagihan', color: 'from-yellow-500 to-yellow-600' },
  { icon: FileText, label: 'PPOB', desc: 'Bayar Tagihan', color: 'from-red-500 to-red-600' },
  { icon: Tag, label: 'Voucher Digital', desc: 'Netflix, Spotify', color: 'from-pink-500 to-pink-600' },
  { icon: Cpu, label: 'Token PLN', desc: 'Listrik Prabayar', color: 'from-amber-500 to-amber-600' },
];

function CategoryCard({ icon: Icon, label, desc, color, delay, active, onClick }: {
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;
  delay: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'card-hover glass-green neon-border rounded-2xl p-5 cursor-pointer group opacity-0',
        active && 'animate-scale-in'
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className={cn(
        'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300',
        color
      )}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-bold text-foreground text-sm md:text-base mb-1 group-hover:text-primary transition-colors">{label}</h3>
      <p className="text-muted-foreground text-xs">{desc}</p>
      <div className="mt-3 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        Beli Sekarang
        <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
      </div>
    </div>
  );
}

export default function ProductCategories() {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
      {/* Wave Top Divider */}
      <div className="absolute top-0 left-0 right-0 overflow-hidden leading-none rotate-180">
        <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full h-12 md:h-16 fill-background">
          <path d="M0,40 C200,80 400,0 600,40 C800,80 1000,0 1200,40 L1200,0 L0,0 Z" />
        </svg>
      </div>

      <div className="absolute inset-0 bg-section-alt" />

      {/* Content */}
      <div className="relative container mx-auto px-4 pt-8" ref={ref}>
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-xs font-semibold uppercase tracking-wider">Produk Kami</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
            Kategori <span className="text-gradient">Produk Digital</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">
            Temukan semua kebutuhan digital Anda dalam satu platform yang mudah dan terpercaya
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {categories.map((cat, i) => (
            <CategoryCard
              key={i}
              {...cat}
              delay={i * 80}
              active={active}
              onClick={() => navigate('/products')}
            />
          ))}
        </div>
      </div>

      {/* Wave Bottom Divider */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
        <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full h-12 md:h-16 fill-background">
          <path d="M0,40 C200,80 400,0 600,40 C800,80 1000,0 1200,40 L1200,80 L0,80 Z" />
        </svg>
      </div>
    </section>
  );
}
