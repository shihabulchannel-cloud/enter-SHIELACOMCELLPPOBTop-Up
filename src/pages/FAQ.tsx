import { useState, useEffect } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import { faqStore, type FAQItem } from '@/lib/store';
import { cn } from '@/lib/utils';

function FAQAccordion({ item, index }: { item: FAQItem; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-300 overflow-hidden',
        open ? 'border-primary/40 bg-primary/5 shadow-green' : 'border-border/50 bg-card hover:border-primary/20'
      )}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left gap-4"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className={cn('font-semibold text-sm md:text-base transition-colors', open ? 'text-primary' : 'text-foreground')}>
            {item.question}
          </span>
        </div>
        <ChevronDown className={cn('w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300', open && 'rotate-180')} />
      </button>
      <div className={cn('overflow-hidden transition-all duration-300', open ? 'max-h-96' : 'max-h-0')}>
        <p className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed pl-[72px]">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  useEffect(() => {
    setFaqs(faqStore.get());
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-hero-gradient pt-24 pb-16 md:pt-32 md:pb-20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">FAQ</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Pertanyaan yang{' '}
              <span className="text-gradient">Sering Ditanyakan</span>
            </h1>
            <p className="text-white/60 max-w-lg mx-auto text-sm md:text-base">
              Temukan jawaban dari berbagai pertanyaan umum pelanggan kami
            </p>
          </div>
        </section>

        {/* FAQ List */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-3xl">
            {faqs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Belum ada FAQ tersedia.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <FAQAccordion key={faq.id} item={faq} index={i} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 bg-muted">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-xl font-bold text-foreground mb-2">Tidak Menemukan Jawaban?</h2>
            <p className="text-muted-foreground text-sm mb-6">Hubungi tim kami langsung melalui WhatsApp</p>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-dark px-6 py-3 rounded-xl font-semibold btn-glow shadow-green transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              Tanya Via WhatsApp
            </a>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
