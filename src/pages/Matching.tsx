import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, User as UserIcon, Play, X, Heart, Star } from "lucide-react";

interface MatchUser {
  user_id: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  trial_video_url: string;
  offeredSkills: string[];
  wantedSkills: string[];
  avgRating: number;
  reviewCount: number;
  credits: number;
}

const CATEGORIES = ["All", "Programming", "Design", "Marketing", "Music", "Languages", "Business", "Science", "General"];

// Gold / Silver / Bronze styles for top 3
const RANK_STYLES: Record<number, { card: string; avatar: string; badge: string; label: string; medal: string }> = {
  1: {
    card: "ring-2 ring-yellow-400/70 shadow-[0_0_18px_2px_rgba(250,204,21,0.25)]",
    avatar: "ring-[3px] ring-yellow-400 ring-offset-2 ring-offset-card",
    badge: "bg-yellow-400/15 text-yellow-500 border border-yellow-400/40",
    label: "🥇 #1 on Leaderboard",
    medal: "🥇",
  },
  2: {
    card: "ring-2 ring-slate-400/60 shadow-[0_0_14px_2px_rgba(148,163,184,0.2)]",
    avatar: "ring-[3px] ring-slate-400 ring-offset-2 ring-offset-card",
    badge: "bg-slate-400/15 text-slate-400 border border-slate-400/40",
    label: "🥈 #2 on Leaderboard",
    medal: "🥈",
  },
  3: {
    card: "ring-2 ring-amber-600/60 shadow-[0_0_14px_2px_rgba(180,83,9,0.2)]",
    avatar: "ring-[3px] ring-amber-600 ring-offset-2 ring-offset-card",
    badge: "bg-amber-600/15 text-amber-600 border border-amber-600/40",
    label: "🥉 #3 on Leaderboard",
    medal: "🥉",
  },
};

// Carbon-fiber shimmer overlay for top-ranked cards
function CarbonShimmer({ rank }: { rank: number }) {
  const shimmerColor: Record<number, string> = {
    1: "from-yellow-400/0 via-yellow-300/10 to-yellow-400/0",
    2: "from-slate-400/0 via-slate-300/8 to-slate-400/0",
    3: "from-amber-600/0 via-amber-400/8 to-amber-600/0",
  };
  const stripeColor: Record<number, string> = {
    1: "#facc15",
    2: "#94a3b8",
    3: "#b45309",
  };
  return (
    <div className="pointer-events-none absolute inset-0 rounded-xl overflow-hidden">
      {/* Carbon-fiber diagonal stripe pattern */}
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            ${stripeColor[rank]} 0px,
            ${stripeColor[rank]} 1px,
            transparent 1px,
            transparent 6px
          ), repeating-linear-gradient(
            -45deg,
            ${stripeColor[rank]} 0px,
            ${stripeColor[rank]} 1px,
            transparent 1px,
            transparent 6px
          )`,
        }}
      />
      {/* Animated shimmer sweep */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${shimmerColor[rank]}`}
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
        style={{ skewX: -15 }}
      />
    </div>
  );
}

