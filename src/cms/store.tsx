import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_CONTENT,
  DEFAULT_SETTINGS,
  formatRef,
  seedEnquiries,
  uid,
  type Enquiry,
  type NewEnquiry,
  type Settings,
  type SiteContent,
} from "./content";

const CONTENT_KEY = "nauticpower.cms.content.v1";
const SETTINGS_KEY = "nauticpower.cms.settings.v1";
const ENQUIRY_KEY = "nauticpower.cms.enquiries.v1";
const AUTH_KEY = "nauticpower.cms.session";

/* ------------------------------------------------------------- utilities */

const readStore = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== "object") return fallback;
    return mergeDeep(fallback, parsed as Record<string, unknown>) as T;
  } catch {
    return fallback;
  }
};

const writeStore = (key: string, value: unknown): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — app still works in-memory */
  }
};

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

const download = (filename: string, mime: string, data: string): void => {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1200);
};

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

export const buildEnquiryEmail = (enquiry: Enquiry, email: string): string => {
  const subject = encodeURIComponent(
    `Job Enquiry ${enquiry.ref} [${enquiry.trades.join(" + ") || "Multi-Trade"} — ${enquiry.jobType}]${
      enquiry.location ? ` — ${enquiry.location}` : ""
    }`
  );
  const body = encodeURIComponent(
    [
      `NAUTIC POWER — ENQUIRY ${enquiry.ref}`,
      `Received: ${new Date(enquiry.createdAt).toLocaleString("en-AU")}`,
      "",
      `Trades required: ${enquiry.trades.join(", ") || "General / multi-trade"}`,
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
    ].join("\n")
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
};

/* ----------------------------------------------------------------- types */

export interface CmsApi {
  content: SiteContent;
  settings: Settings;
  enquiries: Enquiry[];
  unreadCount: number;
  isAuthed: boolean;
  login: (passcode: string) => boolean;
  logout: () => void;
  setContent: (updater: (current: SiteContent) => SiteContent) => void;
  resetContent: () => void;
  replaceContent: (next: SiteContent) => void;
  setSettings: (updater: (current: Settings) => Settings) => void;
  addEnquiry: (input: NewEnquiry) => Enquiry;
  updateEnquiry: (id: string, patch: Partial<Enquiry>) => void;
  deleteEnquiry: (id: string) => void;
  deleteEnquiries: (ids: string[]) => void;
  markAllRead: () => void;
  loadSampleEnquiries: () => number;
  clearEnquiries: () => void;
  exportContentJson: () => void;
  exportEnquiriesCsv: (rows: Enquiry[]) => void;
  importJson: (raw: string) => { ok: boolean; message: string };
}

const CmsContext = createContext<CmsApi | null>(null);

export const useCms = (): CmsApi => {
  const ctx = useContext(CmsContext);
  if (!ctx) throw new Error("useCms must be used inside <CmsProvider>");
  return ctx;
};

/* -------------------------------------------------------------- provider */

export const CmsProvider = ({ children }: { children: ReactNode }) => {
  const [content, setContentState] = useState<SiteContent>(() =>
    readStore(CONTENT_KEY, DEFAULT_CONTENT)
  );
  const [settings, setSettingsState] = useState<Settings>(() =>
    readStore(SETTINGS_KEY, DEFAULT_SETTINGS)
  );
  const [enquiries, setEnquiries] = useState<Enquiry[]>(() => {
    try {
      const raw = window.localStorage.getItem(ENQUIRY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Enquiry[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      /* fall through to seeding */
    }
    return DEFAULT_SETTINGS.demoEnquiries ? seedEnquiries() : [];
  });
  const [isAuthed, setIsAuthed] = useState<boolean>(() => {
    try {
      return window.sessionStorage.getItem(AUTH_KEY) === "1";
    } catch {
      return false;
    }
  });

  /* ------------------------------------------------------ persistence -- */
  useEffect(() => writeStore(CONTENT_KEY, content), [content]);
  useEffect(() => writeStore(SETTINGS_KEY, settings), [settings]);
  useEffect(() => writeStore(ENQUIRY_KEY, enquiries), [enquiries]);

  /* ------------------------------------------------- runtime theming ---- */
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", settings.accent);
    const preset =
      [
        { accent: "#c8500e", bright: "#e8621a" },
        { accent: "#a8760a", bright: "#d99b12" },
        { accent: "#a3231c", bright: "#cf362c" },
        { accent: "#1d6b45", bright: "#2a8f5d" },
        { accent: "#1b4f8a", bright: "#2a6cb3" },
      ].find((p) => p.accent.toLowerCase() === settings.accent.toLowerCase()) ?? null;
    root.style.setProperty("--accent-bright", preset ? preset.bright : settings.accent);
    root.style.setProperty(
      "--accent-ink",
      ["#d99b12"].includes(settings.accent.toLowerCase()) ? "#101215" : "#ffffff"
    );
  }, [settings.accent]);

  /* ------------------------------------------------------------ actions */
  const setContent = useCallback((updater: (current: SiteContent) => SiteContent) => {
    setContentState((prev) => updater(prev));
  }, []);

  const setSettings = useCallback((updater: (current: Settings) => Settings) => {
    setSettingsState((prev) => updater(prev));
  }, []);

  const login = useCallback(
    (passcode: string) => {
      const ok = passcode.trim().toLowerCase() === settings.passcode.trim().toLowerCase();
      if (ok) {
        setIsAuthed(true);
        try {
          window.sessionStorage.setItem(AUTH_KEY, "1");
        } catch {
          /* ignore */
        }
      }
      return ok;
    },
    [settings.passcode]
  );

  const logout = useCallback(() => {
    setIsAuthed(false);
    try {
      window.sessionStorage.removeItem(AUTH_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const addEnquiry = useCallback((input: NewEnquiry): Enquiry => {
    const now = new Date();
    const created: Enquiry = {
      id: uid("enq"),
      ref: formatRef(now, Math.floor(Math.random() * 900) + 100),
      createdAt: now.toISOString(),
      trades: input.trades,
      jobType: input.jobType,
      siteMode: input.siteMode,
      name: input.name,
      contact: input.contact,
      location: input.location,
      details: input.details,
      status: "new",
      priority: input.priority ?? (input.jobType === "Breakdown / Urgent" ? "urgent" : "standard"),
      read: false,
      notes: "",
    };
    setEnquiries((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateEnquiry = useCallback((id: string, patch: Partial<Enquiry>) => {
    setEnquiries((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }, []);

  const deleteEnquiry = useCallback((id: string) => {
    setEnquiries((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const deleteEnquiries = useCallback((ids: string[]) => {
    const set = new Set(ids);
    setEnquiries((prev) => prev.filter((row) => !set.has(row.id)));
  }, []);

  const markAllRead = useCallback(() => {
    setEnquiries((prev) => prev.map((row) => (row.read ? row : { ...row, read: true })));
  }, []);

  const loadSampleEnquiries = useCallback(() => {
    const seeds = seedEnquiries();
    setEnquiries((prev) => [...seeds, ...prev]);
    return seeds.length;
  }, []);

  const clearEnquiries = useCallback(() => setEnquiries([]), []);

  const exportContentJson = useCallback(() => {
    const stamp = new Date().toISOString().slice(0, 10);
    download(
      `nauticpower-content-${stamp}.json`,
      "application/json",
      JSON.stringify({ content, settings, exportedAt: new Date().toISOString() }, null, 2)
    );
  }, [content, settings]);

  const exportEnquiriesCsv = useCallback((rows: Enquiry[]) => {
    const stamp = new Date().toISOString().slice(0, 10);
    download(`nauticpower-enquiries-${stamp}.csv`, "text/csv;charset=utf-8;", enquiriesToCsv(rows));
  }, []);

  const importJson = useCallback(
    (raw: string) => {
      try {
        const parsed = JSON.parse(raw) as { content?: SiteContent; settings?: Settings };
        if (!parsed || typeof parsed !== "object") {
          return { ok: false, message: "That file is not valid JSON." };
        }
        if (parsed.content && typeof parsed.content === "object") {
          setContentState(mergeDeep(DEFAULT_CONTENT, parsed.content as unknown as Record<string, unknown>));
        }
        if (parsed.settings && typeof parsed.settings === "object") {
          setSettingsState(mergeDeep(DEFAULT_SETTINGS, parsed.settings as unknown as Record<string, unknown>));
        }
        if (!parsed.content && !parsed.settings) {
          return { ok: false, message: "No content or settings found in that file." };
        }
        return { ok: true, message: "Content imported and published." };
      } catch {
        return { ok: false, message: "Could not parse that JSON file." };
      }
    },
    []
  );

  const resetContent = useCallback(() => {
    setContentState(DEFAULT_CONTENT);
    setSettingsState((prev) => ({ ...prev, accent: DEFAULT_SETTINGS.accent, accentPreset: "weld" }));
  }, []);

  const unreadCount = useMemo(() => enquiries.filter((row) => !row.read).length, [enquiries]);

  const value = useMemo<CmsApi>(
    () => ({
      content,
      settings,
      enquiries,
      unreadCount,
      isAuthed,
      login,
      logout,
      setContent,
      resetContent,
      replaceContent: setContentState,
      setSettings,
      addEnquiry,
      updateEnquiry,
      deleteEnquiry,
      deleteEnquiries,
      markAllRead,
      loadSampleEnquiries,
      clearEnquiries,
      exportContentJson,
      exportEnquiriesCsv,
      importJson,
    }),
    [
      content,
      settings,
      enquiries,
      unreadCount,
      isAuthed,
      login,
      logout,
      setContent,
      resetContent,
      setSettings,
      addEnquiry,
      updateEnquiry,
      deleteEnquiry,
      deleteEnquiries,
      markAllRead,
      loadSampleEnquiries,
      clearEnquiries,
      exportContentJson,
      exportEnquiriesCsv,
      importJson,
    ]
  );

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
};
