import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { Blobs } from "@/components/Blobs";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 font-display text-2xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page drifted off into the void. Let's get you back.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground glow transition-transform hover:scale-105"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SkillSphere — AI Developer Portfolio & Job Matching" },
      { name: "description", content: "Build your developer portfolio and let AI match you with your dream job." },
      { property: "og:title", content: "SkillSphere — AI Developer Portfolio & Job Matching" },
      { property: "og:description", content: "Build your developer portfolio and let AI match you with your dream job." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "SkillSphere — AI Developer Portfolio & Job Matching" },
      { name: "twitter:description", content: "Build your developer portfolio and let AI match you with your dream job." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f7f4d2b5-814d-45f8-934d-417fa9c2e14c/id-preview-423d4709--885024ba-8724-4a49-9981-1d07ac42c7ae.lovable.app-1776937307697.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f7f4d2b5-814d-45f8-934d-417fa9c2e14c/id-preview-423d4709--885024ba-8724-4a49-9981-1d07ac42c7ae.lovable.app-1776937307697.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Blobs />
      <Outlet />
      <Toaster richColors theme="dark" position="top-center" />
    </AuthProvider>
  );
}
