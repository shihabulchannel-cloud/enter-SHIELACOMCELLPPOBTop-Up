import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { CmsCategory } from '@/lib/cms-api';

interface SubCategoryGridProps {
  items:         CmsCategory[];
  categorySlug:  string;
  className?:    string;
  /** Product count per brand_name, used for "X produk" badge */
  productCounts?: Record<string, number>;
  /** Show skeleton loading placeholders */
  loading?:      boolean;
}

/** Arena Gamers–style skeleton card */
function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl aspect-[3/4] bg-muted animate-pulse shadow-md">
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5">
        <div className="h-3.5 bg-muted-foreground/20 rounded-full w-3/4" />
        <div className="h-3 bg-muted-foreground/20 rounded-full w-1/2" />
      </div>
    </div>
  );
}

/** Arena Gamers–style sub-category grid with full-bleed cover images */
export default function SubCategoryGrid({
  items,
  categorySlug,
  className,
  productCounts,
  loading,
}: SubCategoryGridProps) {
  /** Skeleton while CMS is loading */
  if (loading) {
    return (
      <div className={cn(
        'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4',
        className,
      )}>
        {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className={cn(
      'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4',
      className,
    )}>
      {items.map(item => {
        const count    = productCounts?.[item.brand_name ?? ''] ?? 0;
        const initials = item.name.slice(0, 2).toUpperCase();
        const bg       = item.bg_color || 'from-blue-600 to-indigo-800';

        return (
          <Link
            key={item.id}
            to={`/products/${categorySlug}/${item.slug}`}
            className="group relative block overflow-hidden rounded-2xl aspect-[3/4] shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            {/* ── Cover: CMS thumbnail or colour-gradient fallback ── */}
            {item.thumbnail_url ? (
              <img
                src={item.thumbnail_url}
                alt={item.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className={cn('absolute inset-0 bg-gradient-to-br', bg)}>
                {/* Faint oversized initials as texture */}
                <span className="absolute inset-0 flex items-center justify-center font-black text-7xl text-white/10 select-none">
                  {initials}
                </span>
              </div>
            )}

            {/* ── Dark gradient overlay (bottom 60 %) ── */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            {/* ── Text content ── */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow-sm">
                {item.name}
              </h3>
              {count > 0 && (
                <p className="mt-0.5 text-white/65 text-xs">{count} produk</p>
              )}
            </div>

            {/* ── Subtle shine on hover ── */}
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/5" />
          </Link>
        );
      })}
    </div>
  );
}
