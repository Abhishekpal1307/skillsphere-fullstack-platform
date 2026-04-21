import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — SkillSphere" }] }),
  component: SignupPage,
});

const schema = z
  .object({
    name: z.string().trim().min(2, "Name too short").max(80),
    email: z.string().trim().email("Invalid email").max(200),
    password: z.string().min(8, "Min 8 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      password: fd.get("password"),
      confirm: fd.get("confirm"),
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setErrors(errs);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: parsed.data.name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome to SkillSphere!");
    router.navigate({ to: "/dashboard" });
  }

  return (
    <AuthShell title="Create your account" subtitle="Start building your AI-powered portfolio">
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Full name" name="name" type="text" error={errors.name} autoComplete="name" />
        <Field label="Email" name="email" type="email" error={errors.email} autoComplete="email" />
        <Field label="Password" name="password" type="password" error={errors.password} autoComplete="new-password" />
        <Field label="Confirm password" name="confirm" type="password" error={errors.confirm} autoComplete="new-password" />
        <Button type="submit" disabled={loading} className="w-full bg-gradient-primary glow hover:opacity-90">
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-secondary hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}

export function Field({
  label, name, type, error, autoComplete,
}: { label: string; name: string; type: string; error?: string; autoComplete?: string }) {
  return (
    <div>
      <Label htmlFor={name} className="text-sm">{label}</Label>
      <Input id={name} name={name} type={type} autoComplete={autoComplete} className="mt-1.5 bg-input/60" />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">
            Skill<span className="text-gradient">Sphere</span>
          </span>
        </Link>
        <div className="glass rounded-2xl p-8 shadow-elevated">
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
