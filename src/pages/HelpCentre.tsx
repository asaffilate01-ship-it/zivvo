import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { HelpCircle, MessageSquare } from "lucide-react";

const faqs = [
  {
    q: "How do I list my car for sale?",
    a: "Click 'Post Ad' in the navigation bar. You'll need to create a free account first. Then fill in your vehicle details, upload photos, and publish. Individual listings are free — dealer accounts require a subscription.",
  },
  {
    q: "Is it free to browse and buy?",
    a: "Yes! Browsing, saving cars, and contacting sellers is completely free for buyers. You only pay the seller directly when you agree on a purchase.",
  },
  {
    q: "How does the finance check work?",
    a: "Our finance check buttons on each listing link to trusted third-party providers who can verify if a vehicle has outstanding finance, has been reported stolen, or has been written off. We recommend checking before making any purchase.",
  },
  {
    q: "What are dealer subscription plans?",
    a: "Dealers can choose from Starter (£49/mo, 15 listings), Professional (£99/mo, 50 listings), or Enterprise (£199/mo, unlimited listings). All plans include a customisable dealer landing page, analytics dashboard, and priority support.",
  },
  {
    q: "How do I contact a seller?",
    a: "On any listing page, you can send an enquiry via the 'Send Message' button or start a real-time chat with the 'Message Seller' button. You'll need to be signed in.",
  },
  {
    q: "Can I save cars to view later?",
    a: "Yes! Click the heart icon on any listing to save it. View all your saved cars from the 'Saved Cars' page accessible from the navigation bar.",
  },
  {
    q: "How do I report a suspicious listing?",
    a: "If you believe a listing is fraudulent or misleading, please contact us via our Contact page. Our admin team reviews reports and takes action within 24 hours.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Profile → Settings and click 'Request Account Deletion'. This will remove all your personal data, listings, and messages permanently. This action cannot be undone.",
  },
  {
    q: "What is the agent programme?",
    a: "Agents can onboard new dealers to Zivvo and earn 30% recurring commission on their subscription payments. Contact us to apply for the agent programme.",
  },
];

const HelpCentre = () => (
  <div className="min-h-screen bg-background">
    <SEOHead title="Help Centre — Zivvo" description="Find answers to common questions about buying, selling, and dealer subscriptions on Zivvo." />
    <Navbar />
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <HelpCircle className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold text-foreground md:text-4xl">Help Centre</h1>
        <p className="mt-2 text-muted-foreground">Frequently asked questions and support</p>
      </div>

      <Accordion type="single" collapsible className="mt-10">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left font-display font-semibold text-foreground">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-12 rounded-xl border border-border bg-card p-8 text-center">
        <MessageSquare className="mx-auto h-10 w-10 text-primary" />
        <h3 className="mt-3 font-display text-lg font-semibold text-card-foreground">Still need help?</h3>
        <p className="mt-1 text-sm text-muted-foreground">Our support team is ready to assist you.</p>
        <Link to="/contact">
          <Button className="gradient-primary mt-4 border-0">Contact Support</Button>
        </Link>
      </div>
    </div>
    <Footer />
  </div>
);

export default HelpCentre;
