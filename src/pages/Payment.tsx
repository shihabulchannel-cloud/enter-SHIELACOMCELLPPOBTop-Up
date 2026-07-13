import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Clock, RefreshCw, AlertCircle, CheckCircle2, XCircle, Smartphone, Building2, QrCode, Loader2, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
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

function getMethodType(method: string): 'va' | 'qris' | 'ewallet' | 'manual' {
  if (method === 'MANUAL') return 'manual';
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

// ─── Manual Payment Section ───────────────────────────────────────────────────

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  sort_order: number;
}

interface ManualConfig {
  qris_image_url: string;
  qris_active: boolean;
  default_method: string;
}

interface ManualPaymentSectionProps {
  invoiceId: string;
  order: OrderStatus | null;
  paymentAmount: number;
  expired: boolean;
}

function ManualPaymentSection({ invoiceId, order, paymentAmount, expired }: ManualPaymentSectionProps) {
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [config, setConfig] = useState<ManualConfig | null>(null);
  const [tab, setTab] = useState<'bank' | 'qris'>('bank');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [fileType, setFileType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const proofAlreadySubmitted = !!(order?.payment_proof_url) || done;

  useEffect(() => {
    Promise.all([
      supabase.from('sc_bank_accounts').select('*').eq('active', true).order('sort_order').order('bank_name'),
      supabase.from('sc_manual_payment_config').select('*').limit(1).maybeSingle(),
    ]).then(([{ data: b }, { data: c }]) => {
      setBanks((b || []) as BankAccount[]);
      if (c) {
        const cfg = c as ManualConfig;
        setConfig(cfg);
        setTab(cfg.qris_active && cfg.default_method === 'qris' ? 'qris' : 'bank');
      }
    });
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(f.type)) {
      setSubmitError('Format file harus JPG, JPEG, atau PNG');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setSubmitError('Ukuran file maksimal 5MB');
      return;
    }
    setSubmitError('');
    setFile(f);
    setFileType(f.type);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const submitProof = async () => {
    if (!file || !preview) {
      setSubmitError('Pilih file bukti pembayaran terlebih dahulu');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const { data, error } = await supabase.functions.invoke('submit-payment-proof', {
        body: {
          invoice_id: invoiceId,
          image_base64: preview,
          image_type: fileType,
          manual_payment_type: tab,
        },
      });
      if (error || data?.error) {
        setSubmitError(data?.error || error?.message || 'Gagal mengirim bukti');
      } else {
        setDone(true);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal mengirim bukti');
    } finally {
      setSubmitting(false);
    }
  };

  if (proofAlreadySubmitted) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
          <Clock className="w-7 h-7 text-orange-500 animate-pulse" />
        </div>
        <h3 className="font-bold text-foreground mb-1">Menunggu Verifikasi Admin</h3>
        <p className="text-muted-foreground text-sm">Bukti pembayaran telah diterima. Admin akan memverifikasi dalam beberapa menit.</p>
        <p className="text-xs text-muted-foreground mt-2">Halaman ini akan otomatis update setelah diverifikasi.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs: show only if QRIS is active */}
      {config?.qris_active && (
        <div className="flex rounded-xl bg-muted p-1 mb-4 gap-1">
          <button
            onClick={() => setTab('bank')}
            className={cn('flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5',
              tab === 'bank' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}
          >
            <Building2 className="w-3.5 h-3.5" /> Transfer Bank
          </button>
          <button
            onClick={() => setTab('qris')}
            className={cn('flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5',
              tab === 'qris' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}
          >
            <QrCode className="w-3.5 h-3.5" /> QRIS
          </button>
        </div>
      )}

      {/* Bank Accounts */}
      {tab === 'bank' && (
        <div className="space-y-2 mb-4">
          {banks.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">Belum ada rekening tujuan. Hubungi CS untuk info transfer.</p>
          ) : banks.map(b => (
            <div key={b.id} className="p-3 rounded-xl bg-muted border border-border">
              <p className="font-bold text-foreground text-sm">{b.bank_name}</p>
              <p className="font-mono font-black text-lg text-primary tracking-wider">{b.account_number}</p>
              <p className="text-muted-foreground text-xs">a.n. {b.account_name}</p>
            </div>
          ))}
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm text-center">
            <p className="font-semibold text-foreground">Transfer tepat: <span className="text-primary font-black">Rp {paymentAmount.toLocaleString('id-ID')}</span></p>
            <p className="text-muted-foreground text-xs mt-0.5">Nominal harus sama persis agar mudah diverifikasi</p>
          </div>
        </div>
      )}

      {/* QRIS */}
      {tab === 'qris' && config?.qris_active && (
        <div className="text-center mb-4">
          {config.qris_image_url ? (
            <>
              <p className="text-sm text-muted-foreground mb-3">Scan QR Code berikut untuk membayar</p>
              <img src={config.qris_image_url} alt="QRIS" className="max-w-[200px] mx-auto rounded-xl border border-border shadow-sm" />
              <p className="text-primary font-bold text-lg mt-2">Rp {paymentAmount.toLocaleString('id-ID')}</p>
            </>
          ) : (
            <p className="text-muted-foreground text-sm py-4">Gambar QRIS belum dikonfigurasi. Silakan pilih Transfer Bank.</p>
          )}
        </div>
      )}

      {/* Upload Proof */}
      <div className="border-t border-border pt-4 mt-2">
        <p className="text-sm font-semibold text-foreground mb-2">Upload Bukti Pembayaran</p>
        <label className={cn(
          'block w-full rounded-xl border-2 border-dashed transition-all cursor-pointer text-center p-4',
          preview ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/50',
          expired ? 'pointer-events-none opacity-50' : ''
        )}>
          <input type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleFile} className="hidden" disabled={expired} />
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
          ) : (
            <div className="py-2">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Klik untuk pilih foto bukti</p>
              <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG • Maks 5MB</p>
            </div>
          )}
        </label>

        {submitError && (
          <div className="mt-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {submitError}
          </div>
        )}

        <Button
          onClick={submitProof}
          disabled={!file || submitting || expired}
          className="w-full mt-3 h-11 bg-primary text-primary-foreground btn-glow rounded-xl font-bold"
        >
          {submitting
            ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Mengirim...</>
            : <><Upload className="w-4 h-4 mr-2" />Kirim Bukti Pembayaran</>}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">Admin akan memverifikasi dalam ±5 menit di jam kerja</p>
      </div>
    </div>
  );
}

