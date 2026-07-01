import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLang, localizeCategory, localizeDifficulty, localizeQuestion, RAYTHAN_PORTFOLIO_URL } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { ensureAnonSession } from "@/lib/leaderboard";
import { pickQuestions } from "./online";
import { QUESTIONS, type Question } from "./index";
import type { RealtimeChannel } from "@supabase/supabase-js";

export const Route = createFileRoute("/party")({
  head: () => ({
    meta: [
      { title: "Science Based Quiz – Party Mode" },
      { name: "description", content: "Free-for-all quiz battle for 3-4 players with custom room settings." },
    ],
  }),
  component: PartyPage,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type PartyScreen = "setup" | "lobby" | "countdown" | "arena" | "results";

type RosterEntry = {
  playerId: string;
  playerName: string;
  isReady: boolean;
  isHost: boolean;
};

type RoomConfig = {
  maxPlayers: number;
  questionCount: number;
  roundDuration: number;
  hostId: string;
};

type PartyPlayer = {
  playerId: string;
  playerName: string;
  isHost: boolean;
  score: number;
  answered: boolean;
  correct: boolean;
  disconnected: boolean;
};

type AnswerEvent = { playerId: string; round: number; correct: boolean };

const MAX_PLAYERS_OPTIONS = [2, 3, 4] as const;
const QUESTION_COUNT_OPTIONS = [10, 15, 20] as const;
const ROUND_DURATION_OPTIONS = [10, 15, 20, 30] as const;

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function generateFallbackId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ─── Root page ────────────────────────────────────────────────────────────────

function PartyPage() {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        <PartyTopBar />
        <PartyApp />
        <PartyFooter />
      </div>
    </div>
  );
}

function PartyTopBar() {
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
        <button onClick={toggleTheme} aria-label={t("toggle_theme")} className="grid h-8 w-8 place-items-center rounded-full border border-border bg-secondary/60 text-foreground transition-colors hover:border-primary/60 hover:text-neon">
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
        <button onClick={() => setLang(lang === "en" ? "fr" : "en")} aria-label={t("toggle_lang")} className="grid h-8 min-w-[2.5rem] place-items-center rounded-full border border-border bg-secondary/60 px-2 font-display text-[11px] font-bold uppercase tracking-wider text-foreground transition-colors hover:border-primary/60 hover:text-neon">
          {lang === "en" ? "FR" : "EN"}
        </button>
      </div>
    </header>
  );
}

