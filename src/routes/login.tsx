import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AuthShell, Field } from "./signup";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — SkillSphere" }] }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(72),
});

function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setErrors(errs);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    router.navigate({ to: "/dashboard" });
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your SkillSphere account">
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Email" name="email" type="email" error={errors.email} autoComplete="email" />
        <Field label="Password" name="password" type="password" error={errors.password} autoComplete="current-password" />
        <Button type="submit" disabled={loading} className="w-full bg-gradient-primary glow hover:opacity-90">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link to="/signup" className="text-secondary hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}
