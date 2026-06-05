import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Facebook, Instagram, Youtube, Send, MessageCircle, MapPin, Clock, Mail } from 'lucide-react';
import { siteSettingsStore, socialMediaStore } from '@/lib/store';
import { subscribeToStore } from '@/lib/events';
import { useCompanyInfo } from '@/hooks/useLegalData';

const QUICK_LINKS = [
  { href: '/products', label: 'Produk Digital' },
  { href: '/cara-transaksi', label: 'Cara Transaksi' },
  { href: '/cek-transaksi', label: 'Cek Transaksi' },
  { href: '/reseller', label: 'Reseller' },
  { href: '/faq', label: 'FAQ' },
  { href: '/kontak', label: 'Kontak' },
];

const LEGAL_LINKS = [
  { href: '/refund-policy', label: 'Kebijakan Refund' },
  { href: '/privacy-policy', label: 'Kebijakan Privasi' },
  { href: '/terms-and-conditions', label: 'Syarat & Ketentuan' },
];

export default function Footer() {
  const [settings, setSettings] = useState(siteSettingsStore.get());
  const [social, setSocial] = useState(socialMediaStore.get());
  const { company } = useCompanyInfo();

  useEffect(() => {
    const u1 = subscribeToStore('siteSettings', () => setSettings(siteSettingsStore.get()));
    const u2 = subscribeToStore('socialMedia', () => setSocial(socialMediaStore.get()));
    return () => { u1(); u2(); };
  }, []);

  const waNumber = company.whatsapp || social.whatsapp;
  const waLink = waNumber ? `https://wa.me/${waNumber}` : '#';

  return (
    <footer className="bg-brand-dark text-white relative overflow-hidden">
      {/* Wave Divider */}
      <div className="absolute top-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-10 md:h-14" style={{ marginTop: '-1px' }}>
          <path d="M0,60 L0,30 Q360,0 720,30 Q1080,60 1440,30 L1440,60 Z" className="fill-background" />
        </svg>
      </div>

      <div className="pt-14 md:pt-20 pb-6 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                {settings.logoDataUrl ? (
                  <img src={settings.logoDataUrl} alt={settings.siteName} className="h-8 w-auto" />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-extrabold text-lg text-white">{company.business_name || settings.siteName}</span>
                  </div>
                )}
              </Link>
              <p className="text-white/60 text-sm leading-relaxed mb-3">{settings.tagline}</p>
              {company.address && (
                <div className="flex items-start gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-primary/80 mt-0.5 flex-shrink-0" />
                  <p className="text-white/40 text-xs leading-snug">{company.address}{company.city ? `, ${company.city}` : ''}</p>
                </div>
              )}
              {(company.whatsapp || social.whatsapp) && (
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageCircle className="w-3.5 h-3.5 text-primary/80 flex-shrink-0" />
                  <p className="text-white/40 text-xs">{company.whatsapp || social.whatsapp}</p>
                </div>
              )}
              {company.email && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Mail className="w-3.5 h-3.5 text-primary/80 flex-shrink-0" />
                  <p className="text-white/40 text-xs">{company.email}</p>
                </div>
              )}
              {company.operating_hours && (
                <div className="flex items-center gap-1.5 mb-3">
                  <Clock className="w-3.5 h-3.5 text-primary/80 flex-shrink-0" />
                  <p className="text-white/40 text-xs">{company.operating_hours}</p>
                </div>
              )}
              {/* Social Media */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {waNumber && (
                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-white/10 hover:bg-primary/30 flex items-center justify-center transition-colors" title="WhatsApp">
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
                {social.facebook && (
                  <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-white/10 hover:bg-blue-500/30 flex items-center justify-center transition-colors" title="Facebook">
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {social.instagram && (
                  <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-white/10 hover:bg-pink-500/30 flex items-center justify-center transition-colors" title="Instagram">
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {social.telegram && (
                  <a href={social.telegram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-white/10 hover:bg-blue-400/30 flex items-center justify-center transition-colors" title="Telegram">
                    <Send className="w-4 h-4" />
                  </a>
                )}
                {social.youtube && (
                  <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-white/10 hover:bg-red-500/30 flex items-center justify-center transition-colors" title="YouTube">
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                {social.tiktok && (
                  <a href={social.tiktok} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-white/10 hover:bg-pink-600/30 flex items-center justify-center transition-colors" title="TikTok">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.35 6.35 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.84a8.19 8.19 0 004.88 1.58V7a4.85 4.85 0 01-1.11-.31z"/></svg>
                  </a>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-white mb-4 text-sm">Menu Cepat</h3>
              <ul className="space-y-2">
                {QUICK_LINKS.map(link => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-white/60 hover:text-white text-sm transition-colors hover:translate-x-0.5 inline-block">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Products */}
            <div>
              <h3 className="font-bold text-white mb-4 text-sm">Produk Kami</h3>
              <ul className="space-y-2">
                {[
                  { href: '/products', label: 'Pulsa & Data' },
                  { href: '/products', label: 'Top Up Game' },
                  { href: '/products', label: 'E-Wallet' },
                  { href: '/products', label: 'Token PLN' },
                  { href: '/products', label: 'PPOB' },
                  { href: '/products', label: 'Voucher Digital' },
                ].map(link => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-white/60 hover:text-white text-sm transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact + Legal */}
            <div>
              <h3 className="font-bold text-white mb-4 text-sm">Hubungi Kami</h3>
              <div className="space-y-3 mb-6">
                {waNumber && (
                  <div className="flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white/60 text-xs">WhatsApp / CS</p>
                      <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-white text-sm font-medium hover:text-primary transition-colors">
                        +{waNumber}
                      </a>
                    </div>
                  </div>
                )}
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat via WhatsApp
                </a>
              </div>
              <h3 className="font-bold text-white mb-3 text-sm">Legal</h3>
              <ul className="space-y-2">
                {LEGAL_LINKS.map(link => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-white/60 hover:text-white text-xs transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
            <p>© {new Date().getFullYear()} {company.business_name || settings.siteName}. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {LEGAL_LINKS.map(l => <Link key={l.href} to={l.href} className="hover:text-white/70 transition-colors">{l.label}</Link>)}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
