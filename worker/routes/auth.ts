import { Hono } from "hono";
import {
  clearFailures,
  clearSession,
  clientIp,
  hasValidSession,
  isLockedOut,
  issueSession,
  recordFailure,
  verifyPasscode,
} from "../lib/auth";
import { readJson } from "../lib/http";
import { loginSchema } from "../lib/schema";
import type { AppEnv } from "../types";

export const authRoutes = new Hono<AppEnv>()
  .get("/session", async (c) => c.json({ authed: await hasValidSession(c) }))

  .post("/login", async (c) => {
    const ip = clientIp(c);
    if (await isLockedOut(c.env.DB, ip)) {
      return c.json({ error: "Too many failed attempts. Try again in 15 minutes." }, 429);
    }
    const body = await readJson(c, loginSchema);
    if ("response" in body) return body.response;

    const version = await verifyPasscode(c.env, body.data.passcode);
    if (version === null) {
      await recordFailure(c.env.DB, ip);
      return c.json({ error: "That passcode is not recognised." }, 401);
    }
    await clearFailures(c.env.DB, ip);
    await issueSession(c, version);
    return c.json({ authed: true });
  })

  .post("/logout", (c) => {
    clearSession(c);
    return c.json({ authed: false });
  });
