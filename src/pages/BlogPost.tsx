import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, User, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const blogPosts: Record<string, {
  title: string; excerpt: string; category: string; image: string;
  author: string; date: string; readTime: string; content: string[];
}> = {
  "buying-used-car-checklist": {
    title: "The Ultimate Used Car Buying Checklist for 2026",
    excerpt: "Don't get caught out. Our comprehensive checklist covers everything.",
    category: "Buying Guide",
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=1200&q=80",
    author: "AutoSouq Team", date: "2026-03-10", readTime: "8 min read",
    content: [
      "Buying a used car can be one of the smartest financial decisions you make — but only if you do it right. Every year, thousands of buyers end up with vehicles that have hidden problems, outstanding finance, or a questionable history.",
      "Our comprehensive checklist breaks down every step of the used car buying process, from your initial online search to the final handshake. We've compiled this from data across thousands of successful and unsuccessful transactions on AutoVault.",
      "## Before You View\n\n1. **Set your budget** — include insurance, tax, and running costs\n2. **Research the model** — check common faults on owner forums\n3. **Run an HPI check** — verify no outstanding finance, theft, or write-offs\n4. **Check the MOT history** — look for advisory patterns online",
      "## At the Viewing\n\n1. **Walk around the exterior** — check panel gaps, paint mismatches, rust\n2. **Open all doors, boot, and bonnet** — listen for creaks\n3. **Check tyre condition** — uneven wear suggests alignment issues\n4. **Start the engine cold** — listen for knocks or rattles\n5. **Test all electrics** — windows, mirrors, lights, infotainment",
      "## The Test Drive\n\nDrive for at least 15 minutes on varied roads. Check brakes, steering response, gearbox smoothness, and listen for any unusual noises. Pay attention to how the car feels at motorway speeds.",
      "## After the Deal\n\nEnsure you receive the V5C logbook, service history, both keys, and a receipt. Transfer the V5C to your name within 14 days and arrange insurance before driving away.",
    ],
  },
  "electric-vs-hybrid-2026": {
    title: "Electric vs Hybrid: Which Is Right for You in 2026?",
    excerpt: "We break down the real-world costs, range, and practicality.",
    category: "EV Guide",
    image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&q=80",
    author: "AutoVault Team", date: "2026-03-05", readTime: "6 min read",
    content: [
      "The electric vehicle landscape has transformed dramatically. With charging infrastructure now covering most major routes and battery costs falling year on year, the question is no longer 'if' but 'when' to go electric.",
      "## Full Electric (BEV)\n\nPure electric vehicles offer the lowest running costs, zero tailpipe emissions, and an increasingly impressive range. Most modern EVs now offer 250-400 miles per charge, making range anxiety largely a thing of the past.",
      "## Hybrid (HEV & PHEV)\n\nHybrids offer a stepping stone — you get electric efficiency around town with petrol backup for longer journeys. Plug-in hybrids (PHEVs) typically offer 30-60 miles of electric-only range, perfect for daily commutes.",
      "## Cost Comparison\n\nWhile EVs have a higher upfront cost, they're significantly cheaper to run. Electricity costs roughly 7p per mile compared to 15-20p for petrol. Tax benefits, lower servicing costs, and congestion charge exemptions add up quickly.",
      "## Our Verdict\n\nIf you have home charging and drive under 300 miles per day, go full electric. If you frequently drive long distances without reliable charging stops, a PHEV offers the best of both worlds.",
    ],
  },
  "how-to-sell-car-fast": {
    title: "How to Sell Your Car Fast: 10 Expert Tips",
    excerpt: "Data-backed advice from thousands of successful sales.",
    category: "Selling Tips",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=80",
    author: "AutoVault Team", date: "2026-02-28", readTime: "5 min read",
    content: [
      "Selling your car doesn't have to be a drawn-out process. Based on data from thousands of successful sales on AutoVault, here are the strategies that consistently lead to faster sales at better prices.",
      "## 1. Price It Right\n\nOverpricing is the #1 reason cars sit unsold. Research similar models on AutoVault and price competitively. Listings priced within 5% of market value sell 3x faster.",
      "## 2. Take Great Photos\n\nListings with 10+ high-quality photos get 4x more enquiries. Shoot in daylight, clean the car first, and include interior, exterior, engine bay, and any imperfections.",
      "## 3. Write a Detailed Description\n\nBe honest and thorough. Include service history highlights, recent work done, and genuine reasons for selling. Transparency builds trust.",
      "## 4. Get an HPI Check\n\nA clear HPI check reassures buyers and can justify a higher price. AutoVault offers integrated HPI checks directly from your listing dashboard.",
      "## 5. Respond Quickly\n\nSellers who respond to enquiries within 1 hour are 5x more likely to close the sale. Enable notifications and keep your phone handy.",
    ],
  },
  "finance-check-guide": {
    title: "Why You Should Always Run a Finance Check Before Buying",
    excerpt: "Here's how to protect yourself from outstanding finance.",
    category: "Safety",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80",
    author: "AutoVault Team", date: "2026-02-20", readTime: "4 min read",
    content: [
      "Every year, thousands of cars are sold with outstanding finance — meaning the buyer could lose the car and their money. A finance check is one of the most important steps you can take.",
      "## What Is Outstanding Finance?\n\nWhen a car is bought on finance (HP, PCP, or personal loan secured against the vehicle), the finance company retains legal ownership until the debt is fully paid. If you buy a car with outstanding finance, the finance company can legally repossess it.",
      "## How to Check\n\nAutoVault's integrated HPI check includes a comprehensive finance check. Simply enter the registration number and we'll search against all major UK finance databases.",
      "## What If Finance Is Found?\n\nDon't panic — but don't proceed with the purchase either. The seller needs to settle the outstanding amount before the sale can go through legitimately.",
    ],
  },
  "best-family-suvs-2026": {
    title: "Top 10 Best Family SUVs in 2026",
    excerpt: "Safety ratings, boot space, and running costs ranked.",
    category: "Reviews",
    image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&q=80",
    author: "AutoVault Team", date: "2026-02-15", readTime: "7 min read",
    content: [
      "Choosing the right family SUV means balancing safety, space, running costs, and budget. We've ranked the top 10 based on real owner feedback and expert analysis.",
      "## 1. Toyota RAV4 Hybrid\n\nReliability king. The RAV4 Hybrid delivers exceptional fuel economy (50+ mpg), a spacious boot, and Toyota's legendary build quality. Five-star NCAP rating.",
      "## 2. Hyundai Tucson\n\nStunning design inside and out. The Tucson offers a premium feel at a mid-range price, with hybrid and plug-in hybrid options.",
      "## 3. Skoda Kodiaq\n\nThe practical choice. Seven seats as standard on most trims, massive boot space, and sensible running costs make the Kodiaq a family favourite.",
      "## 4. Kia Sportage\n\nIndustry-leading 7-year warranty, sharp styling, and an excellent infotainment system. The plug-in hybrid version offers great tax benefits.",
      "## 5. Volvo XC60\n\nSafety pioneer. If protecting your family is the top priority, Volvo's XC60 leads the pack with the most advanced safety tech available.",
    ],
  },
  "dealer-subscription-benefits": {
    title: "Why Dealers Are Switching to AutoVault: A Case Study",
    excerpt: "How verified dealers reach more buyers and close faster.",
    category: "For Dealers",
    image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&q=80",
    author: "AutoVault Team", date: "2026-02-10", readTime: "5 min read",
    content: [
      "Independent dealers across the UK are discovering that AutoVault's platform offers a more cost-effective way to reach serious buyers compared to traditional classified sites.",
      "## The Challenge\n\nSmall and medium dealers often struggle with high advertising costs, limited visibility, and difficulty building trust with online buyers.",
      "## The AutoVault Solution\n\nOur dealer plans start from just £49/month and include verified dealer badges, custom landing pages, integrated analytics, and direct buyer messaging.",
      "## Results\n\n- **47% more enquiries** within the first month\n- **3x faster response times** with our integrated messaging\n- **Verified dealer badge** increased click-through rates by 62%\n- **Custom landing pages** gave dealers a professional online presence",
      "## Getting Started\n\nJoin hundreds of dealers already growing their business on AutoVault. Choose from Starter, Professional, or Enterprise plans to match your dealership size.",
    ],
  },
};

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const post = id ? blogPosts[id] : null;

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">Article Not Found</h1>
          <p className="mt-2 text-muted-foreground">This blog post doesn't exist or has been removed.</p>
          <Link to="/blog"><Button className="mt-6" variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied to clipboard!" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${post.title} — AutoVault Blog`} description={post.excerpt} />
      <Navbar />

      <article className="container mx-auto max-w-3xl px-4 py-8">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>

        <Badge variant="secondary" className="mb-3">{post.category}</Badge>
        <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl leading-tight">{post.title}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><User className="h-4 w-4" /> {post.author}</span>
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {post.readTime}</span>
          <button onClick={handleShare} className="flex items-center gap-1 hover:text-primary transition-colors">
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>

        <img src={post.image} alt={post.title} className="mt-8 w-full rounded-2xl object-cover aspect-video" />

        <div className="mt-8 space-y-6 text-foreground leading-relaxed">
          {post.content.map((block, i) => {
            // Simple markdown-like rendering
            const lines = block.split("\n");
            return (
              <div key={i}>
                {lines.map((line, j) => {
                  if (line.startsWith("## ")) {
                    return <h2 key={j} className="font-display text-xl font-bold mt-8 mb-3">{line.replace("## ", "")}</h2>;
                  }
                  if (line.startsWith("**") || line.match(/^\d+\.\s\*\*/)) {
                    return <p key={j} className="ml-4" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
                  }
                  if (line.trim() === "") return null;
                  return <p key={j} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
                })}
              </div>
            );
          })}
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <Link to="/blog"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> More Articles</Button></Link>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPost;
