import LegalLayout from "@/components/LegalLayout";

export const metadata = {
  title: "Privacy Policy | Jol Energy",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="June 2026">
      <p>
        This Privacy Policy explains how the Jol Energy Intelligence Platform
        (the &ldquo;Platform&rdquo;) handles information. Jol Energy Pvt. Ltd. is
        a Li-ion battery recycling company, and this Platform is a business
        intelligence dashboard for its supplier, buyer, collection, and
        market-intelligence pipelines.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account information.</strong> When you sign up or sign in we
          process your email address and authentication details through Google
          Firebase Authentication. We never see or store your password.
        </li>
        <li>
          <strong>Usage analytics.</strong> Aggregated, anonymous usage events
          (page views, feature interactions) are collected via Firebase
          Analytics to help us understand how the Platform is used.
        </li>
        <li>
          <strong>Pipeline data.</strong> The supplier, buyer, collection, and
          market figures shown in the dashboard are sourced from public
          registries and curated datasets — not from you.
        </li>
      </ul>

      <h2>AI assistant</h2>
      <p>
        Questions you ask the in-app AI assistant, together with the dashboard
        data needed to answer them, are sent to Google&rsquo;s Gemini API to
        generate a response. Please do not enter confidential personal data into
        the chat. AI responses are generated automatically and may be
        inaccurate.
      </p>

      <h2>How we use information</h2>
      <ul>
        <li>To authenticate you and provide access to the dashboard.</li>
        <li>To operate, maintain, and improve the Platform.</li>
        <li>To generate AI insights in response to your requests.</li>
      </ul>

      <h2>Third-party services</h2>
      <p>
        We rely on <strong>Google Firebase</strong> (authentication and
        analytics), the <strong>Google Gemini API</strong> (AI insights), and{" "}
        <strong>Vercel</strong> (hosting). Each processes data under its own
        privacy terms.
      </p>

      <h2>Your choices</h2>
      <p>
        You may request deletion of your account and associated authentication
        record at any time by contacting us. You can also stop using the
        Platform, which ends any further data collection.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Reach us via our{" "}
        <a href="/contact">contact page</a>.
      </p>

      <p>
        <em>
          Note: this Platform is a demonstration / evaluation project and is not
          a commercial production service.
        </em>
      </p>
    </LegalLayout>
  );
}
