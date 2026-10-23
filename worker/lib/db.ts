import {
  DEFAULT_CONTENT,
  DEFAULT_SETTINGS,
  formatRef,
  type Enquiry,
  type EnquiryPriority,
  type EnquiryStatus,
  type Settings,
  type SiteContent,
  type TradeId,
} from "../../src/cms/content";
import { mergeDeep } from "../../src/cms/shared";

/* ------------------------------------------------------- content & settings */

const readDoc = async <T>(db: D1Database, key: string, fallback: T): Promise<T> => {
  const row = await db.prepare("SELECT json FROM kv WHERE key = ?").bind(key).first<{ json: string }>();
  if (!row) return fallback;
  try {
    // Merge over defaults so fields added in later releases always exist.
    return mergeDeep(fallback, JSON.parse(row.json) as Record<string, unknown>);
  } catch {
    return fallback;
  }
};

const writeDoc = (db: D1Database, key: string, value: unknown) =>
  db
    .prepare(
      "INSERT INTO kv (key, json, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET json = ?2, updated_at = ?3"
    )
    .bind(key, JSON.stringify(value), new Date().toISOString());

export const getContent = (db: D1Database) => readDoc<SiteContent>(db, "content", DEFAULT_CONTENT);
export const getSettings = (db: D1Database) => readDoc<Settings>(db, "settings", DEFAULT_SETTINGS);
export const saveContent = (db: D1Database, value: SiteContent) => writeDoc(db, "content", value).run();
export const saveSettings = (db: D1Database, value: Settings) => writeDoc(db, "settings", value).run();
export const docStatement = writeDoc;

/* ---------------------------------------------------------------- enquiries */

interface EnquiryRow {
  id: string;
  ref: string;
  created_at: string;
  trades: string;
  job_type: string;
  site_mode: string;
  name: string;
  contact: string;
  location: string;
  details: string;
  status: string;
  priority: string;
  read: number;
  notes: string;
}

const parseTrades = (raw: string): TradeId[] => {
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) ? (value as TradeId[]) : [];
  } catch {
    return [];
  }
};

export const rowToEnquiry = (row: EnquiryRow): Enquiry => ({
  id: row.id,
  ref: row.ref,
  createdAt: row.created_at,
  trades: parseTrades(row.trades),
  jobType: row.job_type,
  siteMode: row.site_mode,
  name: row.name,
  contact: row.contact,
  location: row.location,
  details: row.details,
  status: row.status as EnquiryStatus,
  priority: row.priority as EnquiryPriority,
  read: row.read === 1,
  notes: row.notes,
});

export const listEnquiries = async (db: D1Database): Promise<Enquiry[]> => {
  const { results } = await db
    .prepare("SELECT * FROM enquiries ORDER BY created_at DESC")
    .all<EnquiryRow>();
  return results.map(rowToEnquiry);
};

export const getEnquiry = async (db: D1Database, id: string): Promise<Enquiry | null> => {
  const row = await db.prepare("SELECT * FROM enquiries WHERE id = ?").bind(id).first<EnquiryRow>();
  return row ? rowToEnquiry(row) : null;
};

export const insertEnquiryStatement = (db: D1Database, e: Enquiry) =>
  db
    .prepare(
      `INSERT INTO enquiries (id, ref, created_at, trades, job_type, site_mode, name, contact, location, details, status, priority, read, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      e.id,
      e.ref,
      e.createdAt,
      JSON.stringify(e.trades),
      e.jobType,
      e.siteMode,
      e.name,
      e.contact,
      e.location,
      e.details,
      e.status,
      e.priority,
      e.read ? 1 : 0,
      e.notes
    );

/** Next NP-YYYYMM-NNN reference for the month of `date`, allocated atomically. */
export const nextRef = async (db: D1Database, date: Date): Promise<string> => {
  const ym = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  const row = await db
    .prepare(
      "INSERT INTO ref_counters (ym, seq) VALUES (?, 1) ON CONFLICT(ym) DO UPDATE SET seq = seq + 1 RETURNING seq"
    )
    .bind(ym)
    .first<{ seq: number }>();
  return formatRef(date, row?.seq ?? 1);
};
