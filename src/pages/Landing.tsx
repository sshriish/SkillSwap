import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Repeat, ArrowRight, Video, CreditCard, Users, Star, Monitor, Zap } from "lucide-react";

const features = [
  { icon: Video, title: "Live Video Sessions", desc: "HD video calls with screen sharing for immersive learning." },
  { icon: CreditCard, title: "Credit-Based Exchange", desc: "Earn credits by teaching, spend them to learn new skills." },
  { icon: Users, title: "Smart Matching", desc: "Find the perfect skill partner based on what you offer and want." },
  { icon: Monitor, title: "Screen Sharing", desc: "Share your screen to demonstrate code, design, or any skill." },
  { icon: Star, title: "Peer Reviews", desc: "Build reputation through honest reviews after every session." },
  { icon: Zap, title: "Instant Booking", desc: "Request sessions and get matched in minutes, not days." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-16 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Repeat className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-bold">SkillSwap</span>
        </div>
        <Link to="/auth">
          <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            Get Started <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-6 lg:px-16 py-24 lg:py-32 text-center max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="h-3.5 w-3.5" /> Peer-to-peer skill exchange
          </div>
          <h1 className="text-5xl lg:text-7xl font-display font-bold leading-tight">
            Learn anything.<br />
            <span className="text-gradient-primary">Teach everything.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            SkillSwap connects you with peers for live video sessions. Trade your expertise for new knowledge using our credit-based system.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
                Start Swapping <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-16 py-20 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center mb-12">Everything you need to exchange skills</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 bg-card rounded-xl border border-border hover:shadow-md transition-shadow"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-16 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-display font-bold mb-4">Ready to start learning?</h2>
          <p className="text-muted-foreground mb-8">Join SkillSwap today and unlock a world of peer-to-peer knowledge exchange.</p>
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
              Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 lg:px-16 py-8">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-gradient-primary flex items-center justify-center">
              <Repeat className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-display font-semibold">SkillSwap</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 SkillSwap. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
