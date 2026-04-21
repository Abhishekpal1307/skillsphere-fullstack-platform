import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, ShieldAlert, Briefcase, Loader2, Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/use-is-admin";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Job = Tables<"jobs">;

export const Route = createFileRoute("/_app/admin")({
  component: AdminPage,
});

const empty = {
  title: "",
  company: "",
  location: "",
  type: "full-time",
  salary: "",
  category: "",
  description: "",
  apply_url: "",
};

function AdminPage() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });
    setJobs(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (job: Job) => {
    setEditing(job);
    setForm({
      title: job.title,
      company: job.company,
      location: job.location ?? "",
      type: job.type ?? "full-time",
      salary: job.salary ?? "",
      category: job.category ?? "",
      description: job.description ?? "",
      apply_url: job.apply_url ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.company.trim()) {
      toast.error("Title and company are required");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      company: form.company.trim(),
      location: form.location.trim() || null,
      type: form.type.trim() || null,
      salary: form.salary.trim() || null,
      category: form.category.trim() || null,
      description: form.description.trim() || null,
      apply_url: form.apply_url.trim() || null,
    };
    const { error } = editing
      ? await supabase.from("jobs").update(payload).eq("id", editing.id)
      : await supabase.from("jobs").insert({ ...payload, posted_by: user?.id ?? null });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Job updated" : "Job created");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this job?")) return;
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Job deleted");
    setJobs((j) => j.filter((x) => x.id !== id));
  };

  if (roleLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold">Admin access required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account doesn't have admin privileges. Ask an existing admin to grant you the
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">admin</code> role.
          </p>
          <Link to="/dashboard" className="mt-5 inline-block">
            <Button variant="outline" size="sm">Back to dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Admin · <span className="text-gradient">Jobs</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage every job listing on SkillSphere.
          </p>
        </div>
        <Button onClick={openNew} className="bg-gradient-primary glow">
          <Plus className="mr-1.5 h-4 w-4" /> New job
        </Button>
      </motion.div>

      {loading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
          No jobs yet. Create your first one.
        </div>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {job.company}
                    {job.location ? ` · ${job.location}` : ""}
                    {job.category ? ` · ${job.category}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(job)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => remove(job.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit job" : "Create job"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title *">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Company *">
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </Field>
            <Field label="Location">
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>
            <Field label="Type">
              <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="full-time" />
            </Field>
            <Field label="Salary">
              <Input value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
            </Field>
            <Field label="Category">
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Apply URL">
                <Input value={form.apply_url} onChange={(e) => setForm({ ...form, apply_url: e.target.value })} placeholder="https://..." />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Description">
                <Textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-gradient-primary glow">
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Create job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
