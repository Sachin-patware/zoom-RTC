import { ArrowRight, MonitorUp, Shield, Video, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SiteNavbar from "../components/SiteNavbar";
import { useAuth } from "../context/AuthContext";

const features = [
  {
    icon: Video,
    title: "Video meetings",
    description: "Host crisp meetings with a clean interface designed for focus."
  },
  {
    icon: MonitorUp,
    title: "Screen sharing",
    description: "Present work, demos, and collaboration flows in a single space."
  },
  {
    icon: Shield,
    title: "Secure auth",
    description: "Email, Google sign in, password reset, OTP verification, and sessions."
  }
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handlePrimaryAction = () => {
    navigate(isAuthenticated ? "/dashboard" : "/login");
  };

  const handleSecondaryAction = () => {
    navigate(isAuthenticated ? "/dashboard" : "/signup");
  };

  return (
    <div className="min-h-screen bg-hero-grid text-white">
      <SiteNavbar />

      <main>
        <section className="px-4 pb-20 pt-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="animate-rise">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-indigo-200">
                <Zap size={14} />
                Connect instantly with video meetings
              </div>

              <h1 className="mt-6 max-w-[11ch] text-5xl font-extrabold leading-[0.92] tracking-tight text-white sm:text-6xl xl:text-7xl">
                Secure meetings for modern teams.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                ZoomRTC brings your authentication flow, dashboard, and meeting entry
                points together in a polished product experience that feels ready for production.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={handlePrimaryAction} className="brand-button">
                  Start Meeting
                  <ArrowRight size={18} />
                </button>
                <button type="button" onClick={handleSecondaryAction} className="ghost-button">
                  Join Meeting
                </button>
              </div>
            </div>

            <div className="animate-rise">
              <div className="surface-card relative overflow-hidden p-4 sm:p-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.16),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.02),_transparent)]" />
                <div className="relative rounded-[24px] border border-white/10 bg-ink-900/90 p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex gap-2">
                      <span className="h-3 w-3 rounded-full bg-rose-400/70" />
                      <span className="h-3 w-3 rounded-full bg-amber-400/70" />
                      <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
                    </div>
                    <div className="text-sm font-semibold text-slate-300">Weekly Product Sync</div>
                    <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                      Connected
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr_170px]">
                    <div className="relative min-h-[320px] overflow-hidden rounded-[24px] border border-white/10 bg-[#08101f]">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.16),_transparent_45%),linear-gradient(180deg,_rgba(5,8,22,0.08),_rgba(5,8,22,0.72))]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video size={50} className="text-slate-600" />
                      </div>
                      <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-slate-200 backdrop-blur-md">
                        Priya Shah (Host)
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {[1, 2, 3].map((card) => (
                        <div
                          key={card}
                          className="min-h-[98px] rounded-[22px] border border-white/10 bg-white/[0.03]"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Everything you need to launch the auth experience
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                Clean onboarding, secure access, and a dashboard built for a meeting product.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="surface-card animate-rise p-7 transition hover:-translate-y-1 hover:bg-white/[0.07]"
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-200">
                      <Icon size={24} />
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-white">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="surface-card relative overflow-hidden px-6 py-10 text-center sm:px-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.14),_transparent_40%)]" />
              <div className="relative">
                <h3 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Ready to plug your frontend into the working backend?
                </h3>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                  Start with login, signup, Google auth, password recovery, and a clean dashboard flow.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link to={isAuthenticated ? "/dashboard" : "/signup"} className="brand-button">
                    Launch Dashboard
                  </Link>
                  <Link to="/login" className="ghost-button">
                    View Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
