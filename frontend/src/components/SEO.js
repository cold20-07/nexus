import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = 'Medical Consulting for Veterans',
  description = 'Professional medical documentation services for VA disability claims. Expert nexus letters, DBQs, and medical consultations for veterans seeking disability benefits and compensation.',
  keywords = 'VA nexus letter, DBQ, disability benefits questionnaire, aid and attendance, C&P exam, veteran medical documentation',
  ogImage = '/og-image.jpg',
  article = false,
  publishedTime,
  modifiedTime,
  author = 'Military Disability Nexus',
  canonical,
  structuredData
}) => {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-site.vercel.app';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : siteUrl;
  const canonicalUrl = canonical || currentUrl;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title} | Military Disability Nexus</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={article ? 'article' : 'website'} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:site_name" content="Military Disability Nexus" />

      {/* Article specific */}
      {article && (
        <>
          <meta property="article:author" content={author} />
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content={author} />
      <meta name="language" content="English" />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
