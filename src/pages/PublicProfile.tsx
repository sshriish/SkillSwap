import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { User, Star, Award, ArrowLeft, Play, X, MessageSquare, BookOpen, GraduationCap, Flag } from "lucide-react";

function AnimCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) return;
    let n = 0;
    const step = Math.max(1, Math.ceil(value / 30));
    const t = setInterval(() => {
      n += step;
      if (n >= value) { setDisplay(value); clearInterval(t); }
      else setDisplay(n);
    }, 30);
    return () => clearInterval(t);
  }, [value]);
  return <>{display}</>;
}

const REPORT_REASONS = [
  { value: "spam",            label: "Spam" },
  { value: "inappropriate",   label: "Inappropriate content" },
  { value: "fake_profile",    label: "Fake profile" },
  { value: "harassment",      label: "Harassment" },
  { value: "other",           label: "Other" },
];

// Gold / Silver / Bronze styles for top 3
const RANK_STYLES: Record<number, { card: string; avatarRing: string; badge: string; label: string; medal: string }> = {
  1: {
    card: "ring-2 ring-yellow-400/70 shadow-[0_0_24px_4px_rgba(250,204,21,0.2)]",
    avatarRing: "ring-[4px] ring-yellow-400 ring-offset-2 ring-offset-background",
    badge: "bg-yellow-400/15 text-yellow-500 border border-yellow-400/40",
    label: "🥇 #1 on Leaderboard",
    medal: "🥇",
  },
  2: {
    card: "ring-2 ring-slate-400/60 shadow-[0_0_18px_3px_rgba(148,163,184,0.18)]",
    avatarRing: "ring-[4px] ring-slate-400 ring-offset-2 ring-offset-background",
    badge: "bg-slate-400/15 text-slate-400 border border-slate-400/40",
    label: "🥈 #2 on Leaderboard",
    medal: "🥈",
  },
  3: {
    card: "ring-2 ring-amber-600/60 shadow-[0_0_18px_3px_rgba(180,83,9,0.18)]",
    avatarRing: "ring-[4px] ring-amber-600 ring-offset-2 ring-offset-background",
    badge: "bg-amber-600/15 text-amber-600 border border-amber-600/40",
    label: "🥉 #3 on Leaderboard",
    medal: "🥉",
  },
};

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
    <div className="pointer-events-none absolute inset-0 rounded-xl overflow-hidden z-0">
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
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${shimmerColor[rank]}`}
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
        style={{ skewX: -15 }}
      />
    </div>
  );
}

export default function PublicProfile() {
  const { userId }   = useParams();
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const [profile, setProfile]             = useState<any>(null);
  const [skills, setSkills]               = useState<any[]>([]);
  const [reviews, setReviews]             = useState<any[]>([]);
  const [sessionCount, setSessionCount]   = useState(0);
  const [loading, setLoading]             = useState(true);
  const [watchingVideo, setWatchingVideo] = useState(false);
  const [requesting, setRequesting]       = useState(false);
  const [leaderRank, setLeaderRank]       = useState<number | null>(null);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason]       = useState("");
  const [reportDesc, setReportDesc]           = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [alreadyReported, setAlreadyReported]   = useState(false);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.from("skills").select("*").eq("user_id", userId),
      supabase.from("reviews").select("*, reviewer:profiles!reviews_reviewer_id_fkey(display_name, avatar_url)").eq("reviewee_id", userId).order("created_at", { ascending: false }),
      supabase.from("sessions").select("id", { count: "exact" }).eq("teacher_id", userId).eq("status", "completed"),
    ]).then(([pRes, sRes, rRes, sessRes]) => {
      if (pRes.data) setProfile(pRes.data);
      if (sRes.data) setSkills(sRes.data);
      if (rRes.data) setReviews(rRes.data as any);
      setSessionCount(sessRes.count ?? 0);
      setLoading(false);
    });

    // Fetch top 3 by credits to determine leaderboard rank
    supabase
      .from("profiles")
      .select("user_id, credits")
      .order("credits", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (!data) return;
        const idx = data.findIndex((p) => p.user_id === userId);
        if (idx !== -1) setLeaderRank(idx + 1);
      });
  }, [userId]);

  // Check if current user already reported this profile
  useEffect(() => {
    if (!user || !userId) return;
    supabase
      .from("reports" as any)
      .select("id")
      .eq("reporter_id", user.id)
      .eq("reported_user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setAlreadyReported(true);
      });
  }, [user, userId]);

  const requestSession = async () => {
    if (!user || !userId) return;
    setRequesting(true);
    const { error } = await supabase.from("sessions").insert({ teacher_id: userId, learner_id: user.id, status: "pending" });
    if (error) toast.error(error.message);
    else { toast.success("Session request sent!"); navigate("/sessions"); }
    setRequesting(false);
  };

  const submitReport = async () => {
    if (!user || !userId || !reportReason) return;
    setSubmittingReport(true);
    const { error } = await supabase.from("reports" as any).insert({
      reporter_id:      user.id,
      reported_user_id: userId,
      reason:           reportReason,
      description:      reportDesc.trim(),
    });
    if (error) {
      toast.error("Could not submit report. Please try again.");
    } else {
      toast.success("Report submitted. We'll review it shortly.");
      setAlreadyReported(true);
      setShowReportModal(false);
      setReportReason("");
      setReportDesc("");
    }
    setSubmittingReport(false);
  };

  const offered      = skills.filter((s) => s.skill_type === "offered");
  const wanted       = skills.filter((s) => s.skill_type === "wanted");
  const avgRating    = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0;
  const isOwnProfile = user?.id === userId;

  if (loading) return (
    <AppLayout>
      <div className="flex justify-center py-24">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
      </div>
    </AppLayout>
  );

  if (!profile) return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 text-muted-foreground">
        User not found.
      </motion.div>
    </AppLayout>
  );

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item      = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back */}
        <motion.button initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} whileHover={{ x: -3 }}
          onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </motion.button>

        <motion.div variants={container} initial="hidden" animate="show">

          {/* Hero card */}
          <motion.div variants={item}>
            {(() => {
              const rankStyle = leaderRank ? RANK_STYLES[leaderRank] : null;
              return (
            <Card className={`overflow-hidden relative ${rankStyle?.card ?? ""}`}>
              {/* Carbon-fiber shimmer for top 3 */}
              {rankStyle && <CarbonShimmer rank={leaderRank!} />}
              <div className="h-24 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/5 relative z-10">
                <div className="absolute inset-0 opacity-30"
                  style={{ backgroundImage: "radial-gradient(circle at 20% 50%, hsl(160 84% 39% / 0.4) 0%, transparent 60%), radial-gradient(circle at 80% 50%, hsl(270 60% 58% / 0.3) 0%, transparent 60%)" }} />
              </div>
              <CardContent className="p-6 pt-0 -mt-12 relative z-10">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
                  <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 180 }} className="shrink-0 relative">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.display_name}
                        className={`h-24 w-24 rounded-2xl object-cover shadow-lg ${rankStyle?.avatarRing ?? "border-4 border-background"}`} />
                    ) : (
                      <div className={`h-24 w-24 rounded-2xl bg-muted flex items-center justify-center shadow-lg ${rankStyle?.avatarRing ?? "border-4 border-background"}`}>
                        <User className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    {/* Medal on avatar */}
                    {rankStyle && (
                      <span className="absolute -bottom-2 -right-2 text-xl leading-none drop-shadow">{rankStyle.medal}</span>
                    )}
                  </motion.div>
                  <div className="flex-1 text-center sm:text-left pb-1">
                    <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                      <h1 className="text-2xl font-display font-bold">{profile.display_name || "Anonymous"}</h1>
                      {rankStyle && (
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${rankStyle.badge}`}>
                          {rankStyle.label}
                        </span>
                      )}
                    </div>
                    {avgRating > 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="flex items-center gap-1 mt-1 justify-center sm:justify-start">
                        {[1,2,3,4,5].map((s, idx) => (
                          <motion.div key={s} initial={{ scale: 0 }} animate={{ scale: 1 }}
                            transition={{ delay: 0.4 + idx * 0.07, type: "spring", stiffness: 200 }}>
                            <Star className={`h-4 w-4 ${s <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                          </motion.div>
                        ))}
                        <span className="text-sm text-muted-foreground ml-1">{avgRating} ({reviews.length})</span>
                      </motion.div>
                    )}
                    {profile.bio && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                        className="text-sm text-muted-foreground mt-2 leading-relaxed">{profile.bio}</motion.p>
                    )}
                  </div>
                </div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                  className="flex gap-3 mt-5 flex-wrap justify-center sm:justify-start items-center">
                  {!isOwnProfile && (
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button onClick={requestSession} disabled={requesting} className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
                        {requesting ? (
                          <span className="flex items-center gap-2">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                              className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent" />
                            Sending…
                          </span>
                        ) : "Request Session"}
                      </Button>
                    </motion.div>
                  )}
                  {isOwnProfile && (
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button variant="outline" onClick={() => navigate("/profile")}>Edit Profile</Button>
                    </motion.div>
                  )}
                  {(profile as any).trial_video_url && (
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button variant="outline" onClick={() => setWatchingVideo(true)} className="gap-2">
                        <Play className="h-4 w-4 fill-current" /> Watch Intro
                      </Button>
                    </motion.div>
                  )}

                  {/* ── Report button — only shown to other logged-in users ── */}
                  {!isOwnProfile && user && (
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="ml-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={alreadyReported}
                        onClick={() => setShowReportModal(true)}
                        className={`gap-1.5 text-xs ${alreadyReported ? "text-muted-foreground cursor-not-allowed" : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"}`}
                      >
                        <Flag className="h-3.5 w-3.5" />
                        {alreadyReported ? "Reported" : "Report"}
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              </CardContent>
            </Card>
              );
            })()}
          </motion.div>

          {/* Quick stats */}
          <motion.div variants={item}>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Award,          label: "Sessions taught", value: sessionCount },
                { icon: BookOpen,       label: "Skills offered",  value: offered.length },
                { icon: GraduationCap,  label: "Wants to learn",  value: wanted.length },
              ].map((stat) => (
                <motion.div key={stat.label} whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="flex flex-col items-center p-4 bg-card rounded-2xl border border-border text-center cursor-default">
                  <stat.icon className="h-5 w-5 text-primary mb-1.5" />
                  <p className="text-2xl font-display font-bold text-primary"><AnimCount value={stat.value} /></p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Skills */}
          <motion.div variants={item}>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Skills</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {offered.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Teaches</p>
                    <div className="flex flex-wrap gap-2">
                      {offered.map((s, i) => (
                        <motion.div key={s.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05, type: "spring", stiffness: 200 }}
                          whileHover={{ scale: 1.08, transition: { duration: 0.15 } }}>
                          <Badge variant="default" className="cursor-default">{s.name}</Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                {wanted.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Wants to learn</p>
                    <div className="flex flex-wrap gap-2">
                      {wanted.map((s, i) => (
                        <motion.div key={s.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05, type: "spring", stiffness: 200 }}
                          whileHover={{ scale: 1.08, transition: { duration: 0.15 } }}>
                          <Badge variant="secondary" className="cursor-default">{s.name}</Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                {skills.length === 0 && <p className="text-sm text-muted-foreground">No skills listed yet.</p>}
              </CardContent>
            </Card>
          </motion.div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Reviews
                    <span className="ml-auto text-sm font-normal text-muted-foreground">{reviews.length} total</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reviews.map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.4 }}
                      className="border-b border-border last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <motion.div whileHover={{ scale: 1.1 }}
                          className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                          {(r.reviewer as any)?.display_name?.[0] || "?"}
                        </motion.div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{(r.reviewer as any)?.display_name || "Anonymous"}</p>
                          <div className="flex gap-0.5 mt-0.5">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-muted-foreground pl-11">{r.comment}</p>}
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ── Report modal ── */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowReportModal(false)}>
            <motion.div initial={{ scale: 0.88, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className="bg-card rounded-2xl w-full max-w-md shadow-2xl border border-border"
              onClick={(e) => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-destructive" />
                  <h2 className="font-display font-semibold">Report this profile</h2>
                </div>
                <motion.button whileHover={{ rotate: 90, scale: 1.1 }} transition={{ duration: 0.2 }}
                  onClick={() => setShowReportModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Reason <span className="text-destructive">*</span></p>
                  <div className="space-y-2">
                    {REPORT_REASONS.map((r) => (
                      <label key={r.value}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          reportReason === r.value
                            ? "border-destructive bg-destructive/10 text-foreground"
                            : "border-border hover:border-muted-foreground/40"
                        }`}>
                        <input
                          type="radio"
                          name="report-reason"
                          value={r.value}
                          checked={reportReason === r.value}
                          onChange={() => setReportReason(r.value)}
                          className="accent-destructive"
                        />
                        <span className="text-sm">{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Additional details <span className="text-muted-foreground text-xs">(optional)</span></p>
                  <textarea
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    placeholder="Tell us more about the issue…"
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-5 pt-0">
                <Button variant="outline" className="flex-1" onClick={() => setShowReportModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={!reportReason || submittingReport}
                  onClick={submitReport}
                >
                  {submittingReport ? (
                    <span className="flex items-center gap-2">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent" />
                      Submitting…
                    </span>
                  ) : "Submit Report"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video modal */}
      <AnimatePresence>
        {watchingVideo && (profile as any).trial_video_url && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setWatchingVideo(false)}>
            <motion.div initial={{ scale: 0.88, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className="bg-card rounded-2xl overflow-hidden w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <p className="font-display font-semibold">{profile.display_name}'s Intro Video</p>
                </div>
                <motion.button whileHover={{ rotate: 90, scale: 1.1 }} transition={{ duration: 0.2 }}
                  onClick={() => setWatchingVideo(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
              <video src={(profile as any).trial_video_url} controls autoPlay className="w-full bg-black max-h-96" />
              {!isOwnProfile && (
                <div className="p-4 flex justify-end border-t border-border">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button onClick={() => { setWatchingVideo(false); requestSession(); }}
                      disabled={requesting} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                      Request Session
                    </Button>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
