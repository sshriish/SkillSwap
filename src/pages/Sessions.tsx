import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Calendar, Video, Check, X, Clock } from "lucide-react";
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
                      <div className="flex gap-2">
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
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
