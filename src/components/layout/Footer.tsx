import { Link } from 'react-router-dom';
import { Zap, MessageCircle, Mail, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';

const WA_NUMBER = '6281234567890';

const quickLinks = [
  { href: '/', label: 'Beranda' },
  { href: '/products', label: 'Produk' },
  { href: '/faq', label: 'FAQ' },
  { href: '/cara-transaksi', label: 'Cara Transaksi' },
  { href: '/cek-transaksi', label: 'Cek Transaksi' },
  { href: '/reseller', label: 'Reseller' },
];

export default function Footer() {
  return (
    <footer className="relative bg-brand-dark text-white overflow-hidden">
      {/* Wave Top Divider */}
      <div className="absolute top-0 left-0 right-0 overflow-hidden leading-none">
        <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full h-16 md:h-20 fill-background">
          <path d="M0,40 C150,80 350,0 600,40 C850,80 1050,0 1200,40 L1200,0 L0,0 Z" />
        </svg>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-green">
                <Zap className="w-5 h-5 text-white fill-current" />
              </div>
              <div>
                <span className="text-xl font-bold text-white leading-none block">SHIELACOM</span>
                <span className="text-xs font-semibold text-primary leading-none block tracking-widest">CELL</span>
              </div>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              Pusat Top Up Game, Pulsa, Paket Data, E-Wallet, PLN, PPOB dan Produk Digital Terpercaya.
            </p>
            {/* Social Media */}
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-lg glass flex items-center justify-center text-white/60 hover:text-primary hover:bg-primary/20 transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg glass flex items-center justify-center text-white/60 hover:text-primary hover:bg-primary/20 transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg glass flex items-center justify-center text-white/60 hover:text-primary hover:bg-primary/20 transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.5a8.16 8.16 0 004.77 1.52V7.57a4.85 4.85 0 01-1-.88z"/>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg glass flex items-center justify-center text-white/60 hover:text-primary hover:bg-primary/20 transition-all">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Menu Cepat</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-white/60 hover:text-primary text-sm transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Produk</h3>
            <ul className="space-y-2">
              {['Pulsa & Paket Data', 'E-Wallet', 'Top Up Game', 'Token PLN', 'PPOB', 'Voucher Digital'].map((item) => (
                <li key={item}>
                  <Link
                    to="/products"
                    className="text-white/60 hover:text-primary text-sm transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Kontak</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={`https://wa.me/${WA_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-white/60 hover:text-primary transition-colors group"
                >
                  <MessageCircle className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span className="text-sm">+62 812-3456-7890</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:cs@shielacomcell.com"
                  className="flex items-start gap-3 text-white/60 hover:text-primary transition-colors group"
                >
                  <Mail className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span className="text-sm">cs@shielacomcell.com</span>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 text-white/60">
                  <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span className="text-sm">Indonesia</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-white/40 text-xs text-center md:text-left">
            © {new Date().getFullYear()} SHIELACOM CELL. Hak Cipta Dilindungi.
          </p>
          <p className="text-white/40 text-xs text-center">
            Transaksi Digital Cepat, Murah, Aman &amp; Terpercaya
          </p>
        </div>
      </div>
    </footer>
  );
}
