import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, LoaderCircle, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthScaffold from "../components/AuthScaffold";
import AuthField from "../components/AuthField";
import { apiRequest } from "../lib/api";
import { validateConfirmPassword, validatePassword } from "../lib/authValidation";
import { advanceOnEnter } from "../lib/formNavigation";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false
  });

  const errors = useMemo(
    () => ({
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword)
    }),
    [password, confirmPassword]
  );
  const isFormValid = token && !errors.password && !errors.confirmPassword;

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      navigate("/login", { replace: true });
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [navigate, successMessage]);

  const markTouched = (field) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      toast.error("Reset token is missing from the URL.");
      return;
    }

    if (!isFormValid) {
      setTouched({ password: true, confirmPassword: true });
      toast.error("Please fix the highlighted fields.");
      return;
    }

    try {
      setLoading(true);
      const data = await apiRequest("/auth/reset-password", {
        method: "POST",
        body: { token, password }
      });
      setSuccessMessage(data.message || "Password reset successfully.");
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
        <AuthField
          ref={passwordRef}
          label="New password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onBlur={() => markTouched("password")}
          onKeyDown={(event) => advanceOnEnter(event, confirmPasswordRef)}
          placeholder="At least 6 characters"
          autoComplete="new-password"
          icon={<Lock size={18} />}
          error={touched.password ? errors.password : ""}
        />

        <AuthField
          ref={confirmPasswordRef}
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          onBlur={() => markTouched("confirmPassword")}
          placeholder="Repeat your password"
          autoComplete="new-password"
          icon={<Lock size={18} />}
          error={touched.confirmPassword ? errors.confirmPassword : ""}
        />

        {successMessage ? <div className="auth-success">{successMessage} Redirecting to login...</div> : null}

        <button type="submit" disabled={loading || !isFormValid || Boolean(successMessage)} className="brand-button w-full">
          {loading ? (
            <>
              <LoaderCircle size={18} className="animate-spin" />
              Updating...
            </>
          ) : (
            <>
              Update password
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </AuthScaffold>
  );
}
