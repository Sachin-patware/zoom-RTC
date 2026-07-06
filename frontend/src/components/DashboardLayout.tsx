import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout() {
  const { user } = useAuth();
  
  // Extract initials
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : "SM";

  return (
    <div className="min-h-screen bg-background flex w-full">
      <div className="noise-bg" />
      <Sidebar />
      <main className="flex-1 ml-20 flex flex-col relative z-10">
        <header className="h-16 border-b border-white/5 bg-background/80 backdrop-blur-xl flex items-center justify-end px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm ring-1 ring-primary/30">
              {initials}
            </div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
