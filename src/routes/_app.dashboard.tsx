import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Camera, Trash2, Loader2, User as UserIcon, Sparkles, FileText, Check, UserCircle2, AlignLeft, Wrench, BadgeCheck, Plus } from "lucide-react";
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
  const [parsing, setParsing] = useState(false);
  const [suggestion, setSuggestion] = useState<null | {
    full_name: string | null; bio: string; skills: string[]; experience_level: string;
    apply: { name: boolean; bio: boolean; skills: boolean; level: boolean };
  }>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  async function handleResumeFile(file: File) {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resume too large (max 5MB).");
      return;
    }
    setParsing(true);
    try {
      const text = await extractResumeText(file);
      if (text.length < 80) throw new Error("Couldn't read enough text from this file. Try another export.");
      const { data, error } = await supabase.functions.invoke("parse-resume", {
        body: { resumeText: text, currentName: profile?.full_name },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setSuggestion({
        full_name: data.full_name ?? null,
        bio: data.bio ?? "",
        skills: Array.isArray(data.skills) ? data.skills : [],
        experience_level: data.experience_level ?? "junior",
        apply: { name: !!data.full_name, bio: !!data.bio, skills: true, level: true },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Resume parsing failed");
    } finally {
      setParsing(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  }

  function applySuggestion() {
    if (!suggestion || !profile) return;
    const merged = { ...profile };
    if (suggestion.apply.name && suggestion.full_name) merged.full_name = suggestion.full_name;
    if (suggestion.apply.bio) merged.bio = suggestion.bio;
    if (suggestion.apply.level) merged.experience_level = suggestion.experience_level;
    if (suggestion.apply.skills) {
      const set = new Set([...(profile.skills || []), ...suggestion.skills]);
      merged.skills = Array.from(set).slice(0, 30);
    }
    setProfile(merged);
    setSuggestion(null);
    toast.success("Resume insights applied — review and save.");
  }

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

            <div className="rounded-xl border border-dashed border-secondary/40 bg-secondary/5 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-primary glow">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-display text-sm font-semibold">Import from resume (AI)</p>
                  <p className="text-xs text-muted-foreground">
                    Upload a PDF, DOCX, or TXT. We'll extract your skills and draft an optimized bio.
                  </p>
                  <div className="mt-3">
                    <input
                      ref={resumeInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleResumeFile(f); }}
                    />
                    <Button
                      type="button" variant="outline" size="sm"
                      disabled={parsing}
                      onClick={() => resumeInputRef.current?.click()}
                    >
                      {parsing ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Analyzing...</> : <><FileText className="mr-1.5 h-4 w-4" /> Upload resume</>}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={save} disabled={saving} className="w-full bg-gradient-primary glow hover:opacity-90">
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </motion.div>
      </div>

      <Dialog open={!!suggestion} onOpenChange={(o) => !o && setSuggestion(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary glow">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="font-display">AI extraction preview</DialogTitle>
                <DialogDescription>Detected fields highlighted below — toggle to apply.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {suggestion && (() => {
            const existingSkills = new Set((profile.skills || []).map((s) => s.toLowerCase()));
            const newSkillCount = suggestion.skills.filter((s) => !existingSkills.has(s.toLowerCase())).length;
            const selectedCount =
              (suggestion.apply.name && suggestion.full_name ? 1 : 0) +
              (suggestion.apply.level ? 1 : 0) +
              (suggestion.apply.bio ? 1 : 0) +
              (suggestion.apply.skills ? 1 : 0);

            return (
              <div className="space-y-4">
                {/* Summary strip */}
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-secondary/30 bg-secondary/5 px-3 py-2 text-xs">
                  <BadgeCheck className="h-4 w-4 text-secondary" />
                  <span className="font-medium">{selectedCount} of 4 fields selected</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{suggestion.skills.length} skills detected ({newSkillCount} new)</span>
                </div>

                {/* Full name */}
                {suggestion.full_name && (
                  <PreviewCard
                    icon={<UserCircle2 className="h-4 w-4" />}
                    label="Full name"
                    checked={suggestion.apply.name}
                    onToggle={(v) => setSuggestion({ ...suggestion, apply: { ...suggestion.apply, name: v } })}
                    accent="primary"
                  >
                    <div className="font-display text-lg font-semibold">{suggestion.full_name}</div>
                    {profile.full_name && profile.full_name !== suggestion.full_name && (
                      <div className="mt-1 text-xs text-muted-foreground line-through">Was: {profile.full_name}</div>
                    )}
                  </PreviewCard>
                )}

                {/* Experience level */}
                <PreviewCard
                  icon={<BadgeCheck className="h-4 w-4" />}
                  label="Experience level"
                  checked={suggestion.apply.level}
                  onToggle={(v) => setSuggestion({ ...suggestion, apply: { ...suggestion.apply, level: v } })}
                  accent="primary"
                >
                  <Badge className="bg-primary/15 text-primary hover:bg-primary/20 capitalize">
                    {suggestion.experience_level}
                  </Badge>
                </PreviewCard>

                {/* Bio */}
                <PreviewCard
                  icon={<AlignLeft className="h-4 w-4" />}
                  label="Bio"
                  meta={`${suggestion.bio.length} chars`}
                  checked={suggestion.apply.bio}
                  onToggle={(v) => setSuggestion({ ...suggestion, apply: { ...suggestion.apply, bio: v } })}
                  accent="secondary"
                >
                  <p className="text-sm leading-relaxed text-foreground/90">{suggestion.bio}</p>
                </PreviewCard>

                {/* Skills — each highlighted */}
                <PreviewCard
                  icon={<Wrench className="h-4 w-4" />}
                  label="Skills"
                  meta={`${suggestion.skills.length} detected`}
                  checked={suggestion.apply.skills}
                  onToggle={(v) => setSuggestion({ ...suggestion, apply: { ...suggestion.apply, skills: v } })}
                  accent="secondary"
                >
                  {suggestion.skills.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No skills detected.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {suggestion.skills.map((s) => {
                        const isNew = !existingSkills.has(s.toLowerCase());
                        return (
                          <Badge
                            key={s}
                            variant="secondary"
                            className={
                              isNew
                                ? "bg-secondary/20 text-secondary border border-secondary/40 gap-1"
                                : "bg-muted text-muted-foreground border border-border gap-1"
                            }
                            title={isNew ? "New skill" : "Already in your profile"}
                          >
                            {isNew ? <Plus className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                            {s}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-secondary" /> New</span>
                    <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/50" /> Already added</span>
                  </div>
                </PreviewCard>
              </div>
            );
          })()}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSuggestion(null)}>Discard</Button>
            <Button onClick={applySuggestion} className="bg-gradient-primary glow hover:opacity-90">
              <Check className="mr-1.5 h-4 w-4" /> Apply selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function PreviewCard({
  icon, label, meta, checked, onToggle, accent, children,
}: {
  icon: React.ReactNode;
  label: string;
  meta?: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
  accent: "primary" | "secondary";
  children: React.ReactNode;
}) {
  const accentRing =
    accent === "primary"
      ? checked ? "border-primary/50 bg-primary/5" : "border-border"
      : checked ? "border-secondary/50 bg-secondary/5" : "border-border";
  const accentIcon =
    accent === "primary" ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary";

  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${accentRing}`}>
      <Checkbox checked={checked} onCheckedChange={(v) => onToggle(!!v)} className="mt-1" />
      <div className="flex-1 min-w-0">
        <div className="mb-2 flex items-center gap-2">
          <span className={`grid h-6 w-6 place-items-center rounded-md ${accentIcon}`}>{icon}</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
          {meta && <span className="ml-auto text-[11px] text-muted-foreground">{meta}</span>}
        </div>
        {children}
      </div>
    </label>
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
