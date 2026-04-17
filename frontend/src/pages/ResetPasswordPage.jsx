import { useMemo, useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";
import AuthScaffold from "../components/AuthScaffold";
import { apiRequest } from "../lib/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      toast.error("Reset token is missing from the URL.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const data = await apiRequest("/auth/reset-password", {
        method: "POST",
        body: { token, password }
      });
      toast.success(data.message || "Password reset successfully.");
    } catch (requestError) {
      toast.error(requestError.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      title="Reset password"
      subtitle="Choose a new secure password for your account."
      footer={
        <p className="text-sm text-slate-400">
          Back to account access
          <Link to="/login" className="ml-2 font-bold text-indigo-300 hover:text-indigo-200">
            Login
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="auth-panel space-y-4">
        <label className="block">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
            New password
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

        <label className="block">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Confirm password
          </span>
          <div className="relative">
            <div className="auth-icon">
              <Lock size={18} />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
              className="input-shell pl-[4.5rem]"
            />
          </div>
        </label>

        <button type="submit" disabled={loading} className="brand-button w-full">
          {loading ? "Updating..." : "Update password"}
          <ArrowRight size={18} />
        </button>
      </form>
    </AuthScaffold>
  );
}
