import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, ArrowRight, Code2, Database, FileSpreadsheet, FileCode2 } from "lucide-react";

const partners = [
  {
    name: "VirtualYard",
    status: "live",
    site: "https://virtualyard.co.uk",
    direction: "Two-way",
    blurb: "Pull stock automatically from your Virtual Yard inventory; enquiries and deposits push back into your VY inbox.",
  },
  { name: "AutoTrader feed", status: "live", site: null, direction: "Inbound XML", blurb: "Drop your existing AutoTrader-style XML feed straight into Zivvo with no remapping." },
  { name: "Click Dealer", status: "beta", site: "https://www.clickdealer.co.uk", direction: "Inbound", blurb: "Push stock via the public ingest endpoint. Lead push-back coming soon." },
  { name: "Auto-IT (DragonDMS)", status: "beta", site: null, direction: "Inbound", blurb: "Compatible with the JSON ingest API. Talk to support to map your feed." },
  { name: "iVendi", status: "planned", site: null, direction: "Inbound", blurb: "Direct integration on the roadmap." },
  { name: "GForces NetDirector", status: "planned", site: null, direction: "Inbound", blurb: "Native sync planned Q3." },
  { name: "Codeweavers", status: "planned", site: null, direction: "Inbound", blurb: "Finance-aware feed mapping planned." },
  { name: "Manual CSV", status: "live", site: null, direction: "Inbound CSV", blurb: "Upload a spreadsheet — perfect for dealers without a DMS." },
];

const formats = [
  { icon: Code2, title: "JSON", desc: "Modern REST. POST { vehicles: [...] } to the ingest endpoint." },
  { icon: FileCode2, title: "XML", desc: "AutoTrader-style <stock><vehicle/></stock> feed. Drop-in compatible." },
  { icon: FileSpreadsheet, title: "CSV", desc: "Header row + comma rows. Ideal for manual or legacy DMS exports." },
];

const statusBadge = (status: string) => {
  if (status === "live") return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="mr-1 h-3 w-3" /> Live</Badge>;
  if (status === "beta") return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Beta</Badge>;
  return <Badge variant="outline">Planned</Badge>;
};

const DealerIntegrations = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="DMS Integrations & Stock Feeds | Zivvo for Dealers"
        description="Connect your Dealer Management System (DMS) to Zivvo. Sync stock from VirtualYard, AutoTrader feeds, Click Dealer and more — JSON, XML or CSV."
        canonical="https://zivvo.de/dealers/integrations"
      />
      <Navbar />

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <Badge variant="outline" className="mb-4">Dealer integrations</Badge>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
            Plug your stock into Zivvo in <span className="text-gradient-primary">minutes</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-lg">
            Whatever DMS you use, your inventory belongs on Zivvo. Two-way sync with the leading
            providers, an open ingest API for the rest, and CSV upload as a fallback — no manual
            re-keying, ever.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/dealers"><Button size="lg" className="gradient-primary border-0">View dealer plans <ArrowRight className="ml-1.5 h-4 w-4" /></Button></Link>
            <a href="#api"><Button size="lg" variant="outline">Read the API docs</Button></a>
          </div>
        </div>
      </section>

      {/* Formats */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="font-display text-2xl font-bold">Three ways to send stock</h2>
        <p className="mt-1 text-sm text-muted-foreground">Use whichever your DMS already supports.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {formats.map((f) => (
            <Card key={f.title}>
              <CardContent className="p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Partner list */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="font-display text-2xl font-bold">Supported DMS partners</h2>
        <p className="mt-1 text-sm text-muted-foreground">Don't see yours? The open ingest API works with anything.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((p) => (
            <Card key={p.name} className="hover-lift">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                  {statusBadge(p.status)}
                </div>
                <Badge variant="outline" className="mt-2 text-[10px]">{p.direction}</Badge>
                <p className="mt-2 text-sm text-muted-foreground">{p.blurb}</p>
                {p.site && (
                  <a href={p.site} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs font-medium text-primary hover:underline">
                    Visit {p.name} →
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* API quick start */}
      <section id="api" className="border-t border-border bg-secondary/30">
        <div className="container mx-auto grid gap-8 px-4 py-12 lg:grid-cols-2">
          <div>
            <Badge variant="outline" className="mb-3">Public API</Badge>
            <h2 className="font-display text-2xl font-bold">Zivvo Stock Ingest API</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Generate a key from your dealer dashboard → <strong>Integrations</strong>, then have your DMS POST stock to a single
              endpoint. Re-imports update in place using your <code className="rounded bg-muted px-1">external_ref</code>.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-success" /> Idempotent upsert by external reference</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-success" /> Per-key audit trail in your dashboard</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-success" /> Revoke or rotate keys at any time</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-success" /> Source badge shown on listings for transparency</li>
            </ul>
            <Link to="/dashboard" className="mt-6 inline-block">
              <Button>Open Integrations <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-5">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase text-muted-foreground">
                <Database className="h-3.5 w-3.5" /> POST /functions/v1/stock-ingest
              </div>
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">
{`curl -X POST https://api.zivvo.de/functions/v1/stock-ingest \\
  -H "X-Zivvo-Api-Key: zvk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "vehicles": [{
      "external_ref": "STK-1001",
      "make": "BMW",
      "model": "3 Series",
      "year": 2021,
      "price": 18995,
      "mileage": 28400,
      "registration": "BD21 ABC",
      "images": ["https://.../1.jpg"]
    }]
  }'`}
              </pre>
              <p className="mt-3 text-xs text-muted-foreground">
                XML and CSV are also accepted — set the matching <code>Content-Type</code>. GET the URL for full docs.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="font-display text-2xl font-bold">Are you a DMS provider?</h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Get listed here and offer your dealers a one-click Zivvo connection. We'll co-build and co-market.
        </p>
        <Link to="/contact" className="mt-4 inline-block">
          <Button variant="outline">Become a partner</Button>
        </Link>
      </section>

      <Footer />
    </div>
  );
};

export default DealerIntegrations;
