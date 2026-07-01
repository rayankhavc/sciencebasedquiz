import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLang, localizeCategory, localizeDifficulty, localizeQuestion, RAYTHAN_PORTFOLIO_URL } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { ensureAnonSession, getOrCreateProfile, recordMatchResult, type MatchOutcome } from "@/lib/leaderboard";
import { QUESTIONS, type Question } from "./index";
import type { RealtimeChannel } from "@supabase/supabase-js";

export const Route = createFileRoute("/online")({
  head: () => ({
    meta: [
      { title: "Science Based Quiz – 1v1 Online" },
      { name: "description", content: "Play 1v1 online against real players in a science-based quiz battle." },
    ],
  }),
  component: OnlinePage,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type OnlineScreen = "setup" | "lobby" | "countdown" | "arena" | "results";

type PlayerInfo = {
  playerId: string;
  playerName: string;
  isReady: boolean;
  rating: number;
};

type AnswerEvent = {
  round: number;
  playerId: string;
  correct: boolean;
};

type RoundResult = {
  question: Question;
  myAnswerIdx: number | null;
  myCorrect: boolean;
  opponentCorrect: boolean;
  iWonRound: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateFallbackId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// `.sort(() => Math.random() - 0.5)` is a well-known biased "shuffle" — it
// does not produce a uniform random permutation (Array.sort's comparator
// contract isn't meant for this, and real implementations skew certain
// elements toward certain positions). That bias is why the same handful of
// questions kept resurfacing far more often than the rest of the bank.
// Fisher-Yates below is the correct, uniformly-random shuffle.
export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickQuestions(count: number): Question[] {
  const shuffled = shuffleArray(QUESTIONS);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((q) => {
    const n = q.options.length;
    const perm = shuffleArray(Array.from({ length: n }, (_, i) => i));
    return {
      ...q,
      options: perm.map((i) => q.options[i]),
      options_fr: q.options_fr ? perm.map((i) => q.options_fr![i]) : undefined,
    };
  });
}

// ─── Root page ────────────────────────────────────────────────────────────────

function OnlinePage() {
  return (
      <div className="min-h-screen text-foreground">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
          <OnlineTopBar />
          <OnlineApp />
          <OnlineFooter />
        </div>
      </div>
  );
}

function OnlineTopBar() {
  const { lang, setLang, t } = useLang();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("hypersci-theme") : null;
    const dark = stored ? stored === "dark" : true;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { window.localStorage.setItem("hypersci-theme", next ? "dark" : "light"); } catch {}
  };

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
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-label={t("toggle_theme")}
          className="grid h-8 w-8 place-items-center rounded-full border border-border bg-secondary/60 text-foreground transition-colors hover:border-primary/60 hover:text-neon"
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
        <button
          onClick={() => setLang(lang === "en" ? "fr" : "en")}
          aria-label={t("toggle_lang")}
          className="grid h-8 min-w-[2.5rem] place-items-center rounded-full border border-border bg-secondary/60 px-2 font-display text-[11px] font-bold uppercase tracking-wider text-foreground transition-colors hover:border-primary/60 hover:text-neon"
        >
          {lang === "en" ? "FR" : "EN"}
        </button>
      </div>
    </header>
  );
}

function OnlineFooter() {
  const { t } = useLang();
  return (
    <footer className="mt-10 border-t border-border pt-5 text-xs text-muted-foreground">
      <nav className="flex items-center justify-center gap-4">
        <Link to="/legal" className="hover:text-foreground transition-colors">{t("legal")}</Link>
        <Link to="/privacy" className="hover:text-foreground transition-colors">{t("privacy")}</Link>
      </nav>
      <div className="mt-6 text-center text-[10px] uppercase tracking-widest opacity-60">{t("copyright")}</div>
      <a
        href={RAYTHAN_PORTFOLIO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 block text-center text-[9px] tracking-wide opacity-35 hover:opacity-70 transition-opacity"
      >
        {t("made_by")}
      </a>
    </footer>
  );
}

// ─── App state machine ────────────────────────────────────────────────────────
//
// One Realtime channel is shared across the whole match (lobby + arena). Every
// listener it will ever need is registered ONCE, here, before the channel is
// ever subscribed — Supabase Realtime requires .on() to be called before
// .subscribe(), otherwise events silently never reach the client. Child
// screens (Lobby/Arena) only read state lifted here; they never call
// channel.on() themselves.

function OnlineApp() {
  const [screen, setScreen] = useState<OnlineScreen>("setup");
  const [playerName, setPlayerName] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [playerId, setPlayerId] = useState<string>(() => generateFallbackId());
  const [myRating, setMyRating] = useState(1000);
  const [opponent, setOpponent] = useState<PlayerInfo | null>(null);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [answerEvent, setAnswerEvent] = useState<AnswerEvent | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [countdownSecs, setCountdownSecs] = useState(3);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const hadOpponentRef = useRef(false);
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const screenRef = useRef(screen);
  // Snapshot of the opponent's name/rating taken once the match actually
  // starts. The leaderboard write at the end of the match needs this, but by
  // then a late presence blip can leave the *live* `opponent` state null —
  // that must not silently skip recording a result (this was losing both wins
  // and losses off the leaderboard depending on which side hit the blip).
  const matchOpponentRef = useRef<{ playerName: string; rating: number } | null>(null);
  const opponentRef = useRef<PlayerInfo | null>(null);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    opponentRef.current = opponent;
  }, [opponent]);

  useEffect(() => {
    ensureAnonSession().then(setPlayerId).catch(() => {});
  }, []);

  const clearDisconnectTimer = useCallback(() => {
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }
  }, []);

  const leaveChannel = useCallback(() => {
    clearDisconnectTimer();
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, [clearDisconnectTimer]);

  useEffect(() => () => leaveChannel(), [leaveChannel]);

  const openChannel = useCallback((code: string, selfId: string): RealtimeChannel => {
    const channel = supabase.channel(`game-room:${code}`, { config: { presence: { key: selfId } } });
    channelRef.current = channel;

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PlayerInfo>();
      const others = Object.values(state).flat().filter((p) => p.playerId !== selfId);
      if (others.length > 0) {
        hadOpponentRef.current = true;
        setOpponent({ ...others[0], rating: others[0].rating ?? 1000 });
        // They're back — a pending "are they really gone" check no longer applies.
        clearDisconnectTimer();
      } else if (hadOpponentRef.current && !disconnectTimerRef.current) {
        // A track() update (e.g. readying up) or a brief mobile-network blip
        // (tab backgrounded, wifi/cellular handoff) can momentarily show an
        // empty presence diff for a still-connected player. Don't clear
        // `opponent` on the very first empty sync — keeping their last-known
        // info around means an in-flight ready/answer broadcast from them can
        // still be matched and applied during the blip. Only actually clear
        // it (together with flagging the disconnect) once a recheck a few
        // seconds later confirms they're still gone.
        disconnectTimerRef.current = setTimeout(() => {
          disconnectTimerRef.current = null;
          const latest = channel.presenceState<PlayerInfo>();
          const stillGone = Object.values(latest).flat().filter((p) => p.playerId !== selfId).length === 0;
          if (stillGone) {
            setOpponent(null);
            setOpponentLeft(true);
          }
        }, 6000);
      }
    });

    channel.on("broadcast", { event: "game_start" }, ({ payload }) => {
      // The host resends this a couple of times in case the first delivery is
      // lost — ignore it once we've already moved past the lobby so a late
      // duplicate can't yank an in-progress match back to the countdown.
      if (screenRef.current !== "lobby") return;
      const ids = payload?.questionIds as string[] | undefined;
      if (!ids) return;
      const qs = ids.map((id) => QUESTIONS.find((q) => q.id === id)).filter(Boolean) as Question[];
      if (qs.length > 0) {
        if (opponentRef.current) {
          matchOpponentRef.current = { playerName: opponentRef.current.playerName, rating: opponentRef.current.rating };
        }
        setQuestions(qs);
        setScreen("countdown");
      }
    });

    channel.on("broadcast", { event: "player_answer" }, ({ payload }) => {
      setAnswerEvent(payload as AnswerEvent);
    });

    // Presence "sync" already reflects isReady once it fires, but ready-up is a
    // one-shot signal we don't want to depend on presence-diff timing for — a
    // broadcast is a simpler, more direct guarantee that the other player's
    // screen flips to "ready" immediately.
    channel.on("broadcast", { event: "player_ready" }, ({ payload }) => {
      const readyId = payload?.playerId as string | undefined;
      if (!readyId || readyId === selfId) return;
      setOpponent((prev) => (prev && prev.playerId === readyId ? { ...prev, isReady: true } : prev));
    });

    return channel;
  }, [clearDisconnectTimer]);

  const handleLobbyCountdown = useCallback((qs: Question[]) => {
    if (opponentRef.current) {
      matchOpponentRef.current = { playerName: opponentRef.current.playerName, rating: opponentRef.current.rating };
    }
    setQuestions(qs);
    setScreen("countdown");
  }, []);

  if (screen === "setup") {
    return (
      <SetupScreen
        playerName={playerName}
        setPlayerName={setPlayerName}
        playerId={playerId}
        channelRef={channelRef}
        openChannel={openChannel}
        onProfileReady={(rating) => setMyRating(rating)}
        onRoomCreated={(code) => {
          setRoomCode(code);
          setIsHost(true);
          setScreen("lobby");
        }}
        onRoomJoined={(code) => {
          setRoomCode(code);
          setIsHost(false);
          setScreen("lobby");
        }}
      />
    );
  }

  if (screen === "lobby") {
    return (
      <LobbyScreen
        roomCode={roomCode}
        playerId={playerId}
        playerName={playerName}
        myRating={myRating}
        isHost={isHost}
        channelRef={channelRef}
        opponent={opponent}
        onCountdown={handleLobbyCountdown}
        onBack={() => {
          leaveChannel();
          setScreen("setup");
        }}
      />
    );
  }

  if (screen === "countdown") {
    return (
      <CountdownScreen
        seconds={countdownSecs}
        setSeconds={setCountdownSecs}
        onDone={() => {
          setCountdownSecs(3);
          setScreen("arena");
        }}
      />
    );
  }

  if (screen === "arena") {
    return (
      <ArenaScreen
        questions={questions}
        playerId={playerId}
        playerName={playerName}
        opponent={opponent}
        opponentLeft={opponentLeft}
        answerEvent={answerEvent}
        channelRef={channelRef}
        onFinish={(results) => {
          setRoundResults(results);
          leaveChannel();
          setScreen("results");
        }}
        onDisconnect={() => {
          leaveChannel();
          setScreen("setup");
        }}
      />
    );
  }

  return (
    <ResultsScreen
      roundResults={roundResults}
      playerId={playerId}
      playerName={playerName}
      myRating={myRating}
      opponent={opponent ?? (matchOpponentRef.current ? { ...matchOpponentRef.current, playerId: "", isReady: true } : null)}
      onPlayAgain={() => {
        setRoundResults([]);
        setOpponent(null);
        setOpponentLeft(false);
        setAnswerEvent(null);
        hadOpponentRef.current = false;
        matchOpponentRef.current = null;
        clearDisconnectTimer();
        setScreen("setup");
      }}
      onHome={() => {}}
    />
  );
}

