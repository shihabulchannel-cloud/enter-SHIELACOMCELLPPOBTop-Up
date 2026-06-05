import HowToTransact from '@/components/home/HowToTransact';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

const WA_NUMBER = '6281234567890';

export default function CaraTransaksi() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-hero-gradient pt-24 pb-16 md:pt-32 md:pb-20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">Panduan</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Cara <span className="text-gradient">Transaksi</span>
            </h1>
            <p className="text-white/60 max-w-lg mx-auto text-sm md:text-base">
              Panduan lengkap cara berbelanja produk digital di SHIELACOM CELL
            </p>
          </div>
        </section>

        <HowToTransact />

        {/* Help Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-card">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Masih Butuh Bantuan?</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Tim customer service kami siap membantu Anda 24 jam sehari, 7 hari seminggu
              </p>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary-dark btn-glow shadow-green rounded-xl gap-2 font-semibold"
                asChild
              >
                <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-5 h-5" />
                  Hubungi Customer Service
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
