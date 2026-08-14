import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, XCircle, Clock, Copy, Check, Home, ShoppingCart, Loader2,
  MessageSquare, Share2, ShoppingBag, CreditCard, Receipt, AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import { checkOrder, type OrderStatus } from '@/lib/order-api';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { getCategoryById } from '@/lib/product-slugs';

/* ─────────────────────────────────────────────────────────────
   COUNTDOWN — reuse pola dari Payment.tsx (diduplikasi kecil,
   tidak mengubah Payment.tsx). Tampil hanya saat menunggu pembayaran.
───────────────────────────────────────────────────────────── */
function useCountdown(expiredAt: string) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, Math.floor((new Date(expiredAt).getTime() - Date.now()) / 1000));
      setSeconds(diff);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [expiredAt]);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return { expired: seconds === 0, display: `${pad(h)}:${pad(m)}:${pad(s)}` };
}

/* ─────────────────────────────────────────────────────────────
   STATUS MAPPING — murni presentasi data yang sudah ada di sc_orders
   (payment_status + order_status). Tidak ada field baru.
───────────────────────────────────────────────────────────── */
interface StatusInfo {
  step: number;          // 0..4 — index langkah timeline yang sedang aktif
  success: boolean;
  failed: boolean;       // gagal / dibatalkan / expired / ditolak
  paid: boolean;
  badge: { label: string; className: string };
  heading: string;
  description: string;
  cardClassName: string;
  iconBg: string;
  Icon: typeof CheckCircle2;
  iconColor: string;
}

