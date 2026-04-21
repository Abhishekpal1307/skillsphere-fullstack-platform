import { Link, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, LogOut, LayoutDashboard, Briefcase, Bookmark } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 w-full"
    >
      <div className="mx-auto mt-3 flex max-w-6xl items-center justify-between gap-4 rounded-2xl glass px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            Skill<span className="text-gradient">Sphere</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/jobs">Jobs</NavLink>
          {user && <NavLink to="/saved">Saved</NavLink>}
          {user && <NavLink to="/dashboard">Dashboard</NavLink>}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await signOut();
                router.navigate({ to: "/" });
              }}
            >
              <LogOut className="mr-1.5 h-4 w-4" /> Sign out
            </Button>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="bg-gradient-primary hover:opacity-90 glow">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile bottom nav for auth users */}
      {user && (
        <nav className="fixed bottom-3 left-1/2 z-50 -translate-x-1/2 md:hidden">
          <div className="flex gap-1 rounded-full glass px-2 py-1.5">
            <MobileIcon to="/dashboard" icon={<LayoutDashboard className="h-5 w-5" />} />
            <MobileIcon to="/jobs" icon={<Briefcase className="h-5 w-5" />} />
            <MobileIcon to="/saved" icon={<Bookmark className="h-5 w-5" />} />
          </div>
        </nav>
      )}
    </motion.header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      activeProps={{ className: "rounded-lg px-3 py-1.5 text-sm text-foreground bg-muted" }}
    >
      {children}
    </Link>
  );
}

function MobileIcon({ to, icon }: { to: string; icon: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
      activeProps={{ className: "grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-primary-foreground" }}
    >
      {icon}
    </Link>
  );
}
