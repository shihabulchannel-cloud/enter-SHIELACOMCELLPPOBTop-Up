import { Smartphone, Wifi, Gamepad2, Wallet, Zap, FileText, Tag } from 'lucide-react';
import type { ElementType } from 'react';

// ============================================================
// CATEGORY METADATA — single source of truth for product pages
// ============================================================

export interface CategoryMeta {
  id:          string;
  slug:        string;
  label:       string;
  description: string;
  icon:        ElementType;
  gradient:    string;
  seoTitle:    string;
  seoDesc:     string;
  faq:         { q: string; a: string }[];
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id:          'pulsa',
    slug:        'pulsa',
    label:       'Pulsa',
    description: 'Isi ulang pulsa semua operator dengan harga murah dan proses otomatis.',
    icon:        Smartphone,
    gradient:    'from-blue-500 to-blue-700',
    seoTitle:    'Pulsa Murah Semua Operator | SHIELACOM CELL',
    seoDesc:     'Beli Pulsa Telkomsel, XL, Axis, Indosat, Tri & Smartfren harga terjangkau. Proses otomatis 24 jam.',
    faq: [
      { q: 'Berapa lama proses isi ulang pulsa?', a: 'Proses berlangsung otomatis 1–5 menit setelah pembayaran dikonfirmasi.' },
      { q: 'Apakah bisa isi pulsa ke nomor orang lain?', a: 'Ya, cukup masukkan nomor tujuan yang ingin diisi ulang.' },
      { q: 'Apa yang harus dilakukan jika pulsa tidak masuk?', a: 'Hubungi CS kami via WhatsApp, kami akan membantu pengecekan segera.' },
    ],
  },
  {
    id:          'data',
    slug:        'paket-data',
    label:       'Paket Data',
    description: 'Paket internet semua operator dengan kuota besar dan harga bersaing.',
    icon:        Wifi,
    gradient:    'from-cyan-500 to-cyan-700',
    seoTitle:    'Paket Data Internet Murah Semua Operator | SHIELACOM CELL',
    seoDesc:     'Beli paket data Telkomsel, XL, Axis, Indosat harga murah. Kuota besar, proses cepat.',
    faq: [
      { q: 'Berapa lama proses aktivasi paket data?', a: 'Paket data aktif dalam 1–5 menit setelah pembayaran berhasil.' },
      { q: 'Apakah paket data bisa digunakan langsung?', a: 'Ya, paket langsung aktif ke nomor yang didaftarkan.' },
      { q: 'Paket data apa saja yang tersedia?', a: 'Tersedia berbagai paket mulai dari harian, mingguan, hingga bulanan untuk semua operator.' },
    ],
  },
  {
    id:          'game',
    slug:        'top-up-game',
    label:       'Top Up Game',
    description: 'Top up diamond, UC, koin, dan voucher game favorit dengan harga termurah.',
    icon:        Gamepad2,
    gradient:    'from-purple-500 to-purple-700',
    seoTitle:    'Top Up Game Murah | SHIELACOM CELL',
    seoDesc:     'Top up Mobile Legends, Free Fire, PUBG Mobile, Genshin Impact dan ratusan game lainnya harga terbaik.',
    faq: [
      { q: 'Berapa lama top up game diproses?', a: 'Top up game diproses otomatis dalam hitungan detik setelah pembayaran.' },
      { q: 'Apakah top up game aman?', a: 'Ya, semua transaksi melalui channel resmi game publisher.' },
      { q: 'Apa yang diperlukan untuk top up game?', a: 'Cukup siapkan User ID / ID game Anda. Tidak perlu password akun game.' },
    ],
  },
  {
    id:          'ewallet',
    slug:        'e-wallet',
    label:       'E-Wallet',
    description: 'Top up GoPay, OVO, DANA, ShopeePay dan dompet digital lainnya.',
    icon:        Wallet,
    gradient:    'from-orange-500 to-orange-700',
    seoTitle:    'Top Up E-Wallet Murah | SHIELACOM CELL',
    seoDesc:     'Isi saldo GoPay, OVO, DANA, ShopeePay dengan cepat dan murah. Proses otomatis 24 jam.',
    faq: [
      { q: 'Berapa lama top up e-wallet diproses?', a: 'Saldo masuk dalam 1–5 menit setelah pembayaran dikonfirmasi.' },
      { q: 'Apa yang perlu disiapkan untuk top up?', a: 'Cukup siapkan nomor HP yang terdaftar di e-wallet Anda.' },
      { q: 'Apakah bisa top up ke e-wallet orang lain?', a: 'Ya, masukkan nomor HP tujuan saat melakukan pembelian.' },
    ],
  },
  {
    id:          'pln',
    slug:        'token-pln',
    label:       'Token PLN',
    description: 'Beli token listrik PLN prepaid dengan nominal lengkap dan proses instan.',
    icon:        Zap,
    gradient:    'from-yellow-500 to-yellow-700',
    seoTitle:    'Token Listrik PLN Murah | SHIELACOM CELL',
    seoDesc:     'Beli token listrik PLN prepaid nominal 20rb–1jt. Proses otomatis 24 jam.',
    faq: [
      { q: 'Berapa lama token PLN diterima?', a: 'Token PLN langsung dikirim via notifikasi dalam 1–5 menit.' },
      { q: 'Apa yang diperlukan untuk beli token listrik?', a: 'Siapkan nomor ID pelanggan (nomor meter) yang tertera di struk PLN.' },
      { q: 'Token PLN berlaku berapa lama?', a: 'Token listrik PLN tidak memiliki tanggal kadaluarsa.' },
    ],
  },
  {
    id:          'ppob',
    slug:        'ppob',
    label:       'PPOB / Tagihan',
    description: 'Bayar tagihan BPJS, internet, TV kabel, PDAM dan berbagai tagihan lainnya.',
    icon:        FileText,
    gradient:    'from-red-500 to-red-700',
    seoTitle:    'Bayar Tagihan PPOB Murah | SHIELACOM CELL',
    seoDesc:     'Bayar tagihan BPJS, PLN pascabayar, internet, TV kabel, PDAM dan tagihan lainnya dengan mudah.',
    faq: [
      { q: 'Apa saja tagihan yang bisa dibayar?', a: 'BPJS Kesehatan, PLN pascabayar, internet/IndiHome, TV kabel, PDAM, dan banyak lagi.' },
      { q: 'Berapa lama pembayaran tagihan diproses?', a: 'Pembayaran diproses real-time dan langsung terkonfirmasi.' },
      { q: 'Apakah ada biaya admin?', a: 'Biaya admin sangat kecil dan sudah termasuk dalam harga yang ditampilkan.' },
    ],
  },
  {
    id:          'voucher',
    slug:        'voucher',
    label:       'Voucher Digital',
    description: 'Berbagai voucher digital untuk kebutuhan entertainment dan produktivitas.',
    icon:        Tag,
    gradient:    'from-pink-500 to-pink-700',
    seoTitle:    'Voucher Digital Murah | SHIELACOM CELL',
    seoDesc:     'Beli voucher digital untuk game, streaming, dan aplikasi favorit Anda dengan harga terbaik.',
    faq: [
      { q: 'Voucher apa saja yang tersedia?', a: 'Tersedia voucher game, streaming, aplikasi produktivitas, dan banyak lagi.' },
      { q: 'Bagaimana cara menggunakan voucher?', a: 'Kode voucher dikirim otomatis setelah pembayaran berhasil, lalu masukkan di aplikasi tujuan.' },
      { q: 'Apakah voucher bisa dikembalikan?', a: 'Voucher digital tidak dapat dikembalikan setelah kode dikirimkan.' },
    ],
  },
];

