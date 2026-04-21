import { Link } from "@tanstack/react-router";
import { Sparkles, Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/50 bg-card/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold">
                Skill<span className="text-gradient">Sphere</span>
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              The AI-powered portfolio and job-matching platform built for the next generation of developers.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/jobs" className="hover:text-foreground">Jobs</Link></li>
              <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
              <li><Link to="/signup" className="hover:text-foreground">Get started</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Connect</h4>
            <div className="flex gap-3 text-muted-foreground">
              <a href="#" aria-label="GitHub" className="hover:text-foreground"><Github className="h-5 w-5" /></a>
              <a href="#" aria-label="Twitter" className="hover:text-foreground"><Twitter className="h-5 w-5" /></a>
              <a href="#" aria-label="LinkedIn" className="hover:text-foreground"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border/50 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SkillSphere. Crafted for builders.
        </div>
      </div>
    </footer>
  );
}
