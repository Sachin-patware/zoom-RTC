import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero-grid px-4">
        <div className="surface-card w-full max-w-sm p-8 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-400" />
          <p className="mt-5 text-sm text-slate-300">Checking your session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
