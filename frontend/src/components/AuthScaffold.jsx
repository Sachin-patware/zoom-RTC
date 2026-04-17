import { Link } from "react-router-dom";
import { ShieldCheck, Sparkles, Video, Zap } from "lucide-react";

const highlights = [
  "Reliable email and Google authentication",
  "Secure account recovery and session handling",
  "Designed for Zoom-style RTC experiences",
  "Responsive dark UI for desktop and mobile"
];

export default function AuthScaffold({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-hero-grid px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden animate-rise lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-indigo-200">
            <Sparkles size={14} />
            Meeting-ready auth
          </div>

          <h1 className="mt-6 max-w-[11ch] text-5xl font-extrabold leading-[0.95] tracking-tight text-white xl:text-6xl">
            Secure access for your next meeting
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
            Professional sign in and onboarding flows built for your RTC product,
            while your backend stays exactly the same.
          </p>

          <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
            {highlights.map((item, index) => (
              <div key={item} className="surface-card animate-rise p-5" style={{ animationDelay: `${index * 90}ms` }}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-200">
                    <ShieldCheck size={18} />
                  </div>
                  <p className="text-sm leading-6 text-slate-300">{item}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Video size={16} className="text-indigo-300" />
              Video-first UX
            </div>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-indigo-300" />
              Fast auth flow
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-xl animate-rise">
          <div className="surface-card overflow-hidden">
            <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5 sm:px-8">
              <Link to="/" className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow">
                  <Video size={22} className="text-white" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold tracking-tight text-white">ZoomRTC</div>
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    Auth suite
                  </div>
                </div>
              </Link>
            </div>

            <div className="px-6 py-7 sm:px-8 sm:py-8">
              <h2 className="text-3xl font-extrabold tracking-tight text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{subtitle}</p>

              <div className="mt-8">{children}</div>

              {footer ? <div className="mt-8 border-t border-white/10 pt-6">{footer}</div> : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
