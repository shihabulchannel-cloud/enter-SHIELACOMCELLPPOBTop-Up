import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Clock, RefreshCw, AlertCircle, CheckCircle2, XCircle, Smartphone, Building2, QrCode, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { checkOrder, type OrderStatus } from '@/lib/order-api';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

function getMethodIcon(method: string) {
  if (method === 'QRIS' || method === 'QRISC') return QrCode;
  if (['GOPAY', 'OVO', 'DANA', 'SHOPEEPAY'].includes(method)) return Smartphone;
  return Building2;
}

function getMethodType(method: string): 'va' | 'qris' | 'ewallet' {
  if (method === 'QRIS' || method === 'QRISC') return 'qris';
  if (['GOPAY', 'OVO', 'DANA', 'SHOPEEPAY'].includes(method)) return 'ewallet';
  return 'va';
}

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

interface LocationState {
  orderData?: {
    invoice_id: string;
    payment_method: string;
    payment_gateway: string;
    payment_code: string;
    payment_url: string;
    payment_amount: number;
    product_name: string;
    buyer_name: string;
    target: string;
    expired_at: string;
  };
}

export default function PaymentPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const orderData = state?.orderData;

  const fetchOrder = useCallback(async (showRefresh = false) => {
    if (!invoiceId) return;
    if (showRefresh) setRefreshing(true);
    try {
      const o = await checkOrder(invoiceId);
      setOrder(o);
      if (o.payment_status === 'paid' || o.order_status === 'success' || o.order_status === 'failed') {
        navigate(`/order-status/${invoiceId}`, { replace: true });
      }
    } catch {
      setError('Gagal memuat data pembayaran');
    } finally {
      setLoading(false);
      if (showRefresh) setRefreshing(false);
    }
  }, [invoiceId, navigate]);

  useEffect(() => {
    fetchOrder();
    // Auto-poll every 5 seconds
    const interval = setInterval(() => fetchOrder(), 5000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  // Realtime subscription
  useEffect(() => {
    if (!invoiceId) return;
    const channel = supabase
      .channel(`order-${invoiceId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sc_orders',
        filter: `invoice_id=eq.${invoiceId}`,
      }, (payload) => {
        const updated = payload.new as OrderStatus;
        setOrder(updated);
        if (updated.payment_status === 'paid' || updated.order_status === 'success' || updated.order_status === 'failed') {
          navigate(`/order-status/${invoiceId}`, { replace: true });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [invoiceId, navigate]);

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Use order data from state if order not yet loaded
  const displayData = order || (orderData ? {
    invoice_id: orderData.invoice_id,
    payment_method: orderData.payment_method,
    payment_amount: orderData.payment_amount,
    payment_code: orderData.payment_code,
    payment_url: orderData.payment_url,
    payment_status: 'pending',
    order_status: 'waiting_payment',
    product_name: orderData.product_name,
    buyer_name: orderData.buyer_name,
    target: orderData.target,
    expired_at: orderData.expired_at,
  } as Partial<OrderStatus> : null);

  const countdown = useCountdown(displayData?.expired_at || new Date(Date.now() + 3600000).toISOString());
  const methodType = getMethodType(displayData?.payment_method || '');
  const MethodIcon = getMethodIcon(displayData?.payment_method || '');

  if (loading && !displayData) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
      <Footer />
    </div>
  );

  if (error && !displayData) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <p className="text-foreground font-semibold">{error}</p>
          <Button onClick={() => navigate('/products')} className="mt-4">Kembali ke Produk</Button>
        </div>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-6">
        <div className="container mx-auto px-4 max-w-lg">
          <Link to="/products" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Produk
          </Link>

          {/* Status indicator */}
          <div className="bg-card border border-border rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                <span className="font-semibold text-foreground text-sm">Menunggu Pembayaran</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => fetchOrder(true)} className="text-primary h-8 px-2.5" disabled={refreshing}>
                <RefreshCw className={cn('w-3.5 h-3.5 mr-1', refreshing && 'animate-spin')} /> Refresh
              </Button>
            </div>

            {/* Countdown */}
            <div className={cn('rounded-xl p-4 text-center mb-4', countdown.expired ? 'bg-red-500/10 border border-red-500/20' : 'bg-primary/5 border border-primary/20')}>
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

            {/* Invoice info */}
            <div className="text-center mb-4">
              <p className="text-muted-foreground text-sm">No. Invoice</p>
              <p className="font-mono font-bold text-foreground">{displayData?.invoice_id}</p>
              <p className="text-muted-foreground text-sm mt-2">{displayData?.product_name}</p>
              <p className="text-primary font-bold text-2xl mt-1">Rp {(displayData?.payment_amount || 0).toLocaleString('id-ID')}</p>
              <p className="text-xs text-red-500 font-semibold mt-1">Bayar tepat sampai sen!</p>
            </div>
          </div>

          {/* Payment instructions */}
          <div className="bg-card border border-border rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MethodIcon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-bold text-foreground">{displayData?.payment_method}</h3>
            </div>

            {/* VA number */}
            {methodType === 'va' && displayData?.payment_code && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Nomor Virtual Account</p>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted border border-border">
                  <code className="flex-1 text-lg font-mono font-bold text-foreground tracking-wider">{displayData.payment_code}</code>
                  <Button variant="ghost" size="sm" onClick={() => copyCode(displayData?.payment_code || '')} className="h-8 px-2.5 flex-shrink-0">
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="mt-4 space-y-2">
                  {['ATM / Mobile Banking', 'Transfer ke nomor Virtual Account di atas', 'Masukkan jumlah tepat: Rp ' + (displayData?.payment_amount || 0).toLocaleString('id-ID'), 'Konfirmasi & selesaikan transaksi'].map((step, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{i + 1}</div>
                      <span className="text-muted-foreground">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QRIS */}
            {methodType === 'qris' && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">Scan QR Code untuk membayar</p>
                <div className="w-48 h-48 mx-auto rounded-xl bg-muted border border-border flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-muted-foreground/30" />
                </div>
                {displayData?.payment_url && (
                  <Button asChild className="mt-3 bg-primary text-white btn-glow rounded-xl w-full">
                    <a href={displayData.payment_url} target="_blank" rel="noopener noreferrer">Buka Halaman Pembayaran</a>
                  </Button>
                )}
              </div>
            )}

            {/* E-Wallet */}
            {methodType === 'ewallet' && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">Klik tombol di bawah untuk membuka aplikasi e-wallet</p>
                {displayData?.payment_url ? (
                  <Button asChild className="bg-primary text-white btn-glow rounded-xl w-full">
                    <a href={displayData.payment_url} target="_blank" rel="noopener noreferrer">
                      <Smartphone className="w-4 h-4 mr-2" /> Bayar via {displayData.payment_method}
                    </a>
                  </Button>
                ) : (
                  <p className="text-muted-foreground text-sm">Menunggu URL pembayaran dari gateway...</p>
                )}
              </div>
            )}

            {/* No code yet (demo mode) */}
            {!displayData?.payment_code && !displayData?.payment_url && methodType === 'va' && (
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                <p className="text-yellow-700 text-sm font-medium">Gateway pembayaran belum dikonfigurasi.</p>
                <p className="text-yellow-600 text-xs mt-1">Mode demo — pesanan akan diproses secara manual oleh admin.</p>
              </div>
            )}
          </div>

          {/* Help note */}
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground">Setelah pembayaran berhasil, produk akan dikirim otomatis dalam <strong className="text-foreground">1-5 menit</strong>.</p>
            <p className="text-xs text-muted-foreground mt-1">Halaman ini akan otomatis update saat pembayaran diterima.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
