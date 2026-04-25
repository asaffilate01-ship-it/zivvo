import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const GDPR = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="GDPR & Data Rights — Zivvo"
      description="Your rights under UK GDPR and how Zivvo handles personal data — access, rectification, erasure, portability, and more."
    />
    <Navbar />
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-foreground">GDPR & Your Data Rights</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated:{" "}
        {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">1. Our Commitment</h2>
          <p className="mt-2">
            Zivvo is fully committed to compliance with the UK General Data Protection Regulation
            (UK GDPR) and the Data Protection Act 2018. We act as a data controller for the personal
            information you share with us, and we take a privacy-by-design approach to all features.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">2. Lawful Basis for Processing</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Contract:</strong> To provide marketplace services you sign up for.</li>
            <li><strong>Legitimate interests:</strong> To prevent fraud, secure our platform, and improve functionality.</li>
            <li><strong>Consent:</strong> For marketing emails and non-essential cookies — you can withdraw at any time.</li>
            <li><strong>Legal obligation:</strong> To comply with anti-money laundering, tax, and consumer protection law.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">3. Your Rights</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Right to access</strong> — request a copy of personal data we hold about you.</li>
            <li><strong>Right to rectification</strong> — correct inaccurate or incomplete data.</li>
            <li><strong>Right to erasure ("right to be forgotten")</strong> — request deletion of your account and data.</li>
            <li><strong>Right to restrict processing</strong> — limit how we use your data in certain cases.</li>
            <li><strong>Right to data portability</strong> — receive your data in a machine-readable format.</li>
            <li><strong>Right to object</strong> — object to processing based on legitimate interests or direct marketing.</li>
            <li><strong>Rights related to automated decision-making</strong> — request human review of automated decisions.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">4. How to Exercise Your Rights</h2>
          <p className="mt-2">
            Email <a href="mailto:privacy@zivvo.co.uk" className="text-primary underline">privacy@zivvo.co.uk</a>{" "}
            with your request. We respond within <strong>30 days</strong> as required by UK GDPR. You may need to
            verify your identity. There is no charge unless requests are excessive or repetitive.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">5. Data Retention</h2>
          <p className="mt-2">
            We keep your data only for as long as needed to provide services or meet legal obligations:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Account data — until you delete your account, plus 30 days for backup purges.</li>
            <li>Transaction records — 6 years (HMRC requirement).</li>
            <li>Marketing preferences — until you withdraw consent.</li>
            <li>Anonymised analytics — indefinitely.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">6. International Transfers</h2>
          <p className="mt-2">
            Where data is transferred outside the UK or EEA, we use Standard Contractual Clauses
            and the UK International Data Transfer Addendum to ensure adequate protection.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">7. Data Security</h2>
          <p className="mt-2">
            We use industry-standard encryption (TLS 1.3 in transit, AES-256 at rest), strict access
            controls, audit logging, and Row-Level Security on all databases. Payment information is
            handled by PCI-DSS compliant providers — we never store card details.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">8. Data Breaches</h2>
          <p className="mt-2">
            In the unlikely event of a data breach affecting your rights, we will notify the ICO
            within 72 hours and inform affected users without undue delay.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">9. Complaints to the ICO</h2>
          <p className="mt-2">
            If you are unhappy with how we handle your data, you may complain to the Information
            Commissioner's Office:{" "}
            <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              ico.org.uk
            </a>{" "}
            · 0303 123 1113.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">10. Data Protection Officer</h2>
          <p className="mt-2">
            Contact our Data Protection Officer at{" "}
            <a href="mailto:dpo@zivvo.co.uk" className="text-primary underline">dpo@zivvo.co.uk</a>.
          </p>
        </section>
      </div>
    </div>
    <Footer />
  </div>
);

export default GDPR;
