import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      const from = (location.state as { from?: { pathname?: string } | string } | null)?.from;
      const requested = typeof from === 'string' ? from : from?.pathname;
      navigate(requested || (profile?.role === 'admin' || profile?.role === 'manager' ? '/admin' : '/profile'), { replace: true });
    }
  }, [loading, user, profile?.role, location.state, navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.error) { setError(result.error); return; }
    navigate(result.role === 'admin' || result.role === 'manager' ? '/admin' : '/profile', { replace: true });
  };

  return <div className="flex min-h-screen items-center justify-center bg-[#fbf8ff] px-4 py-10">
    <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 shadow-xl sm:p-8">
      <div className="mb-7 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#f0008f] text-xl font-black text-white">90</div><h1 className="mt-4 text-3xl font-black uppercase">Staff sign in</h1><p className="mt-2 text-sm text-muted-foreground">Use the account created by your administrator.</p></div>
      {error && <div role="alert" aria-live="polite" className="mb-5 rounded-xl border border-red-200 bg-fuchsia-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={submit} className="space-y-5">
        <div><label htmlFor="email" className="mb-2 block text-sm font-bold">Email</label><input id="email" type="email" autoComplete="email" required disabled={submitting} value={email} onChange={e=>setEmail(e.target.value)} className="h-12 w-full rounded-xl border px-4 outline-none focus:border-[#f0008f] focus:ring-2 focus:ring-fuchsia-100" /></div>
        <div><label htmlFor="password" className="mb-2 block text-sm font-bold">Password</label><div className="relative"><input id="password" type={showPassword?'text':'password'} autoComplete="current-password" required disabled={submitting} value={password} onChange={e=>setPassword(e.target.value)} className="h-12 w-full rounded-xl border px-4 pr-16 outline-none focus:border-[#f0008f] focus:ring-2 focus:ring-fuchsia-100"/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute inset-y-0 right-0 px-4 text-sm font-bold">{showPassword?'Hide':'Show'}</button></div></div>
        <button type="submit" disabled={submitting} className="h-13 w-full rounded-full bg-[#0d0914] px-5 py-3 font-bold text-white transition hover:bg-[#f0008f] disabled:opacity-60">{submitting?'Signing in…':'Sign in'}</button>
      </form>
      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">Accounts are managed in Supabase Authentication. Contact an administrator if you need access.</p>
    </div>
  </div>;
}
