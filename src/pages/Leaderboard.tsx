import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Trophy, Star } from "lucide-react";

interface LeaderUser {
  user_id: string;
  display_name: string;
  avatar_url: string;
  credits: number;
  sessionsTaught: number;
  avgRating: number;
  reviewCount: number;
  topSkill: string;
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"credits" | "sessions" | "rating">("credits");

  useEffect(() => {
    const load = async () => {
      const [profilesRes, sessionsRes, reviewsRes, skillsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, avatar_url, credits"),
        supabase.from("sessions").select("teacher_id").eq("status", "completed"),
        supabase.from("reviews").select("reviewee_id, rating"),
        supabase.from("skills").select("user_id, name").eq("skill_type", "offered"),
      ]);

      if (!profilesRes.data) { setLoading(false); return; }

      const sessionsByUser: Record<string, number> = {};
      sessionsRes.data?.forEach((s) => {
        sessionsByUser[s.teacher_id] = (sessionsByUser[s.teacher_id] || 0) + 1;
      });

      const ratingsByUser: Record<string, { total: number; count: number }> = {};
      reviewsRes.data?.forEach((r) => {
        if (!ratingsByUser[r.reviewee_id]) ratingsByUser[r.reviewee_id] = { total: 0, count: 0 };
        ratingsByUser[r.reviewee_id].total += r.rating;
        ratingsByUser[r.reviewee_id].count++;
      });

      const skillsByUser: Record<string, string> = {};
      skillsRes.data?.forEach((s) => {
        if (!skillsByUser[s.user_id]) skillsByUser[s.user_id] = s.name;
      });

      const users: LeaderUser[] = profilesRes.data.map((p) => ({
        user_id: p.user_id,
        display_name: p.display_name || "Anonymous",
        avatar_url: p.avatar_url || "",
        credits: p.credits || 0,
        sessionsTaught: sessionsByUser[p.user_id] || 0,
        avgRating: ratingsByUser[p.user_id]
          ? Math.round((ratingsByUser[p.user_id].total / ratingsByUser[p.user_id].count) * 10) / 10
          : 0,
        reviewCount: ratingsByUser[p.user_id]?.count || 0,
        topSkill: skillsByUser[p.user_id] || "—",
      }));

      setLeaders(users);
      setLoading(false);
    };
    load();
  }, []);

  const sorted = [...leaders].sort((a, b) => {
    if (tab === "credits") return b.credits - a.credits;
    if (tab === "sessions") return b.sessionsTaught - a.sessionsTaught;
    return b.avgRating - a.avgRating;
  }).slice(0, 10);

  const medalEmojis = ["🥇", "🥈", "🥉"];
  const medalColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];
  const podiumColors = [
    "bg-yellow-500/10 border-yellow-500/30",
    "bg-gray-500/10 border-gray-500/30",
    "bg-amber-600/10 border-amber-600/30",
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1">Top skill exchangers on SkillSwap</p>
        </motion.div>

        <div className="flex gap-2 flex-wrap">
          {[
            { key: "credits", label: "💰 Most Credits" },
            { key: "sessions", label: "🎓 Top Teachers" },
            { key: "rating", label: "⭐ Best Rated" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Skeleton loading ── */}
        {loading ? (
          <div className="space-y-4">
            {/* Podium skeleton */}
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-2 ${i === 2 ? "pt-4" : "pt-10"}`}>
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
            {/* List skeleton */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                  <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {sorted.length >= 3 && (
              <div className="grid grid-cols-3 gap-4">
                {[sorted[1], sorted[0], sorted[2]].map((user, idx) => {
                  const actualRank = idx === 0 ? 1 : idx === 1 ? 0 : 2;
                  return (
                    <motion.div
                      key={user.user_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: actualRank * 0.1 }}
                      className={actualRank === 0 ? "pt-0" : "pt-8"}
                    >
                      <Card className={`border-2 ${podiumColors[actualRank]} text-center`}>
                        <CardContent className="p-4">
                          <div className="text-3xl mb-2">{medalEmojis[actualRank]}</div>
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.display_name} className="h-14 w-14 rounded-full object-cover mx-auto border-2 border-primary/20 mb-2" />
                          ) : (
                            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                              {user.display_name[0]}
                            </div>
                          )}
                          <p className="font-display font-bold text-sm truncate">{user.display_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{user.topSkill}</p>
                          <p className={`text-lg font-bold mt-2 ${medalColors[actualRank]}`}>
                            {tab === "credits" ? `${user.credits} credits` :
                             tab === "sessions" ? `${user.sessionsTaught} sessions` :
                             `${user.avgRating} ⭐`}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">All Rankings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sorted.map((user, i) => (
                  <motion.div
                    key={user.user_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-muted/50 ${i < 3 ? "bg-muted/30" : ""}`}
                  >
                    <div className="w-8 text-center">
                      {i < 3 ? (
                        <span className="text-xl">{medalEmojis[i]}</span>
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>
                      )}
                    </div>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.display_name} className="h-10 w-10 rounded-full object-cover border-2 border-border shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold shrink-0">
                        {user.display_name[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-sm">{user.display_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs">{user.topSkill}</Badge>
                        {user.reviewCount > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {user.avgRating} ({user.reviewCount})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold text-sm ${i < 3 ? medalColors[i] : ""}`}>
                        {tab === "credits" ? `${user.credits} credits` :
                         tab === "sessions" ? `${user.sessionsTaught} sessions` :
                         user.reviewCount > 0 ? `${user.avgRating} ⭐` : "No reviews"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tab === "credits" ? `${user.sessionsTaught} sessions` :
                         tab === "sessions" ? `${user.credits} credits` :
                         `${user.sessionsTaught} sessions`}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {sorted.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No data yet — complete sessions to appear on the leaderboard!
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
