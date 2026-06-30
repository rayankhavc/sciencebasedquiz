import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LangProvider, useLang } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { ensureAnonSession, fetchTopPlayers, type LeaderboardRow } from "@/lib/leaderboard";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Science Based Quiz – Global Leaderboard" },
      { name: "description", content: "Live global leaderboard for Science Based Quiz 1v1 online matches." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  return (
    <LangProvider>
      <div className="min-h-screen text-foreground">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
          <LeaderboardTopBar />
          <LeaderboardBody />
          <LeaderboardFooter />
        </div>
      </div>
    </LangProvider>
  );
}

function LeaderboardTopBar() {
  const { t } = useLang();
  return (
    <header className="mb-6 flex items-center justify-between gap-3">
      <Link to="/" className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground neon-glow">
          <BoltIcon />
        </div>
        <div className="leading-tight">
          <div className="font-display text-sm font-bold tracking-tight">Science Based</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">QUIZ</div>
        </div>
      </Link>
      <Link to="/online" className="rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground hover:border-primary/60 hover:text-neon">
        {t("online_mode")}
      </Link>
    </header>
  );
}

function LeaderboardFooter() {
  const { t } = useLang();
  return (
    <footer className="mt-10 border-t border-border pt-5 text-xs text-muted-foreground">
      <nav className="flex items-center justify-center gap-4">
        <Link to="/legal" className="hover:text-foreground transition-colors">{t("legal")}</Link>
        <Link to="/privacy" className="hover:text-foreground transition-colors">{t("privacy")}</Link>
      </nav>
      <div className="mt-6 text-center text-[10px] uppercase tracking-widest opacity-60">{t("copyright")}</div>
    </footer>
  );
}

function LeaderboardBody() {
  const { t } = useLang();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    ensureAnonSession()
      .then((id) => { if (!cancelled) setMyId(id); })
      .catch(() => {});

    fetchTopPlayers(50)
      .then((data) => { if (!cancelled) setRows(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    const channel = supabase
      .channel("leaderboard-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "leaderboard" }, () => {
        setLive(true);
        setTimeout(() => setLive(false), 1200);
        fetchTopPlayers(50).then((data) => { if (!cancelled) setRows(data); }).catch(() => {});
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6 fade-in-up">
      <div>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-cyan-glow">
          <span className={"h-1.5 w-1.5 rounded-full bg-neon " + (live ? "animate-ping" : "opacity-60")} />
          {t("live")}
        </div>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">{t("leaderboard_title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("leaderboard_sub")}</p>
      </div>

      <section className="glass rounded-2xl p-2">
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">{t("no_data")}</div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((r, i) => {
              const total = r.wins + r.losses + r.ties;
              const winRate = total > 0 ? Math.round((r.wins / total) * 100) : 0;
              const isMe = r.player_id === myId;
              return (
                <div
                  key={r.player_id}
                  className={"flex items-center gap-3 p-3 " + (isMe ? "bg-primary/10 rounded-xl" : "")}
                >
                  <div className={
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full font-display text-xs font-bold " +
                    (i === 0 ? "bg-amber-400/20 text-amber-400" : i === 1 ? "bg-slate-300/20 text-slate-300" : i === 2 ? "bg-orange-400/20 text-orange-400" : "bg-secondary text-muted-foreground")
                  }>
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {r.username} {isMe && <span className="text-[10px] text-muted-foreground">({t("you")})</span>}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.wins}{t("wins_short")} · {r.losses}{t("losses_short")} · {r.ties}{t("ties_short")} · {winRate}% {t("win_rate")}
                    </div>
                  </div>
                  <div className="font-display text-lg font-bold text-neon shrink-0">{r.rating}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function BoltIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>;
}
