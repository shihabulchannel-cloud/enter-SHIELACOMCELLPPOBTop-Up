import { cn } from '@/lib/utils';
import { PAYMENT_METHODS, GROUP_COLORS, type PaymentMethod } from '@/lib/payment-methods';

export type { PaymentMethod };

interface Props {
  selected: string;
  onSelect: (method: PaymentMethod) => void;
  productPrice: number;
}

export default function PaymentMethodSelector({ selected, onSelect, productPrice }: Props) {
  const groups = PAYMENT_METHODS.reduce((acc, m) => {
    if (!acc[m.group]) acc[m.group] = [];
    acc[m.group].push(m);
    return acc;
  }, {} as Record<string, PaymentMethod[]>);

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([group, methods]) => (
        <div key={group}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-1.5 h-4 rounded-full bg-gradient-to-b ${GROUP_COLORS[group] || 'from-gray-400 to-gray-500'}`} />
            <p className="text-sm font-semibold text-foreground">{group}</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {methods.map((method) => {
              const total = productPrice + method.fee;
              const isSelected = selected === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => onSelect(method)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border hover:border-primary/30 hover:bg-muted/30'
                  )}
                >
                  <div className={cn('w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all', isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40')}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white mx-auto mt-0.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{method.label}</p>
                    {method.fee > 0 ? (
                      <p className="text-muted-foreground text-xs">Biaya admin: Rp {method.fee.toLocaleString('id-ID')}</p>
                    ) : (
                      <p className="text-primary text-xs font-medium">Gratis biaya admin</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="font-bold text-foreground text-sm">Rp {total.toLocaleString('id-ID')}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
