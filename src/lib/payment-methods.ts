// Payment method definitions - separated for fast-refresh compatibility
export interface PaymentMethod {
  id: string;
  label: string;
  gateway: string;
  /** Kode payment method resmi di sisi gateway (Duitku pakai kode 2 huruf berbeda dari 'id') */
  gatewayCode: string;
  fee: number;
  group: string;
}

// Kode payment method Duitku diverifikasi langsung terhadap Sandbox API resmi
// (endpoint getpaymentmethod & v2/inquiry) — bukan asumsi dari dokumentasi saja.
export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'MANUAL',    label: 'Transfer Bank / QRIS Manual', gateway: 'manual', gatewayCode: '',   fee: 0,    group: 'Transfer Manual' },
  { id: 'QRIS',      label: 'QRIS',                        gateway: 'duitku', gatewayCode: 'NQ', fee: 0,    group: 'QRIS' },
  { id: 'BRIVA',     label: 'BRI Virtual Account',         gateway: 'duitku', gatewayCode: 'BR', fee: 4000, group: 'Virtual Account' },
  { id: 'BCAVA',     label: 'BCA Virtual Account',         gateway: 'duitku', gatewayCode: 'BC', fee: 4000, group: 'Virtual Account' },
  { id: 'MANDIRIVA', label: 'Mandiri Virtual Account',     gateway: 'duitku', gatewayCode: 'M2', fee: 4000, group: 'Virtual Account' },
  { id: 'BNIVA',     label: 'BNI Virtual Account',         gateway: 'duitku', gatewayCode: 'I1', fee: 4000, group: 'Virtual Account' },
  { id: 'PERMATAVA', label: 'Permata Virtual Account',     gateway: 'duitku', gatewayCode: 'BT', fee: 4000, group: 'Virtual Account' },
  { id: 'OVO',       label: 'OVO',                         gateway: 'duitku', gatewayCode: 'OV', fee: 0,    group: 'E-Wallet' },
  { id: 'DANA',      label: 'DANA',                        gateway: 'duitku', gatewayCode: 'DA', fee: 0,    group: 'E-Wallet' },
  { id: 'SHOPEEPAY', label: 'ShopeePay',                   gateway: 'duitku', gatewayCode: 'SA', fee: 0,    group: 'E-Wallet' },
];

export const GROUP_COLORS: Record<string, string> = {
  'Transfer Manual': 'from-green-600 to-teal-600',
  'QRIS': 'from-blue-500 to-blue-600',
  'Virtual Account': 'from-orange-500 to-orange-600',
  'E-Wallet': 'from-purple-500 to-purple-600',
};

