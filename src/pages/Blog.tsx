import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight, User } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const blogPosts = [
  {
    id: "buying-used-car-checklist",
    title: "The Ultimate Used Car Buying Checklist for 2026",
    excerpt: "Don't get caught out. Our comprehensive checklist covers everything from bodywork inspection to finance checks before you hand over your money.",
    category: "Buying Guide",
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80",
    author: "AutoSouq Team",
    date: "2026-03-10",
    readTime: "8 min read",
  },
  {
    id: "electric-vs-hybrid-2026",
    title: "Electric vs Hybrid: Which Is Right for You in 2026?",
    excerpt: "With EV infrastructure growing rapidly, we break down the real-world costs, range, and practicality of going electric versus hybrid.",
    category: "EV Guide",
    image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80",
    author: "AutoSouq Team",
    date: "2026-03-05",
    readTime: "6 min read",
  },
  {
    id: "how-to-sell-car-fast",
    title: "How to Sell Your Car Fast: 10 Expert Tips",
    excerpt: "From pricing strategy to photo tips, learn what makes listings sell faster. Data-backed advice from thousands of successful sales on AutoSouq.",
    category: "Selling Tips",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80",
    author: "AutoSouq Team",
    date: "2026-02-28",
    readTime: "5 min read",
  },
  {
    id: "finance-check-guide",
    title: "Why You Should Always Run a Finance Check Before Buying",
    excerpt: "Thousands of cars are sold each year with outstanding finance. Here's how to protect yourself and what to do if a check comes back positive.",
    category: "Safety",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
    author: "AutoSouq Team",
    date: "2026-02-20",
    readTime: "4 min read",
  },
  {
    id: "best-family-suvs-2026",
    title: "Top 10 Best Family SUVs in 2026",
    excerpt: "Safety ratings, boot space, and running costs — we rank the best SUVs for families based on real owner data and expert reviews.",
    category: "Reviews",
    image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80",
    author: "AutoSouq Team",
    date: "2026-02-15",
    readTime: "7 min read",
  },
  {
    id: "dealer-subscription-benefits",
    title: "Why Dealers Are Switching to AutoVault: A Case Study",
    excerpt: "See how verified dealers on AutoVault are reaching more buyers, closing faster, and building trust with our platform tools.",
    category: "For Dealers",
    image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80",
    author: "AutoVault Team",
    date: "2026-02-10",
    readTime: "5 min read",
  },
];

const Blog = () => {
  const { toast } = useToast();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribing(true);
    const { error } = await supabase.from("newsletter_subscribers" as any).insert({ email: newsletterEmail.trim() });
    setSubscribing(false);
    if (error?.code === "23505") {
      toast({ title: "Already subscribed!", description: "You're already on our mailing list." });
    } else if (error) {
      toast({ title: "Failed to subscribe", variant: "destructive" });
    } else {
      toast({ title: "Subscribed!", description: "You'll receive our latest articles by email." });
    }
    setNewsletterEmail("");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="AutoVault Blog — Car Buying Tips, Reviews & Guides"
        description="Expert advice on buying, selling, and maintaining your car. Guides, reviews, and industry insights from the AutoVault team."
      />
      <Navbar />

      {/* Hero */}
      <section className="gradient-dark py-16">
        <div className="container mx-auto px-4 text-center">
          <Badge className="gradient-primary border-0 text-primary-foreground mb-4">Blog & Guides</Badge>
          <h1 className="font-display text-3xl font-bold text-primary-foreground md:text-5xl">
            Expert Advice for Smarter Car Decisions
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/70">
            Tips, guides, and reviews to help you buy, sell, and maintain your vehicle with confidence.
          </p>
        </div>
      </section>

      {/* Featured Post */}
      <section className="container mx-auto px-4 -mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevated"
        >
          <div className="grid md:grid-cols-2">
            <img
              src={blogPosts[0].image}
              alt={blogPosts[0].title}
              className="h-64 w-full object-cover md:h-full"
              loading="lazy"
            />
            <div className="flex flex-col justify-center p-6 md:p-10">
              <Badge variant="secondary" className="w-fit">{blogPosts[0].category}</Badge>
              <h2 className="mt-3 font-display text-2xl font-bold text-card-foreground md:text-3xl">
                {blogPosts[0].title}
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">{blogPosts[0].excerpt}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(blogPosts[0].date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {blogPosts[0].readTime}</span>
              </div>
              <Link to={`/blog/${blogPosts[0].id}`}>
                <Button className="mt-6 gradient-primary border-0 w-fit">
                  Read Article <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Grid */}
      <section className="container mx-auto px-4 py-14">
        <h2 className="font-display text-2xl font-bold text-foreground">Latest Articles</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogPosts.slice(1).map((post, i) => (
            <Link key={post.id} to={`/blog/${post.id}`}>
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:shadow-elevated h-full"
              >
                <div className="overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <Badge variant="outline" className="text-xs">{post.category}</Badge>
                  <h3 className="mt-2 font-display text-lg font-semibold text-card-foreground line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {post.author}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime}</span>
                  </div>
                </div>
              </motion.article>
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="border-t border-border bg-secondary/30 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground">Stay in the Know</h2>
          <p className="mt-2 text-muted-foreground">Get the latest car buying tips and market insights delivered to your inbox.</p>
          <form onSubmit={handleSubscribe} className="mx-auto mt-6 flex max-w-md gap-2">
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button type="submit" className="gradient-primary border-0" disabled={subscribing}>
              {subscribing ? "..." : "Subscribe"}
            </Button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