function resolveStatus(order: OrderStatus): StatusInfo {
  const paid      = order.payment_status === 'paid';
  const success   = order.order_status === 'success';
  const rejected  = order.payment_status === 'rejected';
  const expired   = order.payment_status === 'expired';
  const cancelled = order.order_status === 'cancelled';
  const failed    = order.order_status === 'failed' || cancelled || expired || rejected;
  const processing = order.order_status === 'processing';

  let step = 1;
  if (success) step = 4;
  else if (failed) step = paid ? 2 : 1;
  else if (paid && processing) step = 3;
  else if (paid) step = 2;

  if (success) return {
    step, success, failed, paid,
    badge: { label: 'Selesai', className: 'bg-green-500/15 text-green-600 border-green-500/30' },
    heading: 'Pesanan Selesai',
    description: `${order.product_name} berhasil dikirim`,
    cardClassName: 'bg-green-500/5 border-green-500/20',
    iconBg: 'bg-green-500/15',
    Icon: CheckCircle2, iconColor: 'text-green-500',
  };
  if (failed) {
    if (expired) return {
      step, success, failed, paid,
      badge: { label: 'Expired', className: 'bg-red-500/15 text-red-500 border-red-500/30' },
      heading: 'Waktu Pembayaran Habis',
      description: 'Waktu pembayaran telah habis. Silakan buat pesanan baru.',
      cardClassName: 'bg-red-500/5 border-red-500/20',
      iconBg: 'bg-red-500/15', Icon: XCircle, iconColor: 'text-red-500',
    };
    if (rejected) return {
      step, success, failed, paid,
      badge: { label: 'Ditolak', className: 'bg-red-500/15 text-red-500 border-red-500/30' },
      heading: 'Pembayaran Ditolak',
      description: order.reject_reason || 'Bukti pembayaran ditolak oleh admin',
      cardClassName: 'bg-red-500/5 border-red-500/20',
      iconBg: 'bg-red-500/15', Icon: XCircle, iconColor: 'text-red-500',
    };
    return {
      step, success, failed, paid,
      badge: { label: 'Gagal', className: 'bg-red-500/15 text-red-500 border-red-500/30' },
      heading: 'Transaksi Gagal',
      description: 'Transaksi tidak berhasil diproses',
      cardClassName: 'bg-red-500/5 border-red-500/20',
      iconBg: 'bg-red-500/15', Icon: XCircle, iconColor: 'text-red-500',
    };
  }
  if (paid && processing) return {
    step, success, failed, paid,
    badge: { label: 'Diproses', className: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
    heading: 'Pesanan Diproses',
    description: 'Pembayaran diterima. Pesanan sedang diproses oleh sistem (estimasi 1–5 menit).',
    cardClassName: 'bg-blue-500/5 border-blue-500/20',
    iconBg: 'bg-blue-500/15', Icon: Loader2, iconColor: 'text-blue-500',
  };
  if (paid) return {
    step, success, failed, paid,
    badge: { label: 'Lunas', className: 'bg-green-500/15 text-green-600 border-green-500/30' },
    heading: 'Pembayaran Diterima',
    description: 'Pembayaran telah dikonfirmasi. Pesanan akan segera diproses.',
    cardClassName: 'bg-green-500/5 border-green-500/20',
    iconBg: 'bg-green-500/15', Icon: CheckCircle2, iconColor: 'text-green-500',
  };
  return {
    step, success, failed, paid,
    badge: { label: 'Menunggu Pembayaran', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
    heading: 'Menunggu Pembayaran',
    description: 'Segera selesaikan pembayaran sebelum waktu habis.',
    cardClassName: 'bg-amber-500/5 border-amber-500/20',
    iconBg: 'bg-amber-500/15', Icon: Clock, iconColor: 'text-amber-500',
  };
}

/* ─────────────────────────────────────────────────────────────
   PROGRESS TIMELINE — 5 langkah
───────────────────────────────────────────────────────────── */
const TIMELINE_STEPS = [
  { label: 'Pesanan Dibuat',        icon: ShoppingBag },
  { label: 'Menunggu Pembayaran',   icon: Clock },
  { label: 'Pembayaran Diterima',   icon: CreditCard },
  { label: 'Pesanan Diproses',      icon: Loader2 },
  { label: 'Pesanan Selesai',      icon: CheckCircle2 },
];

function ProgressTimeline({ info }: { info: StatusInfo }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-card">
      <h3 className="font-bold text-foreground mb-4">Status Pesanan</h3>
      <div className="flex items-start justify-between">
        {TIMELINE_STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < info.step || info.success;
          const current = i === info.step && !info.success;
          const isFailedNode = info.failed && i === info.step;
          return (
            <div key={i} className="relative flex flex-1 flex-col items-center">
              {i < TIMELINE_STEPS.length - 1 && (
                <div
                  className={cn('absolute top-4 left-1/2 w-full h-0.5', done ? 'bg-primary' : 'bg-border')}
                  style={{ zIndex: 0 }}
                />
              )}
              <div
                className={cn(
                  'relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0',
                  isFailedNode ? 'bg-red-500 border-red-500 text-white' :
                  done ? 'bg-primary border-primary text-primary-foreground' :
                  current ? 'bg-background border-primary text-primary animate-pulse' :
                  'bg-background border-border text-muted-foreground',
                )}
              >
                {isFailedNode ? <XCircle className="w-4 h-4" />
                  : done ? <Check className="w-4 h-4" />
                  : <Icon className={cn('w-4 h-4', Icon === Loader2 && current && 'animate-spin')} />}
              </div>
              <p className={cn(
                'text-[9px] sm:text-[11px] mt-2 text-center leading-tight font-medium px-0.5',
                (done || current) ? 'text-foreground' : 'text-muted-foreground',
              )}>
                {s.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function OrderStatusPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [categoryLabel, setCategoryLabel] = useState('');

  useEffect(() => {
    if (!invoiceId) return;
    checkOrder(invoiceId)
      .then(setOrder)
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [invoiceId, navigate]);

  // Realtime for status changes (tidak diubah — pola yang sudah ada)
  useEffect(() => {
    if (!invoiceId) return;
    const channel = supabase
      .channel(`order-status-${invoiceId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'sc_orders',
        filter: `invoice_id=eq.${invoiceId}`,
      }, (payload) => { setOrder(payload.new as OrderStatus); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [invoiceId]);

  // Lookup kategori client-side: product_sku → sc_products.category_id → label CATEGORIES
  useEffect(() => {
    if (!order?.product_sku) return;
    supabase
      .from('sc_products')
      .select('category_id')
      .eq('sku', order.product_sku)
      .maybeSingle()
      .then(({ data }) => {
        const catId = (data as { category_id?: string } | null)?.category_id;
        if (catId) setCategoryLabel(getCategoryById(catId)?.label ?? catId);
      })
      .catch(() => {});
  }, [order?.product_sku]);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  // Hook harus dipanggil tanpa kondisi (sebelum early return).
  const expiredAt = order?.expired_at || new Date(Date.now() + 3600000).toISOString();
  const countdown = useCountdown(expiredAt);

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
      <Footer />
    </div>
  );

  if (!order) return null;

  const info = resolveStatus(order);
  const { Icon } = info;

  // Countdown: tampil hanya saat masih menunggu pembayaran (pending, belum expired)
  const showCountdown = !info.paid && !info.success && !info.failed
    && order.payment_status === 'pending';

  const waNumber = '6281234567890';
  const waMessage = info.success
    ? `Halo, saya baru saja berhasil melakukan pembelian ${order.product_name} dengan invoice ${order.invoice_id}. Terima kasih!`
    : `Halo, saya butuh bantuan dengan pesanan invoice ${order.invoice_id}.`;

  const fee = order.payment_fee || 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-lg">
          {/* Status header card */}
          <div className={cn('rounded-2xl p-6 mb-4 text-center border shadow-card', info.cardClassName)}>
            <div className="mb-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: 'transparent' }}>
                <div className={cn('w-16 h-16 rounded-full flex items-center justify-center', info.iconBg)}>
                  <Icon className={cn('w-9 h-9', info.iconColor, Icon === Loader2 && 'animate-spin')} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-xl font-black text-foreground">{info.heading}</h1>
            </div>
            <span className={cn('inline-block text-xs font-bold px-3 py-1 rounded-full border', info.badge.className)}>
              {info.badge.label}
            </span>
            <p className={cn('text-sm mt-3', info.success ? 'text-green-600' : info.failed ? 'text-red-500' : 'text-muted-foreground')}>
              {info.description}
            </p>
          </div>

          {/* Countdown — only when waiting for payment */}
          {showCountdown && (
            <div className={cn('rounded-2xl p-4 mb-4 text-center border', countdown.expired ? 'bg-red-500/5 border-red-500/20' : 'bg-primary/5 border-primary/20')}>
              {countdown.expired ? (
                <div className="flex items-center justify-center gap-2 text-red-500">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-bold">Waktu pembayaran telah habis!</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-1">
                    <Clock className="w-4 h-4" /> Selesaikan pembayaran dalam
                  </div>
                  <p className="text-3xl font-mono font-black text-primary">{countdown.display}</p>
                </>
              )}
            </div>
          )}

          {/* Progress timeline */}
          <ProgressTimeline info={info} />

          {/* SN / Serial Number (if success) */}
          {info.success && order.digiflazz_sn && (
            <div className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-card">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Serial Number / Token</p>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                <code className="flex-1 text-lg font-mono font-bold text-green-600 tracking-wider break-all">{order.digiflazz_sn}</code>
                <Button variant="ghost" size="sm" onClick={() => copyText(order.digiflazz_sn, 'sn')} className="h-8 px-2.5 flex-shrink-0">
                  {copied === 'sn' ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              {order.notes && <p className="text-xs text-muted-foreground mt-2">{order.notes}</p>}
            </div>
          )}

          {/* Ringkasan Pembelian — breakdown lengkap */}
          <div className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-card">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" /> Ringkasan Pembelian
            </h3>
            <div className="space-y-0">
              {[
                { label: 'No. Invoice', value: order.invoice_id, copy: 'invoice' },
                { label: 'Produk', value: order.product_name },
                { label: 'Kategori', value: categoryLabel || '—' },
                { label: 'Nomor Tujuan', value: order.target + (order.target_detail ? ` (${order.target_detail})` : '') },
                { label: 'Nama Pemesan', value: order.buyer_name },
                { label: 'Metode Bayar', value: order.payment_method || '—' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-start gap-2 py-2.5 border-b border-border/30 last:border-0">
                  <span className="text-muted-foreground text-sm flex-shrink-0">{row.label}</span>
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-foreground text-sm font-medium text-right break-all">{row.value}</span>
                    {row.copy && (
                      <Button variant="ghost" size="icon" className="w-6 h-6 flex-shrink-0" onClick={() => copyText(row.value, row.copy!)}>
                        {copied === row.copy ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="mt-3 pt-3 border-t border-border space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Nominal</span>
                <span className="text-foreground font-medium">Rp {(order.product_price || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Biaya Admin</span>
                <span className="text-foreground font-medium">Rp {fee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/50">
                <span className="font-bold text-foreground">Total Bayar</span>
                <span className="font-bold text-primary text-lg">Rp {(order.payment_amount || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              {new Date(order.created_at).toLocaleString('id-ID')}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {info.success && (
              <Button
                onClick={() => { const url = window.location.href; if (navigator.share) { navigator.share({ title: 'Bukti Transaksi SHIELACOM CELL', text: `Invoice: ${order.invoice_id}`, url }); } else { copyText(url, 'share'); } }}
                variant="outline"
                className="w-full h-11 rounded-xl border-primary text-primary hover:bg-primary/5"
              >
                <Share2 className="w-4 h-4 mr-2" /> Bagikan Bukti Transaksi
              </Button>
            )}

            {info.failed && (
              <Button asChild className="w-full h-12 bg-primary text-white btn-glow rounded-xl font-bold">
                <Link to="/products"><ShoppingCart className="w-4 h-4 mr-2" /> Coba Beli Lagi</Link>
              </Button>
            )}

            {info.paid && !info.success && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2 text-sm">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">Pesanan sedang diproses oleh sistem. Halaman ini akan otomatis update. Estimasi: 1–5 menit.</p>
              </div>
            )}

            <Button
              onClick={() => { const msg = encodeURIComponent(waMessage); window.open(`https://wa.me/${waNumber}?text=${msg}`, '_blank'); }}
              variant="outline"
              className="w-full h-11 rounded-xl"
            >
              <MessageSquare className="w-4 h-4 mr-2 text-green-500" /> Hubungi CS via WhatsApp
            </Button>

            <Button asChild variant="ghost" className="w-full h-11 rounded-xl">
              <Link to="/"><Home className="w-4 h-4 mr-2" /> Kembali ke Beranda</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
