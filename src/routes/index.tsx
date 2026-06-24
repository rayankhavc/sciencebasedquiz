import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HyperSci Quiz — Hardcore Science-Based Muscle Arena" },
      { name: "description", content: "Quiz compétitif scientifique avancé: anatomie, biomécanique, hypertrophie. Affronte des adversaires en 1v1 et grimpe au classement Elo." },
      { property: "og:title", content: "HyperSci Quiz" },
      { property: "og:description", content: "Hardcore Science-Based Muscle Arena" },
    ],
  }),
  component: App,
});

// ──────────────────────────────────────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────────────────────────────────────

type Difficulty = "Facile" | "Moyen" | "Hardcore";
type Theme = "Tout" | "Anatomie" | "Biomécanique" | "Nutrition Avancée" | "Physiologie Musculaire";

type Question = {
  id: string;
  difficulty: Difficulty;
  theme: Theme;
  q: string;
  options: string[];
  answer: number;
  pmid: string;
  explanation: string;
};

const QUESTIONS: Question[] = [
  {
    id: "q1",
    difficulty: "Facile",
    theme: "Nutrition Avancée",
    q: "Quel supplément a le niveau de preuve scientifique le plus élevé pour la force ?",
    options: ["BCAA", "Créatine Monohydrate", "Glutamine", "ZMA"],
    answer: 1,
    pmid: "28615996",
    explanation:
      "La créatine monohydrate est le supplément le plus étudié et démontre des effets significatifs et reproductibles sur la force, la puissance et l'hypertrophie. Position officielle de l'ISSN (Kreider et al., 2017).",
  },
  {
    id: "q2",
    difficulty: "Moyen",
    theme: "Biomécanique",
    q: "Où la tension est-elle maximale sur un Leg Extension ?",
    options: [
      "En position étirée (genou fléchi)",
      "À mi-amplitude",
      "En position de contraction maximale (genou tendu)",
      "Constante sur toute l'amplitude",
    ],
    answer: 2,
    pmid: "35041043",
    explanation:
      "La courbe de résistance du Leg Extension impose une tension maximale en position de contraction (extension du genou), en raison du bras de levier maximal du poids par rapport à l'axe de rotation.",
  },
  {
    id: "q3",
    difficulty: "Hardcore",
    theme: "Physiologie Musculaire",
    q: "Quel type d'hypertrophie augmente le liquide non contractile ?",
    options: [
      "Hypertrophie myofibrillaire",
      "Hypertrophie sarcoplasmique",
      "Hyperplasie",
      "Hypertrophie connective",
    ],
    answer: 1,
    pmid: "31618140",
    explanation:
      "L'hypertrophie sarcoplasmique correspond à une augmentation du volume du sarcoplasme (liquide non contractile, glycogène, mitochondries), distincte de l'hypertrophie myofibrillaire qui augmente les protéines contractiles.",
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Types & state
// ──────────────────────────────────────────────────────────────────────────────

type Mode = "solo" | "1v1";
type Screen = "dashboard" | "select" | "arena" | "results";

type RoundResult = {
  question: Question;
  selected: number | null;
  correct: boolean;
  opponentCorrect: boolean;
};

const QUESTION_DURATION = 15;

// ──────────────────────────────────────────────────────────────────────────────
// Root component
// ──────────────────────────────────────────────────────────────────────────────

function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [mode, setMode] = useState<Mode>("solo");
  const [difficulty, setDifficulty] = useState<Difficulty>("Moyen");
  const [theme, setTheme] = useState<Theme>("Physiologie Musculaire");
  const [elo, setElo] = useState(1480);
  const [wins, setWins] = useState(34);
  const [losses, setLosses] = useState(18);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [eloDelta, setEloDelta] = useState(0);

  const startGame = (m: Mode) => {
    setMode(m);
    setScreen("select");
  };

  const launchArena = () => {
    setResults([]);
    setScreen("arena");
  };

  const finishGame = (finalResults: RoundResult[]) => {
    setResults(finalResults);
    const myScore = finalResults.filter((r) => r.correct).length;
    const oppScore = finalResults.filter((r) => r.opponentCorrect).length;
    const won = mode === "solo" ? myScore >= Math.ceil(finalResults.length / 2) : myScore > oppScore;
    const delta = won ? 25 : -18;
    setEloDelta(delta);
    setElo((e) => e + delta);
    if (won) setWins((w) => w + 1);
    else setLosses((l) => l + 1);
    setScreen("results");
  };

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        <TopBar />
        {screen === "dashboard" && (
          <Dashboard elo={elo} wins={wins} losses={losses} onPlay={startGame} />
        )}
        {screen === "select" && (
          <ModeSelect
            mode={mode}
            difficulty={difficulty}
            theme={theme}
            setDifficulty={setDifficulty}
            setTheme={setTheme}
            onBack={() => setScreen("dashboard")}
            onStart={launchArena}
          />
        )}
        {screen === "arena" && (
          <Arena mode={mode} difficulty={difficulty} onFinish={finishGame} onQuit={() => setScreen("dashboard")} />
        )}
        {screen === "results" && (
          <Results
            results={results}
            mode={mode}
            eloDelta={eloDelta}
            elo={elo}
            onHome={() => setScreen("dashboard")}
            onAgain={() => setScreen("select")}
          />
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// TopBar
// ──────────────────────────────────────────────────────────────────────────────

function TopBar() {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground neon-glow">
          <BoltIcon />
        </div>
        <div className="leading-tight">
          <div className="font-display text-sm font-bold tracking-tight">HyperSci</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Quiz Arena</div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-block h-2 w-2 rounded-full bg-primary pulse-ring" />
        <span>Live · 2,184 athletes</span>
      </div>
    </header>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────────────────────────────────────

function Dashboard({
  elo,
  wins,
  losses,
  onPlay,
}: {
  elo: number;
  wins: number;
  losses: number;
  onPlay: (m: Mode) => void;
}) {
  const ratio = (wins / Math.max(1, wins + losses)) * 100;
  return (
    <div className="space-y-6 fade-in-up">
      <section>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="text-neon">HyperSci</span> Quiz
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Hardcore Science-Based Muscle Arena
        </p>
      </section>

      <section className="glass rounded-2xl p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-lg font-bold">
              KX
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold">@kratos_x</div>
              <div className="text-xs text-muted-foreground">Rank · Diamant III</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Elo</div>
            <div className="font-display text-2xl font-bold text-neon">{elo}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Victoires" value={wins} />
          <Stat label="Défaites" value={losses} />
          <Stat label="Ratio" value={`${ratio.toFixed(0)}%`} />
        </div>
      </section>

      <section className="grid gap-3">
        <CTAButton
          variant="primary"
          onClick={() => onPlay("1v1")}
          title="1v1 Competitive Arena"
          subtitle="Affronte un adversaire en direct · Classé"
          icon={<SwordsIcon />}
        />
        <CTAButton
          variant="ghost"
          onClick={() => onPlay("solo")}
          title="Solo Mode"
          subtitle="Entraîne-toi sans pression · Non classé"
          icon={<UserIcon />}
        />
      </section>

      <section className="glass rounded-2xl p-4">
        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
          <span>Saison · S4</span>
          <span className="text-cyan-glow">Top 12%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: "62%" }} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-secondary/60 p-2.5">
      <div className="font-display text-lg font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function CTAButton({
  title,
  subtitle,
  icon,
  variant,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  variant: "primary" | "ghost";
  onClick: () => void;
}) {
  const isPrimary = variant === "primary";
  return (
    <button
      onClick={onClick}
      className={
        "group relative flex w-full items-center gap-4 rounded-2xl p-5 text-left transition-all duration-300 " +
        (isPrimary
          ? "bg-primary text-primary-foreground neon-glow hover:scale-[1.02]"
          : "glass hover:border-primary/60 hover:scale-[1.01]")
      }
    >
      <div
        className={
          "grid h-12 w-12 shrink-0 place-items-center rounded-xl " +
          (isPrimary ? "bg-black/15" : "bg-primary/15 text-primary")
        }
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-lg font-bold">{title}</div>
        <div className={"text-xs " + (isPrimary ? "opacity-80" : "text-muted-foreground")}>{subtitle}</div>
      </div>
      <ArrowIcon />
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Mode select
// ──────────────────────────────────────────────────────────────────────────────

function ModeSelect({
  mode,
  difficulty,
  theme,
  setDifficulty,
  setTheme,
  onBack,
  onStart,
}: {
  mode: Mode;
  difficulty: Difficulty;
  theme: Theme;
  setDifficulty: (d: Difficulty) => void;
  setTheme: (t: Theme) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  const difficulties: Difficulty[] = ["Facile", "Moyen", "Hardcore"];
  const themes: Theme[] = ["Tout", "Anatomie", "Biomécanique", "Nutrition Avancée", "Physiologie Musculaire"];

  return (
    <div className="space-y-6 fade-in-up">
      <button onClick={onBack} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
        ← Retour
      </button>

      <div>
        <div className="text-[11px] uppercase tracking-widest text-cyan-glow">
          {mode === "1v1" ? "1v1 Competitive Arena" : "Solo Mode"}
        </div>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">Configure ton match</h2>
      </div>

      <section className="glass space-y-3 rounded-2xl p-5">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Difficulté</div>
        <div className="grid grid-cols-3 gap-2">
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={
                "rounded-xl px-3 py-3 text-sm font-semibold transition-all " +
                (difficulty === d
                  ? "bg-primary text-primary-foreground neon-glow"
                  : "bg-secondary text-foreground hover:bg-secondary/60")
              }
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      <section className="glass space-y-3 rounded-2xl p-5">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Thèmes</div>
        <div className="flex flex-wrap gap-2">
          {themes.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={
                "rounded-full px-4 py-2 text-xs font-semibold transition-all " +
                (theme === t
                  ? "border border-accent bg-accent/15 text-cyan-glow"
                  : "border border-border bg-secondary/60 text-muted-foreground hover:text-foreground")
              }
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={onStart}
        className="w-full rounded-2xl bg-primary px-6 py-5 font-display text-lg font-bold text-primary-foreground neon-glow transition-transform hover:scale-[1.02]"
      >
        {mode === "1v1" ? "🥊 Trouver un adversaire" : "🚀 Lancer le quiz"}
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Arena
// ──────────────────────────────────────────────────────────────────────────────

function Arena({
  mode,
  difficulty,
  onFinish,
  onQuit,
}: {
  mode: Mode;
  difficulty: Difficulty;
  onFinish: (r: RoundResult[]) => void;
  onQuit: () => void;
}) {
  const questions = useMemo(() => {
    // Demo: always run all 3 questions; just put preferred difficulty first
    const sorted = [...QUESTIONS].sort((a, b) => (a.difficulty === difficulty ? -1 : b.difficulty === difficulty ? 1 : 0));
    return sorted;
  }, [difficulty]);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [opponentAnswered, setOpponentAnswered] = useState<boolean>(false);
  const [opponentCorrect, setOpponentCorrect] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION);
  const [showSource, setShowSource] = useState(false);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);

  const q = questions[idx];
  const opponentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tick
  useEffect(() => {
    if (selected !== null) return;
    if (timeLeft <= 0) {
      handleAnswer(-1);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, selected]);

  // Opponent simulation
  useEffect(() => {
    if (mode !== "1v1") return;
    const delay = 2000 + Math.random() * 4000;
    opponentTimerRef.current = setTimeout(() => {
      const correct = Math.random() < 0.75;
      setOpponentAnswered(true);
      setOpponentCorrect(correct);
      if (correct) setOppScore((s) => s + 1);
    }, delay);
    return () => {
      if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, mode]);

  const handleAnswer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === q.answer;
    if (correct) setMyScore((s) => s + 1);
    // If opponent hasn't answered yet, lock their result now
    let finalOppCorrect = opponentCorrect;
    let finalOppAnswered = opponentAnswered;
    if (mode === "1v1" && !opponentAnswered) {
      // 50/50 quick reaction
      const oc = Math.random() < 0.6;
      finalOppCorrect = oc;
      finalOppAnswered = true;
      setOpponentAnswered(true);
      setOpponentCorrect(oc);
      if (oc) setOppScore((s) => s + 1);
    }
    if (mode === "solo") {
      finalOppCorrect = false;
      finalOppAnswered = true;
    }
    const result: RoundResult = {
      question: q,
      selected: i === -1 ? null : i,
      correct,
      opponentCorrect: mode === "1v1" ? finalOppCorrect : false,
    };
    setResults((prev) => [...prev, result]);
  };

  const next = () => {
    if (idx + 1 >= questions.length) {
      onFinish(results);
      return;
    }
    setIdx((i) => i + 1);
    setSelected(null);
    setOpponentAnswered(false);
    setOpponentCorrect(false);
    setTimeLeft(QUESTION_DURATION);
    setShowSource(false);
  };

  const total = questions.length;
  const myPct = (myScore / total) * 100;
  const oppPct = (oppScore / total) * 100;
  const timerCritical = timeLeft <= 5;

  return (
    <div className="space-y-5 no-select fade-in-up">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <button onClick={onQuit} className="uppercase tracking-widest hover:text-foreground">← Quitter</button>
        <div className="uppercase tracking-widest">
          Question <span className="text-foreground">{idx + 1}</span>/{total}
        </div>
      </div>

      {/* Score bars */}
      <section className="glass rounded-2xl p-4">
        <ScoreBar label="Toi" score={myScore} pct={myPct} accent="primary" />
        {mode === "1v1" && (
          <div className="mt-3">
            <ScoreBar label="@iron_lab" score={oppScore} pct={oppPct} accent="cyan" indicator={opponentAnswered ? "answered" : "thinking"} />
          </div>
        )}
      </section>

      {/* Timer */}
      <div className="flex justify-center">
        <CountdownRing seconds={timeLeft} total={QUESTION_DURATION} critical={timerCritical} />
      </div>

      {/* Question */}
      <section className="glass rounded-2xl p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge>{q.difficulty}</Badge>
          <Badge variant="cyan">{q.theme}</Badge>
        </div>
        <h3 className="text-xl font-semibold leading-snug sm:text-2xl">{q.q}</h3>
      </section>

      {/* Answers */}
      <section className="grid gap-2.5">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === q.answer;
          const revealed = selected !== null;
          let cls = "glass hover:border-primary/60";
          if (revealed && isCorrect) cls = "border-2 border-primary bg-primary/15 text-foreground neon-glow";
          else if (revealed && isSelected && !isCorrect)
            cls = "border-2 border-destructive bg-destructive/15 text-foreground";
          else if (revealed) cls = "glass opacity-50";
          return (
            <button
              key={i}
              disabled={selected !== null}
              onClick={() => handleAnswer(i)}
              className={
                "flex items-center gap-3 rounded-xl p-4 text-left transition-all duration-200 " +
                cls +
                (selected === null ? " hover:scale-[1.01]" : "")
              }
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-secondary font-display text-sm font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium sm:text-base">{opt}</span>
              {revealed && isCorrect && <CheckIcon />}
              {revealed && isSelected && !isCorrect && <CrossIcon />}
            </button>
          );
        })}
      </section>

      {selected !== null && (
        <div className="flex flex-col gap-2.5 fade-in-up sm:flex-row">
          <button
            onClick={() => setShowSource(true)}
            className="flex-1 rounded-xl border border-accent/50 bg-accent/10 px-4 py-3 text-sm font-semibold text-cyan-glow transition-colors hover:bg-accent/20"
          >
            📚 Voir la source scientifique (PMID)
          </button>
          <button
            onClick={next}
            className="flex-1 rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground neon-glow transition-transform hover:scale-[1.02]"
          >
            {idx + 1 >= total ? "Voir les résultats →" : "Question suivante →"}
          </button>
        </div>
      )}

      {showSource && <SourceModal q={q} onClose={() => setShowSource(false)} />}
    </div>
  );
}

function ScoreBar({
  label,
  score,
  pct,
  accent,
  indicator,
}: {
  label: string;
  score: number;
  pct: number;
  accent: "primary" | "cyan";
  indicator?: "thinking" | "answered";
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{label}</span>
          {indicator === "thinking" && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> réfléchit…
            </span>
          )}
          {indicator === "answered" && (
            <span className="text-[10px] uppercase tracking-wider text-cyan-glow">a répondu</span>
          )}
        </div>
        <span className="font-display font-bold">{score}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={
            "h-full rounded-full transition-all duration-500 " +
            (accent === "primary"
              ? "bg-gradient-to-r from-primary to-primary/70"
              : "bg-gradient-to-r from-accent to-accent/70")
          }
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CountdownRing({ seconds, total, critical }: { seconds: number; total: number; critical: boolean }) {
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const pct = seconds / total;
  const dash = circ * pct;
  const color = critical ? "var(--danger)" : "var(--neon)";
  return (
    <div className={"relative grid h-24 w-24 place-items-center " + (critical ? "pulse-ring rounded-full" : "")}>
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={radius} stroke="var(--border)" strokeWidth="6" fill="none" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.9s linear, stroke 0.3s" }}
        />
      </svg>
      <div className="absolute text-center">
        <div
          className="font-display text-2xl font-bold"
          style={{ color: critical ? "var(--danger)" : "var(--neon)" }}
        >
          {seconds}
        </div>
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground">sec</div>
      </div>
    </div>
  );
}

function Badge({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "cyan" }) {
  return (
    <span
      className={
        "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest " +
        (variant === "primary"
          ? "bg-primary/15 text-neon"
          : "bg-accent/15 text-cyan-glow")
      }
    >
      {children}
    </span>
  );
}

function SourceModal({ q, onClose }: { q: Question; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="slide-up w-full max-w-lg rounded-t-3xl bg-card p-6 sm:rounded-3xl">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-border sm:hidden" />
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-widest text-cyan-glow">Source scientifique</div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <h4 className="font-display text-lg font-bold">PMID: {q.pmid}</h4>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{q.explanation}</p>
        <div className="mt-5 rounded-xl bg-secondary p-3 text-xs">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Réponse correcte</div>
          <div className="mt-1 font-semibold text-primary">{q.options[q.answer]}</div>
        </div>
        <a
          href={`https://pubmed.ncbi.nlm.nih.gov/${q.pmid}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 block w-full rounded-xl bg-primary px-4 py-3 text-center font-display text-sm font-bold text-primary-foreground neon-glow"
        >
          Ouvrir sur PubMed ↗
        </a>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Results
// ──────────────────────────────────────────────────────────────────────────────

function Results({
  results,
  mode,
  eloDelta,
  elo,
  onHome,
  onAgain,
}: {
  results: RoundResult[];
  mode: Mode;
  eloDelta: number;
  elo: number;
  onHome: () => void;
  onAgain: () => void;
}) {
  const myScore = results.filter((r) => r.correct).length;
  const oppScore = results.filter((r) => r.opponentCorrect).length;
  const won = mode === "solo" ? myScore >= Math.ceil(results.length / 2) : myScore > oppScore;
  const [reviewing, setReviewing] = useState(false);
  const mistakes = results.filter((r) => !r.correct);

  const [animMy, setAnimMy] = useState(0);
  const [animOpp, setAnimOpp] = useState(0);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      setAnimMy(Math.min(i, myScore));
      setAnimOpp(Math.min(i, oppScore));
      if (i >= Math.max(myScore, oppScore)) clearInterval(t);
    }, 220);
    return () => clearInterval(t);
  }, [myScore, oppScore]);

  return (
    <div className="space-y-6 fade-in-up">
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Résultat du match</div>
        <h2
          className={
            "mt-2 font-display text-5xl font-bold tracking-tight sm:text-6xl count-pop " +
            (won ? "text-neon" : "text-danger")
          }
          style={!won ? { color: "var(--danger)", textShadow: "0 0 18px color-mix(in oklab, var(--danger) 60%, transparent)" } : {}}
        >
          {won ? "VICTORY" : "DEFEAT"}
        </h2>
      </div>

      <section className="glass rounded-2xl p-6">
        <div className="grid grid-cols-3 items-center gap-3">
          <ScoreColumn label="Toi" value={animMy} accent="primary" />
          <div className="text-center font-display text-xl text-muted-foreground">VS</div>
          <ScoreColumn label={mode === "1v1" ? "@iron_lab" : "Cible"} value={mode === "1v1" ? animOpp : Math.ceil(results.length / 2)} accent="cyan" />
        </div>
      </section>

      <section className="glass flex items-center justify-between rounded-2xl p-5">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Nouvelle Elo</div>
          <div className="font-display text-3xl font-bold">{elo}</div>
        </div>
        <div
          className={
            "rounded-xl px-4 py-2 font-display text-lg font-bold count-pop " +
            (eloDelta >= 0 ? "bg-primary/15 text-neon" : "bg-destructive/15 text-danger")
          }
          style={eloDelta < 0 ? { color: "var(--danger)" } : {}}
        >
          {eloDelta >= 0 ? `+${eloDelta}` : eloDelta} Elo
        </div>
      </section>

      {!reviewing ? (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {mistakes.length > 0 && (
            <button
              onClick={() => setReviewing(true)}
              className="rounded-xl border border-accent/50 bg-accent/10 px-4 py-3 text-sm font-semibold text-cyan-glow"
            >
              🔬 Revoir mes {mistakes.length} erreur{mistakes.length > 1 ? "s" : ""}
            </button>
          )}
          <button
            onClick={onAgain}
            className="rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground neon-glow"
          >
            Rejouer
          </button>
          <button
            onClick={onHome}
            className="rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-foreground sm:col-span-2"
          >
            ← Retour au tableau de bord
          </button>
        </div>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Révision des erreurs</h3>
            <button onClick={() => setReviewing(false)} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
              Fermer
            </button>
          </div>
          {mistakes.map((m) => (
            <div key={m.question.id} className="glass rounded-2xl p-4">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge>{m.question.difficulty}</Badge>
                <Badge variant="cyan">{m.question.theme}</Badge>
              </div>
              <div className="text-sm font-semibold">{m.question.q}</div>
              <div className="mt-3 rounded-lg bg-secondary p-3 text-xs">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Bonne réponse</div>
                <div className="mt-1 font-semibold text-primary">{m.question.options[m.question.answer]}</div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{m.question.explanation}</p>
              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/${m.question.pmid}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs font-semibold text-cyan-glow hover:underline"
              >
                PMID: {m.question.pmid} ↗
              </a>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function ScoreColumn({ label, value, accent }: { label: string; value: number; accent: "primary" | "cyan" }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className={"mt-1 font-display text-5xl font-bold " + (accent === "primary" ? "text-neon" : "text-cyan-glow")}
      >
        {value}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Icons
// ──────────────────────────────────────────────────────────────────────────────

function BoltIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>
  );
}
function SwordsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" y1="19" x2="19" y2="13" />
      <line x1="16" y1="16" x2="20" y2="20" />
      <line x1="19" y1="21" x2="21" y2="19" />
      <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
      <line x1="5" y1="14" x2="9" y2="18" />
      <line x1="7" y1="17" x2="4" y2="20" />
      <line x1="3" y1="19" x2="5" y2="21" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function CrossIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
