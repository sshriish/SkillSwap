import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Repeat, ArrowRight, Video, CreditCard, Users, Star, Monitor, Zap, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const features = [
  { icon: Video, title: "Live Video Sessions", desc: "HD video calls with screen sharing for immersive learning.", color: "bg-blue-500/10 text-blue-500" },
  { icon: CreditCard, title: "Credit-Based Exchange", desc: "Earn credits by teaching, spend them to learn new skills.", color: "bg-green-500/10 text-green-500" },
  { icon: Users, title: "Smart Matching", desc: "Find the perfect skill partner based on what you offer and want.", color: "bg-purple-500/10 text-purple-500" },
  { icon: Monitor, title: "Screen Sharing", desc: "Share your screen to demonstrate code, design, or any skill.", color: "bg-orange-500/10 text-orange-500" },
  { icon: Star, title: "Peer Reviews", desc: "Build reputation through honest reviews after every session.", color: "bg-yellow-500/10 text-yellow-500" },
  { icon: Zap, title: "Instant Booking", desc: "Request sessions and get matched in minutes, not days.", color: "bg-pink-500/10 text-pink-500" },
];

const howItWorks = [
  { step: "01", title: "Create your profile", desc: "List the skills you can teach and the skills you want to learn." },
  { step: "02", title: "Find your match", desc: "Browse peers, watch their intro videos and request a session." },
  { step: "03", title: "Start swapping", desc: "Join a live video call, teach each other and earn credits." },
];

const testimonials = [
  { name: "Arjun K.", skill: "Taught Python, Learned Guitar", text: "SkillSwap changed how I learn. I taught React to 3 people and used those credits to finally learn Spanish!", avatar: "A" },
  { name: "Priya M.", skill: "Taught Design, Learned Coding", text: "The video call quality is amazing. I love that I can share my screen when teaching Figma.", avatar: "P" },
  { name: "Rohan S.", skill: "Taught Music, Learned Marketing", text: "Found the perfect match in minutes. My piano skills helped someone who taught me SEO!", avatar: "R" },
];

export default function Landing() {
  const [stats, setStats] = useState({ users: 0, sessions: 0, skills: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [usersRes, sessionsRes, skillsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("sessions").select("id", { count: "exact" }),
        supabase.from("skills").select("id", { count: "exact" }),
      ]);
      setStats({
        users: usersRes.count ?? 0,
        sessions: sessionsRes.count ?? 0,
        skills: skillsRes.count ?? 0,
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-6 lg:px-16 py-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-lg z-50">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Repeat className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-bold">SkillSwap</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" className="hidden md:flex">Sign In</Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
              Get Started Free <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative px-6 lg:px-16 py-24 lg:py-36 text-center max-w-5xl mx-auto">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
            <Zap className="h-3.5 w-3.5" /> The free peer-to-peer skill exchange platform
          </div>
          <h1 className="text-5xl lg:text-7xl font-display font-bold leading-tight">
            Learn anything.<br />
            <span className="text-gradient-primary">Teach everything.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            SkillSwap connects you with peers for live video sessions. Trade your expertise for new knowledge — completely free, powered by credits.
          </p>

          {/* Benefits */}
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {["100% Free to use", "Live video calls", "Earn while you teach", "No subscriptions"].map((b) => (
              <div key={b} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary" />
                {b}
              </div>
            ))}
          </div>

          <div className="mt-10 flex gap-4 justify-center flex-wrap">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow text-base px-8">
                Start Swapping Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="text-base px-8">
                Watch How It Works
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Live Stats ── */}
      <section className="px-6 lg:px-16 py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "People Learning", value: stats.users, suffix: "+", emoji: "👥" },
            { label: "Sessions Completed", value: stats.sessions, suffix: "+", emoji: "🎯" },
            { label: "Skills Available", value: stats.skills, suffix: "+", emoji: "⭐" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center justify-center p-6 bg-card rounded-2xl border border-border shadow-sm text-center"
            >
              <span className="text-3xl mb-2">{stat.emoji}</span>
              <p className="text-4xl font-display font-bold text-primary">{stat.value}{stat.suffix}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-6 lg:px-16 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold">How it works</h2>
            <p className="text-muted-foreground mt-3">Get started in 3 simple steps</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
            {howItWorks.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center text-center"
              >
                <div className="h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-2xl font-display font-bold text-primary-foreground shadow-glow mb-5">
                  {step.step}
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 lg:px-16 py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold">Everything you need</h2>
            <p className="text-muted-foreground mt-3">Built for the best skill exchange experience</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 bg-card rounded-2xl border border-border hover:shadow-lg transition-all hover:-translate-y-1 group"
              >
                <div className={`h-12 w-12 rounded-xl ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="px-6 lg:px-16 py-24">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold">Loved by learners</h2>
            <p className="text-muted-foreground mt-3">See what people are saying about SkillSwap</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 bg-card rounded-2xl border border-border"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.skill}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 lg:px-16 py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-display font-bold mb-4">
            Ready to start learning?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join SkillSwap today — completely free. Start teaching what you know and learning what you don't.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow text-base px-10">
                Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4">No credit card required · Free forever</p>
        </motion.div>
      </section>

      {/* ── Footer ── */}
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
