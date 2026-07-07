import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface ProductItem {
  id:          string;
  sku:         string;
  name:        string;
  brand:       string;
  category_id: string;
  sell_price:  number;
  active:      boolean;
}

export default function ProductCard({ product, className }: {
  product: ProductItem;
  className?: string;
}) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/order/${product.sku}`)}
      className={cn(
        'card-hover glass-green neon-border rounded-2xl p-4 cursor-pointer group text-left w-full',
        className,
      )}
      aria-label={`Beli ${product.name}`}
    >
      <p className="font-bold text-foreground text-sm mb-1 group-hover:text-primary transition-colors leading-tight line-clamp-2">
        {product.name}
      </p>
      <p className="text-muted-foreground text-xs mb-3 truncate">{product.brand}</p>
      <p className="text-primary font-bold text-sm">
        {product.sell_price > 0
          ? `Rp ${product.sell_price.toLocaleString('id-ID')}`
          : 'Cek Harga'}
      </p>
      <div className="mt-3 flex items-center gap-1 bg-primary/10 rounded-lg px-2 py-1.5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ShoppingCart className="w-3 h-3 text-primary" />
        <span className="text-primary text-xs font-bold">Beli Sekarang</span>
      </div>
    </button>
  );
}
