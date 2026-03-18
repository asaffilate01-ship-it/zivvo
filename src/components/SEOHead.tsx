import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  type?: string;
  image?: string;
  jsonLd?: object;
}

const SEOHead = ({
  title = "AutoSouq — Buy & Sell Cars with Confidence",
  description = "Browse thousands of verified vehicles from trusted dealers and private sellers. Finance checks, full history reports, and transparent pricing.",
  canonical,
  type = "website",
  image = "https://lovable.dev/opengraph-image-p98pqg.png",
  jsonLd,
}: SEOHeadProps) => {
  const fullTitle = title.includes("AutoSouq") ? title : `${title} | AutoSouq`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

export default SEOHead;
