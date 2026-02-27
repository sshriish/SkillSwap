import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, X, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = ["Programming", "Design", "Marketing", "Music", "Languages", "Business", "Science", "General"];

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ display_name: "", bio: "", avatar_url: "" });
  const [skills, setSkills] = useState<any[]>([]);
  const [newSkill, setNewSkill] = useState({ name: "", category: "General", skill_type: "offered", description: "" });
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [profileRes, skillsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("skills").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (profileRes.data) setProfile(profileRes.data as any);
      if (skillsRes.data) setSkills(skillsRes.data);
    };
    load();
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: profile.display_name,
      bio: profile.bio,
    }).eq("user_id", user!.id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated!");
    setSaving(false);
  };

  const addSkill = async () => {
    if (!newSkill.name.trim()) return;
    const { data, error } = await supabase.from("skills").insert({
      user_id: user!.id,
      name: newSkill.name,
      category: newSkill.category,
      skill_type: newSkill.skill_type,
      description: newSkill.description,
    }).select().single();
    if (error) toast.error(error.message);
    else {
      setSkills([data, ...skills]);
      setNewSkill({ name: "", category: "General", skill_type: "offered", description: "" });
      setShowAddSkill(false);
      toast.success("Skill added!");
    }
  };

  const removeSkill = async (id: string) => {
    await supabase.from("skills").delete().eq("id", id);
    setSkills(skills.filter((s) => s.id !== id));
    toast.success("Skill removed");
  };

  const offered = skills.filter((s) => s.skill_type === "offered");
  const wanted = skills.filter((s) => s.skill_type === "wanted");

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold">Your Profile</h1>
        </motion.div>

        <Card>
          <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={profile.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell others about yourself..." rows={3} />
            </div>
            <Button onClick={saveProfile} disabled={saving} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Skills</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddSkill(!showAddSkill)}>
              {showAddSkill ? <X className="mr-1 h-3 w-3" /> : <Plus className="mr-1 h-3 w-3" />}
              {showAddSkill ? "Cancel" : "Add Skill"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAddSkill && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 p-4 bg-muted rounded-lg">
                <Input placeholder="Skill name (e.g. React, Piano, Spanish)" value={newSkill.name} onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={newSkill.skill_type} onValueChange={(v) => setNewSkill({ ...newSkill, skill_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offered">I can teach</SelectItem>
                      <SelectItem value="wanted">I want to learn</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newSkill.category} onValueChange={(v) => setNewSkill({ ...newSkill, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addSkill} size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90">Add Skill</Button>
              </motion.div>
            )}

            {[{ title: "Skills I Offer", items: offered, type: "offered" }, { title: "Skills I Want", items: wanted, type: "wanted" }].map(({ title, items, type }) => (
              <div key={type}>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{title}</h4>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground/50">No skills added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {items.map((s) => (
                      <Badge key={s.id} variant={type === "offered" ? "default" : "secondary"} className="gap-1">
                        {s.name}
                        <button onClick={() => removeSkill(s.id)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
