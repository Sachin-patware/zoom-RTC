import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import AuthScaffold from "../components/AuthScaffold";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
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

  const validateForm = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      return "Name, email, and password are required.";
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return "Please enter a valid email address.";
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setLoading(true);
      await apiRequest("/auth/signup", {
        method: "POST",
        body: { name, email, password }
      });

      toast.success("Account created. Check your email for the OTP.");
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`, { replace: true });
    } catch (requestError) {
      toast.error(requestError.message || "Unable to create account.");
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
      toast.success("Google signup complete.");
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      toast.error(requestError.message || "Google signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      title="Create account"
      subtitle="Set up your ZoomRTC access with email or continue with Google."
      footer={
        <p className="text-sm text-slate-400">
          Already have an account?
          <Link to="/login" className="ml-2 font-bold text-indigo-300 hover:text-indigo-200">
            Login here
          </Link>
        </p>
      }
    >
      <div className="space-y-5">
        <div className="flex justify-center overflow-hidden rounded-2xl bg-white">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Google signup failed.")}
            theme="outline"
            shape="pill"
            width={googleWidth}
            text="continue_with"
          />
        </div>

        <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          <div className="h-px flex-1 bg-white/10" />
          <span>or sign up with email</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="auth-panel space-y-4">
          <label className="block">
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Full name
            </span>
            <div className="relative">
              <div className="auth-icon">
                <User size={18} />
              </div>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="John Doe"
                className="input-shell pl-[4.5rem]"
              />
            </div>
          </label>

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
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Password
            </span>
            <div className="relative">
              <div className="auth-icon">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                className="input-shell pl-[4.5rem]"
              />
            </div>
          </label>

          <button type="submit" disabled={loading} className="brand-button w-full">
            {loading ? "Creating account..." : "Signup"}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </AuthScaffold>
  );
}
