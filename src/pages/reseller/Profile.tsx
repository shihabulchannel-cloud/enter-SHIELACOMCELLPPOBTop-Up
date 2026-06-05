import { useState } from 'react';
import { User, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getResellerSession } from '@/lib/reseller-auth';
import { changeResellerPassword } from '@/lib/reseller-auth';
import { supabase } from '@/integrations/supabase/client';
import ResellerLayout from './Layout';
import { cn } from '@/lib/utils';

export default function ResellerProfile() {
  const session = getResellerSession();
  const [profile, setProfile] = useState({ name: session?.name || '', email: '', whatsapp: '' });
  const [pw, setPw] = useState({ old: '', new: '', confirm: '' });
  const [profileResult, setProfileResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [pwResult, setPwResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPw, setLoadingPw] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    const { data, error } = await supabase.functions.invoke('reseller-auth', { body: { action: 'update_profile', reseller_id: session?.reseller_id, name: profile.name, email: profile.email, whatsapp: profile.whatsapp } });
    if (error || data?.error) setProfileResult({ ok: false, msg: data?.error || error?.message || 'Gagal' });
    else setProfileResult({ ok: true, msg: 'Profil berhasil diperbarui' });
    setLoadingProfile(false);
  };

  const handlePwChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.new !== pw.confirm) { setPwResult({ ok: false, msg: 'Password baru dan konfirmasi tidak sama' }); return; }
    if (pw.new.length < 6) { setPwResult({ ok: false, msg: 'Password minimal 6 karakter' }); return; }
    setLoadingPw(true);
    const result = await changeResellerPassword(session?.reseller_id || '', pw.old, pw.new);
    if (result.success) { setPwResult({ ok: true, msg: 'Password berhasil diubah' }); setPw({ old: '', new: '', confirm: '' }); }
    else setPwResult({ ok: false, msg: result.error || 'Gagal' });
    setLoadingPw(false);
  };

  return (
    <ResellerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Profil Akun</h1>
        <p className="text-muted-foreground text-sm">@{session?.username}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Profile info */}
        <form onSubmit={handleProfileSave} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-foreground flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Informasi Profil</h2>
          {[
            { key: 'name', label: 'Nama Lengkap', placeholder: 'Nama lengkap' },
            { key: 'whatsapp', label: 'WhatsApp', placeholder: '08xxxxxxxxxx' },
            { key: 'email', label: 'Email', placeholder: 'email@contoh.com', type: 'email' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
              <Input type={type || 'text'} value={profile[key as keyof typeof profile]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="rounded-xl" />
            </div>
          ))}
          {profileResult && (
            <div className={cn('flex items-center gap-2 p-3 rounded-xl text-sm', profileResult.ok ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-600')}>
              {profileResult.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {profileResult.msg}
            </div>
          )}
          <Button type="submit" disabled={loadingProfile} className="w-full bg-primary text-primary-foreground rounded-xl btn-glow h-10">
            {loadingProfile ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Simpan Perubahan'}
          </Button>
        </form>

        {/* Change password */}
        <form onSubmit={handlePwChange} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-foreground flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> Ganti Password</h2>
          {[
            { key: 'old', label: 'Password Lama', placeholder: 'Password saat ini' },
            { key: 'new', label: 'Password Baru', placeholder: 'Min. 6 karakter' },
            { key: 'confirm', label: 'Konfirmasi Password Baru', placeholder: 'Ulangi password baru' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
              <Input type="password" value={pw[key as keyof typeof pw]} onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="rounded-xl" />
            </div>
          ))}
          {pwResult && (
            <div className={cn('flex items-center gap-2 p-3 rounded-xl text-sm', pwResult.ok ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-600')}>
              {pwResult.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {pwResult.msg}
            </div>
          )}
          <Button type="submit" disabled={loadingPw} className="w-full bg-primary text-primary-foreground rounded-xl btn-glow h-10">
            {loadingPw ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Ubah Password'}
          </Button>
        </form>
      </div>
    </ResellerLayout>
  );
}
