import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Code2, Database, FileCode2, FileSpreadsheet, ShieldCheck } from "lucide-react";

const formats = [
  { icon: Code2, title: "JSON", description: "Strukturierte Fahrzeugdaten per HTTPS POST übertragen." },
  { icon: FileCode2, title: "XML", description: "Bestehende XML-Fahrzeugfeeds mit stabiler externer Referenz anbinden." },
  { icon: FileSpreadsheet, title: "CSV", description: "CSV-Export mit Kopfzeile für einfache Bestandsübernahmen nutzen." },
];

const controls = [
  ["Schlüssel pro Händler", "API-Schlüssel lassen sich einzeln erstellen, rotieren und widerrufen."],
  ["Prüfung vor Veröffentlichung", "Neue Feed-Fahrzeuge starten im Prüfstatus und gehen nicht ungeprüft live."],
  ["Nachvollziehbare Importe", "Erstellte, aktualisierte und abgewiesene Datensätze werden protokolliert."],
];

const DealerIntegrations = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="DMS-Anbindung & Fahrzeugfeeds | Zivvo für Händler"
      description="Übertragen Sie Ihren Fahrzeugbestand sicher per JSON, XML oder CSV zu Zivvo."
      canonical="https://zivvo.de/dealers/integrations"
    />
    <Navbar />

    <main>
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <Badge variant="outline" className="mb-4">Händler-Integrationen</Badge>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
            Fahrzeugbestand sicher <span className="text-gradient-primary">anbinden</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-lg">
            Die provider-neutrale Ingest-API nimmt JSON-, XML- und CSV-Daten entgegen.
            Jeder Import wird protokolliert und neue Fahrzeuge werden vor der Veröffentlichung geprüft.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/dealers"><Button size="lg" className="gradient-primary border-0">Händlerangebote ansehen <ArrowRight className="ml-1.5 h-4 w-4" /></Button></Link>
            <a href="#api"><Button size="lg" variant="outline">API-Übersicht</Button></a>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className="font-display text-2xl font-bold">Drei unterstützte Datenformate</h2>
        <p className="mt-1 text-sm text-muted-foreground">Nutzen Sie das Format, das Ihr DMS zuverlässig exportiert.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {formats.map(({ icon: Icon, title, description }) => (
            <Card key={title}><CardContent className="p-5"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div><h3 className="mt-3 font-display text-lg font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p></CardContent></Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className="font-display text-2xl font-bold">Produktionsreife Importkontrollen</h2>
        <p className="mt-1 text-sm text-muted-foreground">Direkte Anbieter-Integrationen werden erst nach technischer Zertifizierung veröffentlicht.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {controls.map(([title, description]) => (
            <Card key={title}><CardContent className="p-5"><ShieldCheck className="h-6 w-6 text-primary" /><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p></CardContent></Card>
          ))}
        </div>
      </section>

      <section id="api" className="border-t border-border bg-secondary/30">
        <div className="container mx-auto grid gap-8 px-4 py-12 lg:grid-cols-2">
          <div>
            <Badge variant="outline" className="mb-3">Authentifizierte API</Badge>
            <h2 className="font-display text-2xl font-bold">Zivvo Stock Ingest API</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Erzeugen Sie im Händler-Dashboard unter <strong>Integrationen</strong> einen Schlüssel. Wiederholte Importe aktualisieren
              über <code className="rounded bg-muted px-1">external_ref</code> denselben Datensatz.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {["Idempotente Aktualisierung per externer Referenz", "Mengen- und Größenbegrenzungen pro Anfrage", "Schlüssel jederzeit widerrufbar", "HTTPS-Bilder und validierte Pflichtfelder"].map((item) => (
                <li key={item} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-success" /> {item}</li>
              ))}
            </ul>
            <Link to="/dashboard" className="mt-6 inline-block"><Button>Integrationen öffnen <ArrowRight className="ml-1.5 h-4 w-4" /></Button></Link>
          </div>
          <Card>
            <CardContent className="p-5">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase text-muted-foreground"><Database className="h-3.5 w-3.5" /> POST /functions/v1/stock-ingest</div>
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">{`curl -X POST https://<project-ref>.supabase.co/functions/v1/stock-ingest \\
  -H "X-Zivvo-Api-Key: zvk_..." \\
  -H "Content-Type: application/json" \\
  -d '{"vehicles":[{
    "external_ref":"STK-1001",
    "make":"BMW",
    "model":"3er",
    "year":2021,
    "price":18995,
    "mileage":28400,
    "registration":"B-ZV 2101"
  }]}'`}</pre>
              <p className="mt-3 text-xs text-muted-foreground">XML und CSV werden mit dem passenden <code>Content-Type</code> ebenfalls akzeptiert.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="font-display text-2xl font-bold">Sie betreiben ein DMS?</h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">Wir prüfen gemeinsam Datenmodell, Authentifizierung, Fehlerbehandlung und Supportprozess für eine zertifizierte Anbindung.</p>
        <Link to="/contact" className="mt-4 inline-block"><Button variant="outline">Integration besprechen</Button></Link>
      </section>
    </main>
    <Footer />
  </div>
);

export default DealerIntegrations;
