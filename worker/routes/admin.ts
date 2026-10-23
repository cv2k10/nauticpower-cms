import { Hono } from "hono";
import { z } from "zod";
import { DEFAULT_CONTENT, DEFAULT_SETTINGS, seedEnquiries } from "../../src/cms/content";
import { mergeDeep } from "../../src/cms/shared";
import { issueSession, storePasscode, verifyPasscode } from "../lib/auth";
import {
  getContent,
  getEnquiry,
  getSettings,
  insertEnquiryStatement,
  listEnquiries,
  nextRef,
  saveContent,
  saveSettings,
} from "../lib/db";
import { readJson } from "../lib/http";
import { enquiryPatchSchema, idsSchema, passcodeSchema, settingsSchema, siteContentSchema } from "../lib/schema";
import type { AppEnv } from "../types";

const MAX_CONTENT_BYTES = 512 * 1024;

export const adminRoutes = new Hono<AppEnv>()
  /* ------------------------------------------------------ content & settings */
  .get("/content", async (c) => c.json(await getContent(c.env.DB)))

  .put("/content", async (c) => {
    if (Number(c.req.header("content-length") ?? 0) > MAX_CONTENT_BYTES) {
      return c.json({ error: "Content is too large" }, 413);
    }
    const body = await readJson(c, siteContentSchema);
    if ("response" in body) return body.response;
    await saveContent(c.env.DB, body.data);
    return c.json({ ok: true, savedAt: new Date().toISOString() });
  })

  .get("/settings", async (c) => c.json(await getSettings(c.env.DB)))

  .put("/settings", async (c) => {
    const body = await readJson(c, settingsSchema);
    if ("response" in body) return body.response;
    await saveSettings(c.env.DB, body.data);
    return c.json({ ok: true, savedAt: new Date().toISOString() });
  })

  /** Restores default copy and the default accent; other settings are kept. */
  .post("/reset", async (c) => {
    const settings = await getSettings(c.env.DB);
    const next = { ...settings, accent: DEFAULT_SETTINGS.accent, accentPreset: DEFAULT_SETTINGS.accentPreset };
    await c.env.DB.prepare("DELETE FROM kv WHERE key = 'content'").run();
    await saveSettings(c.env.DB, next);
    return c.json({ content: DEFAULT_CONTENT, settings: next });
  })

  .get("/export", async (c) => {
    const [content, settings] = await Promise.all([getContent(c.env.DB), getSettings(c.env.DB)]);
    const stamp = new Date().toISOString().slice(0, 10);
    c.header("Content-Disposition", `attachment; filename="nauticpower-content-${stamp}.json"`);
    return c.json({ content, settings, exportedAt: new Date().toISOString() });
  })

  .post("/import", async (c) => {
    const body = await readJson(c, z.object({ content: z.unknown(), settings: z.unknown() }).partial());
    if ("response" in body) return body.response;
    const { content: rawContent, settings: rawSettings } = body.data;
    const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
    if (!isObject(rawContent) && !isObject(rawSettings)) {
      return c.json({ error: "No content or settings found in that file." }, 400);
    }

    const content = isObject(rawContent) ? siteContentSchema.safeParse(mergeDeep(DEFAULT_CONTENT, rawContent)) : null;
    if (content && !content.success) {
      const issue = content.error.issues[0];
      return c.json({ error: `Content in that file is invalid (${issue?.path.join(".")}: ${issue?.message})` }, 400);
    }
    const settings = isObject(rawSettings) ? settingsSchema.safeParse(mergeDeep(DEFAULT_SETTINGS, rawSettings)) : null;
    if (settings && !settings.success) {
      return c.json({ error: "Settings in that file are invalid." }, 400);
    }

    if (content?.success) await saveContent(c.env.DB, content.data);
    if (settings?.success) await saveSettings(c.env.DB, settings.data);
    const [nextContent, nextSettings] = await Promise.all([getContent(c.env.DB), getSettings(c.env.DB)]);
    return c.json({ content: nextContent, settings: nextSettings });
  })

  .put("/passcode", async (c) => {
    const body = await readJson(c, passcodeSchema);
    if ("response" in body) return body.response;
    if ((await verifyPasscode(c.env, body.data.current)) === null) {
      return c.json({ error: "Current passcode is incorrect." }, 400);
    }
    const version = await storePasscode(c.env.DB, body.data.next);
    // Other sessions are now invalid; keep this one signed in.
    await issueSession(c, version);
    return c.json({ ok: true });
  })

  /* --------------------------------------------------------------- enquiries */
  .get("/enquiries", async (c) => c.json(await listEnquiries(c.env.DB)))

  .patch("/enquiries/:id", async (c) => {
    const body = await readJson(c, enquiryPatchSchema);
    if ("response" in body) return body.response;
    const sets: string[] = [];
    const values: (string | number)[] = [];
    const patch = body.data;
    if (patch.status !== undefined) (sets.push("status = ?"), values.push(patch.status));
    if (patch.priority !== undefined) (sets.push("priority = ?"), values.push(patch.priority));
    if (patch.read !== undefined) (sets.push("read = ?"), values.push(patch.read ? 1 : 0));
    if (patch.notes !== undefined) (sets.push("notes = ?"), values.push(patch.notes));
    const id = c.req.param("id");
    if (sets.length) {
      await c.env.DB.prepare(`UPDATE enquiries SET ${sets.join(", ")} WHERE id = ?`)
        .bind(...values, id)
        .run();
    }
    const enquiry = await getEnquiry(c.env.DB, id);
    return enquiry ? c.json(enquiry) : c.json({ error: "Enquiry not found" }, 404);
  })

  .delete("/enquiries/:id", async (c) => {
    await c.env.DB.prepare("DELETE FROM enquiries WHERE id = ?").bind(c.req.param("id")).run();
    return c.json({ ok: true });
  })

  .post("/enquiries/bulk-delete", async (c) => {
    const body = await readJson(c, idsSchema);
    if ("response" in body) return body.response;
    const stmt = c.env.DB.prepare("DELETE FROM enquiries WHERE id = ?");
    await c.env.DB.batch(body.data.ids.map((id) => stmt.bind(id)));
    return c.json({ ok: true });
  })

  .post("/enquiries/mark-all-read", async (c) => {
    await c.env.DB.prepare("UPDATE enquiries SET read = 1 WHERE read = 0").run();
    return c.json({ ok: true });
  })

  .post("/enquiries/sample", async (c) => {
    // Oldest first so the reference sequence reads in date order.
    const seeds = seedEnquiries().reverse();
    for (const seed of seeds) seed.ref = await nextRef(c.env.DB, new Date(seed.createdAt));
    await c.env.DB.batch(seeds.map((seed) => insertEnquiryStatement(c.env.DB, seed)));
    return c.json({ count: seeds.length, enquiries: await listEnquiries(c.env.DB) });
  })

  .delete("/enquiries", async (c) => {
    await c.env.DB.prepare("DELETE FROM enquiries").run();
    return c.json({ ok: true });
  });
