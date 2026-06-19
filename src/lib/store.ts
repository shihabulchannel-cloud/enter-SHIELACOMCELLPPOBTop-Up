// ============================================================
// SHIELACOM CELL — Complete LocalStorage Store
// ============================================================

import { notifyUpdate } from './events';

// ---- Helpers ----
function get<T>(key: string, def: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : def;
  } catch { return def; }
}
function set<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// ============================================================
// TYPES
// ============================================================

export interface SiteSettings {
  siteName: string;
  tagline: string;
  logoDataUrl: string;
  whatsapp: string;
  email: string;
  address: string;
}

export interface SocialMedia {
  whatsapp: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  telegram: string;
  youtube: string;
}

export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogImageDataUrl: string;
}

export interface CmsContent {
  heroTitle: string;
  heroSubtitle: string;
  statsTitle: string;
  featuresTitle: string;
  featuresSubtitle: string;
  howToTitle: string;
  resellerTitle: string;
  resellerSubtitle: string;
  footerAbout: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  button1Text: string;
  button1Link: string;
  button2Text: string;
  button2Link: string;
  bannerLink: string;   // whole-banner click URL (used when image is present)
  imageDataUrl: string;
  theme: 'game' | 'pulsa' | 'pln' | 'all';
  active: boolean;
  order: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  photoDataUrl: string;
  categoryId: string;
  provider: string;
  providerCode: string;
  brand: string;
  buyPrice: number;
  sellPrice: number;
  active: boolean;
  createdAt: string;
}

export interface ProviderConfig {
  digiflazz: {
    username: string;
    apiKey: string;
    webhookUrl: string;
    enabled: boolean;
    balance: number;
  };
  vipReseller: {
    memberId: string;
    apiKey: string;
    webhookUrl: string;
    enabled: boolean;
    balance: number;
  };
}

export interface PaymentGatewayConfig {
  duitku: {
    merchantCode: string;
    apiKey: string;
    callbackUrl: string;
    returnUrl: string;
    enabled: boolean;
  };
  ipaymu: {
    va: string;
    apiKey: string;
    callbackUrl: string;
    returnUrl: string;
    enabled: boolean;
  };
  tripay: {
    apiKey: string;
    merchantCode: string;
    privateKey: string;
    callbackUrl: string;
    enabled: boolean;
  };
}

export interface ProviderPriority {
  categoryId: string;
  categoryName: string;
  primary: string;
  backup: string;
}

export interface MarkupRule {
  id: string;
  type: 'category' | 'product' | 'global';
  targetId: string;
  targetName: string;
  value: number;
  isPercentage: boolean;
}

