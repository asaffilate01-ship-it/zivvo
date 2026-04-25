import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, FileSearch, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import trustImage from "@/assets/trust-verify.jpg";

const HistoryCheckPromo = () => {
  return (
    <section className="border-y border-border bg-muted/30 py-16">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Image with stat overlay */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative order-2 lg:order-1"
          >
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 blur-xl" />
            <img
              src={trustImage}
              alt="Vehicle history verification"
              loading="lazy"
              className="relative aspect-[4/3] w-full rounded-2xl object-cover shadow-elevated"
            />
            <div className="absolute -bottom-4 -left-4 rounded-2xl border border-border bg-card p-4 shadow-elevated">
              <p className="font-display text-3xl font-bold text-foreground">9/10</p>
              <p className="text-xs text-muted-foreground">Listings carry a basic history check</p>
            </div>
          </motion.div>

          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success">
              <ShieldCheck className="h-3.5 w-3.5" />
              Buy with confidence
            </div>
            <h2 className="mt-3 font-display text-2xl font-bold text-foreground md:text-4xl">
              Every car, fully checked before you commit
            </h2>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Run an instant HPI check to see if a vehicle has outstanding finance, has been written off,
              reported stolen, or has mileage discrepancies — all in one report.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { icon: FileSearch, label: "Full MOT & service history" },
                { icon: AlertTriangle, label: "Theft & write-off check" },
                { icon: CheckCircle2, label: "Outstanding finance check" },
                { icon: ShieldCheck, label: "Mileage verification" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-card-foreground">{f.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/hpi-check">
                <Button size="lg" className="gradient-primary border-0 gap-1.5">
                  Run an HPI check
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/valuation">
                <Button size="lg" variant="outline" className="gap-1.5">
                  Free part-exchange valuation
                </Button>
              </Link>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Reports powered by DVLA &amp; HPI data — instant download.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HistoryCheckPromo;
