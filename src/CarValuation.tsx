import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Star, ArrowRight, ThumbsUp, ThumbsDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const reviews = [
  {
    slug: "bmw-3-series",
    make: "BMW",
    model: "3 Series",
    year: "2024-2025",
    rating: 9,
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80",
    summary: "The BMW 3 Series remains the benchmark for compact sports sedans, offering a perfect blend of performance, technology, and luxury.",
    pros: ["Engaging driving dynamics", "Premium interior quality", "Excellent tech features"],
    cons: ["Firm ride on sport models", "Options can get expensive"],
    category: "Sedan",
  },
  {
    slug: "tesla-model-3",
    make: "Tesla",
    model: "Model 3",
    year: "2024-2025",
    rating: 8,
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600&q=80",
    summary: "The Tesla Model 3 Highland refresh brings improved range, a refined interior, and the best EV tech in its class.",
    pros: ["Industry-leading range", "Supercharger network", "OTA updates"],
    cons: ["Build quality inconsistencies", "No CarPlay/Android Auto"],
    category: "Electric",
  },
  {
    slug: "land-rover-defender",
    make: "Land Rover",
    model: "Defender",
    year: "2024-2025",
    rating: 8,
    image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=600&q=80",
    summary: "The Defender combines genuine off-road capability with modern luxury and head-turning style.",
    pros: ["Unmatched off-road ability", "Iconic design", "Spacious interior"],
    cons: ["Reliability concerns", "High price tag"],
    category: "SUV",
  },
  {
    slug: "volkswagen-golf",
    make: "Volkswagen",
    model: "Golf",
    year: "2024-2025",
    rating: 8,
    image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=80",
    summary: "The quintessential hatchback continues to set the standard for everyday usability and driver satisfaction.",
    pros: ["Refined driving experience", "Solid build quality", "Practical interior"],
    cons: ["Infotainment can lag", "Not the cheapest in class"],
    category: "Hatchback",
  },
  {
    slug: "porsche-911",
    make: "Porsche",
    model: "911",
    year: "2024-2025",
    rating: 10,
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80",
    summary: "The 911 is an icon for good reason — it delivers supercar performance with everyday usability.",
    pros: ["Thrilling performance", "Timeless design", "Daily driveable"],
    cons: ["Expensive options", "Small rear seats"],
    category: "Sports",
  },
  {
    slug: "hyundai-tucson",
    make: "Hyundai",
    model: "Tucson",
    year: "2024-2025",
    rating: 8,
    image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80",
    summary: "Bold styling, great value, and excellent hybrid options make the Tucson a top family SUV choice.",
    pros: ["Striking design", "Great value for money", "Long warranty"],
    cons: ["Firm ride", "Infotainment learning curve"],
    category: "SUV",
  },
];

const RatingBadge = ({ rating }: { rating: number }) => {
  const color = rating >= 9 ? "bg-success text-white" : rating >= 7 ? "bg-primary text-primary-foreground" : "bg-warning text-warning-foreground";
  return (
    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${color}`}>
      {rating}
    </span>
  );
};

const CarReviews = () => {
  const { t } = useTranslation();
  return (
  <div className="min-h-screen bg-background">
    <SEOHead
      title={t("carReviews.seo.title")}
      description={t("carReviews.seo.description")}
    />
    <Navbar />

    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <Badge variant="outline" className="mb-3 text-xs">{t("carReviews.badge")}</Badge>
        <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
          {t("carReviews.title1")}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> {t("carReviews.title2")}</span>
        </h1>
        <p className="mt-2 text-muted-foreground">{t("carReviews.subtitle")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review, i) => (
          <motion.div
            key={review.slug}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            viewport={{ once: true }}
          >
            <Card className="group overflow-hidden transition-all hover:shadow-elevated hover:-translate-y-1">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={review.image} alt={`${review.make} ${review.model}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent" />
                <div className="absolute top-3 left-3">
                  <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-[10px]">{review.category}</Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <RatingBadge rating={review.rating} />
                </div>
                <div className="absolute bottom-3 left-3">
                  <h3 className="font-display text-lg font-bold text-primary-foreground">{review.make} {review.model}</h3>
                  <p className="text-xs text-primary-foreground/70">{review.year}</p>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{review.summary}</p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-success mb-1">
                      <ThumbsUp className="h-3 w-3" /> {t("carReviews.pros")}
                    </div>
                    {review.pros.slice(0, 2).map((p) => (
                      <p key={p} className="text-[11px] text-muted-foreground truncate">• {p}</p>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-destructive mb-1">
                      <ThumbsDown className="h-3 w-3" /> {t("carReviews.cons")}
                    </div>
                    {review.cons.slice(0, 2).map((c) => (
                      <p key={c} className="text-[11px] text-muted-foreground truncate">• {c}</p>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={`h-3 w-3 ${j < Math.round(review.rating / 2) ? "fill-warning text-warning" : "text-muted"}`} />
                    ))}
                  </div>
                  <Link to={`/browse?make=${review.make}`}>
                    <Button variant="ghost" size="sm" className="text-primary text-xs h-7">
                      {t("carReviews.browse", { make: review.make })} <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>

    <Footer />
  </div>
  );
};

export default CarReviews;
