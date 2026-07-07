import { cn } from '@/lib/utils';
import ProductCard, { type ProductItem } from './ProductCard';

export default function ProductGrid({ products, className, emptyMessage }: {
  products:      ProductItem[];
  className?:    string;
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-sm">{emptyMessage ?? 'Tidak ada produk ditemukan.'}</p>
      </div>
    );
  }

  return (
    <div className={cn(
      'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3',
      className,
    )}>
      {products.map(p => <ProductCard key={p.sku} product={p} />)}
    </div>
  );
}
