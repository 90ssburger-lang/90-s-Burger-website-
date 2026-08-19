import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/lib/supabase";

type AuthTab = "signin" | "signup";
type LoadingAction = "signin" | "signup" | "google";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isPasswordRecovery = searchParams.get('reset') === '1';
  const { user, loading, profile, signIn, signUp, resetPassword } = useAuth();

  const [tab, setTab] = useState<AuthTab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingAction, setLoadingAction] = useState<LoadingAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);

  useEffect(() => {
    if (!loading && user && !isPasswordRecovery) {
      const requested = (location.state as { from?: { pathname?: string } | string } | null)?.from;
      const requestedPath = typeof requested === 'string' ? requested : requested?.pathname;
      navigate(requestedPath || (profile?.role === 'admin' || profile?.role === 'manager' ? '/admin' : '/'), { replace: true });
    }
  }, [loading, user, profile?.role, navigate, location.state, isPasswordRecovery]);

  const isBusy = loading || loadingAction !== null;

  const clearMessages = () => {
    setError(null);
    setInfo(null);
  };

  const validateForm = () => {
    if (!email.trim()) {
      return "Email is required.";
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return "Please enter a valid email address.";
    }

    if (!password) {
      return "Password is required.";
    }

    if (tab === "signup") {
      if (password.length < 8) {
        return "Password must be at least 8 characters.";
      }

      if (password !== confirmPassword) {
        return "Passwords do not match.";
      }
    }

    return null;
  };

  const handleGoogleSignIn = async () => {
    clearMessages();
    setLoadingAction("google");

    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoadingAction(null);
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
      return;
    }

    window.location.href = "/";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();

    if (forgotMode) {
      if (!EMAIL_REGEX.test(email.trim())) { setError('Enter a valid email address.'); return; }
      setLoadingAction('signin');
      const { error: resetError } = await resetPassword(email);
      setLoadingAction(null);
      if (resetError) setError(resetError); else setInfo('Password reset email sent. Check your inbox and spam folder.');
      return;
    }

    if (isPasswordRecovery) {
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
      setLoadingAction('signin');
      const { error: updateError } = await supabase.auth.updateUser({ password });
      setLoadingAction(null);
      if (updateError) setError(updateError.message); else { setInfo('Password updated. Redirecting…'); window.setTimeout(()=>navigate(profile?.role === 'admin' || profile?.role === 'manager' ? '/admin' : '/', {replace:true}),800); }
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (tab === "signup") {
      setLoadingAction("signup");
      const { error: signUpError, requiresEmailVerification } = await signUp(email.trim(), password);
      setLoadingAction(null);

      if (signUpError) {
        setError(signUpError);
        return;
      }

      if (requiresEmailVerification) {
        setInfo("Account created. Please verify your email before signing in.");
        return;
      }

      navigate("/", { replace: true });
      return;
    }

    setLoadingAction("signin");
    const { error: signInError, role } = await signIn(email.trim(), password);
    setLoadingAction(null);

    if (signInError) {
      setError(signInError);
      return;
    }

    const requested = (location.state as { from?: { pathname?: string } | string } | null)?.from;
    const requestedPath = typeof requested === 'string' ? requested : requested?.pathname;
    navigate(requestedPath || (role === 'admin' || role === 'manager' ? '/admin' : '/'), { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">{isPasswordRecovery ? 'Set new password' : forgotMode ? 'Reset password' : tab === "signin" ? "Sign in" : "Sign up"}</h1>
        <p className="mt-1 text-sm text-slate-600">{isPasswordRecovery ? 'Enter a secure new password.' : forgotMode ? 'We will email you a secure reset link.' : 'Use Google or your email and password.'}</p>

        {!forgotMode && !isPasswordRecovery && <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1" role="tablist">
          <button
            type="button"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === "signin" ? "bg-white text-slate-900 shadow" : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => {
              setTab("signin");
              clearMessages();
            }}
            disabled={isBusy}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === "signup" ? "bg-white text-slate-900 shadow" : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => {
              setTab("signup");
              clearMessages();
            }}
            disabled={isBusy}
          >
            Sign up
          </button>
        </div>}

        {!forgotMode && !isPasswordRecovery && <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isBusy}
          className="mt-4 flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingAction === "google" ? "Redirecting..." : "Continue with Google"}
        </button>}

        {!forgotMode && !isPasswordRecovery && <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span>or</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>}

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        {info && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isPasswordRecovery && <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              placeholder="you@example.com"
              required
              disabled={isBusy}
            />
          </div>}

          {!forgotMode && <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={tab === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-16 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder="Enter your password"
                required
                disabled={isBusy}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-600 hover:text-slate-900"
                onClick={() => setShowPassword((value) => !value)}
                disabled={isBusy}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>}

          {tab === "signup" && !forgotMode && !isPasswordRecovery && (
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder="Re-enter your password"
                required
                disabled={isBusy}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isBusy}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingAction === "signin" && (forgotMode ? 'Sending…' : isPasswordRecovery ? 'Updating…' : "Signing in...")}
            {loadingAction === "signup" && "Creating account..."}
            {!loadingAction && (forgotMode ? 'Send reset link' : isPasswordRecovery ? 'Update password' : tab === "signin" ? "Sign in" : "Create account")}
          </button>
          {tab === 'signin' && !isPasswordRecovery && <button type="button" onClick={()=>{setForgotMode(!forgotMode);clearMessages()}} className="w-full text-sm font-medium text-slate-600 hover:text-slate-900">{forgotMode ? 'Back to sign in' : 'Forgot password?'}</button>}
        </form>
      </div>
    </div>
  );
}