// ─── Location state ───────────────────────────────────────────────────────────

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

// ─── Main Page ────────────────────────────────────────────────────────────────

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

  const shouldRedirect = (o: OrderStatus) =>
    o.payment_status === 'paid'
    || o.order_status === 'success'
    || o.order_status === 'failed'
    || o.order_status === 'cancelled'
    || o.payment_status === 'rejected';

  const fetchOrder = useCallback(async (showRefresh = false) => {
    if (!invoiceId) return;
    if (showRefresh) setRefreshing(true);
    try {
      const o = await checkOrder(invoiceId);
      setOrder(o);
      if (shouldRedirect(o)) {
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
    // Auto-poll every 8 seconds
    const interval = setInterval(() => fetchOrder(), 8000);
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
        if (shouldRedirect(updated)) {
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

  // Use order data from location state if order not yet loaded from DB
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
  const isManual = methodType === 'manual';

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
                <span className="font-semibold text-foreground text-sm">
                  {isManual && order?.payment_proof_url ? 'Menunggu Verifikasi' : 'Menunggu Pembayaran'}
                </span>
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
              {!isManual && <p className="text-xs text-red-500 font-semibold mt-1">Bayar tepat sampai sen!</p>}
            </div>
          </div>

          {/* Payment instructions */}
          <div className="bg-card border border-border rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MethodIcon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-bold text-foreground">
                {isManual ? 'Pembayaran Manual' : displayData?.payment_method}
              </h3>
            </div>

            {isManual ? (
              <ManualPaymentSection
                invoiceId={invoiceId!}
                order={order}
                paymentAmount={displayData?.payment_amount || 0}
                expired={countdown.expired}
              />
            ) : (
              <>
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

                {/* QRIS — render QR code sungguhan dari qrString Duitku (tersimpan di payment_code) */}
                {methodType === 'qris' && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">Scan QR Code untuk membayar</p>
                    {displayData?.payment_code ? (
                      <div className="inline-block p-4 rounded-xl bg-white border border-border">
                        <QRCodeSVG value={displayData.payment_code} size={192} level="M" />
                      </div>
                    ) : (
                      <div className="w-48 h-48 mx-auto rounded-xl bg-muted border border-border flex items-center justify-center">
                        <QrCode className="w-24 h-24 text-muted-foreground/30" />
                      </div>
                    )}
                    {displayData?.payment_url && (
                      <Button asChild className="mt-3 bg-primary text-white btn-glow rounded-xl w-full">
                        <a href={displayData.payment_url} target="_blank" rel="noopener noreferrer">Buka Halaman Pembayaran</a>
                      </Button>
                    )}
                    {!displayData?.payment_code && !displayData?.payment_url && (
                      <p className="text-muted-foreground text-sm mt-3">Menunggu QR Code dari gateway...</p>
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

                {/* No code yet (non-manual demo mode) */}
                {!displayData?.payment_code && !displayData?.payment_url && methodType === 'va' && (
                  <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                    <p className="text-yellow-700 text-sm font-medium">Gateway pembayaran belum dikonfigurasi.</p>
                    <p className="text-yellow-600 text-xs mt-1">Mode demo — pesanan akan diproses secara manual oleh admin.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Help note */}
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {isManual
                ? 'Setelah bukti pembayaran diverifikasi, produk akan dikirim otomatis.'
                : 'Setelah pembayaran berhasil, produk akan dikirim otomatis dalam '}
              {!isManual && <strong className="text-foreground">1-5 menit</strong>}
              {!isManual && '.'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Halaman ini akan otomatis update saat pembayaran diterima.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
