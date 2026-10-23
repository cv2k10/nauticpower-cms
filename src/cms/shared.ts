/* Helpers shared by the React app and the Worker — no DOM or React imports here. */
import { TRADE_META, type Enquiry } from "./content";

/** Keeps new default keys while preserving any stored overrides. */
export function mergeDeep<T>(base: T, patch: Record<string, unknown>): T {
  if (Array.isArray(base)) return base;
  if (base === null || typeof base !== "object") return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  Object.keys(patch).forEach((key) => {
    const next = patch[key];
    const current = out[key];
    if (
      next &&
      typeof next === "object" &&
      !Array.isArray(next) &&
      current &&
      typeof current === "object" &&
      !Array.isArray(current)
    ) {
      out[key] = mergeDeep(current, next as Record<string, unknown>);
    } else if (next !== undefined) {
      out[key] = next;
    }
  });
  return out as T;
}

export const enquiriesToCsv = (rows: Enquiry[]): string => {
  const headers = [
    "Reference",
    "Received",
    "Status",
    "Priority",
    "Trades",
    "Job Type",
    "Site / Delivery",
    "Name / Business",
    "Phone or Email",
    "Location",
    "Details",
    "Internal Notes",
    "Read",
  ];
  const escape = (value: string): string => `"${value.replace(/"/g, '""')}"`;
  const lines = rows.map((row) =>
    [
      row.ref,
      new Date(row.createdAt).toISOString(),
      row.status,
      row.priority,
      row.trades.join(" | "),
      row.jobType,
      row.siteMode,
      row.name,
      row.contact,
      row.location,
      row.details,
      row.notes,
      row.read ? "yes" : "no",
    ]
      .map((cell) => escape(String(cell ?? "")))
      .join(",")
  );
  return [headers.map(escape).join(","), ...lines].join("\r\n");
};

const tradeLabels = (enquiry: Enquiry): string =>
  enquiry.trades.map((id) => TRADE_META[id]?.label ?? id).join(", ");

export const enquiryEmailSubject = (enquiry: Enquiry): string =>
  `Job Enquiry ${enquiry.ref} [${enquiry.trades.map((id) => TRADE_META[id]?.label ?? id).join(" + ") || "Multi-Trade"} — ${
    enquiry.jobType
  }]${enquiry.location ? ` — ${enquiry.location}` : ""}`;

export const enquiryEmailText = (enquiry: Enquiry): string =>
  [
    `NAUTIC POWER — ENQUIRY ${enquiry.ref}`,
    `Received: ${new Date(enquiry.createdAt).toLocaleString("en-AU", { timeZone: "Australia/Sydney" })}`,
    "",
    `Trades required: ${tradeLabels(enquiry) || "General / multi-trade"}`,
    `Job type: ${enquiry.jobType}`,
    `Work location: ${enquiry.siteMode}`,
    `Priority: ${enquiry.priority}`,
    "",
    `Name / Business: ${enquiry.name}`,
    `Phone / Email: ${enquiry.contact}`,
    `Site / Town: ${enquiry.location || "Not specified"}`,
    "",
    "Job scope & details:",
    enquiry.details,
  ].join("\n");

/** mailto: link for the admin's own "Reply by email" actions. */
export const buildEnquiryEmail = (enquiry: Enquiry, email: string): string =>
  `mailto:${email}?subject=${encodeURIComponent(enquiryEmailSubject(enquiry))}&body=${encodeURIComponent(
    enquiryEmailText(enquiry)
  )}`;
