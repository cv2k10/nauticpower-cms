import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import type { Enquiry, SiteContent } from "../src/cms/content";

const ORIGIN = "https://nauticpower.test";
const WRITE_HEADERS = { "Content-Type": "application/json", "X-Requested-With": "nauticpower-cms" };

const call = (path: string, init: RequestInit = {}) => SELF.fetch(`${ORIGIN}${path}`, init);

const login = async (passcode = "test-passcode", ip = "10.0.0.1"): Promise<string> => {
  const res = await call("/api/auth/login", {
    method: "POST",
    headers: { ...WRITE_HEADERS, "cf-connecting-ip": ip },
    body: JSON.stringify({ passcode }),
  });
  expect(res.status).toBe(200);
  const cookie = res.headers.get("set-cookie") ?? "";
  expect(cookie).toContain("HttpOnly");
  return cookie.split(";")[0];
};

const admin = (cookie: string, path: string, init: RequestInit = {}) =>
  call(path, { ...init, headers: { ...WRITE_HEADERS, Cookie: cookie, ...(init.headers ?? {}) } });

const newEnquiry = {
  trades: ["electrical"],
  jobType: "Repairs",
  siteMode: "On-Site — Rural / Farm",
  name: "Test Customer",
  contact: "test@example.com",
  location: "Dubbo NSW",
  details: "Bore pump tripping the RCD.",
};

describe("auth", () => {
  it("rejects admin routes without a session", async () => {
    const res = await call("/api/admin/enquiries");
    expect(res.status).toBe(401);
  });

  it("rejects a wrong passcode and locks out after repeated failures", async () => {
    const ip = "10.9.9.9";
    for (let i = 0; i < 10; i++) {
      const res = await call("/api/auth/login", {
        method: "POST",
        headers: { ...WRITE_HEADERS, "cf-connecting-ip": ip },
        body: JSON.stringify({ passcode: "wrong" }),
      });
      expect(res.status).toBe(401);
    }
    const locked = await call("/api/auth/login", {
      method: "POST",
      headers: { ...WRITE_HEADERS, "cf-connecting-ip": ip },
      body: JSON.stringify({ passcode: "test-passcode" }),
    });
    expect(locked.status).toBe(429);
  });

  it("signs in with the bootstrap passcode and reports the session", async () => {
    const cookie = await login();
    const res = await call("/api/auth/session", { headers: { Cookie: cookie } });
    expect(await res.json()).toEqual({ authed: true });
  });

  it("requires the CSRF header on admin writes", async () => {
    const cookie = await login();
    const res = await call("/api/admin/enquiries/mark-all-read", { method: "POST", headers: { Cookie: cookie } });
    expect(res.status).toBe(403);
  });

  it("changing the passcode revokes other sessions", async () => {
    const other = await login();
    const mine = await login();
    const res = await admin(mine, "/api/admin/passcode", {
      method: "PUT",
      body: JSON.stringify({ current: "test-passcode", next: "new-passcode" }),
    });
    expect(res.status).toBe(200);
    const fresh = (res.headers.get("set-cookie") ?? "").split(";")[0];

    expect((await admin(other, "/api/admin/enquiries")).status).toBe(401);
    expect((await admin(fresh, "/api/admin/enquiries")).status).toBe(200);

    // Old passcode no longer works; restore the original for the remaining tests.
    const oldLogin = await call("/api/auth/login", {
      method: "POST",
      headers: { ...WRITE_HEADERS, "cf-connecting-ip": "10.0.0.2" },
      body: JSON.stringify({ passcode: "test-passcode" }),
    });
    expect(oldLogin.status).toBe(401);
    await admin(fresh, "/api/admin/passcode", {
      method: "PUT",
      body: JSON.stringify({ current: "new-passcode", next: "test-passcode" }),
    });
  });
});

describe("content", () => {
  it("publishes saved content to the public site and the boot payload", async () => {
    const cookie = await login();
    const { content } = (await (await call("/api/site")).json()) as { content: SiteContent };
    const next = { ...content, hero: { ...content.hero, headline: "Welded </script> & wired" } };

    const put = await admin(cookie, "/api/admin/content", { method: "PUT", body: JSON.stringify(next) });
    expect(put.status).toBe(200);

    const site = (await (await call("/api/site")).json()) as { content: SiteContent };
    expect(site.content.hero.headline).toBe("Welded </script> & wired");
  });

  it("rejects invalid content and invalid imports", async () => {
    const cookie = await login();
    const bad = await admin(cookie, "/api/admin/content", { method: "PUT", body: JSON.stringify({ hero: 1 }) });
    expect(bad.status).toBe(400);

    const badImport = await admin(cookie, "/api/admin/import", {
      method: "POST",
      body: JSON.stringify({ content: { trades: [{}] } }),
    });
    expect(badImport.status).toBe(400);
  });

  it("resets content to defaults", async () => {
    const cookie = await login();
    const res = await admin(cookie, "/api/admin/reset", { method: "POST" });
    const body = (await res.json()) as { content: SiteContent };
    expect(body.content.hero.headline).not.toContain("</script>");
  });
});

