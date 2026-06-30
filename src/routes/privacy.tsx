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
          <li><strong>Pseudo :</strong> le nom que vous saisissez avant de jouer. Utilisé pour personnaliser votre écran de résultats et, en mode en ligne, pour vous identifier auprès de votre adversaire et sur le classement public.</li>
          <li><strong>Activité de quiz :</strong> réponses sélectionnées, scores et durées, stockés localement dans votre navigateur pour faire fonctionner l'expérience solo et bot.</li>
          <li><strong>Identifiant anonyme (mode en ligne) :</strong> en mode 1v1 en ligne, un identifiant anonyme est généré via l'authentification anonyme de Supabase pour relier vos parties à un classement persistant (rating, victoires, défaites). Aucune information personnelle identifiable (email, mot de passe) n'est requise ni collectée pour cet identifiant.</li>
          <li><strong>Données techniques :</strong> journaux standards (type de navigateur, IP anonymisée, horodatage) collectés pour la sécurité et la performance.</li>
        </ul>
        <h2>Classement public</h2>
        <p>
          Si vous jouez en mode 1v1 en ligne, votre pseudo, votre rating et vos statistiques de
          victoires/défaites/nuls sont affichés publiquement sur la page Classement, visible par tous
          les visiteurs du site. N'utilisez pas votre nom réel ou des informations sensibles comme pseudo.
        </p>
        <h2>Utilisation des données</h2>
        <ul>
          <li>Faire fonctionner le quiz, noter vos réponses et afficher vos résultats.</li>
          <li>Synchroniser les parties en temps réel entre deux joueurs et calculer le classement.</li>
          <li>Améliorer la qualité des questions, corriger les bugs et superviser la fiabilité du service.</li>
          <li>Respecter les obligations légales applicables.</li>
        </ul>
        <h2>Partage</h2>
        <p>
          Nous ne vendons pas vos données personnelles. Le mode en ligne et le classement reposent sur
          l'infrastructure de <strong>Supabase</strong> (base de données et synchronisation en temps réel) ;
          le site est hébergé sur <strong>Vercel</strong>. Ces prestataires traitent les données strictement
          dans la mesure nécessaire au fonctionnement de la plateforme.
        </p>
        <h2>Cookies et stockage local</h2>
        <p>
          Science Based Quiz n'utilise que des cookies et un stockage local strictement nécessaires
          au fonctionnement du quiz (préférences de langue/thème, session de jeu). Tout cookie d'analyse
          optionnel, s'il était activé à l'avenir, demanderait au préalable votre consentement.
        </p>
        <h2>Vos droits</h2>
        <p>
          Selon votre juridiction (RGPD, CCPA, etc.), vous disposez d'un droit d'accès, de
          rectification, de suppression ou de limitation du traitement de vos données personnelles,
          ainsi que d'un droit d'opposition et de portabilité. Pour les exercer, contactez
          <strong> contact@sciencebasedquiz.app</strong>.
        </p>
        <h2>Conservation</h2>
        <p>
          Les données stockées localement restent dans votre navigateur jusqu'à ce que vous les
          effaciez. Les données de classement (mode en ligne) sont conservées tant que votre profil
          anonyme existe ; vous pouvez en demander la suppression à tout moment via le contact ci-dessus.
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
        <li><strong>Username:</strong> the name you enter before playing. Used to personalize your results screen and, in online mode, to identify you to your opponent and on the public leaderboard.</li>
        <li><strong>Quiz activity:</strong> answers selected, scores and timing data, stored locally in your browser to power the solo and bot experience.</li>
        <li><strong>Anonymous identifier (online mode):</strong> in 1v1 online mode, an anonymous identifier is generated via Supabase anonymous authentication to link your matches to a persistent ranking (rating, wins, losses). No personally identifiable information (email, password) is required or collected for this identifier.</li>
        <li><strong>Technical data:</strong> standard logs (browser type, anonymized IP, timestamps) collected for security and performance.</li>
      </ul>
      <h2>Public leaderboard</h2>
      <p>
        If you play 1v1 online mode, your username, rating and win/loss/tie record are displayed
        publicly on the Leaderboard page, visible to all site visitors. Do not use your real name or
        sensitive information as your username.
      </p>
      <h2>How we use your data</h2>
      <ul>
        <li>To run the quiz, score your answers and display results.</li>
        <li>To synchronize matches in real time between two players and compute the leaderboard.</li>
        <li>To improve question quality, fix bugs and monitor service reliability.</li>
        <li>To comply with applicable legal obligations.</li>
      </ul>
      <h2>Sharing</h2>
      <p>
        We do not sell your personal data. Online mode and the leaderboard run on <strong>Supabase</strong>
        infrastructure (database and real-time sync); the site itself is hosted on <strong>Vercel</strong>.
        These providers process data strictly to the extent necessary to operate the platform.
      </p>
      <h2>Cookies and local storage</h2>
      <p>
        Science Based Quiz uses only essential cookies and local storage required for the quiz to
        function (language/theme preferences, game session). Optional analytics cookies, if enabled in
        the future, will request your consent first.
      </p>
      <h2>Your rights</h2>
      <p>
        Depending on your jurisdiction (GDPR, CCPA, etc.), you have the right to access,
        rectify, delete or restrict the processing of your personal data, and to object to
        processing or request portability. To exercise these rights, contact
        <strong> contact@sciencebasedquiz.app</strong>.
      </p>
      <h2>Data retention</h2>
      <p>
        Locally stored data remains in your browser until you clear it. Leaderboard data (online mode)
        is retained for as long as your anonymous profile exists; you may request its deletion at any
        time via the contact above.
      </p>
      <h2>Updates</h2>
      <p>
        This policy may be updated to reflect changes in our practices or applicable law. The
        latest version is always available on this page.
      </p>
    </StaticPage>
  );
}
