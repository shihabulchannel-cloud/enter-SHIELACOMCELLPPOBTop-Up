import { MessageCircle, Mail, MapPin, Clock, Phone } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';

const WA_NUMBER = '6281234567890';

const contactItems = [
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: '+62 812-3456-7890',
    desc: 'Balas dalam 5 menit',
    href: `https://wa.me/${WA_NUMBER}`,
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'cs@shielacomcell.com',
    desc: 'Balasan dalam 1x24 jam',
    href: 'mailto:cs@shielacomcell.com',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Phone,
    label: 'Telepon',
    value: '+62 812-3456-7890',
    desc: 'Jam kerja 08:00-22:00',
    href: `tel:+6281234567890`,
    color: 'from-purple-500 to-violet-600',
  },
  {
    icon: MapPin,
    label: 'Lokasi',
    value: 'Indonesia',
    desc: 'Layanan online seluruh Indonesia',
    href: '#',
    color: 'from-red-500 to-rose-600',
  },
];

export default function Kontak() {
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
              Hubungi <span className="text-gradient">SHIELACOM CELL</span>
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
                  <a
                    key={item.label}
                    href={item.href}
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

            {/* Operating Hours */}
            <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Jam Operasional</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { day: 'Senin - Jumat', time: '07:00 - 22:00 WIB', active: true },
                  { day: 'Sabtu - Minggu', time: '08:00 - 21:00 WIB', active: true },
                  { day: 'Hari Libur Nasional', time: '08:00 - 20:00 WIB', active: true },
                  { day: 'Sistem Otomatis', time: '24 Jam / 7 Hari', active: true, highlight: true },
                ].map((item) => (
                  <div
                    key={item.day}
                    className={`flex justify-between items-center p-4 rounded-xl ${item.highlight ? 'bg-primary/10 border border-primary/30' : 'bg-muted'}`}
                  >
                    <span className="text-sm font-medium text-foreground">{item.day}</span>
                    <span className={`text-sm font-bold ${item.highlight ? 'text-primary' : 'text-muted-foreground'}`}>{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
