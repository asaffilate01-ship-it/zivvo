import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const CookiePolicy = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Cookie Policy — Zivvo"
      description="How Zivvo uses cookies and similar technologies, and how to manage your preferences."
    />
    <Navbar />
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-foreground">Cookie Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated:{" "}
        {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">1. What Are Cookies?</h2>
          <p className="mt-2">
            Cookies are small text files stored on your device when you visit a website. They help
            sites function properly, remember your preferences, and provide analytics.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">2. Categories We Use</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-foreground">Category</th>
                  <th className="px-3 py-2 text-foreground">Purpose</th>
                  <th className="px-3 py-2 text-foreground">Lifetime</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 font-semibold text-foreground">Strictly necessary</td>
                  <td className="px-3 py-2">Authentication, security, load balancing.</td>
                  <td className="px-3 py-2">Session – 1 year</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 font-semibold text-foreground">Functional</td>
                  <td className="px-3 py-2">Theme, country, recently viewed cars.</td>
                  <td className="px-3 py-2">Up to 1 year</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 font-semibold text-foreground">Analytics</td>
                  <td className="px-3 py-2">Anonymised usage stats (no personal identifiers).</td>
                  <td className="px-3 py-2">Up to 2 years</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 font-semibold text-foreground">Marketing</td>
                  <td className="px-3 py-2">Re-targeting and conversion tracking (optional).</td>
                  <td className="px-3 py-2">Up to 90 days</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">3. Managing Cookies</h2>
          <p className="mt-2">
            You can manage your preferences via the cookie banner shown on first visit, or by clearing
            cookies in your browser settings. Disabling strictly necessary cookies will prevent core features from working.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">4. Third-Party Cookies</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Stripe</strong> — payments and fraud prevention.</li>
            <li><strong>Google Maps</strong> — location and distance features.</li>
            <li><strong>Cloudflare</strong> — security and performance.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">5. Contact</h2>
          <p className="mt-2">
            Questions? Email{" "}
            <a href="mailto:privacy@zivvo.co.uk" className="text-primary underline">privacy@zivvo.co.uk</a>.
          </p>
        </section>
      </div>
    </div>
    <Footer />
  </div>
);

export default CookiePolicy;
