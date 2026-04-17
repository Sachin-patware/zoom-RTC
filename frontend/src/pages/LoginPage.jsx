import { useEffect, useMemo, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { ArrowRight, LoaderCircle, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthScaffold from "../components/AuthScaffold";
import AuthField from "../components/AuthField";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { advanceOnEnter } from "../lib/formNavigation";
import {
  clearPendingVerification,
  setPendingVerification
} from "../lib/pendingVerification";
import { validateEmail, validatePassword } from "../lib/authValidation";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";
  const verifiedEmail = location.state?.verifiedEmail || "";
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [email, setEmail] = useState(verifiedEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleWidth, setGoogleWidth] = useState("360");
  const [touched, setTouched] = useState({
    email: Boolean(verifiedEmail),
    password: false
  });

  const errors = useMemo(
    () => ({
      email: validateEmail(email),
      password: validatePassword(password)
    }),
    [email, password]
  );
  const isFormValid = !errors.email && !errors.password;

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

  const markTouched = (field) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isFormValid) {
      setTouched({ email: true, password: true });
      toast.error("Please fix the highlighted fields.");
      return;
    }

    const normalizedEmail = email.trim();

    try {
      setLoading(true);
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: { email: normalizedEmail, password }
      });

      clearPendingVerification();
      login(data.user, data.accessToken, data.refreshToken);
      toast.success("Logged in successfully.");
      navigate(from, { replace: true });
    } catch (requestError) {
      if (requestError.data?.code === "EMAIL_NOT_VERIFIED") {
        setPendingVerification({ email: normalizedEmail, password });
        toast("Please verify your email first.");
        navigate(`/verify-otp?email=${encodeURIComponent(normalizedEmail)}`);
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

      clearPendingVerification();
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
          <AuthField
            ref={emailRef}
            label="Email address"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => markTouched("email")}
            onKeyDown={(event) => advanceOnEnter(event, passwordRef)}
            placeholder="you@example.com"
            autoComplete="email"
            icon={<Mail size={18} />}
            error={touched.email ? errors.email : ""}
          />

          <AuthField
            ref={passwordRef}
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onBlur={() => markTouched("password")}
            placeholder="Enter your password"
            autoComplete="current-password"
            icon={<Lock size={18} />}
            error={touched.password ? errors.password : ""}
            rightLabel={
              <Link to="/forgot-password" className="text-xs font-semibold text-indigo-300 hover:text-indigo-200">
                Forgot Password?
              </Link>
            }
          />

          <button type="submit" disabled={loading || !isFormValid} className="brand-button w-full">
            {loading ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Login
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </AuthScaffold>
  );
}
