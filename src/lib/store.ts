// LocalStorage store for banners, FAQs, and transactions

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  theme: 'game' | 'pulsa' | 'pln' | 'all';
  badge: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface Transaction {
  id: string;
  invoiceId: string;
  product: string;
  destination: string;
  amount: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  createdAt: string;
}

const DEFAULT_BANNERS: Banner[] = [
  {
    id: '1',
    title: 'Top Up Game Favoritmu',
    subtitle: 'Mobile Legends, Free Fire, PUBG, Genshin Impact dan 200+ Game Lainnya. Proses Instan!',
    theme: 'game',
    badge: 'Top Up Game',
  },
  {
    id: '2',
    title: 'Pulsa & E-Wallet Terlengkap',
    subtitle: 'GoPay, OVO, DANA, ShopeePay, Pulsa Semua Operator. Harga Terjangkau!',
    theme: 'pulsa',
    badge: 'Pulsa & E-Wallet',
  },
  {
    id: '3',
    title: 'Token PLN & Tagihan PPOB',
    subtitle: 'Bayar tagihan PLN, PDAM, Internet, BPJS dan banyak lagi. Mudah & Cepat!',
    theme: 'pln',
    badge: 'PLN & PPOB',
  },
  {
    id: '4',
    title: 'Semua Layanan Digital di Satu Tempat',
    subtitle: 'SHIELACOM CELL - Platform Top Up & PPOB Terpercaya. Transaksi Aman & Cepat 24 Jam!',
    theme: 'all',
    badge: 'Semua Layanan',
  },
];

const DEFAULT_FAQS: FAQItem[] = [
  {
    id: '1',
    question: 'Berapa lama proses transaksi berlangsung?',
    answer: 'Proses transaksi berlangsung sangat cepat, biasanya selesai dalam hitungan detik hingga maksimal 5 menit tergantung jenis produk dan kondisi jaringan.',
  },
  {
    id: '2',
    question: 'Apa saja metode pembayaran yang tersedia?',
    answer: 'Kami menerima berbagai metode pembayaran: Transfer Bank, GoPay, OVO, DANA, ShopeePay, dan berbagai payment gateway lainnya.',
  },
  {
    id: '3',
    question: 'Bagaimana jika transaksi gagal atau tidak diproses?',
    answer: 'Jika transaksi gagal, saldo akan dikembalikan secara otomatis dalam 1x24 jam. Anda juga bisa menghubungi customer service kami untuk penanganan lebih cepat.',
  },
  {
    id: '4',
    question: 'Apakah ada minimum pembelian?',
    answer: 'Tidak ada minimum pembelian. Anda bisa membeli produk digital mulai dari nominal terkecil yang tersedia.',
  },
  {
    id: '5',
    question: 'Bagaimana cara menjadi reseller SHIELACOM CELL?',
    answer: 'Untuk menjadi reseller, silakan hubungi admin via WhatsApp. Reseller mendapatkan harga khusus yang lebih murah dan bisa menentukan margin sendiri.',
  },
  {
    id: '6',
    question: 'Apakah bisa transaksi 24 jam?',
    answer: 'Ya! Layanan kami tersedia 24 jam sehari, 7 hari seminggu termasuk hari libur nasional.',
  },
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  { id: '1', invoiceId: 'INV-20240101-001', product: 'Pulsa Telkomsel 50rb', destination: '08123456789', amount: 50000, status: 'success', createdAt: '2024-01-01 10:30' },
  { id: '2', invoiceId: 'INV-20240101-002', product: 'Token PLN 100rb', destination: '123456789012', amount: 100000, status: 'success', createdAt: '2024-01-01 11:00' },
  { id: '3', invoiceId: 'INV-20240101-003', product: 'GoPay 50rb', destination: '08198765432', amount: 50000, status: 'processing', createdAt: '2024-01-01 11:30' },
  { id: '4', invoiceId: 'INV-20240101-004', product: 'Mobile Legends 100 Diamonds', destination: '123456789', amount: 25000, status: 'pending', createdAt: '2024-01-01 12:00' },
  { id: '5', invoiceId: 'INV-20240101-005', product: 'Paket Data XL 10GB', destination: '08776543210', amount: 75000, status: 'failed', createdAt: '2024-01-01 12:30' },
];

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const bannerStore = {
  get: (): Banner[] => getFromStorage('shielacom_banners', DEFAULT_BANNERS),
  set: (banners: Banner[]) => setToStorage('shielacom_banners', banners),
  add: (banner: Omit<Banner, 'id'>) => {
    const banners = bannerStore.get();
    const newBanner = { ...banner, id: Date.now().toString() };
    bannerStore.set([...banners, newBanner]);
    return newBanner;
  },
  remove: (id: string) => {
    const banners = bannerStore.get().filter(b => b.id !== id);
    bannerStore.set(banners);
  },
  reorder: (banners: Banner[]) => bannerStore.set(banners),
};

export const faqStore = {
  get: (): FAQItem[] => getFromStorage('shielacom_faqs', DEFAULT_FAQS),
  set: (faqs: FAQItem[]) => setToStorage('shielacom_faqs', faqs),
  add: (faq: Omit<FAQItem, 'id'>) => {
    const faqs = faqStore.get();
    const newFaq = { ...faq, id: Date.now().toString() };
    faqStore.set([...faqs, newFaq]);
    return newFaq;
  },
  update: (id: string, faq: Omit<FAQItem, 'id'>) => {
    const faqs = faqStore.get().map(f => f.id === id ? { ...faq, id } : f);
    faqStore.set(faqs);
  },
  remove: (id: string) => {
    const faqs = faqStore.get().filter(f => f.id !== id);
    faqStore.set(faqs);
  },
};

export const transactionStore = {
  get: (): Transaction[] => getFromStorage('shielacom_transactions', DEFAULT_TRANSACTIONS),
  findByInvoice: (invoiceId: string): Transaction | undefined => {
    return transactionStore.get().find(t => t.invoiceId.toLowerCase() === invoiceId.toLowerCase());
  },
};
