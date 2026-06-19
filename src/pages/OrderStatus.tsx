import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, Copy, Check, Home, ShoppingCart, Loader2, MessageSquare, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import { checkOrder, type OrderStatus } from '@/lib/order-api';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

function StatusIcon({ status, paymentStatus }: { status: string; paymentStatus?: string }) {
  if (status === 'success') return (
    <div className="relative">
      <div className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
        <div className="w-16 h-16 rounded-full bg-green-500/25 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
      </div>
    </div>
  );
  if (status === 'failed' || status === 'cancelled' || status === 'expired' || paymentStatus === 'rejected') return (
    <div className="relative">
      <div className="w-20 h-20 rounded-full bg-red-500/15 flex items-center justify-center mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-500/25 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
      </div>
    </div>
  );
  return (
    <div className="relative">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <Clock className="w-10 h-10 text-primary animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function OrderStatusPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) return;
    checkOrder(invoiceId)
      .then(setOrder)
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [invoiceId, navigate]);

  // Realtime for status changes
  useEffect(() => {
    if (!invoiceId) return;
    const channel = supabase
      .channel(`order-status-${invoiceId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sc_orders',
        filter: `invoice_id=eq.${invoiceId}`,
      }, (payload) => {
        setOrder(payload.new as OrderStatus);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [invoiceId]);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

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

  const isSuccess = order.order_status === 'success';
  const isFailed = order.order_status === 'failed'
    || order.order_status === 'cancelled'
    || order.payment_status === 'expired'
    || order.payment_status === 'rejected';
  const isProcessing = !isSuccess && !isFailed;
  const isRejected = order.order_status === 'cancelled' || order.payment_status === 'rejected';

  const waNumber = '6281234567890';
  const waMessage = isSuccess
    ? `Halo, saya baru saja berhasil melakukan pembelian ${order.product_name} dengan invoice ${order.invoice_id}. Terima kasih!`
    : `Halo, saya butuh bantuan dengan pesanan invoice ${order.invoice_id}.`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-lg">
          {/* Status card */}
          <div className={cn('rounded-2xl p-6 mb-4 text-center border',
            isSuccess ? 'bg-green-500/5 border-green-500/20' :
            isFailed ? 'bg-red-500/5 border-red-500/20' :
            'bg-primary/5 border-primary/20'
          )}>
            <div className="mb-4">
              <StatusIcon status={order.order_status} paymentStatus={order.payment_status} />
            </div>
            <h1 className="text-xl font-black text-foreground mb-1">
              {isSuccess ? 'Pembayaran Berhasil!'
                : isRejected ? 'Pembayaran Ditolak'
                : isFailed ? 'Pembayaran Gagal'
                : 'Sedang Diproses'}
            </h1>
            <p className={cn('text-sm', isSuccess ? 'text-green-600' : isFailed ? 'text-red-500' : 'text-muted-foreground')}>
              {isSuccess
                ? `${order.product_name} berhasil dikirim`
                : isRejected
                ? (order.reject_reason || 'Bukti pembayaran ditolak oleh admin')
                : order.payment_status === 'expired'
                ? 'Waktu pembayaran telah habis'
                : isFailed
                ? 'Transaksi tidak berhasil diproses'
                : 'Pesanan sedang dalam antrian, mohon tunggu sebentar...'}
            </p>
          </div>

          {/* SN / Serial Number (if success) */}
          {isSuccess && order.digiflazz_sn && (
            <div className="bg-card border border-border rounded-2xl p-5 mb-4">
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

          {/* Order Details */}
          <div className="bg-card border border-border rounded-2xl p-5 mb-4">
            <h3 className="font-bold text-foreground mb-3">Detail Transaksi</h3>
            <div className="space-y-2">
              {[
                { label: 'No. Invoice', value: order.invoice_id, copy: 'invoice' },
                { label: 'Produk', value: order.product_name },
                { label: 'Tujuan', value: order.target + (order.target_detail ? ` (${order.target_detail})` : '') },
                { label: 'Nama', value: order.buyer_name },
                { label: 'Metode Bayar', value: order.payment_method },
                { label: 'Total Bayar', value: `Rp ${(order.payment_amount || 0).toLocaleString('id-ID')}` },
                { label: 'Tanggal', value: new Date(order.created_at).toLocaleString('id-ID') },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-start gap-2 py-2 border-b border-border/30 last:border-0">
                  <span className="text-muted-foreground text-sm flex-shrink-0">{row.label}</span>
                  <div className="flex items-center gap-1">
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
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {isSuccess && (
              <Button
                onClick={() => { const url = window.location.href; if (navigator.share) { navigator.share({ title: 'Bukti Transaksi SHIELACOM CELL', text: `Invoice: ${order.invoice_id}`, url }); } else { copyText(url, 'share'); } }}
                variant="outline"
                className="w-full h-11 rounded-xl border-primary text-primary hover:bg-primary/5"
              >
                <Share2 className="w-4 h-4 mr-2" /> Bagikan Bukti Transaksi
              </Button>
            )}

            {isFailed && (
              <Button asChild className="w-full h-12 bg-primary text-white btn-glow rounded-xl font-bold">
                <Link to="/products"><ShoppingCart className="w-4 h-4 mr-2" /> Coba Beli Lagi</Link>
              </Button>
            )}

            {isProcessing && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-2 text-sm">
                <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0 mt-0.5" />
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
