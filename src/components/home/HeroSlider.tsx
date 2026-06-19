import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { bannerStore, siteSettingsStore, type Banner } from '@/lib/store';
import { subscribeToStore } from '@/lib/events';
import { cn } from '@/lib/utils';

const THEME_CONFIG: Record<Banner['theme'], { gradient: string; badge: string; btnClass: string }> = {
  game: {
    gradient: 'from-purple-900 via-purple-800 to-indigo-900',
    badge: 'bg-purple-500/30 text-purple-200 border border-purple-400/30',
    btnClass: 'bg-purple-500 hover:bg-purple-600 text-white',
  },
  pulsa: {
    gradient: 'from-primary/90 via-green-700 to-emerald-900',
    badge: 'bg-white/20 text-white border border-white/30',
    btnClass: 'bg-white text-primary hover:bg-white/90',
  },
  pln: {
    gradient: 'from-yellow-700 via-amber-700 to-orange-900',
    badge: 'bg-yellow-500/30 text-yellow-200 border border-yellow-400/30',
    btnClass: 'bg-yellow-400 hover:bg-yellow-300 text-yellow-900',
  },
  all: {
    gradient: 'from-green-900 via-teal-900 to-brand-dark',
    badge: 'bg-primary/30 text-green-200 border border-primary/30',
    btnClass: 'bg-primary hover:bg-primary/90 text-white btn-glow',
  },
};

const NOISE = "data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E";

function SlideContent({ banner, active, settings }: { banner: Banner; active: boolean; settings: { whatsapp: string } }) {
  const theme = THEME_CONFIG[banner.theme];
  const waLink = banner.button2Link || `https://wa.me/${settings.whatsapp}`;
  const hasImage = !!banner.imageDataUrl;

  return (
    <div
      className={cn(
        'absolute inset-0 transition-all duration-700',
        active ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02] pointer-events-none'
      )}
    >
      {hasImage ? (
        <>
          {/* Blurred background fill — covers letterbox areas on sides/top */}
          <div
            className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-70"
            style={{ backgroundImage: `url(${banner.imageDataUrl})` }}
          />
          {/* Dark overlay on top of blurred bg */}
          <div className="absolute inset-0 bg-black/55" />
          {/* Main banner image — object-contain = no cropping, full image visible */}
          <img
            src={banner.imageDataUrl}
            alt={banner.title}
            className="absolute inset-0 w-full h-full object-contain z-[1]"
            draggable={false}
          />
          {/* Subtle left gradient overlay for CMS text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent z-[2]" />
        </>
      ) : (
        <>
          {/* Gradient fallback when no image uploaded */}
          <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />
          {/* Noise texture */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("${NOISE}")` }} />
        </>
      )}

      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            {banner.badge && (
              <span className={cn('inline-block text-xs font-bold px-3 py-1 rounded-full mb-4', theme.badge)}>
                {banner.badge}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-4 drop-shadow-lg">
              {banner.title}
            </h1>
            <p className="text-white/85 text-sm sm:text-base md:text-lg mb-6 leading-relaxed max-w-lg drop-shadow">
              {banner.subtitle}
            </p>
            <div className="flex gap-3 flex-wrap">
              {banner.button1Text && (
                <Button asChild className={cn('rounded-xl font-bold h-11 px-6', theme.btnClass)}>
                  <Link to={banner.button1Link || '/products'}>{banner.button1Text}</Link>
                </Button>
              )}
              {banner.button2Text && (
                <Button asChild variant="outline" className="rounded-xl font-bold h-11 px-6 border-white/30 text-white bg-white/10 hover:bg-white/20">
                  <a href={waLink} target="_blank" rel="noopener noreferrer">{banner.button2Text}</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState(siteSettingsStore.get());
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    const active = bannerStore.get().filter(b => b.active).sort((a, b) => a.order - b.order);
    setBanners(active.length > 0 ? active : bannerStore.get().slice(0, 1));
    const u1 = subscribeToStore('banners', () => {
      const a = bannerStore.get().filter(b => b.active).sort((a, b) => a.order - b.order);
      setBanners(a.length > 0 ? a : bannerStore.get().slice(0, 1));
      setCurrent(0);
    });
    const u2 = subscribeToStore('siteSettings', () => setSettings(siteSettingsStore.get()));
    return () => { u1(); u2(); };
  }, []);

  const next = useCallback(() => setCurrent(c => (c + 1) % (banners.length || 1)), [banners.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + banners.length) % (banners.length || 1)), [banners.length]);

  // Autoplay every 5 seconds — pauses on hover
  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const id = setInterval(() => setCurrent(c => (c + 1) % banners.length), 5000);
    return () => clearInterval(id);
  }, [banners.length, paused]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { if (diff > 0) next(); else prev(); }
    touchStart.current = null;
  };

  if (banners.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden"
      style={{ height: 'clamp(320px, 60vw, 560px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {banners.map((banner, i) => (
        <SlideContent key={banner.id} banner={banner} active={i === current} settings={settings} />
      ))}

      {/* Controls */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-xl bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/10 shadow-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-xl bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/10 shadow-md"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Progress dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  'transition-all duration-300 rounded-full shadow-md',
                  i === current
                    ? 'w-7 h-2.5 bg-white'
                    : 'w-2.5 h-2.5 bg-white/45 hover:bg-white/70'
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
