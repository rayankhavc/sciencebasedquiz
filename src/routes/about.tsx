import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "../components/StaticPage";
import { useLang } from "../lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Why This Platform? — Science Based Quiz" },
      { name: "description", content: "Our mission: debunk bro-science with rigorous, evidence-based training and nutrition data sourced from peer-reviewed research." },
      { property: "og:title", content: "Why This Platform? — Science Based Quiz" },
      { property: "og:description", content: "Debunking bro-science with peer-reviewed evidence." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { lang } = useLang();
  if (lang === "fr") {
    return (
      <StaticPage title="Pourquoi cette plateforme ?" eyebrow="À propos">
        <p>
          Le monde du fitness croule sous les opinions assurées, les rumeurs de salle de sport et
          les avis d'influenceurs recyclés en « savoir commun ». Science Based Quiz a été créé pour y répondre.
        </p>
        <h2>Notre mission</h2>
        <p>
          Construire une plateforme où chaque affirmation que vous testez repose sur de la recherche
          évaluée par les pairs. Nous transformons des articles denses de sciences du sport en questions
          de quiz claires et compétitives, pour que pratiquants, coachs et étudiants affûtent une vraie
          compréhension — et pas seulement des slogans.
        </p>
        <h2>Ce qui nous différencie</h2>
        <ul>
          <li><strong>Citations sur chaque réponse.</strong> Chaque question renvoie à une référence PubMed (PMID) que vous pouvez consulter.</li>
          <li><strong>Difficulté catégorisée.</strong> De la nutrition de base à la mécanotransduction et à l'hypertrophie liée à l'étirement.</li>
          <li><strong>Des bots, pas de bro-science.</strong> Affrontez des bots calibrés en vitesse et précision — sans faux « live ».</li>
        </ul>
        <h2>Pour qui ?</h2>
        <p>
          Pratiquants avancés, coachs, étudiants en STAPS ou kinésiologie, et toute personne qui veut
          remplacer « j'ai entendu dire que… » par « la littérature montre que… ». Si vous cherchez un
          partenaire d'entraînement pour vos connaissances, c'est ici.
        </p>
      </StaticPage>
    );
  }
  return (
    <StaticPage title="Why This Platform?" eyebrow="About">
      <p>
        The fitness world is drowning in confident opinions, broken telephone gym lore, and
        influencer hot takes recycled into "common knowledge." Science Based Quiz exists to push back.
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