function PartyFooter() {
  const { t } = useLang();
  return (
    <footer className="mt-10 border-t border-border pt-5 text-xs text-muted-foreground">
      <nav className="flex items-center justify-center gap-4">
        <Link to="/legal" className="hover:text-foreground transition-colors">{t("legal")}</Link>
        <Link to="/privacy" className="hover:text-foreground transition-colors">{t("privacy")}</Link>
      </nav>
      <div className="mt-6 text-center text-[10px] uppercase tracking-widest opacity-60">{t("copyright")}</div>
      <a href={RAYTHAN_PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" className="mt-1.5 block text-center text-[9px] tracking-wide opacity-35 hover:opacity-70 transition-opacity">
        {t("made_by")}
      </a>
    </footer>
  );
}

// ─── App state machine ────────────────────────────────────────────────────────
//
// Same principles as the 1v1 online mode: one Realtime channel per room,
// every listener registered before .subscribe(), critical one-shot signals
// (ready, config, game start) sent via broadcast with a couple of resends,
// a wall-clock round timer, and a grace period before treating a presence
// gap as a real disconnect.

function PartyApp() {
  const [screen, setScreen] = useState<PartyScreen>("setup");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [playerId, setPlayerId] = useState<string>(() => generateFallbackId());
  const [isHost, setIsHost] = useState(false);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [countdownSecs, setCountdownSecs] = useState(3);
  const [finalPlayers, setFinalPlayers] = useState<PartyPlayer[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const screenRef = useRef(screen);
  const matchSnapshotRef = useRef<RosterEntry[]>([]);

  useEffect(() => { screenRef.current = screen; }, [screen]);

  useEffect(() => {
    ensureAnonSession().then(setPlayerId).catch(() => {});
  }, []);

  const leaveChannel = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => () => leaveChannel(), [leaveChannel]);

  const openChannel = useCallback((code: string, selfId: string, selfName: string, hosting: boolean, config: RoomConfig | null): RealtimeChannel => {
    const channel = supabase.channel(`party-room:${code}`, { config: { presence: { key: selfId } } });
    channelRef.current = channel;

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<RosterEntry>();
      const all = Object.values(state).flat();
      // Defensive dedupe by the player's own declared id, not just the
      // presence key: a stale tab from before a refresh/reconnect can
      // briefly linger under a different key while Realtime notices it's
      // gone, which would otherwise double-count the same real person.
      const byId = new Map<string, RosterEntry>();
      for (const p of all) byId.set(p.playerId, p);
      setRoster(Array.from(byId.values()));
    });

    channel.on("broadcast", { event: "player_ready" }, ({ payload }) => {
      const readyId = payload?.playerId as string | undefined;
      if (!readyId) return;
      setRoster((prev) => prev.map((p) => (p.playerId === readyId ? { ...p, isReady: true } : p)));
    });

    channel.on("broadcast", { event: "request_config" }, () => {
      if (hosting && config) {
        try {
          channel.send({ type: "broadcast", event: "room_config", payload: config });
        } catch {}
      }
    });

    channel.on("broadcast", { event: "room_config" }, ({ payload }) => {
      setRoomConfig(payload as RoomConfig);
    });

    channel.on("broadcast", { event: "game_start" }, ({ payload }) => {
      if (screenRef.current !== "lobby") return;
      const ids = payload?.questionIds as string[] | undefined;
      if (!ids) return;
      const qs = ids.map((id) => QUESTIONS.find((q) => q.id === id)).filter(Boolean) as Question[];
      if (qs.length > 0) {
        matchSnapshotRef.current = payload?.roster as RosterEntry[] ?? [];
        setQuestions(qs);
        setScreen("countdown");
      }
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        try {
          await channel.track({ playerId: selfId, playerName: selfName, isReady: false, isHost: hosting });
        } catch {}
        if (!hosting) {
          // Ask the host to (re)send the room settings now that we've joined.
          [0, 600, 1500].forEach((delay) => {
            setTimeout(() => {
              try { channel.send({ type: "broadcast", event: "request_config", payload: {} }); } catch {}
            }, delay);
          });
        }
      }
    });

    return channel;
  }, []);

  if (screen === "setup") {
    return (
      <SetupScreen
        playerName={playerName}
        setPlayerName={setPlayerName}
        playerId={playerId}
        onCreate={async (code, config) => {
          // Resolve the real (stable) anonymous-auth id before ever opening
          // the channel — the presence key is fixed at channel-creation time,
          // so if we opened it with the random fallback id and only found
          // out the real id afterwards, this player's own roster row would
          // keep the fallback id forever while `playerId` state moved on,
          // breaking "is this me" checks and the ready-up name lookup.
          const id = await ensureAnonSession().catch(() => playerId);
          setPlayerId(id);
          openChannel(code, id, playerName.trim(), true, config);
          setRoomCode(code);
          setIsHost(true);
          setRoomConfig(config);
          setScreen("lobby");
        }}
        onJoin={async (code) => {
          const id = await ensureAnonSession().catch(() => playerId);
          setPlayerId(id);
          openChannel(code, id, playerName.trim(), false, null);
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
        isHost={isHost}
        roster={roster}
        roomConfig={roomConfig}
        channelRef={channelRef}
        onBack={() => { leaveChannel(); setScreen("setup"); }}
        onStart={(qs, fullRoster) => {
          matchSnapshotRef.current = fullRoster;
          setQuestions(qs);
          setScreen("countdown");
        }}
      />
    );
  }

  if (screen === "countdown") {
    return (
      <CountdownScreen
        seconds={countdownSecs}
        setSeconds={setCountdownSecs}
        onDone={() => { setCountdownSecs(3); setScreen("arena"); }}
      />
    );
  }

  if (screen === "arena") {
    return (
      <ArenaScreen
        questions={questions}
        playerId={playerId}
        matchRoster={matchSnapshotRef.current}
        roundDuration={roomConfig?.roundDuration ?? 20}
        channelRef={channelRef}
        onFinish={(players) => {
          setFinalPlayers(players);
          leaveChannel();
          setScreen("results");
        }}
      />
    );
  }

  return (
    <ResultsScreen
      players={finalPlayers}
      playerId={playerId}
      onPlayAgain={() => {
        setRoster([]);
        setRoomConfig(null);
        matchSnapshotRef.current = [];
        setScreen("setup");
      }}
    />
  );
}

// ─── Setup screen ─────────────────────────────────────────────────────────────

function SetupScreen({
  playerName,
  setPlayerName,
  playerId,
  onCreate,
  onJoin,
}: {
  playerName: string;
  setPlayerName: (v: string) => void;
  playerId: string;
  onCreate: (code: string, config: RoomConfig) => void;
  onJoin: (code: string) => void;
}) {
  const { t } = useLang();
  const [joinCode, setJoinCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [roundDuration, setRoundDuration] = useState<number>(20);
  const [loading, setLoading] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState("");
  const valid = playerName.trim().length >= 2;

  const handleCreate = () => {
    if (!valid || loading !== null) return;
    setLoading("create");
    const code = generateRoomCode();
    onCreate(code, { maxPlayers, questionCount, roundDuration, hostId: playerId });
  };

  const handleJoin = () => {
    if (!valid || joinCode.trim().length !== 4 || loading !== null) return;
    setLoading("join");
    setError("");
    onJoin(joinCode.trim().toUpperCase());
  };

  return (
    <div className="space-y-6 fade-in-up">
      <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">{t("back")}</Link>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-cyan-glow">{t("party_mode")}</div>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">{t("party_setup_title")}</h2>
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

        {error && (
          <div className="rounded-xl bg-destructive/15 border border-destructive/40 px-4 py-3 text-sm text-destructive">{error}</div>
        )}
      </div>

      <section className="glass rounded-2xl p-5 space-y-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground">{t("num_players_label")}</h3>
        <div className="flex flex-wrap gap-2">
          {MAX_PLAYERS_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setMaxPlayers(n)}
              className={"rounded-full px-4 py-2 text-xs font-semibold transition-all " + (maxPlayers === n ? "border border-accent bg-accent/15 text-cyan-glow" : "border border-border bg-secondary/60 text-muted-foreground hover:text-foreground")}
            >
              {n} {t("players_label")}
            </button>
          ))}
        </div>

        <h3 className="text-xs uppercase tracking-widest text-muted-foreground">{t("question_count_label")}</h3>
        <div className="flex flex-wrap gap-2">
          {QUESTION_COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setQuestionCount(n)}
              className={"rounded-full px-4 py-2 text-xs font-semibold transition-all " + (questionCount === n ? "border border-accent bg-accent/15 text-cyan-glow" : "border border-border bg-secondary/60 text-muted-foreground hover:text-foreground")}
            >
              {n} {t("questions_label")}
            </button>
          ))}
        </div>

        <h3 className="text-xs uppercase tracking-widest text-muted-foreground">{t("round_duration_label")}</h3>
        <div className="flex flex-wrap gap-2">
          {ROUND_DURATION_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setRoundDuration(n)}
              className={"rounded-full px-4 py-2 text-xs font-semibold transition-all " + (roundDuration === n ? "border border-accent bg-accent/15 text-cyan-glow" : "border border-border bg-secondary/60 text-muted-foreground hover:text-foreground")}
            >
              {n}{t("seconds_short")}
            </button>
          ))}
        </div>

        <button
          onClick={handleCreate}
          disabled={!valid || loading !== null}
          className="w-full rounded-2xl bg-primary px-6 py-5 font-display text-lg font-bold text-primary-foreground neon-glow transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
        >
          {loading === "create" ? t("creating_room") : t("create_room")}
        </button>
      </section>
    </div>
  );
}

