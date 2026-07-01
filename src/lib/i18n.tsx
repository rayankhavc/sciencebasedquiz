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
  accuracy: { en: "Accuracy", fr: "Précision" },
  response: { en: "Response", fr: "Réponse" },

  // Arena
  quit: { en: "← Quit", fr: "← Quitter" },
  question_n: { en: "Question", fr: "Question" },
  you: { en: "You", fr: "Vous" },
  thinking: { en: "thinking…", fr: "réflexion…" },
  answered: { en: "answered", fr: "a répondu" },
  view_source: { en: "📚 View scientific source (PMID)", fr: "📚 Voir la source scientifique (PMID)" },
  next_question: { en: "Next question →", fr: "Question suivante →" },
  see_results: { en: "See results →", fr: "Voir les résultats →" },
  scientific_source: { en: "Scientific source", fr: "Source scientifique" },
  open_pubmed: { en: "Open on PubMed ↗", fr: "Ouvrir sur PubMed ↗" },
  seconds_label: { en: "sec", fr: "s" },

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

  // Online mode - Dashboard
  online_mode: { en: "1v1 Online", fr: "1v1 En ligne" },
  online_mode_sub: { en: "Challenge a real player in real time", fr: "Défiez un vrai joueur en temps réel" },

  // Online mode - Setup
  enter_username_online: { en: "Enter your username to play online", fr: "Entrez votre pseudo pour jouer en ligne" },
  create_room: { en: "Create a room", fr: "Créer une salle" },
  join_room: { en: "Join a room", fr: "Rejoindre une salle" },
  room_code: { en: "Room code", fr: "Code de salle" },
  room_code_placeholder: { en: "e.g. ABCD", fr: "ex : ABCD" },
  join: { en: "Join →", fr: "Rejoindre →" },
  creating_room: { en: "Creating room…", fr: "Création de la salle…" },
  joining_room: { en: "Joining room…", fr: "Rejoindre la salle…" },
  room_not_found: { en: "Room not found or already started", fr: "Salle introuvable ou déjà démarrée" },

  // Online mode - Lobby
  lobby_title: { en: "Lobby", fr: "Salon" },
  your_room_code: { en: "Your room code", fr: "Votre code de salle" },
  share_code: { en: "Share this code with your opponent", fr: "Partagez ce code avec votre adversaire" },
  waiting_opponent: { en: "Waiting for opponent…", fr: "En attente de l'adversaire…" },
  opponent_joined: { en: "Opponent joined!", fr: "L'adversaire a rejoint !" },
  ready_up: { en: "I'm ready!", fr: "Je suis prêt !" },
  waiting_ready: { en: "Waiting for both players to be ready…", fr: "En attente que les deux joueurs soient prêts…" },
  starting_in: { en: "Starting in", fr: "Démarrage dans" },
  copied: { en: "Copied!", fr: "Copié !" },

  // Online mode - Arena
  opponent: { en: "Opponent", fr: "Adversaire" },
  round_of: { en: "Round", fr: "Round" },
  first_correct_wins: { en: "First correct answer wins the round", fr: "La première bonne réponse remporte le round" },
  you_won_round: { en: "You won this round!", fr: "Vous avez remporté ce round !" },
  opponent_won_round: { en: "Opponent won this round!", fr: "L'adversaire a remporté ce round !" },
  tie_round: { en: "Tie — no point", fr: "Égalité — aucun point" },
  opponent_disconnected: { en: "Opponent disconnected", fr: "L'adversaire s'est déconnecté" },
  connection_lost: { en: "Connection lost", fr: "Connexion perdue" },

  // Online mode - Results
  online_victory: { en: "YOU WIN!", fr: "VOUS GAGNEZ !" },
  online_defeat: { en: "YOU LOSE", fr: "VOUS PERDEZ" },
  online_tie: { en: "TIE GAME", fr: "MATCH NUL" },
  final_score: { en: "Final Score", fr: "Score final" },
  play_again_online: { en: "Play again online", fr: "Rejouer en ligne" },
  new_rating: { en: "New rating", fr: "Nouveau rating" },

  // Leaderboard
  leaderboard_title: { en: "Global Leaderboard", fr: "Classement global" },
  leaderboard_sub: { en: "Live rankings updated in real time across all players", fr: "Classement en direct, mis à jour en temps réel pour tous les joueurs" },
  view_leaderboard: { en: "🏆 Leaderboard", fr: "🏆 Classement" },
  live: { en: "LIVE", fr: "EN DIRECT" },
  no_data: { en: "No ranked matches yet. Be the first!", fr: "Aucun match classé pour l'instant. Soyez le premier !" },
  wins_short: { en: "W", fr: "V" },
  losses_short: { en: "L", fr: "D" },
  ties_short: { en: "T", fr: "N" },
  win_rate: { en: "win rate", fr: "victoires" },

  // Footer credit
  made_by: { en: "Made by Raythan Web Design", fr: "Fait par Raythan Web Design" },

  // Quick match (1v1)
  quick_match: { en: "Quick Match", fr: "Match rapide" },
  searching_opponent: { en: "Searching for an opponent…", fr: "Recherche d'un adversaire…" },
  cancel_search: { en: "Cancel", fr: "Annuler" },

  // Party mode (2-4 players)
  party_mode: { en: "Party Mode (2-4)", fr: "Mode Groupe (2-4)" },
  party_mode_sub: { en: "Free-for-all with friends, custom room settings", fr: "Tous contre tous entre amis, paramètres personnalisables" },
  party_setup_title: { en: "Enter your username for Party Mode", fr: "Entrez votre pseudo pour le Mode Groupe" },
  num_players_label: { en: "Number of players", fr: "Nombre de joueurs" },
  question_count_label: { en: "Number of questions", fr: "Nombre de questions" },
  round_duration_label: { en: "Time per question", fr: "Temps par question" },
  party_lobby_title: { en: "Party Lobby", fr: "Salon de groupe" },
  players_joined: { en: "{current}/{max} players", fr: "{current}/{max} joueurs" },
  waiting_for_players: { en: "Waiting for more players to join…", fr: "En attente d'autres joueurs…" },
  start_game: { en: "Start the game", fr: "Lancer la partie" },
  need_two_players: { en: "Need at least 2 ready players to start", fr: "Il faut au moins 2 joueurs prêts pour lancer" },
  host_badge: { en: "Host", fr: "Hôte" },
  waiting_host_start: { en: "Waiting for the host to start the game…", fr: "En attente que l'hôte lance la partie…" },
  room_full: { en: "This room is full", fr: "Cette salle est complète" },
  someone_won_round: { en: "{name} won this round!", fr: "{name} a remporté ce round !" },
  final_rankings: { en: "Final rankings", fr: "Classement final" },
  you_placed: { en: "You placed #{rank}", fr: "Vous avez terminé #{rank}" },
  party_you_won: { en: "YOU WON!", fr: "VOUS GAGNEZ !" },
  player_disconnected: { en: "A player disconnected", fr: "Un joueur s'est déconnecté" },
  players_label: { en: "players", fr: "joueurs" },
  questions_label: { en: "questions", fr: "questions" },
};

export const RAYTHAN_PORTFOLIO_URL = "https://portfolioraythanwebdesign.vercel.app";

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

export function localizeCategory(category: string, lang: Lang) {
  const labels: Record<string, { en: string; fr: string }> = {
    All: { en: "All", fr: "Tout" },
    Nutrition: { en: "Nutrition", fr: "Nutrition" },
    Biomechanics: { en: "Biomechanics", fr: "Biomécanique" },
    Hypertrophy: { en: "Hypertrophy", fr: "Hypertrophie" },
    Physiology: { en: "Physiology", fr: "Physiologie" },
  };
  return labels[category]?.[lang] ?? category;
}

export function localizeDifficulty(difficulty: string, lang: Lang) {
  const labels: Record<string, { en: string; fr: string }> = {
    easy: { en: "Easy", fr: "Facile" },
    medium: { en: "Medium", fr: "Moyen" },
    hardcore: { en: "Hardcore", fr: "Hardcore" },
  };
  return labels[difficulty]?.[lang] ?? difficulty;
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