export default function Matching() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [watchingVideo, setWatchingVideo] = useState<MatchUser | null>(null);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFavourites, setShowFavourites] = useState(false);
  const [topRanks, setTopRanks] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`favourites_${user.id}`);
    if (saved) setFavourites(new Set(JSON.parse(saved)));

    const load = async () => {
      const [skillsRes, profilesRes, reviewsRes] = await Promise.all([
        supabase.from("skills").select("*"),
        supabase.from("profiles").select("*").neq("user_id", user.id),
        supabase.from("reviews").select("reviewee_id, rating"),
      ]);

      if (!profilesRes.data || !skillsRes.data) { setLoading(false); return; }

      const skillsByUser: Record<string, { offered: string[]; wanted: string[] }> = {};
      for (const s of skillsRes.data) {
        if (!skillsByUser[s.user_id]) skillsByUser[s.user_id] = { offered: [], wanted: [] };
        if (s.skill_type === "offered") skillsByUser[s.user_id].offered.push(s.name);
        else skillsByUser[s.user_id].wanted.push(s.name);
      }

      const ratingsByUser: Record<string, { total: number; count: number }> = {};
      if (reviewsRes.data) {
        for (const r of reviewsRes.data) {
          if (!ratingsByUser[r.reviewee_id]) ratingsByUser[r.reviewee_id] = { total: 0, count: 0 };
          ratingsByUser[r.reviewee_id].total += r.rating;
          ratingsByUser[r.reviewee_id].count++;
        }
      }

      const users: MatchUser[] = profilesRes.data.map((p) => ({
        user_id: p.user_id,
        display_name: p.display_name || "Anonymous",
        bio: p.bio || "",
        avatar_url: p.avatar_url || "",
        trial_video_url: (p as any).trial_video_url || "",
        offeredSkills: skillsByUser[p.user_id]?.offered || [],
        wantedSkills: skillsByUser[p.user_id]?.wanted || [],
        avgRating: ratingsByUser[p.user_id]
          ? Math.round((ratingsByUser[p.user_id].total / ratingsByUser[p.user_id].count) * 10) / 10
          : 0,
        reviewCount: ratingsByUser[p.user_id]?.count || 0,
        credits: (p as any).credits || 0,
      }));

      // Determine top 3 by credits (same metric as leaderboard default)
      const sorted = [...users].sort((a, b) => b.credits - a.credits);
      const ranks: Record<string, number> = {};
      sorted.slice(0, 3).forEach((u, i) => { ranks[u.user_id] = i + 1; });
      setTopRanks(ranks);

      setMatches(users);
      setLoading(false);
    };
    load();
  }, [user]);

  const toggleFavourite = (userId: string) => {
    const newFavs = new Set(favourites);
    if (newFavs.has(userId)) {
      newFavs.delete(userId);
      toast.success("Removed from favourites");
    } else {
      newFavs.add(userId);
      toast.success("Added to favourites ❤️");
    }
    setFavourites(newFavs);
    localStorage.setItem(`favourites_${user!.id}`, JSON.stringify([...newFavs]));
  };

  const requestSession = async (teacherId: string) => {
    const { error } = await supabase.from("sessions").insert({
      teacher_id: teacherId,
      learner_id: user!.id,
      status: "pending",
    });
    if (error) toast.error(error.message);
    else toast.success("Session request sent!");
  };

  const filtered = matches.filter((m) => {
    const matchesSearch =
      m.display_name.toLowerCase().includes(search.toLowerCase()) ||
      m.offeredSkills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesFav = showFavourites ? favourites.has(m.user_id) : true;
    const matchesCategory =
      selectedCategory === "All" ||
      m.offeredSkills.some((s) =>
        s.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    return matchesSearch && matchesFav && matchesCategory;
  });

  const renderStars = (rating: number, count: number) => {
    if (count === 0) return <span className="text-xs text-muted-foreground">No reviews yet</span>;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={`h-3 w-3 ${star <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
        ))}
        <span className="text-xs text-muted-foreground ml-1">{rating} ({count})</span>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold">Find Skill Partners</h1>
          <p className="text-muted-foreground mt-1">Discover people to exchange skills with.</p>
        </motion.div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or skill..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Button
            variant={showFavourites ? "default" : "outline"}
            onClick={() => setShowFavourites(!showFavourites)}
            className={showFavourites ? "bg-red-500 hover:bg-red-600 text-white" : ""}
          >
            <Heart className={`h-4 w-4 mr-1 ${showFavourites ? "fill-white" : ""}`} />
            Favourites {favourites.size > 0 && `(${favourites.size})`}
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Skeleton loading ── */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card">
                <Skeleton className="h-14 w-14 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-52" />
                  <div className="flex gap-2 pt-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-9 w-24 rounded-lg shrink-0 mt-1" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {showFavourites ? "No favourites yet — heart someone to save them!" : "No users found. Invite your friends to join!"}
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((m, i) => {
              const rank = topRanks[m.user_id];
              const rankStyle = rank ? RANK_STYLES[rank] : null;
              return (
                <motion.div key={m.user_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className={`hover:shadow-md transition-shadow relative overflow-hidden ${rankStyle?.card ?? ""}`}>
                    {/* Carbon-fiber shimmer for top 3 */}
                    {rankStyle && <CarbonShimmer rank={rank} />}

                    <CardContent className="flex items-start gap-4 p-5 relative">

                      {/* Avatar — clickable, with rank ring + medal */}
                      <div className="shrink-0 cursor-pointer relative" onClick={() => navigate(`/profile/${m.user_id}`)}>
                        {m.avatar_url ? (
                          <img
                            src={m.avatar_url}
                            alt={m.display_name}
                            className={`h-14 w-14 rounded-full object-cover hover:opacity-80 transition-opacity ${rankStyle?.avatar ?? "border-2 border-primary/20"}`}
                          />
                        ) : (
                          <div className={`h-14 w-14 rounded-full bg-muted flex items-center justify-center hover:opacity-80 transition-opacity ${rankStyle?.avatar ?? "border-2 border-border"}`}>
                            <UserIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        {rankStyle && (
                          <span className="absolute -bottom-1 -right-1 text-sm leading-none drop-shadow">{rankStyle.medal}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className="font-display font-semibold cursor-pointer hover:text-primary transition-colors"
                            onClick={() => navigate(`/profile/${m.user_id}`)}
                          >
                            {m.display_name}
                          </h3>
                          {favourites.has(m.user_id) && <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />}
                          {rankStyle && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${rankStyle.badge}`}>
                              {rankStyle.label}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 mb-1">{renderStars(m.avgRating, m.reviewCount)}</div>
                        {m.bio && <p className="text-sm text-muted-foreground line-clamp-1">{m.bio}</p>}
                        <div className="mt-2 space-y-1">
                          {m.offeredSkills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs text-muted-foreground mr-1">Teaches:</span>
                              {m.offeredSkills.map((s) => <Badge key={s} variant="default" className="text-xs">{s}</Badge>)}
                            </div>
                          )}
                          {m.wantedSkills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs text-muted-foreground mr-1">Wants:</span>
                              {m.wantedSkills.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => toggleFavourite(m.user_id)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                          <Heart className={`h-4 w-4 transition-colors ${favourites.has(m.user_id) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                        </button>
                        {m.trial_video_url && (
                          <Button size="sm" variant="outline" onClick={() => setWatchingVideo(m)} className="gap-1">
                            <Play className="h-3 w-3" /> Watch
                          </Button>
                        )}
                        <Button size="sm" onClick={() => requestSession(m.user_id)} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                          Request <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>

                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {watchingVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setWatchingVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl overflow-hidden w-full max-w-2xl shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  {watchingVideo.avatar_url ? (
                    <img src={watchingVideo.avatar_url} alt={watchingVideo.display_name} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-display font-semibold text-sm">{watchingVideo.display_name}</p>
                    <div className="mt-0.5">{renderStars(watchingVideo.avgRating, watchingVideo.reviewCount)}</div>
                  </div>
                </div>
                <button onClick={() => setWatchingVideo(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <video src={watchingVideo.trial_video_url} controls autoPlay className="w-full bg-black max-h-96" />
              <div className="p-4 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {watchingVideo.offeredSkills.map((s) => <Badge key={s} variant="default" className="text-xs">{s}</Badge>)}
                </div>
                <Button onClick={() => { requestSession(watchingVideo.user_id); setWatchingVideo(null); }} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                  Request Session <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
