import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import AuthScaffold from "../components/AuthScaffold";
import { apiRequest } from "../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      const data = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: { email }
      });
      toast.success(data.message || "Reset link sent.");
    } catch (requestError) {
      toast.error(requestError.message || "Unable to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      title="Forgot password"
      subtitle="Enter your email address and we will send a secure reset link."
      footer={
        <p className="text-sm text-slate-400">
          Remembered your password?
          <Link to="/login" className="ml-2 font-bold text-indigo-300 hover:text-indigo-200">
            Back to login
          </Link>
        </p>
      }
    >
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

        <button type="submit" disabled={loading} className="brand-button w-full">
          {loading ? "Sending..." : "Send reset link"}
          <ArrowRight size={18} />
        </button>
      </form>
    </AuthScaffold>
  );
}
