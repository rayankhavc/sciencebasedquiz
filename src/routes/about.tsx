import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Why This Platform? — HyperSci Quiz" },
      { name: "description", content: "Our mission: debunk bro-science with rigorous, evidence-based training and nutrition data sourced from peer-reviewed research." },
      { property: "og:title", content: "Why This Platform? — HyperSci Quiz" },
      { property: "og:description", content: "Debunking bro-science with peer-reviewed evidence." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <StaticPage title="Why This Platform?" eyebrow="About">
      <p>
        The fitness world is drowning in confident opinions, broken telephone gym lore, and
        influencer hot takes recycled into "common knowledge." HyperSci Quiz exists to push back.
      </p>
      <h2>Our mission</h2>
      <p>
        Build a platform where every claim you train against is grounded in peer-reviewed research.
        We turn dense exercise-science papers into sharp, head-to-head quiz questions so lifters,
        coaches and students can sharpen real understanding — not just memorize gym slogans.
      </p>
      <h2>What makes it different</h2>
      <ul>
        <li><strong>Citations on every answer.</strong> Each question links to a PubMed entry (PMID) so you can read the source yourself.</li>
        <li><strong>Categorized difficulty.</strong> From entry-level nutrition facts to mechanotransduction and stretch-mediated hypertrophy.</li>
        <li><strong>Bots, not bro-science.</strong> Compete against bots calibrated for response speed and accuracy — no fake "live" gimmicks.</li>
      </ul>
      <h2>Who it's for</h2>
      <p>
        Advanced lifters, coaches, kinesiology students and anyone who wants to replace "I heard
        that…" with "the literature says…". If you've ever wanted a sparring partner for your own
        knowledge, this is it.
      </p>
    </StaticPage>
  );
}

export function StaticPage({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Back to app</Link>
        <header className="mt-6">
          <div className="text-[11px] uppercase tracking-widest text-cyan-glow">{eyebrow}</div>
          <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        </header>
        <article className="prose-static mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </article>
        <div className="mt-12 border-t border-border pt-5 text-center text-[10px] uppercase tracking-widest text-muted-foreground opacity-60">
          © HyperSci Quiz
        </div>
      </div>
    </div>
  );
}
