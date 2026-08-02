import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Maximize2, Minimize2, Grid3x3, X,
  Globe, Gavel, Sparkles, Shield, ShoppingBag, Car, Wrench, TrendingUp,
  Users, MapPin, Smartphone, Languages, CreditCard, Building2, BarChart3,
  Zap, Award, Lock, ArrowRight, Phone, Eye, Brain, Target, Handshake,
  Hammer, FileCheck, Truck, MessageSquare, Star, Layers, Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import home from "@/assets/pitch/home.png";
import browse from "@/assets/pitch/browse.png";
import auctions from "@/assets/pitch/auctions.png";
import tradeStock from "@/assets/pitch/trade-stock.png";
import sell from "@/assets/pitch/sell.png";
import dealerPricing from "@/assets/pitch/dealer-pricing.png";
import carDetail from "@/assets/pitch/car-detail.png";
import valuation from "@/assets/pitch/valuation.png";

/* ────────────────────────────────────────────────────────── */
/*  Scaled Slide System (1920 × 1080)                         */
/* ────────────────────────────────────────────────────────── */

const SLIDE_W = 1920;
const SLIDE_H = 1080;

const SlideShell = ({ children, bg = "default" }: { children: ReactNode; bg?: "default" | "dark" | "gradient" | "light" }) => {
  const bgs: Record<string, string> = {
    default: "bg-gradient-to-br from-[#0a0613] via-[#1a0b2e] to-[#0a0613]",
    dark: "bg-[#05030a]",
    gradient: "bg-gradient-to-br from-[#1a0b2e] via-[#3a0f5c] to-[#0a0613]",
    light: "bg-gradient-to-br from-[#1a0b2e] to-[#0a0613]",
  };
  return (
    <div className={`absolute inset-0 ${bgs[bg]} overflow-hidden`}>
      {/* ambient glows */}
      <div className="absolute -top-40 -right-40 w-[800px] h-[800px] rounded-full bg-[hsl(265_75%_58%/0.18)] blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-[700px] h-[700px] rounded-full bg-[hsl(295_75%_60%/0.15)] blur-3xl" />
      <div className="relative z-10 w-full h-full p-20 text-white">{children}</div>
    </div>
  );
};

const ZivvoMark = ({ small }: { small?: boolean }) => (
  <div className={`flex items-center gap-2 font-bold tracking-tight ${small ? "text-base" : "text-2xl"}`}>
    <div className={`${small ? "w-7 h-7 text-xs" : "w-10 h-10 text-base"} rounded-md bg-gradient-to-br from-[hsl(265_75%_58%)] to-[hsl(295_75%_60%)] grid place-items-center font-black text-white`}>Z</div>
    <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">ZIVVO</span>
  </div>
);

const SectionTag = ({ children }: { children: ReactNode }) => (
  <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-[0.2em] uppercase bg-[hsl(265_75%_58%/0.15)] border border-[hsl(265_75%_58%/0.4)] text-[hsl(295_75%_75%)]">
    {children}
  </span>
);

const Stat = ({ value, label, accent }: { value: string; label: string; accent?: boolean }) => (
  <div>
    <div className={`text-7xl font-black ${accent ? "bg-gradient-to-br from-[hsl(295_85%_70%)] to-[hsl(265_75%_58%)] bg-clip-text text-transparent" : "text-white"}`}>{value}</div>
    <div className="text-white/60 mt-2 text-lg">{label}</div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <div className="rounded-2xl p-6 bg-white/[0.03] border border-white/10 backdrop-blur-sm hover:border-[hsl(265_75%_58%/0.5)] transition-colors">
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(265_75%_58%)] to-[hsl(295_75%_60%)] grid place-items-center mb-4">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-white/60 text-base leading-relaxed">{desc}</p>
  </div>
);

const PhoneFrame = ({ src, alt }: { src: string; alt: string }) => (
  <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-[0_30px_80px_-20px_rgba(124,58,237,0.5)]">
    <img src={src} alt={alt} className="block w-full h-auto" />
  </div>
);

/* ────────────────────────────────────────────────────────── */
/*  Slides                                                    */
/* ────────────────────────────────────────────────────────── */