// ─── Lobby screen ─────────────────────────────────────────────────────────────

function LobbyScreen({
  roomCode,
  playerId,
  playerName,
  isHost,
  roster,
  roomConfig,
  channelRef,
  onBack,
  onStart,
}: {
  roomCode: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
  roster: RosterEntry[];
  roomConfig: RoomConfig | null;
  channelRef: React.MutableRefObject<RealtimeChannel | null>;
  onBack: () => void;
  onStart: (qs: Question[], fullRoster: RosterEntry[]) => void;
}) {
  const { t } = useLang();
  const [iAmReady, setIAmReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const gameStartedRef = useRef(false);

  const allReady = roster.length >= 2 && roster.every((p) => p.isReady);
  const overCapacity = roomConfig ? roster.length > roomConfig.maxPlayers : false;

  const handleReady = async () => {
    const channel = channelRef.current;
    if (!channel) return;
    setIAmReady(true);
    try {
      await channel.track({ playerId, playerName, isReady: true, isHost });
    } catch {}
    [0, 800, 2000].forEach((delay) => {
      setTimeout(() => {
        try { channel.send({ type: "broadcast", event: "player_ready", payload: { playerId } }); } catch {}
      }, delay);
    });
  };

  const handleStart = () => {
    const channel = channelRef.current;
    if (!channel || gameStartedRef.current || !roomConfig) return;
    gameStartedRef.current = true;
    const qs = pickQuestions(roomConfig.questionCount);
    const questionIds = qs.map((q) => q.id);
    [0, 800, 2000].forEach((delay) => {
      setTimeout(() => {
        try { channel.send({ type: "broadcast", event: "game_start", payload: { questionIds, roster } }); } catch {}
      }, delay);
    });
    onStart(qs, roster);
  };

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
        <div className="text-[11px] uppercase tracking-widest text-cyan-glow">{t("party_mode")}</div>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">{t("party_lobby_title")}</h2>
      </div>

      <div className="glass rounded-2xl p-5 space-y-2">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{t("your_room_code")}</div>
        <div className="flex items-center gap-3">
          <div className="font-display text-4xl font-bold tracking-[0.25em] text-neon">{roomCode}</div>
          <button onClick={copyCode} className="rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold hover:border-primary/60">
            {copied ? t("copied") : "Copy"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{t("share_code")}</p>
        {roomConfig && (
          <div className="flex flex-wrap gap-2 pt-2 text-[11px] text-muted-foreground">
            <span className="rounded-full bg-secondary/60 px-2.5 py-1">{roomConfig.maxPlayers} {t("players_label")}</span>
            <span className="rounded-full bg-secondary/60 px-2.5 py-1">{roomConfig.questionCount} {t("questions_label")}</span>
            <span className="rounded-full bg-secondary/60 px-2.5 py-1">{roomConfig.roundDuration}{t("seconds_short")}</span>
          </div>
        )}
      </div>

      {overCapacity && (
        <div className="rounded-xl bg-destructive/15 border border-destructive/40 px-4 py-3 text-sm text-destructive">{t("room_full")}</div>
      )}

      <div className="glass rounded-2xl p-5 space-y-2">
        {roomConfig && (
          <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
            {t("players_joined").replace("{current}", String(roster.length)).replace("{max}", String(roomConfig.maxPlayers))}
          </div>
        )}
        {roster.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">{t("waiting_for_players")}</div>
        ) : (
          roster.map((p) => (
            <PlayerRow key={p.playerId} name={p.playerName} ready={p.isReady} isYou={p.playerId === playerId} isHost={p.isHost} />
          ))
        )}
      </div>

      {!iAmReady && (
        <button onClick={handleReady} className="w-full rounded-2xl bg-primary px-6 py-5 font-display text-lg font-bold text-primary-foreground neon-glow transition-transform hover:scale-[1.02]">
          {t("ready_up")}
        </button>
      )}

      {iAmReady && isHost && (
        <button
          onClick={handleStart}
          disabled={!allReady}
          className="w-full rounded-2xl bg-primary px-6 py-5 font-display text-lg font-bold text-primary-foreground neon-glow transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
        >
          {allReady ? t("start_game") : t("need_two_players")}
        </button>
      )}

      {iAmReady && !isHost && (
        <div className="text-center text-sm text-muted-foreground animate-pulse">{t("waiting_host_start")}</div>
      )}
    </div>
  );
}

