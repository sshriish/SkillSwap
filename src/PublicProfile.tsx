import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User, Star, Award, ArrowLeft, Play, X } from "lucide-react";

export default function PublicProfile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [watchingVideo, setWatchingVideo] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const [profileRes, skillsRes, reviewsRes, sessionsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("skills").select("*").eq("user_id", userId),
        supabase.from("reviews").select("*, reviewer:profiles!reviews_reviewer_id_fkey(display_name, avatar_url)").eq("reviewee_id", userId).order("created_at", { ascending: false }),
        supabase.from("sessions").select("id", { count: "exact" }).eq("teacher_id", userId).eq("status", "completed"),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      if (skillsRes.data) setSkills(skillsRes.data);
      if (reviewsRes.data) setReviews(reviewsRes.data as any);
      setSessionCount(sessionsRes.count ?? 0);
      setLoading(false);
    };
    load();
  }, [userId]);

  const requestSession = async () => {
    if (!user || !userId) return;
    setRequesting(true);
    const { error } = await supabase.from("sessions").insert({
      teacher_id: userId,
      learner_id: user.id,
      status: "pending",
    });
    if (error) toast.error(error.message);
    else { toast.success("Session request sent!"); navigate("/sessions"); }
    setRequesting(false);
  };

  const offered = skills.filter((s) => s.skill_type === "offered");
  const wanted = skills.filter((s) => s.skill_type === "wanted");
  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0;
  const isOwnProfile = user?.id === userId;

  if (loading) return (
    <AppLayout>
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    </AppLayout>
  );

  if (!profile) return (
    <AppLayout>
      <div className="text-center py-24 text-muted-foreground">User not found.</div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name} className="h-24 w-24 rounded-full object-cover border-4 border-primary/20 shrink-0" />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-4 border-primary/20 shrink-0">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl font-display font-bold">{profile.display_name || "Anonymous"}</h1>
                  <div className="flex flex-wrap gap-4 mt-2 justify-center sm:justify-start">
                    {avgRating > 0 && (
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                        ))}
                        <span className="text-sm text-muted-foreground ml-1">{avgRating} ({reviews.length})</span>
                      </div>
                    )}
                    {sessionCount > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Award className="h-4 w-4 text-primary" />
                        {sessionCount} sessions taught
                      </div>
                    )}
                  </div>
                  {profile.bio && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{profile.bio}</p>}
                  <div className="flex gap-3 mt-4 justify-center sm:justify-start flex-wrap">
                    {!isOwnProfile && (
                      <Button onClick={requestSession} disabled={requesting} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                        {requesting ? "Sending..." : "Request Session"}
                      </Button>
                    )}
                    {isOwnProfile && (
                      <Button variant="outline" onClick={() => navigate("/profile")}>Edit Profile</Button>
                    )}
                    {(profile as any).trial_video_url && (
                      <Button variant="outline" onClick={() => setWatchingVideo(true)} className="gap-2">
                        <Play className="h-4 w-4" /> Watch Intro
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {offered.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Teaches</p>
                  <div className="flex flex-wrap gap-2">{offered.map((s) => <Badge key={s.id} variant="default">{s.name}</Badge>)}</div>
                </div>
              )}
              {wanted.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Wants to learn</p>
                  <div className="flex flex-wrap gap-2">{wanted.map((s) => <Badge key={s.id} variant="secondary">{s.name}</Badge>)}</div>
                </div>
              )}
              {skills.length === 0 && <p className="text-sm text-muted-foreground">No skills listed yet.</p>}
            </CardContent>
          </Card>
        </motion.div>

        {reviews.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader><CardTitle>Reviews ({reviews.length})</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                        {(r.reviewer as any)?.display_name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{(r.reviewer as any)?.display_name || "Anonymous"}</p>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((s) => <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />)}
                        </div>
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {watchingVideo && (profile as any).trial_video_url && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setWatchingVideo(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-card rounded-2xl overflow-hidden w-full max-w-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <p className="font-display font-semibold">{profile.display_name}'s Intro Video</p>
              <button onClick={() => setWatchingVideo(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <video src={(profile as any).trial_video_url} controls autoPlay className="w-full bg-black max-h-96" />
          </motion.div>
        </motion.div>
      )}
    </AppLayout>
  );
}
