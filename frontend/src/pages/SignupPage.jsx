import { useEffect, useMemo, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { ArrowRight, LoaderCircle, Lock, Mail, User } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import AuthScaffold from "../components/AuthScaffold";
import AuthField from "../components/AuthField";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { validateEmail, validateName, validatePassword } from "../lib/authValidation";
import { advanceOnEnter } from "../lib/formNavigation";
import { clearPendingVerification, setPendingVerification } from "../lib/pendingVerification";

export default function SignupPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleWidth, setGoogleWidth] = useState("360");
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false
  });

  const errors = useMemo(
    () => ({
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password)
    }),
    [name, email, password]
  );
  const isFormValid = !errors.name && !errors.email && !errors.password;

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
      setTouched({ name: true, email: true, password: true });
      toast.error("Please fix the highlighted fields.");
      return;
    }

    const normalizedEmail = email.trim();

    try {
      setLoading(true);
      await apiRequest("/auth/signup", {
        method: "POST",
        body: { name: name.trim(), email: normalizedEmail, password }
      });

      setPendingVerification({ email: normalizedEmail, password });
      toast.success("Account created. Check your email for the OTP.");
      navigate(`/verify-otp?email=${encodeURIComponent(normalizedEmail)}`, { replace: true });
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

      clearPendingVerification();
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
          <AuthField
            ref={nameRef}
            label="Full name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => markTouched("name")}
            onKeyDown={(event) => advanceOnEnter(event, emailRef)}
            placeholder="John Doe"
            autoComplete="name"
            icon={<User size={18} />}
            error={touched.name ? errors.name : ""}
          />

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
            placeholder="At least 6 characters"
            autoComplete="new-password"
            icon={<Lock size={18} />}
            error={touched.password ? errors.password : ""}
            hint="Press Enter on the last field to create your account."
          />

          <button type="submit" disabled={loading || !isFormValid} className="brand-button w-full">
            {loading ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Signup
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </AuthScaffold>
  );
}
