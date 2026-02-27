import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Search, ArrowRight, User as UserIcon } from "lucide-react";

interface MatchUser {
  user_id: string;
  display_name: string;
  bio: string;
  offeredSkills: string[];
  wantedSkills: string[];
}

export default function Matching() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Get all skills and profiles (excluding current user)
      const [skillsRes, profilesRes] = await Promise.all([
        supabase.from("skills").select("*"),
        supabase.from("profiles").select("*").neq("user_id", user.id),
      ]);

      if (!profilesRes.data || !skillsRes.data) { setLoading(false); return; }

      const skillsByUser: Record<string, { offered: string[]; wanted: string[] }> = {};
      for (const s of skillsRes.data) {
        if (!skillsByUser[s.user_id]) skillsByUser[s.user_id] = { offered: [], wanted: [] };
        if (s.skill_type === "offered") skillsByUser[s.user_id].offered.push(s.name);
        else skillsByUser[s.user_id].wanted.push(s.name);
      }

      const users: MatchUser[] = profilesRes.data.map((p) => ({
        user_id: p.user_id,
        display_name: p.display_name || "Anonymous",
        bio: p.bio || "",
        offeredSkills: skillsByUser[p.user_id]?.offered || [],
        wantedSkills: skillsByUser[p.user_id]?.wanted || [],
      }));

      setMatches(users);
      setLoading(false);
    };
    load();
  }, [user]);

  const requestSession = async (teacherId: string) => {
    const { error } = await supabase.from("sessions").insert({
      teacher_id: teacherId,
      learner_id: user!.id,
      status: "pending",
    });
    if (error) toast.error(error.message);
    else toast.success("Session request sent!");
  };

  const filtered = matches.filter((m) =>
    m.display_name.toLowerCase().includes(search.toLowerCase()) ||
    m.offeredSkills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold">Find Skill Partners</h1>
          <p className="text-muted-foreground mt-1">Discover people to exchange skills with.</p>
        </motion.div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or skill..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No users found. Invite your friends to join!</div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((m, i) => (
              <motion.div key={m.user_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <UserIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold">{m.display_name}</h3>
                      {m.bio && <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{m.bio}</p>}
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
                    <Button size="sm" onClick={() => requestSession(m.user_id)} className="shrink-0 bg-gradient-primary text-primary-foreground hover:opacity-90">
                      Request <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
