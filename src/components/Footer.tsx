import { Link } from "react-router-dom";
import { Car } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <div className="gradient-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <Car className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold">AutoVault</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              The trusted marketplace for buying and selling vehicles. Verified listings, transparent history.
            </p>
          </div>

          {[
            {
              title: "Marketplace",
              links: [
                { label: "Browse Cars", to: "/browse" },
                { label: "Sell Your Car", to: "/sell" },
                { label: "Finance Check", to: "/finance-check" },
                { label: "Car Valuation", to: "/valuation" },
              ],
            },
            {
              title: "For Business",
              links: [
                { label: "Dealer Plans", to: "/dealers" },
                { label: "Agent Program", to: "/agents" },
                { label: "Advertising", to: "/advertise" },
                { label: "API Access", to: "/api" },
              ],
            },
            {
              title: "Support",
              links: [
                { label: "Help Centre", to: "/help" },
                { label: "Contact Us", to: "/contact" },
                { label: "Privacy Policy", to: "/privacy" },
                { label: "Terms of Service", to: "/terms" },
              ],
            },
          ].map((section) => (
            <div key={section.title}>
              <h4 className="font-display font-semibold text-foreground">{section.title}</h4>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} AutoVault. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
