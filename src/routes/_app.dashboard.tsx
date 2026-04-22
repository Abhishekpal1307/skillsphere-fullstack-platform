import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Camera, Trash2, Loader2, User as UserIcon, Sparkles, FileText, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { extractResumeText } from "@/lib/extract-resume-text";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SkillSphere" }] }),
  component: DashboardPage,
});

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  skills: string[] | null;
  resume_link: string | null;
  experience_level: string | null;
}

function DashboardPage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) toast.error(error.message);
      setProfile(data as Profile | null);
      setLoading(false);
    })();
  }, [user]);

  async function save() {
    if (!profile || !user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      bio: profile.bio,
      skills: profile.skills,
      resume_link: profile.resume_link,
      experience_level: profile.experience_level,
    }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  }

  async function uploadAvatar(file: File) {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: updErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    setUploading(false);
    if (updErr) { toast.error(updErr.message); return; }
    setProfile((p) => p ? { ...p, avatar_url: url } : p);
    toast.success("Avatar updated");
  }

  function addSkill() {
    const s = skillInput.trim();
    if (!s || !profile) return;
    if ((profile.skills || []).includes(s)) return;
    setProfile({ ...profile, skills: [...(profile.skills || []), s] });
    setSkillInput("");
  }

  function removeSkill(s: string) {
    if (!profile) return;
    setProfile({ ...profile, skills: (profile.skills || []).filter((x) => x !== s) });
  }

  async function deleteProfile() {
    if (!user) return;
    if (!confirm("Permanently delete your profile? This cannot be undone.")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", user.id);
    if (error) { toast.error(error.message); return; }
    await signOut();
    toast.success("Profile deleted");
    window.location.href = "/";
  }

  if (loading) {
    return <div className="mx-auto max-w-4xl px-6 py-16"><SkeletonProfile /></div>;
  }
  if (!profile) {
    return <div className="mx-auto max-w-4xl px-6 py-16 text-center text-muted-foreground">Profile not found.</div>;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      >
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Your portfolio</h1>
        <p className="mt-1 text-muted-foreground">Edit your profile so AI can match you to the right roles.</p>
      </motion.div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_2fr]">
        {/* Avatar card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="glass rounded-2xl p-6 text-center"
        >
          <div className="relative mx-auto h-28 w-28">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-28 w-28 rounded-full object-cover" />
            ) : (
              <div className="grid h-28 w-28 place-items-center rounded-full bg-gradient-primary glow">
                <UserIcon className="h-10 w-10 text-primary-foreground" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-card border border-border shadow hover:bg-muted">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]; if (f) uploadAvatar(f);
              }} />
            </label>
          </div>
          <div className="mt-4 font-display text-lg font-semibold">{profile.full_name || "Unnamed"}</div>
          <div className="text-xs text-muted-foreground">{user?.email}</div>
          <Button variant="outline" size="sm" className="mt-5 w-full text-destructive hover:text-destructive" onClick={deleteProfile}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete profile
          </Button>
        </motion.div>

        {/* Profile form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
          className="glass rounded-2xl p-6"
        >
          <div className="space-y-4">
            <div>
              <Label>Full name</Label>
              <Input className="mt-1.5 bg-input/60" value={profile.full_name || ""}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea className="mt-1.5 bg-input/60 min-h-24" placeholder="A short pitch about you..."
                value={profile.bio || ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
            </div>
            <div>
              <Label>Experience level</Label>
              <select
                value={profile.experience_level || "junior"}
                onChange={(e) => setProfile({ ...profile, experience_level: e.target.value })}
                className="mt-1.5 w-full rounded-md border border-input bg-input/60 px-3 py-2 text-sm"
              >
                <option value="junior">Junior</option>
                <option value="mid">Mid-level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead / Staff</option>
              </select>
            </div>
            <div>
              <Label>Resume link</Label>
              <Input className="mt-1.5 bg-input/60" placeholder="https://..."
                value={profile.resume_link || ""}
                onChange={(e) => setProfile({ ...profile, resume_link: e.target.value })} />
            </div>
            <div>
              <Label>Skills</Label>
              <div className="mt-1.5 flex gap-2">
                <Input className="bg-input/60" placeholder="e.g. TypeScript" value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                />
                <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(profile.skills || []).map((s) => (
                  <Badge key={s} variant="secondary" className="cursor-pointer bg-secondary/15 text-secondary hover:bg-secondary/25" onClick={() => removeSkill(s)}>
                    {s} ×
                  </Badge>
                ))}
                {(profile.skills || []).length === 0 && <p className="text-xs text-muted-foreground">No skills yet — add a few to power AI matching.</p>}
              </div>
            </div>

            <Button onClick={save} disabled={saving} className="w-full bg-gradient-primary glow hover:opacity-90">
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

function SkeletonProfile() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <div className="glass h-64 animate-pulse rounded-2xl" />
        <div className="glass h-96 animate-pulse rounded-2xl" />
      </div>
    </div>
  );
}
