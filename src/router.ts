import { useCallback, useEffect, useState } from "react";

export const normalizeHash = (): string => {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw || raw === "/") return "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
};

/** Minimal hash router — works when the build is served as a single static file. */
export const useHashRoute = (): [string, (path: string) => void] => {
  const [path, setPath] = useState<string>(() => normalizeHash());

  useEffect(() => {
    const onChange = () => setPath(normalizeHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = useCallback((next: string) => {
    const target = next.startsWith("/") ? next : `/${next}`;
    if (normalizeHash() === target) return;
    window.location.hash = target;
  }, []);

  return [path, navigate];
};

export const useScrollTop = (dep: string): void => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [dep]);
};
