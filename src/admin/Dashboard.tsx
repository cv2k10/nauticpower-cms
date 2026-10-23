import {
  ArrowUpRight,
  CircleCheck,
  Flame,
  Inbox,
  LayoutGrid,
  Lock,
  Palette,
  Settings as SettingsIcon,
  TriangleAlert,
} from "lucide-react";
import { useCms } from "../cms/store";
import { formatRelative, STATUS_META, type EnquiryStatus } from "../cms/content";
import { Button, Chip, Panel } from "./ui";
import { NauticLogoMark } from "../components/Navbar";

interface DashboardProps {
  navigate: (path: string) => void;
}

const StatCard = ({
  label,
  value,
  note,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  note: string;
  icon: React.ReactNode;
  tone?: "neutral" | "accent" | "warn";
}) => (
  <div className="relative bg-white border border-hairline rounded-[6px] p-5 overflow-hidden lift">
    <div
      className={`absolute inset-x-0 top-0 h-[3px] ${
        tone === "accent" ? "bg-ember" : tone === "warn" ? "bg-[#a3231c]" : "bg-ink"
      }`}
    />
    <div className="flex items-start justify-between gap-3">
      <p className="label-mono text-steel">{label}</p>
      <span className="text-mist">{icon}</span>
    </div>
    <p className="display-tight mt-3 text-[40px] text-ink tabular-nums leading-none">{value}</p>
    <p className="mt-2 text-[12.5px] text-steel">{note}</p>
  </div>
);