export interface Reseller {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  username: string;
  password: string;
  balance: number;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface ResellerRegistration {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Deposit {
  id: string;
  resellerId: string;
  resellerName: string;
  amount: number;
  method: string;
  note: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
}

export interface WalletMutation {
  id: string;
  resellerId: string;
  resellerName: string;
  type: 'deposit' | 'debit' | 'transaction' | 'refund';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  message: string;
  photoDataUrl: string;
  rating: number;
  active: boolean;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  thumbnailDataUrl: string;
  category: string;
  status: 'published' | 'draft';
  createdAt: string;
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
  profit: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  createdAt: string;
}

export interface SystemLog {
  id: string;
  action: string;
  description: string;
  user: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: 'transaction' | 'deposit' | 'registration' | 'failed_product' | 'info';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ============================================================
// DEFAULTS
// ============================================================

const D_SITE: SiteSettings = {
  siteName: 'SHIELACOM CELL',
  tagline: 'Transaksi Digital Cepat, Murah, Aman & Terpercaya',
  logoDataUrl: '',
  whatsapp: '6281234567890',
  email: 'cs@shielacomcell.com',
  address: 'Indonesia',
};

const D_SOCIAL: SocialMedia = {
  whatsapp: '6281234567890',
  facebook: 'https://facebook.com/shielacomcell',
  instagram: 'https://instagram.com/shielacomcell',
  tiktok: 'https://tiktok.com/@shielacomcell',
  telegram: 'https://t.me/shielacomcell',
  youtube: 'https://youtube.com/@shielacomcell',
};

const D_SEO: SeoSettings = {
  metaTitle: 'SHIELACOM CELL - Pulsa, Paket Data, E-Wallet, Top Up Game, PLN & PPOB',
  metaDescription: 'Platform PPOB terpercaya. Top Up Game, Pulsa, Paket Data, E-Wallet, Token PLN, PPOB harga murah proses cepat 24 jam.',
  keywords: 'pulsa murah, paket data, top up game, token pln, ppob, e-wallet, gopay, ovo, dana',
  ogImageDataUrl: '',
};

const D_CMS: CmsContent = {
  heroTitle: 'Platform Top Up & PPOB Terpercaya',
  heroSubtitle: 'Transaksi digital mudah, cepat dan aman 24 jam',
  statsTitle: 'Dipercaya oleh Ribuan Pelanggan',
  featuresTitle: 'Kenapa Pilih SHIELACOM CELL?',
  featuresSubtitle: 'Kami hadir dengan solusi digital terlengkap dan pelayanan terbaik untuk kepuasan Anda',
  howToTitle: 'Cara Transaksi',
  resellerTitle: 'Gabung Menjadi Reseller SHIELACOM CELL',
  resellerSubtitle: 'Bergabunglah dengan ribuan reseller sukses yang telah mempercayai kami sebagai mitra bisnis digital mereka',
  footerAbout: 'Pusat Top Up Game, Pulsa, Paket Data, E-Wallet, PLN, PPOB dan Produk Digital Terpercaya.',
};

const D_BANNERS: Banner[] = [
  { id: '1', title: 'Top Up Game Favoritmu', subtitle: 'Mobile Legends, Free Fire, PUBG, Genshin Impact dan 200+ Game Lainnya. Proses Instan!', badge: 'Top Up Game', button1Text: 'Beli Sekarang', button1Link: '/products', button2Text: 'Hubungi WhatsApp', button2Link: '', imageDataUrl: '', theme: 'game', active: true, order: 1 },
  { id: '2', title: 'Pulsa & E-Wallet Terlengkap', subtitle: 'GoPay, OVO, DANA, ShopeePay, Pulsa Semua Operator. Harga Terjangkau!', badge: 'Pulsa & E-Wallet', button1Text: 'Beli Sekarang', button1Link: '/products', button2Text: 'Hubungi WhatsApp', button2Link: '', imageDataUrl: '', theme: 'pulsa', active: true, order: 2 },
  { id: '3', title: 'Token PLN & Tagihan PPOB', subtitle: 'Bayar tagihan PLN, PDAM, Internet, BPJS dan banyak lagi. Mudah & Cepat!', badge: 'PLN & PPOB', button1Text: 'Beli Sekarang', button1Link: '/products', button2Text: 'Hubungi WhatsApp', button2Link: '', imageDataUrl: '', theme: 'pln', active: true, order: 3 },
  { id: '4', title: 'Semua Layanan Digital di Satu Tempat', subtitle: 'SHIELACOM CELL - Platform Top Up & PPOB Terpercaya. Transaksi Aman & Cepat 24 Jam!', badge: 'Semua Layanan', button1Text: 'Beli Sekarang', button1Link: '/products', button2Text: 'Hubungi WhatsApp', button2Link: '', imageDataUrl: '', theme: 'all', active: true, order: 4 },
];

const D_CATEGORIES: Category[] = [
  { id: 'pulsa', name: 'Pulsa', icon: 'Smartphone', color: 'from-blue-500 to-blue-600', active: true },
  { id: 'data', name: 'Paket Data', icon: 'Wifi', color: 'from-cyan-500 to-cyan-600', active: true },
  { id: 'ewallet', name: 'E-Wallet', icon: 'Wallet', color: 'from-orange-500 to-orange-600', active: true },
  { id: 'game', name: 'Top Up Game', icon: 'Gamepad2', color: 'from-purple-500 to-purple-600', active: true },
  { id: 'pln', name: 'PLN', icon: 'Zap', color: 'from-yellow-500 to-yellow-600', active: true },
  { id: 'ppob', name: 'PPOB', icon: 'FileText', color: 'from-red-500 to-red-600', active: true },
  { id: 'voucher', name: 'Voucher Digital', icon: 'Tag', color: 'from-pink-500 to-pink-600', active: true },
  { id: 'token', name: 'Token PLN', icon: 'Cpu', color: 'from-amber-500 to-amber-600', active: true },
];

const D_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Pulsa Telkomsel 10.000', photoDataUrl: '', categoryId: 'pulsa', provider: 'digiflazz', providerCode: 'TSEL10', brand: 'Telkomsel', buyPrice: 10500, sellPrice: 11000, active: true, createdAt: '2024-01-01' },
  { id: 'p2', name: 'Pulsa XL 20.000', photoDataUrl: '', categoryId: 'pulsa', provider: 'digiflazz', providerCode: 'XL20', brand: 'XL Axiata', buyPrice: 20500, sellPrice: 21000, active: true, createdAt: '2024-01-01' },
  { id: 'p3', name: 'ML 86 Diamonds', photoDataUrl: '', categoryId: 'game', provider: 'digiflazz', providerCode: 'MLBB86', brand: 'Mobile Legends', buyPrice: 18500, sellPrice: 20000, active: true, createdAt: '2024-01-01' },
  { id: 'p4', name: 'Token PLN 50.000', photoDataUrl: '', categoryId: 'pln', provider: 'digiflazz', providerCode: 'PLN50', brand: 'PLN', buyPrice: 51000, sellPrice: 52000, active: true, createdAt: '2024-01-01' },
  { id: 'p5', name: 'GoPay 50.000', photoDataUrl: '', categoryId: 'ewallet', provider: 'vip', providerCode: 'GOPAY50', brand: 'GoPay', buyPrice: 50500, sellPrice: 51500, active: true, createdAt: '2024-01-01' },
];

const D_PROVIDER: ProviderConfig = {
  digiflazz: { username: '', apiKey: '', webhookUrl: '', enabled: false, balance: 0 },
  vipReseller: { memberId: '', apiKey: '', webhookUrl: '', enabled: false, balance: 0 },
};

const D_PAYMENT: PaymentGatewayConfig = {
  duitku: { merchantCode: '', apiKey: '', callbackUrl: '', returnUrl: '', enabled: false },
  ipaymu: { va: '', apiKey: '', callbackUrl: '', returnUrl: '', enabled: false },
  tripay: { apiKey: '', merchantCode: '', privateKey: '', callbackUrl: '', enabled: false },
};

const D_PRIORITY: ProviderPriority[] = [
  { categoryId: 'game', categoryName: 'Top Up Game', primary: 'digiflazz', backup: 'vip' },
  { categoryId: 'pulsa', categoryName: 'Pulsa', primary: 'digiflazz', backup: 'vip' },
  { categoryId: 'ppob', categoryName: 'PPOB', primary: 'digiflazz', backup: 'vip' },
  { categoryId: 'pln', categoryName: 'PLN', primary: 'digiflazz', backup: 'vip' },
  { categoryId: 'ewallet', categoryName: 'E-Wallet', primary: 'vip', backup: 'digiflazz' },
];

const D_MARKUP: MarkupRule[] = [
  { id: 'm1', type: 'category', targetId: 'pulsa', targetName: 'Pulsa', value: 1000, isPercentage: false },
  { id: 'm2', type: 'category', targetId: 'game', targetName: 'Top Up Game', value: 1500, isPercentage: false },
  { id: 'm3', type: 'category', targetId: 'pln', targetName: 'PLN', value: 2000, isPercentage: false },
  { id: 'm4', type: 'category', targetId: 'ppob', targetName: 'PPOB', value: 2500, isPercentage: false },
];

const D_RESELLERS: Reseller[] = [
  { id: 'r1', name: 'Budi Santoso', email: 'budi@example.com', whatsapp: '081234567890', username: 'budi01', password: 'Reseller@123', balance: 150000, status: 'active', createdAt: '2024-01-01' },
  { id: 'r2', name: 'Siti Rahayu', email: 'siti@example.com', whatsapp: '082345678901', username: 'siti02', password: 'Reseller@123', balance: 75000, status: 'active', createdAt: '2024-01-05' },
];

const D_REGISTRATIONS: ResellerRegistration[] = [
  { id: 'reg1', name: 'Ahmad Fauzi', email: 'ahmad@example.com', whatsapp: '083456789012', message: 'Ingin bergabung jadi reseller game', status: 'pending', createdAt: new Date().toISOString() },
];

const D_DEPOSITS: Deposit[] = [
  { id: 'd1', resellerId: 'r1', resellerName: 'Budi Santoso', amount: 100000, method: 'BCA', note: 'Transfer BCA', status: 'approved', createdAt: '2024-01-02', approvedAt: '2024-01-02' },
  { id: 'd2', resellerId: 'r2', resellerName: 'Siti Rahayu', amount: 50000, method: 'BRI', note: 'Transfer BRI', status: 'pending', createdAt: new Date().toISOString() },
];

const D_MUTATIONS: WalletMutation[] = [
  { id: 'wm1', resellerId: 'r1', resellerName: 'Budi Santoso', type: 'deposit', amount: 100000, balanceBefore: 50000, balanceAfter: 150000, description: 'Deposit via BCA', createdAt: '2024-01-02' },
  { id: 'wm2', resellerId: 'r1', resellerName: 'Budi Santoso', type: 'transaction', amount: -20000, balanceBefore: 150000, balanceAfter: 130000, description: 'Beli ML 86 Diamonds', createdAt: '2024-01-03' },
];

const D_TESTIMONIALS: Testimonial[] = [
  { id: 't1', name: 'Andi Setiawan', role: 'Reseller Aktif', message: 'Layanan sangat cepat dan responsif. Deposit langsung diproses. Recommended!', photoDataUrl: '', rating: 5, active: true, createdAt: '2024-01-01' },
  { id: 't2', name: 'Dewi Lestari', role: 'Pelanggan Tetap', message: 'Top up game selalu instan, harga murah. Sudah 2 tahun pakai SHIELACOM CELL!', photoDataUrl: '', rating: 5, active: true, createdAt: '2024-01-02' },
];

const D_ARTICLES: Article[] = [
  { id: 'a1', title: 'Cara Top Up Mobile Legends yang Mudah dan Murah', content: 'Mobile Legends adalah salah satu game terpopuler di Indonesia. Berikut cara top up diamonds ML dengan mudah...', thumbnailDataUrl: '', category: 'Tips & Trik', status: 'published', createdAt: '2024-01-01' },
];

const D_FAQS: FAQItem[] = [
  { id: 'f1', question: 'Berapa lama proses transaksi berlangsung?', answer: 'Proses transaksi berlangsung sangat cepat, biasanya selesai dalam hitungan detik hingga maksimal 5 menit.' },
  { id: 'f2', question: 'Apa saja metode pembayaran yang tersedia?', answer: 'Transfer Bank, GoPay, OVO, DANA, ShopeePay, dan berbagai payment gateway lainnya.' },
  { id: 'f3', question: 'Bagaimana jika transaksi gagal?', answer: 'Jika transaksi gagal, saldo akan dikembalikan otomatis dalam 1x24 jam.' },
  { id: 'f4', question: 'Apakah ada minimum pembelian?', answer: 'Tidak ada minimum pembelian. Anda bisa membeli mulai dari nominal terkecil.' },
  { id: 'f5', question: 'Bagaimana cara menjadi reseller?', answer: 'Silakan hubungi admin via WhatsApp untuk pendaftaran reseller.' },
  { id: 'f6', question: 'Apakah bisa transaksi 24 jam?', answer: 'Ya! Layanan tersedia 24 jam sehari, 7 hari seminggu.' },
];

const D_TRANSACTIONS: Transaction[] = [
  { id: 'tx1', invoiceId: 'INV-20240101-001', product: 'Pulsa Telkomsel 50rb', destination: '08123456789', amount: 51000, profit: 1000, status: 'success', createdAt: '2024-01-01 10:30' },
  { id: 'tx2', invoiceId: 'INV-20240101-002', product: 'Token PLN 100rb', destination: '123456789012', amount: 103000, profit: 2000, status: 'success', createdAt: '2024-01-01 11:00' },
  { id: 'tx3', invoiceId: 'INV-20240101-003', product: 'GoPay 50rb', destination: '08198765432', amount: 51500, profit: 1000, status: 'processing', createdAt: '2024-01-01 11:30' },
  { id: 'tx4', invoiceId: 'INV-20240101-004', product: 'ML 100 Diamonds', destination: '123456789', amount: 25000, profit: 1500, status: 'pending', createdAt: '2024-01-01 12:00' },
  { id: 'tx5', invoiceId: 'INV-20240101-005', product: 'Paket Data XL 10GB', destination: '08776543210', amount: 75000, profit: 3000, status: 'failed', createdAt: '2024-01-01 12:30' },
];

const D_LOGS: SystemLog[] = [
  { id: 'l1', action: 'LOGIN', description: 'Admin login ke dashboard', user: 'admin', createdAt: new Date().toISOString() },
];

const D_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', type: 'registration', title: 'Pendaftaran Reseller Baru', message: 'Ahmad Fauzi mendaftar sebagai reseller', read: false, createdAt: new Date().toISOString() },
  { id: 'n2', type: 'deposit', title: 'Deposit Menunggu Konfirmasi', message: 'Siti Rahayu mengajukan deposit Rp 50.000', read: false, createdAt: new Date().toISOString() },
];

// ============================================================
// STORES
// ============================================================

function makeStore<T>(key: string, defaults: T, eventKey: string) {
  return {
    get: (): T => get(key, defaults),
    set: (val: T) => { set(key, val); notifyUpdate(eventKey); },
  };
}

export const siteSettingsStore = makeStore<SiteSettings>('sc_site_settings', D_SITE, 'siteSettings');
export const socialMediaStore = makeStore<SocialMedia>('sc_social_media', D_SOCIAL, 'socialMedia');
export const seoStore = makeStore<SeoSettings>('sc_seo', D_SEO, 'seo');
export const cmsStore = makeStore<CmsContent>('sc_cms', D_CMS, 'cms');
export const providerConfigStore = makeStore<ProviderConfig>('sc_provider_config', D_PROVIDER, 'provider');
export const paymentGatewayStore = makeStore<PaymentGatewayConfig>('sc_payment_gw', D_PAYMENT, 'payment');
export const providerPriorityStore = makeStore<ProviderPriority[]>('sc_provider_priority', D_PRIORITY, 'priority');
export const markupStore = makeStore<MarkupRule[]>('sc_markup', D_MARKUP, 'markup');

// Banner store with CRUD
export const bannerStore = {
  get: (): Banner[] => get('sc_banners', D_BANNERS),
  set: (v: Banner[]) => { set('sc_banners', v); notifyUpdate('banners'); },
  add: (b: Omit<Banner, 'id'>) => {
    const all = bannerStore.get();
    const n = { ...b, id: uid() };
    bannerStore.set([...all, n]);
    logAction('BANNER_ADD', `Menambah banner: ${b.title}`);
    return n;
  },
  update: (id: string, b: Partial<Banner>) => {
    bannerStore.set(bannerStore.get().map(x => x.id === id ? { ...x, ...b } : x));
    logAction('BANNER_UPDATE', `Mengubah banner: ${id}`);
  },
  remove: (id: string) => {
    bannerStore.set(bannerStore.get().filter(x => x.id !== id));
    logAction('BANNER_DELETE', `Menghapus banner: ${id}`);
  },
};

// Category store
export const categoryStore = {
  get: (): Category[] => get('sc_categories', D_CATEGORIES),
  set: (v: Category[]) => { set('sc_categories', v); notifyUpdate('categories'); },
  add: (c: Omit<Category, 'id'>) => {
    const all = categoryStore.get();
    const n = { ...c, id: uid() };
    categoryStore.set([...all, n]);
    logAction('CATEGORY_ADD', `Menambah kategori: ${c.name}`);
    return n;
  },
  update: (id: string, c: Partial<Category>) => {
    categoryStore.set(categoryStore.get().map(x => x.id === id ? { ...x, ...c } : x));
    logAction('CATEGORY_UPDATE', `Mengubah kategori: ${id}`);
  },
  remove: (id: string) => {
    categoryStore.set(categoryStore.get().filter(x => x.id !== id));
  },
};

// Product store
export const productStore = {
  get: (): Product[] => get('sc_products', D_PRODUCTS),
  set: (v: Product[]) => { set('sc_products', v); notifyUpdate('products'); },
  add: (p: Omit<Product, 'id'>) => {
    const all = productStore.get();
    const n = { ...p, id: uid() };
    productStore.set([...all, n]);
    logAction('PRODUCT_ADD', `Menambah produk: ${p.name}`);
    return n;
  },
  update: (id: string, p: Partial<Product>) => {
    productStore.set(productStore.get().map(x => x.id === id ? { ...x, ...p } : x));
    logAction('PRODUCT_UPDATE', `Mengubah produk: ${id}`);
  },
  remove: (id: string) => {
    productStore.set(productStore.get().filter(x => x.id !== id));
    logAction('PRODUCT_DELETE', `Menghapus produk: ${id}`);
  },
};

// Reseller store
export const resellerStore = {
  get: (): Reseller[] => get('sc_resellers', D_RESELLERS),
  set: (v: Reseller[]) => { set('sc_resellers', v); notifyUpdate('resellers'); },
  add: (r: Omit<Reseller, 'id'>) => {
    const all = resellerStore.get();
    const n = { ...r, id: uid() };
    resellerStore.set([...all, n]);
    logAction('RESELLER_ADD', `Menambah reseller: ${r.name}`);
    return n;
  },
  update: (id: string, r: Partial<Reseller>) => {
    resellerStore.set(resellerStore.get().map(x => x.id === id ? { ...x, ...r } : x));
  },
  remove: (id: string) => {
    resellerStore.set(resellerStore.get().filter(x => x.id !== id));
  },
  adjustBalance: (id: string, amount: number, description: string) => {
    const resellers = resellerStore.get();
    const reseller = resellers.find(r => r.id === id);
    if (!reseller) return;
    const before = reseller.balance;
    const after = before + amount;
    resellerStore.set(resellers.map(r => r.id === id ? { ...r, balance: after } : r));
    // Record mutation
    const mutations = walletMutationStore.get();
    const mutation: WalletMutation = {
      id: uid(),
      resellerId: id,
      resellerName: reseller.name,
      type: amount > 0 ? 'deposit' : 'debit',
      amount,
      balanceBefore: before,
      balanceAfter: after,
      description,
      createdAt: new Date().toLocaleString('id-ID'),
    };
    walletMutationStore.set([mutation, ...mutations]);
  },
};

export const registrationStore = {
  get: (): ResellerRegistration[] => get('sc_registrations', D_REGISTRATIONS),
  set: (v: ResellerRegistration[]) => { set('sc_registrations', v); notifyUpdate('registrations'); },
  add: (r: Omit<ResellerRegistration, 'id'>) => {
    const all = registrationStore.get();
    const n = { ...r, id: uid() };
    registrationStore.set([...all, n]);
    addNotification({ type: 'registration', title: 'Pendaftaran Reseller Baru', message: `${r.name} mendaftar sebagai reseller` });
    return n;
  },
  update: (id: string, r: Partial<ResellerRegistration>) => {
    registrationStore.set(registrationStore.get().map(x => x.id === id ? { ...x, ...r } : x));
  },
};

export const depositStore = {
  get: (): Deposit[] => get('sc_deposits', D_DEPOSITS),
  set: (v: Deposit[]) => { set('sc_deposits', v); notifyUpdate('deposits'); },
  add: (d: Omit<Deposit, 'id'>) => {
    const all = depositStore.get();
    const n = { ...d, id: uid() };
    depositStore.set([...all, n]);
    addNotification({ type: 'deposit', title: 'Deposit Baru Menunggu', message: `${d.resellerName} deposit Rp ${d.amount.toLocaleString('id-ID')}` });
    return n;
  },
  approve: (id: string) => {
    const deposits = depositStore.get();
    const deposit = deposits.find(d => d.id === id);
    if (!deposit) return;
    depositStore.set(deposits.map(d => d.id === id ? { ...d, status: 'approved', approvedAt: new Date().toLocaleString('id-ID') } : d));
    resellerStore.adjustBalance(deposit.resellerId, deposit.amount, `Deposit disetujui: ${deposit.method}`);
    logAction('DEPOSIT_APPROVE', `Approve deposit ${deposit.resellerName}: Rp ${deposit.amount.toLocaleString('id-ID')}`);
  },
  reject: (id: string) => {
    depositStore.set(depositStore.get().map(d => d.id === id ? { ...d, status: 'rejected' } : d));
    logAction('DEPOSIT_REJECT', `Tolak deposit ${id}`);
  },
  addManual: (resellerId: string, amount: number, description: string) => {
    const reseller = resellerStore.get().find(r => r.id === resellerId);
    if (!reseller) return;
    resellerStore.adjustBalance(resellerId, amount, description);
    logAction(amount > 0 ? 'DEPOSIT_MANUAL' : 'DEBIT_MANUAL', `${amount > 0 ? 'Tambah' : 'Kurangi'} saldo ${reseller.name}: Rp ${Math.abs(amount).toLocaleString('id-ID')}`);
  },
};

export const walletMutationStore = {
  get: (): WalletMutation[] => get('sc_mutations', D_MUTATIONS),
  set: (v: WalletMutation[]) => { set('sc_mutations', v); },
};

export const testimonialStore = {
  get: (): Testimonial[] => get('sc_testimonials', D_TESTIMONIALS),
  set: (v: Testimonial[]) => { set('sc_testimonials', v); notifyUpdate('testimonials'); },
  add: (t: Omit<Testimonial, 'id'>) => {
    const all = testimonialStore.get();
    const n = { ...t, id: uid() };
    testimonialStore.set([...all, n]);
    return n;
  },
  update: (id: string, t: Partial<Testimonial>) => {
    testimonialStore.set(testimonialStore.get().map(x => x.id === id ? { ...x, ...t } : x));
  },
  remove: (id: string) => {
    testimonialStore.set(testimonialStore.get().filter(x => x.id !== id));
  },
};

export const articleStore = {
  get: (): Article[] => get('sc_articles', D_ARTICLES),
  set: (v: Article[]) => { set('sc_articles', v); notifyUpdate('articles'); },
  add: (a: Omit<Article, 'id'>) => {
    const all = articleStore.get();
    const n = { ...a, id: uid() };
    articleStore.set([...all, n]);
    return n;
  },
  update: (id: string, a: Partial<Article>) => {
    articleStore.set(articleStore.get().map(x => x.id === id ? { ...x, ...a } : x));
  },
  remove: (id: string) => {
    articleStore.set(articleStore.get().filter(x => x.id !== id));
  },
};

export const faqStore = {
  get: (): FAQItem[] => get('sc_faqs', D_FAQS),
  set: (v: FAQItem[]) => { set('sc_faqs', v); notifyUpdate('faqs'); },
  add: (f: Omit<FAQItem, 'id'>) => {
    const all = faqStore.get();
    const n = { ...f, id: uid() };
    faqStore.set([...all, n]);
    return n;
  },
  update: (id: string, f: Omit<FAQItem, 'id'>) => {
    faqStore.set(faqStore.get().map(x => x.id === id ? { ...f, id } : x));
  },
  remove: (id: string) => {
    faqStore.set(faqStore.get().filter(x => x.id !== id));
  },
};

export const transactionStore = {
  get: (): Transaction[] => get('sc_transactions', D_TRANSACTIONS),
  set: (v: Transaction[]) => { set('sc_transactions', v); notifyUpdate('transactions'); },
  findByInvoice: (invoiceId: string): Transaction | undefined =>
    transactionStore.get().find(t => t.invoiceId.toLowerCase() === invoiceId.toLowerCase()),
};

export const systemLogStore = {
  get: (): SystemLog[] => get('sc_logs', D_LOGS),
  set: (v: SystemLog[]) => { set('sc_logs', v); },
};

export const notificationStore = {
  get: (): AppNotification[] => get('sc_notifications', D_NOTIFICATIONS),
  set: (v: AppNotification[]) => { set('sc_notifications', v); notifyUpdate('notifications'); },
  unread: (): number => notificationStore.get().filter(n => !n.read).length,
  markRead: (id: string) => {
    notificationStore.set(notificationStore.get().map(n => n.id === id ? { ...n, read: true } : n));
  },
  markAllRead: () => {
    notificationStore.set(notificationStore.get().map(n => ({ ...n, read: true })));
  },
};

// Helper functions
export function logAction(action: string, description: string, user = 'admin') {
  const logs = systemLogStore.get();
  const newLog: SystemLog = { id: uid(), action, description, user, createdAt: new Date().toLocaleString('id-ID') };
  systemLogStore.set([newLog, ...logs].slice(0, 500));
}

export function addNotification(n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) {
  const all = notificationStore.get();
  const newNotif: AppNotification = { ...n, id: uid(), read: false, createdAt: new Date().toLocaleString('id-ID') };
  notificationStore.set([newNotif, ...all].slice(0, 100));
}

// Digiflazz sync — adds sample products
export function syncDigiflazzProducts() {
  const products = productStore.get();
  const digiProducts: Omit<Product, 'id'>[] = [
    { name: 'Pulsa Telkomsel 5.000', photoDataUrl: '', categoryId: 'pulsa', provider: 'digiflazz', providerCode: 'TSEL5', brand: 'Telkomsel', buyPrice: 5500, sellPrice: 6000, active: true, createdAt: new Date().toLocaleDateString() },
    { name: 'Pulsa Telkomsel 10.000', photoDataUrl: '', categoryId: 'pulsa', provider: 'digiflazz', providerCode: 'TSEL10', brand: 'Telkomsel', buyPrice: 10500, sellPrice: 11000, active: true, createdAt: new Date().toLocaleDateString() },
    { name: 'Pulsa XL 5.000', photoDataUrl: '', categoryId: 'pulsa', provider: 'digiflazz', providerCode: 'XL5', brand: 'XL', buyPrice: 5500, sellPrice: 6000, active: true, createdAt: new Date().toLocaleDateString() },
    { name: 'Paket XL 10GB 30hr', photoDataUrl: '', categoryId: 'data', provider: 'digiflazz', providerCode: 'XLDATA10', brand: 'XL', buyPrice: 62000, sellPrice: 65000, active: true, createdAt: new Date().toLocaleDateString() },
    { name: 'ML 86 Diamonds', photoDataUrl: '', categoryId: 'game', provider: 'digiflazz', providerCode: 'MLBB86', brand: 'Mobile Legends', buyPrice: 18500, sellPrice: 20000, active: true, createdAt: new Date().toLocaleDateString() },
    { name: 'ML 172 Diamonds', photoDataUrl: '', categoryId: 'game', provider: 'digiflazz', providerCode: 'MLBB172', brand: 'Mobile Legends', buyPrice: 37500, sellPrice: 39000, active: true, createdAt: new Date().toLocaleDateString() },
    { name: 'FF 70 Diamonds', photoDataUrl: '', categoryId: 'game', provider: 'digiflazz', providerCode: 'FF70', brand: 'Free Fire', buyPrice: 14000, sellPrice: 16000, active: true, createdAt: new Date().toLocaleDateString() },
    { name: 'Token PLN 20.000', photoDataUrl: '', categoryId: 'pln', provider: 'digiflazz', providerCode: 'PLN20', brand: 'PLN', buyPrice: 21000, sellPrice: 22000, active: true, createdAt: new Date().toLocaleDateString() },
    { name: 'Token PLN 50.000', photoDataUrl: '', categoryId: 'pln', provider: 'digiflazz', providerCode: 'PLN50', brand: 'PLN', buyPrice: 51000, sellPrice: 52000, active: true, createdAt: new Date().toLocaleDateString() },
    { name: 'Token PLN 100.000', photoDataUrl: '', categoryId: 'pln', provider: 'digiflazz', providerCode: 'PLN100', brand: 'PLN', buyPrice: 102000, sellPrice: 103000, active: true, createdAt: new Date().toLocaleDateString() },
    { name: 'GoPay 20.000', photoDataUrl: '', categoryId: 'ewallet', provider: 'digiflazz', providerCode: 'GOPAY20', brand: 'GoPay', buyPrice: 20500, sellPrice: 21000, active: true, createdAt: new Date().toLocaleDateString() },
    { name: 'GoPay 50.000', photoDataUrl: '', categoryId: 'ewallet', provider: 'digiflazz', providerCode: 'GOPAY50', brand: 'GoPay', buyPrice: 50500, sellPrice: 51500, active: true, createdAt: new Date().toLocaleDateString() },
    { name: 'OVO 50.000', photoDataUrl: '', categoryId: 'ewallet', provider: 'digiflazz', providerCode: 'OVO50', brand: 'OVO', buyPrice: 50500, sellPrice: 51500, active: true, createdAt: new Date().toLocaleDateString() },
    { name: 'DANA 50.000', photoDataUrl: '', categoryId: 'ewallet', provider: 'digiflazz', providerCode: 'DANA50', brand: 'DANA', buyPrice: 50500, sellPrice: 51500, active: true, createdAt: new Date().toLocaleDateString() },
    { name: 'BPJS Kesehatan', photoDataUrl: '', categoryId: 'ppob', provider: 'digiflazz', providerCode: 'BPJSKS', brand: 'BPJS', buyPrice: 0, sellPrice: 2500, active: true, createdAt: new Date().toLocaleDateString() },
  ];
  const existingCodes = new Set(products.map(p => p.providerCode));
  const newProducts = digiProducts.filter(p => !existingCodes.has(p.providerCode));
  productStore.set([...products, ...newProducts.map(p => ({ ...p, id: uid() }))]);
  logAction('DIGIFLAZZ_SYNC', `Sync ${newProducts.length} produk dari Digiflazz`);
  return newProducts.length;
}
