import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resellerLogin } from '@/lib/reseller-auth';

export default function ResellerLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await resellerLogin(username, password);
    if (result.success) navigate('/reseller/dashboard');
    else { setError(result.error || 'Login gagal'); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Login Reseller</h1>
          <p className="text-muted-foreground text-sm mt-1">SHIELACOM CELL</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Username</label>
            <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" required className="rounded-xl" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
            <div className="relative">
              <Input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="rounded-xl pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground rounded-xl btn-glow h-11 font-semibold">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Masuk'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Belum punya akun?{' '}
          <Link to="/reseller/register" className="text-primary font-semibold hover:underline">Daftar Sekarang</Link>
        </p>
        <p className="text-center text-sm text-muted-foreground mt-2">
          <Link to="/" className="hover:text-foreground">← Kembali ke Beranda</Link>
        </p>
      </div>
    </div>
  );
}
