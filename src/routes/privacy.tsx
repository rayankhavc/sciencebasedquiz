import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "../components/StaticPage";
import { useLang } from "../lib/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Science Based Quiz" },
      { name: "description", content: "How Science Based Quiz collects, uses and protects your personal data." },
      { property: "og:title", content: "Privacy Policy — Science Based Quiz" },
      { property: "og:description", content: "How we collect, use and protect your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { lang } = useLang();
  if (lang === "fr") {
    return (
      <StaticPage title="Politique de confidentialité" eyebrow="Confidentialité">
        <p>
          Cette politique explique quelles informations Science Based Quiz collecte, comment elles
          sont utilisées et les droits dont vous disposez. En utilisant la plateforme, vous acceptez
          les pratiques décrites ici.
        </p>
        <h2>Données collectées</h2>
        <ul>
          <li><strong>Pseudo :</strong> le nom que vous saisissez avant le Mode Solo. Utilisé uniquement pour personnaliser votre écran de résultats.</li>
          <li><strong>Activité de quiz :</strong> réponses sélectionnées, scores et durées, stockés localement dans votre navigateur pour faire fonctionner l'expérience.</li>
          <li><strong>Données techniques :</strong> journaux standards (type de navigateur, IP anonymisée, horodatage) collectés pour la sécurité et la performance.</li>
        </ul>
        <h2>Utilisation des données</h2>
        <ul>
          <li>Faire fonctionner le quiz, noter vos réponses et afficher vos résultats.</li>
          <li>Améliorer la qualité des questions, corriger les bugs et superviser la fiabilité du service.</li>
          <li>Respecter les obligations légales applicables.</li>
        </ul>
        <h2>Partage</h2>
        <p>
          Nous ne vendons pas vos données personnelles. Nous les partageons uniquement avec des
          prestataires de confiance (hébergement, analytics), sous stricte confidentialité et dans
          la stricte mesure nécessaire au fonctionnement de la plateforme.
        </p>
        <h2>Cookies</h2>
        <p>
          Science Based Quiz n'utilise que des cookies et un stockage local strictement nécessaires
          au fonctionnement du quiz. Tout cookie d'analyse optionnel, s'il était activé à l'avenir,
          demanderait au préalable votre consentement.
        </p>
        <h2>Vos droits</h2>
        <p>
          Selon votre juridiction (RGPD, CCPA, etc.), vous disposez d'un droit d'accès, de
          rectification, de suppression ou de limitation du traitement de vos données personnelles,
          ainsi que d'un droit d'opposition et de portabilité. Pour les exercer, contactez
          <strong> privacy@[votre-domaine].com</strong>.
        </p>
        <h2>Conservation</h2>
        <p>
          Les données stockées localement restent dans votre navigateur jusqu'à ce que vous les
          effaciez. Les journaux techniques sont conservés pour une durée limitée, conformément aux
          exigences de sécurité et légales.
        </p>
        <h2>Mises à jour</h2>
        <p>
          Cette politique peut évoluer pour refléter nos pratiques ou la législation applicable. La
          dernière version est toujours disponible sur cette page.
        </p>
      </StaticPage>
    );
  }
  return (
    <StaticPage title="Privacy Policy" eyebrow="Privacy">
      <p>
        This Privacy Policy explains what information Science Based Quiz collects, how it is used, and
        the rights you have over it. By using the platform, you agree to the practices described
        here.
      </p>
      <h2>Data we collect</h2>
      <ul>
        <li><strong>Username:</strong> the name you enter before playing Solo Mode. Used only to personalize your results screen.</li>
        <li><strong>Quiz activity:</strong> answers selected, scores and timing data, stored locally in your browser to power the experience.</li>
        <li><strong>Technical data:</strong> standard logs (browser type, anonymized IP, timestamps) collected for security and performance.</li>
      </ul>
      <h2>How we use your data</h2>
      <ul>
        <li>To run the quiz, score your answers and display results.</li>
        <li>To improve question quality, fix bugs and monitor service reliability.</li>
        <li>To comply with applicable legal obligations.</li>
      </ul>
      <h2>Sharing</h2>
      <p>
        We do not sell your personal data. We only share data with trusted service providers
        (hosting, analytics) under strict confidentiality and only to the extent necessary to
        operate the platform.
      </p>
      <h2>Cookies</h2>
      <p>
        Science Based Quiz uses only essential cookies and local storage required for the quiz to
        function. Optional analytics cookies, if enabled in the future, will request your
        consent first.
      </p>
      <h2>Your rights</h2>
      <p>
        Depending on your jurisdiction (GDPR, CCPA, etc.), you have the right to access,
        rectify, delete or restrict the processing of your personal data, and to object to
        processing or request portability. To exercise these rights, contact
        <strong> privacy@[your-domain].com</strong>.
      </p>
      <h2>Data retention</h2>
      <p>
        Locally stored data remains in your browser until you clear it. Technical logs are
        retained for a limited period as required for security and legal purposes.
      </p>
      <h2>Updates</h2>
      <p>
        This policy may be updated to reflect changes in our practices or applicable law. The
        latest version is always available on this page.
      </p>
    </StaticPage>
  );
}
