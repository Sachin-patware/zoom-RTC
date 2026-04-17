import { useMemo, useState } from "react";
import { ArrowRight, LoaderCircle, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import AuthScaffold from "../components/AuthScaffold";
import AuthField from "../components/AuthField";
import { apiRequest } from "../lib/api";
import { validateEmail } from "../lib/authValidation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState("");
  const [touched, setTouched] = useState(false);
  const emailError = useMemo(() => validateEmail(email), [email]);
  const isFormValid = !emailError;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isFormValid) {
      setTouched(true);
      toast.error("Please fix the highlighted field.");
      return;
    }

    try {
      setLoading(true);
      const normalizedEmail = email.trim();
      const data = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: { email: normalizedEmail }
      });
      setSubmitted(normalizedEmail);
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
        <AuthField
          label="Email address"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setSubmitted("");
          }}
          onBlur={() => setTouched(true)}
          placeholder="you@example.com"
          autoComplete="email"
          icon={<Mail size={18} />}
          error={touched ? emailError : ""}
          hint="We'll send a secure reset link to this email."
        />

        {submitted ? (
          <div className="auth-success">
            Reset instructions were sent to <span className="font-semibold text-white">{submitted}</span>.
          </div>
        ) : null}

        <button type="submit" disabled={loading || !isFormValid} className="brand-button w-full">
          {loading ? (
            <>
              <LoaderCircle size={18} className="animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Send reset link
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </AuthScaffold>
  );
}
