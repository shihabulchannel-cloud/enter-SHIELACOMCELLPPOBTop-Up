import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Loader2, RefreshCw, Eye, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ManualOrder {
  id: string;
  invoice_id: string;
  buyer_name: string;
  buyer_whatsapp: string;
  product_name: string;
  target: string;
  payment_amount: number;
  payment_proof_url: string;
  manual_payment_type: string;
  payment_status: string;
  order_status: string;
  reject_reason: string;
  digiflazz_sn: string;
  created_at: string;
  updated_at: string;
}

function ProofModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-2xl p-3 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <img src={url} alt="Bukti Pembayaran" className="w-full rounded-xl max-h-[70vh] object-contain" />
        <Button onClick={onClose} variant="outline" className="w-full mt-3 rounded-xl">Tutup</Button>
      </div>
    </div>
  );
}

export default function PaymentVerification() {
  const [pending, setPending] = useState<ManualOrder[]>([]);
  const [done, setDone] = useState<ManualOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [proofModal, setProofModal] = useState('');

  // Per-row action state
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [rejectMode, setRejectMode] = useState<Record<string, boolean>>({});
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [rowResult, setRowResult] = useState<Record<string, { ok: boolean; msg: string }>>({});

  const load = useCallback(async () => {
    const [{ data: pend }, { data: hist }] = await Promise.all([
      supabase
        .from('sc_orders')
        .select('id,invoice_id,buyer_name,buyer_whatsapp,product_name,target,payment_amount,payment_proof_url,manual_payment_type,payment_status,order_status,reject_reason,digiflazz_sn,created_at,updated_at')
        .eq('payment_method', 'MANUAL')
        .neq('payment_proof_url', '')
        .eq('payment_status', 'pending')
        .order('updated_at', { ascending: false })
        .limit(50),
      supabase
        .from('sc_orders')
        .select('id,invoice_id,buyer_name,product_name,target,payment_amount,payment_status,order_status,reject_reason,digiflazz_sn,created_at,updated_at')
        .eq('payment_method', 'MANUAL')
        .neq('payment_status', 'pending')
        .order('updated_at', { ascending: false })
        .limit(20),
    ]);
    setPending((pend || []) as ManualOrder[]);
    setDone((hist || []) as ManualOrder[]);
    setLoading(false);
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    load();
    const channel = supabase.channel('manual-verification-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sc_orders' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const approve = async (row: ManualOrder) => {
    setProcessing(p => ({ ...p, [row.id]: true }));
    setRowResult(r => ({ ...r, [row.id]: { ok: false, msg: '' } }));
    const { data, error } = await supabase.functions.invoke('process-manual-order', {
      body: { invoice_id: row.invoice_id, action: 'approve' },
    });
    setProcessing(p => ({ ...p, [row.id]: false }));
    const msg = data?.message || error?.message || 'Terjadi kesalahan';
    const ok = !error && data?.success;
    setRowResult(r => ({ ...r, [row.id]: { ok, msg } }));
    if (ok) setTimeout(() => load(), 1500);
  };

  const reject = async (row: ManualOrder) => {
    const reason = rejectReason[row.id] || 'Bukti pembayaran tidak valid';
    setProcessing(p => ({ ...p, [row.id]: true }));
    const { data, error } = await supabase.functions.invoke('process-manual-order', {
      body: { invoice_id: row.invoice_id, action: 'reject', reject_reason: reason },
    });
    setProcessing(p => ({ ...p, [row.id]: false }));
    const msg = data?.message || error?.message || 'Terjadi kesalahan';
    const ok = !error && data?.success;
    setRowResult(r => ({ ...r, [row.id]: { ok, msg } }));
    if (ok) setTimeout(() => load(), 1500);
  };

  const STATUS_STYLE: Record<string, string> = {
    paid: 'bg-green-500/10 text-green-600 border-green-500/30',
    processing: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    success: 'bg-green-500/10 text-green-600 border-green-500/30',
    failed: 'bg-red-500/10 text-red-500 border-red-500/30',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/30',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/30',
    pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  };
  const STATUS_LABEL: Record<string, string> = {
    paid: 'Disetujui', processing: 'Diproses', success: 'Sukses',
    failed: 'Gagal', cancelled: 'Ditolak', rejected: 'Ditolak', pending: 'Pending',
  };

  return (
    <div>
      {proofModal && <ProofModal url={proofModal} onClose={() => setProofModal('')} />}

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Verifikasi Pembayaran Manual</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-muted-foreground text-sm">{pending.length} menunggu verifikasi</p>
            <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Realtime
            </span>
          </div>
          {!loading && <p className="text-xs text-muted-foreground/60 mt-0.5">Update: {lastUpdate.toLocaleTimeString('id-ID')}</p>}
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-muted" title="Refresh">
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <RefreshCw className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>

      {/* Pending */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : pending.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-2xl mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-500/40 mx-auto mb-3" />
          <p className="font-semibold text-foreground">Tidak ada pembayaran yang perlu diverifikasi</p>
          <p className="text-muted-foreground text-sm mt-1">Semua pembayaran manual sudah diproses</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {pending.map(row => (
            <div key={row.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-muted/50 px-4 py-3 flex items-center justify-between flex-wrap gap-2 border-b border-border">
                <div>
                  <p className="font-mono font-bold text-primary text-sm">{row.invoice_id}</p>
                  <p className="text-muted-foreground text-xs">{new Date(row.created_at).toLocaleString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-orange-500/10 text-orange-600 border border-orange-500/20 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {row.manual_payment_type === 'qris' ? 'QRIS' : 'Transfer Bank'}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Order info */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pembeli</span>
                    <span className="font-semibold text-foreground">{row.buyer_name}</span>
                  </div>
                  {row.buyer_whatsapp && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">WhatsApp</span>
                      <span className="font-semibold text-foreground">{row.buyer_whatsapp}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Produk</span>
                    <span className="font-semibold text-foreground text-right max-w-[200px]">{row.product_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tujuan</span>
                    <span className="font-semibold text-foreground">{row.target}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Jumlah</span>
                    <span className="font-black text-primary">Rp {(row.payment_amount || 0).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Proof preview */}
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Bukti Pembayaran</p>
                  {row.payment_proof_url ? (
                    <div className="relative group cursor-pointer" onClick={() => setProofModal(row.payment_proof_url)}>
                      <img
                        src={row.payment_proof_url}
                        alt="Bukti"
                        className="w-full max-h-36 object-cover rounded-xl border border-border"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-24 rounded-xl bg-muted flex items-center justify-center">
                      <p className="text-muted-foreground text-sm">Tidak ada bukti</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 text-center">Klik untuk perbesar</p>
                </div>
              </div>

              {/* Action Result */}
              {rowResult[row.id]?.msg && (
                <div className={cn('mx-4 mb-3 p-2.5 rounded-xl text-sm flex items-center gap-2',
                  rowResult[row.id].ok ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-600'
                )}>
                  {rowResult[row.id].ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {rowResult[row.id].msg}
                </div>
              )}

              {/* Reject reason input */}
              {rejectMode[row.id] && (
                <div className="px-4 pb-3">
                  <label className="text-sm font-medium text-foreground block mb-1.5">Alasan penolakan</label>
                  <input
                    type="text"
                    value={rejectReason[row.id] || ''}
                    onChange={e => setRejectReason(r => ({ ...r, [row.id]: e.target.value }))}
                    placeholder="Contoh: Nominal tidak sesuai"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="px-4 pb-4 flex gap-2 flex-wrap">
                {!rejectMode[row.id] ? (
                  <>
                    <Button
                      onClick={() => approve(row)}
                      disabled={processing[row.id]}
                      className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700 text-white rounded-xl h-10 text-sm"
                    >
                      {processing[row.id] ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                      Setujui
                    </Button>
                    <Button
                      onClick={() => setRejectMode(r => ({ ...r, [row.id]: true }))}
                      disabled={processing[row.id]}
                      variant="outline"
                      className="flex-1 min-w-[100px] rounded-xl h-10 text-sm border-red-500/40 text-red-500 hover:bg-red-500/5"
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Tolak
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => reject(row)}
                      disabled={processing[row.id]}
                      className="flex-1 min-w-[120px] bg-red-600 hover:bg-red-700 text-white rounded-xl h-10 text-sm"
                    >
                      {processing[row.id] ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                      Konfirmasi Tolak
                    </Button>
                    <Button
                      onClick={() => setRejectMode(r => ({ ...r, [row.id]: false }))}
                      disabled={processing[row.id]}
                      variant="ghost"
                      className="rounded-xl h-10 text-sm"
                    >
                      Batal
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {done.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-foreground mb-3">Riwayat Verifikasi (20 Terakhir)</h3>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Invoice</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Pembeli</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Produk</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Keterangan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {done.map(row => {
                    const st = row.payment_status === 'rejected' || row.order_status === 'cancelled' ? 'cancelled' : row.order_status;
                    const stl = STATUS_STYLE[st] || STATUS_STYLE.pending;
                    const lbl = STATUS_LABEL[st] || st;
                    return (
                      <tr key={row.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                        <td className="px-4 py-3 text-xs font-medium text-primary font-mono">{row.invoice_id}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{row.buyer_name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-[130px] truncate">{row.product_name}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground text-right">Rp {(row.payment_amount || 0).toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3">
                          <span className={cn('text-xs font-semibold px-2 py-1 rounded-full border', stl)}>{lbl}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[150px]">
                          {row.digiflazz_sn
                            ? <span className="text-green-600 font-mono">SN: {row.digiflazz_sn}</span>
                            : row.reject_reason || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(row.updated_at).toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
