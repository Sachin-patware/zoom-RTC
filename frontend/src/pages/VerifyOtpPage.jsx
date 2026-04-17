import { useEffect, useMemo, useState } from "react";
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthScaffold from "../components/AuthScaffold";
import AuthField from "../components/AuthField";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { validateOtp } from "../lib/authValidation";
import {
  clearPendingVerification,
  getPendingVerification
} from "../lib/pendingVerification";

export default function VerifyOtpPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [touched, setTouched] = useState(false);
  const otpError = useMemo(() => validateOtp(otp), [otp]);
  const isFormValid = !otpError && Boolean(email);
  const pendingVerification = useMemo(() => getPendingVerification(), []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleVerify = async (event) => {
    event.preventDefault();

    if (!isFormValid) {
      setTouched(true);
      toast.error(email ? "Please fix the highlighted field." : "Missing email address.");
      return;
    }

    try {
      setLoading(true);
      await apiRequest("/auth/verify-otp", {
        method: "POST",
        body: { email, otp }
      });

      const pendingEmail = pendingVerification?.email?.trim()?.toLowerCase();
      const currentEmail = email.trim().toLowerCase();

      if (pendingEmail === currentEmail && pendingVerification?.password) {
        try {
          const session = await apiRequest("/auth/login", {
            method: "POST",
            body: {
              email: pendingVerification.email.trim(),
              password: pendingVerification.password
            }
          });

          login(session.user, session.accessToken, session.refreshToken);
          clearPendingVerification();
          toast.success("Email verified. You are now signed in.");
          navigate("/dashboard", { replace: true });
        } catch (loginError) {
          clearPendingVerification();
          toast.success("Email verified successfully.");
          toast.error(loginError.message || "Please log in to continue.");
          navigate("/login", {
            replace: true,
            state: { verifiedEmail: email }
          });
        }
        return;
      }

      clearPendingVerification();
      toast.success("Email verified successfully. Please log in.");
      navigate("/login", {
        replace: true,
        state: { verifiedEmail: email }
      });
    } catch (requestError) {
      toast.error(requestError.message || "Unable to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Missing email address.");
      return;
    }

    try {
      setResending(true);
      const data = await apiRequest("/auth/resend-otp", {
        method: "POST",
        body: { email }
      });
      toast.success(data.message || "OTP resent.");
    } catch (requestError) {
      toast.error(requestError.message || "Unable to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthScaffold
      title="Verify email"
      subtitle={`Enter the OTP sent to ${email || "your email"} to activate your account.`}
      footer={
        <div className="flex flex-col items-center gap-3 text-sm text-slate-400 sm:flex-row sm:justify-between">
          <Link to="/login" className="font-bold text-indigo-300 hover:text-indigo-200">
            Back to login
          </Link>
          <button type="button" onClick={handleResend} disabled={resending} className="ghost-button !px-4 !py-2.5">
            {resending ? "Sending..." : "Resend OTP"}
          </button>
        </div>
      }
    >
      <form onSubmit={handleVerify} className="auth-panel space-y-4">
        <AuthField
          label="OTP code"
          type="text"
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
          onBlur={() => setTouched(true)}
          placeholder="Enter 6 digit OTP"
          inputMode="numeric"
          autoComplete="one-time-code"
          icon={<ShieldCheck size={18} />}
          error={touched ? otpError : ""}
          hint={
            pendingVerification?.email?.trim()?.toLowerCase() === email.trim().toLowerCase()
              ? "Your account will be signed in automatically after verification."
              : "Once verified, you can continue to login."
          }
        />

        <button type="submit" disabled={loading || !isFormValid} className="brand-button w-full">
          {loading ? (
            <>
              <LoaderCircle size={18} className="animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              Verify account
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </AuthScaffold>
  );
}
