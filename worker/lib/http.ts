import type { Context } from "hono";
import type { z } from "zod";
import type { AppEnv } from "../types";

/** Parses and validates a JSON body. Returns the data, or a 400 Response to return as-is. */
export const readJson = async <S extends z.ZodType>(
  c: Context<AppEnv>,
  schema: S
): Promise<{ data: z.infer<S> } | { response: Response }> => {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return { response: c.json({ error: "Request body must be JSON" }, 400) };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path.length ? ` (${issue.path.join(".")})` : "";
    return { response: c.json({ error: `Invalid data${where}: ${issue?.message ?? "unknown"}` }, 400) };
  }
  return { data: parsed.data };
};
