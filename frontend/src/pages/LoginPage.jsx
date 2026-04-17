import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { ArrowRight, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthScaffold from "../components/AuthScaffold";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleWidth, setGoogleWidth] = useState("360");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const updateWidth = () => {
      if (typeof window === "undefined") return;
      setGoogleWidth(String(Math.max(280, Math.min(392, window.innerWidth - 80))));
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: { email, password }
      });

      login(data.user, data.accessToken, data.refreshToken);
      toast.success("Logged in successfully.");
      navigate(from, { replace: true });
    } catch (requestError) {
      if (requestError.data?.code === "EMAIL_NOT_VERIFIED") {
        toast("Please verify your email first.");
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
        return;
      }

      toast.error(requestError.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);

      const data = await apiRequest("/auth/google", {
        method: "POST",
        body: { credential: credentialResponse.credential }
      });

      login(data.user, data.accessToken, data.refreshToken);
      toast.success("Logged in with Google.");
      navigate(from, { replace: true });
    } catch (requestError) {
      toast.error(requestError.message || "Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      title="Login"
      subtitle="Access your account with email and password or continue with Google."
      footer={
        <p className="text-sm text-slate-400">
          New to ZoomRTC?
          <Link to="/signup" className="ml-2 font-bold text-indigo-300 hover:text-indigo-200">
            Create an account
          </Link>
        </p>
      }
    >
      <div className="space-y-5">
        <div className="flex justify-center overflow-hidden rounded-2xl bg-white">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Google login failed.")}
            theme="outline"
            shape="pill"
            width={googleWidth}
            text="continue_with"
          />
        </div>

        <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          <div className="h-px flex-1 bg-white/10" />
          <span>or use email</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="auth-panel space-y-4">
          <label className="block">
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Email address
            </span>
            <div className="relative">
              <div className="auth-icon">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="input-shell pl-[4.5rem]"
              />
            </div>
          </label>

          <label className="block">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Password
              </span>
              <Link to="/forgot-password" className="text-xs font-semibold text-indigo-300 hover:text-indigo-200">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <div className="auth-icon">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="input-shell pl-[4.5rem]"
              />
            </div>
          </label>

          <button type="submit" disabled={loading} className="brand-button w-full">
            {loading ? "Signing in..." : "Login"}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </AuthScaffold>
  );
}
