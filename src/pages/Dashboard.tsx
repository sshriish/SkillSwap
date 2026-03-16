import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, Calendar, Star, Users, ArrowRight, Video, Flame, Trophy, Target } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const QUOTES = [
  "The more you teach, the more you learn.",
  "Every expert was once a beginner.",
  "Knowledge shared is knowledge multiplied.",
  "Teaching is the highest form of understanding.",
  "Learn something new today, teach it tomorrow.",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [skillCount, setSkillCount] = useState(0);
  const [weekActivity, setWeekActivity] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [streak, setStreak] = useState(0);
  const [dailyChallengeComplete, setDailyChallengeComplete] = useState(false);
  const [todaySessions, setTodaySessions] = useState(0);
  const quote = QUOTES[new Date().getDay() % QUOTES.length];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greetingEmoji = hour < 12 ? "🌅" : hour < 17 ? "☀️" : "🌙";

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, sessionsRes, skillsRes, allSessionsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("sessions").select("id", { count: "exact" }).or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`),
        supabase.from("skills").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("sessions").select("created_at, status").or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`).order("created_at", { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      setSessionCount(sessionsRes.count ?? 0);
      setSkillCount(skillsRes.count ?? 0);

      if (allSessionsRes.data) {
        const today = new Date();
        const activity = [0, 0, 0, 0, 0, 0, 0];
        allSessionsRes.data.forEach((s) => {
          const date = new Date(s.created_at);
          const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 7) {
            const dayIndex = date.getDay();
            activity[dayIndex]++;
          }
        });
        setWeekActivity(activity);

        const todayStr = new Date().toDateString();
        const todayCount = allSessionsRes.data.filter(
          (s) => new Date(s.created_at).toDateString() === todayStr
        ).length;
        setTodaySessions(todayCount);
        setDailyChallengeComplete(todayCount >= 1);

        let currentStreak = 0;
        const checkDate = new Date();
        for (let i = 0; i < 30; i++) {
          const dateStr = checkDate.toDateString();
          const hasActivity = allSessionsRes.data.some(
            (s) => new Date(s.created_at).toDateString() === dateStr
          );
          if (hasActivity) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        setStreak(currentStreak);
      }
    };
    fetchData();
  }, [user]);

  const maxActivity = Math.max(...weekActivity, 1);

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
            {greeting}, {profile?.display_name || "there"} {greetingEmoji}
          </h1>
          <p className="text-muted-foreground mt-1 italic text-sm">"{quote}"</p>
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="h-full">
              <CardContent className="p-6 flex items-center gap-5">
                <div className={`p-4 rounded-2xl ${streak > 0 ? "bg-orange-100 dark:bg-orange-900/30" : "bg-muted"}`}>
                  <Flame className={`h-10 w-10 ${streak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-4xl font-display font-bold">
                    {streak}
                    <span className="text-lg ml-1 font-normal text-muted-foreground">day{streak !== 1 ? "s" : ""}</span>
                  </p>
                  <p className="text-sm font-medium">
                    {streak === 0 ? "Start your streak today!" :
                     streak < 3 ? "You're on a roll! 🔥" :
                     streak < 7 ? "Great streak! Keep going! 💪" :
                     "Incredible streak! You're unstoppable! 🏆"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Active streak</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className={`h-full border-2 ${dailyChallengeComplete ? "border-primary/40 bg-primary/5" : "border-border"}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-xl ${dailyChallengeComplete ? "bg-primary/20" : "bg-muted"}`}>
                    <Target className={`h-5 w-5 ${dailyChallengeComplete ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-sm">Daily Challenge</p>
                    <p className="text-xs text-muted-foreground">Resets every day</p>
                  </div>
                  {dailyChallengeComplete && <span className="ml-auto text-lg">✅</span>}
                </div>
                <p className="text-sm font-medium mb-1">
                  {dailyChallengeComplete ? "Challenge complete! 🎉" : "Start or join 1 session today"}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {dailyChallengeComplete
                    ? `You had ${todaySessions} session${todaySessions !== 1 ? "s" : ""} today. Amazing work!`
                    : "Complete a session today to keep your streak alive!"}
                </p>
                {!dailyChallengeComplete && (
                  <Link to="/matching">
                    <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90 w-full">
                      Find a Partner <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                )}
                {dailyChallengeComplete && (
                  <div className="w-full bg-primary/20 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full w-full" />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Your Activity This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-24">
                {weekActivity.map((count, i) => {
                  const today = new Date().getDay();
                  const isToday = i === today;
                  const height = count === 0 ? 8 : Math.max(16, (count / maxActivity) * 88);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height }}
                        transition={{ duration: 0.6, delay: i * 0.08 }}
                        className={`w-full rounded-t-lg ${isToday ? "bg-primary" : count > 0 ? "bg-primary/40" : "bg-muted"}`}
                        style={{ height }}
                      />
                      <span className={`text-xs ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                        {DAYS[i]}
                      </span>
                      {count > 0 && <span className="text-xs font-medium text-primary">{count}</span>}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                {sessionCount === 0 ? "No sessions yet this week — start one today!" : `${sessionCount} total sessions — keep it up! 💪`}
              </p>
            </CardContent>
          </Card>
        </motion.div>

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