// ─── Setup screen ─────────────────────────────────────────────────────────────

function SetupScreen({
  playerName,
  setPlayerName,
  playerId,
  channelRef,
  openChannel,
  onProfileReady,
  onRoomCreated,
  onRoomJoined,
}: {
  playerName: string;
  setPlayerName: (v: string) => void;
  playerId: string;
  channelRef: React.MutableRefObject<RealtimeChannel | null>;
  openChannel: (code: string, selfId: string) => RealtimeChannel;
  onProfileReady: (rating: number) => void;
  onRoomCreated: (code: string) => void;
  onRoomJoined: (code: string) => void;
}) {
  const { t } = useLang();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState("");
  const valid = playerName.trim().length >= 2;

  const resolveProfile = async (): Promise<{ id: string; rating: number }> => {
    try {
      const profile = await getOrCreateProfile(playerName.trim());
      onProfileReady(profile.rating);
      return { id: profile.player_id, rating: profile.rating };
    } catch (err) {
      // Leaderboard unavailable (e.g. Supabase not configured, RLS rejecting
      // the write) — the match still plays fine locally, but this player's
      // result will never reach the leaderboard. Log loudly so it's visible
      // in the browser console instead of silently vanishing.
      console.error("[online] could not create/load leaderboard profile, playing unranked:", err);
      onProfileReady(1000);
      return { id: playerId, rating: 1000 };
    }
  };

  const handleCreate = async () => {
    if (!valid || loading !== null) return;
    setLoading("create");
    setError("");
    try {
      const profile = await resolveProfile();
      const code = generateRoomCode();
      const channel = openChannel(code, profile.id);
      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          try {
            await channel.track({ playerId: profile.id, playerName: playerName.trim(), isReady: false, rating: profile.rating });
          } catch {}
        }
      });
      onRoomCreated(code);
    } catch {
      setError(t("room_not_found"));
    } finally {
      setLoading(null);
    }
  };

  const handleJoin = async () => {
    if (!valid || joinCode.trim().length !== 4 || loading !== null) return;
    setLoading("join");
    setError("");
    try {
      const code = joinCode.trim().toUpperCase();
      const profile = await resolveProfile();
      const channel = openChannel(code, profile.id);

      let resolved = false;
      const timeout = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        setError(t("room_not_found"));
        setLoading(null);
        supabase.removeChannel(channel);
        channelRef.current = null;
      }, 6000);

      // Room-existence check, registered before subscribe alongside openChannel's own listeners.
      channel.on("presence", { event: "sync" }, () => {
        if (resolved) return;
        const state = channel.presenceState<PlayerInfo>();
        const others = Object.values(state).flat().filter((p) => p.playerId !== profile.id);
        if (others.length > 0) {
          resolved = true;
          clearTimeout(timeout);
          channel.track({ playerId: profile.id, playerName: playerName.trim(), isReady: false, rating: profile.rating });
          onRoomJoined(code);
          setLoading(null);
        }
      });

      channel.subscribe();
    } catch {
      setError(t("room_not_found"));
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 fade-in-up">
      <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">{t("back")}</Link>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-cyan-glow">{t("online_mode")}</div>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">{t("enter_username_online")}</h2>
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        <input
          autoFocus
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder={t("username_placeholder")}
          className="w-full rounded-xl border border-border bg-secondary/60 px-4 py-3 text-base font-medium outline-none focus:border-primary"
          maxLength={24}
        />

        <div className="grid gap-3">
          <button
            onClick={handleCreate}
            disabled={!valid || loading !== null}
            className="w-full rounded-xl bg-primary px-4 py-3 font-display font-bold text-primary-foreground neon-glow disabled:opacity-40"
          >
            {loading === "create" ? t("creating_room") : t("create_room")}
          </button>

          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
              placeholder={t("room_code_placeholder")}
              className="flex-1 rounded-xl border border-border bg-secondary/60 px-4 py-3 text-base font-medium uppercase tracking-widest outline-none focus:border-accent"
              maxLength={4}
              onKeyDown={(e) => { if (e.key === "Enter" && valid && joinCode.length === 4) handleJoin(); }}
            />
            <button
              onClick={handleJoin}
              disabled={!valid || joinCode.trim().length !== 4 || loading !== null}
              className="rounded-xl border border-accent/50 bg-accent/15 px-4 py-3 font-display font-bold text-cyan-glow disabled:opacity-40"
            >
              {loading === "join" ? t("joining_room") : t("join")}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-destructive/15 border border-destructive/40 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Lobby screen ─────────────────────────────────────────────────────────────

function LobbyScreen({
  roomCode,
  playerId,
  playerName,
  myRating,
  isHost,
  channelRef,
  opponent,
  onCountdown,
  onBack,
}: {
  roomCode: string;
  playerId: string;
  playerName: string;
  myRating: number;
  isHost: boolean;
  channelRef: React.MutableRefObject<RealtimeChannel | null>;
  opponent: PlayerInfo | null;
  onCountdown: (qs: Question[]) => void;
  onBack: () => void;
}) {
  const { t } = useLang();
  const [iAmReady, setIAmReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const opponentReady = opponent?.isReady ?? false;
  const gameStartedRef = useRef(false);

  const startGame = useCallback((channel: RealtimeChannel) => {
    if (gameStartedRef.current) return;
    gameStartedRef.current = true;
    const qs = pickQuestions(5);
    const questionIds = qs.map((q) => q.id);
    // Broadcast has no delivery guarantee and no ack — resend a couple of
    // times over the next ~2.5s so a single lost packet (flaky mobile
    // connection) doesn't strand the other player in the lobby forever.
    // Harmless if all three arrive: the receiving side ignores it once past
    // the lobby (see the game_start listener in openChannel).
    [0, 800, 2000].forEach((delay) => {
      setTimeout(() => {
        try { channel.send({ type: "broadcast", event: "game_start", payload: { questionIds } }); } catch {}
      }, delay);
    });
    onCountdown(qs);
  }, [onCountdown]);

  const handleReady = async () => {
    const channel = channelRef.current;
    if (!channel) return;
    setIAmReady(true);
    try {
      await channel.track({ playerId, playerName, isReady: true, rating: myRating });
    } catch {}
    // Broadcast is a direct, immediate signal — doesn't depend on presence-diff
    // timing the way relying solely on track() + "sync" would. Resent a couple
    // of times in case the first one is dropped; applying "isReady: true"
    // twice is harmless.
    [0, 800, 2000].forEach((delay) => {
      setTimeout(() => {
        try { channel.send({ type: "broadcast", event: "player_ready", payload: { playerId } }); } catch {}
      }, delay);
    });

    if (isHost && opponentReady) {
      startGame(channel);
    }
  };

  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || !isHost || !iAmReady || !opponentReady) return;
    startGame(channel);
  }, [isHost, iAmReady, opponentReady, channelRef, startGame]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-6 fade-in-up">
      <button onClick={onBack} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">{t("back")}</button>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-cyan-glow">{t("online_mode")}</div>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">{t("lobby_title")}</h2>
      </div>

      <div className="glass rounded-2xl p-5 space-y-2">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{t("your_room_code")}</div>
        <div className="flex items-center gap-3">
          <div className="font-display text-4xl font-bold tracking-[0.25em] text-neon">{roomCode}</div>
          <button
            onClick={copyCode}
            className="rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold hover:border-primary/60"
          >
            {copied ? t("copied") : "Copy"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{t("share_code")}</p>
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        <PlayerRow name={playerName} ready={iAmReady} isYou />
        {opponent ? (
          <PlayerRow name={opponent.playerName} ready={opponentReady} />
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-4">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary/60 text-muted-foreground">?</div>
            <div className="text-sm text-muted-foreground animate-pulse">{t("waiting_opponent")}</div>
          </div>
        )}
      </div>

      {opponent && !iAmReady && (
        <button
          onClick={handleReady}
          className="w-full rounded-2xl bg-primary px-6 py-5 font-display text-lg font-bold text-primary-foreground neon-glow transition-transform hover:scale-[1.02]"
        >
          {t("ready_up")}
        </button>
      )}

      {iAmReady && (
        <div className="text-center text-sm text-muted-foreground animate-pulse">{t("waiting_ready")}</div>
      )}
    </div>
  );
}

