import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={t("notFoundPage.seoTitle")} description={t("notFoundPage.seoDesc")} />
      <Navbar />
      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="font-display text-8xl font-bold text-primary/20">404</div>
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground md:text-3xl">{t("notFoundPage.title")}</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          {t("notFoundPage.desc")}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/">
            <Button className="gradient-primary border-0">
              <Home className="mr-2 h-4 w-4" /> {t("notFoundPage.backHome")}
            </Button>
          </Link>
          <Link to="/browse">
            <Button variant="outline">
              <Search className="mr-2 h-4 w-4" /> {t("notFoundPage.browseCars")}
            </Button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
