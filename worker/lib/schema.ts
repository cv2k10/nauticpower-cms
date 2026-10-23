import { z } from "zod";
import type { Enquiry, Settings, SiteContent } from "../../src/cms/content";

const str = (max = 4000) => z.string().max(max);
const id = str(80);

const textItem = z.object({ id, text: str(400) });
const tradeId = z.enum(["fabrication", "mechanical", "electrical"]);

export const siteContentSchema = z.object({
  brand: z.object({ name: str(120), tagline: str(200), subTagline: str(200) }),
  hero: z.object({
    badge: str(200),
    headline: str(400),
    body: str(),
    primaryCta: str(120),
    secondaryCta: str(120),
    image: str(1000),
    imageAlt: str(400),
    footerNote: str(400),
  }),
  ticker: z.array(textItem).max(60),
  stats: z
    .array(
      z.object({ id, value: z.number().finite(), suffix: str(20), label: str(200), note: str(400) })
    )
    .max(20),
  overview: z.object({
    eyebrow: str(200),
    headline: str(400),
    bodyA: str(),
    bodyB: str(),
    factALabel: str(200),
    factAValue: str(200),
    factBLabel: str(200),
    factBValue: str(200),
    closingLine: str(400),
    switcherNote: str(400),
  }),
  trades: z
    .array(
      z.object({
        id: tradeId,
        index: str(20),
        title: str(200),
        eyebrow: str(200),
        headline: str(400),
        summary: str(),
        image: str(1000),
        imageAlt: str(400),
        deliveryMode: str(200),
        items: z.array(z.object({ id, name: str(200), detail: str(1000) })).max(60),
      })
    )
    .max(3),
  coverage: z.object({
    eyebrow: str(200),
    headline: str(400),
    body: str(),
    modes: z.array(z.object({ id, title: str(200), note: str(1000) })).max(20),
    image: str(1000),
    imageAlt: str(400),
    sectorsHeading: str(200),
    sectors: z.array(z.object({ id, code: str(20), name: str(200), description: str(1000) })).max(30),
  }),
  ctaBand: z.object({
    eyebrow: str(200),
    headline: str(400),
    body: str(),
    image: str(1000),
    imageAlt: str(400),
    primaryCta: str(120),
    secondaryLabel: str(200),
  }),
  contact: z.object({
    eyebrow: str(200),
    headline: str(400),
    body: str(),
    email: str(200),
    facebookLabel: str(200),
    facebookUrl: str(1000),
    facebookNote: str(400),
    emailNote: str(400),
    promiseTitle: str(200),
    promiseNote: str(400),
    formTitle: str(200),
    formNote: str(400),
    jobTypes: z.array(textItem).max(30),
    siteModes: z.array(textItem).max(30),
    successHeadline: str(200),
    successNote: str(400),
  }),
  footer: z.object({ blurb: str(), badge: str(200), promise: str(400), adminNote: str(200) }),
  seo: z.object({
    siteTitle: str(200),
    metaDescription: str(500),
    keywords: str(500),
    // Free text here so autosave never rejects half-typed values; worker/lib/seo.ts sanitises on render.
    canonicalUrl: str(500),
    noindex: z.boolean(),
    ogTitle: str(200),
    ogDescription: str(500),
    ogImage: str(1000),
    ogImageAlt: str(400),
    twitterHandle: str(40),
    themeColor: str(20),
    locale: str(20),
    googleVerification: str(200),
    bingVerification: str(200),
    business: z.object({
      enabled: z.boolean(),
      type: str(80),
      name: str(200),
      phone: str(60),
      email: str(200),
      streetAddress: str(300),
      locality: str(120),
      region: str(120),
      postalCode: str(20),
      country: str(60),
      areaServed: str(300),
      openingHours: str(200),
      priceRange: str(20),
    }),
  }),
}) satisfies z.ZodType<SiteContent>;

export const settingsSchema = z.object({
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentPreset: str(40),
  enquiriesEmailForward: z.boolean(),
}) satisfies z.ZodType<Settings>;

export const newEnquirySchema = z.object({
  trades: z.array(tradeId).max(3),
  jobType: z.string().trim().min(1).max(120),
  siteMode: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(200),
  contact: z.string().trim().min(3).max(200),
  location: z.string().trim().max(300).default(""),
  details: z.string().trim().min(1).max(5000),
  urgent: z.boolean().optional(),
  /** Honeypot — real visitors never fill this in. */
  website: z.string().optional(),
});

export const enquiryPatchSchema = z
  .object({
    status: z.enum(["new", "quoted", "scheduled", "completed", "archived"]),
    priority: z.enum(["standard", "urgent"]),
    read: z.boolean(),
    notes: str(5000),
  })
  .partial() satisfies z.ZodType<Partial<Enquiry>>;

export const idsSchema = z.object({ ids: z.array(id).min(1).max(500) });

export const loginSchema = z.object({ passcode: z.string().min(1).max(200) });

export const passcodeSchema = z.object({
  current: z.string().min(1).max(200),
  next: z.string().trim().min(4).max(200),
});
