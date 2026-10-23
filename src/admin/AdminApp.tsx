import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Database,
  Flame,
  Gauge,
  Inbox,
  LayoutGrid,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Palette,
  TriangleAlert,
} from "lucide-react";
import { useCms } from "../cms/store";
import { NauticLogoMark } from "../components/Navbar";
import { Button, Panel, ToastProvider, useToast } from "./ui";
import { Dashboard } from "./Dashboard";
import { Enquiries } from "./Enquiries";
import { ContactEditor, CoverageEditor, DataEditor, HeroEditor, SettingsEditor, TradesEditor } from "./Editors";

interface NavLeaf {
  label: string;
  path: string;
  icon: ReactNode;
}

interface NavGroup {
  group: string;
  items: NavLeaf[];
}

const NAV: NavGroup[] = [
  {
    group: "Overview",
    items: [{ label: "Dashboard", path: "/admin", icon: <Gauge className="w-4 h-4" /> }],
  },
  {
    group: "Enquiries",
    items: [{ label: "Enquiries desk", path: "/admin/enquiries", icon: <Inbox className="w-4 h-4" /> }],
  },
  {
    group: "Site content",
    items: [
      { label: "Hero, stats & ticker", path: "/admin/content/hero", icon: <LayoutGrid className="w-4 h-4" /> },
      { label: "Trades & services", path: "/admin/content/trades", icon: <Flame className="w-4 h-4" /> },
      { label: "Coverage & sectors", path: "/admin/content/coverage", icon: <MapPin className="w-4 h-4" /> },
      { label: "Contact & channels", path: "/admin/content/contact", icon: <Mail className="w-4 h-4" /> },
    ],
  },
  {
    group: "Administration",
    items: [
      { label: "Brand & theme", path: "/admin/settings", icon: <Palette className="w-4 h-4" /> },
      { label: "Data & backup", path: "/admin/data", icon: <Database className="w-4 h-4" /> },
    ],
  },
];

const TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/enquiries": "Enquiries desk",
  "/admin/content/hero": "Hero, stats & ticker",
  "/admin/content/trades": "Trades & services",
  "/admin/content/coverage": "Coverage & sectors",
  "/admin/content/contact": "Contact & channels",
  "/admin/settings": "Brand & theme",
  "/admin/data": "Data & backup",
};

/* ------------------------------------------------------------- login gate */

