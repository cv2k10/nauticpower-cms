import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { requireAdmin } from "./lib/auth";
import { getContent } from "./lib/db";
import { renderHeadTags, robotsTxt, sitemapXml } from "./lib/seo";
import { adminRoutes } from "./routes/admin";
import { authRoutes } from "./routes/auth";
import { mediaRoutes } from "./routes/media";
import { loadSite, publicRoutes } from "./routes/public";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

app.use("*", secureHeaders({ crossOriginResourcePolicy: false, crossOriginEmbedderPolicy: false }));

app.route("/", publicRoutes);
app.route("/api/auth", authRoutes);
app.use("/api/admin/*", requireAdmin);
app.route("/api/admin", adminRoutes);
app.route("/api/admin/media", mediaRoutes);

app.all("/api/*", (c) => c.json({ error: "Not found" }, 404));

app.get("/robots.txt", async (c) => {
  c.header("Cache-Control", "public, max-age=300");
  return c.text(robotsTxt(await getContent(c.env.DB), c.req.url, c.env.SITE_URL));
});

app.get("/sitemap.xml", async (c) => {
  const row = await c.env.DB.prepare("SELECT updated_at FROM kv WHERE key = 'content'").first<{ updated_at: string }>();
  const lastModified = (row?.updated_at ?? new Date().toISOString()).slice(0, 10);
  c.header("Content-Type", "application/xml; charset=utf-8");
  c.header("Cache-Control", "public, max-age=300");
  return c.body(sitemapXml(await getContent(c.env.DB), c.req.url, lastModified, c.env.SITE_URL));
});

/** Asset responses have immutable headers; copy them so middleware (secureHeaders) can add to them. */
const mutable = (res: Response): Response => new Response(res.body, res);

/**
 * Serve the SPA shell with the published content inlined, so the first render already shows
 * the live copy (no flash of the bundled defaults, and crawlers see real text).
 */
app.get("*", async (c) => {
  const url = new URL(c.req.url);
  if (url.pathname !== "/" && url.pathname !== "/index.html") return mutable(await c.env.ASSETS.fetch(c.req.raw));

  const [shell, site] = await Promise.all([
    c.env.ASSETS.fetch(new Request(new URL("/", url), c.req.raw)),
    loadSite(c.env).catch((err: unknown) => {
      console.error("Could not load site content for boot payload", err);
      return null;
    }),
  ]);
  if (!site || !shell.headers.get("content-type")?.includes("text/html")) return mutable(shell);

  // Escape "<" so content can never close the script element.
  const json = JSON.stringify(site).replace(/</g, "\\u003c");
  const headTags = renderHeadTags(site.content, c.req.url, c.env.SITE_URL);
  const res = new HTMLRewriter()
    // The CMS SEO settings replace the static defaults in index.html.
    .on("title, meta[name='description'], meta[name='theme-color']", {
      element(el) {
        el.remove();
      },
    })
    .on("head", {
      element(head) {
        head.append(`${headTags}\n    <script>window.__NP_BOOT__=${json}</script>`, { html: true });
      },
    })
    .transform(shell);

  const headers = new Headers(res.headers);
  headers.set("Cache-Control", "no-store");
  headers.delete("ETag");
  headers.delete("Content-Length");
  return new Response(res.body, { status: res.status, headers });
});

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Something went wrong on the server." }, 500);
});

export default app;
