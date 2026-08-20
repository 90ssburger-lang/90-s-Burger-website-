import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading, signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const oauthError = query.get('error') || hash.get('error');
    const errorCode = query.get('error_code') || hash.get('error_code');
    if (oauthError || errorCode) {
      window.sessionStorage.removeItem('oauth_return_to');
      navigate('/', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!loading && user) {
      const from = (location.state as { from?: { pathname?: string } | string } | null)?.from;
      const requested = typeof from === 'string' ? from : from?.pathname;
      const oauthReturn = window.sessionStorage.getItem('oauth_return_to');
      window.sessionStorage.removeItem('oauth_return_to');
      navigate(requested || oauthReturn || (profile?.role === 'kitchen' ? '/kitchen' : profile?.role === 'admin' || profile?.role === 'manager' ? '/admin' : '/profile'), { replace: true });
    }
  }, [loading, user, profile?.role, location.state, navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.error) { setError(result.error); return; }
    navigate(result.role === 'kitchen' ? '/kitchen' : result.role === 'admin' || result.role === 'manager' ? '/admin' : '/profile', { replace: true });
  };

  const googleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    const from = (location.state as { from?: { pathname?: string } | string } | null)?.from;
    const requested = typeof from === 'string' ? from : from?.pathname;
    const result = await signInWithGoogle(requested || '/profile');
    if (result.error) { setError(result.error); setSubmitting(false); }
  };

  return <div className="flex min-h-screen items-center justify-center bg-[#fbf8ff] px-4 py-10">
    <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 shadow-xl sm:p-8">
      <div className="mb-7 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#a80062] text-xl font-black text-white">90</div><h1 className="mt-4 text-3xl font-black uppercase">Welcome back</h1><p className="mt-2 text-sm text-muted-foreground">Sign in or create your customer account.</p></div>
      {error && <div role="alert" aria-live="polite" className="mb-5 rounded-xl border border-red-200 bg-fuchsia-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <button type="button" onClick={googleSignIn} disabled={submitting} className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-gray-300 bg-white px-5 font-bold text-gray-900 transition hover:bg-gray-50 disabled:opacity-60" aria-label="Continue with Google"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"/><path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.93A6 6 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.55l3.35-2.62Z"/><path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.82 1.5l2.88-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"/></svg>Continue with Google</button>
      <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-gray-200"/><span className="text-xs font-medium uppercase text-muted-foreground">or use email</span><span className="h-px flex-1 bg-gray-200"/></div>
      <form onSubmit={submit} className="space-y-5">
        <div><label htmlFor="email" className="mb-2 block text-sm font-bold">Email</label><input id="email" type="email" autoComplete="email" required disabled={submitting} value={email} onChange={e=>setEmail(e.target.value)} className="h-12 w-full rounded-xl border px-4 outline-none focus:border-[#f0008f] focus:ring-2 focus:ring-fuchsia-100" /></div>
        <div><label htmlFor="password" className="mb-2 block text-sm font-bold">Password</label><div className="relative"><input id="password" type={showPassword?'text':'password'} autoComplete="current-password" required disabled={submitting} value={password} onChange={e=>setPassword(e.target.value)} className="h-12 w-full rounded-xl border px-4 pr-16 outline-none focus:border-[#f0008f] focus:ring-2 focus:ring-fuchsia-100"/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute inset-y-0 right-0 px-4 text-sm font-bold">{showPassword?'Hide':'Show'}</button></div></div>
        <button type="submit" disabled={submitting} className="h-13 w-full rounded-full bg-[#0d0914] px-5 py-3 font-bold text-white transition hover:bg-[#f0008f] disabled:opacity-60">{submitting?'Signing in…':'Sign in'}</button>
      </form>
      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">Accounts are managed in Supabase Authentication. Contact an administrator if you need access.</p>
    </div>
  </div>;
}
