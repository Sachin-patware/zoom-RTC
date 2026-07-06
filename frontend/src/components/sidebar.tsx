import { Link, useLocation } from "react-router-dom";
import { Video, Calendar, Settings, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/schedule", icon: Calendar, label: "Schedule" },
  { href: "/join", icon: Video, label: "Join" },
];

export function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="flex h-screen w-20 flex-col items-center border-r border-white/5 bg-card/50 py-6 glass-panel fixed left-0 top-0 z-40">
      <Link to="/" className="mb-12 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black shadow-lg transition-transform hover:scale-105 active:scale-95 overflow-hidden" data-testid="link-home">
        <img src="/logo.png" alt="SyncMeet Logo" className="h-full w-full object-cover" />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-6">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
                isActive
                  ? "bg-white/10 text-primary"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="h-5 w-5" />
              <span className="absolute left-14 rounded-md bg-popover px-2 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -left-3 h-4 w-1 rounded-r-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      <Link
        to="/settings"
        className={cn(
          "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 mt-auto",
          currentPath === "/settings"
            ? "bg-white/10 text-primary"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
        )}
        data-testid="nav-settings"
      >
        <Settings className="h-5 w-5" />
        <span className="absolute left-14 rounded-md bg-popover px-2 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 pointer-events-none">
          Settings
        </span>
      </Link>
    </div>
  );
}
