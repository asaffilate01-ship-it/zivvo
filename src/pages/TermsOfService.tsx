import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const TermsOfService = () => (
  <div className="min-h-screen bg-background">
    <SEOHead title="Terms of Service — AutoVault" description="Read the terms and conditions for using AutoVault's vehicle marketplace." />
    <Navbar />
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-foreground">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p className="mt-2">By accessing or using AutoVault, you agree to be bound by these Terms of Service. If you do not agree, you may not use our platform.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">2. User Accounts</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>You must provide accurate information when creating an account.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You must be at least 18 years old to use AutoVault.</li>
            <li>One person may not maintain multiple accounts.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">3. Listings</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Sellers are responsible for the accuracy of their listing information.</li>
            <li>Listings must not contain fraudulent, misleading, or illegal content.</li>
            <li>AutoVault reserves the right to remove any listing at its discretion.</li>
            <li>Images must be of the actual vehicle being sold.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">4. Transactions</h2>
          <p className="mt-2">AutoVault is a marketplace platform. We are not a party to any transaction between buyers and sellers. We do not guarantee the condition, legality, or safety of listed vehicles. Buyers should conduct their own due diligence.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">5. Dealer Subscriptions</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Dealer plans are billed monthly via Stripe.</li>
            <li>Subscriptions auto-renew unless cancelled before the next billing period.</li>
            <li>You can manage or cancel your subscription from your dashboard.</li>
            <li>Listing limits apply based on your subscription tier.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">6. Prohibited Conduct</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Posting false, fraudulent, or misleading listings.</li>
            <li>Harassing, threatening, or abusing other users.</li>
            <li>Attempting to circumvent security measures or access other users' accounts.</li>
            <li>Using AutoVault for any illegal purpose.</li>
            <li>Scraping or automated data collection without permission.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">7. Limitation of Liability</h2>
          <p className="mt-2">AutoVault is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the platform, including but not limited to losses from vehicle transactions.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">8. Changes to Terms</h2>
          <p className="mt-2">We may update these terms from time to time. Continued use of AutoVault after changes constitutes acceptance of the new terms.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">9. Contact</h2>
          <p className="mt-2">For questions about these terms, contact us at legal@autovault.co.</p>
        </section>
      </div>
    </div>
    <Footer />
  </div>
);

export default TermsOfService;
