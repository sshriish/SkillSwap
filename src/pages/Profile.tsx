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
import { motion } from "framer-motion";
import { Plus, X, Save, Camera, Video, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = ["Programming", "Design", "Marketing", "Music", "Languages", "Business", "Science", "General"];

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
      const fileName = `${user.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const avatarUrl = data.publicUrl;
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user.id);
      if (updateError) throw updateError;
      setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));
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
      const fileName = `${user.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("trial-videos").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("trial-videos").getPublicUrl(fileName);
      const videoUrl = data.publicUrl;
      const { error: updateError } = await supabase.from("profiles").update({ trial_video_url: videoUrl }).eq("user_id", user.id);
      if (updateError) throw updateError;
      setProfile((prev) => ({ ...prev, trial_video_url: videoUrl }));
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
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold">Your Profile</h1>
        </motion.div>

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
            <Button size="sm" variant="out
