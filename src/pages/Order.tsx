import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, ShoppingCart, User, CreditCard, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import PaymentMethodSelector, { PAYMENT_METHODS, type PaymentMethod } from '@/components/order/PaymentMethodSelector';
import { getProductBySku, createOrder } from '@/lib/order-api';
import { cn } from '@/lib/utils';

// Target field config per category
const TARGET_CONFIG: Record<string, { label: string; placeholder: string; hint: string; hasDetail?: boolean; detailLabel?: string; detailPlaceholder?: string; detailHint?: string }> = {
  pulsa: { label: 'Nomor HP', placeholder: '08xx-xxxx-xxxx', hint: 'Masukkan nomor HP tujuan pengisian pulsa' },
  data: { label: 'Nomor HP', placeholder: '08xx-xxxx-xxxx', hint: 'Masukkan nomor HP tujuan pengisian paket data' },
  ewallet: { label: 'Nomor HP / Akun', placeholder: '08xx-xxxx-xxxx', hint: 'Nomor HP yang terdaftar di e-wallet' },
  pln: { label: 'Nomor Meter / ID Pelanggan', placeholder: 'Contoh: 123456789012', hint: 'Masukkan nomor meter listrik atau ID pelanggan PLN (10-12 digit)' },
  ppob: { label: 'ID Pelanggan / Nomor Akun', placeholder: 'Masukkan ID pelanggan', hint: 'Nomor pelanggan atau ID akun layanan' },
  game: {
    label: 'User ID',
    placeholder: 'Masukkan User ID game Anda',
    hint: 'User ID akun game Anda',
    hasDetail: true,
    detailLabel: 'Zone ID',
    detailPlaceholder: 'Contoh: 1234',
    detailHint: 'Wajib diisi untuk Mobile Legends, Arena Breakout, PUBG Mobile, dan game lain yang membutuhkan Zone/Server ID. Kosongkan jika tidak diperlukan.',
  },
};

type Step = 1 | 2 | 3;

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: 'Isi Data' },
    { n: 2, label: 'Pembayaran' },
    { n: 3, label: 'Konfirmasi' },
  ];
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-0 flex-1">
          <div className="flex flex-col items-center flex-1">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all', current >= s.n ? 'bg-primary text-primary-foreground shadow-green' : 'bg-muted text-muted-foreground')}>
              {current > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
            </div>
            <p className={cn('text-xs mt-1 font-medium', current >= s.n ? 'text-primary' : 'text-muted-foreground')}>{s.label}</p>
          </div>
          {i < steps.length - 1 && (
            <div className={cn('h-0.5 flex-1 mb-5 transition-all', current > s.n ? 'bg-primary' : 'bg-border')} />
          )}
        </div>
      ))}
    </div>
  );
}

interface Product {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  brand: string;
  description: string;
  buy_price: number;
  sell_price: number;
  active: boolean;
  provider: string;
  provider_code: string;
}

