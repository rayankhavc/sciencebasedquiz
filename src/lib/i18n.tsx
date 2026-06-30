import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "fr";

type Dict = Record<string, { en: string; fr: string }>;

const DICT: Dict = {
  // TopBar / Footer
  why_platform: { en: "WHY THIS PLATFORM?", fr: "POURQUOI CETTE PLATEFORME ?" },
  toggle_theme: { en: "Toggle theme", fr: "Changer le thème" },
  toggle_lang: { en: "Switch language", fr: "Changer de langue" },
  legal: { en: "Legal Notice", fr: "Mentions légales" },
  privacy: { en: "Privacy Policy", fr: "Confidentialité" },
  copyright: { en: "© Science Based Quiz", fr: "© Science Based Quiz" },

  // Dashboard
  mission: { en: "MISSION", fr: "MISSION" },
  mission_body: {
    en: "Test your knowledge of biomechanics, hypertrophy and sports nutrition with questions sourced from peer-reviewed research. Every answer links to a PubMed citation.",
    fr: "Évaluez vos connaissances en biomécanique, hypertrophie et nutrition sportive avec des questions issues de recherches évaluées par les pairs. Chaque réponse renvoie à une citation PubMed.",
  },
  bot_arena: { en: "1v1 Bot Arena", fr: "Arène 1v1 contre Bot" },
  bot_arena_sub: { en: "Pick a bot and challenge it head-to-head", fr: "Choisissez un bot et affrontez-le en duel" },
  solo_mode: { en: "Solo Mode", fr: "Mode Solo" },
  solo_mode_sub: { en: "Train at your own pace, no opponent", fr: "Entraînez-vous à votre rythme, sans adversaire" },

  // Username
  enter_username: { en: "Enter your username", fr: "Entrez votre pseudo" },
  username_placeholder: { en: "e.g. HypertrophyFan", fr: "ex : FanHypertrophie" },
  back: { en: "← Back", fr: "← Retour" },
  continue: { en: "Continue →", fr: "Continuer →" },

  // Bot select
  choose_opponent: { en: "Choose your opponent", fr: "Choisissez votre adversaire" },

  // Category select
  vs_label: { en: "vs", fr: "contre" },
  solo_label: { en: "Solo Mode", fr: "Mode Solo" },
  choose_category: { en: "Choose a category", fr: "Choisissez une catégorie" },
  quiz_length: { en: "Quiz length", fr: "Longueur du quiz" },
  available: { en: "available", fr: "disponibles" },
  question_time: { en: "Time per question", fr: "Temps par question" },
  seconds_short: { en: "s", fr: "s" },
  start_match: { en: "Start the match", fr: "Lancer le match" },
  start_quiz: { en: "Start the quiz", fr: "Lancer le quiz" },

  // Arena
  quit: { en: "← Quit", fr: "← Quitter" },
  question_n: { en: "Question", fr: "Question" },
  you: { en: "You", fr: "Vous" },
  thinking: { en: "thinking…", fr: "réflexion…" },
  answered: { en: "answered", fr: "a répondu" },
  view_source: { en: "📚 View scientific source (PMID)", fr: "📚 Voir la source scientifique (PMID)" },
  next_question: { en: "Next question →", fr: "Question suivante →" },
  see_results: { en: "See results →", fr: "Voir les résultats →" },

  // Results
  results_title: { en: "Results", fr: "Résultats" },
  play_again: { en: "Play again", fr: "Rejouer" },
  home: { en: "Home", fr: "Accueil" },
  match_result: { en: "Match result", fr: "Résultat du match" },
  quiz_complete: { en: "Quiz complete", fr: "Quiz terminé" },
  victory: { en: "VICTORY", fr: "VICTOIRE" },
  defeat: { en: "DEFEAT", fr: "DÉFAITE" },
  done: { en: "DONE", fr: "TERMINÉ" },
  correct_answers: { en: "Correct answers", fr: "Bonnes réponses" },
  review_one: { en: "Review my mistake", fr: "Revoir mon erreur" },
  review_many: { en: "Review my {n} mistakes", fr: "Revoir mes {n} erreurs" },
  back_dashboard: { en: "← Back to dashboard", fr: "← Retour au tableau de bord" },
  mistake_review: { en: "Mistake review", fr: "Revue des erreurs" },
  close: { en: "Close", fr: "Fermer" },
  correct_answer_label: { en: "Correct answer", fr: "Bonne réponse" },
  share: { en: "Share my result", fr: "Partager mon résultat" },
  share_copied: { en: "Result copied to clipboard", fr: "Résultat copié dans le presse-papier" },
};

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: keyof typeof DICT) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => DICT[k]?.en ?? String(k),
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("sbq-lang") as Lang | null;
      if (stored === "en" || stored === "fr") setLangState(stored);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { window.localStorage.setItem("sbq-lang", l); } catch {}
  };

  const t = (k: keyof typeof DICT) => DICT[k]?.[lang] ?? DICT[k]?.en ?? String(k);
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}

// Question-level localizer
export type LocalizableQuestion = {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  question_fr?: string;
  options_fr?: string[];
  correct_answer_fr?: string;
  explanation_fr?: string;
};

export function localizeQuestion<Q extends LocalizableQuestion>(q: Q, lang: Lang) {
  if (lang === "fr" && q.question_fr && q.options_fr && q.options_fr.length === q.options.length) {
    const correctIdx = q.options.indexOf(q.correct_answer);
    return {
      question: q.question_fr,
      options: q.options_fr,
      correct_answer: q.options_fr[correctIdx] ?? q.correct_answer,
      explanation: q.explanation_fr ?? q.explanation,
    };
  }
  return {
    question: q.question,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
  };
}
