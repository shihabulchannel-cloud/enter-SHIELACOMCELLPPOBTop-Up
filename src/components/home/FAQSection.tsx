import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { faqStore, type FAQItem } from '@/lib/store';

function FAQItem({ item, index }: { item: FAQItem; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-300 overflow-hidden',
        open
          ? 'border-primary/40 bg-primary/5 shadow-green'
          : 'border-border/50 bg-card hover:border-primary/20'
      )}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left gap-4"
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className={cn('font-semibold text-sm md:text-base transition-colors', open ? 'text-primary' : 'text-foreground')}>
            {item.question}
          </span>
        </div>
        <ChevronDown className={cn('w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300', open && 'rotate-180')} />
      </button>
      <div className={cn('overflow-hidden transition-all duration-300', open ? 'max-h-96' : 'max-h-0')}>
        <p className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed pl-[60px]">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  useEffect(() => {
    setFaqs(faqStore.get().slice(0, 6));
  }, []);

  return (
    <section className="relative py-16 md:py-24 bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 right-0 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-xs font-semibold uppercase tracking-wider">FAQ</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
            Pertanyaan yang <span className="text-gradient">Sering Ditanyakan</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Temukan jawaban dari pertanyaan umum pelanggan kami
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem key={faq.id} item={faq} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
