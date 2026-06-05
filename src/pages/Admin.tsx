import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, Lock, User, LogIn } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { adminLogin } from '@/lib/admin-auth';
import { cn } from '@/lib/utils';

export default function Admin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!username || !password) {
      setError('Username dan password wajib diisi');
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => {
      const ok = adminLogin(username, password);
      if (ok) {
        navigate('/admin/dashboard');
      } else {
        setError('Username atau password salah');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-primary/15 blur-2xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="glass-dark border border-white/10 rounded-3xl p-8 shadow-glass">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-green animate-pulse-glow">
              <Zap className="w-8 h-8 text-white fill-current" />
            </div>
            <h1 className="text-2xl font-bold text-white">SHIELACOM CELL</h1>
            <p className="text-white/50 text-sm mt-1">Admin Dashboard Login</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="text-white/70 text-xs font-medium mb-2 block">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="Masukkan username"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary h-12 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-white/70 text-xs font-medium mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="Masukkan password"
                  className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary h-12 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleLogin}
              disabled={loading}
              className={cn(
                'w-full h-12 rounded-xl font-semibold text-base gap-2 bg-primary text-primary-foreground btn-glow shadow-green',
                loading && 'opacity-80'
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Masuk ke Dashboard
                </>
              )}
            </Button>
          </div>

          <p className="text-center text-white/30 text-xs mt-6">
            &copy; {new Date().getFullYear()} SHIELACOM CELL Admin Panel
          </p>
        </div>
      </div>
    </div>
  );
}
