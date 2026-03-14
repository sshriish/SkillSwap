import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, Calendar, Star, Users, ArrowRight, Video } from "lucide-react";
import AppLayout from "@/components/AppLayout";

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [skillCount, setSkillCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [profileRes, sessionsRes, skillsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("sessions").select("id", { count: "exact" }).or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`),
        supabase.from("skills").select("id", { count: "exact" }).eq("user_id", user.id),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      setSessionCount(sessionsRes.count ?? 0);
      setSkillCount(skillsRes.count ?? 0);
    };
    fetchData();
  }, [user]);

  const stats = [
    { label: "Credits", value: profile?.credits ?? 0, icon: CreditCard, color: "text-primary" },
    { label: "Sessions", value: sessionCount, icon: Calendar, color: "text-accent" },
    { label: "Skills Listed", value: skillCount, icon: Star, color: "text-warning" },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold">
            Welcome back, {profile?.display_name || "there"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your skill exchanges.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-display font-semibold">Find Skill Partners</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Discover users who want to learn what you teach, and vice versa.
              </p>
              <Link to="/matching">
                <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                  Browse Matches <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Video className="h-5 w-5 text-accent" />
                <h3 className="font-display font-semibold">Start a Session</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Join a live video call with screen sharing to teach or learn.
              </p>
              <Link to="/sessions">
                <Button size="sm" variant="secondary">
                  View Sessions <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
