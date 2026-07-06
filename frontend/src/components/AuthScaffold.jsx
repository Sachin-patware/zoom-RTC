import { Link } from "react-router-dom";
import { ShieldCheck, Sparkles, Video, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const highlights = [
  "Reliable email and Google authentication",
  "Secure account recovery and session handling",
  "Designed for Zoom-style RTC experiences",
  "Responsive dark UI for desktop and mobile"
];

export default function AuthScaffold({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden flex items-center justify-center">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-accent/10 blur-[130px] pointer-events-none" />
      <div className="noise-bg" />

      <div className="relative z-10 w-full max-w-6xl grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
        {/* Left Side: Marketing / Highlights */}
        <section className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary mb-6">
            <Sparkles size={14} />
            Meeting-Ready Auth
          </div>

          <h1 className="font-display font-bold tracking-tight text-white text-5xl xl:text-6xl mb-6 leading-[1.1]">
            Secure access for <br />
            your next meeting
          </h1>

          <p className="text-muted-foreground text-base max-w-md leading-relaxed mb-8">
            Professional sign-in and onboarding flows built for your RTC product, while your backend stays exactly the same.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
            {highlights.map((item, index) => (
              <Card key={index} className="border-white/5 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-colors">
                <CardContent className="p-4 flex gap-3.5 items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <ShieldCheck size={18} />
                  </div>
                  <p className="text-sm leading-snug text-slate-300">{item}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <Video size={16} className="text-primary" />
              Video-first UX
            </div>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-primary" />
              Fast auth flow
            </div>
          </div>
        </section>

        {/* Right Side: Form Card */}
        <section className="w-full max-w-md mx-auto">
          <Card className="border-white/10 bg-card/60 backdrop-blur-xl shadow-2xl rounded-[24px]">
            <CardContent className="p-8">
              {/* Card Header Logo */}
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
                <Link to="/" className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg glow-primary">
                    <Video size={20} />
                  </div>
                  <div>
                    <span className="font-display font-bold text-lg text-white leading-none">SyncMeet</span>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-0.5">Auth Suite</span>
                  </div>
                </Link>
              </div>

              <h2 className="text-2xl font-display font-bold tracking-tight text-white mb-2">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{subtitle}</p>

              <div className="space-y-6">
                {children}
              </div>

              {footer && (
                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                  {footer}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
