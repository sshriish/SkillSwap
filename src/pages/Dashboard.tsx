import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  CreditCard, Calendar, Star, Users, ArrowRight, Video,
  Flame, Trophy, Target, CheckCircle, Circle, Sparkles, Zap, TrendingUp,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

const QUOTES = [
  "The more you teach, the more you learn.",
  "Every expert was once a beginner.",
  "Knowledge shared is knowledge multiplied.",
  "Teaching is the highest form of understanding.",
  "Learn something new today, teach it tomorrow.",
  "Growth happens at the edge of your comfort zone.",
  "One skill a day keeps mediocrity away.",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const ALL_BADGES = [
  { id: "first_signup",      icon: "🎉", label: "Welcome!",        desc: "Joined SkillSwap",           condition: () => true },
  { id: "profile_complete",  icon: "✅", label: "All Set",          desc: "Completed profile 100%",     condition: (d: any) => d.completionPercent === 100 },
  { id: "first_skill",       icon: "🧠", label: "Skilled",          desc: "Added your first skill",     condition: (d: any) => d.skillCount >= 1 },
  { id: "five_skills",       icon: "🎯", label: "Multi-Talent",     desc: "Added 5 or more skills",     condition: (d: any) => d.skillCount >= 5 },
  { id: "first_session",     icon: "🤝", label: "First Handshake",  desc: "Completed first session",    condition: (d: any) => d.completedSessions >= 1 },
  { id: "five_sessions",     icon: "🔥", label: "On Fire",          desc: "Completed 5 sessions",       condition: (d: any) => d.completedSessions >= 5 },
  { id: "ten_sessions",      icon: "💎", label: "Diamond Learner",  desc: "Completed 10 sessions",      condition: (d: any) => d.completedSessions >= 10 },
  { id: "top_teacher",       icon: "🏆", label: "Top Teacher",      desc: "Taught 3+ sessions",         condition: (d: any) => d.taughtSessions >= 3 },
  { id: "rich",              icon: "💰", label: "Credit Rich",      desc: "Earned 20+ credits",         condition: (d: any) => d.credits >= 20 },
  { id: "has_video",         icon: "🎬", label: "On Camera",        desc: "Uploaded a trial video",     condition: (d: any) => !!d.trialVideo },
];

function FloatingParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary/15"
          initial={{
            x: `${Math.random() * 100}vw`,
            y: `${Math.random() * 100}vh`,
            scale: Math.random() * 2 + 0.5,
          }}
          animate={{
            y: [`${Math.random() * 100}vh`, `${Math.random() * 100}vh`],
            x: [`${Math.random() * 100}vw`, `${Math.random() * 100}vw`],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: Math.random() * 15 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: 1200, bounce: 0 });
  const [display, setDisplay] = useState(0);
  useEffect(() => { motionVal.set(value); }, [value]);
  useEffect(() => spring.on("change", (v) => setDisplay(Math.round(v))), [spring]);
  return <>{display}</>;
}

