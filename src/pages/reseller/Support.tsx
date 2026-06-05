import { useEffect, useState } from 'react';
import { LifeBuoy, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getResellerSession } from '@/lib/reseller-auth';
import { supabase } from '@/integrations/supabase/client';
import ResellerLayout from './Layout';
import { cn } from '@/lib/utils';

interface Ticket { id: string; subject: string; message: string; status: string; admin_reply: string; created_at: string; updated_at: string; }

const STATUS: Record<string, { label: string; color: string }> = {
  open: { label: 'Menunggu', color: 'text-yellow-600 bg-yellow-500/10' },
  replied: { label: 'Dibalas', color: 'text-blue-500 bg-blue-500/10' },
  closed: { label: 'Selesai', color: 'text-green-600 bg-green-500/10' },
};

export default function ResellerSupport() {
  const session = getResellerSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadTickets = async () => {
    if (!session) return;
    const { data } = await supabase.from('sc_support_tickets').select('*').eq('reseller_id', session.reseller_id).order('created_at', { ascending: false });
    setTickets(data || []);
  };
  useEffect(() => { loadTickets(); }, [session?.reseller_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setLoading(true);
    await supabase.from('sc_support_tickets').insert({ reseller_id: session?.reseller_id, reseller_name: session?.name || '', subject: subject.trim(), message: message.trim() });
    setSubject(''); setMessage(''); setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    loadTickets();
    setLoading(false);
  };

  return (
    <ResellerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Bantuan / Tiket</h1>
        <p className="text-muted-foreground text-sm">Buat tiket dan hubungi admin kami</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-foreground flex items-center gap-2"><LifeBuoy className="w-4 h-4 text-primary" /> Buat Tiket Baru</h2>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Subjek</label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Topik pertanyaan Anda" className="rounded-xl" required />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Pesan</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Jelaskan masalah atau pertanyaan Anda..." rows={5} required
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          {success && <div className="bg-green-500/10 text-green-700 text-sm p-3 rounded-xl">Tiket berhasil dikirim! Admin akan segera membalas.</div>}
          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground rounded-xl btn-glow h-10 gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Kirim Tiket</>}
          </Button>
        </form>

        {/* Ticket list */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground flex items-center gap-2 mb-4"><MessageSquare className="w-4 h-4 text-primary" /> Tiket Saya</h2>
          {tickets.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Belum ada tiket</p>
          ) : (
            <div className="space-y-3">
              {tickets.map(t => {
                const s = STATUS[t.status] || STATUS.open;
                return (
                  <div key={t.id} className="p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-semibold text-foreground text-sm">{t.subject}</p>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0', s.color)}>{s.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{t.message}</p>
                    {t.admin_reply && (
                      <div className="mt-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="text-xs font-semibold text-primary mb-0.5">Balasan Admin:</p>
                        <p className="text-xs text-foreground">{t.admin_reply}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ResellerLayout>
  );
}
