import { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { siteSettingsStore } from '@/lib/store';
import { subscribeToStore } from '@/lib/events';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { fetchActiveBanners, type DbBanner, type BannerTheme } from '@/lib/banner-api';

/* ─────────────────────────────────────────────────────────────
   THEME CONFIG
───────────────────────────────────────────────────────────── */
const THEME: Record<BannerTheme, {
  badge: string;
  btn1:  string;
  btn2:  string;
  bg:    string;   // dark bg colour for the left column
}> = {
  pulsa: {
    badge: 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30',
    btn1:  'bg-emerald-400 hover:bg-emerald-300 text-emerald-950',
    btn2:  'border-white/30 text-white bg-white/10 hover:bg-white/20',
    bg:    '#050e0a',
  },
  game: {
    badge: 'bg-purple-400/20 text-purple-300 border border-purple-400/30',
    btn1:  'bg-purple-400 hover:bg-purple-300 text-purple-950',
    btn2:  'border-white/30 text-white bg-white/10 hover:bg-white/20',
    bg:    '#08050e',
  },
  pln: {
    badge: 'bg-amber-400/20 text-amber-300 border border-amber-400/30',
    btn1:  'bg-amber-400 hover:bg-amber-300 text-amber-950',
    btn2:  'border-white/30 text-white bg-white/10 hover:bg-white/20',
    bg:    '#050a12',
  },
  all: {
    badge: 'bg-teal-400/20 text-teal-300 border border-teal-400/30',
    btn1:  'bg-teal-400 hover:bg-teal-300 text-teal-950',
    btn2:  'border-white/30 text-white bg-white/10 hover:bg-white/20',
    bg:    '#050e0b',
  },
};

/* ─────────────────────────────────────────────────────────────
   BANNER IMAGES — 4 premium images mapped per theme
───────────────────────────────────────────────────────────── */
const THEME_IMAGES: Record<BannerTheme, string> = {
  pulsa: 'https://cdn.enter.pro/resources/uid_100059471/0fddeb10-7a96-42.png',
  game:  'https://cdn.enter.pro/resources/uid_100059471/45327064-5595-47.png',
  pln:   'https://cdn.enter.pro/resources/uid_100059471/64e60ac5-ae6a-42.png',
  all:   'https://cdn.enter.pro/resources/uid_100059471/64e70071-a373-42.png',
};

/* ─────────────────────────────────────────────────────────────
   CMS CONTENT BLOCK — shared between layouts
───────────────────────────────────────────────────────────── */
function CmsContent({
  banner, active, waLink, theme,
}: {
  banner: DbBanner;
  active: boolean;
  waLink: string;
  theme: typeof THEME[BannerTheme];
}) {
  return (
    <div className={cn(
      'transition-all duration-500 w-full',
      active ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6',
    )}>
      {banner.badge && (
        <span className={cn(
          'inline-block text-xs font-bold px-3 py-1.5 rounded-full mb-4 tracking-widest uppercase',
          theme.badge,
        )}>
          {banner.badge}
        </span>
      )}

      <h1
        className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-black leading-tight mb-3 text-white"
        style={{ textShadow: '0 2px 20px rgba(0,0,0,0.7)' }}
      >
        {banner.title}
      </h1>

      <p
        className="text-sm sm:text-base mb-6 leading-relaxed text-white/80"
        style={{ textShadow: '0 1px 10px rgba(0,0,0,0.6)' }}
      >
        {banner.subtitle}
      </p>

      <div className="flex gap-3 flex-wrap">
        {banner.button1_text && (
          <Button asChild className={cn('rounded-xl font-bold h-11 px-6 shadow-lg', theme.btn1)}>
            <Link to={banner.button1_link || '/products'}>{banner.button1_text}</Link>
          </Button>
        )}
        {banner.button2_text && (
          <Button asChild variant="outline" className={cn('rounded-xl font-bold h-11 px-6', theme.btn2)}>
            <a href={waLink} target="_blank" rel="noopener noreferrer">{banner.button2_text}</a>
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SLIDER CONTROLS — arrows + dots
   mode='mobile'  → hanya tampil di mobile, ditempatkan di area gambar
   mode='desktop' → hanya tampil di desktop, ditempatkan relatif ke seluruh section
───────────────────────────────────────────────────────────── */
function SliderControls({
  current, total, onPrev, onNext, onDot, mode,
}: {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onDot: (i: number) => void;
  mode: 'mobile' | 'desktop';
}) {
  const btnVis = mode === 'mobile' ? 'inline-flex md:hidden' : 'hidden md:inline-flex';
  const dotsVis = mode === 'mobile' ? 'flex md:hidden' : 'hidden md:flex';
  const arrowBase = 'absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-xl bg-black/40 hover:bg-black/65 text-white items-center justify-center transition-all backdrop-blur-sm border border-white/10 shadow-md';

  return (
    <>
      <button onClick={onPrev} aria-label="Slide sebelumnya" className={cn(arrowBase, 'left-3', btnVis)}>
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={onNext} aria-label="Slide berikutnya" className={cn(arrowBase, 'right-3', btnVis)}>
        <ChevronRight className="w-5 h-5" />
      </button>
      <div className={cn('absolute bottom-4 left-1/2 -translate-x-1/2 z-20 gap-2 items-center', dotsVis)}>
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => onDot(i)}
            aria-label={`Slide ${i + 1}`}
            className={cn(
              'transition-all duration-300 rounded-full shadow-md',
              i === current ? 'w-7 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/65',
            )}
          />
        ))}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   SLIDE CONTENT
   Mobile: slide aktif tampil normal flow (height mengikuti konten),
           slide lain hidden. Arrow/dots overlay hanya area gambar.
   Desktop: semua slide md:absolute md:inset-0 + crossfade opacity.
            Arrow/dots relatif ke seluruh section (area di bawah dots kosong).
───────────────────────────────────────────────────────────── */
function SlideContent({ banner, active, settings, mobileControls }: {
  banner: DbBanner;
  active: boolean;
  settings: { whatsapp: string };
  mobileControls: ReactNode;
}) {
  const theme   = THEME[banner.theme] ?? THEME.pulsa;
  const hasImage = !!banner.image_url;

  const wrapperClass = cn(
    'relative md:absolute md:inset-0 transition-all duration-700',
    active
      ? 'block opacity-100'
      : 'hidden md:block md:opacity-0 md:pointer-events-none',
  );

  /* ── Admin-uploaded custom image banner ── */
  if (hasImage) {
    const clickUrl   = banner.banner_link || banner.button1_link || '';
    const isExternal = clickUrl.startsWith('http') || clickUrl.startsWith('//');
    return (
      <div className={wrapperClass} style={{ backgroundColor: '#000' }}>
        <div className="relative flex items-center justify-center w-full min-h-[220px] md:h-full md:min-h-0">
          <img
            src={banner.image_url}
            alt={banner.title || 'Banner promo'}
            draggable={false}
            style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', display: 'block' }}
          />
          {clickUrl && (
            isExternal
              ? <a href={clickUrl} target="_blank" rel="noopener noreferrer"
                  className="absolute inset-0 z-10 cursor-pointer"
                  aria-label={banner.title || 'Lihat promo'} />
              : <Link to={clickUrl}
                  className="absolute inset-0 z-10 cursor-pointer"
                  aria-label={banner.title || 'Lihat promo'} />
          )}
          {mobileControls}
        </div>
      </div>
    );
  }

  /* ── Theme-based banner — 2-column layout
     Left 45% : CMS content (badge, title, description, buttons)
     Right 55%: Banner image (fully visible, no cropping)
  ── */
  const bgImg  = THEME_IMAGES[banner.theme] ?? THEME_IMAGES.pulsa;
  const waLink = banner.button2_link || `https://wa.me/${settings.whatsapp}`;

  return (
    <div className={wrapperClass} style={{ backgroundColor: theme.bg }}>
      <div className="flex flex-col md:flex-row md:h-full">
        {/* ── LEFT COLUMN — 45% — CMS text ── */}
        <div className="
            flex items-center
            w-full md:w-[45%]
            order-2 md:order-1
            px-5 sm:px-10 md:pl-[80px] md:pr-8
            py-6 md:py-[60px]
            flex-shrink-0
          ">
          <CmsContent banner={banner} active={active} waLink={waLink} theme={theme} />
        </div>

        {/* ── Column divider gradient (desktop only) ── */}
        <div
          className="hidden md:block absolute top-0 bottom-0 pointer-events-none"
          style={{ left: '45%', width: '120px', background: `linear-gradient(to right, ${theme.bg} 0%, transparent 100%)`, zIndex: 1 }}
        />

        {/* ── RIGHT COLUMN — 55% — Banner image (no cropping) ── */}
        <div className="
            relative flex items-center justify-center
            w-full md:w-[55%]
            order-1 md:order-2
            px-5 sm:px-8 md:pl-0 md:pr-[80px]
            py-4 sm:py-6 md:py-[60px]
            flex-shrink-0
            min-h-[220px] md:min-h-0
          ">
          <img
            src={bgImg}
            alt={banner.title || 'Banner'}
            crossOrigin="anonymous"
            draggable={false}
            style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', display: 'block', objectFit: 'contain' }}
          />
          {mobileControls}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HERO SLIDER — main export
   Data: sc_banners (DB) + realtime subscription.
───────────────────────────────────────────────────────────── */
export default function HeroSlider() {
  const [banners,  setBanners]  = useState<DbBanner[]>([]);
  const [settings, setSettings] = useState(siteSettingsStore.get());
  const [current,  setCurrent]  = useState(0);
  const [paused,   setPaused]   = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchActiveBanners()
      .then(data => { if (mounted) setBanners(data); })
      .catch(() => {});
    // WhatsApp number masih dari siteSettings (localStorage)
    const u2 = subscribeToStore('siteSettings', () => setSettings(siteSettingsStore.get()));
    // Realtime: perubahan admin (tambah/edit/hapus/urutan/aktif) langsung tampil
    const channel = supabase
      .channel('hero-banners')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sc_banners' }, () => {
        fetchActiveBanners()
          .then(data => { if (mounted) { setBanners(data); setCurrent(c => Math.min(c, Math.max(0, data.length - 1))); } })
          .catch(() => {});
      })
      .subscribe();
    return () => { mounted = false; u2(); supabase.removeChannel(channel); };
  }, []);

  const next = useCallback(() => setCurrent(c => (c + 1) % (banners.length || 1)), [banners.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + banners.length) % (banners.length || 1)), [banners.length]);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [banners.length, paused, next]);

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
      className="hero-slider-height relative overflow-hidden w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {banners.map((banner, i) => (
        <SlideContent
          key={banner.id}
          banner={banner}
          active={i === current}
          settings={settings}
          mobileControls={i === current && banners.length > 1 ? (
            <SliderControls mode="mobile" current={current} total={banners.length} onPrev={prev} onNext={next} onDot={setCurrent} />
          ) : null}
        />
      ))}

      {banners.length > 1 && (
        <SliderControls mode="desktop" current={current} total={banners.length} onPrev={prev} onNext={next} onDot={setCurrent} />
      )}
    </section>
  );
}
