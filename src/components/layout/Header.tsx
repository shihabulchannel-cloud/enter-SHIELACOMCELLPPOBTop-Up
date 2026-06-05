import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Zap, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Beranda' },
  { href: '/products', label: 'Produk' },
  { href: '/cara-transaksi', label: 'Cara Transaksi' },
  { href: '/faq', label: 'FAQ' },
  { href: '/cek-transaksi', label: 'Cek Transaksi' },
  { href: '/reseller', label: 'Reseller' },
  { href: '/kontak', label: 'Hubungi Kami' },
];

const WA_NUMBER = '6281234567890';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'glass-dark shadow-lg border-b border-white/10'
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-green group-hover:animate-pulse-glow transition-all">
              <Zap className="w-5 h-5 text-primary-foreground fill-current" />
            </div>
            <div>
              <span className="text-lg font-bold text-gradient leading-none block">SHIELACOM</span>
              <span className="text-xs font-semibold text-primary leading-none block tracking-widest">CELL</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  location.pathname === link.href
                    ? 'text-primary bg-primary/10'
                    : scrolled
                      ? 'text-foreground/80 hover:text-primary hover:bg-primary/10'
                      : 'text-white/90 hover:text-primary hover:bg-white/10'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary-dark btn-glow gap-2 rounded-xl shadow-green"
              asChild
            >
              <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={cn(
              'lg:hidden p-2 rounded-xl transition-colors',
              scrolled ? 'text-foreground hover:bg-muted' : 'text-white hover:bg-white/10'
            )}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          'lg:hidden overflow-hidden transition-all duration-300 glass-dark border-t border-white/10',
          mobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                location.pathname === link.href
                  ? 'text-primary bg-primary/20 border border-primary/30'
                  : 'text-white/80 hover:text-primary hover:bg-white/10'
              )}
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`https://wa.me/${WA_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-green"
          >
            <MessageCircle className="w-4 h-4" />
            Hubungi WhatsApp
          </a>
        </nav>
      </div>
    </header>
  );
}