const slides: { title: string; node: ReactNode }[] = [
  /* 1 — TITLE */
  {
    title: "Cover",
    node: (
      <SlideShell bg="gradient">
        <div className="flex flex-col h-full justify-between">
          <ZivvoMark />
          <div className="max-w-5xl">
            <SectionTag>Investor · Dealer · Customer Deck</SectionTag>
            <h1 className="text-[140px] leading-[0.95] font-black mt-8 tracking-tight">
              The vehicle marketplace,
              <span className="block bg-gradient-to-r from-[hsl(295_85%_70%)] via-[hsl(280_85%_75%)] to-[hsl(265_85%_70%)] bg-clip-text text-transparent">
                rebuilt for 4 continents.
              </span>
            </h1>
            <p className="text-2xl text-white/70 mt-8 max-w-3xl">
              Buy. Sell. Auction. Trade. Inspect. Finance. One platform — UK, USA, Pakistan, UAE.
            </p>
          </div>
          <div className="flex justify-between items-end">
            <div className="text-white/50 text-sm">zivvo.de · zivvo.com · zivvo.pk · zivvo.ae</div>
            <div className="text-white/50 text-sm">2026 Investor Brief</div>
          </div>
        </div>
      </SlideShell>
    ),
  },

  /* 2 — PROBLEM */
  {
    title: "The Problem",
    node: (
      <SlideShell>
        <div className="grid grid-cols-2 gap-16 h-full">
          <div className="flex flex-col justify-center">
            <SectionTag>The Problem</SectionTag>
            <h2 className="text-7xl font-black mt-6 leading-tight">
              Buying a car is still
              <span className="block text-[hsl(295_85%_70%)]">broken.</span>
            </h2>
            <p className="text-xl text-white/70 mt-8 leading-relaxed">
              Buyers don't trust private sellers. Dealers pay €000s/month to legacy portals.
              Cross-border trade is a paperwork nightmare. Auctions are gated to insiders.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-6">
            {[
              { n: "73%", t: "of buyers worry about hidden vehicle history" },
              { n: "€2,400", t: "avg. monthly fee dealers pay to AutoTrader" },
              { n: "11 days", t: "average time to sell privately" },
              { n: "0", t: "platforms unifying UK + USA + South Asia + Gulf" },
            ].map((p) => (
              <div key={p.n} className="flex items-center gap-6 p-5 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="text-5xl font-black bg-gradient-to-br from-[hsl(295_85%_70%)] to-[hsl(265_75%_58%)] bg-clip-text text-transparent w-44">
                  {p.n}
                </div>
                <div className="text-white/80 text-lg">{p.t}</div>
              </div>
            ))}
          </div>
        </div>
      </SlideShell>
    ),
  },

  /* 3 — SOLUTION */
  {
    title: "Solution",
    node: (
      <SlideShell bg="gradient">
        <div className="h-full grid grid-rows-[auto_1fr] gap-12">
          <div>
            <SectionTag>Solution</SectionTag>
            <h2 className="text-8xl font-black mt-6 leading-[0.95]">
              One platform.<br />
              <span className="bg-gradient-to-r from-[hsl(295_85%_70%)] to-[hsl(265_85%_70%)] bg-clip-text text-transparent">Every way to move a car.</span>
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-6">
            <FeatureCard icon={ShoppingBag} title="Marketplace" desc="Verified private + dealer listings with AI price grading and HPI checks." />
            <FeatureCard icon={Gavel} title="Auctions" desc="Open & timed auctions, 3% buyer / 1.5% seller — lowest in the industry." />
            <FeatureCard icon={Handshake} title="Trade Stock" desc="B2B wholesale arbitrage. We source, inspect, sell to dealer network." />
            <FeatureCard icon={Wrench} title="Inspections" desc="Send our 200-point mechanic to any vehicle, anywhere — book in 30s." />
            <FeatureCard icon={CreditCard} title="Finance & Pay" desc="Stripe-secured deposits, monthly cost calculator, finance pre-approval." />
            <FeatureCard icon={Truck} title="Delivery" desc="Quote-driven nationwide vehicle transport built into every listing." />
            <FeatureCard icon={Brain} title="AI Everywhere" desc="Description writer, price indicator, valuation engine, chat assistant." />
            <FeatureCard icon={Building2} title="Dealer SaaS" desc="DMS sync, custom landing pages, sales pipeline, portal syndication." />
          </div>
        </div>
      </SlideShell>
    ),
  },

  /* 4 — HOMEPAGE SCREENSHOT */
  {
    title: "Live Marketplace",
    node: (
      <SlideShell bg="dark">
        <div className="grid grid-cols-[1fr_1.4fr] gap-16 h-full items-center">
          <div>
            <SectionTag>Product · Live Today</SectionTag>
            <h2 className="text-7xl font-black mt-6 leading-tight">Find your perfect drive</h2>
            <p className="text-xl text-white/70 mt-6 leading-relaxed">
              A premium, mobile-first marketplace experience. Real-time listings. Distance-based
              radius search. Save & compare. Built on glassmorphic design that punches above any
              competitor.
            </p>
            <div className="flex gap-10 mt-10">
              <Stat value="DE-wide" label="Vehicle search" accent />
              <Stat value="DE / EN" label="Languages" accent />
              <Stat value="Live" label="Status data" accent />
            </div>
          </div>
          <PhoneFrame src={home} alt="Zivvo home" />
        </div>
      </SlideShell>
    ),
  },

  /* 5 — BROWSE & SEARCH */
  {
    title: "Browse & Search",
    node: (
      <SlideShell>
        <div className="grid grid-cols-[1.3fr_1fr] gap-16 h-full items-center">
          <PhoneFrame src={browse} alt="Browse" />
          <div>
            <SectionTag>Buyer Experience</SectionTag>
            <h2 className="text-6xl font-black mt-6 leading-tight">Search like a pro</h2>
            <ul className="mt-8 space-y-4 text-lg">
              {[
                ["Radius search", "Haversine geo-distance from any postcode"],
                ["AI price indicator", "Above / Fair / Below market on every card"],
                ["Compare tool", "Side-by-side spec sheet, share via web link"],
                ["Saved searches", "Email alerts when matching cars are listed"],
                ["Map view", "Browse by location with live pins"],
                ["Featured boosting", "€X one-off promotion at top of search"],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-[hsl(295_85%_70%)] mt-3 shrink-0" />
                  <div>
                    <span className="font-bold">{t}.</span>{" "}
                    <span className="text-white/70">{d}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SlideShell>
    ),
  },

  /* 6 — CAR DETAIL / SERVICES */
  {
    title: "Car Detail Page",
    node: (
      <SlideShell bg="dark">
        <div className="grid grid-cols-[1fr_1.3fr] gap-16 h-full items-center">
          <div>
            <SectionTag>Conversion Engine</SectionTag>
            <h2 className="text-6xl font-black mt-6 leading-tight">Every action, one click</h2>
            <p className="text-xl text-white/70 mt-6">
              We monetise <span className="text-white font-semibold">every</span> intent on the page.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-8">
              {[
                ["Phone reveal", Phone], ["Send message", MessageSquare],
                ["Make offer", Handshake], ["Book inspection · €249", Shield],
                ["Test drive", Car], ["Delivery quote", Truck],
                ["Finance quote", CreditCard], ["Part exchange", TrendingUp],
              ].map(([t, I]: any) => (
                <div key={t} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10">
                  <I className="w-5 h-5 text-[hsl(295_85%_70%)]" />
                  <span className="text-base">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <PhoneFrame src={carDetail} alt="Car detail" />
        </div>
      </SlideShell>
    ),
  },

  /* 7 — AUCTIONS */
  {
    title: "Auctions",
    node: (
      <SlideShell bg="gradient">
        <div className="grid grid-cols-[1.2fr_1fr] gap-16 h-full items-center">
          <PhoneFrame src={auctions} alt="Auctions" />
          <div>
            <SectionTag>Already Built · Hidden Feature</SectionTag>
            <h2 className="text-6xl font-black mt-6 leading-tight">
              Trusted auctions,<br />
              <span className="text-[hsl(295_85%_70%)]">unlocked.</span>
            </h2>
            <p className="text-xl text-white/70 mt-6 leading-relaxed">
              Every car HPI-checked, every seller verified, every payment Stripe-protected.
              Proxy bidding, reserve pricing, anti-snipe extensions.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="p-5 rounded-2xl bg-white/[0.06] border border-white/10">
                <div className="text-4xl font-black text-[hsl(295_85%_70%)]">3%</div>
                <div className="text-white/70 mt-1">Buyer premium</div>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.06] border border-white/10">
                <div className="text-4xl font-black text-[hsl(295_85%_70%)]">1.5%</div>
                <div className="text-white/70 mt-1">Seller fee</div>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.06] border border-white/10 col-span-2">
                <div className="text-2xl font-bold">vs Copart 9% / BCA 6%</div>
                <div className="text-white/70 mt-1">We undercut every legacy auction house.</div>
              </div>
            </div>
          </div>
        </div>
      </SlideShell>
    ),
  },

  /* 8 — TRADE STOCK / ARBITRAGE */
  {
    title: "Trade Stock",
    node: (
      <SlideShell>
        <div className="grid grid-cols-[1fr_1.2fr] gap-16 h-full items-center">
          <div>
            <SectionTag>B2B Wholesale · Hidden Feature</SectionTag>
            <h2 className="text-6xl font-black mt-6 leading-tight">
              Wholesale arbitrage,<br />
              automated.
            </h2>
            <p className="text-xl text-white/70 mt-6 leading-relaxed">
              We source verified vehicles from private sellers, inspect them, then offer them to
              our dealer network at a small markup. A 10-stage tracked deal lifecycle handles
              paperwork, transport and payment.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3 text-sm">
              {["Source", "Inspect", "Photograph", "List", "Offer", "Accept", "Pay", "Collect", "Deliver", "Settle"].map((s, i) => (
                <div key={s} className="p-3 rounded-lg bg-gradient-to-br from-[hsl(265_75%_58%/0.2)] to-[hsl(295_75%_60%/0.1)] border border-[hsl(265_75%_58%/0.3)]">
                  <span className="text-[hsl(295_85%_70%)] font-bold mr-2">{i + 1}</span>
                  {s}
                </div>
              ))}
            </div>
          </div>
          <PhoneFrame src={tradeStock} alt="Trade stock" />
        </div>
      </SlideShell>
    ),
  },

  /* 9 — INSPECTIONS NETWORK */
  {
    title: "Inspector Network",
    node: (
      <SlideShell bg="dark">
        <div className="h-full flex flex-col">
          <SectionTag>Brand-New · Live</SectionTag>
          <h2 className="text-7xl font-black mt-6 leading-[0.95]">
            Our mechanic.<br />
            <span className="bg-gradient-to-r from-[hsl(295_85%_70%)] to-[hsl(265_85%_70%)] bg-clip-text text-transparent">
              Anywhere in the country.
            </span>
          </h2>
          <p className="text-xl text-white/70 mt-6 max-w-3xl">
            Buyers book a 200-point professional inspection on any listing for €249. We dispatch a
            trained inspector, generate a PDF report, and pay the inspector €120 — fully tracked.
          </p>
          <div className="grid grid-cols-4 gap-6 mt-12 flex-1">
            {[
              { n: "€249", l: "Buyer pays" },
              { n: "€120", l: "Inspector earns" },
              { n: "€129", l: "Zivvo margin / job" },
              { n: "200", l: "Checkpoints" },
            ].map(s => (
              <div key={s.l} className="rounded-3xl p-8 bg-gradient-to-br from-[hsl(265_75%_58%/0.18)] to-transparent border border-[hsl(265_75%_58%/0.3)] flex flex-col justify-end">
                <div className="text-7xl font-black text-white">{s.n}</div>
                <div className="text-white/70 mt-2 text-lg">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-8 text-base">
            {[
              ["Onboarding flow", "Postcode coverage, qualifications, insurance"],
              ["Live job board", "Accept jobs, run checklist, upload report"],
              ["Auto payouts", "Pending → Approved → Paid with audit trail"],
            ].map(([t, d]) => (
              <div key={t} className="p-4 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="font-bold text-white">{t}</div>
                <div className="text-white/60">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </SlideShell>
    ),
  },

  /* 10 — SELL FLOW */
  {
    title: "Sell My Car",
    node: (
      <SlideShell>
        <div className="grid grid-cols-[1fr_1.2fr] gap-16 h-full items-center">
          <div>
            <SectionTag>Seller Flow</SectionTag>
            <h2 className="text-6xl font-black mt-6 leading-tight">
              List a car in <span className="text-[hsl(295_85%_70%)]">5 minutes</span>.
            </h2>
            <p className="text-xl text-white/70 mt-6">
              4-step wizard with AI-assisted descriptions, up to 10 photos and review before publication.
              Private sellers can publish two vehicles per calendar month for free.
            </p>
            <div className="mt-8 space-y-3">
              {[
                "Reg auto-fill: DVLA · MOT history · NHTSA VIN decode",
                "AI description generator (Gemini via Lovable AI gateway)",
                "8-point spec grid + service history + V5C upload",
                "MD5 vehicle fingerprint prevents duplicate dodging",
                "Mandatory KYC: V5C logbook + HPI before approval",
              ].map(t => (
                <div key={t} className="flex gap-3 items-start">
                  <FileCheck className="w-5 h-5 text-[hsl(295_85%_70%)] mt-1 shrink-0" />
                  <span className="text-white/85 text-lg">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <PhoneFrame src={sell} alt="Sell wizard" />
        </div>
      </SlideShell>
    ),
  },

  /* 11 — VALUATION */
  {
    title: "Valuation Engine",
    node: (
      <SlideShell bg="dark">
        <div className="grid grid-cols-[1.2fr_1fr] gap-16 h-full items-center">
          <PhoneFrame src={valuation} alt="Valuation" />
          <div>
            <SectionTag>Lead Magnet</SectionTag>
            <h2 className="text-6xl font-black mt-6 leading-tight">Free instant valuation</h2>
            <p className="text-xl text-white/70 mt-6">
              Drives top-of-funnel signups. Captures vehicle data we use to populate live pricing
              comparables. Doubles as a lead-gen pipeline for our partner dealers.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {["Live market comparables", "Trade-in offer routing", "Part-exchange widget", "Price drop alerts"].map(t => (
                <div key={t} className="p-4 rounded-xl bg-white/[0.04] border border-white/10 text-base">
                  <Sparkles className="inline w-4 h-4 text-[hsl(295_85%_70%)] mr-2" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SlideShell>
    ),
  },

  /* 12 — DEALER PRICING & SaaS */
  {
    title: "Dealer SaaS",
    node: (
      <SlideShell bg="gradient">
        <div className="grid grid-cols-[1fr_1.2fr] gap-16 h-full items-center">
          <div>
            <SectionTag>Recurring Revenue</SectionTag>
            <h2 className="text-6xl font-black mt-6 leading-tight">
              Built to <span className="text-[hsl(295_85%_70%)]">grow dealerships.</span>
            </h2>
            <p className="text-xl text-white/70 mt-6">
              No commission. No contracts. A premium dealer platform that does what AutoTrader,
              CarGurus and Cazoo do — for a fraction of the price.
            </p>
            <div className="mt-8 space-y-3">
              {[
                ["€49.99/mo", "Up to 30 active listings"],
                ["60 days", "Free launch trial"],
                ["Included", "Landing page · analytics · DMS tools"],
              ].map(([p, d]) => (
                <div key={p} className="flex items-center gap-6 p-4 rounded-xl bg-white/[0.05] border border-white/10">
                  <div className="text-3xl font-black text-[hsl(295_85%_70%)] w-32">{p}</div>
                  <div className="text-white/80 text-lg">{d}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-base text-white/60">+17% saving on annual billing</div>
          </div>
          <PhoneFrame src={dealerPricing} alt="Dealer pricing" />
        </div>
      </SlideShell>
    ),
  },

  /* 13 — DEALER TOOLS DEEP DIVE */
  {
    title: "Dealer Toolkit",
    node: (
      <SlideShell>
        <SectionTag>Dealer Toolkit</SectionTag>
        <h2 className="text-7xl font-black mt-6 leading-[0.95]">Every tool a modern dealer needs.</h2>
        <div className="grid grid-cols-4 gap-5 mt-12">
          {[
            [Building2, "Custom landing", "/dealer/:slug — 4-tab page builder, hero layouts"],
            [Layers, "DMS connectors", "Sync from CDK, Pinewood, GForces — auto-import stock"],
            [BarChart3, "Sales pipeline", "Kanban board (dnd-kit) for deal lifecycle"],
            [TrendingUp, "Performance badge", "Auto-rank dealers on response time + reviews"],
            [ShoppingBag, "Reservations", "Stripe deposits hold cars for 48 hours"],
            [Truck, "Transport quotes", "Built-in delivery cost calculator"],
            [Users, "Staff seats", "Multi-user accounts with role permissions"],
            [FileCheck, "CSV bulk export", "Download stockbook on demand"],
            [Eye, "Listing analytics", "Views, leads, source breakdown"],
            [MessageSquare, "Lead inbox", "Real-time chat + email + WhatsApp"],
            [Crown, "Featured boost", "One-off paid promotion to top of results"],
            [Globe, "Portal syndication", "Push to AutoTrader, eBay Motors, Motors.co.uk"],
          ].map(([I, t, d]: any) => (
            <div key={t} className="p-5 rounded-2xl bg-white/[0.04] border border-white/10">
              <I className="w-6 h-6 text-[hsl(295_85%_70%)] mb-3" />
              <div className="font-bold text-lg">{t}</div>
              <div className="text-white/60 text-sm mt-1 leading-relaxed">{d}</div>
            </div>
          ))}
        </div>
      </SlideShell>
    ),
  },

  /* 14 — REGIONS */
  {
    title: "4 Regions",
    node: (
      <SlideShell bg="gradient">
        <SectionTag>Geographic Reach</SectionTag>
        <h2 className="text-7xl font-black mt-6 leading-[0.95]">
          One codebase. <span className="text-[hsl(295_85%_70%)]">Four markets.</span>
        </h2>
        <p className="text-xl text-white/70 mt-6 max-w-4xl">
          IP-based geofencing auto-localises currency, regulatory data sources, terminology and
          inventory. Manual switcher in the navbar. All on day one.
        </p>
        <div className="grid grid-cols-4 gap-6 mt-12">
          {[
            { flag: "🇬🇧", name: "United Kingdom", cur: "GBP", api: "DVLA · MOT History · HPI", market: "£100B used market" },
            { flag: "🇺🇸", name: "United States", cur: "USD $", api: "NHTSA VIN Decode · Carfax-ready", market: "$840B used market" },
            { flag: "🇵🇰", name: "Pakistan", cur: "PKR ₨", api: "Excise & Tax verification", market: "Fastest-growing S. Asia" },
            { flag: "🇦🇪", name: "United Arab Emirates", cur: "AED د.إ", api: "RTA integration ready", market: "Premium GCC hub" },
          ].map(c => (
            <div key={c.name} className="p-6 rounded-3xl bg-white/[0.05] border border-white/10 backdrop-blur-sm flex flex-col">
              <div className="text-7xl">{c.flag}</div>
              <div className="text-2xl font-bold mt-4">{c.name}</div>
              <div className="text-[hsl(295_85%_70%)] font-semibold mt-2">{c.cur}</div>
              <div className="text-white/60 text-sm mt-3">{c.api}</div>
              <div className="text-white/80 text-base mt-auto pt-4 font-semibold">{c.market}</div>
            </div>
          ))}
        </div>
      </SlideShell>
    ),
  },

  /* 15 — MULTI-LANGUAGE */
  {
    title: "Multi-language",
    node: (
      <SlideShell bg="dark">
        <div className="grid grid-cols-2 gap-16 h-full items-center">
          <div>
            <SectionTag>Localisation</SectionTag>
            <h2 className="text-7xl font-black mt-6 leading-[0.95]">
              Every market<br />
              <span className="bg-gradient-to-r from-[hsl(295_85%_70%)] to-[hsl(265_85%_70%)] bg-clip-text text-transparent">
                in its own voice.
              </span>
            </h2>
            <p className="text-xl text-white/70 mt-6">
              English, Urdu, Arabic with full RTL support, Spanish for US LATAM segment. Region
              detects → currency, units, terminology and language all auto-switch.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { lang: "English", t: "Find Your Perfect Drive" },
              { lang: "اردو", t: "اپنی پسندیدہ گاڑی تلاش کریں" },
              { lang: "العربية", t: "اعثر على سيارتك المثالية" },
              { lang: "Español", t: "Encuentra tu coche perfecto" },
            ].map(l => (
              <div key={l.lang} className="p-6 rounded-2xl bg-gradient-to-br from-[hsl(265_75%_58%/0.18)] to-transparent border border-[hsl(265_75%_58%/0.3)]">
                <div className="text-sm text-[hsl(295_85%_70%)] uppercase tracking-widest font-bold">{l.lang}</div>
                <div className="text-3xl font-bold mt-3" dir={l.lang === "اردو" || l.lang === "العربية" ? "rtl" : "ltr"}>
                  {l.t}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SlideShell>
    ),
  },

  /* 16 — AI EVERYWHERE */
  {
    title: "AI Stack",
    node: (
      <SlideShell>
        <SectionTag>AI-Native Platform</SectionTag>
        <h2 className="text-7xl font-black mt-6 leading-[0.95]">
          AI runs through <span className="text-[hsl(295_85%_70%)]">everything.</span>
        </h2>
        <p className="text-xl text-white/70 mt-6 max-w-3xl">
          Powered by the Lovable AI gateway with Google Gemini — no per-user API keys, no rate cliffs.
        </p>
        <div className="grid grid-cols-3 gap-6 mt-12">
          {[
            [Brain, "Description generator", "Sellers describe their car; AI writes premium copy."],
            [Target, "Price indicator", "ML grades each listing as Above / Fair / Below market."],
            [Sparkles, "Valuation engine", "Instant vehicle valuation from DVLA + market comps."],
            [MessageSquare, "AI Chat assistant", "On-site bot answers buyer questions 24/7."],
            [Eye, "Image quality scoring", "Auto-detect blurry photos before listing goes live."],
            [Zap, "Smart matching", "Saved-search edge function pings buyers in real-time."],
          ].map(([I, t, d]: any) => (
            <div key={t} className="p-6 rounded-2xl bg-gradient-to-br from-[hsl(265_75%_58%/0.15)] to-transparent border border-[hsl(265_75%_58%/0.25)]">
              <I className="w-8 h-8 text-[hsl(295_85%_70%)] mb-4" />
              <div className="text-2xl font-bold">{t}</div>
              <div className="text-white/70 text-base mt-2">{d}</div>
            </div>
          ))}
        </div>
      </SlideShell>
    ),
  },

  /* 17 — TRUST & SECURITY */
  {
    title: "Trust & Safety",
    node: (
      <SlideShell bg="dark">
        <div className="grid grid-cols-[1fr_1fr] gap-16 h-full items-center">
          <div>
            <SectionTag>Trust Layer</SectionTag>
            <h2 className="text-7xl font-black mt-6 leading-[0.95]">
              The safest way<br />
              to trade a car.
            </h2>
            <p className="text-xl text-white/70 mt-6">
              We've built bank-grade security and verification into every step. This is the moat.
            </p>
          </div>
          <div className="space-y-4">
            {[
              [Shield, "Mandatory KYC", "V5C logbook + HPI check before listings approve"],
              [Lock, "Row-level security", "Postgres RLS protects every record, no leaks"],
              [Eye, "Masked sensitive data", "VINs and reserves hidden via security_invoker views"],
              [Phone, "Twilio call masking", "Buyer-seller calls routed & recorded for safety"],
              [FileCheck, "Stripe-protected payments", "Deposits, auctions, arbitrage all escrowed"],
              [Star, "5-star verified reviews", "Real reviews tied to verified transactions"],
            ].map(([I, t, d]: any) => (
              <div key={t} className="flex gap-5 p-5 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(265_75%_58%)] to-[hsl(295_75%_60%)] grid place-items-center shrink-0">
                  <I className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-lg">{t}</div>
                  <div className="text-white/65 text-base">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SlideShell>
    ),
  },

  /* 18 — MOBILE / PWA */
  {
    title: "Mobile",
    node: (
      <SlideShell bg="gradient">
        <div className="grid grid-cols-[1fr_1fr] gap-16 h-full items-center">
          <div>
            <SectionTag>Native + PWA</SectionTag>
            <h2 className="text-7xl font-black mt-6 leading-[0.95]">
              True mobile,<br />
              <span className="text-[hsl(295_85%_70%)]">not a wrapper.</span>
            </h2>
            <p className="text-xl text-white/70 mt-6">
              Capacitor-powered iOS + Android apps from the same codebase. Push notifications, camera
              access for listings, offline saved cars. PWA-installable on any browser.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-10">
              {["iOS App", "Android App", "PWA Install", "Push Notifications", "Camera Capture", "Offline Mode"].map(t => (
                <div key={t} className="p-4 rounded-xl bg-white/[0.06] border border-white/10 text-center">
                  <Smartphone className="w-5 h-5 text-[hsl(295_85%_70%)] mx-auto mb-2" />
                  <div className="text-sm font-semibold">{t}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-[380px] aspect-[9/19] rounded-[3rem] border-[10px] border-white/15 overflow-hidden bg-black shadow-[0_40px_100px_-20px_rgba(124,58,237,0.6)]">
              <img src={home} alt="Mobile" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </SlideShell>
    ),
  },

  /* 19 — COMPETITIVE LANDSCAPE */
  {
    title: "Competitive Edge",
    node: (
      <SlideShell>
        <SectionTag>Competitive Matrix</SectionTag>
        <h2 className="text-7xl font-black mt-6 leading-[0.95]">
          We do what they do — <span className="text-[hsl(295_85%_70%)]">plus everything they don't.</span>
        </h2>
        <div className="mt-10 rounded-2xl overflow-hidden border border-white/10">
          <table className="w-full text-left">
            <thead className="bg-white/[0.06] text-base">
              <tr>
                <th className="p-4 font-bold">Feature</th>
                <th className="p-4 font-bold text-center">AutoTrader</th>
                <th className="p-4 font-bold text-center">Cazoo</th>
                <th className="p-4 font-bold text-center">Carwow</th>
                <th className="p-4 font-bold text-center">Copart</th>
                <th className="p-4 font-bold text-center bg-[hsl(265_75%_58%/0.25)]">
                  <span className="bg-gradient-to-r from-[hsl(295_85%_70%)] to-[hsl(265_85%_70%)] bg-clip-text text-transparent">Zivvo</span>
                </th>
              </tr>
            </thead>
            <tbody className="text-base">
              {[
                ["Marketplace listings", "✓", "✓", "✓", "—", "✓"],
                ["Live auctions", "—", "—", "—", "✓", "✓"],
                ["B2B trade arbitrage", "—", "—", "—", "—", "✓"],
                ["Owned inspection network", "—", "—", "—", "—", "✓"],
                ["AI price grading", "Partial", "—", "—", "—", "✓"],
                ["Multi-region (UK/US/PK/UAE)", "—", "—", "—", "Partial", "✓"],
                ["Multi-language + RTL", "—", "—", "—", "—", "✓"],
                ["Custom dealer landing pages", "Partial", "—", "—", "—", "✓"],
                ["Auction fee", "—", "—", "—", "9%", "3% buyer / 1.5% seller"],
                ["Private seller cost", "€40+", "—", "—", "—", "2 free / month"],
              ].map((r, i) => (
                <tr key={i} className={i % 2 ? "bg-white/[0.02]" : ""}>
                  {r.map((c, j) => (
                    <td key={j} className={`p-4 ${j === 0 ? "font-semibold" : "text-center"} ${j === 5 ? "bg-[hsl(265_75%_58%/0.12)] text-[hsl(295_85%_75%)] font-bold" : ""}`}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SlideShell>
    ),
  },

  /* 20 — REVENUE MODEL */
  {
    title: "Revenue Model",
    node: (
      <SlideShell bg="dark">
        <SectionTag>Business Model</SectionTag>
        <h2 className="text-7xl font-black mt-6 leading-[0.95]">
          <span className="text-[hsl(295_85%_70%)]">9 revenue streams.</span> Diversified from day one.
        </h2>
        <div className="grid grid-cols-3 gap-5 mt-12">
          {[
            ["Dealer subscriptions", "€49.99/mo", "Recurring · launch plan"],
            ["Private listings", "Free at launch", "Two per calendar month"],
            ["Auction fees", "3% + 1.5%", "Buyer premium + seller fee"],
            ["Trade Stock markup", "5–8% per car", "B2B arbitrage spread"],
            ["Inspection bookings", "€129 / job", "After €120 inspector payout"],
            ["Featured boosts", "€10–€50", "Top-of-search promotion"],
            ["Finance referrals", "1–2% of loan", "Pre-approval pipeline"],
            ["Delivery commission", "5–10%", "Transport quote markup"],
            ["Portal syndication", "€20–€100/mo", "Sync to AutoTrader, eBay etc."],
          ].map(([t, p, d]) => (
            <div key={t} className="p-6 rounded-2xl bg-gradient-to-br from-[hsl(265_75%_58%/0.18)] to-transparent border border-[hsl(265_75%_58%/0.3)]">
              <div className="text-xl font-bold">{t}</div>
              <div className="text-3xl font-black text-[hsl(295_85%_70%)] mt-3">{p}</div>
              <div className="text-white/60 text-sm mt-2">{d}</div>
            </div>
          ))}
        </div>
      </SlideShell>
    ),
  },

  /* 21 — SECURITY & INFRASTRUCTURE */
  {
    title: "Secure & Scalable",
    node: (
      <SlideShell>
        <SectionTag>Enterprise-grade Infrastructure</SectionTag>
        <h2 className="text-7xl font-black mt-6 leading-[0.95]">Secure. Scalable. Always on.</h2>
        <p className="text-2xl text-white/70 mt-6 max-w-4xl">
          Built on world-class cloud infrastructure with bank-grade security, so your data — and your customers' — is always protected.
        </p>
        <div className="grid grid-cols-3 gap-6 mt-12">
          {[
            ["☁️", "Cloud-Native", "Hosted on AWS-backed global infrastructure with 99.99% uptime and auto-scaling on demand."],
            ["🔒", "Bank-Grade Security", "End-to-end encryption, secure authentication, and continuous security monitoring."],
            ["🛡️", "GDPR & Compliance Ready", "Full GDPR compliance, audited data handling, and regional data residency."],
            ["⚡", "Built to Scale", "Handles millions of listings, bids and users without breaking a sweat."],
            ["🌍", "Global CDN", "Lightning-fast load times in every region we serve."],
            ["🔁", "Automatic Backups", "Continuous backups and disaster recovery — your data is never at risk."],
          ].map(([icon, title, desc]) => (
            <div key={title} className="p-6 rounded-2xl bg-white/[0.04] border border-white/10">
              <div className="text-4xl mb-3">{icon}</div>
              <div className="text-xl font-bold mb-2">{title}</div>
              <div className="text-white/60 text-base leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </SlideShell>
    ),
  },

  /* 22 — HIDDEN/READY */
  {
    title: "Hidden Features",
    node: (
      <SlideShell bg="gradient">
        <SectionTag>Already Built · Ready to Switch On</SectionTag>
        <h2 className="text-7xl font-black mt-6 leading-[0.95]">
          15 modules built.<br />
          <span className="text-[hsl(295_85%_70%)]">Held in reserve.</span>
        </h2>
        <p className="text-xl text-white/70 mt-6 max-w-4xl">
          We've quietly shipped these — they're production-ready, switched off pending product
          rollout. Each adds another monetisation lever or moat.
        </p>
        <div className="grid grid-cols-3 gap-4 mt-10">
          {[
            "Live auctions with proxy bidding",
            "B2B Trade Stock arbitrage",
            "Inspector network + payouts",
            "Agent commission system (30% recurring)",
            "Multi-portal syndication engine",
            "Twilio call masking + recording",
            "Stripe-deposit reservations",
            "Sales pipeline Kanban (dnd-kit)",
            "Custom dealer landing builder",
            "DMS connectors (CDK/Pinewood)",
            "AI image quality scoring",
            "Part-exchange + finance widgets",
            "AI chat assistant (Gemini)",
            "Saved-search match engine",
            "PWA + native iOS/Android",
          ].map(t => (
            <div key={t} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.06] border border-white/10">
              <div className="w-2 h-2 rounded-full bg-[hsl(295_85%_70%)]" />
              <span className="text-base">{t}</span>
            </div>
          ))}
        </div>
      </SlideShell>
    ),
  },

  /* 23 — ROADMAP */
  {
    title: "Roadmap",
    node: (
      <SlideShell>
        <SectionTag>Roadmap</SectionTag>
        <h2 className="text-7xl font-black mt-6 leading-[0.95]">From UK launch → 4-region scale.</h2>
        <div className="grid grid-cols-4 gap-6 mt-14">
          {[
            { phase: "Phase 1", t: "UK Launch", items: ["Dealer outreach at scale", "Public marketing push", "Dealer pricing rollout", "Inspector network across key cities"], color: "from-[hsl(265_75%_58%)] to-[hsl(295_75%_60%)]" },
            { phase: "Phase 2", t: "USA Expansion", items: ["NHTSA + Carfax integration", "USD pricing live", "Onboard first US dealers", "Spanish localisation"], color: "from-[hsl(280_75%_60%)] to-[hsl(310_75%_65%)]" },
            { phase: "Phase 3", t: "Pakistan", items: ["Urdu + RTL support", "Excise verification", "Karachi · Lahore · Islamabad", "Mobile-first rollout"], color: "from-[hsl(295_75%_60%)] to-[hsl(325_75%_65%)]" },
            { phase: "Phase 4", t: "UAE + Series A", items: ["Arabic + RTL", "RTA integration", "Dubai HQ launch", "Series A raise"], color: "from-[hsl(310_75%_60%)] to-[hsl(340_75%_65%)]" },
          ].map(p => (
            <div key={p.phase} className="rounded-3xl overflow-hidden">
              <div className={`bg-gradient-to-br ${p.color} p-6`}>
                <div className="text-white/80 font-semibold">{p.phase}</div>
                <div className="text-3xl font-black mt-2">{p.t}</div>
              </div>
              <div className="bg-white/[0.04] border border-white/10 p-5 space-y-3">
                {p.items.map(i => (
                  <div key={i} className="flex gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[hsl(295_85%_70%)] mt-2 shrink-0" />
                    <span className="text-white/80">{i}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SlideShell>
    ),
  },

  /* 24 — TRACTION / NUMBERS */
  {
    title: "The Numbers",
    node: (
      <SlideShell bg="dark">
        <SectionTag>Why Now</SectionTag>
        <h2 className="text-7xl font-black mt-6 leading-[0.95]">A market built for disruption.</h2>
        <div className="grid grid-cols-3 gap-8 mt-14">
          <div className="p-8 rounded-3xl bg-gradient-to-br from-[hsl(265_75%_58%/0.2)] to-transparent border border-[hsl(265_75%_58%/0.3)]">
            <Globe className="w-10 h-10 text-[hsl(295_85%_70%)]" />
            <div className="text-7xl font-black mt-6">$1.4T</div>
            <div className="text-white/70 mt-2 text-lg">Combined used-car market across our 4 regions</div>
          </div>
          <div className="p-8 rounded-3xl bg-gradient-to-br from-[hsl(265_75%_58%/0.2)] to-transparent border border-[hsl(265_75%_58%/0.3)]">
            <Users className="w-10 h-10 text-[hsl(295_85%_70%)]" />
            <div className="text-7xl font-black mt-6">82M</div>
            <div className="text-white/70 mt-2 text-lg">Used-car transactions per year (combined)</div>
          </div>
          <div className="p-8 rounded-3xl bg-gradient-to-br from-[hsl(265_75%_58%/0.2)] to-transparent border border-[hsl(265_75%_58%/0.3)]">
            <Zap className="w-10 h-10 text-[hsl(295_85%_70%)]" />
            <div className="text-7xl font-black mt-6">0</div>
            <div className="text-white/70 mt-2 text-lg">Existing platforms unifying these markets</div>
          </div>
        </div>
        <div className="mt-12 p-8 rounded-3xl bg-white/[0.04] border border-white/10">
          <div className="text-2xl font-bold">If we capture just <span className="text-[hsl(295_85%_70%)]">0.05%</span> of annual transactions across the 4 regions:</div>
          <div className="text-5xl font-black mt-4">41,000 transactions × €180 avg revenue = <span className="bg-gradient-to-r from-[hsl(295_85%_70%)] to-[hsl(265_85%_70%)] bg-clip-text text-transparent">€7.4M ARR</span></div>
        </div>
      </SlideShell>
    ),
  },

  /* 25 — CTA */
  {
    title: "Let's talk",
    node: (
      <SlideShell bg="gradient">
        <div className="h-full flex flex-col justify-between">
          <ZivvoMark />
          <div className="max-w-5xl">
            <SectionTag>Get in touch</SectionTag>
            <h1 className="text-[160px] leading-[0.9] font-black mt-8 tracking-tight">
              Let's<br />
              <span className="bg-gradient-to-r from-[hsl(295_85%_70%)] via-[hsl(280_85%_75%)] to-[hsl(265_85%_70%)] bg-clip-text text-transparent">
                build it together.
              </span>
            </h1>
            <p className="text-2xl text-white/70 mt-10 max-w-3xl">
              Whether you're an investor, a dealer, or a curious customer — Zivvo is open for
              business. Live in the UK today. Ready to scale tomorrow.
            </p>
            <div className="flex gap-6 mt-12">
              <div className="px-8 py-5 rounded-2xl bg-gradient-to-r from-[hsl(265_75%_58%)] to-[hsl(295_75%_60%)] text-xl font-bold flex items-center gap-3">
                hello@zivvo.de <ArrowRight className="w-6 h-6" />
              </div>
              <div className="px-8 py-5 rounded-2xl border border-white/20 text-xl font-bold backdrop-blur-sm">
                zivvo.de
              </div>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div className="text-white/50">© 2026 Zivvo Ltd · Registered in England & Wales</div>
            <div className="text-white/50">🇬🇧 🇺🇸 🇵🇰 🇦🇪</div>
          </div>
        </div>
      </SlideShell>
    ),
  },
];

/* ────────────────────────────────────────────────────────── */
/*  Scaled wrapper                                            */
/* ────────────────────────────────────────────────────────── */

const ScaledSlide = ({ children, container }: { children: ReactNode; container: HTMLDivElement | null }) => {
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    if (!container) return;
    const update = () => {
      const r = container.getBoundingClientRect();
      setScale(Math.min(r.width / SLIDE_W, r.height / SLIDE_H));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, [container]);
  return (
    <div
      style={{
        position: "absolute",
        width: SLIDE_W,
        height: SLIDE_H,
        left: "50%",
        top: "50%",
        marginLeft: -SLIDE_W / 2,
        marginTop: -SLIDE_H / 2,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
  );
};

/* ────────────────────────────────────────────────────────── */
/*  Page                                                      */
/* ────────────────────────────────────────────────────────── */

export default function Pitch() {
  const [idx, setIdx] = useState(0);
  const [fs, setFs] = useState(false);
  const [grid, setGrid] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);

  const next = useCallback(() => setIdx(i => Math.min(slides.length - 1, i + 1)), []);
  const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), []);

  useEffect(() => { setStageEl(stageRef.current); }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev(); }
      else if (e.key === "Escape") { setGrid(false); if (document.fullscreenElement) document.exitFullscreen(); }
      else if (e.key === "g" || e.key === "G") setGrid(g => !g);
      else if (e.key === "f" || e.key === "F" || e.key === "F5") { e.preventDefault(); toggleFs(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // Fullscreen sync
  useEffect(() => {
    const sync = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFs = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* Fullscreen may be blocked by browser policy. */ }
  };

  return (
    <div className="min-h-screen bg-[#05030a] text-white flex flex-col">
      <SEOHead title="Zivvo Investor Deck — UK · USA · Pakistan · UAE" description="The vehicle marketplace rebuilt for 4 continents. Investor, dealer & customer pitch." />

      {/* Top bar */}
      {!fs && (
        <header className="border-b border-white/10 px-6 py-3 flex items-center justify-between bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <ZivvoMark small />
            <span className="text-white/40 text-sm">Pitch Deck</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60 mr-3">{idx + 1} / {slides.length}</span>
            <Button size="sm" variant="ghost" onClick={() => setGrid(g => !g)}>
              <Grid3x3 className="w-4 h-4 mr-2" />Grid
            </Button>
            <Button size="sm" variant="ghost" onClick={toggleFs}>
              <Maximize2 className="w-4 h-4 mr-2" />Present
            </Button>
          </div>
        </header>
      )}

      {/* Stage */}
      <main className="flex-1 relative overflow-hidden" ref={stageRef}>
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0"
          >
            <ScaledSlide container={stageEl}>{slides[idx].node}</ScaledSlide>
          </motion.div>
        </AnimatePresence>

        {/* Nav pills */}
        <div className="absolute left-1/2 bottom-6 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
          <Button size="icon" variant="ghost" onClick={prev} disabled={idx === 0}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm text-white/80 px-3 min-w-[60px] text-center">{idx + 1} / {slides.length}</span>
          <Button size="icon" variant="ghost" onClick={next} disabled={idx === slides.length - 1}>
            <ChevronRight className="w-5 h-5" />
          </Button>
          {fs && (
            <Button size="icon" variant="ghost" onClick={toggleFs}>
              <Minimize2 className="w-5 h-5" />
            </Button>
          )}
        </div>
      </main>

      {/* Grid overlay */}
      {grid && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md overflow-auto p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">All slides</h2>
            <Button size="icon" variant="ghost" onClick={() => setGrid(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-5">
            {slides.map((s, i) => (
              <button
                key={i}
                onClick={() => { setIdx(i); setGrid(false); }}
                className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${i === idx ? "border-[hsl(265_75%_58%)] ring-2 ring-[hsl(265_75%_58%/0.4)]" : "border-white/10 hover:border-white/30"}`}
              >
                <div className="absolute inset-0">
                  <ThumbSlide>{s.node}</ThumbSlide>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 text-left">
                  <div className="text-xs text-white/60">Slide {i + 1}</div>
                  <div className="text-sm font-semibold truncate">{s.title}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const ThumbSlide = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  useEffect(() => { setEl(ref.current); }, []);
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <ScaledSlide container={el}>{children}</ScaledSlide>
    </div>
  );
};
