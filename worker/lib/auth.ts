import type { Context, MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { AppEnv } from "../types";

export const SESSION_COOKIE = "np_session";
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const PBKDF2_ITERATIONS = 100_000; // Workers caps PBKDF2 at 100k iterations.
const MAX_FAILURES = 10;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;

const encoder = new TextEncoder();

const toB64 = (bytes: ArrayBuffer | Uint8Array): string => {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let out = "";
  view.forEach((b) => (out += String.fromCharCode(b)));
  return btoa(out).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromB64 = (value: string): Uint8Array => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
};

const timingSafeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
};

/* ------------------------------------------------------------- passcodes */

const derive = async (passcode: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> => {
  const key = await crypto.subtle.importKey("raw", encoder.encode(passcode), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    256
  );
  return new Uint8Array(bits);
};

export const hashPasscode = async (passcode: string) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(passcode, salt, PBKDF2_ITERATIONS);
  return { hash: toB64(hash), salt: toB64(salt), iterations: PBKDF2_ITERATIONS };
};

interface AuthRow {
  hash: string;
  salt: string;
  iterations: number;
  session_version: number;
}

const getAuthRow = (db: D1Database) =>
  db.prepare("SELECT hash, salt, iterations, session_version FROM admin_auth WHERE id = 1").first<AuthRow>();

/**
 * Checks a passcode. On first run (no row yet) the ADMIN_PASSCODE secret is accepted and
 * immediately stored as a PBKDF2 hash. Returns the session version on success.
 */
export const verifyPasscode = async (env: Env, passcode: string): Promise<number | null> => {
  const row = await getAuthRow(env.DB);
  if (!row) {
    const bootstrap = env.ADMIN_PASSCODE?.trim();
    if (!bootstrap) return null;
    if (!timingSafeEqual(encoder.encode(passcode.trim()), encoder.encode(bootstrap))) return null;
    await storePasscode(env.DB, bootstrap, 1);
    return 1;
  }
  const actual = await derive(passcode.trim(), fromB64(row.salt), row.iterations);
  return timingSafeEqual(actual, fromB64(row.hash)) ? row.session_version : null;
};

/** Stores a new passcode hash. Returns the new session version (bumped to sign out old sessions). */
export const storePasscode = async (db: D1Database, passcode: string, version?: number): Promise<number> => {
  const { hash, salt, iterations } = await hashPasscode(passcode);
  const row = await db
    .prepare(
      `INSERT INTO admin_auth (id, hash, salt, iterations, session_version, updated_at) VALUES (1, ?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(id) DO UPDATE SET hash = ?1, salt = ?2, iterations = ?3, session_version = session_version + 1, updated_at = ?5
       RETURNING session_version`
    )
    .bind(hash, salt, iterations, version ?? 1, new Date().toISOString())
    .first<{ session_version: number }>();
  return row?.session_version ?? 1;
};

/* ------------------------------------------------------- login throttling */

export const clientIp = (c: Context): string => c.req.header("cf-connecting-ip") ?? "local";

export const isLockedOut = async (db: D1Database, ip: string): Promise<boolean> => {
  const since = Date.now() - FAILURE_WINDOW_MS;
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND at > ?")
    .bind(ip, since)
    .first<{ n: number }>();
  return (row?.n ?? 0) >= MAX_FAILURES;
};

export const recordFailure = (db: D1Database, ip: string) =>
  db.batch([
    db.prepare("INSERT INTO login_attempts (ip, at) VALUES (?, ?)").bind(ip, Date.now()),
    db.prepare("DELETE FROM login_attempts WHERE at < ?").bind(Date.now() - FAILURE_WINDOW_MS),
  ]);

export const clearFailures = (db: D1Database, ip: string) =>
  db.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();

/* --------------------------------------------------------------- sessions */

const hmacKey = (secret: string) =>
  crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);

const requireSecret = (env: Env): string => {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 16) {
    throw new Error("SESSION_SECRET must be set to a random string of at least 16 characters");
  }
  return env.SESSION_SECRET;
};

export const issueSession = async (c: Context<AppEnv>, version: number): Promise<void> => {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = toB64(encoder.encode(`${exp}.${version}`));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(requireSecret(c.env)), encoder.encode(payload));
  setCookie(c, SESSION_COOKIE, `${payload}.${toB64(sig)}`, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === "https:",
    sameSite: "Strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
};

export const clearSession = (c: Context<AppEnv>) => deleteCookie(c, SESSION_COOKIE, { path: "/" });

export const hasValidSession = async (c: Context<AppEnv>): Promise<boolean> => {
  const raw = getCookie(c, SESSION_COOKIE);
  if (!raw) return false;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return false;
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(requireSecret(c.env)),
      fromB64(sig) as BufferSource,
      encoder.encode(payload)
    );
    if (!ok) return false;
    const [expRaw, versionRaw] = new TextDecoder().decode(fromB64(payload)).split(".");
    if (Number(expRaw) < Math.floor(Date.now() / 1000)) return false;
    const row = await getAuthRow(c.env.DB);
    return Number(versionRaw) === (row?.session_version ?? 1);
  } catch {
    return false;
  }
};

/** Admin-only routes: valid session cookie, plus a custom header on writes (CSRF guard). */
export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!(await hasValidSession(c))) return c.json({ error: "Not signed in" }, 401);
  if (c.req.method !== "GET" && c.req.method !== "HEAD" && c.req.header("x-requested-with") !== "nauticpower-cms") {
    return c.json({ error: "Missing request header" }, 403);
  }
  await next();
};
