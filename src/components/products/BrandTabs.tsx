import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { brandToSlug } from '@/lib/product-slugs';

export default function BrandTabs({ brands, categorySlug, activeBrandSlug }: {
  brands:          string[];
  categorySlug:    string;
  activeBrandSlug: string | undefined;
}) {
  if (brands.length === 0) return null;

  return (
    <div className="bg-background border-b border-border/50 sticky top-16 lg:top-20 z-30 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hidden py-3">
          {/* "Semua" tab → category page (no brand filter) */}
          <Link
            to={`/products/${categorySlug}`}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap',
              !activeBrandSlug
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary',
            )}
          >
            Semua
          </Link>

          {/* Per-brand tabs → URL-based navigation (not JS filter) */}
          {brands.map(brand => {
            const slug     = brandToSlug(brand);
            const isActive = slug === activeBrandSlug;
            return (
              <Link
                key={brand}
                to={`/products/${categorySlug}/${slug}`}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary',
                )}
              >
                {brand}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
