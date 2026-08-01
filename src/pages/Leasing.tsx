import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import LeasingCalculator from "@/components/LeasingCalculator";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ShieldCheck, Zap, Users } from "lucide-react";

const Leasing = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Leasing-Kostenrechner — unverbindliche Orientierung | Zivvo"
        description="Variieren Sie Fahrzeugpreis, Laufzeit, Kilometerleistung und Beispielzins für eine unverbindliche Leasing-Kostenorientierung. Kein Angebot und keine Kreditentscheidung."
      />
      <Navbar />
      <main className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Leasing-Kostenrechner
            </h1>
            <p className="mt-2 text-muted-foreground">
              Unverbindliche Kostenorientierung für Kilometerleasing. Die Eingaben werden nur
              für das Rechenbeispiel verwendet; es wird kein Antrag gestellt.
            </p>
          </div>

          <LeasingCalculator />

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Feature icon={ShieldCheck} title="Keine Antragstellung" body="Die Berechnung löst keine Bonitätsprüfung aus." />
            <Feature icon={Zap} title="Annahmen anpassbar" body="Zins, Laufzeit und Kilometerleistung selbst variieren." />
            <Feature icon={Users} title="Nur Orientierung" body="Tatsächliche Angebote können deutlich abweichen." />
            <Feature icon={CheckCircle2} title="Kosten transparent" body="Anzahlung und Rechenfaktoren bleiben sichtbar." />
          </div>

          <Card className="mt-8">
            <CardContent className="prose prose-sm max-w-none pt-6 text-muted-foreground">
              <h3 className="font-display text-foreground">Was ist Kilometerleasing?</h3>
              <p>
                Beim Kilometerleasing zahlen Sie eine feste Monatsrate für eine vereinbarte
                Laufzeit und Jahreskilometerleistung. Am Vertragsende geben Sie das Fahrzeug
                grundsätzlich zurück. Mehr- oder Minderkilometer, Schäden und Rückgabebedingungen
                richten sich nach dem konkreten Vertrag.
              </p>
              <h3 className="font-display text-foreground">Vor einem Vertragsabschluss prüfen</h3>
              <ul>
                <li>Gesamtbetrag, Sonderzahlung und Überführungs- oder Zulassungskosten</li>
                <li>Regelungen für Mehrkilometer, Schäden, Wartung und Rückgabe</li>
                <li>Bonitäts- und Vertragsanforderungen des jeweiligen Leasinggebers</li>
              </ul>
              <p className="text-xs">
                Das Ergebnis ist eine vereinfachte Modellrechnung, kein repräsentatives Beispiel,
                kein Kredit- oder Leasingangebot und keine Aussage zur Verfügbarkeit.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const Feature = ({ icon: Icon, title, body }: { icon: any; title: string; body: string }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <Icon className="h-5 w-5 text-primary" />
    <p className="mt-2 font-medium text-foreground">{title}</p>
    <p className="mt-1 text-xs text-muted-foreground">{body}</p>
  </div>
);

export default Leasing;
