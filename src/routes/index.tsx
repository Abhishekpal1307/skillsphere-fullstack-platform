import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Brain, Briefcase, Rocket, Star } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillSphere — AI Developer Portfolio & Job Matching" },
      { name: "description", content: "Showcase your skills, build a stunning portfolio, and let AI match you with the perfect role." },
    ],
  }),
  component: HomePage,
});

const features = [
  { icon: Brain, title: "AI-Powered Matching", desc: "Our AI reads your skills and projects to recommend roles you'll actually love — and explains why." },
  { icon: Sparkles, title: "Stunning Portfolio", desc: "Showcase projects, skills, and experience with a portfolio that looks like a million bucks." },
  { icon: Briefcase, title: "Curated Jobs", desc: "Hand-picked roles from forward-thinking startups and established teams shipping real product." },
  { icon: Rocket, title: "Built for Builders", desc: "Resume link, project gallery, and skill tags — everything recruiters look for, nothing they don't." },
];

const testimonials = [
  { name: "Maya Chen", role: "Senior Frontend Eng @ Linear", quote: "Landed three interviews in my first week. The AI matching is freakishly good." },
  { name: "Jordan Patel", role: "ML Engineer @ Anthropic", quote: "Finally, a portfolio platform that doesn't look like a resume from 2014." },
  { name: "Sam Rivera", role: "Indie Founder", quote: "Hired two engineers from SkillSphere in a month. The signal-to-noise is unreal." },
];

function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-hero relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-28 text-center sm:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
            AI-powered • Built for developers
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mx-auto mt-6 max-w-3xl font-display text-5xl font-bold leading-[1.05] sm:text-6xl md:text-7xl"
          >
            Your portfolio, <br />
            <span className="text-gradient">supercharged by AI.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground"
          >
            Build a stunning developer portfolio in minutes. Let AI match you with roles where you'll thrive.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link to="/signup">
              <Button size="lg" className="group bg-gradient-primary px-7 text-base glow hover:opacity-90">
                Start building free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/jobs">
              <Button size="lg" variant="outline" className="border-border bg-card/40 px-7 text-base backdrop-blur hover:bg-card/70">
                Browse jobs
              </Button>
            </Link>
          </motion.div>

          {/* Floating preview card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative mx-auto mt-20 max-w-3xl"
          >
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-primary opacity-30 blur-3xl" />
            <div className="glass animate-float rounded-2xl p-6 shadow-elevated">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-primary" />
                <div className="text-left">
                  <div className="font-semibold">Alex Rivera</div>
                  <div className="text-xs text-muted-foreground">Senior Full-Stack Engineer</div>
                </div>
                <div className="ml-auto rounded-full bg-secondary/20 px-3 py-1 text-xs text-secondary">
                  98% match
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-left">
                {["TypeScript", "React", "Node.js", "Postgres", "AI/ML", "AWS"].map((s) => (
                  <div key={s} className="rounded-lg border border-border/50 bg-background/30 px-3 py-2 text-xs">
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <h2 className="font-display text-4xl font-bold sm:text-5xl">
            Everything you need to <span className="text-gradient">stand out</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Tools designed by developers, for developers.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="glass group rounded-2xl p-6 transition-shadow hover:shadow-elevated"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary glow">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h2 className="font-display text-4xl font-bold sm:text-5xl">Loved by developers</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex gap-0.5 text-accent">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed">"{t.quote}"</p>
              <div className="mt-5 border-t border-border/50 pt-4">
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass relative overflow-hidden rounded-3xl p-12 text-center shadow-elevated"
        >
          <div className="absolute inset-0 -z-10 bg-gradient-primary opacity-20" />
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Ready to be discovered?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Join thousands of developers building their future on SkillSphere.
          </p>
          <Link to="/signup">
            <Button size="lg" className="mt-7 bg-gradient-primary px-8 text-base glow hover:opacity-90">
              Create your portfolio
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
