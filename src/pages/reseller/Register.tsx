import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resellerRegister } from '@/lib/reseller-auth';

export default function ResellerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', username: '', password: '', confirmPw: '', email: '', whatsapp: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPw) { setError('Password dan konfirmasi password tidak sama'); return; }
    if (form.password.length < 6) { setError('Password minimal 6 karakter'); return; }
    setLoading(true);
    const result = await resellerRegister({ name: form.name, username: form.username, password: form.password, email: form.email, whatsapp: form.whatsapp });
    if (result.success) navigate('/reseller/login', { state: { registered: true } });
    else { setError(result.error || 'Pendaftaran gagal'); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Daftar Reseller</h1>
          <p className="text-muted-foreground text-sm mt-1">SHIELACOM CELL</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

          {[
            { key: 'name', label: 'Nama Lengkap *', placeholder: 'Nama lengkap Anda' },
            { key: 'username', label: 'Username *', placeholder: 'username (tanpa spasi)' },
            { key: 'whatsapp', label: 'No. WhatsApp', placeholder: '08xxxxxxxxxx' },
            { key: 'email', label: 'Email', placeholder: 'email@contoh.com' },
            { key: 'password', label: 'Password *', placeholder: 'Min. 6 karakter', type: 'password' },
            { key: 'confirmPw', label: 'Konfirmasi Password *', placeholder: 'Ulangi password', type: 'password' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
              <Input type={type || 'text'} value={form[key as keyof typeof form]} onChange={f(key as keyof typeof form)} placeholder={placeholder} required={label.includes('*')} className="rounded-xl" />
            </div>
          ))}

          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground rounded-xl btn-glow h-11 font-semibold">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Daftar Sekarang'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Sudah punya akun?{' '}
          <Link to="/reseller/login" className="text-primary font-semibold hover:underline">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
