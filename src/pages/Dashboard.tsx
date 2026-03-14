import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, Calendar, Star, Users, ArrowRight, Video, CheckCircle, Circle, Trophy } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const ALL_BADGES = [
  { id: "first_signup", icon: "🎉", label: "Welcome!", desc: "Joined SkillSwap", condition: () => true },
  { id: "profile_complete", icon: "✅", label: "All Set", desc: "Completed your profile 100%", condition: (data: any) => data.completionPercent === 100 },
  { id: "first_skill", icon: "🧠", label: "Skilled", desc: "Added your first skill", condition: (data: any) => data.skillCount >= 1 },
  { id: "five_skills", icon: "🎯", label: "Multi-Talent", desc: "Added 5 or more skills", condition: (data: any) => data.skillCount >= 5 },
  { id: "first_session", icon: "🤝", label: "First Handshake", desc: "Completed your first session", condition: (data: any) => data.completedSessions >= 1 },
  { id: "five_sessions", icon: "🔥", label: "On Fire", desc: "Completed 5 sessions", condition: (data: any) => data.completedSessions >= 5 },
  { id: "ten_sessions", icon: "💎", label: "Diamond Learner", desc: "Completed 10 sessions", condition: (data: any) => data.completedSessions >= 10 },
  { id: "top_teacher", icon: "🏆", label: "Top Teacher", desc: "Taught 3 or more sessions", condition: (data: any) => data.taughtSessions >= 3 },
  { id: "rich", icon: "💰", label: "Credit Rich", desc: "Earned 20+ credits", condition: (data: any) => data.credits >= 20 },
  { id: "has_video", icon: "🎬", label: "On Camera", desc: "Uploaded a trial video", condition: (data: any) => !!data.trialVideo },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [skillCount, setSkillCount] = useState(0);
  const [topSkills, setTopSkills] = useState<{ name: string; count: number }[]>([]);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [taughtSessions, setTaughtSessions] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, sessionsRes, skillsRes, allSkillsRes, completedRes, taughtRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("sessions").select("id", { count: "exact" }).or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`),
        supabase.from("skills").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("skills").select("name, skill_type").eq("skill_type", "offered"),
        supabase.from("sessions").select("id", { count: "exact" }).eq("status", "completed").or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`),
        supabase.from("sessions").select("id", { count: "exact" }).eq("teacher_id", user.id).eq("status", "completed"),
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
        const sorted = Object.entries(countMap)
          .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setTopSkills(sorted);
      }
    };
    fetchData();
  }, [user]);

  const completionSteps = [
    { label: "Display name set", done: !!profile?.display_name },
    { label: "Bio added", done: !!profile?.bio },
    { label: "Profile picture uploaded", done: !!profile?.avatar_url },
    { label: "Trial video uploaded", done: !!(profile as any)?.trial_video_url },
    { label: "At least one skill added", done: skillCount > 0 },
    { label: "First session completed", done: sessionCount > 0 },
  ];
  const completedCount = completionSteps.filter((s) => s.done).length;
  const completionPercent = Math.round((completedCount / completionSteps.length) * 100);

  const badgeData = {
    completionPercent,
    skillCount,
    completedSessions,
    taughtSessions,
    credits: profile?.credits ?? 0,
    trialVideo: (profile as any)?.trial_video_url,
  };

  const earnedBadges = ALL_BADGES.filter((b) => b.condition(badgeData));
  const lockedBadges = ALL_BADGES.filter((b) => !b.condition(badgeData));

  const stats = [
    { label: "Credits", value: profile?.credits ?? 0, icon: CreditCard, color: "text-primary" },
    { label: "Sessions", value: sessionCount, icon: Calendar, color: "text-accent" },
    { label: "Skills Listed", value: skillCount, icon: Star, color: "text-warning" },
  ];

  const medals = ["🥇", "🥈", "🥉", "4th", "5th"];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold">
            Welcome back, {profile?.display_name || "there"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your skill exchanges.</p>
        </motion.div>

        {/* Stats */}
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

        {/* Badge System */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Your Badges
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  {earnedBadges.length}/{ALL_BADGES.length} earned
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Earned badges */}
              {earnedBadges.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Earned 🎉</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {earnedBadges.map((badge, i) => (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex flex-col items-center gap-1.5 p-3 bg-primary/5 border border-primary/20 rounded-xl text-center"
                      >
                        <span className="text-3xl">{badge.icon}</span>
                        <p className="text-xs font-semibold text-primary">{badge.label}</p>
                        <p className="text-xs text-muted-foreground leading-tight">{badge.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Locked badges */}
              {lockedBadges.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Locked 🔒</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {lockedBadges.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex flex-col items-center gap-1.5 p-3 bg-muted/50 border border-border rounded-xl text-center opacity-50"
                      >
                        <span className="text-3xl grayscale">{badge.icon}</span>
                        <p className="text-xs font-semibold text-muted-foreground">{badge.label}</p>
                        <p className="text-xs text-muted-foreground leading-tight">{badge.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Completion + Leaderboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  Profile Completion
                  <span className={`text-sm font-bold ${completionPercent === 100 ? "text-primary" : "text-muted-foreground"}`}>
                    {completionPercent}%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="w-full bg-muted rounded-full h-2.5">
                  <motion.div
                    className="bg-gradient-to-r from-primary to-teal-400 h-2.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercent}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
                <div className="space-y-2">
                  {completionSteps.map((step) => (
                    <div key={step.label} className="flex items-center gap-2">
                      {step.done ? (
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className={`text-sm ${step.done ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
                {completionPercent < 100 && (
                  <Link to="/profile">
                    <Button size="sm" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 mt-2">
                      Complete Profile <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                )}
                {completionPercent === 100 && (
                  <p className="text-sm text-primary font-medium text-center">🎉 Profile fully complete!</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
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
                    <Link to="/profile">
                      <Button size="sm" variant="outline" className="mt-3">Add your first skill</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topSkills.map((skill, i) => (
                      <div key={skill.name} className="flex items-center gap-3">
                        <span className="text-lg w-8 text-center">{medals[i]}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{skill.name}</span>
                            <span className="text-xs text-muted-foreground">{skill.count} {skill.count === 1 ? "teacher" : "teachers"}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <motion.div
                              className="bg-gradient-to-r from-primary to-teal-400 h-1.5 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${(skill.count / (topSkills[0]?.count || 1)) * 100}%` }}
                              transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
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
