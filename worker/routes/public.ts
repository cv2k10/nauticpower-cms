import { Hono } from "hono";
import { uid, type Enquiry } from "../../src/cms/content";
import { getContent, getSettings, insertEnquiryStatement, nextRef } from "../lib/db";
import { sendEnquiryEmail } from "../lib/email";
import { readJson } from "../lib/http";
import { newEnquirySchema } from "../lib/schema";
import type { AppEnv } from "../types";

export const loadSite = async (env: Env) => {
  const [content, settings] = await Promise.all([getContent(env.DB), getSettings(env.DB)]);
  return { content, settings };
};

export const publicRoutes = new Hono<AppEnv>()
  .get("/api/site", async (c) => {
    c.header("Cache-Control", "no-store");
    return c.json(await loadSite(c.env));
  })

  .post("/api/enquiries", async (c) => {
    const body = await readJson(c, newEnquirySchema);
    if ("response" in body) return body.response;
    const input = body.data;

    const now = new Date();
    // Bots that fill the honeypot get a convincing response and nothing is stored.
    if (input.website) {
      return c.json({ enquiry: { ref: "NP-000000-000", createdAt: now.toISOString() } }, 201);
    }

    const enquiry: Enquiry = {
      id: uid("enq"),
      ref: await nextRef(c.env.DB, now),
      createdAt: now.toISOString(),
      trades: [...new Set(input.trades)],
      jobType: input.jobType,
      siteMode: input.siteMode,
      name: input.name,
      contact: input.contact,
      location: input.location,
      details: input.details,
      status: "new",
      priority: input.urgent || input.jobType === "Breakdown / Urgent" ? "urgent" : "standard",
      read: false,
      notes: "",
    };
    await insertEnquiryStatement(c.env.DB, enquiry).run();

    const settings = await getSettings(c.env.DB);
    if (settings.enquiriesEmailForward) {
      c.executionCtx.waitUntil(
        sendEnquiryEmail(c.env, enquiry).catch((err: unknown) =>
          console.error(`Enquiry email for ${enquiry.ref} failed`, err)
        )
      );
    }

    return c.json({ enquiry }, 201);
  })

  .get("/media/:key", async (c) => {
    const key = c.req.param("key");
    const ifNoneMatch = c.req.header("if-none-match");
    const object = await c.env.MEDIA.get(key, ifNoneMatch ? { onlyIf: { etagDoesNotMatch: ifNoneMatch.replace(/"/g, "") } } : undefined);
    if (!object) return c.notFound();

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("ETag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("X-Content-Type-Options", "nosniff");
    if (!("body" in object)) return new Response(null, { status: 304, headers });
    return new Response(object.body, { headers });
  });