function PlayerRow({ name, ready, isYou }: { name: string; ready: boolean; isYou?: boolean }) {
  const { t } = useLang();
  return (
    <div className="flex items-center gap-3 rounded-xl bg-secondary/40 p-3">
      <div className={"grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-sm font-bold " + (isYou ? "bg-primary/20 text-neon" : "bg-accent/20 text-cyan-glow")}>
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-sm">{name} {isYou && <span className="text-[10px] text-muted-foreground">({t("you")})</span>}</div>
      </div>
      <div className={ready ? "text-xs font-bold text-neon" : "text-xs text-muted-foreground"}>
        {ready ? "✓ Ready" : "…"}
      </div>
    </div>
  );
}

// ─── Countdown screen ─────────────────────────────────────────────────────────

function CountdownScreen({ seconds, setSeconds, onDone }: { seconds: number; setSeconds: (n: number) => void; onDone: () => void }) {
  const { t } = useLang();
  useEffect(() => {
    if (seconds <= 0) { onDone(); return; }
    const tid = setTimeout(() => setSeconds(seconds - 1), 1000);
    return () => clearTimeout(tid);
  }, [seconds, setSeconds, onDone]);

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-20 fade-in-up">
      <div className="text-[11px] uppercase tracking-widest text-cyan-glow">{t("starting_in")}</div>
      <div className="font-display text-8xl font-bold text-neon count-pop" key={seconds}>{seconds}</div>
      <div className="text-sm text-muted-foreground">{t("first_correct_wins")}</div>
    </div>
  );
}

