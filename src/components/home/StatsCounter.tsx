import { useEffect, useRef, useState } from 'react';
import { TrendingUp, Package, HeadphonesIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const stats = [
  { icon: TrendingUp, value: 100000, suffix: '+', label: 'Transaksi Berhasil', prefix: '' },
  { icon: Package, value: 500, suffix: '+', label: 'Produk Digital', prefix: '' },
  { icon: HeadphonesIcon, value: 24, suffix: '/7', label: 'Customer Service', prefix: '' },
];

function useCountUp(target: number, duration: number, active: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [active, target, duration]);

  return count;
}

function StatCard({ icon: Icon, value, suffix, label, delay, active }: {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  delay: number;
  active: boolean;
}) {
  const count = useCountUp(value, 2000, active);

  return (
    <div
      className={cn(
        'text-center group opacity-0',
        active && 'animate-fade-up'
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 group-hover:border-primary/40 group-hover:shadow-green transition-all duration-300">
        <Icon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
      </div>
      <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2">
        <span className="text-gradient">{count >= 1000 ? `${(count / 1000).toFixed(0)}k` : count}</span>
        <span className="text-primary">{suffix}</span>
      </div>
      <p className="text-muted-foreground font-medium text-sm md:text-base">{label}</p>
    </div>
  );
}

export default function StatsCounter() {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative py-16 md:py-24 bg-background overflow-hidden">
      {/* Glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4" ref={ref}>
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-xs font-semibold uppercase tracking-wider">Statistik Kami</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">
            Dipercaya oleh <span className="text-gradient">Ribuan</span> Pelanggan
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12 max-w-3xl mx-auto">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} delay={i * 200} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
