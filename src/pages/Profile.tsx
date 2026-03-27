import { useEffect, useState, useRef } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Save, Camera, Video, Upload, Copy, Check, Gift, Users, Share2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = ["Programming", "Design", "Marketing", "Music", "Languages", "Business", "Science", "General"];

// ── Referral Card ─────────────────────────────────────────────────────────────

function ReferralCard({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);
  const [referralStats, setReferralStats] = useState({ invited: 0, completed: 0, creditsEarned: 0 });

  // Derive a short referral code from the user's UUID
  const referralCode = userId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  useEffect(() => {
    // Count how many users signed up with this referral code
    // and how many completed their first session (earned credits via referral bonus)
    const load = async () => {
      const { data: bonusTxs } = await supabase
        .from("credit_transactions")
        .select("id, amount")
        .eq("user_id", userId)
        .eq("type", "bonus")
        .ilike("description", "%referral%");

      if (bonusTxs) {
        setReferralStats({
          invited: bonusTxs.length,
          completed: bonusTxs.length,
          creditsEarned: bonusTxs.reduce((s, t) => s + t.amount, 0),
        });
      }
    };
    load();
  }, [userId]);

  const copy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Join me on SkillSwap",
        text: "Swap skills with real people. Teach what you know, learn what you don't — free.",
        url: referralLink,
      });
    } else {
      copy();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <Card className="overflow-hidden border-2 border-dashed border-primary/20">
        {/* Subtle top accent */}
        <div className="h-1 bg-gradient-primary w-full" />

        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Gift className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">Invite Friends, Earn Credits</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Share your link. When a friend joins and completes their first session,
            you both get <span className="font-semibold text-foreground">+5 credits</span> free.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">

          {/* Stats row */}
          {referralStats.creditsEarned > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-3 gap-3"
            >
              {[
                { label: "Friends invited", value: referralStats.invited },
                { label: "Sessions completed", value: referralStats.completed },
                { label: "Credits earned", value: `+${referralStats.creditsEarned}` },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-muted/60 p-3 text-center">
                  <p className="text-xl font-bold font-mono">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          )}

          {/* Referral link box */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-muted rounded-lg px-3 py-2 gap-2 min-w-0">
              <span className="text-xs text-muted-foreground flex-shrink-0">🔗</span>
              <span className="text-sm font-mono text-foreground truncate">{referralLink}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={copy}
              className="flex-shrink-0 gap-1.5 transition-all"
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }} className="flex items-center gap-1.5 text-green-600">
                    <Check className="h-3.5 w-3.5" /> Copied!
                  </motion.span>
                ) : (
                  <motion.span key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }} className="flex items-center gap-1.5">
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
            <Button size="sm" variant="outline" onClick={share} className="flex-shrink-0 gap-1.5">
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
          </div>

          {/* How it works */}
          <div className="flex items-start gap-6 pt-1">
            {[
              { step: "1", text: "Copy your link" },
              { step: "2", text: "Friend signs up" },
              { step: "3", text: "They complete a session → you both get +5" },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-2 flex-1">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                  {s.step}
                </span>
                <p className="text-xs text-muted-foreground leading-snug">{s.text}</p>
              </div>
            ))}
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Main Profile Page ─────────────────────────────────────────────────────────

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ display_name: "", bio: "", avatar_url: "", trial_video_url: "" });
  const [skills, setSkills] = useState<any[]>([]);
  const [newSkill, setNewSkill] = useState({ name: "", category: "General", skill_type: "offered", description: "" });
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `public/${user.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("user_id", user.id);
      setProfile((prev) => ({ ...prev, avatar_url: data.publicUrl }));
      toast.success("Profile picture updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const uploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("video/")) { toast.error("Please select a video file"); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error("Video must be under 50MB"); return; }
    setUploadingVideo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `public/${user.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("trial-videos").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("trial-videos").getPublicUrl(fileName);
      await supabase.from("profiles").update({ trial_video_url: data.publicUrl }).eq("user_id", user.id);
      setProfile((prev) => ({ ...prev, trial_video_url: data.publicUrl }));
      toast.success("Trial video uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload video");
    } finally {
      setUploadingVideo(false);
    }
  };

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
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold">Your Profile</h1>
        </motion.div>

        {/* Profile Media */}
        <Card>
          <CardHeader><CardTitle>Profile Media</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="h-24 w-24 rounded-full object-cover border-4 border-primary/20" />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-4 border-primary/20">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Profile Picture</p>
                <p className="text-xs text-muted-foreground">JPG, PNG or GIF · Max 5MB</p>
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
                <Button size="sm" variant="outline" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}>
                  <Upload className="mr-2 h-3 w-3" />
                  {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Trial Video</p>
                <p className="text-xs text-muted-foreground mt-0.5">Record a short intro video · Max 50MB</p>
              </div>
              {profile.trial_video_url ? (
                <div className="space-y-3">
                  <video src={profile.trial_video_url} controls className="w-full rounded-xl border border-border max-h-48 bg-black" />
                  <input ref={videoInputRef} type="file" accept="video/*" onChange={uploadVideo} className="hidden" />
                  <Button size="sm" variant="outline" onClick={() => videoInputRef.current?.click()} disabled={uploadingVideo}>
                    <Video className="mr-2 h-3 w-3" />
                    {uploadingVideo ? "Uploading..." : "Replace Video"}
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                  <Video className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">No trial video yet. Upload one so peers can decide if they want to learn from you!</p>
                  <input ref={videoInputRef} type="file" accept="video/*" onChange={uploadVideo} className="hidden" />
                  <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90" onClick={() => videoInputRef.current?.click()} disabled={uploadingVideo}>
                    <Upload className="mr-2 h-3 w-3" />
                    {uploadingVideo ? "Uploading..." : "Upload Trial Video"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
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

        {/* Skills */}
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

        {/* ── Referral Card at bottom ── */}
        {user && <ReferralCard userId={user.id} />}

      </div>
    </AppLayout>
  );
      }