function PlayerRow({ name, ready, isYou, isHost }: { name: string; ready: boolean; isYou?: boolean; isHost?: boolean }) {
  const { t } = useLang();
  return (
    <div className="flex items-center gap-3 rounded-xl bg-secondary/40 p-3">
      <div className={"grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-sm font-bold " + (isYou ? "bg-primary/20 text-neon" : "bg-accent/20 text-cyan-glow")}>
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-sm">
          {name} {isYou && <span className="text-[10px] text-muted-foreground">({t("you")})</span>}
          {isHost && <span className="ml-1.5 rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-cyan-glow">{t("host_badge")}</span>}
        </div>
      </div>
      <div className={ready ? "text-xs font-bold text-neon" : "text-xs text-muted-foreground"}>{ready ? "✓ Ready" : "…"}</div>
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

function ArenaScreen({
  questions,
  playerId,
  matchRoster,
  roundDuration,
  channelRef,
  onFinish,
}: {
  questions: Question[];
  playerId: string;
  matchRoster: RosterEntry[];
  roundDuration: number;
  channelRef: React.MutableRefObject<RealtimeChannel | null>;
  onFinish: (players: PartyPlayer[]) => void;
}) {
  const { lang, t } = useLang();
  const [round, setRound] = useState(0);
  const [players, setPlayers] = useState<PartyPlayer[]>(() =>
    matchRoster.map((p) => ({ playerId: p.playerId, playerName: p.playerName, isHost: p.isHost, score: 0, answered: false, correct: false, disconnected: false }))
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [roundWinnerId, setRoundWinnerId] = useState<string | null | "tie">(null);
  const [timeLeft, setTimeLeft] = useState(roundDuration);

  const resolvedRef = useRef(false);
  const roundDeadlineRef = useRef(Date.now() + roundDuration * 1000);
  const presenceGraceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const playersRef = useRef(players);
  useEffect(() => { playersRef.current = players; }, [players]);
  const roundRef = useRef(round);
  useEffect(() => { roundRef.current = round; }, [round]);

  const q = questions[round];
  const loc = localizeQuestion(q, lang);
  const locQ = { ...q, ...loc };
  const correctIndex = locQ.options.indexOf(locQ.correct_answer);

  const activePlayers = players.filter((p) => !p.disconnected);

  const resolveRound = useCallback((winnerId: string | null) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    setRoundWinnerId(winnerId ?? "tie");
    if (winnerId) {
      setPlayers((prev) => prev.map((p) => (p.playerId === winnerId ? { ...p, score: p.score + 1 } : p)));
    }
  }, []);

  // Presence: track who's still in the room, with the same grace-period
  // debounce used in 1v1 so a brief blip doesn't wrongly mark someone gone.
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return;

    const handler = () => {
      const state = channel.presenceState<RosterEntry>();
      const presentIds = new Set(Object.values(state).flat().map((p) => p.playerId));
      presentIds.add(playerId); // self is always "present" from its own perspective

      playersRef.current.forEach((p) => {
        const grace = presenceGraceRef.current;
        if (presentIds.has(p.playerId)) {
          const pending = grace.get(p.playerId);
          if (pending) { clearTimeout(pending); grace.delete(p.playerId); }
        } else if (!grace.has(p.playerId) && !p.disconnected) {
          const timer = setTimeout(() => {
            grace.delete(p.playerId);
            setPlayers((prev) => prev.map((pp) => (pp.playerId === p.playerId ? { ...pp, disconnected: true } : pp)));
          }, 6000);
          grace.set(p.playerId, timer);
        }
      });
    };

    channel.on("presence", { event: "sync" }, handler);
    // Also react on mount to whatever the channel already knows.
    handler();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelRef, playerId]);

  useEffect(() => {
    const grace = presenceGraceRef.current;
    return () => { grace.forEach((t) => clearTimeout(t)); grace.clear(); };
  }, []);

  // If everyone else has left, end the match early with current scores.
  useEffect(() => {
    if (activePlayers.length <= 1 && players.length > 1) {
      onFinish(players);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlayers.length]);

  useEffect(() => {
    roundDeadlineRef.current = Date.now() + roundDuration * 1000;
    resolvedRef.current = false;
    setRoundWinnerId(null);
    setSelected(null);
    setPlayers((prev) => prev.map((p) => ({ ...p, answered: false, correct: false })));
  }, [round, roundDuration]);

  // Wall-clock timer — self-corrects if a tab was throttled/backgrounded.
  useEffect(() => {
    if (roundWinnerId !== null) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((roundDeadlineRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) resolveRound(null);
    };
    tick();
    const tid = setInterval(tick, 1000);
    return () => clearInterval(tid);
  }, [round, roundWinnerId, resolveRound]);

  // Opponents' answers. Registered once for the life of this screen (a
  // Supabase channel listener can't be individually unsubscribed), and reads
  // the current round via a ref so it never goes stale across rounds.
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const handler = ({ payload }: { payload: AnswerEvent }) => {
      if (payload.playerId === playerId || payload.round !== roundRef.current) return;
      setPlayers((prev) => {
        const next = prev.map((p) => (p.playerId === payload.playerId ? { ...p, answered: true, correct: payload.correct } : p));
        if (payload.correct) {
          resolveRound(payload.playerId);
        } else {
          const stillActive = next.filter((p) => !p.disconnected);
          if (stillActive.length > 0 && stillActive.every((p) => p.answered && !p.correct)) {
            resolveRound(null);
          }
        }
        return next;
      });
    };
    channel.on("broadcast", { event: "player_answer" }, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelRef]);

  const handleAnswer = (i: number) => {
    if (selected !== null || roundWinnerId !== null) return;
    setSelected(i);
    const correct = i === correctIndex;
    const channel = channelRef.current;
    if (channel) {
      try { channel.send({ type: "broadcast", event: "player_answer", payload: { playerId, round, correct } }); } catch {}
    }
    setPlayers((prev) => {
      const next = prev.map((p) => (p.playerId === playerId ? { ...p, answered: true, correct } : p));
      if (correct) {
        resolveRound(playerId);
      } else {
        const stillActive = next.filter((p) => !p.disconnected);
        if (stillActive.length > 0 && stillActive.every((p) => p.answered && !p.correct)) {
          resolveRound(null);
        }
      }
      return next;
    });
  };

  const nextRound = () => {
    if (round + 1 >= questions.length) {
      onFinish(players);
      return;
    }
    setRound((r) => r + 1);
  };

  const timerCritical = timeLeft <= 5;
  const winner = players.find((p) => p.playerId === roundWinnerId);

  return (
    <div className="space-y-5 fade-in-up">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="uppercase tracking-widest">{t("party_mode")}</div>
        <div className="uppercase tracking-widest">
          {t("round_of")} <span className="text-foreground">{round + 1}</span>/{questions.length}
        </div>
      </div>

      <section className="glass rounded-2xl p-4 space-y-2">
        {[...players].sort((a, b) => b.score - a.score).map((p) => (
          <div key={p.playerId} className="flex items-center gap-3">
            <div className="min-w-[2rem] font-display text-xl font-bold text-neon">{p.score}</div>
            <div className={"flex-1 text-sm font-medium truncate " + (p.disconnected ? "opacity-40 line-through" : "")}>
              {p.playerName} {p.playerId === playerId && <span className="text-[10px] text-muted-foreground">({t("you")})</span>}
            </div>
            {!p.disconnected && (
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {p.answered ? t("answered") : t("thinking")}
              </div>
            )}
          </div>
        ))}
      </section>

      <div className="flex justify-center">
        <TimerRing seconds={timeLeft} total={roundDuration} critical={timerCritical} />
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
          const revealed = roundWinnerId !== null;
          let cls = "glass hover:border-primary/60";
          if (revealed && isCorrect) cls = "border-2 border-primary bg-primary/15 text-foreground neon-glow";
          else if (revealed && isSelected && !isCorrect) cls = "border-2 border-destructive bg-destructive/15 text-foreground";
          else if (revealed) cls = "glass opacity-50";
          else if (isSelected) cls = "border-2 border-accent bg-accent/10 text-foreground";
          return (
            <button key={i} disabled={selected !== null || revealed} onClick={() => handleAnswer(i)} className={"w-full rounded-2xl p-4 text-left text-sm font-medium transition-all " + cls}>
              {opt}
            </button>
          );
        })}
      </section>

      {roundWinnerId !== null && (
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className={"text-center font-display text-lg font-bold " + (roundWinnerId === "tie" ? "text-muted-foreground" : roundWinnerId === playerId ? "text-neon" : "text-cyan-glow")}>
            {roundWinnerId === "tie"
              ? t("tie_round")
              : roundWinnerId === playerId
              ? t("you_won_round")
              : t("someone_won_round").replace("{name}", winner?.playerName ?? "?")}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{locQ.explanation}</p>
          <button onClick={nextRound} className="w-full rounded-xl bg-primary px-4 py-3 font-display font-bold text-primary-foreground neon-glow">
            {round + 1 >= questions.length ? t("see_results") : t("next_question")}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Results screen ───────────────────────────────────────────────────────────

function ResultsScreen({ players, playerId, onPlayAgain }: { players: PartyPlayer[]; playerId: string; onPlayAgain: () => void }) {
  const { t, lang } = useLang();
  const [shared, setShared] = useState(false);
  const ranked = [...players].sort((a, b) => b.score - a.score);
  const myRank = ranked.findIndex((p) => p.playerId === playerId) + 1;
  const won = myRank === 1;

  const shareText = lang === "fr"
    ? `J'ai terminé #${myRank} en Mode Groupe sur Science Based Quiz !`
    : `I placed #${myRank} in Party Mode on Science Based Quiz!`;

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
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{t("final_rankings")}</div>
        <h2 className={"mt-2 font-display text-5xl font-bold tracking-tight sm:text-6xl count-pop " + (won ? "text-neon" : "text-cyan-glow")}>
          {won ? t("party_you_won") : t("you_placed").replace("{rank}", String(myRank))}
        </h2>
      </div>

      <section className="glass rounded-2xl p-3 space-y-2">
        {ranked.map((p, i) => (
          <div key={p.playerId} className={"flex items-center gap-3 rounded-xl p-3 " + (p.playerId === playerId ? "bg-primary/10" : "")}>
            <div className={"grid h-8 w-8 shrink-0 place-items-center rounded-full font-display text-xs font-bold " + (i === 0 ? "bg-amber-400/20 text-amber-400" : i === 1 ? "bg-slate-300/20 text-slate-300" : i === 2 ? "bg-orange-400/20 text-orange-400" : "bg-secondary text-muted-foreground")}>
              {i + 1}
            </div>
            <div className="flex-1 truncate text-sm font-semibold">
              {p.playerName} {p.playerId === playerId && <span className="text-[10px] text-muted-foreground">({t("you")})</span>}
              {p.disconnected && <span className="ml-1.5 text-[10px] text-muted-foreground">({t("player_disconnected")})</span>}
            </div>
            <div className="font-display text-lg font-bold text-neon">{p.score}</div>
          </div>
        ))}
      </section>

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
        <circle cx="48" cy="48" r={radius} stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} style={{ transition: "stroke-dasharray 0.9s linear, stroke 0.3s" }} />
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