describe("enquiries", () => {
  it("accepts a public enquiry and lets the admin triage it", async () => {
    const created = await call("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newEnquiry, urgent: true }),
    });
    expect(created.status).toBe(201);
    const { enquiry } = (await created.json()) as { enquiry: Enquiry };
    expect(enquiry.ref).toMatch(/^NP-\d{6}-\d{3}$/);
    expect(enquiry.priority).toBe("urgent");

    const cookie = await login();
    const list = (await (await admin(cookie, "/api/admin/enquiries")).json()) as Enquiry[];
    expect(list.find((row) => row.id === enquiry.id)?.read).toBe(false);

    const patched = await admin(cookie, `/api/admin/enquiries/${enquiry.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "quoted", read: true, notes: "Quote sent" }),
    });
    expect(((await patched.json()) as Enquiry).status).toBe("quoted");

    await admin(cookie, "/api/admin/enquiries/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids: [enquiry.id] }),
    });
    const after = (await (await admin(cookie, "/api/admin/enquiries")).json()) as Enquiry[];
    expect(after.some((row) => row.id === enquiry.id)).toBe(false);
  });

  it("issues unique sequential references", async () => {
    const refs = new Set<string>();
    for (let i = 0; i < 3; i++) {
      const res = await call("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEnquiry),
      });
      refs.add(((await res.json()) as { enquiry: Enquiry }).enquiry.ref);
    }
    expect(refs.size).toBe(3);
  });

  it("drops honeypot submissions", async () => {
    const cookie = await login();
    const before = ((await (await admin(cookie, "/api/admin/enquiries")).json()) as Enquiry[]).length;
    await call("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newEnquiry, website: "http://spam.example" }),
    });
    const after = ((await (await admin(cookie, "/api/admin/enquiries")).json()) as Enquiry[]).length;
    expect(after).toBe(before);
  });

  it("loads and clears sample enquiries", async () => {
    const cookie = await login();
    const res = await admin(cookie, "/api/admin/enquiries/sample", { method: "POST" });
    expect(((await res.json()) as { count: number }).count).toBe(6);
    await admin(cookie, "/api/admin/enquiries", { method: "DELETE" });
    const list = (await (await admin(cookie, "/api/admin/enquiries")).json()) as Enquiry[];
    expect(list).toHaveLength(0);
  });
});

describe("media", () => {
  it("uploads to R2, serves it publicly and deletes it", async () => {
    const cookie = await login();
    const form = new FormData();
    form.append("file", new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "rig.jpg", { type: "image/jpeg" }));
    const up = await call("/api/admin/media", {
      method: "POST",
      headers: { Cookie: cookie, "X-Requested-With": "nauticpower-cms" },
      body: form,
    });
    expect(up.status).toBe(201);
    const item = (await up.json()) as { key: string; url: string };

    const served = await call(item.url);
    expect(served.status).toBe(200);
    expect(served.headers.get("content-type")).toBe("image/jpeg");
    await served.arrayBuffer();

    const del = await admin(cookie, `/api/admin/media/${item.key}`, { method: "DELETE" });
    expect(del.status).toBe(200);
    expect((await call(item.url)).status).toBe(404);
  });

  it("rejects SVG uploads", async () => {
    const cookie = await login();
    const form = new FormData();
    form.append("file", new File(["<svg/>"], "x.svg", { type: "image/svg+xml" }));
    const res = await call("/api/admin/media", {
      method: "POST",
      headers: { Cookie: cookie, "X-Requested-With": "nauticpower-cms" },
      body: form,
    });
    expect(res.status).toBe(415);
  });
});

describe("seo", () => {
  it("renders CMS SEO settings into the page head, robots.txt and sitemap", async () => {
    const cookie = await login();
    const { content } = (await (await call("/api/site")).json()) as { content: SiteContent };
    const next: SiteContent = {
      ...content,
      seo: {
        ...content.seo,
        siteTitle: "Bizpress Test Title",
        metaDescription: 'Fabrication "quoted" & <tagged>',
        canonicalUrl: "https://bizpress.example.com",
        ogImage: "/images/hero-rig.jpg",
        business: { ...content.seo.business, enabled: true, name: "Biz </script> Co" },
      },
    };
    expect((await admin(cookie, "/api/admin/content", { method: "PUT", body: JSON.stringify(next) })).status).toBe(200);

    // The SPA shell comes from static assets; in tests ASSETS may 404, so check the renderer directly too.
    const { renderHeadTags, robotsTxt } = await import("../worker/lib/seo");
    const head = renderHeadTags(next, `${ORIGIN}/`);
    expect(head).toContain("<title>Bizpress Test Title</title>");
    expect(head).toContain('content="Fabrication &quot;quoted&quot; &amp; &lt;tagged&gt;"');
    expect(head).toContain('<link rel="canonical" href="https://bizpress.example.com/" />');
    expect(head).toContain('property="og:image" content="https://bizpress.example.com/images/hero-rig.jpg"');
    expect(head).toContain("application/ld+json");
    expect(head).not.toContain("</script> Co");
    expect(robotsTxt(next, ORIGIN)).toContain("Sitemap: https://bizpress.example.com/sitemap.xml");
    expect(robotsTxt({ ...next, seo: { ...next.seo, noindex: true } }, ORIGIN)).toContain("Disallow: /\n");

    const robots = await call("/robots.txt");
    expect(await robots.text()).toContain("https://bizpress.example.com/sitemap.xml");
    const sitemap = await call("/sitemap.xml");
    expect(sitemap.headers.get("content-type")).toContain("xml");
    expect(await sitemap.text()).toContain("<loc>https://bizpress.example.com/</loc>");

    await admin(cookie, "/api/admin/reset", { method: "POST" });
  });
});
