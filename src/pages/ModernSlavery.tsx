import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const ModernSlavery = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Modern Slavery Statement — Zivvo"
      description="Zivvo's commitment to preventing modern slavery and human trafficking across our operations and supply chain."
    />
    <Navbar />
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-foreground">Modern Slavery & Human Trafficking Statement</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pursuant to s.54 Modern Slavery Act 2015 — Last updated:{" "}
        {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Our Position</h2>
          <p className="mt-2">
            Zivvo has a zero-tolerance approach to modern slavery, forced labour, and human trafficking.
            We are committed to acting ethically and with integrity in all our business dealings.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Our Business & Supply Chain</h2>
          <p className="mt-2">
            We operate an online vehicle marketplace. Our supply chain primarily consists of cloud
            infrastructure providers, payment processors, marketing partners, and professional services.
            We assess all suppliers for modern slavery risk before engagement.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Policies & Due Diligence</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Anti-slavery clauses in all supplier and dealer contracts.</li>
            <li>Mandatory KYC checks for dealers, including company verification and beneficial ownership.</li>
            <li>Right-to-work checks for all employees and contractors.</li>
            <li>Whistleblower channel via <a href="mailto:ethics@zivvo.co.uk" className="text-primary underline">ethics@zivvo.co.uk</a> with anonymity protection.</li>
            <li>Annual training for staff on identifying and reporting concerns.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Reporting</h2>
          <p className="mt-2">
            If you suspect modern slavery on our platform or supply chain, contact{" "}
            <a href="mailto:ethics@zivvo.co.uk" className="text-primary underline">ethics@zivvo.co.uk</a>{" "}
            or the Modern Slavery Helpline on <strong>08000 121 700</strong>.
          </p>
        </section>
      </div>
    </div>
    <Footer />
  </div>
);

export default ModernSlavery;
