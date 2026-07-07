import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { CmsCategory } from '@/lib/cms-api';

interface SubCategoryGridProps {
  items:        CmsCategory[];
  categorySlug: string;
  className?:   string;
}

/** Grid sub-kategori (brand/provider) dengan CMS thumbnails */
export default function SubCategoryGrid({ items, categorySlug, className }: SubCategoryGridProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn(
      'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3',
      className,
    )}>
      {items.map(item => {
        const slug = item.slug;
        return (
          <Link
            key={item.id}
            to={`/products/${categorySlug}/${slug}`}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-200 card-hover"
          >
            {/* Thumbnail area */}
            <div className={cn(
              'relative w-full aspect-square flex items-center justify-center overflow-hidden',
              !item.thumbnail_url && `bg-gradient-to-br ${item.bg_color || 'from-blue-500 to-blue-700'}`,
            )}>
              {item.thumbnail_url ? (
                <img
                  src={item.thumbnail_url}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <span className="text-white font-extrabold text-2xl uppercase">
                  {item.name.slice(0, 2)}
                </span>
              )}
              {/* Overlay gradient saat hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
            </div>

            {/* Name */}
            <div className="px-2 pb-3 pt-2 text-center">
              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2">
                {item.name}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
