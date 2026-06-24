import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "../components/StaticPage";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Legal Notice — HyperSci Quiz" },
      { name: "description", content: "Legal notice and publication information for HyperSci Quiz." },
      { property: "og:title", content: "Legal Notice — HyperSci Quiz" },
      { property: "og:description", content: "Legal notice and publication information." },
    ],
  }),
  component: LegalPage,
});

function LegalPage() {
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
        The content of HyperSci Quiz is provided for educational purposes only and does not
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
