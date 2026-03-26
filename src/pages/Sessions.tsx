import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Video, Check, X, Clock, Star, GraduationCap, ChevronDown, ChevronUp, Filter, Award, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";

const statusColors: Record<string, string> = {
  pending:     "bg-amber-500/10 text-amber-600 border-amber-400/30",
  confirmed:   "bg-blue-500/10 text-blue-600 border-blue-400/30",
  in_progress: "bg-primary/10 text-primary border-primary/30",
  completed:   "bg-emerald-500/10 text-emerald-600 border-emerald-400/30",
  cancelled:   "bg-destructive/10 text-destructive border-destructive/30",
};
const statusIcons: Record<string, string> = {
  pending: "⏳", confirmed: "✅", in_progress: "🎬", completed: "🏆", cancelled: "❌",
};

function getRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function SessionCard({ s, isTeacher, otherName, user, onUpdateStatus, onJoin, onReview, alreadyReviewed, reviews }: any) {
  const [expanded, setExpanded] = useState(false);
  const sessionDate = new Date(s.created_at);
  const sessionReviews = reviews.filter((r: any) => r.session_id === s.id);

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
      <Card className={`overflow-hidden transition-all duration-300
        ${s.status === "completed" ? "border-emerald-500/20" : ""}
        ${s.status === "in_progress" ? "border-primary/30 shadow-[0_0_16px_rgba(16,185,129,0.12)]" : ""}`}>
        {s.status === "in_progress" && (
          <motion.div className="h-1 bg-gradient-to-r from-primary via-teal-400 to-primary"
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} transition={{ duration: 3, repeat: Infinity }} />
        )}
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <motion.div whileHover={{ scale: 1.08 }}
              className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg shadow-sm
                ${isTeacher ? "bg-gradient-to-br from-primary/30 to-teal-400/20 text-primary" : "bg-gradient-to-br from-violet-500/30 to-pink-400/20 text-violet-600"}`}>
              {otherName?.[0]?.toUpperCase() || "?"}
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-display font-semibold">{otherName || "Unknown"}</span>
                <Badge className={`text-xs px-2 py-0 border ${statusColors[s.status] || ""}`} variant="outline">
                  {statusIcons[s.status]} {s.status.replace("_", " ")}
                </Badge>
                {s.status === "in_progress" && (
                  <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                    className="text-xs text-primary font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" /> LIVE
                  </motion.span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  {isTeacher ? <><Award className="h-3.5 w-3.5 text-primary" /> Teaching</> : <><GraduationCap className="h-3.5 w-3.5 text-violet-500" /> Learning</>}
                </span>
                {s.duration_minutes && <span>· {s.duration_minutes} min</span>}
                <span className="text-xs">· {getRelativeTime(sessionDate)}</span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap justify-end items-center shrink-0">
              {s.status === "pending" && isTeacher && (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="sm" variant="outline" onClick={() => onUpdateStatus(s.id, "cancelled")} className="text-destructive border-destructive/30 hover:bg-destructive/10 h-8 px-2">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90 h-8" onClick={() => onUpdateStatus(s.id, "confirmed")}>
                      <Check className="mr-1 h-3.5 w-3.5" /> Accept
                    </Button>
                  </motion.div>
                </>
              )}
              {s.status === "confirmed" && s.room_id && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90 h-8" onClick={() => onJoin(s)}>
                    <Video className="mr-1 h-3.5 w-3.5" /> Join Call
                  </Button>
                </motion.div>
              )}
              {s.status === "pending" && !isTeacher && (
                <Badge variant="secondary" className="gap-1 h-8 px-3"><Clock className="h-3 w-3" /> Waiting</Badge>
              )}
              {s.status === "completed" && !alreadyReviewed && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="sm" variant="outline" onClick={() => onReview(s)} className="gap-1 border-yellow-400/50 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950 h-8">
                    <Star className="h-3.5 w-3.5" /> Rate
                  </Button>
                </motion.div>
              )}
              {s.status === "completed" && alreadyReviewed && (
                <Badge variant="secondary" className="gap-1 text-xs h-8">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> Reviewed
                </Badge>
              )}
              {s.status === "completed" && (
                <motion.button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground transition-colors" whileHover={{ scale: 1.1 }}>
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </motion.button>
              )}
            </div>
          </div>

          {/* Expanded session history */}
          <AnimatePresence>
            {expanded && s.status === "completed" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden">
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Date", value: sessionDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) },
                      { label: "Time", value: sessionDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) },
                      { label: "Duration", value: s.duration_minutes ? `${s.duration_minutes} min` : "—" },
                      { label: "Your Role", value: isTeacher ? "🏆 Teacher" : "🎓 Learner" },
                    ].map((item) => (
                      <div key={item.label} className="bg-muted/40 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                        <p className="text-sm font-semibold">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {sessionReviews.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Session Reviews</p>
                      {sessionReviews.map((r: any) => (
                        <div key={r.id} className="flex items-start gap-3 bg-muted/30 rounded-xl p-3">
                          <div className="h-7 w-7 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {r.reviewer_name?.[0] || "?"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{r.reviewer_name || "Anonymous"}</span>
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map((star) => (
                                  <Star key={star} className={`h-3 w-3 ${star <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                                ))}
                              </div>
                            </div>
                            {r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingSession, setReviewingSession] = useState<any | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [existingReviews, setExistingReviews] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("sessions").select("*")
        .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (data) {
        setSessions(data);
        const userIds = [...new Set(data.flatMap((s) => [s.teacher_id, s.learner_id]))];
        const { data: profs } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds);
        if (profs) {
          const map: Record<string, any> = {};
          profs.forEach((p) => (map[p.user_id] = p));
          setProfiles(map);
        }
        const completedIds = data.filter((s) => s.status === "completed").map((s) => s.id);
        if (completedIds.length > 0) {
          const { data: revData } = await supabase.from("reviews")
            .select("*, reviewer:profiles!reviews_reviewer_id_fkey(display_name)")
            .in("session_id", completedIds);
          if (revData) {
            setReviews(revData.map((r) => ({ ...r, reviewer_name: (r.reviewer as any)?.display_name })));
            const reviewed: Record<string, boolean> = {};
            revData.filter((r) => r.reviewer_id === user.id).forEach((r) => (reviewed[r.session_id] = true));
            setExistingReviews(reviewed);
          }
        }
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "confirmed") updates.room_id = crypto.randomUUID();
    const { error } = await supabase.from("sessions").update(updates).eq("id", id);
    if (error) toast.error(error.message);
    else { setSessions(sessions.map((s) => (s.id === id ? { ...s, ...updates } : s))); toast.success(`Session ${status}`); }
  };

  const joinCall = (session: any) => navigate(`/call/${session.id}?room=${session.room_id}`);

  const submitReview = async () => {
    if (!rating || !reviewingSession || !user) return;
    setSubmittingReview(true);
    try {
      const isTeacher = reviewingSession.teacher_id === user.id;
      const revieweeId = isTeacher ? reviewingSession.learner_id : reviewingSession.teacher_id;
      const { error } = await supabase.from("reviews").insert({ session_id: reviewingSession.id, reviewer_id: user.id, reviewee_id: revieweeId, rating, comment });
      if (error) throw error;
      setExistingReviews((prev) => ({ ...prev, [reviewingSession.id]: true }));
      toast.success("Review submitted! ⭐");
      setReviewingSession(null); setRating(0); setComment("");
    } catch (err: any) { toast.error(err.message || "Failed to submit review"); }
    finally { setSubmittingReview(false); }
  };

  const filtered = statusFilter === "all" ? sessions : sessions.filter((s) => s.status === statusFilter);
  const completedCount = sessions.filter((s) => s.status === "completed").length;
  const taughtCount    = sessions.filter((s) => s.teacher_id === user?.id && s.status === "completed").length;
  const learnedCount   = sessions.filter((s) => s.learner_id === user?.id && s.status === "completed").length;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold">Your Sessions</h1>
          <p className="text-muted-foreground mt-1">Manage, review, and track your teaching and learning history.</p>
        </motion.div>

        {/* Stats */}
        {!loading && sessions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3">
            {[
              { icon: Flame,         label: "Total completed", value: completedCount, color: "text-orange-500", bg: "bg-orange-500/10" },
              { icon: Award,         label: "Lessons taught",  value: taughtCount,   color: "text-primary",    bg: "bg-primary/10" },
              { icon: GraduationCap, label: "Lessons learnt",  value: learnedCount,  color: "text-violet-500", bg: "bg-violet-500/10" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12 + i * 0.08 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                <Card className="text-center p-4 cursor-default group overflow-hidden relative">
                  <div className={`absolute inset-0 ${s.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className={`inline-flex p-2 rounded-xl ${s.bg} mb-2 relative z-10`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <p className={`text-2xl font-display font-bold ${s.color} relative z-10`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground relative z-10">{s.label}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Status filters */}
        {sessions.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-2 flex-wrap items-center">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            {["all", "pending", "confirmed", "in_progress", "completed", "cancelled"].map((s) => {
              const count = s === "all" ? sessions.length : sessions.filter((ss) => ss.status === s).length;
              return (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                  {s === "all" ? "All" : s.replace("_", " ")} ({count})
                </button>
              );
            })}
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 text-muted-foreground">
            <Calendar className="mx-auto h-14 w-14 mb-4 text-muted-foreground/20" />
            <p className="text-lg font-medium mb-1">No sessions yet</p>
            <p className="text-sm">Find a skill partner to get started!</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {filtered.map((s) => {
                const isTeacher = s.teacher_id === user!.id;
                const otherName = profiles[isTeacher ? s.learner_id : s.teacher_id]?.display_name || "Unknown";
                return (
                  <SessionCard key={s.id} s={s} isTeacher={isTeacher} otherName={otherName}
                    user={user} onUpdateStatus={updateStatus} onJoin={joinCall}
                    onReview={(sess: any) => setReviewingSession(sess)}
                    alreadyReviewed={existingReviews[s.id]} reviews={reviews} />
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Review modal */}
      <AnimatePresence>
        {reviewingSession && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setReviewingSession(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 240, damping: 22 }}
              className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5 border border-border"
              onClick={(e) => e.stopPropagation()}>
              <div>
                <h2 className="text-xl font-display font-bold">Rate this session</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  How was your session with {profiles[reviewingSession.teacher_id === user?.id ? reviewingSession.learner_id : reviewingSession.teacher_id]?.display_name}?
                </p>
              </div>
              <div className="flex items-center gap-2 justify-center">
                {[1,2,3,4,5].map((star) => (
                  <motion.button key={star} onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)} onMouseLeave={() => setHoveredRating(0)}
                    whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                    <Star className={`h-10 w-10 transition-all duration-150 ${star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "text-muted-foreground"}`} />
                  </motion.button>
                ))}
              </div>
              <AnimatePresence>
                {rating > 0 && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-center text-sm font-medium text-primary">
                    {rating === 1 ? "😞 Poor" : rating === 2 ? "😐 Fair" : rating === 3 ? "🙂 Good" : rating === 4 ? "😊 Great" : "🤩 Excellent!"}
                  </motion.p>
                )}
              </AnimatePresence>
              <Textarea placeholder="Leave a comment (optional)..." value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setReviewingSession(null)}>Cancel</Button>
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90" onClick={submitReview} disabled={!rating || submittingReview}>
                    {submittingReview ? "Submitting…" : "Submit Review ⭐"}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
  }
