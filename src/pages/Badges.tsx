import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Lock, CheckCircle2, Sparkles } from "lucide-react";
import { ALL_BADGES } from "./Dashboard";

type BadgeItem = typeof ALL_BADGES[number];

function BadgeCard({ badge, earned, index }: { badge: BadgeItem; earned: boolean; index: number }) {
  const [showDesc, setShowDesc] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 180, damping: 18 }}
      whileHover={earned ? { scale: 1.07, rotate: [-1, 1, 0], transition: { duration: 0.3 } } : { scale: 1.03 }}
      onHoverStart={() => setShowDesc(true)}
      onHoverEnd={() => setShowDesc(false)}
      className="relative cursor-default"
    >
      <div className={`relative flex flex-col items-center gap-2 p-5 rounded-2xl border text-center transition-all duration-300 overflow-hidden
        ${earned
          ? "bg-gradient-to-b from-primary/10 to-primary/5 border-primary/30 shadow-[0_4px_24px_rgba(16,185,129,0.15)]"
          : "bg-muted/30 border-border/50 opacity-50"
        }`}>
        {earned && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
          />
        )}
        <div className="relative">
          <motion.span
            className="text-4xl block"
            animate={earned ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
            style={{ filter: earned ? "none" : "grayscale(100%)" }}
          >
            {badge.icon}
          </motion.span>
          {earned && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: index * 0.06 + 0.3, type: "spring", stiffness: 300 }}
              className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
              <CheckCircle2 className="h-3 w-3 text-white" />
            </motion.div>
          )}
          {!earned && (
            <div className="absolute -bottom-1 -right-1 bg-muted rounded-full p-0.5 border border-border">
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>
        <p className={`text-sm font-bold leading-tight ${earned ? "text-primary" : "text-muted-foreground"}`}>
          {badge.label}
        </p>
        <AnimatePresence>
          {showDesc && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border border-border text-popover-foreground text-xs rounded-xl px-3 py-2 shadow-xl z-20 w-max max-w-[160px] text-center">
              {badge.desc}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function Badges() {
  const { user } = useAuth();
  const [skillCount, setSkillCount] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [taughtSessions, setTaughtSessions] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("skills").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("sessions").select("id", { count: "exact" }).eq("status", "completed").or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`),
      supabase.from("sessions").select("id", { count: "exact" }).eq("teacher_id", user.id).eq("status", "completed"),
      supabase.from("sessions").select("id", { count: "exact" }).or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`),
    ]).then(([pRes, skRes, cRes, tRes, sRes]) => {
      if (pRes.data) setProfile(pRes.data);
      setSkillCount(skRes.count ?? 0);
      setCompletedSessions(cRes.count ?? 0);
      setTaughtSessions(tRes.count ?? 0);
      setSessionCount(sRes.count ?? 0);
      setLoading(false);
    });
  }, [user]);

  const completionSteps = [
    !!profile?.display_name, !!profile?.bio, !!profile?.avatar_url,
    !!(profile as any)?.trial_video_url, skillCount > 0, sessionCount > 0,
  ];
  const completionPercent = profile
    ? Math.round((completionSteps.filter(Boolean).length / completionSteps.length) * 100)
    : 0;

  const badgeData = { completionPercent, skillCount, completedSessions, taughtSessions, credits: profile?.credits ?? 0, trialVideo: (profile as any)?.trial_video_url };
  const earnedBadges = ALL_BADGES.filter((b) => b.condition(badgeData));
  const lockedBadges = ALL_BADGES.filter((b) => !b.condition(badgeData));
  const filtered = filter === "earned" ? earnedBadges : filter === "locked" ? lockedBadges : ALL_BADGES;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <div className="flex items-center gap-3 mb-1">
            <motion.div animate={{ rotate: [0, 15, -10, 15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
              <Trophy className="h-7 w-7 text-yellow-500" />
            </motion.div>
            <h1 className="text-3xl font-display font-bold">Your Badges</h1>
          </div>
          <p className="text-muted-foreground text-sm">Track your achievements and unlock new ones by being active on SkillSwap.</p>
        </motion.div>

        {/* Progress ring */}
        {!loading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-primary/5 to-transparent" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" />
                        <motion.circle cx="18" cy="18" r="15.9" fill="none"
                          stroke="url(#badgeGrad)" strokeWidth="2.5" strokeLinecap="round"
                          initial={{ strokeDasharray: "0 100" }}
                          animate={{ strokeDasharray: `${(earnedBadges.length / ALL_BADGES.length) * 100} 100` }}
                          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} />
                        <defs>
                          <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-display font-bold">{earnedBadges.length}/{ALL_BADGES.length}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xl font-display font-bold">{earnedBadges.length} badge{earnedBadges.length !== 1 ? "s" : ""} earned</p>
                      <p className="text-sm text-muted-foreground">{lockedBadges.length} more to unlock</p>
                    </div>
                  </div>
                  {earnedBadges.length === ALL_BADGES.length && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
                      className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300/50 text-yellow-700 dark:text-yellow-400 px-4 py-2 rounded-full">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-semibold text-sm">All badges unlocked! 🏆</span>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filter tabs */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="flex gap-2">
          {(["all", "earned", "locked"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${filter === f ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(16,185,129,0.3)]" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {f === "all" ? `All (${ALL_BADGES.length})` : f === "earned" ? `Earned (${earnedBadges.length})` : `Locked (${lockedBadges.length})`}
            </button>
          ))}
        </motion.div>

        {/* Badge grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div>
            {(filter === "all" || filter === "earned") && earnedBadges.length > 0 && (
              <div className="mb-8">
                {filter === "all" && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Earned Badges
                  </motion.p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {(filter === "all" ? earnedBadges : filtered).map((badge, i) => (
                    <BadgeCard key={badge.id} badge={badge} earned={true} index={i} />
                  ))}
                </div>
              </div>
            )}
            {(filter === "all" || filter === "locked") && lockedBadges.length > 0 && (
              <div>
                {filter === "all" && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5" /> Locked Badges
                  </motion.p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {(filter === "all" ? lockedBadges : filtered).map((badge, i) => (
                    <BadgeCard key={badge.id} badge={badge} earned={false} index={i + (filter === "all" ? earnedBadges.length : 0)} />
                  ))}
                </div>
              </div>
            )}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>{filter === "earned" ? "No badges earned yet. Complete tasks to earn badges!" : "All badges unlocked! 🎉"}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
                  }