const LoginGate = ({ navigate }: { navigate: (path: string) => void }) => {
  const { login, content } = useCms();
  const toast = useToast();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (login(passcode)) {
      toast("Signed in to the Nautic Power CMS");
      navigate("/admin");
    } else {
      setError("That passcode is not recognised.");
      setPasscode("");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between bg-carbon text-white p-10 overflow-hidden noise">
        <div className="absolute inset-0 blueprint-light pointer-events-none" aria-hidden="true" />
        <div
          className="absolute -top-28 -right-20 w-[520px] h-[420px] ember-glow drift pointer-events-none"
          aria-hidden="true"
        />
        <div className="hazard absolute inset-x-0 top-0 h-[5px] opacity-80" aria-hidden="true" />

        <div className="relative flex items-center gap-3">
          <NauticLogoMark inverted />
          <div>
            <p className="display-mid text-[16px] uppercase tracking-[0.02em]">{content.brand.name}</p>
            <p className="label-mono text-white/60 mt-1">Content management system</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <p className="label-mono text-ember-bright">ADMIN ACCESS</p>
          <h1 className="display-wide mt-4 text-[clamp(2rem,3.4vw,2.9rem)] text-white text-balance">
            Edit the site. Work the enquiries desk.
          </h1>
          <p className="mt-5 text-[15px] leading-[1.65] text-white/72">
            One login covers every published string, all three trade scopes, coverage sectors, contact
            channels and the job enquiries your customers submit.
          </p>
          <ul className="mt-8 space-y-2.5">
            {[
              "Publish copy changes instantly — no draft queue",
              "Triage breakdowns, quotes and scheduled jobs",
              "Export enquiries to CSV, content to JSON",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-[13.5px] text-white/80">
                <span className="mt-1.5 w-1.5 h-1.5 rotate-45 bg-ember-bright shrink-0" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative label-mono text-white/45">
          {content.brand.tagline} · Rural, CBD &amp; remote
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 sm:px-10 py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <NauticLogoMark />
            <p className="display-mid text-[16px] uppercase tracking-[0.02em] text-ink">
              {content.brand.name}
            </p>
          </div>

          <p className="label-mono text-ember">SIGN IN</p>
          <h2 className="display-wide mt-3 text-[30px] text-ink">Admin &amp; enquiries</h2>
          <p className="mt-3 text-[13.5px] text-steel leading-relaxed">
            Enter the admin passcode to manage site content and the enquiries desk.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="passcode" className="block text-[12.5px] font-semibold text-ink mb-1.5">
                Passcode
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mist" />
                <input
                  id="passcode"
                  ref={inputRef}
                  type="password"
                  value={passcode}
                  onChange={(event) => {
                    setPasscode(event.target.value);
                    setError(null);
                  }}
                  placeholder="••••••"
                  autoComplete="current-password"
                  className={`w-full h-11 pl-9 pr-3 bg-white border rounded-[4px] text-[14px] text-ink placeholder:text-mist focus:outline-none focus:border-ink transition-colors ${
                    error ? "border-[#a3231c]" : "border-hairline"
                  }`}
                />
              </div>
              {error && (
                <p className="rise mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-[#a3231c]">
                  <TriangleAlert className="w-3.5 h-3.5" />
                  {error}
                </p>
              )}
            </div>

            <Button type="submit" variant="primary" className="w-full h-11">
              <Lock className="w-4 h-4" />
              Sign in
            </Button>
          </form>

          <div className="mt-6 p-3.5 rounded-[5px] bg-chalk border border-hairline">
            <p className="label-mono text-steel">Demo passcode</p>
            <p className="mt-1 font-mono text-[14px] font-semibold text-ink">nautic</p>
            <p className="mt-1.5 text-[12px] text-mist">
              Change it under Brand &amp; theme once signed in.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-steel hover:text-ink transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Back to the live site
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------- admin shell */

interface AdminAppProps {
  path: string;
  navigate: (path: string) => void;
}

const AdminRoutes = ({ path, navigate }: AdminAppProps) => {
  const render = (): ReactNode => {
    switch (path) {
      case "/admin":
      case "/admin/":
        return <Dashboard navigate={navigate} />;
      case "/admin/enquiries":
        return <Enquiries />;
      case "/admin/content/hero":
        return <HeroEditor />;
      case "/admin/content/trades":
        return <TradesEditor />;
      case "/admin/content/coverage":
        return <CoverageEditor />;
      case "/admin/content/contact":
        return <ContactEditor />;
      case "/admin/settings":
        return <SettingsEditor />;
      case "/admin/data":
        return <DataEditor />;
      default:
        return (
          <Panel eyebrow="404" title="That admin page does not exist">
            <p className="text-[13.5px] text-steel">
              The path <span className="font-mono text-ink">{path}</span> is not part of the CMS.
            </p>
            <Button variant="primary" className="mt-4" onClick={() => navigate("/admin")}>
              Back to dashboard
            </Button>
          </Panel>
        );
    }
  };

  return <>{render()}</>;
};

export const AdminApp = (props: AdminAppProps) => {
  const { isAuthed, logout, content, unreadCount } = useCms();
  const { navigate, path } = props;
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    setMobileNav(false);
  }, [path]);

  if (!isAuthed) {
    return (
      <ToastProvider>
        <LoginGate navigate={navigate} />
      </ToastProvider>
    );
  }

  /* Authenticated shell — toasts provided by the app-level ToastProvider. */

  const activePath = path.endsWith("/") && path !== "/admin/" ? path.slice(0, -1) : path;
  const crumb = TITLES[activePath] ?? "Admin";

  const sidebar = (
    <nav className="flex flex-col h-full" aria-label="Admin navigation">
      <div className="flex items-center gap-3 px-5 h-[68px] border-b border-white/12">
        <NauticLogoMark inverted />
        <div className="min-w-0">
          <p className="display-mid text-[14px] uppercase tracking-[0.02em] text-white truncate">
            {content.brand.name}
          </p>
          <p className="label-mono text-white/50 mt-0.5">CMS · v1.0</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-slim-dark px-3 py-4 space-y-6">
        {NAV.map((group) => (
          <div key={group.group}>
            <p className="label-mono text-white/35 px-2 mb-2">{group.group}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.path === activePath;
                return (
                  <li key={item.path}>
                    <button
                      type="button"
                      onClick={() => navigate(item.path)}
                      className={`group w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-[4px] text-left text-[13.5px] font-medium transition-colors cursor-pointer ${
                        isActive
                          ? "bg-white text-carbon"
                          : "text-white/70 hover:text-white hover:bg-white/8"
                      }`}
                    >
                      <span className={isActive ? "text-ember" : "text-white/55 group-hover:text-white"}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                      {item.path === "/admin/enquiries" && unreadCount > 0 && (
                        <span
                          className={`ml-auto label-mono px-1.5 py-0.5 rounded-[3px] ${
                            isActive ? "bg-ember text-white" : "bg-ember text-white"
                          }`}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="px-3 py-4 border-t border-white/12 space-y-1">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-[4px] text-[13.5px] font-medium text-white/70 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
        >
          <ArrowUpRight className="w-4 h-4 text-white/55" />
          View live site
        </button>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/admin");
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-[4px] text-[13.5px] font-medium text-white/70 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-white/55" />
          Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-chalk">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[264px] bg-carbon text-white noise z-40">
        {sidebar}
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileNav && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-carbon/60" onClick={() => setMobileNav(false)} />
          <aside className="absolute inset-y-0 left-0 w-[272px] bg-carbon text-white rise">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-[264px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-hairline">
          <div className="h-[68px] px-4 sm:px-6 lg:px-8 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNav(true)}
              className="lg:hidden p-2 -ml-2 text-steel hover:text-ink cursor-pointer"
              aria-label="Open admin navigation"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <p className="label-mono text-mist">Admin CMS</p>
              <h1 className="display-mid text-[15.5px] text-ink truncate">{crumb}</h1>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-2 label-mono text-steel px-2.5 py-1.5 rounded-[4px] bg-chalk border border-hairline">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1f7a4d] pulse-ring" />
                Publishing live
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => navigate("/admin/enquiries")}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[4px] bg-ember-soft text-ember label-mono hover:brightness-95 transition-all cursor-pointer"
                >
                  <Inbox className="w-3.5 h-3.5" />
                  {unreadCount} new
                </button>
              )}
              <Button size="sm" variant="outline" onClick={() => navigate("/")}>
                View site
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  logout();
                  navigate("/admin");
                }}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </div>

          {/* Mobile horizontal nav */}
          <div className="lg:hidden border-t border-hairline px-3 py-2 overflow-x-auto scroll-slim">
            <div className="flex gap-1.5 w-max">
              {NAV.flatMap((group) => group.items).map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] border text-[12.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    item.path === activePath
                      ? "bg-ink text-white border-ink"
                      : "bg-white text-graphite border-hairline"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <AdminRoutes path={path} navigate={navigate} />
        </main>

        <footer className="px-4 sm:px-6 lg:px-8 pb-8 pt-2">
          <p className="text-[12px] text-mist">
            {content.brand.name} CMS — content and enquiries are stored in this browser's local storage.
            Export a JSON snapshot from Data &amp; backup before clearing site data.
          </p>
        </footer>
      </div>
    </div>
  );
};
