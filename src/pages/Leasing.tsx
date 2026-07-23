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
        title="Leasing-Rechner — Auto leasen ab günstiger Monatsrate | Zivvo"
        description="Berechnen Sie Ihre monatliche Leasingrate in Sekunden. Kilometerleasing für Privat- und Gewerbekunden mit deutschen Leasingpartnern. Unverbindlich & transparent."
      />
      <Navbar />
      <main className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Leasing-Rechner
            </h1>
            <p className="mt-2 text-muted-foreground">
              Sofortige monatliche Leasingrate — Kilometerleasing für Privat- und Gewerbekunden.
              Ohne Bonitätsanfrage, ohne Verpflichtung.
            </p>
          </div>

          <LeasingCalculator />

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Feature icon={ShieldCheck} title="TÜV-geprüfte Partner" body="Nur zertifizierte deutsche Leasinggeber." />
            <Feature icon={Zap} title="Antwort in 24h" body="Verbindliches Angebot binnen einem Werktag." />
            <Feature icon={Users} title="Privat & Gewerbe" body="Konditionen für alle Kundengruppen." />
            <Feature icon={CheckCircle2} title="Ohne Anzahlung" body="Auf Wunsch 0 € Anzahlung möglich." />
          </div>

          <Card className="mt-8">
            <CardContent className="prose prose-sm max-w-none pt-6 text-muted-foreground">
              <h3 className="font-display text-foreground">Was ist Kilometerleasing?</h3>
              <p>
                Beim Kilometerleasing zahlen Sie eine feste Monatsrate für eine vereinbarte
                Laufzeit und Jahreskilometerleistung. Am Vertragsende geben Sie das Fahrzeug
                einfach zurück — kein Restwertrisiko, keine Verwertungsprobleme.
              </p>
              <h3 className="font-display text-foreground">Voraussetzungen</h3>
              <ul>
                <li>Volljährigkeit und deutscher Wohnsitz</li>
                <li>Positive Bonitätsprüfung (Schufa)</li>
                <li>Für Gewerbekunden: Handelsregisterauszug / Gewerbeanmeldung</li>
              </ul>
              <p className="text-xs">
                Repräsentatives Beispiel: Nettokreditbetrag 30.000 €, Laufzeit 36 Monate,
                eff. Jahreszins 4,9 %. Alle Angaben unverbindlich.
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
