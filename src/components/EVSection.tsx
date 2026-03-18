import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Leaf, Battery, Gauge, Fuel } from "lucide-react";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import { useState } from "react";

const EVSection = () => {
  const { config } = useCountry();
  const [fuelCost] = useState(1.55); // per litre
  const [elecCost] = useState(0.28); // per kWh
  const [annualMiles] = useState(10000);

  const petrolCostYear = Math.round((annualMiles / 40) * fuelCost * 4.546); // 40 mpg
  const evCostYear = Math.round((annualMiles / 3.5) * elecCost); // 3.5 mi/kWh

  return (
    <section className="py-16 border-y border-border">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-10 lg:grid-cols-2 items-center"
        >
          <div>
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
              <Zap className="mr-1 h-3 w-3" /> Electric Vehicles
            </Badge>
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              Go Electric.
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent"> Save More.</span>
            </h2>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Explore our growing selection of electric and hybrid vehicles. Lower running costs, zero emissions, and a smoother drive.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { icon: Leaf, label: "Zero Emissions", desc: "No tailpipe emissions" },
                { icon: Battery, label: "Lower Running Costs", desc: `Save ~${formatPrice(petrolCostYear - evCostYear, config)}/year` },
                { icon: Gauge, label: "Instant Torque", desc: "Smooth & responsive" },
                { icon: Fuel, label: "Home Charging", desc: "Charge overnight" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <item.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-card-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <Link to="/browse?fuel=Electric">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                  <Zap className="mr-1 h-4 w-4" /> Browse EVs
                </Button>
              </Link>
              <Link to="/browse?fuel=Hybrid">
                <Button variant="outline">Browse Hybrids</Button>
              </Link>
            </div>
          </div>

          {/* Running Cost Comparison */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <h3 className="font-display text-base font-semibold text-card-foreground mb-4">
              Annual Running Cost Comparison
            </h3>
            <p className="text-xs text-muted-foreground mb-6">Based on {annualMiles.toLocaleString()} miles/year</p>

            <div className="space-y-4">
              {/* Petrol */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1 text-muted-foreground"><Fuel className="h-3.5 w-3.5" /> Petrol (40 MPG)</span>
                  <span className="font-semibold text-foreground">{formatPrice(petrolCostYear, config)}/yr</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: "100%" }} />
                </div>
              </div>

              {/* EV */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1 text-muted-foreground"><Zap className="h-3.5 w-3.5" /> Electric (3.5 mi/kWh)</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatPrice(evCostYear, config)}/yr</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(evCostYear / petrolCostYear) * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-emerald-500/10 p-4 text-center">
              <p className="text-xs text-muted-foreground">You could save</p>
              <p className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatPrice(petrolCostYear - evCostYear, config)}
              </p>
              <p className="text-xs text-muted-foreground">per year by switching to electric</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default EVSection;
