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
import { Calendar, Video, Check, X, Clock, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-info/10 text-info",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [reviewingSession, setReviewingSession] = useState<any | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [existingReviews, setExistingReviews] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (data) {
        setSessions(data);
        const userIds = [...new Set(data.flatMap((s) => [s.teacher_id, s.learner_id]))];
        const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
        if (profs) {
          const map: Record<string, string> = {};
          profs.forEach((p) => (map[p.user_id] = p.display_name));
          setProfiles(map);
        }

        const completedIds = data.filter((s) => s.status === "completed").map((s) => s.id);
        if (completedIds.length > 0) {
          const { data: reviews } = await supabase
            .from("reviews")
            .select("session_id")
            .eq("reviewer_id", user.id)
            .in("session_id", completedIds);
          if (reviews) {
            const reviewed: Record<string, boolean> = {};
            reviews.forEach((r) => (reviewed[r.session_id] = true));
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
    else {
      setSessions(sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)));
      toast.success(`Session ${status}`);
    }
  };

  const joinCall = (session: any) => {
    navigate(`/call/${session.id}?room=${session.room_id}`);
  };

  const submitReview = async () => {
    if (!rating || !reviewingSession || !user) return;
    setSubmittingReview(true);
    try {
      const isTeacher = reviewingSession.teacher_id === user.id;
      const revieweeId = isTeacher ? reviewingSession.learner_id : reviewingSession.teacher_id;
      const { error } = await supabase.from("reviews").insert({
        session_id: reviewingSession.id,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        comment,
      });
      if (error) throw error;
      setExistingReviews((prev) => ({ ...prev, [reviewingSession.id]: true }));
      toast.success("Review submitted! ⭐");
      setReviewingSession(null);
      setRating(0);
      setComment("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold">Your Sessions</h1>
          <p className="text-muted-foreground mt-1">Manage your teaching and learning sessions.</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="mx-auto h-12 w-12 mb-4 text-muted-foreground/30" />
            No sessions yet. Find a skill partner to get started!
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s, i) => {
              const isTeacher = s.teacher_id === user!.id;
              const otherName = profiles[isTeacher ? s.learner_id : s.teacher_id] || "Unknown";
              const alreadyReviewed = existingReviews[s.id];
              return (
                <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-display font-semibold">{otherName}</span>
                          <Badge className={`text-xs ${statusColors[s.status] || ""}`} variant="outline">{s.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {isTeacher ? "You're teaching" : "You're learning"} ·
                          {s.duration_minutes ? ` ${s.duration_minutes} min` : " Duration TBD"}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        {s.status === "pending" && isTeacher && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, "cancelled")}><X className="h-3 w-3" /></Button>
                            <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90" onClick={() => updateStatus(s.id, "confirmed")}>
                              <Check className="mr-1 h-3 w-3" /> Accept
                            </Button>
                          </>
                        )}
                        {s.status === "confirmed" && s.room_id && (
                          <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90" onClick={() => joinCall(s)}>
                            <Video className="mr-1 h-3 w-3" /> Join Call
                          </Button>
                        )}
                        {s.status === "pending" && !isTeacher && (
                          <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Waiting</Badge>
                        )}
                        {s.status === "completed" && !alreadyReviewed && (
                          <Button size="sm" variant="outline" onClick={() => setReviewingSession(s)} className="gap-1 border-yellow-400 text-yellow-500 hover:bg-yellow-50">
                            <Star className="h-3 w-3" /> Rate Session
                          </Button>
                        )}
                        {s.status === "completed" && alreadyReviewed && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> Reviewed
                          </Badge>
                        )}
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
        {reviewingSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setReviewingSession(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl p-6 w-full max-w-md shadow-xl space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <h2 className="text-xl font-display font-bold">Rate this session</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  How was your session with {profiles[reviewingSession.teacher_id === user?.id ? reviewingSession.learner_id : reviewingSession.teacher_id]}?
                </p>
              </div>
              <div className="flex items-center gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star className={`h-10 w-10 transition-colors ${star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm font-medium text-primary">
                  {rating === 1 ? "😞 Poor" : rating === 2 ? "😐 Fair" : rating === 3 ? "🙂 Good" : rating === 4 ? "😊 Great" : "🤩 Excellent!"}
                </p>
              )}
              <Textarea placeholder="Leave a comment (optional)..." value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setReviewingSession(null)}>Cancel</Button>
                <Button className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90" onClick={submitReview} disabled={!rating || submittingReview}>
                  {submittingReview ? "Submitting..." : "Submit Review ⭐"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
