import { useEffect, useState } from "react";
import { ArrowUpRight, Lock, Menu, X } from "lucide-react";
import { useCms } from "../cms/store";
import { scrollToId } from "./motion";

export const NauticLogoMark = ({ inverted = false }: { inverted?: boolean }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
    <rect width="32" height="32" rx="3" fill={inverted ? "#FFFFFF" : "#101215"} />
    <path
      d="M7.4 23.6V8.4h3.7l8 9.9V8.4h3.5v15.2h-3.7l-8-9.9v9.9H7.4Z"
      fill={inverted ? "#101215" : "#FFFFFF"}
    />
    <rect x="24.1" y="8.4" width="2.6" height="5.6" fill="var(--accent-bright)" />
  </svg>
);

interface NavItem {
  label: string;
  target: string;
}

export const Navbar = () => {
  const { content, unreadCount } = useCms();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || open;
  const items: NavItem[] = [
    { label: "Fabrication", target: "fabrication" },
    { label: "Mechanical", target: "mechanical" },
    { label: "Electrical", target: "electrical" },
    { label: "Coverage", target: "coverage" },
  ];

  const go = (target: string) => {
    setOpen(false);
    scrollToId(target);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 ${
        solid
          ? "bg-white/94 backdrop-blur-md border-b border-hairline text-ink shadow-[0_1px_0_rgba(16,18,21,0.04)]"
          : "border-b border-transparent text-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 h-[72px] flex items-center justify-between gap-6">
        <a
          href="#/"
          className="flex items-center gap-3 group"
          aria-label={`${content.brand.name} — home`}
        >
          <NauticLogoMark inverted={!solid} />
          <span className="flex flex-col leading-none">
            <span className="display-mid text-[16px] tracking-[0.02em] uppercase">
              {content.brand.name}
            </span>
            <span
              className={`label-mono mt-1.5 text-[9.5px] transition-colors ${
                solid ? "text-steel" : "text-white/70"
              }`}
            >
              {content.brand.tagline}
            </span>
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-7" aria-label="Primary">
          {items.map((item) => (
            <button
              key={item.target}
              type="button"
              onClick={() => go(item.target)}
              className={`text-[14px] font-medium underline-sweep cursor-pointer transition-colors ${
                solid ? "text-graphite hover:text-ink" : "text-white/85 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Live on-call indicator */}
          <span
            className={`hidden xl:inline-flex items-center gap-2 label-mono ${
              solid ? "text-steel" : "text-white/70"
            }`}
          >
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-ember opacity-70 pulse-ring" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-ember" />
            </span>
            On call · day or night
          </span>

          <a
            href="#/admin"
            title="Admin CMS"
            className={`hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-[4px] border transition-colors ${
              solid
                ? "border-hairline text-steel hover:text-ink hover:border-ink"
                : "border-white/30 text-white/80 hover:text-white hover:border-white/70"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span className="sr-only">Admin CMS</span>
          </a>

          {unreadCount > 0 && (
            <a
              href="#/admin/enquiries"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-[4px] bg-ember-soft text-ember label-mono"
              title={`${unreadCount} unread enquiries`}
            >
              {unreadCount} new
            </a>
          )}

          <button
            type="button"
            onClick={() => go("contact")}
            className={`hidden sm:inline-flex items-center gap-1.5 h-9 px-4 rounded-[4px] text-[13px] font-semibold transition-colors cursor-pointer ${
              solid
                ? "bg-ink text-white hover:bg-ember"
                : "bg-white text-ink hover:bg-chalk"
            }`}
          >
            Get in touch
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="lg:hidden p-2 -mr-2 cursor-pointer"
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-white border-b border-hairline px-5 pb-6 pt-1 rise">
          <div className="divide-y divide-hairline">
            {items.map((item) => (
              <button
                key={item.target}
                type="button"
                onClick={() => go(item.target)}
                className="w-full flex items-center justify-between py-3.5 text-left text-[15px] font-semibold text-ink cursor-pointer"
              >
                {item.label}
                <ArrowUpRight className="w-4 h-4 text-mist" />
              </button>
            ))}
            <div className="py-3.5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => go("contact")}
                className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-[4px] bg-ink text-white text-[14px] font-semibold cursor-pointer"
              >
                Get in touch
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <a
                href="#/admin"
                className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-[4px] border border-hairline text-[13px] font-semibold text-steel"
              >
                <Lock className="w-4 h-4" />
                Admin
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
