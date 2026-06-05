import { useState } from 'react';
import { Search, Loader2, CheckCircle2, XCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import { checkOrder, type OrderStatus } from '@/lib/order-api';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  waiting_payment: { label: 'Menunggu Pembayaran', icon: Clock, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  processing: { label: 'Diproses', icon: Loader2, color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  success: { label: 'Berhasil', icon: CheckCircle2, color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  failed: { label: 'Gagal', icon: XCircle, color: 'bg-red-500/10 text-red-600 border-red-500/30' },
};

export default function CekTransaksi() {
  const navigate = useNavigate();
  const [invoiceId, setInvoiceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderStatus | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleCheck = async () => {
    if (!invoiceId.trim()) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);
    try {
      const order = await checkOrder(invoiceId.trim());
      setResult(order);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const orderStatus = result?.order_status as keyof typeof STATUS_CONFIG | undefined;
  const statusCfg = orderStatus ? STATUS_CONFIG[orderStatus] || STATUS_CONFIG.failed : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-hero-gradient pt-24 pb-16 md:pt-32 md:pb-20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">Cek Transaksi</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Cek Status <span className="text-gradient">Transaksi</span>
            </h1>
            <p className="text-white/60 max-w-md mx-auto text-sm md:text-base">
              Masukkan Invoice ID untuk melihat status pesanan Anda secara real-time
            </p>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-card">
              <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={invoiceId}
                    onChange={e => setInvoiceId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCheck()}
                    placeholder="Contoh: INV-20260605-A1B2C3"
                    className="pl-10 rounded-xl h-12 text-base"
                  />
                </div>
                <Button
                  onClick={handleCheck}
                  disabled={loading || !invoiceId.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary-dark rounded-xl h-12 px-6 btn-glow shadow-green font-semibold"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cek Status'}
                </Button>
              </div>

              <div className="flex items-start gap-2 text-muted-foreground text-sm bg-muted rounded-xl p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
                <span>Format invoice: <span className="text-foreground font-mono">INV-YYYYMMDD-XXXXXX</span> — dapat ditemukan di email/WA konfirmasi.</span>
              </div>

              {loading && (
                <div className="mt-8 text-center py-12">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">Memeriksa transaksi...</p>
                </div>
              )}

              {notFound && !loading && (
                <div className="mt-8 text-center py-12 animate-scale-in">
                  <XCircle className="w-14 h-14 text-red-500 mx-auto mb-3" />
                  <h3 className="font-bold text-foreground text-lg mb-2">Transaksi Tidak Ditemukan</h3>
                  <p className="text-muted-foreground text-sm">Pastikan Invoice ID yang Anda masukkan sudah benar.</p>
                </div>
              )}

              {result && !loading && statusCfg && (
                <div className="mt-6 animate-scale-in">
                  <div className="border border-border/50 rounded-2xl overflow-hidden">
                    <div className="bg-muted px-5 py-4 flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Invoice ID</p>
                        <p className="font-bold text-foreground font-mono">{result.invoice_id}</p>
                      </div>
                      {(() => {
                        const Icon = statusCfg.icon;
                        return (
                          <Badge className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold text-sm', statusCfg.color)}>
                            <Icon className={cn('w-4 h-4', result.order_status === 'processing' && 'animate-spin')} />
                            {statusCfg.label}
                          </Badge>
                        );
                      })()}
                    </div>
                    <div className="p-5 space-y-2">
                      {[
                        { label: 'Produk', value: result.product_name },
                        { label: 'Tujuan', value: result.target + (result.target_detail ? ` (${result.target_detail})` : '') },
                        { label: 'Total Bayar', value: `Rp ${(result.payment_amount || 0).toLocaleString('id-ID')}` },
                        { label: 'Metode Bayar', value: result.payment_method },
                        { label: 'Waktu Pesan', value: new Date(result.created_at).toLocaleString('id-ID') },
                        ...(result.digiflazz_sn ? [{ label: 'Serial Number', value: result.digiflazz_sn }] : []),
                      ].map(item => (
                        <div key={item.label} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                          <span className="text-muted-foreground text-sm flex-shrink-0">{item.label}</span>
                          <span className="font-semibold text-foreground text-sm text-right break-all ml-2">{item.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="px-5 pb-4 flex gap-2">
                      <Button
                        onClick={() => navigate(`/order-status/${result.invoice_id}`)}
                        className="flex-1 bg-primary text-white btn-glow rounded-xl h-10 text-sm"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" /> Lihat Detail Lengkap
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
