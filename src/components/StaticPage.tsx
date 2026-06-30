import { Link } from "@tanstack/react-router";
import { useLang } from "../lib/i18n";

export function StaticPage({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  const { lang } = useLang();
  const backLabel = lang === "fr" ? "← Retour à l'app" : "← Back to app";
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">{backLabel}</Link>
        <header className="mt-6">
          <div className="text-[11px] uppercase tracking-widest text-cyan-glow">{eyebrow}</div>
          <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        </header>
        <article className="prose-static mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </article>
        <div className="mt-12 border-t border-border pt-5 text-center text-[10px] uppercase tracking-widest text-muted-foreground opacity-60">
          © Science Based Quiz
        </div>
        <div className="mt-1.5 text-center text-[9px] tracking-wide text-muted-foreground opacity-35">
          {lang === "fr" ? "Fait par Raythan" : "Made by Raythan"}
        </div>
      </div>
    </div>
  );
}
