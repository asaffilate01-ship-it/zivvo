import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, Clock, FileText } from "lucide-react";

const ComplaintsPolicy = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Complaints Policy — Zivvo"
      description="How to raise a complaint with Zivvo. Our resolution process, response times, and escalation routes including the Motor Ombudsman."
    />
    <Navbar />
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-foreground">Complaints Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated:{" "}
        {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><Clock className="h-5 w-5 text-primary" /><p className="mt-2 text-xs text-muted-foreground">Acknowledged within</p><p className="font-display font-semibold">2 business days</p></CardContent></Card>
        <Card><CardContent className="p-4"><FileText className="h-5 w-5 text-primary" /><p className="mt-2 text-xs text-muted-foreground">Resolution target</p><p className="font-display font-semibold">8 weeks</p></CardContent></Card>
        <Card><CardContent className="p-4"><Mail className="h-5 w-5 text-primary" /><p className="mt-2 text-xs text-muted-foreground">Email us</p><p className="font-display text-sm font-semibold">complaints@zivvo.co.uk</p></CardContent></Card>
      </div>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">1. Our Commitment</h2>
          <p className="mt-2">
            We take all complaints seriously and aim to resolve them quickly, fairly, and transparently.
            This policy applies to complaints about Zivvo as a platform — for disputes with a specific
            seller or dealer, please first contact them directly.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">2. How to Make a Complaint</h2>
          <p className="mt-2">You can contact us in any of the following ways:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Email:</strong> <a href="mailto:complaints@zivvo.co.uk" className="text-primary underline">complaints@zivvo.co.uk</a></li>
            <li><strong>Phone:</strong> 0800 000 0000 (Mon–Fri 9am–6pm)</li>
            <li><strong>Post:</strong> Zivvo Complaints, PO Box 1234, London, EC1A 1AA</li>
            <li><strong>Online form:</strong> Via our <a href="/contact" className="text-primary underline">Contact Us</a> page.</li>
          </ul>
          <p className="mt-3">Please include:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Your full name, account email, and a contact number.</li>
            <li>Listing or order reference (if applicable).</li>
            <li>A clear description of what went wrong and the outcome you would like.</li>
            <li>Any supporting documents, screenshots, or correspondence.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">3. Our Process</h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5">
            <li><strong>Acknowledgement (within 2 business days):</strong> We confirm receipt and assign a case reference.</li>
            <li><strong>Investigation (within 14 days):</strong> A dedicated case handler reviews evidence, contacts relevant parties, and may request more information.</li>
            <li><strong>Initial response (within 28 days):</strong> We send a written response with our findings, any actions taken, and remedies offered.</li>
            <li><strong>Final response (within 8 weeks):</strong> If unresolved, we issue a final response letter explaining your right to escalate.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">4. Escalation</h2>
          <p className="mt-2">
            If you remain dissatisfied after our final response, you may refer the matter to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>The Motor Ombudsman</strong> — for vehicle sale disputes with accredited dealers.{" "}
              <a href="https://www.themotorombudsman.org" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                themotorombudsman.org
              </a>
            </li>
            <li>
              <strong>Citizens Advice</strong> — free consumer guidance.{" "}
              <a href="https://www.citizensadvice.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                citizensadvice.org.uk
              </a>{" "}
              · 0808 223 1133.
            </li>
            <li>
              <strong>Trading Standards</strong> — for unfair trading or misleading practices.
            </li>
            <li>
              <strong>The ICO</strong> — for data protection complaints.{" "}
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary underline">ico.org.uk</a>
            </li>
            <li>
              <strong>Online Dispute Resolution (ODR):</strong>{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                ec.europa.eu/consumers/odr
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">5. Vulnerable Customers</h2>
          <p className="mt-2">
            We provide additional support to customers in vulnerable circumstances — including
            accessible communications, longer response windows on request, and support from a senior case handler.
            Please tell us if you need extra support and we will adapt our process.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">6. Recording & Reporting</h2>
          <p className="mt-2">
            All complaints are logged in our case management system. We review trends quarterly to
            improve our services and report annually on root causes and resolution times.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">7. No-Cost Process</h2>
          <p className="mt-2">
            Our complaints process is free of charge. You do not need a solicitor — but you are welcome
            to be represented by anyone of your choice.
          </p>
        </section>
      </div>
    </div>
    <Footer />
  </div>
);

export default ComplaintsPolicy;