function PulseRing({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <motion.div
      className="absolute inset-0 rounded-2xl border-2 border-orange-400"
      animate={{ scale: [1, 1.1, 1], opacity: [0.7, 0, 0.7] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [skillCount, setSkillCount] = useState(0);
  const [topSkills, setTopSkills] = useState<{ name: string; count: number }[]>([]);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [taughtSessions, setTaughtSessions] = useState(0);
  const [weekActivity, setWeekActivity] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [streak, setStreak] = useState(0);
  const [dailyChallengeComplete, setDailyChallengeComplete] = useState(false);
  const [todaySessions, setTodaySessions] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const quote = QUOTES[new Date().getDay() % QUOTES.length];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greetingEmoji = hour < 12 ? "🌅" : hour < 17 ? "☀️" : "🌙";

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, sessionsRes, skillsRes, allSkillsRes, completedRes, taughtRes, allSessionsRes] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", user.id).single(),
          supabase.from("sessions").select("id", { count: "exact" }).or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`),
          supabase.from("skills").select("id", { count: "exact" }).eq("user_id", user.id),
          supabase.from("skills").select("name, skill_type").eq("skill_type", "offered"),
          supabase.from("sessions").select("id", { count: "exact" }).eq("status", "completed").or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`),
          supabase.from("sessions").select("id", { count: "exact" }).eq("teacher_id", user.id).eq("status", "completed"),
          supabase.from("sessions").select("created_at, status").or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`).order("created_at", { ascending: false }),
        ]);
      if (profileRes.data) setProfile(profileRes.data);
      setSessionCount(sessionsRes.count ?? 0);
      setSkillCount(skillsRes.count ?? 0);
      setCompletedSessions(completedRes.count ?? 0);
      setTaughtSessions(taughtRes.count ?? 0);
      if (allSkillsRes.data) {
        const countMap: Record<string, number> = {};
        for (const s of allSkillsRes.data) {
          const name = s.name.trim().toLowerCase();
          countMap[name] = (countMap[name] || 0) + 1;
        }
        setTopSkills(
          Object.entries(countMap)
            .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        );
      }
      if (allSessionsRes.data) {
        const today = new Date();
        const activity = [0, 0, 0, 0, 0, 0, 0];
        allSessionsRes.data.forEach((s) => {
          const date = new Date(s.created_at);
          const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 7) activity[date.getDay()]++;
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
          if (hasActivity) { currentStreak++; checkDate.setDate(checkDate.getDate() - 1); }
          else break;
        }
        setStreak(currentStreak);
      }
    };
    fetchData();
  }, [user]);

  const completionSteps = [
    { label: "Display name set",         done: !!profile?.display_name },
    { label: "Bio added",                done: !!profile?.bio },
    { label: "Profile picture uploaded", done: !!profile?.avatar_url },
    { label: "Trial video uploaded",     done: !!(profile as any)?.trial_video_url },
    { label: "At least one skill added", done: skillCount > 0 },
    { label: "First session completed",  done: sessionCount > 0 },
  ];
  const completedCount    = completionSteps.filter((s) => s.done).length;
  const completionPercent = Math.round((completedCount / completionSteps.length) * 100);
  const profileComplete   = completionPercent === 100;

  const badgeData = { completionPercent, skillCount, completedSessions, taughtSessions, credits: profile?.credits ?? 0, trialVideo: (profile as any)?.trial_video_url };
  const earnedBadges = ALL_BADGES.filter((b) => b.condition(badgeData));
  const lockedBadges = ALL_BADGES.filter((b) => !b.condition(badgeData));
  const maxActivity  = Math.max(...weekActivity, 1);
  const medals = ["🥇", "🥈", "🥉", "4th", "5th"];

  const stats = [
    { label: "Credits",       value: profile?.credits ?? 0, icon: CreditCard, color: "text-primary",   bg: "bg-primary/10",     gradient: "from-primary/10 to-transparent" },
    { label: "Sessions",      value: sessionCount,           icon: Calendar,   color: "text-violet-500", bg: "bg-violet-500/10", gradient: "from-violet-500/10 to-transparent" },
    { label: "Skills Listed", value: skillCount,             icon: Star,       color: "text-amber-500",  bg: "bg-amber-500/10",  gradient: "from-amber-500/10 to-transparent" },
  ];

  useEffect(() => {
    if (profileComplete) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
    }
  }, [profileComplete]);

  return (
    <AppLayout>
      <FloatingParticles />
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">

        {/* Confetti */}
        <AnimatePresence>
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-50">
              {[...Array(40)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-sm"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: "-10px",
                    background: ["#10b981","#6366f1","#f59e0b","#ef4444","#3b82f6","#ec4899"][i % 6],
                  }}
                  animate={{ y: "110vh", rotate: Math.random() * 720, x: (Math.random() - 0.5) * 300 }}
                  transition={{ duration: Math.random() * 2 + 1.5, ease: "easeIn" }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold flex items-center gap-2 flex-wrap">
                {greeting},{" "}
                <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                  {profile?.display_name || "there"}
                </span>
                <motion.span
                  animate={{ rotate: [0, 15, -10, 15, 0] }}
                  transition={{ duration: 1.5, delay: 0.8, repeat: Infinity, repeatDelay: 5 }}
                >
                  {greetingEmoji}
                </motion.span>
              </h1>
              <p className="text-muted-foreground mt-1.5 italic text-sm flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                "{quote}"
              </p>
            </div>
            {earnedBadges.length > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
                className="hidden sm:flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
                <span className="text-sm font-semibold text-primary">{earnedBadges.length}</span>
                <span className="text-xs text-muted-foreground">badges earned</span>
                <Link to="/badges" className="text-xs text-primary hover:underline ml-1">View all →</Link>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <Card className="overflow-hidden relative group cursor-default">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <CardContent className="flex items-center gap-4 p-6 relative z-10">
                  <motion.div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}
                    whileHover={{ rotate: [-10, 10, 0], transition: { duration: 0.4 } }}>
                    <stat.icon className="h-5 w-5" />
                  </motion.div>
                  <div>
                    <p className="text-2xl font-display font-bold"><AnimatedNumber value={stat.value} /></p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                  <motion.div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{ x: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <TrendingUp className={`h-4 w-4 ${stat.color}`} />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Streak + Daily Challenge */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            <Card className="h-full overflow-hidden relative group">
              <div className={`absolute inset-0 bg-gradient-to-br ${streak > 0 ? "from-orange-500/5 to-transparent" : "from-muted/30 to-transparent"}`} />
              <CardContent className="p-6 flex items-center gap-5 relative">
                <div className="relative">
                  <PulseRing active={streak > 0} />
                  <div className={`p-4 rounded-2xl relative z-10 ${streak > 0 ? "bg-orange-100 dark:bg-orange-900/30" : "bg-muted"}`}>
                    <motion.div animate={streak > 0 ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 2, repeat: Infinity }}>
                      <Flame className={`h-10 w-10 ${streak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                    </motion.div>
                  </div>
                </div>
                <div>
                  <p className="text-4xl font-display font-bold">
                    <AnimatedNumber value={streak} />
                    <span className="text-lg ml-1 font-normal text-muted-foreground">day{streak !== 1 ? "s" : ""}</span>
                  </p>
                  <p className="text-sm font-medium mt-0.5">
                    {streak === 0 ? "Start your streak today!" : streak < 3 ? "You're on a roll! 🔥" : streak < 7 ? "Great streak! Keep going! 💪" : "Incredible streak! 🏆"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Active streak</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            <Card className={`h-full border-2 overflow-hidden relative ${dailyChallengeComplete ? "border-primary/40" : "border-border"}`}>
              {dailyChallengeComplete && (
                <motion.div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-teal-400/5"
                  animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }} />
              )}
              <CardContent className="p-6 relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-xl ${dailyChallengeComplete ? "bg-primary/20" : "bg-muted"}`}>
                    <Zap className={`h-5 w-5 ${dailyChallengeComplete ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-sm">Daily Challenge</p>
                    <p className="text-xs text-muted-foreground">Resets every day</p>
                  </div>
                  <AnimatePresence>
                    {dailyChallengeComplete && (
                      <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} className="ml-auto text-xl">✅</motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-sm font-medium mb-1">{dailyChallengeComplete ? "Challenge complete! 🎉" : "Start or join 1 session today"}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  {dailyChallengeComplete ? `You had ${todaySessions} session${todaySessions !== 1 ? "s" : ""} today. Amazing!` : "Complete a session to keep your streak alive!"}
                </p>
                {!dailyChallengeComplete ? (
                  <Link to="/matching">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90 w-full">
                        Find a Partner <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </motion.div>
                  </Link>
                ) : (
                  <div className="w-full bg-primary/20 rounded-full h-2 overflow-hidden">
                    <motion.div className="bg-gradient-to-r from-primary to-teal-400 h-2 rounded-full"
                      initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8 }} />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Weekly Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Your Activity This Week
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {weekActivity.reduce((a, b) => a + b, 0)} sessions
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-28">
                {weekActivity.map((count, i) => {
                  const isToday = i === new Date().getDay();
                  const height = count === 0 ? 6 : Math.max(20, (count / maxActivity) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <AnimatePresence>
                        {count > 0 && (
                          <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-bold text-primary">
                            {count}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <motion.div
                        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                        transition={{ duration: 0.6, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                        style={{ height, originY: 1 }}
                        className={`w-full rounded-t-lg relative overflow-hidden ${isToday ? "bg-gradient-to-t from-primary to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]" : count > 0 ? "bg-primary/35" : "bg-muted"}`}
                      >
                        {isToday && count > 0 && (
                          <motion.div className="absolute inset-0 bg-white/20"
                            animate={{ opacity: [0, 0.5, 0] }} transition={{ duration: 2, repeat: Infinity }} />
                        )}
                      </motion.div>
                      <span className={`text-xs ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>{DAYS[i]}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                {sessionCount === 0 ? "No sessions yet — start one today!" : `${sessionCount} total sessions — keep it up! 💪`}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Badges preview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Badges
                <span className="ml-auto flex items-center gap-2 text-sm font-normal text-muted-foreground">
                  {earnedBadges.length}/{ALL_BADGES.length} earned
                  <Link to="/badges">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-primary">View all →</Button>
                  </Link>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
                {earnedBadges.slice(0, 3).map((badge, i) => (
                  <motion.div key={badge.id}
                    initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08, type: "spring", stiffness: 200 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="flex flex-col items-center gap-1 p-3 bg-primary/5 border border-primary/20 rounded-xl text-center cursor-default">
                    <span className="text-2xl">{badge.icon}</span>
                    <p className="text-xs font-semibold text-primary leading-tight">{badge.label}</p>
                  </motion.div>
                ))}
                {lockedBadges.slice(0, 3).map((badge, i) => (
                  <motion.div key={badge.id}
                    initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    className="flex flex-col items-center gap-1 p-3 bg-muted/40 border border-border/50 rounded-xl text-center opacity-40 cursor-default">
                    <span className="text-2xl grayscale">{badge.icon}</span>
                    <p className="text-xs text-muted-foreground leading-tight">🔒</p>
                  </motion.div>
                ))}
              </div>
              <Link to="/badges">
                <motion.div whileHover={{ x: 3 }} className="mt-4 text-center text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  See all {ALL_BADGES.length} badges including locked ones →
                </motion.div>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Completion — ONLY shown when profile is NOT 100% complete */}
        <AnimatePresence>
          {!profileComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.4 } }}
              transition={{ delay: 0.65, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <Card className="relative overflow-hidden border-primary/30">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between relative">
                    <span className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Complete Your Profile
                    </span>
                    <motion.span className="text-sm font-bold text-primary" key={completionPercent} initial={{ scale: 1.3 }} animate={{ scale: 1 }}>
                      {completionPercent}%
                    </motion.span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 relative">
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <motion.div className="bg-gradient-to-r from-primary to-teal-400 h-2.5 rounded-full relative"
                      initial={{ width: 0 }} animate={{ width: `${completionPercent}%` }}
                      transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                      <motion.div className="absolute inset-0 bg-white/30 rounded-full"
                        animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }} />
                    </motion.div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {completionSteps.map((step, idx) => (
                      <motion.div key={step.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.07 }}
                        className="flex items-center gap-2">
                        {step.done ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                          </motion.div>
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={`text-sm ${step.done ? "text-foreground line-through opacity-60" : "text-muted-foreground"}`}>
                          {step.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                  <Link to="/profile">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button size="sm" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 mt-2">
                        Complete Profile <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Skills + Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Top Skills on Platform
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topSkills.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">No skills added yet.</p>
                    <Link to="/profile"><Button size="sm" variant="outline" className="mt-3">Add your first skill</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topSkills.map((skill, i) => (
                      <motion.div key={skill.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.08 }}
                        className="flex items-center gap-3">
                        <span className="text-lg w-8 text-center">{medals[i]}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{skill.name}</span>
                            <span className="text-xs text-muted-foreground">{skill.count} {skill.count === 1 ? "teacher" : "teachers"}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <motion.div className="bg-gradient-to-r from-primary to-teal-400 h-1.5 rounded-full"
                              initial={{ width: 0 }} animate={{ width: `${(skill.count / (topSkills[0]?.count || 1)) * 100}%` }}
                              transition={{ duration: 0.9, delay: 0.8 + i * 0.1, ease: [0.16, 1, 0.3, 1] }} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.78, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4">
            <Card className="hover:shadow-md transition-all duration-300 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 relative">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-display font-semibold">Find Skill Partners</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Discover users who want to learn what you teach, and vice versa.</p>
                <Link to="/matching">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                      Browse Matches <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </motion.div>
                </Link>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-all duration-300 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 relative">
                <div className="flex items-center gap-3 mb-3">
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Video className="h-5 w-5 text-violet-500" />
                  </motion.div>
                  <h3 className="font-display font-semibold">Start a Session</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Join a live video call with screen sharing to teach or learn.</p>
                <Link to="/sessions">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button size="sm" variant="secondary">View Sessions <ArrowRight className="ml-1 h-3 w-3" /></Button>
                  </motion.div>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
        }
