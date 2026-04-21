import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { JobCard } from "./_app.jobs";

export const Route = createFileRoute("/_app/saved")({
  head: () => ({ meta: [{ title: "Saved jobs — SkillSphere" }] }),
  component: SavedPage,
});

function SavedPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("job_id, jobs(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      const list = (data || []).map((r: any) => r.jobs).filter(Boolean);
      setJobs(list);
      setSavedIds(new Set(list.map((j: any) => j.id)));
      setLoading(false);
    })();
  }, [user]);

  async function unsave(jobId: string) {
    if (!user) return;
    const { error } = await supabase.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", jobId);
    if (error) return toast.error(error.message);
    setJobs((js) => js.filter((j) => j.id !== jobId));
    setSavedIds((s) => { const n = new Set(s); n.delete(jobId); return n; });
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Saved jobs</h1>
        <p className="mt-1 text-muted-foreground">Your shortlist, ready when you are.</p>
      </motion.div>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => <div key={i} className="glass h-44 animate-pulse rounded-2xl" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="glass mx-auto max-w-md rounded-2xl p-10 text-center">
            <Bookmark className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 font-display text-lg font-semibold">No saved jobs yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Browse roles and tap the bookmark to save them here.</p>
            <Link to="/jobs" className="mt-5 inline-flex rounded-xl bg-gradient-primary px-5 py-2 text-sm font-medium text-primary-foreground glow">
              Browse jobs
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <AnimatePresence>
              {jobs.map((job, i) => (
                <JobCard key={job.id} job={job} index={i} saved={savedIds.has(job.id)} onToggleSave={() => unsave(job.id)} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}
