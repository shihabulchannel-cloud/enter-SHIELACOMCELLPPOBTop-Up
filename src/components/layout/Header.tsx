import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Zap, MessageCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { siteSettingsStore } from '@/lib/store';
import { subscribeToStore } from '@/lib/events';
import { CATEGORIES } from '@/lib/product-slugs';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/',               label: 'Beranda' },
  { href: '/products',       label: 'Produk', hasDropdown: true },
  { href: '/cara-transaksi', label: 'Cara Transaksi' },
  { href: '/cek-transaksi',  label: 'Cek Transaksi' },
  { href: '/reseller',       label: 'Reseller' },
  { href: '/faq',            label: 'FAQ' },
  { href: '/kontak',         label: 'Kontak' },
];

export default function Header() {
  const [scrolled,      setScrolled]      = useState(false);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [mobileProducts, setMobileProducts] = useState(false);
  const [settings,      setSettings]      = useState(siteSettingsStore.get());
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    return subscribeToStore('siteSettings', () => setSettings(siteSettingsStore.get()));
  }, []);

  useEffect(() => { setMenuOpen(false); setDropdownOpen(false); }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const waLink = `https://wa.me/${settings.whatsapp}`;
  const isProductsActive = location.pathname.startsWith('/products');

  return (
    <>
      <header className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'glass-dark shadow-lg border-b border-white/10 py-2'
          : 'bg-black/40 backdrop-blur-md border-b border-white/10 shadow-sm py-3',
      )}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              {settings.logoDataUrl ? (
                <img src={settings.logoDataUrl} alt={settings.siteName} className="h-8 w-auto object-contain" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <span className="text-white font-extrabold text-sm leading-none block">{settings.siteName}</span>
                    <span className="text-white/60 text-[10px] leading-none">Digital Store</span>
                  </div>
                </div>
              )}
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(link => {
                if (link.hasDropdown) {
                  return (
                    <div key={link.href} className="relative" ref={dropdownRef}>
                      {/* "Produk" — click goes to /products, chevron opens dropdown */}
                      <div className="flex items-center">
                        <Link
                          to={link.href}
                          className={cn(
                            'px-3 py-1.5 rounded-l-lg text-sm font-medium transition-all duration-200',
                            isProductsActive
                              ? 'text-white bg-white/20'
                              : 'text-white/80 hover:text-white hover:bg-white/10',
                          )}
                        >
                          {link.label}
                        </Link>
                        <button
                          onClick={() => setDropdownOpen(v => !v)}
                          className={cn(
                            'px-1 py-1.5 rounded-r-lg text-sm transition-all duration-200',
                            isProductsActive
                              ? 'text-white bg-white/20'
                              : 'text-white/80 hover:text-white hover:bg-white/10',
                          )}
                          aria-label="Kategori produk"
                        >
                          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', dropdownOpen && 'rotate-180')} />
                        </button>
                      </div>

                      {/* Dropdown */}
                      {dropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-52 bg-background border border-border rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-up">
                          <div className="p-1.5">
                            <Link
                              to="/products"
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
                            >
                              Semua Produk
                            </Link>
                            <div className="h-px bg-border my-1" />
                            {CATEGORIES.map(cat => {
                              const Icon = cat.icon;
                              return (
                                <Link
                                  key={cat.id}
                                  to={`/products/${cat.slug}`}
                                  className={cn(
                                    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors',
                                    location.pathname === `/products/${cat.slug}`
                                      ? 'bg-primary/10 text-primary font-semibold'
                                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                                  )}
                                >
                                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                  {cat.label}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                      location.pathname === link.href
                        ? 'text-white bg-white/20'
                        : 'text-white/80 hover:text-white hover:bg-white/10',
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* CTA + Mobile toggle */}
            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="hidden sm:flex bg-primary hover:bg-primary/90 text-white rounded-xl gap-1.5 btn-glow shadow-green">
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden md:inline">Hubungi WA</span>
                </a>
              </Button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={cn(
        'fixed inset-0 z-40 md:hidden transition-all duration-300',
        menuOpen ? 'pointer-events-auto' : 'pointer-events-none',
      )}>
        {/* Backdrop */}
        <div
          className={cn('absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300', menuOpen ? 'opacity-100' : 'opacity-0')}
          onClick={() => setMenuOpen(false)}
        />
        {/* Drawer */}
        <div className={cn(
          'absolute top-0 right-0 h-full w-72 max-w-[80vw] bg-background border-l border-border flex flex-col transition-transform duration-300',
          menuOpen ? 'translate-x-0' : 'translate-x-full',
        )}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <span className="font-bold text-foreground">{settings.siteName}</span>
            <button onClick={() => setMenuOpen(false)} className="p-1 rounded-lg hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-3 px-3">
            {NAV_LINKS.map(link => {
              if (link.hasDropdown) {
                return (
                  <div key={link.href}>
                    <div className="flex items-center gap-1 mb-1">
                      <Link
                        to={link.href}
                        className={cn(
                          'flex-1 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                          isProductsActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                        )}
                      >
                        {link.label}
                      </Link>
                      <button
                        onClick={() => setMobileProducts(v => !v)}
                        className="p-2 rounded-xl hover:bg-muted transition-colors"
                        aria-label="Tampilkan kategori"
                      >
                        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200', mobileProducts && 'rotate-180')} />
                      </button>
                    </div>
                    {/* Mobile category sub-menu */}
                    {mobileProducts && (
                      <div className="ml-4 mb-2 space-y-1">
                        {CATEGORIES.map(cat => {
                          const Icon = cat.icon;
                          return (
                            <Link
                              key={cat.id}
                              to={`/products/${cat.slug}`}
                              className={cn(
                                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all',
                                location.pathname === `/products/${cat.slug}`
                                  ? 'bg-primary/10 text-primary font-semibold'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                              )}
                            >
                              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                              {cat.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-1',
                    location.pathname === link.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <Button asChild className="w-full bg-primary text-white btn-glow rounded-xl gap-2">
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" /> Hubungi WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-14 md:h-16" />
    </>
  );
}