export const Dashboard = ({ navigate }: DashboardProps) => {
  const { content, settings, enquiries, unreadCount, updateEnquiry } = useCms();

  const urgent = enquiries.filter(
    (row) => row.priority === "urgent" && row.status !== "completed" && row.status !== "archived"
  ).length;
  const completed = enquiries.filter((row) => row.status === "completed").length;
  const serviceCount = content.trades.reduce((sum, trade) => sum + trade.items.length, 0);

  const quickActions = [
    { label: "Enquiries desk", path: "/admin/enquiries", icon: <Inbox className="w-4 h-4" /> },
    { label: "Hero & stats", path: "/admin/content/hero", icon: <LayoutGrid className="w-4 h-4" /> },
    { label: "Trades & services", path: "/admin/content/trades", icon: <Flame className="w-4 h-4" /> },
    { label: "Coverage & sectors", path: "/admin/content/coverage", icon: <CircleCheck className="w-4 h-4" /> },
    { label: "Contact & channels", path: "/admin/content/contact", icon: <SettingsIcon className="w-4 h-4" /> },
    { label: "Brand & theme", path: "/admin/settings", icon: <Palette className="w-4 h-4" /> },
  ];

  const statusFor = (status: EnquiryStatus) => STATUS_META[status];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-mono text-ember">ADMIN CMS · CONTROL ROOM</p>
          <h1 className="display-wide mt-2 text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink">
            {content.brand.name} site manager
          </h1>
          <p className="mt-2 text-[13.5px] text-steel max-w-2xl">
            Edit live copy, services and channels, then action enquiries as they land. Changes auto-save
            to the live site within a second.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/")}>
            View live site
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
          <Button variant="primary" onClick={() => navigate("/admin/enquiries")}>
            <Inbox className="w-4 h-4" />
            Enquiries
            {unreadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-[3px] bg-ember text-white label-mono">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total enquiries"
          value={enquiries.length}
          note="All time"
          icon={<Inbox className="w-4 h-4" />}
        />
        <StatCard
          label="Unread"
          value={unreadCount}
          note={unreadCount > 0 ? "Needs a first response" : "Inbox is clear"}
          icon={<Lock className="w-4 h-4" />}
          tone={unreadCount > 0 ? "accent" : "neutral"}
        />
        <StatCard
          label="Urgent open"
          value={urgent}
          note="Breakdowns awaiting action"
          icon={<TriangleAlert className="w-4 h-4" />}
          tone={urgent > 0 ? "warn" : "neutral"}
        />
        <StatCard
          label="Completed"
          value={completed}
          note="Jobs closed off"
          icon={<CircleCheck className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <Panel
          className="xl:col-span-7"
          eyebrow="PIPELINE"
          title="Latest enquiries"
          description="Change status inline, or open an enquiry for the full job scope."
          actions={
            <Button size="sm" variant="ghost" onClick={() => navigate("/admin/enquiries")}>
              Open desk
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          }
        >
          {enquiries.length === 0 ? (
            <p className="text-[13.5px] text-steel py-8 text-center">
              No enquiries yet. Submit the public form to see one land here.
            </p>
          ) : (
            <ul className="divide-y divide-hairline">
              {enquiries.slice(0, 5).map((row) => (
                <li key={row.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2">
                        <span className="font-mono text-[12px] text-ember">{row.ref}</span>
                        {row.priority === "urgent" && <Chip tone="accent">urgent</Chip>}
                        {!row.read && <Chip>unread</Chip>}
                      </p>
                      <p className="mt-1.5 text-[14px] font-semibold text-ink truncate">{row.name}</p>
                      <p className="mt-0.5 text-[12.5px] text-steel truncate">
                        {row.jobType} · {row.location || "No location given"} ·{" "}
                        {row.trades.length ? row.trades.join(" + ") : "Multi-trade"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={row.status}
                        onChange={(event) => updateEnquiry(row.id, { status: event.target.value as EnquiryStatus })}
                        aria-label={`Status for ${row.ref}`}
                        className="h-8 px-2 text-[12px] font-semibold rounded-[4px] border border-hairline bg-white text-ink cursor-pointer focus:outline-none focus:border-ink"
                      >
                        {(Object.keys(STATUS_META) as EnquiryStatus[]).map((status) => (
                          <option key={status} value={status}>
                            {statusFor(status).label}
                          </option>
                        ))}
                      </select>
                      <Button size="sm" variant="outline" onClick={() => navigate("/admin/enquiries")}>
                        Open
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-[11.5px] text-mist font-mono">{formatRelative(row.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="xl:col-span-5 space-y-6">
          <Panel eyebrow="QUICK ACTIONS" title="Jump straight into editing">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {quickActions.map((action) => (
                <button
                  key={action.path}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className="group flex items-center gap-2.5 px-3.5 py-3 rounded-[4px] border border-hairline bg-white text-left hover:border-ink transition-colors cursor-pointer"
                >
                  <span className="text-steel group-hover:text-ember transition-colors">{action.icon}</span>
                  <span className="text-[13px] font-semibold text-ink">{action.label}</span>
                  <ArrowUpRight className="ml-auto w-3.5 h-3.5 text-mist group-hover:text-ink transition-colors" />
                </button>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="CONTENT INVENTORY" title="What is currently published">
            <dl className="grid grid-cols-2 gap-px bg-hairline border border-hairline rounded-[5px] overflow-hidden">
              {[
                { label: "Trades", value: content.trades.length },
                { label: "Service lines", value: serviceCount },
                { label: "Sectors", value: content.coverage.sectors.length },
                { label: "Ticker items", value: content.ticker.length },
                { label: "Job types", value: content.contact.jobTypes.length },
                { label: "Site modes", value: content.contact.siteModes.length },
              ].map((cell) => (
                <div key={cell.label} className="bg-white px-3.5 py-3">
                  <dt className="label-mono text-mist">{cell.label}</dt>
                  <dd className="display-tight mt-1 text-[26px] text-ink tabular-nums">{cell.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex items-center gap-3 p-3.5 rounded-[5px] bg-chalk border border-hairline">
              <NauticLogoMark />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink truncate">{content.hero.headline}</p>
                <p className="mt-0.5 label-mono text-steel truncate">{content.hero.badge}</p>
              </div>
            </div>
            <p className="mt-3 text-[12px] text-mist">
              Theme accent: <span className="font-mono text-ink">{settings.accent}</span> · Admin passcode is
              managed under Brand &amp; theme.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
};
