import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Accessibility = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Accessibility Statement — Zivvo"
      description="Zivvo's commitment to WCAG 2.1 AA accessibility standards and how to report issues."
    />
    <Navbar />
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-foreground">Accessibility Statement</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated:{" "}
        {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Our Commitment</h2>
          <p className="mt-2">
            Zivvo is committed to making our platform accessible to everyone, regardless of ability or
            technology. We aim to meet <strong>WCAG 2.1 Level AA</strong> standards across the website and apps.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">What We Do</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Semantic HTML and ARIA landmarks for screen-reader compatibility.</li>
            <li>Full keyboard navigation, visible focus indicators, and skip-links.</li>
            <li>Minimum 4.5:1 colour contrast across all text in both light and dark themes.</li>
            <li>Resizable text up to 200% without loss of content.</li>
            <li>Alt text on meaningful images; captions and transcripts on video content.</li>
            <li>Accessible form labels and clear error messages.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Known Limitations</h2>
          <p className="mt-2">
            Some user-uploaded vehicle photos may lack descriptive alt text. We are working with sellers
            to improve this and provide automated suggestions where possible.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Reporting Accessibility Issues</h2>
          <p className="mt-2">
            If you encounter any accessibility barriers, please email{" "}
            <a href="mailto:accessibility@zivvo.co.uk" className="text-primary underline">accessibility@zivvo.co.uk</a>.
            We aim to respond within 5 working days.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Enforcement</h2>
          <p className="mt-2">
            If you are not satisfied with our response, you can contact the Equality Advisory and Support
            Service (EASS):{" "}
            <a href="https://www.equalityadvisoryservice.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              equalityadvisoryservice.com
            </a>
          </p>
        </section>
      </div>
    </div>
    <Footer />
  </div>
);

export default Accessibility;
