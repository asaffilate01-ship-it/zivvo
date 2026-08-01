import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ShareSheet from "@/components/ShareSheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, User, BookOpen, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const postMeta: Record<string, { image: string; author: string; date: string; readTime: string }> = {
  "buying-used-car-checklist": { image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&q=80", author: "Zivvo Team", date: "2026-03-10", readTime: "8 min read" },
  "electric-vs-hybrid-2026": { image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&q=80", author: "Zivvo Team", date: "2026-03-05", readTime: "6 min read" },
  "how-to-sell-car-fast": { image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80", author: "Zivvo Team", date: "2026-02-28", readTime: "5 min read" },
  "finance-check-guide": { image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80", author: "Zivvo Team", date: "2026-02-20", readTime: "4 min read" },
  "best-family-suvs-2026": { image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&q=80", author: "Zivvo Team", date: "2026-02-15", readTime: "7 min read" },
  "dealer-subscription-benefits": { image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&q=80", author: "Zivvo Team", date: "2026-02-10", readTime: "5 min read" },
};

const allPostIds = Object.keys(postMeta);

const renderInlineBold = (line: string) =>
  line.split(/(\*\*.*?\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part
  );

const BlogPost = () => {
  const { t } = useTranslation("blogPost");
  const { id } = useParams<{ id: string }>();
  const meta = id ? postMeta[id] : null;
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!meta || !id) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">{t("notFoundTitle")}</h1>
          <p className="mt-2 text-muted-foreground">{t("notFoundDesc")}</p>
          <Link to="/blog"><Button className="mt-6" variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> {t("backToBlog")}</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const title = t(`posts.${id}.title`);
  const excerpt = t(`posts.${id}.excerpt`);
  const category = t(`posts.${id}.category`);
  const content = t(`posts.${id}.content`, { returnObjects: true }) as string[];
  const post = { ...meta, title, excerpt, category, content };

  // Extract headings for table of contents
  const headings = post.content
    .flatMap(block => block.split("\n"))
    .filter(line => line.startsWith("## "))
    .map(line => line.replace("## ", ""));

  // Related posts (same category first, then others)
  const relatedPosts = allPostIds
    .filter(pid => pid !== id)
    .sort((a, b) => {
      const aMatch = t(`posts.${a}.category`) === post.category ? 0 : 1;
      const bMatch = t(`posts.${b}.category`) === post.category ? 0 : 1;
      return aMatch - bMatch;
    })
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${post.title} — Zivvo Blog`}
        description={post.excerpt}
        type="article"
        image={post.image}
        imageAlt={post.title}
        publishedTime={post.date}
        author={post.author}
        keywords={`${post.category}, used cars, Zivvo, ${post.title.split(" ").slice(0, 3).join(", ")}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": post.title,
          "description": post.excerpt,
          "image": post.image,
          "datePublished": post.date,
          "author": { "@type": "Organization", "name": post.author },
          "publisher": {
            "@type": "Organization",
            "name": "Zivvo",
            "logo": { "@type": "ImageObject", "url": "https://zivvo.de/icon-512.png" }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://zivvo.de/blog/${id}`
          }
        }}
      />
      
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 z-50 h-1 bg-primary/20 w-full">
        <motion.div
          className="h-full bg-primary"
          style={{ width: `${readProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      <Navbar />

      <article className="container mx-auto max-w-4xl px-4 py-8">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t("backToBlog")}
        </Link>

        <Badge variant="secondary" className="mb-3">{post.category}</Badge>
        <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl leading-tight">{post.title}</h1>

        {/* Meta + share row */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><User className="h-4 w-4" /> {post.author}</span>
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(post.date).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {post.readTime}</span>
          </div>
          <ShareSheet title={post.title} text={post.excerpt} />
        </div>

        {/* Hero image */}
        <motion.img
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          src={post.image}
          alt={post.title}
          className="mt-8 w-full rounded-2xl object-cover aspect-video shadow-elevated"
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_220px]">
          {/* Main content */}
          <div className="space-y-6 text-foreground leading-relaxed">
            {post.content.map((block, i) => {
              const lines = block.split("\n");
              return (
                <div key={i}>
                  {lines.map((line, j) => {
                    if (line.startsWith("## ")) {
                      const headingId = line.replace("## ", "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      return <h2 key={j} id={headingId} className="font-display text-xl font-bold mt-8 mb-3 scroll-mt-20">{line.replace("## ", "")}</h2>;
                    }
                    if (line.startsWith("- **") || line.match(/^\d+\.\s\*\*/)) {
                      return <p key={j} className="ml-4">{renderInlineBold(line)}</p>;
                    }
                    if (line.trim() === "") return null;
                    return <p key={j}>{renderInlineBold(line)}</p>;
                  })}
                </div>
              );
            })}
          </div>

          {/* Sidebar — Table of contents */}
          {headings.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-20 rounded-xl border border-border bg-card p-5 shadow-card">
                <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-card-foreground mb-3">
                  <BookOpen className="h-4 w-4" /> {t("contents")}
                </h3>
                <nav className="space-y-2">
                  {headings.map((h) => (
                    <a
                      key={h}
                      href={`#${h.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {h}
                    </a>
                  ))}
                </nav>

                {/* Social share in sidebar */}
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">{t("shareArticle")}</p>
                  <ShareSheet title={post.title} text={post.excerpt} />
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Author box */}
        <div className="mt-12 rounded-xl border border-border bg-card p-6 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
            A
          </div>
          <div>
            <p className="font-display font-semibold text-card-foreground">{post.author}</p>
            <p className="text-sm text-muted-foreground">{t("authorBio")}</p>
          </div>
        </div>

        {/* Bottom share bar */}
        <div className="mt-8 flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-4">
          <p className="text-sm font-medium text-foreground">{t("foundUseful")}</p>
          <ShareSheet title={post.title} text={post.excerpt} />
        </div>

        {/* Related posts */}
        <section className="mt-14">
          <h2 className="font-display text-xl font-bold text-foreground mb-6">{t("youMightAlsoLike")}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((pid) => {
              const rpMeta = postMeta[pid];
              const rpTitle = t(`posts.${pid}.title`);
              const rpCategory = t(`posts.${pid}.category`);
              return (
                <Link key={pid} to={`/blog/${pid}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:shadow-elevated h-full"
                  >
                    <img src={rpMeta.image} alt={rpTitle} className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                    <div className="p-4">
                      <Badge variant="outline" className="text-xs">{rpCategory}</Badge>
                      <h3 className="mt-2 font-display text-sm font-semibold text-card-foreground line-clamp-2">{rpTitle}</h3>
                      <span className="mt-2 inline-flex items-center text-xs text-primary gap-0.5">
                        {t("readMore")} <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="mt-12 border-t border-border pt-8">
          <Link to="/blog"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> {t("moreArticles")}</Button></Link>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPost;
