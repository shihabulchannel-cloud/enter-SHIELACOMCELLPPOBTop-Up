import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CategoryMeta } from '@/lib/product-slugs';

export default function CategoryBanner({
  category,
  brandName,
  search,
  onSearch,
  totalCount,
  hideSearch = false,
  cmsbannerUrl,
}: {
  category:      CategoryMeta;
  brandName?:    string | null;
  search:        string;
  onSearch:      (v: string) => void;
  totalCount:    number;
  hideSearch?:   boolean;
  cmsbannerUrl?: string;
}) {
  const Icon  = category.icon;
  const title = brandName ? `${category.label} ${brandName}` : category.label;
  const desc  = brandName
    ? `Produk ${category.label} dari ${brandName} — proses otomatis 24 jam.`
    : category.description;

  return (
    <section className="relative bg-hero-gradient pt-24 pb-12 md:pt-32 md:pb-16 overflow-hidden">
      {/* CMS Banner Image (jika ada) */}
      {cmsbannerUrl && (
        <div className="absolute inset-0 z-0">
          <img
            src={cmsbannerUrl}
            alt={title}
            className="w-full h-full object-cover opacity-30"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/60" />
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 text-center">
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
            <span className="text-white/50 text-xs">
              {totalCount} {hideSearch ? 'pilihan' : 'produk'}
            </span>
          )}
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
          <span className="text-gradient">{title}</span>{!hideSearch && ' Murah'}
        </h1>
        <p className="text-white/60 max-w-lg mx-auto mb-8 text-sm md:text-base">
          {hideSearch
            ? `Pilih ${title.toLowerCase()} yang kamu inginkan`
            : desc}
        </p>

        {!hideSearch && (
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <Input
              value={search}
              onChange={e => onSearch(e.target.value)}
              placeholder={`Cari produk ${title.toLowerCase()}...`}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-primary rounded-xl"
            />
          </div>
        )}
      </div>
    </section>
  );
}
