import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { bannerStore, siteSettingsStore, type Banner } from '@/lib/store';
import { subscribeToStore } from '@/lib/events';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────
   THEME CONFIG — badge & button colors for CMS overlay
───────────────────────────────────────────────────────────── */
const THEME: Record<Banner['theme'], {
  badge: string;
  btn1: string;
  btn2: string;
}> = {
  pulsa: {
    badge: 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30',
    btn1:  'bg-emerald-400 hover:bg-emerald-300 text-emerald-950',
    btn2:  'border-white/30 text-white bg-white/10 hover:bg-white/20',
  },
  game: {
    badge: 'bg-purple-400/20 text-purple-300 border border-purple-400/30',
    btn1:  'bg-purple-400 hover:bg-purple-300 text-purple-950',
    btn2:  'border-white/30 text-white bg-white/10 hover:bg-white/20',
  },
  pln: {
    badge: 'bg-amber-400/20 text-amber-300 border border-amber-400/30',
    btn1:  'bg-amber-400 hover:bg-amber-300 text-amber-950',
    btn2:  'border-white/30 text-white bg-white/10 hover:bg-white/20',
  },
  all: {
    badge: 'bg-teal-400/20 text-teal-300 border border-teal-400/30',
    btn1:  'bg-teal-400 hover:bg-teal-300 text-teal-950',
    btn2:  'border-white/30 text-white bg-white/10 hover:bg-white/20',
  },
};

/* ─────────────────────────────────────────────────────────────
   BANNER IMAGES — 4 premium images mapped per theme
───────────────────────────────────────────────────────────── */
const THEME_IMAGES: Record<Banner['theme'], string> = {
  pulsa: 'https://cdn.enter.pro/resources/uid_100059471/0fddeb10-7a96-42.png',   // PULSA.png
  game:  'https://cdn.enter.pro/resources/uid_100059471/45327064-5595-47.png',   // GAME.png
  pln:   'https://cdn.enter.pro/resources/uid_100059471/64e60ac5-ae6a-42.png',   // EWALLET.png
  all:   'https://cdn.enter.pro/resources/uid_100059471/64e70071-a373-42.png',   // RESELLER.png
};

/* ─────────────────────────────────────────────────────────────
   SLIDE CONTENT
───────────────────────────────────────────────────────────── */
function SlideContent({ banner, active, settings }: {
  banner: Banner;
  active: boolean;
  settings: { whatsapp: string };
}) {
  const theme   = THEME[banner.theme] ?? THEME.pulsa;
  const hasImage = !!banner.imageDataUrl;

  // Admin-uploaded custom image banner — fullscreen, clickable
  if (hasImage) {
    const clickUrl   = banner.bannerLink || banner.button1Link || '';
    const isExternal = clickUrl.startsWith('http') || clickUrl.startsWith('//');
    return (
      <div className={cn(
        'absolute inset-0 transition-all duration-700',
        active ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02] pointer-events-none',
      )}>
        <div className="absolute inset-0 bg-black" />
        <img
          src={banner.imageDataUrl}
          alt={banner.title || 'Banner promo'}
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />
        {clickUrl && (
          isExternal
            ? <a href={clickUrl} target="_blank" rel="noopener noreferrer"
                className="absolute inset-0 z-10 cursor-pointer"
                aria-label={banner.title || 'Lihat promo'} />
            : <Link to={clickUrl} className="absolute inset-0 z-10 cursor-pointer"
                aria-label={banner.title || 'Lihat promo'} />
        )}
      </div>
    );
  }

  // Theme-based banner — premium image background + CMS overlay on left
  const bgImg   = THEME_IMAGES[banner.theme] ?? THEME_IMAGES.pulsa;
  const waLink  = banner.button2Link || `https://wa.me/${settings.whatsapp}`;

  return (
    <div className={cn(
      'absolute inset-0 transition-all duration-700',
      active ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02] pointer-events-none',
    )}>
      {/* ── Full-cover premium banner image ── */}
      <img
        src={bgImg}
        alt={banner.title || 'Banner'}
        crossOrigin="anonymous"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover object-center select-none"
      />

      {/* ── Left gradient overlay for text readability ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'linear-gradient(to right,',
            'rgba(0,0,0,0.90) 0%,',
            'rgba(0,0,0,0.80) 20%,',
            'rgba(0,0,0,0.55) 42%,',
            'rgba(0,0,0,0.15) 62%,',
            'transparent 80%)',
          ].join(' '),
        }}
      />
      {/* Mobile: bottom-to-top gradient */}
      <div
        className="absolute inset-0 pointer-events-none md:hidden"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.60) 40%, transparent 70%)',
        }}
      />

      {/* ── CMS Content — left side overlay ── */}
      <div className="relative z-10 h-full flex items-center">
        <div className="w-full px-5 sm:px-8 lg:px-14">
          <div className={cn(
            'max-w-lg transition-all duration-500',
            active ? 'animate-fade-left' : 'opacity-0',
          )}>
            {/* Badge */}
            {banner.badge && (
              <span className={cn(
                'inline-block text-xs font-bold px-3 py-1.5 rounded-full mb-4 w-fit tracking-widest uppercase',
                theme.badge,
              )}>
                {banner.badge}
              </span>
            )}

            {/* Title */}
            <h1 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-tight mb-3 drop-shadow-lg"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>
              {banner.title}
            </h1>

            {/* Subtitle */}
            <p className="text-white/80 text-sm sm:text-base mb-6 leading-relaxed"
              style={{ textShadow: '0 1px 10px rgba(0,0,0,0.7)' }}>
              {banner.subtitle}
            </p>

            {/* Buttons */}
            <div className="flex gap-3 flex-wrap">
              {banner.button1Text && (
                <Button asChild className={cn('rounded-xl font-bold h-11 px-6 shadow-lg', theme.btn1)}>
                  <Link to={banner.button1Link || '/products'}>{banner.button1Text}</Link>
                </Button>
              )}
              {banner.button2Text && (
                <Button asChild variant="outline" className={cn('rounded-xl font-bold h-11 px-6', theme.btn2)}>
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

/* ─────────────────────────────────────────────────────────────
   HERO SLIDER — main export (logic unchanged)
───────────────────────────────────────────────────────────── */
export default function HeroSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState(siteSettingsStore.get());
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    const load = () => {
      const all    = bannerStore.get();
      const active = all.filter(b => b.active).sort((a, b) => a.order - b.order);
      return active.length > 0 ? active : all.slice(0, 1);
    };
    setBanners(load());
    const u1 = subscribeToStore('banners',       () => { setBanners(load()); setCurrent(0); });
    const u2 = subscribeToStore('siteSettings',  () => setSettings(siteSettingsStore.get()));
    return () => { u1(); u2(); };
  }, []);

  const next = useCallback(() => setCurrent(c => (c + 1) % (banners.length || 1)), [banners.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + banners.length) % (banners.length || 1)), [banners.length]);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [banners.length, paused, next]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { if (diff > 0) next(); else prev(); }
    touchStart.current = null;
  };

  if (banners.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden"
      style={{ height: 'clamp(360px, 60vw, 580px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {banners.map((banner, i) => (
        <SlideContent key={banner.id} banner={banner} active={i === current} settings={settings} />
      ))}

      {banners.length > 1 && (
        <>
          {/* Prev/Next buttons */}
          <button onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-xl bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/10 shadow-md"
            aria-label="Slide sebelumnya">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-xl bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/10 shadow-md"
            aria-label="Slide berikutnya">
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={cn(
                  'transition-all duration-300 rounded-full shadow-md',
                  i === current ? 'w-7 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/65',
                )}
                aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
