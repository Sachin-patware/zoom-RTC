import { useMemo, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";
import AuthScaffold from "../components/AuthScaffold";
import { apiRequest } from "../lib/api";

export default function VerifyOtpPage() {
  const [searchParams] = useSearchParams();
  const email = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (event) => {
    event.preventDefault();

    if (!email || !otp.trim()) {
      toast.error("Email and OTP are required.");
      return;
    }

    try {
      setLoading(true);
      const data = await apiRequest("/auth/verify-otp", {
        method: "POST",
        body: { email, otp }
      });
      toast.success(data.message || "Email verified successfully.");
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
        <label className="block">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
            OTP code
          </span>
          <div className="relative">
            <div className="auth-icon">
              <ShieldCheck size={18} />
            </div>
            <input
              type="text"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter 6 digit OTP"
              className="input-shell pl-[4.5rem]"
            />
          </div>
        </label>

        <button type="submit" disabled={loading} className="brand-button w-full">
          {loading ? "Verifying..." : "Verify account"}
          <ArrowRight size={18} />
        </button>
      </form>
    </AuthScaffold>
  );
}
