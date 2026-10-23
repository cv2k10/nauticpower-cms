import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useToast } from "../admin/ui";
import { api, ApiError, errorMessage } from "./api";
import {
  ACCENT_PRESETS,
  DEFAULT_CONTENT,
  DEFAULT_SETTINGS,
  type Enquiry,
  type NewEnquiry,
  type Settings,
  type SiteContent,
} from "./content";
import { enquiriesToCsv } from "./shared";

export { buildEnquiryEmail, enquiriesToCsv, mergeDeep } from "./shared";

const SAVE_DELAY_MS = 800;

/* ------------------------------------------------------------- utilities */

interface SitePayload {
  content: SiteContent;
  settings: Settings;
}

declare global {
  interface Window {
    /** Injected into index.html by the Worker so the first render shows live content. */
    __NP_BOOT__?: SitePayload;
  }
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

/* ----------------------------------------------------------------- types */

export type SaveState = "idle" | "saving" | "saved" | "error";

export interface MediaItem {
  key: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
}

export interface Result {
  ok: boolean;
  message: string;
}

export interface CmsApi {
  content: SiteContent;
  settings: Settings;
  enquiries: Enquiry[];
  unreadCount: number;
  isAuthed: boolean;
  /** False until the session check has finished, so the admin doesn't flash the login screen. */
  authChecked: boolean;
  saveState: SaveState;
  login: (passcode: string) => Promise<Result>;
  logout: () => Promise<void>;
  changePasscode: (current: string, next: string) => Promise<Result>;
  setContent: (updater: (current: SiteContent) => SiteContent) => void;
  resetContent: () => Promise<Result>;
  setSettings: (updater: (current: Settings) => Settings) => void;
  addEnquiry: (input: NewEnquiry & { urgent?: boolean; website?: string }) => Promise<Enquiry>;
  updateEnquiry: (id: string, patch: Partial<Enquiry>) => void;
  deleteEnquiry: (id: string) => void;
  deleteEnquiries: (ids: string[]) => void;
  markAllRead: () => void;
  refreshEnquiries: () => Promise<void>;
  loadSampleEnquiries: () => Promise<number>;
  clearEnquiries: () => Promise<void>;
  exportContentJson: () => void;
  exportEnquiriesCsv: (rows: Enquiry[]) => void;
  importJson: (raw: string) => Promise<Result>;
  listMedia: () => Promise<MediaItem[]>;
  uploadMedia: (file: File) => Promise<MediaItem>;
  deleteMedia: (key: string) => Promise<void>;
}

const CmsContext = createContext<CmsApi | null>(null);

export const useCms = (): CmsApi => {
  const ctx = useContext(CmsContext);
  if (!ctx) throw new Error("useCms must be used inside <CmsProvider>");
  return ctx;
};

/* -------------------------------------------------------------- provider */

type DocKey = "content" | "settings";

export const CmsProvider = ({ children }: { children: ReactNode }) => {
  const toast = useToast();
  const boot = typeof window !== "undefined" ? window.__NP_BOOT__ : undefined;

  const [ready, setReady] = useState<boolean>(!!boot);
  const [content, setContentState] = useState<SiteContent>(boot?.content ?? DEFAULT_CONTENT);
  const [settings, setSettingsState] = useState<Settings>(boot?.settings ?? DEFAULT_SETTINGS);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isAuthed, setIsAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  /* -------------------------------------------------- initial loading -- */
  useEffect(() => {
    if (boot) return;
    api<SitePayload>("/api/site")
      .then((site) => {
        setContentState(site.content);
        setSettingsState(site.settings);
      })
      .catch(() => {
        /* fall back to the bundled defaults */
      })
      .finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api<{ authed: boolean }>("/api/auth/session")
      .then((res) => setIsAuthed(res.authed))
      .catch(() => setIsAuthed(false))
      .finally(() => setAuthChecked(true));
  }, []);

  /** Any 401 from an admin call means the session expired or was revoked. */
  const handleError = useCallback(
    (err: unknown, fallback?: string) => {
      if (err instanceof ApiError && err.status === 401) {
        setIsAuthed(false);
        toast("Your admin session has ended — sign in again.", "warn");
        return;
      }
      toast(fallback ? `${fallback}: ${errorMessage(err)}` : errorMessage(err), "warn");
    },
    [toast]
  );

  const refreshEnquiries = useCallback(async () => {
    try {
      setEnquiries(await api<Enquiry[]>("/api/admin/enquiries"));
    } catch (err) {
      handleError(err, "Could not load enquiries");
    }
  }, [handleError]);

  // New enquiries arrive from other visitors, so keep the desk fresh while signed in.
  useEffect(() => {
    if (!isAuthed) {
      setEnquiries([]);
      return;
    }
    void refreshEnquiries();
    const onFocus = () => void refreshEnquiries();
    const interval = window.setInterval(onFocus, 60_000);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthed, refreshEnquiries]);

  /* --------------------------------------------------------- auto-save -- */
  const latest = useRef({ content, settings });
  latest.current = { content, settings };
  const dirty = useRef<Set<DocKey>>(new Set());
  const timer = useRef<number | undefined>(undefined);
  const inFlight = useRef<Promise<void>>(Promise.resolve());

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    const keys = [...dirty.current];
    dirty.current.clear();
    if (!keys.length) return inFlight.current;
    setSaveState("saving");
    inFlight.current = inFlight.current.then(async () => {
      try {
        await Promise.all(keys.map((key) => api(`/api/admin/${key}`, { method: "PUT", json: latest.current[key] })));
        if (!dirty.current.size) setSaveState("saved");
      } catch (err) {
        keys.forEach((key) => dirty.current.add(key)); // retry on the next edit
        setSaveState("error");
        handleError(err, "Changes not saved");
      }
    });
    return inFlight.current;
  }, [handleError]);

  const scheduleSave = useCallback(
    (key: DocKey) => {
      dirty.current.add(key);
      setSaveState("saving");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void flush(), SAVE_DELAY_MS);
    },
    [flush]
  );

  // Don't lose the last keystrokes when the tab closes mid-debounce.
  useEffect(() => {
    const onHide = () => {
      if (!dirty.current.size) return;
      dirty.current.forEach((key) => {
        void fetch(`/api/admin/${key}`, {
          method: "PUT",
          keepalive: true,
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", "X-Requested-With": "nauticpower-cms" },
          body: JSON.stringify(latest.current[key]),
        });
      });
      dirty.current.clear();
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);

  // Keep the tab title in step with the SEO settings (the Worker renders it for crawlers).
  useEffect(() => {
    document.title = content.seo.siteTitle.trim() || content.brand.name;
  }, [content.seo.siteTitle, content.brand.name]);

  /* ------------------------------------------------- runtime theming ---- */
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", settings.accent);
    const preset =
      ACCENT_PRESETS.find((p) => p.accent.toLowerCase() === settings.accent.toLowerCase()) ?? null;
    root.style.setProperty("--accent-bright", preset ? preset.bright : settings.accent);
    root.style.setProperty(
      "--accent-ink",
      ["#d99b12"].includes(settings.accent.toLowerCase()) ? "#101215" : "#ffffff"
    );
  }, [settings.accent]);

  /* ------------------------------------------------------------ actions */
  const setContent = useCallback(
    (updater: (current: SiteContent) => SiteContent) => {
      setContentState((prev) => updater(prev));
      scheduleSave("content");
    },
    [scheduleSave]
  );

  const setSettings = useCallback(
    (updater: (current: Settings) => Settings) => {
      setSettingsState((prev) => updater(prev));
      scheduleSave("settings");
    },
    [scheduleSave]
  );

  const login = useCallback(async (passcode: string): Promise<Result> => {
    try {
      await api("/api/auth/login", { method: "POST", json: { passcode } });
      setIsAuthed(true);
      return { ok: true, message: "Signed in" };
    } catch (err) {
      return { ok: false, message: errorMessage(err) };
    }
  }, []);

  const logout = useCallback(async () => {
    await flush();
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setIsAuthed(false);
    setSaveState("idle");
  }, [flush]);

  const changePasscode = useCallback(async (current: string, next: string): Promise<Result> => {
    try {
      await api("/api/admin/passcode", { method: "PUT", json: { current, next } });
      return { ok: true, message: "Admin passcode updated — other sessions have been signed out." };
    } catch (err) {
      return { ok: false, message: errorMessage(err) };
    }
  }, []);

  const addEnquiry = useCallback(async (input: NewEnquiry & { urgent?: boolean; website?: string }) => {
    const res = await api<{ enquiry: Enquiry }>("/api/enquiries", { method: "POST", json: input });
    return res.enquiry;
  }, []);

  /** Optimistic update with rollback if the server rejects it. */
  const mutateEnquiries = useCallback(
    (apply: (rows: Enquiry[]) => Enquiry[], request: () => Promise<unknown>, failure: string) => {
      let snapshot: Enquiry[] = [];
      setEnquiries((prev) => {
        snapshot = prev;
        return apply(prev);
      });
      request().catch((err: unknown) => {
        setEnquiries(snapshot);
        handleError(err, failure);
      });
    },
    [handleError]
  );

  const noteTimers = useRef<Map<string, number>>(new Map());

  const updateEnquiry = useCallback(
    (id: string, patch: Partial<Enquiry>) => {
      const send = (body: Partial<Enquiry>) =>
        api(`/api/admin/enquiries/${encodeURIComponent(id)}`, { method: "PATCH", json: body });

      // Notes are typed live, so save them once typing pauses rather than per keystroke.
      if (Object.keys(patch).length === 1 && patch.notes !== undefined) {
        const notes = patch.notes;
        setEnquiries((rows) => rows.map((row) => (row.id === id ? { ...row, notes } : row)));
        window.clearTimeout(noteTimers.current.get(id));
        noteTimers.current.set(
          id,
          window.setTimeout(() => {
            noteTimers.current.delete(id);
            send({ notes }).catch((err: unknown) => handleError(err, "Notes not saved"));
          }, SAVE_DELAY_MS)
        );
        return;
      }

      mutateEnquiries(
        (rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
        () => send(patch),
        "Enquiry not updated"
      );
    },
    [handleError, mutateEnquiries]
  );

  const deleteEnquiry = useCallback(
    (id: string) =>
      mutateEnquiries(
        (rows) => rows.filter((row) => row.id !== id),
        () => api(`/api/admin/enquiries/${encodeURIComponent(id)}`, { method: "DELETE" }),
        "Enquiry not deleted"
      ),
    [mutateEnquiries]
  );

  const deleteEnquiries = useCallback(
    (ids: string[]) => {
      const set = new Set(ids);
      mutateEnquiries(
        (rows) => rows.filter((row) => !set.has(row.id)),
        () => api("/api/admin/enquiries/bulk-delete", { method: "POST", json: { ids } }),
        "Enquiries not deleted"
      );
    },
    [mutateEnquiries]
  );

  const markAllRead = useCallback(
    () =>
      mutateEnquiries(
        (rows) => rows.map((row) => (row.read ? row : { ...row, read: true })),
        () => api("/api/admin/enquiries/mark-all-read", { method: "POST" }),
        "Could not mark enquiries read"
      ),
    [mutateEnquiries]
  );

  const loadSampleEnquiries = useCallback(async () => {
    try {
      const res = await api<{ count: number; enquiries: Enquiry[] }>("/api/admin/enquiries/sample", {
        method: "POST",
      });
      setEnquiries(res.enquiries);
      return res.count;
    } catch (err) {
      handleError(err, "Sample enquiries not loaded");
      return 0;
    }
  }, [handleError]);

  const clearEnquiries = useCallback(async () => {
    try {
      await api("/api/admin/enquiries", { method: "DELETE" });
      setEnquiries([]);
    } catch (err) {
      handleError(err, "Enquiries not cleared");
    }
  }, [handleError]);

  const exportContentJson = useCallback(() => {
    void flush().then(() => {
      // Same-origin GET with the session cookie; the server sets Content-Disposition.
      const a = document.createElement("a");
      a.href = "/api/admin/export";
      a.download = `nauticpower-content-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }, [flush]);

  const exportEnquiriesCsv = useCallback((rows: Enquiry[]) => {
    const stamp = new Date().toISOString().slice(0, 10);
    download(`nauticpower-enquiries-${stamp}.csv`, "text/csv;charset=utf-8;", enquiriesToCsv(rows));
  }, []);

  const applySite = useCallback((site: SitePayload) => {
    dirty.current.clear();
    window.clearTimeout(timer.current);
    setContentState(site.content);
    setSettingsState(site.settings);
    setSaveState("saved");
  }, []);

  const importJson = useCallback(
    async (raw: string): Promise<Result> => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return { ok: false, message: "Could not parse that JSON file." };
      }
      if (!parsed || typeof parsed !== "object") return { ok: false, message: "That file is not valid JSON." };
      try {
        await flush();
        applySite(await api<SitePayload>("/api/admin/import", { method: "POST", json: parsed }));
        return { ok: true, message: "Content imported and published." };
      } catch (err) {
        return { ok: false, message: errorMessage(err) };
      }
    },
    [applySite, flush]
  );

  const resetContent = useCallback(async (): Promise<Result> => {
    try {
      await flush();
      applySite(await api<SitePayload>("/api/admin/reset", { method: "POST" }));
      return { ok: true, message: "Site content restored to defaults." };
    } catch (err) {
      handleError(err, "Reset failed");
      return { ok: false, message: errorMessage(err) };
    }
  }, [applySite, flush, handleError]);

  const listMedia = useCallback(() => api<MediaItem[]>("/api/admin/media"), []);

  const uploadMedia = useCallback((file: File) => {
    const body = new FormData();
    body.append("file", file);
    return api<MediaItem>("/api/admin/media", { method: "POST", body });
  }, []);

  const deleteMedia = useCallback(async (key: string) => {
    await api(`/api/admin/media/${encodeURIComponent(key)}`, { method: "DELETE" });
  }, []);

  const unreadCount = useMemo(() => enquiries.filter((row) => !row.read).length, [enquiries]);

  const value = useMemo<CmsApi>(
    () => ({
      content,
      settings,
      enquiries,
      unreadCount,
      isAuthed,
      authChecked,
      saveState,
      login,
      logout,
      changePasscode,
      setContent,
      resetContent,
      setSettings,
      addEnquiry,
      updateEnquiry,
      deleteEnquiry,
      deleteEnquiries,
      markAllRead,
      refreshEnquiries,
      loadSampleEnquiries,
      clearEnquiries,
      exportContentJson,
      exportEnquiriesCsv,
      importJson,
      listMedia,
      uploadMedia,
      deleteMedia,
    }),
    [
      content,
      settings,
      enquiries,
      unreadCount,
      isAuthed,
      authChecked,
      saveState,
      login,
      logout,
      changePasscode,
      setContent,
      resetContent,
      setSettings,
      addEnquiry,
      updateEnquiry,
      deleteEnquiry,
      deleteEnquiries,
      markAllRead,
      refreshEnquiries,
      loadSampleEnquiries,
      clearEnquiries,
      exportContentJson,
      exportEnquiriesCsv,
      importJson,
      listMedia,
      uploadMedia,
      deleteMedia,
    ]
  );

  if (!ready) {
    return <div className="min-h-screen bg-white" aria-busy="true" />;
  }

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
};
