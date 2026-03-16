import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background">
    <SEOHead title="Privacy Policy — AutoVault" description="Learn how AutoVault collects, uses, and protects your personal data." />
    <Navbar />
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-foreground">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">1. Who We Are</h2>
          <p className="mt-2">AutoVault is an online marketplace for buying and selling vehicles. This policy explains how we collect, use, store, and protect your personal data in compliance with the UK GDPR and Data Protection Act 2018.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">2. Data We Collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Account data:</strong> Name, email address, phone number, and profile photo when you create an account.</li>
            <li><strong>Listing data:</strong> Vehicle details, images, location, and pricing you provide when creating a listing.</li>
            <li><strong>Communication data:</strong> Messages and enquiries exchanged between buyers and sellers.</li>
            <li><strong>Usage data:</strong> Pages visited, search queries, device information, and IP address (anonymised).</li>
            <li><strong>Payment data:</strong> Processed securely by Stripe. We do not store card numbers.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">3. How We Use Your Data</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>To provide and maintain our marketplace services.</li>
            <li>To facilitate communication between buyers and sellers.</li>
            <li>To process dealer subscriptions and payments.</li>
            <li>To send service-related notifications (enquiry alerts, listing updates).</li>
            <li>To improve our platform through anonymised analytics.</li>
            <li>To detect and prevent fraud or misuse.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">4. Legal Basis for Processing</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Contract:</strong> Processing necessary to provide our services (account creation, listings, messaging).</li>
            <li><strong>Legitimate interest:</strong> Analytics, fraud prevention, and platform improvement.</li>
            <li><strong>Consent:</strong> Optional marketing communications and non-essential cookies.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">5. Data Sharing</h2>
          <p className="mt-2">We do not sell your personal data. We share data only with:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Other users:</strong> Your name and contact details are shared with buyers/sellers when you communicate.</li>
            <li><strong>Payment processor:</strong> Stripe processes payments securely.</li>
            <li><strong>Hosting provider:</strong> Our infrastructure is hosted on secure, GDPR-compliant servers.</li>
            <li><strong>Law enforcement:</strong> When required by law or to protect our legal rights.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">6. Data Retention</h2>
          <p className="mt-2">Account data is retained while your account is active. Listing data is retained for 12 months after a listing expires or is sold. You can request deletion of your data at any time via your account settings.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">7. Your Rights</h2>
          <p className="mt-2">Under GDPR, you have the right to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Access</strong> your personal data.</li>
            <li><strong>Rectify</strong> inaccurate data.</li>
            <li><strong>Erase</strong> your data ("right to be forgotten").</li>
            <li><strong>Restrict</strong> processing of your data.</li>
            <li><strong>Data portability</strong> — receive your data in a structured format.</li>
            <li><strong>Object</strong> to processing based on legitimate interest.</li>
            <li><strong>Withdraw consent</strong> at any time.</li>
          </ul>
          <p className="mt-2">To exercise any of these rights, use the settings in your Profile page or contact us at privacy@autovault.co.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">8. Cookies</h2>
          <p className="mt-2">We use essential cookies for authentication and session management. Analytics cookies are only used with your consent. You can manage your cookie preferences at any time via the cookie banner.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">9. Contact</h2>
          <p className="mt-2">For privacy-related enquiries, email us at privacy@autovault.co.</p>
        </section>
      </div>
    </div>
    <Footer />
  </div>
);

export default PrivacyPolicy;
