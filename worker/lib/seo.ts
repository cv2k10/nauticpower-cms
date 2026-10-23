import type { SiteContent } from "../../src/cms/content";

const escapeAttr = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const clean = (value: string | undefined): string => (value ?? "").trim();

const httpOrigin = (value: string | undefined): string | null => {
  const raw = clean(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  } catch {
    return null;
  }
};

/**
 * Public origin for canonical/OG URLs: the CMS canonical URL, then the SITE_URL var, then the
 * request origin.
 */
export const siteOrigin = (content: SiteContent, requestUrl: string, siteUrl?: string): string =>
  httpOrigin(content.seo.canonicalUrl) ?? httpOrigin(siteUrl) ?? new URL(requestUrl).origin;

const absolute = (value: string, origin: string): string => {
  try {
    return new URL(value, `${origin}/`).toString();
  } catch {
    return "";
  }
};

const businessJsonLd = (content: SiteContent, origin: string, image: string) => {
  const b = content.seo.business;
  const address = {
    "@type": "PostalAddress",
    streetAddress: clean(b.streetAddress) || undefined,
    addressLocality: clean(b.locality) || undefined,
    addressRegion: clean(b.region) || undefined,
    postalCode: clean(b.postalCode) || undefined,
    addressCountry: clean(b.country) || undefined,
  };
  const hasAddress = Object.entries(address).some(([key, value]) => key !== "@type" && value);
  return {
    "@context": "https://schema.org",
    "@type": clean(b.type) || "LocalBusiness",
    name: clean(b.name) || content.brand.name,
    description: clean(content.seo.metaDescription) || undefined,
    url: `${origin}/`,
    image: image || undefined,
    telephone: clean(b.phone) || undefined,
    email: clean(b.email) || undefined,
    address: hasAddress ? address : undefined,
    areaServed: clean(b.areaServed) || undefined,
    openingHours: clean(b.openingHours) || undefined,
    priceRange: clean(b.priceRange) || undefined,
    sameAs: clean(content.contact.facebookUrl) ? [clean(content.contact.facebookUrl)] : undefined,
  };
};

/** Every SEO tag for <head>. The Worker strips the static title/description/theme-color first. */
export const renderHeadTags = (content: SiteContent, requestUrl: string, siteUrl?: string): string => {
  const seo = content.seo;
  const origin = siteOrigin(content, requestUrl, siteUrl);
  const title = clean(seo.siteTitle) || content.brand.name;
  const description = clean(seo.metaDescription);
  const ogTitle = clean(seo.ogTitle) || title;
  const ogDescription = clean(seo.ogDescription) || description;
  const image = clean(seo.ogImage) ? absolute(clean(seo.ogImage), origin) : "";
  const twitter = clean(seo.twitterHandle).replace(/^@?/, "@");
  const themeColor = /^#[0-9a-fA-F]{6}$/.test(clean(seo.themeColor)) ? clean(seo.themeColor) : "";
  const locale = /^[a-z]{2}_[A-Z]{2}$/.test(clean(seo.locale)) ? clean(seo.locale) : "";

  const meta = (attr: "name" | "property", key: string, value: string) =>
    value ? `<meta ${attr}="${key}" content="${escapeAttr(value)}" />` : "";

  const tags = [
    `<title>${escapeAttr(title)}</title>`,
    meta("name", "description", description),
    meta("name", "keywords", clean(seo.keywords)),
    meta("name", "robots", seo.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"),
    meta("name", "theme-color", themeColor),
    `<link rel="canonical" href="${escapeAttr(`${origin}/`)}" />`,
    meta("property", "og:type", "website"),
    meta("property", "og:site_name", content.brand.name),
    meta("property", "og:title", ogTitle),
    meta("property", "og:description", ogDescription),
    meta("property", "og:url", `${origin}/`),
    meta("property", "og:locale", locale),
    meta("property", "og:image", image),
    meta("property", "og:image:alt", clean(seo.ogImageAlt)),
    meta("name", "twitter:card", image ? "summary_large_image" : "summary"),
    meta("name", "twitter:site", twitter.length > 1 ? twitter : ""),
    meta("name", "twitter:title", ogTitle),
    meta("name", "twitter:description", ogDescription),
    meta("name", "twitter:image", image),
    meta("name", "google-site-verification", clean(seo.googleVerification)),
    meta("name", "msvalidate.01", clean(seo.bingVerification)),
  ];

  if (seo.business.enabled) {
    // Escape "<" so business text can never close the script element.
    const json = JSON.stringify(businessJsonLd(content, origin, image)).replace(/</g, "\\u003c");
    tags.push(`<script type="application/ld+json">${json}</script>`);
  }
  return tags.filter(Boolean).join("\n    ");
};

export const robotsTxt = (content: SiteContent, requestUrl: string, siteUrl?: string): string => {
  const origin = siteOrigin(content, requestUrl, siteUrl);
  return content.seo.noindex
    ? "User-agent: *\nDisallow: /\n"
    : `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`;
};

export const sitemapXml = (
  content: SiteContent,
  requestUrl: string,
  lastModified: string,
  siteUrl?: string
): string => {
  const origin = siteOrigin(content, requestUrl, siteUrl);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeAttr(`${origin}/`)}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
};
