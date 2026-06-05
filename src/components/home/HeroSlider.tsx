import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart, MessageCircle, Gamepad2, Wallet, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { bannerStore, type Banner } from '@/lib/store';

const WA_NUMBER = '6281234567890';

const themeConfig = {
  game: {
    bg: 'from-purple-900 via-indigo-900 to-brand-dark',
    accent: 'from-purple-500 to-pink-500',
    icon: Gamepad2,
    glow: 'purple',
  },
  pulsa: {
    bg: 'from-brand-dark via-green-900 to-emerald-900',
    accent: 'from-primary to-emerald-400',
    icon: Wallet,
    glow: 'green',
  },
  pln: {
    bg: 'from-yellow-900 via-amber-900 to-brand-dark',
    accent: 'from-yellow-400 to-amber-500',
    icon: Zap,
    glow: 'yellow',
  },
  all: {
    bg: 'from-brand-dark via-primary-dark to-emerald-900',
    accent: 'from-primary to-primary-glow',
    icon: Star,
    glow: 'green',
  },
};

function SlideContent({ banner, active }: { banner: Banner; active: boolean }) {
  const config = themeConfig[banner.theme];
  const Icon = config.icon;

  return (
    <div className={cn(
      'absolute inset-0 transition-all duration-700 ease-in-out',
      active ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
    )}>
      <div className={cn('absolute inset-0 bg-gradient-to-br', config.bg)} />
      {/* Decorative circles */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
      {/* Floating Icon */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:flex">
        <div className={cn(
          'w-32 h-32 lg:w-48 lg:h-48 rounded-3xl glass flex items-center justify-center animate-float',
          active && 'animate-float'
        )}>
          <Icon className="w-16 h-16 lg:w-24 lg:h-24 text-primary opacity-80" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          <div className={cn(
            'inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-4 transition-all duration-500',
            active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}>
            <span className={cn('w-2 h-2 rounded-full bg-gradient-to-r animate-pulse', config.accent)} />
            <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">{banner.badge}</span>
          </div>
          <h1 className={cn(
            'text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-4 leading-tight transition-all duration-500 delay-100',
            active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          )}>
            {banner.title}
          </h1>
          <p className={cn(
            'text-white/70 text-sm md:text-base lg:text-lg mb-8 max-w-lg transition-all duration-500 delay-200',
            active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          )}>
            {banner.subtitle}
          </p>
          <div className={cn(
            'flex flex-col sm:flex-row gap-3 transition-all duration-500 delay-300',
            active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          )}>
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary-dark btn-glow shadow-green rounded-xl gap-2 font-semibold"
              asChild
            >
              <a href="/products">
                <ShoppingCart className="w-5 h-5" />
                Beli Sekarang
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white bg-white/10 hover:bg-white/20 rounded-xl gap-2 font-semibold backdrop-blur-sm"
              asChild
            >
              <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-5 h-5" />
                Hubungi WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef<number>(0);

  useEffect(() => {
    setBanners(bannerStore.get());
  }, []);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent(prev => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (!isPlaying || banners.length === 0) return;
    intervalRef.current = setInterval(next, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, banners.length, next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  if (banners.length === 0) return null;

  return (
    <section
      className="relative w-full h-[60vh] md:h-[75vh] lg:h-screen overflow-hidden"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {banners.map((banner, i) => (
        <SlideContent key={banner.id} banner={banner} active={i === current} />
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-xl glass text-white hover:bg-primary/30 transition-all flex items-center justify-center"
      >
        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-xl glass text-white hover:bg-primary/30 transition-all flex items-center justify-center"
      >
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Indicator Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={cn(
              'transition-all duration-300 rounded-full',
              i === current
                ? 'w-8 h-3 bg-primary shadow-green'
                : 'w-3 h-3 bg-white/40 hover:bg-white/70'
            )}
          />
        ))}
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-6 right-8 hidden md:flex flex-col items-center gap-1 text-white/40 text-xs">
        <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1">
          <div className="w-1 h-2 bg-white/40 rounded-full animate-bounce" />
        </div>
        <span>Scroll</span>
      </div>
    </section>
  );
}
