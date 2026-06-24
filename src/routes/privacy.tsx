import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "../components/StaticPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — HyperSci Quiz" },
      { name: "description", content: "How HyperSci Quiz collects, uses and protects your personal data." },
      { property: "og:title", content: "Privacy Policy — HyperSci Quiz" },
      { property: "og:description", content: "How we collect, use and protect your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy" eyebrow="Privacy">
      <p>
        This Privacy Policy explains what information HyperSci Quiz collects, how it is used, and
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
        HyperSci Quiz uses only essential cookies and local storage required for the quiz to
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
