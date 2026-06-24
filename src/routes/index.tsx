import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HyperSci Quiz — \n" },
      { name: "description", content: "Evidence-based quiz on anatomy, biomechanics, hypertrophy and nutrition. Battle bots and master the science." },
      { property: "og:title", content: "HyperSci Quiz" },
      { property: "og:description", content: "\n" },
    ],
  }),
  component: App,
});

// ──────────────────────────────────────────────────────────────────────────────
// Question database
// ──────────────────────────────────────────────────────────────────────────────

type Difficulty = "easy" | "medium" | "hardcore";
type Category = "All" | "Nutrition" | "Biomechanics" | "Hypertrophy" | "Physiology";

type Question = {
  id: string;
  difficulty: Difficulty;
  category: Exclude<Category, "All">;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  source_pmid: string;
  source_url: string;
};

const QUESTIONS: Question[] = [
  {
    id: "e1",
    difficulty: "easy",
    category: "Nutrition",
    question: "Which supplement has the highest level of scientific evidence for increasing ATP recycling during high-intensity muscle contractions?",
    options: ["Creatine Monohydrate", "BCAA", "Glutamine", "Beta-Alanine"],
    correct_answer: "Creatine Monohydrate",
    explanation: "Creatine monohydrate increases phosphocreatine stores, allowing rapid resynthesis of ATP during short bursts of heavy exercise.",
    source_pmid: "28615996",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28615996/",
  },
  {
    id: "m1",
    difficulty: "medium",
    category: "Biomechanics",
    question: "During a standard leg extension, at which position is the mechanical torque (resistance profile) highest on the rectus femoris?",
    options: [
      "Full extension (shortened position)",
      "90 degrees flexion (stretched position)",
      "Mid-range (45 degrees)",
      "The profile is perfectly linear",
    ],
    correct_answer: "Full extension (shortened position)",
    explanation: "Standard cam-based leg extensions maximize the moment arm when the shin is parallel to the floor, creating peak torque in full knee extension.",
    source_pmid: "35041043",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/35041043/",
  },
  {
    id: "h1",
    difficulty: "hardcore",
    category: "Hypertrophy",
    question: "Which giant structural protein acts as a mechanosensor and is primarily responsible for generating passive tension during stretch-mediated hypertrophy?",
    options: ["Titin", "Actin", "Myosin", "Desmin"],
    correct_answer: "Titin",
    explanation: "Titin develops passive tension when muscle fibers are elongated, triggering intracellular signaling pathways (like titin kinase) required for stretch-mediated hypertrophy.",
    source_pmid: "31618140",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/31618140/",
  },
  {
    id: "h2",
    difficulty: "hardcore",
    category: "Physiology",
    question: "What type of cellular adaptation is characterized by an increase in sarcoplasmic volume, including glycogen and water, without a concurrent increase in myofibrillar protein synthesis?",
    options: ["Sarcoplasmic Hypertrophy", "Myofibrillar Hypertrophy", "Hyperplasia", "Eccentric Remodeling"],
    correct_answer: "Sarcoplasmic Hypertrophy",
    explanation: "Sarcoplasmic hypertrophy involves the expansion of the non-contractile fluid and energy stores within the muscle sarcoplasm, independent of myofibrillar protein accretion.",
    source_pmid: "32174353",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/32174353/",
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Bots
// ──────────────────────────────────────────────────────────────────────────────

type BotId = "novice" | "researcher" | "hypertrophy";
type Bot = {
  id: BotId;
  name: string;
  tag: string;
  accuracy: number;
  minDelay: number; // ms
  maxDelay: number;
  blurb: string;
};

const BOTS: Bot[] = [
  { id: "novice", name: "Novice Bot", tag: "Easy", accuracy: 0.5, minDelay: 5000, maxDelay: 8000, blurb: "Just discovered the gym. Slow and unsure." },
  { id: "researcher", name: "Researcher Bot", tag: "Medium", accuracy: 0.75, minDelay: 3000, maxDelay: 5000, blurb: "Reads abstracts on weekends. Solid opponent." },
  { id: "hypertrophy", name: "Dr. Hypertrophy Bot", tag: "Hardcore", accuracy: 0.95, minDelay: 1000, maxDelay: 3000, blurb: "PhD in muscle science. Brutal accuracy." },
];

// ──────────────────────────────────────────────────────────────────────────────
// State
// ──────────────────────────────────────────────────────────────────────────────

type Mode = "solo" | "bot";
type Screen = "dashboard" | "username" | "botSelect" | "categorySelect" | "arena" | "results";

type RoundResult = {
  question: Question;
  selectedIndex: number | null;
  correct: boolean;
  opponentCorrect: boolean;
};

const QUESTION_DURATION = 15;

// ──────────────────────────────────────────────────────────────────────────────
// Root
// ──────────────────────────────────────────────────────────────────────────────

function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [mode, setMode] = useState<Mode>("solo");
  const [username, setUsername] = useState("");
  const [bot, setBot] = useState<Bot>(BOTS[1]);
  const [category, setCategory] = useState<Category>("All");
  const [results, setResults] = useState<RoundResult[]>([]);

  const startSolo = () => {
    setMode("solo");
    setScreen("username");
  };

  const startBot = () => {
    setMode("bot");
    setScreen("botSelect");
  };

  const finishGame = (finalResults: RoundResult[]) => {
    setResults(finalResults);
    setScreen("results");
  };

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        <TopBar />

        {screen === "dashboard" && (
          <Dashboard onSolo={startSolo} onBot={startBot} />
        )}

        {screen === "username" && (
          <UsernameScreen
            username={username}
            setUsername={setUsername}
            onBack={() => setScreen("dashboard")}
            onContinue={() => setScreen("categorySelect")}
          />
        )}

        {screen === "botSelect" && (
          <BotSelect
            selected={bot}
            setBot={setBot}
            onBack={() => setScreen("dashboard")}
            onContinue={() => setScreen("categorySelect")}
          />
        )}

        {screen === "categorySelect" && (
          <CategorySelect
            mode={mode}
            bot={bot}
            category={category}
            setCategory={setCategory}
            onBack={() => setScreen(mode === "solo" ? "username" : "botSelect")}
            onStart={() => {
              setResults([]);
              setScreen("arena");
            }}
          />
        )}

        {screen === "arena" && (
          <Arena
            mode={mode}
            bot={bot}
            category={category}
            onFinish={finishGame}
            onQuit={() => setScreen("dashboard")}
          />
        )}

        {screen === "results" && (
          <Results
            results={results}
            mode={mode}
            username={username || "You"}
            bot={bot}
            onHome={() => setScreen("dashboard")}
            onAgain={() => setScreen("categorySelect")}
          />
        )}

        <Footer />
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
        <span>Evidence-based</span>
      </div>
    </header>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Footer with static page links
// ──────────────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="mt-10 border-t border-border pt-5 text-xs text-muted-foreground">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link to="/about" className="hover:text-foreground transition-colors">Why This Platform?</Link>
        <span className="opacity-30">·</span>
        <Link to="/legal" className="hover:text-foreground transition-colors">Legal Notice</Link>
        <span className="opacity-30">·</span>
        <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
      </nav>
      <div className="mt-3 text-center text-[10px] uppercase tracking-widest opacity-60">
        © HyperSci Quiz — Science over bro-science
      </div>
    </footer>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────────────────────────────────────

function Dashboard({ onSolo, onBot }: { onSolo: () => void; onBot: () => void }) {
  return (
    <div className="space-y-6 fade-in-up">
      <section>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="text-neon">HyperSci</span> Quiz
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {"\n"}
        </p>
      </section>

      <section className="glass rounded-2xl p-5">
        <div className="text-[10px] uppercase tracking-widest text-cyan-glow">Mission</div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Test your knowledge of biomechanics, hypertrophy and sports nutrition with
          questions sourced from peer-reviewed research. Every answer links to a PubMed citation.
        </p>
      </section>

      <section className="grid gap-3">
        <CTAButton
          variant="primary"
          onClick={onBot}
          title="1v1 Bot Arena"
          subtitle="Pick a bot and challenge it head-to-head"
          icon={<SwordsIcon />}
        />
        <CTAButton
          variant="ghost"
          onClick={onSolo}
          title="Solo Mode"
          subtitle="Train at your own pace, no opponent"
          icon={<UserIcon />}
        />
      </section>
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
      <div className={"grid h-12 w-12 shrink-0 place-items-center rounded-xl " + (isPrimary ? "bg-black/15" : "bg-primary/15 text-primary")}>
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
// Username screen (Solo flow)
// ──────────────────────────────────────────────────────────────────────────────

function UsernameScreen({
  username,
  setUsername,
  onBack,
  onContinue,
}: {
  username: string;
  setUsername: (v: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const valid = username.trim().length >= 2;
  return (
    <div className="space-y-6 fade-in-up">
      <button onClick={onBack} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Back</button>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-cyan-glow">Solo Mode</div>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">Enter your username</h2>
        <p className="mt-2 text-sm text-muted-foreground">It will only appear on your results screen.</p>
      </div>

      <div className="glass rounded-2xl p-5">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Username</label>
        <input
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && valid) onContinue(); }}
          placeholder="e.g. iron_lab"
          className="mt-2 w-full rounded-xl border border-border bg-secondary/60 px-4 py-3 text-base font-medium outline-none focus:border-primary"
          maxLength={24}
        />
      </div>

      <button
        onClick={onContinue}
        disabled={!valid}
        className="w-full rounded-2xl bg-primary px-6 py-5 font-display text-lg font-bold text-primary-foreground neon-glow transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
      >
        Continue →
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Bot selection
// ──────────────────────────────────────────────────────────────────────────────

function BotSelect({
  selected,
  setBot,
  onBack,
  onContinue,
}: {
  selected: Bot;
  setBot: (b: Bot) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6 fade-in-up">
      <button onClick={onBack} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Back</button>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-cyan-glow">1v1 Bot Arena</div>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">Pick your opponent</h2>
      </div>

      <div className="grid gap-3">
        {BOTS.map((b) => {
          const active = selected.id === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setBot(b)}
              className={
                "rounded-2xl p-5 text-left transition-all " +
                (active
                  ? "bg-primary/15 border-2 border-primary neon-glow"
                  : "glass hover:border-primary/60")
              }
            >
              <div className="flex items-center justify-between">
                <div className="font-display text-lg font-bold">{b.name}</div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-cyan-glow">
                  {b.tag}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{b.blurb}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg bg-secondary/60 p-2">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Accuracy</div>
                  <div className="font-display font-bold text-neon">{Math.round(b.accuracy * 100)}%</div>
                </div>
                <div className="rounded-lg bg-secondary/60 p-2">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Response</div>
                  <div className="font-display font-bold text-cyan-glow">{b.minDelay / 1000}-{b.maxDelay / 1000}s</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onContinue}
        className="w-full rounded-2xl bg-primary px-6 py-5 font-display text-lg font-bold text-primary-foreground neon-glow transition-transform hover:scale-[1.02]"
      >
        Continue →
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Category select
// ──────────────────────────────────────────────────────────────────────────────

function CategorySelect({
  mode,
  bot,
  category,
  setCategory,
  onBack,
  onStart,
}: {
  mode: Mode;
  bot: Bot;
  category: Category;
  setCategory: (c: Category) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  const cats: Category[] = ["All", "Nutrition", "Biomechanics", "Hypertrophy", "Physiology"];
  return (
    <div className="space-y-6 fade-in-up">
      <button onClick={onBack} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Back</button>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-cyan-glow">
          {mode === "bot" ? `vs ${bot.name}` : "Solo Mode"}
        </div>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">Choose a category</h2>
      </div>

      <section className="glass rounded-2xl p-5">
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={
                "rounded-full px-4 py-2 text-xs font-semibold transition-all " +
                (category === c
                  ? "border border-accent bg-accent/15 text-cyan-glow"
                  : "border border-border bg-secondary/60 text-muted-foreground hover:text-foreground")
              }
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={onStart}
        className="w-full rounded-2xl bg-primary px-6 py-5 font-display text-lg font-bold text-primary-foreground neon-glow transition-transform hover:scale-[1.02]"
      >
        {mode === "bot" ? "Start the match" : "Start the quiz"}
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Arena
// ──────────────────────────────────────────────────────────────────────────────

function Arena({
  mode,
  bot,
  category,
  onFinish,
  onQuit,
}: {
  mode: Mode;
  bot: Bot;
  category: Category;
  onFinish: (r: RoundResult[]) => void;
  onQuit: () => void;
}) {
  const questions = useMemo(() => {
    const pool = category === "All" ? QUESTIONS : QUESTIONS.filter((q) => q.category === category);
    return pool.length > 0 ? pool : QUESTIONS;
  }, [category]);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [opponentAnswered, setOpponentAnswered] = useState(false);
  const [opponentCorrect, setOpponentCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION);
  const [showSource, setShowSource] = useState(false);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);

  const q = questions[idx];
  const correctIndex = q.options.indexOf(q.correct_answer);
  const opponentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timer
  useEffect(() => {
    if (selected !== null) return;
    if (timeLeft <= 0) {
      handleAnswer(-1);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, selected]);

  // Bot answer simulation
  useEffect(() => {
    if (mode !== "bot") return;
    const delay = bot.minDelay + Math.random() * (bot.maxDelay - bot.minDelay);
    opponentTimerRef.current = setTimeout(() => {
      const correct = Math.random() < bot.accuracy;
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
    const correct = i === correctIndex;
    if (correct) setMyScore((s) => s + 1);

    let finalOppCorrect = opponentCorrect;
    if (mode === "bot" && !opponentAnswered) {
      // Lock the bot in immediately based on its accuracy
      const oc = Math.random() < bot.accuracy;
      finalOppCorrect = oc;
      setOpponentAnswered(true);
      setOpponentCorrect(oc);
      if (oc) setOppScore((s) => s + 1);
      if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);
    }

    const result: RoundResult = {
      question: q,
      selectedIndex: i === -1 ? null : i,
      correct,
      opponentCorrect: mode === "bot" ? finalOppCorrect : false,
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
        <button onClick={onQuit} className="uppercase tracking-widest hover:text-foreground">← Quit</button>
        <div className="uppercase tracking-widest">
          Question <span className="text-foreground">{idx + 1}</span>/{total}
        </div>
      </div>

      <section className="glass rounded-2xl p-4">
        <ScoreBar label="You" score={myScore} pct={myPct} accent="primary" />
        {mode === "bot" && (
          <div className="mt-3">
            <ScoreBar
              label={bot.name}
              score={oppScore}
              pct={oppPct}
              accent="cyan"
              indicator={opponentAnswered ? "answered" : "thinking"}
            />
          </div>
        )}
      </section>

      <div className="flex justify-center">
        <CountdownRing seconds={timeLeft} total={QUESTION_DURATION} critical={timerCritical} />
      </div>

      <section className="glass rounded-2xl p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge>{q.difficulty}</Badge>
          <Badge variant="cyan">{q.category}</Badge>
        </div>
        <h3 className="text-xl font-semibold leading-snug sm:text-2xl">{q.question}</h3>
      </section>

      <section className="grid gap-2.5">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === correctIndex;
          const revealed = selected !== null;
          let cls = "glass hover:border-primary/60";
          if (revealed && isCorrect) cls = "border-2 border-primary bg-primary/15 text-foreground neon-glow";
          else if (revealed && isSelected && !isCorrect) cls = "border-2 border-destructive bg-destructive/15 text-foreground";
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
            📚 View scientific source (PMID)
          </button>
          <button
            onClick={next}
            className="flex-1 rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground neon-glow transition-transform hover:scale-[1.02]"
          >
            {idx + 1 >= total ? "See results →" : "Next question →"}
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
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> thinking…
            </span>
          )}
          {indicator === "answered" && (
            <span className="text-[10px] uppercase tracking-wider text-cyan-glow">answered</span>
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
        <div className="font-display text-2xl font-bold" style={{ color: critical ? "var(--danger)" : "var(--neon)" }}>
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
        (variant === "primary" ? "bg-primary/15 text-neon" : "bg-accent/15 text-cyan-glow")
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
          <div className="text-[10px] uppercase tracking-widest text-cyan-glow">Scientific source</div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <h4 className="font-display text-lg font-bold">PMID: {q.source_pmid}</h4>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{q.explanation}</p>
        <div className="mt-5 rounded-xl bg-secondary p-3 text-xs">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Correct answer</div>
          <div className="mt-1 font-semibold text-primary">{q.correct_answer}</div>
        </div>
        <a
          href={q.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 block w-full rounded-xl bg-primary px-4 py-3 text-center font-display text-sm font-bold text-primary-foreground neon-glow"
        >
          Open on PubMed ↗
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
  username,
  bot,
  onHome,
  onAgain,
}: {
  results: RoundResult[];
  mode: Mode;
  username: string;
  bot: Bot;
  onHome: () => void;
  onAgain: () => void;
}) {
  const myScore = results.filter((r) => r.correct).length;
  const oppScore = results.filter((r) => r.opponentCorrect).length;
  const total = results.length;
  const won = mode === "bot" ? myScore > oppScore : myScore >= Math.ceil(total / 2);
  const [reviewing, setReviewing] = useState(false);
  const mistakes = results.filter((r) => !r.correct);

  return (
    <div className="space-y-6 fade-in-up">
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          {mode === "bot" ? "Match result" : "Quiz complete"}
        </div>
        <h2
          className={"mt-2 font-display text-5xl font-bold tracking-tight sm:text-6xl count-pop " + (won ? "text-neon" : "text-danger")}
          style={!won ? { color: "var(--danger)", textShadow: "0 0 18px color-mix(in oklab, var(--danger) 60%, transparent)" } : {}}
        >
          {mode === "bot" ? (won ? "VICTORY" : "DEFEAT") : "DONE"}
        </h2>
      </div>

      <section className="glass rounded-2xl p-6">
        {mode === "bot" ? (
          <div className="grid grid-cols-3 items-center gap-3">
            <ScoreColumn label={username} value={myScore} accent="primary" />
            <div className="text-center font-display text-xl text-muted-foreground">VS</div>
            <ScoreColumn label={bot.name} value={oppScore} accent="cyan" />
          </div>
        ) : (
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{username}</div>
            <div className="mt-1 font-display text-6xl font-bold text-neon">{myScore}<span className="text-muted-foreground text-3xl">/{total}</span></div>
            <div className="mt-1 text-xs text-muted-foreground">Correct answers</div>
          </div>
        )}
      </section>

      {!reviewing ? (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {mistakes.length > 0 && (
            <button
              onClick={() => setReviewing(true)}
              className="rounded-xl border border-accent/50 bg-accent/10 px-4 py-3 text-sm font-semibold text-cyan-glow"
            >
              🔬 Review my {mistakes.length} mistake{mistakes.length > 1 ? "s" : ""}
            </button>
          )}
          <button onClick={onAgain} className="rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground neon-glow">
            Play again
          </button>
          <button onClick={onHome} className="rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-foreground sm:col-span-2">
            ← Back to dashboard
          </button>
        </div>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Mistake review</h3>
            <button onClick={() => setReviewing(false)} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
              Close
            </button>
          </div>
          {mistakes.map((m) => (
            <div key={m.question.id} className="glass rounded-2xl p-4">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge>{m.question.difficulty}</Badge>
                <Badge variant="cyan">{m.question.category}</Badge>
              </div>
              <div className="text-sm font-semibold">{m.question.question}</div>
              <div className="mt-3 rounded-lg bg-secondary p-3 text-xs">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Correct answer</div>
                <div className="mt-1 font-semibold text-primary">{m.question.correct_answer}</div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{m.question.explanation}</p>
              <a
                href={m.question.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs font-semibold text-cyan-glow hover:underline"
              >
                PMID: {m.question.source_pmid} ↗
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
      <div className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={"mt-1 font-display text-5xl font-bold " + (accent === "primary" ? "text-neon" : "text-cyan-glow")}>
        {value}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Icons
// ──────────────────────────────────────────────────────────────────────────────

function BoltIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>);
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
