import { Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryMeta } from '@/lib/product-slugs';

/** Placeholder promo section — structure ready for CMS/admin integration later */
export default function PromoSection({ category, className }: {
  category:  CategoryMeta;
  className?: string;
}) {
  const Icon = category.icon;

  return (
    <section className={cn('py-10 bg-background', className)}>
      <div className="container mx-auto px-4">
        <div className={cn(
          'rounded-3xl p-8 md:p-12 bg-gradient-to-br text-white text-center relative overflow-hidden',
          category.gradient,
        )}>
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-4 left-8 w-32 h-32 rounded-full bg-white/30 blur-2xl" />
            <div className="absolute bottom-4 right-8 w-40 h-40 rounded-full bg-white/20 blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 mb-4">
              <Tag className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-wider">Promo Spesial</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Promo Terbaik {category.label}</h2>
            <p className="text-white/80 mb-6 max-w-md mx-auto text-sm">
              Dapatkan penawaran eksklusif dan harga terbaik untuk {category.label.toLowerCase()} pilihan Anda.
            </p>
            <a
              href={`#produk-${category.id}`}
              className="inline-flex items-center gap-2 bg-white text-gray-900 hover:bg-white/90 rounded-xl font-bold px-6 py-2.5 transition-colors shadow-lg"
            >
              <Icon className="w-4 h-4" />
              Lihat Semua Produk
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
