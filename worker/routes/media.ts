import { Hono } from "hono";
import { uid } from "../../src/cms/content";
import type { AppEnv } from "../types";

const MAX_BYTES = 10 * 1024 * 1024;
// Raster formats only — SVG could carry script and is served from the site's own origin.
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export interface MediaItem {
  key: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
}

interface MediaRow {
  key: string;
  filename: string;
  content_type: string;
  size: number;
  created_at: string;
}

const toItem = (row: MediaRow): MediaItem => ({
  key: row.key,
  url: `/media/${row.key}`,
  filename: row.filename,
  contentType: row.content_type,
  size: row.size,
  createdAt: row.created_at,
});

export const mediaRoutes = new Hono<AppEnv>()
  .get("/", async (c) => {
    const { results } = await c.env.DB.prepare("SELECT * FROM media ORDER BY created_at DESC").all<MediaRow>();
    return c.json(results.map(toItem));
  })

  .post("/", async (c) => {
    if (Number(c.req.header("content-length") ?? 0) > MAX_BYTES + 64 * 1024) {
      return c.json({ error: "Images must be 10 MB or smaller." }, 413);
    }
    const form = await c.req.formData().catch(() => null);
    const file = form?.get("file");
    if (!file || typeof file === "string") return c.json({ error: "No file uploaded." }, 400);
    const ext = ALLOWED[file.type];
    if (!ext) return c.json({ error: "Upload a JPG, PNG, WebP, GIF or AVIF image." }, 415);
    if (file.size > MAX_BYTES) return c.json({ error: "Images must be 10 MB or smaller." }, 413);

    const row: MediaRow = {
      key: `${uid("img")}.${ext}`,
      filename: file.name.slice(0, 200) || `upload.${ext}`,
      content_type: file.type,
      size: file.size,
      created_at: new Date().toISOString(),
    };
    // R2 needs a known length, so buffer the (≤10 MB) file rather than streaming it.
    await c.env.MEDIA.put(row.key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
    await c.env.DB.prepare("INSERT INTO media (key, filename, content_type, size, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(row.key, row.filename, row.content_type, row.size, row.created_at)
      .run();
    return c.json(toItem(row), 201);
  })

  .delete("/:key", async (c) => {
    const key = c.req.param("key");
    await c.env.MEDIA.delete(key);
    await c.env.DB.prepare("DELETE FROM media WHERE key = ?").bind(key).run();
    return c.json({ ok: true });
  });