// ── Lookup maps ──────────────────────────────────────────────
const BY_ID:   Record<string, CategoryMeta> = {};
const BY_SLUG: Record<string, CategoryMeta> = {};
CATEGORIES.forEach(c => { BY_ID[c.id] = c; BY_SLUG[c.slug] = c; });

export function getCategoryById(id: string):     CategoryMeta | null { return BY_ID[id]   ?? null; }
export function getCategoryBySlug(slug: string): CategoryMeta | null { return BY_SLUG[slug] ?? null; }
export function categoryToSlug(id: string):      string              { return BY_ID[id]?.slug ?? id; }

// ============================================================
// BRAND SLUG UTILITIES
// ============================================================

/** "Mobile Legends" → "mobile-legends" */
export function brandToSlug(brand: string): string {
  return brand
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Find brand name from slug by comparing against available brands */
export function slugToBrand(slug: string, brands: string[]): string | null {
  return brands.find(b => brandToSlug(b) === slug) ?? null;
}

// ============================================================
// SEO HELPERS — set document.title + meta description
// ============================================================

export function setCategoryMeta(
  category: CategoryMeta | null,
  brandName: string | null,
  siteName = 'SHIELACOM CELL',
): void {
  let title: string;
  let description: string;

  if (category && brandName) {
    title       = `${category.label} ${brandName} Murah | ${siteName}`;
    description = `Beli ${category.label} ${brandName} harga terjangkau, proses otomatis 24 jam. ${category.description}`;
  } else if (category) {
    title       = category.seoTitle.replace('SHIELACOM CELL', siteName);
    description = category.seoDesc;
  } else {
    title       = `Katalog Produk Digital | ${siteName}`;
    description = `Pulsa, paket data, top up game, e-wallet, token PLN, PPOB & voucher. Proses otomatis 24 jam.`;
  }

  document.title = title;

  let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!metaDesc) {
    metaDesc      = document.createElement('meta');
    metaDesc.name = 'description';
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = description;
}
