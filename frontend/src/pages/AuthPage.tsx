import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

import { googleLogin } from "../api/auth";
import { useAuthStore } from "../store/authStore";

export default function AuthPage() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleGoogleLogin = async (credential: string) => {
    try {
      const data = await googleLogin(credential);

      setAuth(data.user, data.access_token);

      toast.success("Signed in with Google");

      navigate("/");
    } catch {
      toast.error("Google login failed");
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
              DA
            </span>

            <span className="text-white font-semibold text-lg tracking-tight">
              DeepAgent Research
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

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  handleGoogleLogin(credentialResponse.credential);
                }
              }}
              onError={() => {
                toast.error("Google login failed");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
