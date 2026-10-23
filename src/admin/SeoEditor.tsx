import { useCallback } from "react";
import { ArrowUpRight, Globe } from "lucide-react";
import { useCms } from "../cms/store";
import type { SeoSettings } from "../cms/content";
import { Field, Panel, SelectInput, TextArea, TextInput, Toggle } from "./ui";
import { ImageField } from "./Media";

const BUSINESS_TYPES = [
  { value: "HomeAndConstructionBusiness", label: "Home & construction business" },
  { value: "LocalBusiness", label: "Local business (generic)" },
  { value: "AutoRepair", label: "Auto repair" },
  { value: "Electrician", label: "Electrician" },
  { value: "GeneralContractor", label: "General contractor" },
  { value: "ProfessionalService", label: "Professional service" },
];

/** "42 / 60 characters" hint that warns once a field runs past what search engines show. */
const lengthHint = (value: string, ideal: number, note: string): string => {
  const n = value.trim().length;
  return `${n} / ${ideal} characters${n > ideal ? " — likely to be cut off" : ""}. ${note}`;
};

const hostOf = (canonical: string): string => {
  try {
    return new URL(canonical).host;
  } catch {
    return window.location.host;
  }
};

export const SeoEditor = () => {
  const { content, setContent } = useCms();
  const { seo } = content;

  const patch = useCallback(
    (value: Partial<SeoSettings>) => setContent((prev) => ({ ...prev, seo: { ...prev.seo, ...value } })),
    [setContent]
  );
  const patchBusiness = useCallback(
    (value: Partial<SeoSettings["business"]>) =>
      setContent((prev) => ({ ...prev, seo: { ...prev.seo, business: { ...prev.seo.business, ...value } } })),
    [setContent]
  );

  const title = seo.siteTitle.trim() || content.brand.name;
  const ogTitle = seo.ogTitle.trim() || title;
  const ogDescription = seo.ogDescription.trim() || seo.metaDescription.trim();
  const host = hostOf(seo.canonicalUrl);
  const canonicalInvalid = seo.canonicalUrl.trim() !== "" && !/^https?:\/\/[^\s/]+/.test(seo.canonicalUrl.trim());

  return (
    <div className="space-y-6">
      <header>
        <p className="label-mono text-ember">ADMIN · SEO</p>
        <h1 className="display-wide mt-2 text-[clamp(1.7rem,3.2vw,2.4rem)] text-ink">SEO &amp; sharing</h1>
        <p className="mt-2 text-[13.5px] text-steel max-w-2xl">
          Site title, search description, social share card and business details. These are written into the
          page's HTML on the server, so search engines and link previews see them straight away.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-[12.5px] font-semibold">
          {["/robots.txt", "/sitemap.xml"].map((path) => (
            <a
              key={path}
              href={path}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-steel hover:text-ink"
            >
              {path}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 space-y-6">
          <Panel eyebrow="SEARCH" title="Search results">
            <div className="space-y-4">
              <Field
                label="Site title"
                htmlFor="seo-title"
                hint={lengthHint(seo.siteTitle, 60, "Shown in the browser tab and as the search result headline.")}
              >
                <TextInput id="seo-title" value={seo.siteTitle} onChange={(e) => patch({ siteTitle: e.target.value })} />
              </Field>
              <Field
                label="Meta description"
                htmlFor="seo-desc"
                hint={lengthHint(seo.metaDescription, 160, "The summary under the title in search results.")}
              >
                <TextArea
                  id="seo-desc"
                  rows={3}
                  value={seo.metaDescription}
                  onChange={(e) => patch({ metaDescription: e.target.value })}
                />
              </Field>
              <Field label="Keywords" htmlFor="seo-keywords" hint="Comma-separated. Google ignores these; some other engines still read them.">
                <TextInput id="seo-keywords" value={seo.keywords} onChange={(e) => patch({ keywords: e.target.value })} />
              </Field>
              <Field
                label="Canonical site URL"
                htmlFor="seo-canonical"
                hint={
                  canonicalInvalid
                    ? "Not a valid URL yet — it must start with https:// (the current address is used until then)."
                    : "The preferred public address. Leave blank to use the SITE_URL set in wrangler.jsonc."
                }
              >
                <TextInput
                  id="seo-canonical"
                  type="url"
                  placeholder={window.location.origin}
                  value={seo.canonicalUrl}
                  onChange={(e) => patch({ canonicalUrl: e.target.value })}
                />
              </Field>
              <Toggle
                checked={seo.noindex}
                onChange={(noindex) => patch({ noindex })}
                label="Hide this site from search engines"
                hint="Adds noindex and blocks crawlers in robots.txt. Use for staging copies, not the live site."
              />
            </div>
          </Panel>

          <Panel eyebrow="SOCIAL" title="Share card" description="How the link looks when shared on Facebook, LinkedIn, X or in messaging apps.">
            <div className="space-y-4">
              <Field label="Share title" htmlFor="seo-og-title" hint="Leave blank to use the site title.">
                <TextInput
                  id="seo-og-title"
                  placeholder={title}
                  value={seo.ogTitle}
                  onChange={(e) => patch({ ogTitle: e.target.value })}
                />
              </Field>
              <Field label="Share description" htmlFor="seo-og-desc" hint="Leave blank to use the meta description.">
                <TextArea
                  id="seo-og-desc"
                  rows={2}
                  placeholder={seo.metaDescription}
                  value={seo.ogDescription}
                  onChange={(e) => patch({ ogDescription: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageField
                  id="seo-og-image"
                  label="Share image (1200 × 630 works best)"
                  value={seo.ogImage}
                  onChange={(url) => patch({ ogImage: url })}
                />
                <Field label="Share image alt text" htmlFor="seo-og-alt">
                  <TextInput id="seo-og-alt" value={seo.ogImageAlt} onChange={(e) => patch({ ogImageAlt: e.target.value })} />
                </Field>
              </div>
              <Field label="X (Twitter) handle" htmlFor="seo-twitter" hint="Optional, e.g. @nauticpower.">
                <TextInput
                  id="seo-twitter"
                  placeholder="@handle"
                  value={seo.twitterHandle}
                  onChange={(e) => patch({ twitterHandle: e.target.value })}
                />
              </Field>
            </div>
          </Panel>

          <Panel eyebrow="BUSINESS" title="Business details" description="Structured data that helps Google show your business name, contact details and service area.">
            <div className="space-y-4">
              <Toggle
                checked={seo.business.enabled}
                onChange={(enabled) => patchBusiness({ enabled })}
                label="Publish business structured data"
                hint="Adds schema.org LocalBusiness JSON-LD to the page."
              />
              {seo.business.enabled && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Business name" htmlFor="seo-biz-name">
                      <TextInput
                        id="seo-biz-name"
                        placeholder={content.brand.name}
                        value={seo.business.name}
                        onChange={(e) => patchBusiness({ name: e.target.value })}
                      />
                    </Field>
                    <Field label="Business type" htmlFor="seo-biz-type">
                      <SelectInput
                        id="seo-biz-type"
                        value={seo.business.type}
                        onChange={(e) => patchBusiness({ type: e.target.value })}
                      >
                        {BUSINESS_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                    <Field label="Phone" htmlFor="seo-biz-phone">
                      <TextInput id="seo-biz-phone" type="tel" value={seo.business.phone} onChange={(e) => patchBusiness({ phone: e.target.value })} />
                    </Field>
                    <Field label="Email" htmlFor="seo-biz-email">
                      <TextInput id="seo-biz-email" type="email" value={seo.business.email} onChange={(e) => patchBusiness({ email: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Street address" htmlFor="seo-biz-street" hint="Optional — leave blank if you only work on-site.">
                    <TextInput id="seo-biz-street" value={seo.business.streetAddress} onChange={(e) => patchBusiness({ streetAddress: e.target.value })} />
                  </Field>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Field label="Town / suburb" htmlFor="seo-biz-locality">
                      <TextInput id="seo-biz-locality" value={seo.business.locality} onChange={(e) => patchBusiness({ locality: e.target.value })} />
                    </Field>
                    <Field label="State" htmlFor="seo-biz-region">
                      <TextInput id="seo-biz-region" placeholder="NSW" value={seo.business.region} onChange={(e) => patchBusiness({ region: e.target.value })} />
                    </Field>
                    <Field label="Postcode" htmlFor="seo-biz-postcode">
                      <TextInput id="seo-biz-postcode" value={seo.business.postalCode} onChange={(e) => patchBusiness({ postalCode: e.target.value })} />
                    </Field>
                    <Field label="Country" htmlFor="seo-biz-country">
                      <TextInput id="seo-biz-country" placeholder="AU" value={seo.business.country} onChange={(e) => patchBusiness({ country: e.target.value })} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Area served" htmlFor="seo-biz-area">
                      <TextInput id="seo-biz-area" value={seo.business.areaServed} onChange={(e) => patchBusiness({ areaServed: e.target.value })} />
                    </Field>
                    <Field label="Opening hours" htmlFor="seo-biz-hours" hint="schema.org format, e.g. Mo-Fr 07:00-17:00.">
                      <TextInput id="seo-biz-hours" value={seo.business.openingHours} onChange={(e) => patchBusiness({ openingHours: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Price range" htmlFor="seo-biz-price" hint="Optional, e.g. $$.">
                    <TextInput id="seo-biz-price" value={seo.business.priceRange} onChange={(e) => patchBusiness({ priceRange: e.target.value })} />
                  </Field>
                </>
              )}
            </div>
          </Panel>

          <Panel eyebrow="ADVANCED" title="Browser &amp; verification">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Browser theme colour" htmlFor="seo-theme" hint="Tints the address bar on mobile.">
                <div className="flex gap-2">
                  <input
                    type="color"
                    aria-label="Pick theme colour"
                    value={/^#[0-9a-fA-F]{6}$/.test(seo.themeColor) ? seo.themeColor : "#101215"}
                    onChange={(e) => patch({ themeColor: e.target.value })}
                    className="h-10 w-12 rounded-[4px] border border-hairline bg-white cursor-pointer"
                  />
                  <TextInput id="seo-theme" value={seo.themeColor} onChange={(e) => patch({ themeColor: e.target.value })} />
                </div>
              </Field>
              <Field label="Locale" htmlFor="seo-locale" hint="Language and region, e.g. en_AU.">
                <TextInput id="seo-locale" value={seo.locale} onChange={(e) => patch({ locale: e.target.value })} />
              </Field>
              <Field label="Google Search Console code" htmlFor="seo-google" hint="Only the content value of the HTML-tag method.">
                <TextInput id="seo-google" value={seo.googleVerification} onChange={(e) => patch({ googleVerification: e.target.value })} />
              </Field>
              <Field label="Bing Webmaster code" htmlFor="seo-bing" hint="Only the content value of the msvalidate.01 tag.">
                <TextInput id="seo-bing" value={seo.bingVerification} onChange={(e) => patch({ bingVerification: e.target.value })} />
              </Field>
            </div>
          </Panel>
        </div>

        {/* Live previews */}
        <div className="xl:col-span-5 space-y-6 xl:sticky xl:top-[92px]">
          <Panel eyebrow="PREVIEW" title="Search result">
            <div className="font-sans">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-chalk border border-hairline flex items-center justify-center text-steel">
                  <Globe className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] text-ink truncate">{content.brand.name}</p>
                  <p className="text-[12px] text-steel truncate">https://{host}</p>
                </div>
              </div>
              <p className="mt-2 text-[19px] leading-snug text-[#1a0dab] line-clamp-1">{title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-steel line-clamp-2">
                {seo.metaDescription.trim() || "Add a meta description to control this text."}
              </p>
              {seo.noindex && (
                <p className="mt-3 label-mono text-[#a3231c]">Hidden from search engines</p>
              )}
            </div>
          </Panel>

          <Panel eyebrow="PREVIEW" title="Share card">
            <div className="border border-hairline rounded-[6px] overflow-hidden">
              <div className="aspect-[1200/630] bg-chalk">
                {seo.ogImage.trim() ? (
                  <img src={seo.ogImage} alt={seo.ogImageAlt} className="w-full h-full object-cover" />
                ) : (
                  <p className="h-full flex items-center justify-center text-[12.5px] text-mist">No share image</p>
                )}
              </div>
              <div className="px-3.5 py-3 bg-chalk/60 border-t border-hairline">
                <p className="text-[11.5px] uppercase tracking-wide text-mist">{host}</p>
                <p className="mt-0.5 text-[14.5px] font-semibold text-ink line-clamp-1">{ogTitle}</p>
                <p className="mt-0.5 text-[12.5px] text-steel line-clamp-2">{ogDescription}</p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
