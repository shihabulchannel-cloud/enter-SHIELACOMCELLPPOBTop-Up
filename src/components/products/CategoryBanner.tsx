import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CategoryMeta } from '@/lib/product-slugs';

export default function CategoryBanner({ category, brandName, search, onSearch, totalCount }: {
  category:   CategoryMeta;
  brandName?: string | null;
  search:     string;
  onSearch:   (v: string) => void;
  totalCount: number;
}) {
  const Icon  = category.icon;
  const title = brandName ? `${category.label} ${brandName}` : category.label;
  const desc  = brandName
    ? `Produk ${category.label} dari ${brandName} — proses otomatis 24 jam.`
    : category.description;

  return (
    <section className="bg-hero-gradient pt-24 pb-12 md:pt-32 md:pb-16">
      <div className="container mx-auto px-4 text-center">
        <div className={cn(
          'inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-5',
          'bg-white/10 border border-white/20 backdrop-blur-sm',
        )}>
          <div className={cn(
            'w-6 h-6 rounded-lg bg-gradient-to-br flex items-center justify-center',
            category.gradient,
          )}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white/90 text-xs font-bold uppercase tracking-wider">{title}</span>
          {totalCount > 0 && (
            <span className="text-white/50 text-xs">{totalCount} produk</span>
          )}
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
          <span className="text-gradient">{title}</span> Murah
        </h1>
        <p className="text-white/60 max-w-lg mx-auto mb-8 text-sm md:text-base">{desc}</p>

        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
          <Input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder={`Cari produk ${title.toLowerCase()}...`}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-primary rounded-xl"
          />
        </div>
      </div>
    </section>
  );
}
