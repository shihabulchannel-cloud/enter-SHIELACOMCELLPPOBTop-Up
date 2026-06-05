// Payment method definitions - separated for fast-refresh compatibility
export interface PaymentMethod {
  id: string;
  label: string;
  gateway: string;
  fee: number;
  group: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'QRIS', label: 'QRIS', gateway: 'tripay', fee: 0, group: 'QRIS' },
  { id: 'BRIVA', label: 'BRI Virtual Account', gateway: 'tripay', fee: 4000, group: 'Virtual Account' },
  { id: 'BCAVA', label: 'BCA Virtual Account', gateway: 'tripay', fee: 4000, group: 'Virtual Account' },
  { id: 'MANDIRIVA', label: 'Mandiri Virtual Account', gateway: 'tripay', fee: 4000, group: 'Virtual Account' },
  { id: 'BNIVA', label: 'BNI Virtual Account', gateway: 'tripay', fee: 4000, group: 'Virtual Account' },
  { id: 'PERMATAVA', label: 'Permata Virtual Account', gateway: 'tripay', fee: 4000, group: 'Virtual Account' },
  { id: 'GOPAY', label: 'GoPay', gateway: 'tripay', fee: 0, group: 'E-Wallet' },
  { id: 'OVO', label: 'OVO', gateway: 'tripay', fee: 0, group: 'E-Wallet' },
  { id: 'DANA', label: 'DANA', gateway: 'tripay', fee: 0, group: 'E-Wallet' },
  { id: 'SHOPEEPAY', label: 'ShopeePay', gateway: 'tripay', fee: 0, group: 'E-Wallet' },
];

export const GROUP_COLORS: Record<string, string> = {
  'QRIS': 'from-blue-500 to-blue-600',
  'Virtual Account': 'from-orange-500 to-orange-600',
  'E-Wallet': 'from-purple-500 to-purple-600',
};
