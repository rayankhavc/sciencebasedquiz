import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "../components/StaticPage";
import { useLang } from "../lib/i18n";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Legal Notice — Science Based Quiz" },
      { name: "description", content: "Legal notice and publication information for Science Based Quiz." },
      { property: "og:title", content: "Legal Notice — Science Based Quiz" },
      { property: "og:description", content: "Legal notice and publication information." },
    ],
  }),
  component: LegalPage,
});

function LegalPage() {
  const { lang } = useLang();
  if (lang === "fr") {
    return (
      <StaticPage title="Mentions légales" eyebrow="Légal">
        <h2>Éditeur</h2>
        <p>
          Science Based Quiz est un projet indépendant, éducatif et à but non lucratif, créé et
          maintenu par <strong>Raythan</strong>. Il n'est pas opéré par une société commerciale enregistrée.
        </p>
        <h2>Contact</h2>
        <p>Pour toute question, suggestion ou signalement, vous pouvez écrire à : <strong>contact@sciencebasedquiz.app</strong></p>
        <h2>Hébergement</h2>
        <p>
          Ce site est hébergé sur l'infrastructure de <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133,
          Walnut, CA 91789, États-Unis. La fonctionnalité de jeu en ligne (mode 1v1 et classement) utilise
          en complément les services d'infrastructure de <strong>Supabase</strong> pour la synchronisation en temps réel.
        </p>
        <h2>Propriété intellectuelle</h2>
        <p>
          L'ensemble du code, du design, de la sélection et de la formulation des questions est la
          propriété de l'éditeur, sauf mention contraire. Les données scientifiques citées proviennent
          de publications tierces accessibles publiquement via PubMed et restent la propriété de leurs
          auteurs respectifs. Toute reproduction substantielle du contenu sans autorisation est interdite.
        </p>
        <h2>Avertissement</h2>
        <p>
          Les contenus de Science Based Quiz sont fournis à titre éducatif et informatif uniquement et ne
          constituent ni un avis médical, ni nutritionnel, ni d'entraînement personnalisé. Consultez
          toujours un professionnel de santé qualifié avant d'appliquer une information de cette
          plateforme à votre entraînement, votre alimentation ou votre santé.
        </p>
        <h2>Disponibilité du service</h2>
        <p>
          Le site est fourni « tel quel », sans garantie de disponibilité continue. Des interruptions
          temporaires peuvent survenir pour maintenance ou en raison de facteurs hors de notre contrôle.
        </p>
      </StaticPage>
    );
  }
  return (
    <StaticPage title="Legal Notice" eyebrow="Legal">
      <h2>Publisher</h2>
      <p>
        Science Based Quiz is an independent, non-commercial educational project created and
        maintained by <strong>Raythan</strong>. It is not operated by a registered company.
      </p>
      <h2>Contact</h2>
      <p>For any question, suggestion or report, you can reach out at: <strong>contact@sciencebasedquiz.app</strong></p>
      <h2>Hosting</h2>
      <p>
        This website is hosted on infrastructure provided by <strong>Vercel Inc.</strong>, 340 S Lemon
        Ave #4133, Walnut, CA 91789, USA. The online multiplayer feature (1v1 mode and leaderboard) additionally
        uses <strong>Supabase</strong> infrastructure for real-time synchronization.
      </p>
      <h2>Intellectual property</h2>
      <p>
        All code, design, question selection and wording are the property of the publisher unless
        otherwise stated. Cited scientific data originates from third-party publications publicly
        available via PubMed and remains the property of their respective authors. Substantial
        reproduction of the content without authorization is prohibited.
      </p>
      <h2>Disclaimer</h2>
      <p>
        The content of Science Based Quiz is provided for educational and informational purposes only
        and does not constitute medical, nutritional or personalized training advice. Always consult a
        qualified healthcare professional before applying any information from this platform to your
        training, diet or health.
      </p>
      <h2>Service availability</h2>
      <p>
        The site is provided "as is" without any guarantee of continuous availability. Temporary
        interruptions may occur for maintenance or due to factors outside our control.
      </p>
    </StaticPage>
  );
}
