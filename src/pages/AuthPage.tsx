import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

declare global {
  interface Window {
    google?: { accounts: { id: { initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void; auto_select?: boolean; cancel_on_tap_outside?: boolean }) => void; renderButton: (element: HTMLElement, options: Record<string, unknown>) => void } } };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '407839327023-9o6529lujoatgdqdkb6regi4r6dnig1j.apps.googleusercontent.com';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading, signIn, signInWithGoogleToken } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
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
      navigate(requested || (profile?.role === 'kitchen' ? '/kitchen' : profile?.role === 'admin' || profile?.role === 'manager' ? '/admin' : '/profile'), { replace: true });
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

  useEffect(() => {
    let active = true;
    const renderGoogleButton = () => {
      if (!active || !window.google || !googleButtonRef.current) return;
      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        auto_select: false,
        cancel_on_tap_outside: true,
        callback: async ({ credential }) => {
          if (!credential) return;
          setError(null); setSubmitting(true);
          const result = await signInWithGoogleToken(credential);
          setSubmitting(false);
          if (result.error) { setError(result.error); return; }
          const from = (location.state as { from?: { pathname?: string } | string } | null)?.from;
          const requested = typeof from === 'string' ? from : from?.pathname;
          navigate(requested || '/profile', { replace: true });
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, { type: 'standard', theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', logo_alignment: 'left', width: 352 });
    };
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (window.google) renderGoogleButton();
    else if (existing) existing.addEventListener('load', renderGoogleButton, { once: true });
    else { const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.onload = renderGoogleButton; document.head.appendChild(script); }
    return () => { active = false; existing?.removeEventListener('load', renderGoogleButton); };
  }, [location.state, navigate, signInWithGoogleToken]);

  return <div className="flex min-h-screen items-center justify-center bg-[#fbf8ff] px-4 py-10">
    <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 shadow-xl sm:p-8">
      <div className="mb-7 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#a80062] text-xl font-black text-white">90</div><h1 className="mt-4 text-3xl font-black uppercase">Welcome back</h1><p className="mt-2 text-sm text-muted-foreground">Sign in or create your customer account.</p></div>
      {error && <div role="alert" aria-live="polite" className="mb-5 rounded-xl border border-red-200 bg-fuchsia-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className={submitting ? 'pointer-events-none opacity-60' : ''}><div ref={googleButtonRef} className="flex min-h-11 w-full justify-center overflow-hidden" aria-label="Continue with Google" /></div>
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
