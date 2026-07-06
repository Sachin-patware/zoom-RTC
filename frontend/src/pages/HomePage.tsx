import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Video, Shield, Zap, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { isAuthenticated } = useAuth() as any;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[120px] pointer-events-none" />
      <div className="noise-bg" />

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black shadow-md overflow-hidden">
              <img src="/logo.png" alt="SyncMeet Logo" className="h-full w-full object-cover" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">SyncMeet</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#security" className="hover:text-foreground transition-colors">Security</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to={isAuthenticated ? "/join" : "/login"}>
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Join Meeting</Button>
            </Link>
            <Link to={isAuthenticated ? "/dashboard" : "/login"}>
              <Button className="glow-primary">
                {isAuthenticated ? "Dashboard" : "Sign In"}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-32 pb-24">
        {/* Hero Section */}
        <section className="container mx-auto px-6 pt-20 pb-32 text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-primary mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              SyncMeet 2.0 is live
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-8 leading-[1.1]">
              Where serious teams <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                make decisions.
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              A premium meeting platform designed like a control room. Dense but breathing. Information-rich without the clutter. Start collaborating with precision.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
                <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 glow-primary">
                  {isAuthenticated ? "Go to Dashboard" : "Get Started"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to={isAuthenticated ? "/join" : "/login"}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-14 px-8 border-white/10 hover:bg-white/5">
                  Join with Code
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-24 relative rounded-2xl border border-white/10 bg-white p-8 shadow-2xl max-w-xl mx-auto"
          >
            <img 
              src="/logo.png" 
              alt="SyncMeet Logo Showcase" 
              className="rounded-xl w-full max-h-[450px] object-contain"
            />
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="container mx-auto px-6 py-24 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold mb-4">Built for focus.</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Every pixel intentional. Every interaction satisfying.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Zero Latency Feel", desc: "Optimized video routing makes interactions feel instantaneous. No more talking over each other." },
              { icon: Shield, title: "End-to-End Encrypted", desc: "Your strategic decisions stay yours. Enterprise-grade security built into the core." },
              { icon: Globe, title: "Global Edge Network", desc: "Crystal clear audio and video regardless of where your team is scattered." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold font-display mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-card/30 py-12 relative z-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Video className="h-5 w-5" />
            <span className="font-display font-bold">SyncMeet</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SyncMeet. Crafted for professionals.
          </div>
        </div>
      </footer>
    </div>
  );
}
