import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Repeat, ArrowRight, Video, CreditCard, Users, Star, Monitor, Zap, CheckCircle, UserPlus, Search, Laptop } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

function AbstractCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let t = 0;
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);
    const orbs = [
      { x: 0.15, y: 0.2,  r: 320, dx: 0.00018, dy: 0.00012, hue: 160, alpha: 0.18 },
      { x: 0.75, y: 0.15, r: 260, dx: -0.00014, dy: 0.00020, hue: 180, alpha: 0.14 },
      { x: 0.5,  y: 0.7,  r: 400, dx: 0.00010,  dy: -0.00015, hue: 270, alpha: 0.10 },
      { x: 0.85, y: 0.75, r: 200, dx: -0.00022, dy: -0.00010, hue: 300, alpha: 0.12 },
      { x: 0.3,  y: 0.85, r: 240, dx: 0.00016,  dy: 0.00008,  hue: 150, alpha: 0.09 },
    ];
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.00008 + 0.00003,
      angle: Math.random() * Math.PI * 2,
      hue: Math.random() > 0.5 ? 160 : 270,
    }));
    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      orbs.forEach((o) => {
        const cx = (Math.sin(t * o.dx * 1000 + o.x * 10) * 0.08 + o.x) * W;
        const cy = (Math.cos(t * o.dy * 1000 + o.y * 10) * 0.06 + o.y) * H;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, o.r);
        grad.addColorStop(0, `hsla(${o.hue}, 80%, 55%, ${o.alpha})`);
        grad.addColorStop(1, `hsla(${o.hue}, 80%, 55%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, o.r, 0, Math.PI * 2);
        ctx.fill();
      });
      particles.forEach((p) => {
        p.angle += p.speed * 50;
        const px = (p.x + Math.sin(p.angle) * 0.04) * W;
        const py = (p.y + Math.cos(p.angle * 0.7) * 0.04) * H;
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 65%, 0.5)`;
        ctx.fill();
      });
      ctx.save();
      ctx.strokeStyle = `hsla(160, 70%, 55%, 0.06)`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        const yBase = (i / 6) * H;
        ctx.moveTo(0, yBase);
        for (let x = 0; x <= W; x += 4) {
          const y = yBase + Math.sin((x / W) * Math.PI * 3 + t * 0.001 + i) * 40;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
      t++;
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) return;
    let start = 0;
    const step = Math.ceil(value / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
}

const features = [
  { icon: Video,      title: "Live Video Sessions",   desc: "HD video calls with screen sharing for immersive learning.",              color: "bg-blue-500/10 text-blue-500",       border: "hover:border-blue-500/30" },
  { icon: CreditCard, title: "Credit-Based Exchange", desc: "Earn credits by teaching, spend them to learn new skills.",               color: "bg-emerald-500/10 text-emerald-500", border: "hover:border-emerald-500/30" },
  { icon: Users,      title: "Smart Matching",        desc: "Find the perfect skill partner based on what you offer and want.",        color: "bg-purple-500/10 text-purple-500",   border: "hover:border-purple-500/30" },
  { icon: Monitor,    title: "Screen Sharing",        desc: "Share your screen to demonstrate code, design, or any skill.",            color: "bg-orange-500/10 text-orange-500",   border: "hover:border-orange-500/30" },
  { icon: Star,       title: "Peer Reviews",          desc: "Build reputation through honest reviews after every session.",            color: "bg-yellow-500/10 text-yellow-500",   border: "hover:border-yellow-500/30" },
  { icon: Zap,        title: "Instant Booking",       desc: "Request sessions and get matched in minutes, not days.",                  color: "bg-pink-500/10 text-pink-500",       border: "hover:border-pink-500/30" },
];

const howItWorks = [
  { icon: UserPlus, step: "01", title: "Create your profile", desc: "Sign up for free, add the skills you can teach and the skills you want to learn.", detail: "Takes less than 2 minutes",           color: "bg-blue-500/10 text-blue-500" },
  { icon: Search,   step: "02", title: "Find your match",     desc: "Browse peers, watch their intro videos and send a session request.",               detail: "Filter by skill, rating or category", color: "bg-purple-500/10 text-purple-500" },
  { icon: Laptop,   step: "03", title: "Swap skills live",    desc: "Join a live HD video call, teach your skill, learn theirs and earn credits automatically.", detail: "Credits transfer after 10 seconds", color: "bg-emerald-500/10 text-emerald-500" },
];

const testimonials = [
  { name: "Priya S.",  skill: "Taught Python · Learned Guitar",  quote: "Found a match in 10 minutes. Best learning experience I've had online.",          avatar: "P" },
  { name: "Marcus T.", skill: "Taught Design · Learned Spanish", quote: "The credit system is genius. I teach what I know and learn what I always wanted.", avatar: "M" },
  { name: "Aiko R.",   skill: "Taught Japanese · Learned React", quote: "Real people, real skills. No subscriptions, no nonsense. Just learning.",          avatar: "A" },
];

