import { MessageCircle, Mail, MapPin, Clock, Phone } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import { useCompanyInfo } from '@/hooks/useLegalData';

export default function Kontak() {
  const { company } = useCompanyInfo();

  const waNumber = company.whatsapp || '6281234567890';
  const waLink = `https://wa.me/${waNumber}`;
  const emailAddr = company.email || 'cs@shielacomcell.com';
  const address = [company.address, company.city, company.province, company.postal_code].filter(Boolean).join(', ') || 'Indonesia';
  const hours = company.operating_hours || 'Senin-Minggu: 08.00 - 22.00 WIB';
  const businessName = company.business_name || 'SHIELACOM CELL';

  const contactItems = [
    { icon: MessageCircle, label: 'WhatsApp', value: `+${waNumber}`, desc: 'Balas dalam 5 menit', href: waLink, color: 'from-green-500 to-emerald-600' },
    { icon: Mail, label: 'Email', value: emailAddr, desc: 'Balasan dalam 1x24 jam', href: `mailto:${emailAddr}`, color: 'from-blue-500 to-indigo-600' },
    { icon: Clock, label: 'Jam Operasional', value: hours, desc: 'Layanan otomatis 24 jam', href: '#', color: 'from-purple-500 to-violet-600' },
    { icon: MapPin, label: 'Lokasi', value: address, desc: 'Layanan online seluruh Indonesia', href: '#', color: 'from-red-500 to-rose-600' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-hero-gradient pt-24 pb-16 md:pt-32 md:pb-20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">Hubungi Kami</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Hubungi <span className="text-gradient">{businessName}</span>
            </h1>
            <p className="text-white/60 max-w-lg mx-auto text-sm md:text-base">
              Kami siap membantu Anda kapanpun. Hubungi kami melalui berbagai saluran komunikasi
            </p>
          </div>
        </section>

        {/* Contact Cards */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-12">
              {contactItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a key={item.label} href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : '_self'}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="card-hover bg-card border border-border/50 rounded-2xl p-6 group flex items-start gap-4"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                      <p className="font-bold text-foreground group-hover:text-primary transition-colors">{item.value}</p>
                      <p className="text-muted-foreground text-xs mt-1">{item.desc}</p>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Google Maps (if URL provided) */}
            {company.maps_url && (
              <div className="bg-card border border-border/50 rounded-3xl p-4 mb-8 overflow-hidden">
                <iframe
                  src={company.maps_url}
                  width="100%"
                  height="350"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-2xl w-full"
                  title="Lokasi Toko"
                />
              </div>
            )}

            {/* Company Info Card */}
            {(company.address || company.operating_hours) && (
              <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Informasi {businessName}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {company.address && (
                    <div className="flex gap-3 p-4 rounded-xl bg-muted/50">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Alamat</p>
                        <p className="text-sm font-medium text-foreground">{company.address}</p>
                        {(company.city || company.province) && <p className="text-xs text-muted-foreground">{[company.city, company.province, company.postal_code].filter(Boolean).join(', ')}</p>}
                      </div>
                    </div>
                  )}
                  {company.operating_hours && (
                    <div className="flex gap-3 p-4 rounded-xl bg-muted/50">
                      <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Jam Operasional</p>
                        <p className="text-sm font-medium text-foreground">{company.operating_hours}</p>
                      </div>
                    </div>
                  )}
                  {company.email && (
                    <div className="flex gap-3 p-4 rounded-xl bg-muted/50">
                      <Mail className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                        <a href={`mailto:${company.email}`} className="text-sm font-medium text-foreground hover:text-primary">{company.email}</a>
                      </div>
                    </div>
                  )}
                  {company.whatsapp && (
                    <div className="flex gap-3 p-4 rounded-xl bg-muted/50">
                      <Phone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">WhatsApp</p>
                        <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:text-primary">+{company.whatsapp}</a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