// ─── Arena screen ─────────────────────────────────────────────────────────────

const ROUND_DURATION = 20;
const TOTAL_ROUNDS = 5;

function ArenaScreen({
  questions,
  playerId,
  playerName,
  opponent,
  opponentLeft,
  answerEvent,
  channelRef,
  onFinish,
  onDisconnect,
}: {
  questions: Question[];
  playerId: string;
  playerName: string;
  opponent: PlayerInfo | null;
  opponentLeft: boolean;
  answerEvent: AnswerEvent | null;
  channelRef: React.MutableRefObject<RealtimeChannel | null>;
  onFinish: (results: RoundResult[]) => void;
  onDisconnect: () => void;
}) {
  const { lang, t } = useLang();
  const [round, setRound] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [opponentAnswered, setOpponentAnswered] = useState(false);
  const [opponentCorrect, setOpponentCorrect] = useState(false);
  const [roundWinner, setRoundWinner] = useState<"me" | "opponent" | "tie" | null>(null);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const firstCorrectRef = useRef<string | null>(null);
  const resolvedRef = useRef(false);
  const roundDeadlineRef = useRef(Date.now() + ROUND_DURATION * 1000);

  const q = questions[round];
  const loc = localizeQuestion(q, lang);
  const locQ = { ...q, ...loc };
  const correctIndex = locQ.options.indexOf(locQ.correct_answer);

  const resolveRound = useCallback((myC: boolean, oppC: boolean, winnerPlayerId: string | null) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    const iWon = winnerPlayerId === playerId;
    if (iWon) setMyScore((s) => s + 1);
    else if (winnerPlayerId !== null) setOpponentScore((s) => s + 1);
    setRoundWinner(winnerPlayerId === null ? "tie" : iWon ? "me" : "opponent");
    setRoundResults((prev) => [
      ...prev,
      {
        question: q,
        myAnswerIdx: null,
        myCorrect: myC,
        opponentCorrect: oppC,
        iWonRound: iWon,
      },
    ]);
  }, [playerId, q]);

  // Reset the round clock whenever a new round starts. Using a wall-clock
  // deadline (rather than decrementing a counter every 1s) means a tab that
  // gets backgrounded/throttled (very common switching between two phones,
  // or phone + desktop, mid-test) self-corrects on the next tick instead of
  // the displayed timer just freezing while time keeps passing underneath.
  useEffect(() => {
    roundDeadlineRef.current = Date.now() + ROUND_DURATION * 1000;
    resolvedRef.current = false;
  }, [round]);

  // Timer
  useEffect(() => {
    if (selected !== null || roundWinner !== null) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((roundDeadlineRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0 && firstCorrectRef.current === null) {
        resolveRound(false, opponentCorrect, null);
      }
    };
    tick();
    const tid = setInterval(tick, 1000);
    return () => clearInterval(tid);
  }, [round, selected, roundWinner, resolveRound, opponentCorrect]);

  // React to the opponent's broadcasted answer (event is owned/subscribed at the OnlineApp level).
  useEffect(() => {
    if (!answerEvent) return;
    if (answerEvent.playerId === playerId || answerEvent.round !== round) return;
    setOpponentAnswered(true);
    setOpponentCorrect(answerEvent.correct);
    if (answerEvent.correct && firstCorrectRef.current === null) {
      firstCorrectRef.current = answerEvent.playerId;
      resolveRound(selected !== null && selected === correctIndex, true, answerEvent.playerId);
    } else if (!answerEvent.correct && selected !== null && selected !== correctIndex) {
      // I'd already answered wrong, and now so did they — both are done for
      // this round with nobody correct. The timer effect stops ticking once
      // `selected` is set, so nothing else will ever resolve this: do it now
      // instead of leaving the round stuck waiting for a timeout that can't fire.
      resolveRound(false, false, null);
    }
  }, [answerEvent, playerId, round, selected, correctIndex, resolveRound]);

  // React to opponent disconnect (presence "leave" tracked at the OnlineApp level).
  useEffect(() => {
    if (opponentLeft && roundWinner === null) {
      onDisconnect();
    }
  }, [opponentLeft, roundWinner, onDisconnect]);

  const handleAnswer = (i: number) => {
    if (selected !== null || roundWinner !== null) return;
    setSelected(i);
    const correct = i === correctIndex;
    const channel = channelRef.current;
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "player_answer",
        payload: { playerId, round, correct },
      });
    }
    if (correct && firstCorrectRef.current === null) {
      firstCorrectRef.current = playerId;
      resolveRound(true, opponentCorrect, playerId);
    } else if (!correct && opponentAnswered && !opponentCorrect) {
      // They'd already answered wrong, and now so did I — both done, nobody
      // correct. Resolve now rather than relying on the timer, which stops
      // ticking as soon as `selected` is set on either side.
      resolveRound(false, false, null);
    }
  };

  const nextRound = () => {
    if (round + 1 >= TOTAL_ROUNDS) {
      onFinish(roundResults);
      return;
    }
    setRound((r) => r + 1);
    setSelected(null);
    setOpponentAnswered(false);
    setOpponentCorrect(false);
    setRoundWinner(null);
    setTimeLeft(ROUND_DURATION);
    firstCorrectRef.current = null;
  };

  const timerCritical = timeLeft <= 5;

  return (
    <div className="space-y-5 fade-in-up">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="uppercase tracking-widest">{t("online_mode")}</div>
        <div className="uppercase tracking-widest">
          {t("round_of")} <span className="text-foreground">{round + 1}</span>/{TOTAL_ROUNDS}
        </div>
      </div>

      <section className="glass rounded-2xl p-4 space-y-3">
        <ScoreRow label={playerName} score={myScore} accent="primary" isYou />
        <ScoreRow label={opponent?.playerName ?? t("opponent")} score={opponentScore} accent="cyan"
          indicator={opponentAnswered ? "answered" : "thinking"} />
      </section>

      <div className="flex justify-center">
        <TimerRing seconds={timeLeft} total={ROUND_DURATION} critical={timerCritical} />
      </div>

      <section className="glass rounded-2xl p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge>{localizeDifficulty(q.difficulty, lang)}</Badge>
          <Badge variant="cyan">{localizeCategory(q.category, lang)}</Badge>
        </div>
        <h3 className="text-xl font-semibold leading-snug sm:text-2xl">{locQ.question}</h3>
      </section>

      <section className="grid gap-2.5">
        {locQ.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === correctIndex;
          const revealed = roundWinner !== null;
          let cls = "glass hover:border-primary/60";
          if (revealed && isCorrect) cls = "border-2 border-primary bg-primary/15 text-foreground neon-glow";
          else if (revealed && isSelected && !isCorrect) cls = "border-2 border-destructive bg-destructive/15 text-foreground";
          else if (revealed) cls = "glass opacity-50";
          else if (isSelected) cls = "border-2 border-accent bg-accent/10 text-foreground";
          return (
            <button
              key={i}
              disabled={selected !== null || revealed}
              onClick={() => handleAnswer(i)}
              className={"w-full rounded-2xl p-4 text-left text-sm font-medium transition-all " + cls}
            >
              {opt}
            </button>
          );
        })}
      </section>

      {roundWinner !== null && (
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className={
            "text-center font-display text-lg font-bold " +
            (roundWinner === "me" ? "text-neon" : roundWinner === "opponent" ? "text-destructive" : "text-muted-foreground")
          }>
            {roundWinner === "me" ? t("you_won_round") : roundWinner === "opponent" ? t("opponent_won_round") : t("tie_round")}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{locQ.explanation}</p>
          <button
            onClick={nextRound}
            className="w-full rounded-xl bg-primary px-4 py-3 font-display font-bold text-primary-foreground neon-glow"
          >
            {round + 1 >= TOTAL_ROUNDS ? t("see_results") : t("next_question")}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Results screen ───────────────────────────────────────────────────────────

function ResultsScreen({
  roundResults,
  playerId,
  playerName,
  myRating,
  opponent,
  onPlayAgain,
  onHome,
}: {
  roundResults: RoundResult[];
  playerId: string;
  playerName: string;
  myRating: number;
  opponent: PlayerInfo | null;
  onPlayAgain: () => void;
  onHome: () => void;
}) {
  const { t, lang } = useLang();
  const myScore = roundResults.filter((r) => r.iWonRound).length;
  const oppScore = roundResults.filter((r) => !r.iWonRound && r.opponentCorrect).length;
  const won = myScore > oppScore;
  const tie = myScore === oppScore;
  const [shared, setShared] = useState(false);
  const [ratingDelta, setRatingDelta] = useState<number | null>(null);

  useEffect(() => {
    if (!opponent) return;
    const outcome: MatchOutcome = tie ? 0.5 : won ? 1 : 0;
    recordMatchResult(playerId, myRating, opponent.rating, outcome)
      .then((newRating) => setRatingDelta(newRating - myRating))
      .catch((err) => console.error("[online] recordMatchResult failed, leaderboard not updated:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareText = lang === "fr"
    ? `J'ai gagné ${myScore}-${oppScore} contre ${opponent?.playerName ?? "mon adversaire"} sur Science Based Quiz !`
    : `I won ${myScore}-${oppScore} vs ${opponent?.playerName ?? "my opponent"} on Science Based Quiz!`;

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ title: "Science Based Quiz", text: shareText, url });
        return;
      }
    } catch {}
    try {
      await navigator.clipboard.writeText(`${shareText} ${url}`.trim());
      setShared(true);
      setTimeout(() => setShared(false), 2200);
    } catch {}
  };

  return (
    <div className="space-y-6 fade-in-up">
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{t("match_result")}</div>
        <h2
          className={"mt-2 font-display text-5xl font-bold tracking-tight sm:text-6xl count-pop " + (won ? "text-neon" : tie ? "text-cyan-glow" : "text-danger")}
          style={!won && !tie ? { color: "var(--danger)", textShadow: "0 0 18px color-mix(in oklab, var(--danger) 60%, transparent)" } : {}}
        >
          {tie ? t("online_tie") : won ? t("online_victory") : t("online_defeat")}
        </h2>
      </div>

      <section className="glass rounded-2xl p-6">
        <div className="text-center text-xs text-muted-foreground mb-3">{t("final_score")}</div>
        <div className="grid grid-cols-3 items-center gap-3">
          <div className="text-center">
            <div className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">{playerName}</div>
            <div className="mt-1 font-display text-5xl font-bold text-neon">{myScore}</div>
          </div>
          <div className="text-center font-display text-xl text-muted-foreground">VS</div>
          <div className="text-center">
            <div className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">{opponent?.playerName ?? t("opponent")}</div>
            <div className="mt-1 font-display text-5xl font-bold text-cyan-glow">{oppScore}</div>
          </div>
        </div>
        {ratingDelta !== null && (
          <div className="mt-4 text-center text-sm font-semibold">
            {t("new_rating")}: <span className={ratingDelta >= 0 ? "text-neon" : "text-destructive"}>
              {myRating + ratingDelta} ({ratingDelta >= 0 ? "+" : ""}{ratingDelta})
            </span>
          </div>
        )}
      </section>

      <Link
        to="/leaderboard"
        className="block rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-center text-sm font-semibold text-cyan-glow"
      >
        {t("view_leaderboard")}
      </Link>

      <div className="grid gap-2.5">
        <button onClick={onPlayAgain} className="rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground neon-glow">
          {t("play_again_online")}
        </button>
        <button onClick={handleShare} className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-neon">
          {shared ? `✓ ${t("share_copied")}` : `↗ ${t("share")}`}
        </button>
        <Link to="/" className="block rounded-xl bg-secondary px-4 py-3 text-center text-sm font-semibold text-foreground">
          {t("back_dashboard")}
        </Link>
      </div>
    </div>
  );
}

// ─── Shared UI components ────────────────────────────────────────────────────

function ScoreRow({ label, score, accent, isYou, indicator }: {
  label: string;
  score: number;
  accent: "primary" | "cyan";
  isYou?: boolean;
  indicator?: "thinking" | "answered";
}) {
  const { t } = useLang();
  return (
    <div className="flex items-center gap-3">
      <div className={"min-w-[2.5rem] font-display text-2xl font-bold " + (accent === "primary" ? "text-neon" : "text-cyan-glow")}>
        {score}
      </div>
      <div className="flex-1 text-sm font-medium truncate">
        {label} {isYou && <span className="text-[10px] text-muted-foreground">({t("you")})</span>}
      </div>
      {indicator && (
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {indicator === "thinking" ? t("thinking") : t("answered")}
        </div>
      )}
    </div>
  );
}

function TimerRing({ seconds, total, critical }: { seconds: number; total: number; critical: boolean }) {
  const { t } = useLang();
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const dash = circ * (seconds / total);
  const color = critical ? "var(--danger)" : "var(--neon)";
  return (
    <div className={"relative grid h-24 w-24 place-items-center " + (critical ? "pulse-ring rounded-full" : "")}>
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={radius} stroke="var(--border)" strokeWidth="6" fill="none" />
        <circle cx="48" cy="48" r={radius} stroke={color} strokeWidth="6" fill="none"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.9s linear, stroke 0.3s" }} />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-2xl font-bold" style={{ color: critical ? "var(--danger)" : "var(--neon)" }}>{seconds}</div>
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{t("seconds_label")}</div>
      </div>
    </div>
  );
}

function Badge({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "cyan" }) {
  return (
    <span className={"rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest " + (variant === "primary" ? "bg-primary/15 text-neon" : "bg-accent/15 text-cyan-glow")}>
      {children}
    </span>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function BoltIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>;
}
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
