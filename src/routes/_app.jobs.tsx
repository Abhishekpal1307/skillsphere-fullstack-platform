import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Search, MapPin, Building2, Bookmark, BookmarkCheck, Sparkles, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/jobs")({
  head: () => ({ meta: [{ title: "Jobs — SkillSphere" }] }),
  component: JobsPage,
});

interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  type: string | null;
  salary: string | null;
  category: string | null;
  description: string | null;
  apply_url: string | null;
}

interface MatchResult { id: string; score: number; reason: string }

function JobsPage() {
  const { user, session } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [matches, setMatches] = useState<Record<string, MatchResult>>({});

  useEffect(() => {
    (async () => {
      const [jobsRes, savedRes] = await Promise.all([
        supabase.from("jobs").select("*").order("created_at", { ascending: false }),
        user ? supabase.from("saved_jobs").select("job_id").eq("user_id", user.id) : Promise.resolve({ data: [], error: null }),
      ]);
      if (jobsRes.error) toast.error(jobsRes.error.message);
      setJobs((jobsRes.data || []) as Job[]);
      setSaved(new Set((savedRes.data || []).map((r: any) => r.job_id)));
      setLoading(false);
    })();
  }, [user]);

  const categories = useMemo(() => ["All", ...Array.from(new Set(jobs.map((j) => j.category).filter(Boolean) as string[]))], [jobs]);

  const filtered = useMemo(() => {
    let list = jobs;
    if (category !== "All") list = list.filter((j) => j.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        (j.location || "").toLowerCase().includes(q) ||
        (j.description || "").toLowerCase().includes(q)
      );
    }
    if (Object.keys(matches).length > 0) {
      list = [...list].sort((a, b) => (matches[b.id]?.score ?? -1) - (matches[a.id]?.score ?? -1));
    }
    return list;
  }, [jobs, search, category, matches]);

  async function toggleSave(jobId: string) {
    if (!user) { toast.error("Sign in to save jobs"); return; }
    if (saved.has(jobId)) {
      const { error } = await supabase.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", jobId);
      if (error) return toast.error(error.message);
      setSaved((s) => { const n = new Set(s); n.delete(jobId); return n; });
    } else {
      const { error } = await supabase.from("saved_jobs").insert({ user_id: user.id, job_id: jobId });
      if (error) return toast.error(error.message);
      setSaved((s) => new Set(s).add(jobId));
      toast.success("Job saved");
    }
  }

  async function runAIMatch() {
    if (!user || !session) { toast.error("Sign in to use AI match"); return; }
    setMatching(true);
    try {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (!profile?.skills || profile.skills.length === 0) {
        toast.error("Add some skills to your profile first");
        setMatching(false); return;
      }
      const accessToken = session.access_token;
      if (!accessToken) throw new Error("Your session expired. Please sign in again.");
      const { data, error } = await supabase.functions.invoke("match-jobs", {
        body: { profile, jobs: filtered.length ? filtered : jobs },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (error) throw error;
      const next: Record<string, MatchResult> = {};
      (data?.matches || []).forEach((m: MatchResult) => { next[m.id] = m; });
      setMatches(next);
      toast.success("AI ranked your matches");
    } catch (e: any) {
      toast.error(e?.message || "AI match failed");
    } finally {
      setMatching(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Jobs</h1>
        <p className="mt-1 text-muted-foreground">Curated roles from teams that ship.</p>
      </motion.div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="bg-input/60 pl-9" placeholder="Search by title, company, location..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {user && (
          <Button onClick={runAIMatch} disabled={matching} className="bg-gradient-primary glow hover:opacity-90">
            {matching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            AI match
          </Button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-1.5 text-xs transition-colors ${
              category === c ? "bg-gradient-primary text-primary-foreground" : "border border-border bg-card/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <AnimatePresence>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass h-44 animate-pulse rounded-2xl" />
            ))
          ) : filtered.length === 0 ? (
            <p className="col-span-full py-12 text-center text-muted-foreground">No jobs match your filters.</p>
          ) : (
            filtered.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i}
                saved={saved.has(job.id)}
                match={matches[job.id]}
                onToggleSave={() => toggleSave(job.id)}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export function JobCard({ job, index, saved, match, onToggleSave }: {
  job: Job; index: number; saved: boolean; match?: MatchResult; onToggleSave: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.25) }}
      whileHover={{ y: -4 }}
      className="glass group flex flex-col rounded-2xl p-5 transition-shadow hover:shadow-elevated"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold leading-tight">{job.title}</h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{job.company}</span>
            {job.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
          </div>
        </div>
        <button onClick={onToggleSave} aria-label={saved ? "Unsave" : "Save"} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
          {saved ? <BookmarkCheck className="h-5 w-5 text-secondary" /> : <Bookmark className="h-5 w-5" />}
        </button>
      </div>

      {match && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-2 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-secondary" />
          <span className="font-semibold text-secondary">{Math.round(match.score)}% match</span>
          <span className="truncate text-muted-foreground">— {match.reason}</span>
        </div>
      )}

      <p className="mt-3 line-clamp-2 flex-1 text-sm text-muted-foreground">{job.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {job.type && <Badge variant="outline" className="border-border/60">{job.type}</Badge>}
        {job.category && <Badge variant="outline" className="border-border/60">{job.category}</Badge>}
        {job.salary && <Badge variant="outline" className="border-accent/40 text-accent">{job.salary}</Badge>}
      </div>

      <a
        href={job.apply_url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] hover:glow"
      >
        Apply <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </motion.div>
  );
}