export default function Landing() {
  const [stats, setStats] = useState({ users: 0, sessions: 0, skills: 0 });
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY       = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  useEffect(() => {
    supabase.from("profiles").select("id", { count: "exact" }).then((r) =>
    supabase.from("sessions").select("id", { count: "exact" }).then((s) =>
    supabase.from("skills").select("id", { count: "exact" }).then((sk) =>
      setStats({ users: r.count ?? 0, sessions: s.count ?? 0, skills: sk.count ?? 0 })
    )));
    const interval = setInterval(() => setActiveTestimonial((p) => (p + 1) % testimonials.length), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-16 py-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-lg z-50">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Repeat className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-bold">SkillSwap</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
          <Link to="/auth">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
                Join Now <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative px-6 lg:px-16 py-28 lg:py-40 text-center overflow-hidden min-h-[90vh] flex flex-col items-center justify-center">
        <AbstractCanvas />
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "128px" }} />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20 backdrop-blur-sm">
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Zap className="h-3.5 w-3.5" />
              </motion.div>
              Free peer-to-peer skill exchange
            </motion.div>

            <h1 className="text-5xl lg:text-7xl font-display font-bold leading-[1.08] tracking-tight">
              <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }} className="block">
                Learn anything.
              </motion.span>
              <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }} className="block text-gradient-primary">
                Teach everything.
              </motion.span>
            </h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}
              className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              SkillSwap connects you with people who want to learn what you know — and teach what you don't. No money, just skills.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
              className="mt-6 flex flex-wrap gap-4 justify-center">
              {["100% Free", "Live video calls", "Earn while you teach", "No subscriptions"].map((b, i) => (
                <motion.div key={b} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.08 }}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0" />{b}
                </motion.div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.85 }} className="mt-10">
              <Link to="/auth">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow text-base px-10 h-14 rounded-2xl">
                    Join SkillSwap — It's Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <p className="text-xs text-muted-foreground mt-3">No credit card · No subscription · Free forever</p>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}
            className="w-5 h-8 rounded-full border-2 border-border flex items-start justify-center pt-1.5">
            <div className="w-1 h-1.5 rounded-full bg-primary" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="px-6 lg:px-16 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "People Learning",    value: stats.users,    suffix: "+", emoji: "👥" },
            { label: "Sessions Completed", value: stats.sessions, suffix: "+", emoji: "🎯" },
            { label: "Skills Available",   value: stats.skills,   suffix: "+", emoji: "⭐" },
          ].map((stat, i) => (
            <motion.div key={stat.label}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="flex flex-col items-center p-8 bg-card rounded-2xl border border-border shadow-sm text-center cursor-default">
              <motion.span initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
                transition={{ delay: i * 0.12 + 0.2, type: "spring", stiffness: 200 }} className="text-4xl mb-3">
                {stat.emoji}
              </motion.span>
              <p className="text-4xl font-display font-bold text-primary"><Counter value={stat.value} suffix={stat.suffix} /></p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 lg:px-16 py-28">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold">How it works</h2>
            <p className="text-muted-foreground mt-3">Simple, fast and completely free</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howItWorks.map((step, i) => (
              <motion.div key={step.step}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }} className="relative">
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-10 z-10">
                    <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                      <ArrowRight className="h-6 w-6 text-primary/40" />
                    </motion.div>
                  </div>
                )}
                <div className="p-6 bg-card rounded-2xl border border-border hover:shadow-xl hover:border-primary/20 transition-all h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div whileHover={{ rotate: 10, scale: 1.1 }} className={`h-12 w-12 rounded-xl ${step.color} flex items-center justify-center shrink-0`}>
                      <step.icon className="h-6 w-6" />
                    </motion.div>
                    <span className="text-4xl font-display font-bold text-muted-foreground/20">{step.step}</span>
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{step.desc}</p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                    <CheckCircle className="h-3 w-3 text-primary" />
                    <span className="text-xs text-primary font-medium">{step.detail}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-12">
            <Link to="/auth">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                  Start for free — no setup needed <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-16 py-28 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold">Everything you need</h2>
            <p className="text-muted-foreground mt-3">Built for the best skill exchange experience</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className={`p-6 bg-card rounded-2xl border border-border ${f.border} hover:shadow-lg transition-all`}>
                <motion.div whileHover={{ rotate: 8, scale: 1.12 }} transition={{ type: "spring", stiffness: 300 }}
                  className={`h-12 w-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="h-6 w-6" />
                </motion.div>
                <h3 className="font-display font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 lg:px-16 py-28">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
            <h2 className="text-4xl font-display font-bold">What people are saying</h2>
          </motion.div>
          <div className="relative h-52">
            <AnimatePresence mode="wait">
              <motion.div key={activeTestimonial}
                initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.97 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-gradient-primary flex items-center justify-center text-white font-display font-bold text-xl mb-4 shadow-glow">
                  {testimonials[activeTestimonial].avatar}
                </div>
                <p className="text-lg text-foreground font-medium italic mb-3">"{testimonials[activeTestimonial].quote}"</p>
                <p className="text-sm font-semibold">{testimonials[activeTestimonial].name}</p>
                <p className="text-xs text-muted-foreground">{testimonials[activeTestimonial].skill}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                className={`h-1.5 rounded-full transition-all ${i === activeTestimonial ? "w-6 bg-primary" : "w-1.5 bg-border"}`} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 lg:px-16 py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-accent/8 rounded-full blur-3xl -translate-y-1/2" />
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-display font-bold mb-4">Your next skill is one swap away</h2>
          <p className="text-muted-foreground text-lg mb-10">Join SkillSwap today. Teach what you know, learn what you don't — completely free.</p>
          <Link to="/auth">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow text-base px-12 h-14 rounded-2xl">
                Join SkillSwap — It's Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </Link>
          <p className="text-xs text-muted-foreground mt-4">No credit card required · Free forever</p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 lg:px-16 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Repeat className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-display font-bold">SkillSwap</span>
          </div>
          <p className="text-sm text-muted-foreground">Trade skills, grow together. Built with ❤️</p>
          <p className="text-xs text-muted-foreground">© 2026 SkillSwap. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
