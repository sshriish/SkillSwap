import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowRight, Repeat } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        navigate("/dashboard");
      }
    } else {
      const { error } = await signUp(email, password, displayName);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Check your email to confirm your account!");
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-gradient-hero">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Repeat className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-3xl font-display font-bold text-primary-foreground">SkillSwap</span>
          </div>
          <h1 className="text-5xl font-display font-bold text-primary-foreground leading-tight mb-6">
            Trade skills,<br />
            <span className="text-gradient-primary">grow together.</span>
          </h1>
          <p className="text-lg text-primary-foreground/70 max-w-md">
            Connect with peers, exchange knowledge through live video sessions, and earn credits for teaching what you know.
          </p>
        </motion.div>
      </div>

      {/* Right side - form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-2 lg:hidden">
                <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Repeat className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-xl font-display font-bold">SkillSwap</span>
              </div>
              <CardTitle className="text-2xl font-display">
                {isLogin ? "Welcome back" : "Create an account"}
              </CardTitle>
              <CardDescription>
                {isLogin ? "Sign in to continue your journey" : "Start swapping skills today"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      required={!isLogin}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground" disabled={loading}>
                  {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
