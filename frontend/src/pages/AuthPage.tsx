import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";

import { getGoogleLoginUrl, getMe } from "../api/auth";
import { useAuthStore } from "../store/authStore";

export default function AuthPage() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const authError = searchParams.get("auth_error");

    if (authError) {
      toast.error("Google login failed");
      setSearchParams({}, { replace: true });
      return;
    }

    if (!token) return;

    let cancelled = false;

    const completeLogin = async () => {
      try {
        setIsSigningIn(true);
        sessionStorage.setItem("access_token", token);
        const user = await getMe();
        if (cancelled) return;
        setAuth(user, token);
        setSearchParams({}, { replace: true });
        toast.success("Signed in with Google");
        navigate("/", { replace: true });
      } catch {
        if (cancelled) return;
        sessionStorage.removeItem("access_token");
        toast.error("Google login failed");
        setIsSigningIn(false);
        setSearchParams({}, { replace: true });
      }
    };

    void completeLogin();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams, setAuth, setSearchParams]);

  const handleGoogleLogin = () => {
    window.location.href = getGoogleLoginUrl();
  };

  return (
    <>
      <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
                DR
              </span>

              <span className="text-white font-semibold text-lg tracking-tight">
                Deep Research
              </span>
            </div>

            <p className="text-slate-400 text-sm">
              Ask a question. Get a thorough research report with sources.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h2 className="text-white font-semibold text-xl mb-2 text-center">
              Sign in to continue
            </h2>

            <p className="text-slate-400 text-sm text-center mb-8">
              Sign in to queue research jobs and view your reports
            </p>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>

      {isSigningIn && (
        <div className="fixed inset-0 z-50 bg-navy-900/80 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />

          <h3 className="mt-8 text-xl font-semibold text-white">
            Signing you in...
          </h3>

          <p className="mt-2 text-slate-400 text-center">
            Verifying your Google account
            <br />
            Preparing your workspace
          </p>
        </div>
      )}
    </>
  );
}
