import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="grid h-14 w-14 animate-pulse place-items-center rounded-2xl bg-gradient-primary glow">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="glass max-w-sm rounded-2xl p-8 text-center">
          <h2 className="font-display text-xl font-semibold">Sign in required</h2>
          <p className="mt-2 text-sm text-muted-foreground">You need an account to access this page.</p>
          <div className="mt-5 flex justify-center gap-2">
            <Link to="/login" className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground glow">
              Log in
            </Link>
            <Link to="/signup" className="rounded-xl border border-border px-4 py-2 text-sm">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}
