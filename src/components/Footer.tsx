import { Link } from "react-router-dom";
import CountrySwitcher from "@/components/CountrySwitcher";
import zivvoLogo from "@/assets/zivvo-logo.png";

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
      { label: "Complaints", to: "/complaints" },
      { label: "Accessibility", to: "/accessibility" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
      { label: "Cookie Policy", to: "/cookies" },
      { label: "GDPR & Data Rights", to: "/gdpr" },
      { label: "Modern Slavery", to: "/modern-slavery" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-6">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5" aria-label="Zivvo home">
              <img src={zivvoLogo} alt="Zivvo — Vehicle Marketplace" className="h-10 w-auto" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The trusted marketplace for buying and selling vehicles. Verified listings, transparent history, and secure transactions.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Zivvo Ltd · Registered in England & Wales · Company No. 00000000<br />
              Registered office: 1 Example Street, London, EC1A 1AA<br />
              ICO Registration: ZA000000 · VAT: GB 000 0000 00
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
              © {new Date().getFullYear()} Zivvo. All rights reserved.
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