export default function OrderPage() {
  const { productSku } = useParams<{ productSku: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>(1);

  // Step 1: Target info
  const [target, setTarget] = useState('');
  const [targetDetail, setTargetDetail] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerWa, setBuyerWa] = useState('');

  // Step 2: Payment
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    if (!productSku) return;
    setLoading(true);
    getProductBySku(productSku)
      .then(p => {
        if (!p) { navigate('/products'); return; }
        setProduct(p);
      })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [productSku, navigate]);

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
      <Footer />
    </div>
  );

  if (!product) return null;

  const targetCfg = TARGET_CONFIG[product.category_id] || TARGET_CONFIG.pulsa;
  const totalAmount = (selectedMethod?.fee ?? 0) + product.sell_price;

  const validateStep1 = () => {
    if (!target.trim()) { setError('Harap isi ' + targetCfg.label); return false; }
    if (!buyerName.trim()) { setError('Harap isi nama Anda'); return false; }
    if (!buyerEmail.trim() && !buyerWa.trim()) { setError('Isi minimal email atau WhatsApp untuk konfirmasi'); return false; }
    setError(''); return true;
  };

  const validateStep2 = () => {
    if (!selectedMethod) { setError('Harap pilih metode pembayaran'); return false; }
    setError(''); return true;
  };

  const handleNextStep1 = () => {
    if (validateStep1()) setStep(2);
  };

  const handleNextStep2 = () => {
    if (validateStep2()) setStep(3);
  };

  const handleSubmitOrder = async () => {
    if (!selectedMethod || !product) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await createOrder({
        product_sku: product.sku,
        target: target.trim(),
        target_detail: targetDetail.trim(),
        buyer_name: buyerName.trim(),
        buyer_email: buyerEmail.trim(),
        buyer_whatsapp: buyerWa.trim(),
        payment_method: selectedMethod.id,
        payment_gateway: selectedMethod.gateway,
      });
      navigate(`/payment/${result.invoice_id}`, { state: { orderData: result } });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal membuat pesanan. Silakan coba lagi.');
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-6">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Back */}
          <Link to="/products" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Produk
          </Link>

          {/* Product Header */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground truncate">{product.name}</p>
              <p className="text-muted-foreground text-sm">{product.brand} • Rp {product.sell_price.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <StepIndicator current={step} />

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* STEP 1: Target & Buyer Info */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-up">
              <div className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Data Pembelian
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">{targetCfg.label} *</label>
                    <Input value={target} onChange={e => setTarget(e.target.value)} placeholder={targetCfg.placeholder} className="rounded-xl" />
                    <p className="text-xs text-muted-foreground mt-1">{targetCfg.hint}</p>
                  </div>
                  {targetCfg.hasDetail && (
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">{targetCfg.detailLabel}</label>
                      <Input value={targetDetail} onChange={e => setTargetDetail(e.target.value)} placeholder={targetCfg.detailPlaceholder} className="rounded-xl" />
                      {targetCfg.detailHint && (
                        <p className="text-xs text-muted-foreground mt-1">{targetCfg.detailHint}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Data Pemesan
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Nama Lengkap *</label>
                    <Input value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Nama Anda" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
                    <Input type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} placeholder="email@contoh.com" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">WhatsApp</label>
                    <Input value={buyerWa} onChange={e => setBuyerWa(e.target.value)} placeholder="08xxxxxxxx" className="rounded-xl" />
                  </div>
                  <p className="text-xs text-muted-foreground">Email atau WhatsApp diperlukan untuk konfirmasi pembayaran</p>
                </div>
              </div>

              <Button onClick={handleNextStep1} className="w-full h-12 bg-primary text-white btn-glow rounded-xl text-base font-bold">
                Lanjut Pilih Pembayaran
              </Button>
            </div>
          )}

          {/* STEP 2: Payment Method */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-up">
              <div className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> Pilih Metode Pembayaran
                </h2>
                <PaymentMethodSelector selected={selectedMethod?.id || ''} onSelect={m => { setSelectedMethod(m); setError(''); }} productPrice={product.sell_price} />
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-12 rounded-xl">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
                </Button>
                <Button onClick={handleNextStep2} className="flex-1 h-12 bg-primary text-white btn-glow rounded-xl text-base font-bold">
                  Lanjut Konfirmasi
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-up">
              <div className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-primary" /> Ringkasan Pesanan
                </h2>
                <div className="space-y-2.5">
                  {[
                    { label: 'Produk', value: product.name },
                    { label: targetCfg.label, value: target + (targetDetail ? ` (${targetDetail})` : '') },
                    { label: 'Nama', value: buyerName },
                    { label: 'Kontak', value: buyerEmail || buyerWa },
                    { label: 'Metode Bayar', value: selectedMethod?.label || '' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between gap-2 py-2 border-b border-border/30 last:border-0">
                      <span className="text-muted-foreground text-sm flex-shrink-0">{row.label}</span>
                      <span className="text-foreground text-sm font-medium text-right break-all">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Harga Produk</span>
                    <span className="text-foreground font-medium">Rp {product.sell_price.toLocaleString('id-ID')}</span>
                  </div>
                  {(selectedMethod?.fee ?? 0) > 0 && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-muted-foreground text-sm">Biaya Admin</span>
                      <span className="text-foreground font-medium">Rp {(selectedMethod?.fee ?? 0).toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                    <span className="font-bold text-foreground">Total Bayar</span>
                    <span className="font-bold text-primary text-xl">Rp {totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-12 rounded-xl" disabled={submitting}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
                </Button>
                <Button onClick={handleSubmitOrder} disabled={submitting} className="flex-1 h-12 bg-primary text-white btn-glow rounded-xl text-base font-bold">
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memproses...</>
                  ) : (
                    <><ShoppingCart className="w-4 h-4 mr-2" /> Bayar Sekarang</>
                  )}
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Dengan menekan tombol Bayar, Anda menyetujui syarat dan ketentuan yang berlaku
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
