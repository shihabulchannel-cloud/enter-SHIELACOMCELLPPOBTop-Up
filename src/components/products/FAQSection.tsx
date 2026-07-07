import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryMeta } from '@/lib/product-slugs';

export default function FAQSection({ category }: { category: CategoryMeta }) {
  const [open, setOpen] = useState<number | null>(null);
  if (category.faq.length === 0) return null;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4 max-w-2xl">
        <h2 className="text-xl font-bold text-foreground mb-1 text-center">FAQ — {category.label}</h2>
        <p className="text-muted-foreground text-sm text-center mb-8">
          Pertanyaan umum seputar {category.label.toLowerCase()}
        </p>
        <div className="space-y-3">
          {category.faq.map((item, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span className="font-semibold text-foreground text-sm">{item.q}</span>
                <ChevronDown className={cn(
                  'w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200',
                  open === i && 'rotate-180',
                )} />
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
