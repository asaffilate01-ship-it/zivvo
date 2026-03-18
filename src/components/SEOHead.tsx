import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  type?: string;
  image?: string;
  imageAlt?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string;
  locale?: string;
}

const SITE_URL = "https://autosouq.app";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

const SEOHead = ({
  title = "AutoSouq — Buy & Sell Cars with Confidence",
  description = "Browse thousands of verified vehicles from trusted dealers and private sellers. Finance checks, full history reports, and transparent pricing across UK, UAE, USA & Pakistan.",
  canonical,
  type = "website",
  image = DEFAULT_IMAGE,
  imageAlt = "AutoSouq — Used car marketplace",
  jsonLd,
  noindex = false,
  publishedTime,
  modifiedTime,
  author = "AutoSouq",
  keywords,
  locale = "en_GB",
}: SEOHeadProps) => {
  const fullTitle = title.includes("AutoSouq") ? title : `${title} | AutoSouq`;
  const canonicalUrl = canonical || (typeof window !== "undefined" ? `${SITE_URL}${window.location.pathname}` : SITE_URL);
  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name" content="AutoSouq" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={locale} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {type === "article" && <meta property="article:author" content={author} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@AutoSouq" />
      <meta name="twitter:creator" content="@AutoSouq" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={imageAlt} />

      {/* Geo targeting */}
      <meta name="geo.region" content="GB" />
      <meta name="geo.placename" content="United Kingdom" />

      {/* JSON-LD */}
      {jsonLdArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
