import { Link, useNavigate } from "react-router-dom";
import { Video } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function SiteNavbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow">
            <Video size={20} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight text-white">ZoomRTC</div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
              Secure meetings
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 md:inline-flex">
                {user?.name || "User"}
              </span>
              <Link to="/dashboard" className="ghost-button hidden sm:inline-flex">
                Dashboard
              </Link>
              <button type="button" onClick={handleLogout} className="brand-button">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="ghost-button">
                Login
              </Link>
              <Link to="/signup" className="brand-button">
                Signup
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
