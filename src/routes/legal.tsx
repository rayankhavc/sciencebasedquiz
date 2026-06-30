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
          Ce site est édité par <strong>[Nom de la société]</strong>, [forme juridique], dont
          le siège social est situé au <strong>[Adresse du siège]</strong>.<br />
          Numéro d'immatriculation : <strong>[N° RCS / SIREN]</strong><br />
          Numéro de TVA : <strong>[N° TVA]</strong>
        </p>
        <h2>Directeur de la publication</h2>
        <p><strong>[Nom du directeur de la publication]</strong></p>
        <h2>Contact</h2>
        <p>Pour toute demande : <strong>contact@[votre-domaine].com</strong></p>
        <h2>Hébergement</h2>
        <p>
          Ce site est hébergé par <strong>[Nom de l'hébergeur]</strong>, dont le siège est situé au
          <strong> [Adresse de l'hébergeur]</strong>.
        </p>
        <h2>Propriété intellectuelle</h2>
        <p>
          L'ensemble des contenus (textes, questions, graphismes, logos, code) est la propriété
          exclusive de l'éditeur, sauf mention contraire. Toute reproduction, représentation ou
          diffusion, totale ou partielle, sans autorisation écrite préalable est strictement interdite.
        </p>
        <h2>Responsabilité</h2>
        <p>
          Les contenus de Science Based Quiz sont fournis à titre éducatif uniquement et ne
          constituent ni un avis médical, ni nutritionnel, ni d'entraînement. Consultez toujours un
          professionnel qualifié avant d'appliquer une information à votre entraînement, votre
          alimentation ou votre santé.
        </p>
        <h2>Droit applicable</h2>
        <p>
          Les présentes mentions légales sont régies par le droit <strong>[juridiction]</strong>.
        </p>
      </StaticPage>
    );
  }
  return (
    <StaticPage title="Legal Notice" eyebrow="Legal">
      <h2>Publisher</h2>
      <p>
        This website is published by <strong>[Company Name]</strong>, [legal form], with
        registered office at <strong>[Registered Address]</strong>.<br />
        Registration number: <strong>[Company Registration Number]</strong><br />
        VAT number: <strong>[VAT Number]</strong>
      </p>
      <h2>Publication director</h2>
      <p><strong>[Name of Publication Director]</strong></p>
      <h2>Contact</h2>
      <p>For any inquiry: <strong>contact@[your-domain].com</strong></p>
      <h2>Hosting</h2>
      <p>
        This website is hosted by <strong>[Hosting Provider Name]</strong>, located at
        <strong> [Hosting Provider Address]</strong>.
      </p>
      <h2>Intellectual property</h2>
      <p>
        All content (texts, questions, graphics, logos, code) is the exclusive property of the
        publisher unless otherwise stated. Any reproduction, representation or distribution,
        in whole or in part, without prior written consent is strictly prohibited.
      </p>
      <h2>Liability</h2>
      <p>
        The content of Science Based Quiz is provided for educational purposes only and does not
        constitute medical, nutritional or training advice. Always consult a qualified
        professional before applying any information from this platform to your training,
        diet or health.
      </p>
      <h2>Applicable law</h2>
      <p>
        This legal notice is governed by the laws of <strong>[Jurisdiction]</strong>.
      </p>
    </StaticPage>
  );
}
