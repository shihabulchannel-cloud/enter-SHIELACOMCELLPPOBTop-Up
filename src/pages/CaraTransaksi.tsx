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
