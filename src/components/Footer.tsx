import { Link } from "react-router-dom";
import { Car } from "lucide-react";
import CountrySwitcher from "@/components/CountrySwitcher";

const footerSections = [
  {
    title: "Marketplace",
    links: [
      { label: "Browse Cars", to: "/browse" },
      { label: "Sell Your Car", to: "/sell" },
      { label: "Saved Cars", to: "/saved" },
      { label: "Compare Cars", to: "/compare" },
      { label: "Blog & Guides", to: "/blog" },
    ],
  },
  {
    title: "For Business",
    links: [
      { label: "Dealer Plans", to: "/dealers" },
      { label: "Trade Stock", to: "/trade-stock" },
      { label: "Agent Program", to: "/contact" },
      { label: "Dealer Dashboard", to: "/dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Help Centre", to: "/help" },
      { label: "Contact Us", to: "/contact" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="gradient-primary flex h-9 w-9 items-center justify-center rounded-xl">
                <Car className="h-4.5 w-4.5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">AutoSouq</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The trusted marketplace for buying and selling vehicles. Verified listings, transparent history, and secure transactions.
            </p>
            <div className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-success" />
              All systems operational
            </div>
          </div>

          {/* Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-display text-sm font-semibold text-foreground">{section.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Country Switcher + Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <div className="flex items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} AutoSouq. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <CountrySwitcher variant="full" />
            <div className="flex gap-6">
              {[
                { label: "Privacy", to: "/privacy" },
                { label: "Terms", to: "/terms" },
                { label: "Cookies", to: "/privacy#cookies" },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
