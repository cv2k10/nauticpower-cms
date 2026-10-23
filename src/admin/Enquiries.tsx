import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  Inbox,
  Mail,
  MessageSquare,
  Search,
  SlidersHorizontal,
  Trash,
  TriangleAlert,
  X,
} from "lucide-react";
import { buildEnquiryEmail, useCms } from "../cms/store";
import {
  formatDateTime,
  formatRelative,
  STATUS_META,
  STATUS_ORDER,
  TRADE_META,
  type Enquiry,
  type EnquiryStatus,
  type TradeId,
} from "../cms/content";
import { Button, Chip, ConfirmDialog, EmptyState, Panel, SelectInput, TextArea, useToast } from "./ui";

type SortKey = "newest" | "oldest" | "priority";

const summaryText = (enquiry: Enquiry): string =>
  [
    `NAUTIC POWER — ENQUIRY ${enquiry.ref}`,
    `Received: ${formatDateTime(enquiry.createdAt)}`,
    "",
    `Trades: ${enquiry.trades.map((id) => TRADE_META[id].label).join(", ") || "General / multi-trade"}`,
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
    "",
    enquiry.notes ? `Internal notes: ${enquiry.notes}` : "Internal notes: —",
  ].join("\n");

export const Enquiries = () => {
  const { content, enquiries, updateEnquiry, deleteEnquiry, deleteEnquiries, markAllRead, exportEnquiriesCsv } =
    useCms();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EnquiryStatus>("all");
  const [tradeFilter, setTradeFilter] = useState<"all" | TradeId>("all");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string } | { bulk: true } | null>(null);
  const [copied, setCopied] = useState(false);

  const active = useMemo(
    () => enquiries.find((row) => row.id === openId) ?? null,
    [enquiries, openId]
  );

  useEffect(() => {
    if (active && !active.read) updateEnquiry(active.id, { read: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = enquiries.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (tradeFilter !== "all" && !row.trades.includes(tradeFilter)) return false;
      if (urgentOnly && row.priority !== "urgent") return false;
      if (!needle) return true;
      return [row.ref, row.name, row.contact, row.location, row.details, row.jobType, row.siteMode]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });

    return rows.sort((a, b) => {
      if (sort === "oldest") return +new Date(a.createdAt) - +new Date(b.createdAt);
      if (sort === "priority") {
        const rank = (row: Enquiry) => (row.priority === "urgent" ? 0 : 1);
        return rank(a) - rank(b) || +new Date(b.createdAt) - +new Date(a.createdAt);
      }
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
  }, [enquiries, query, statusFilter, tradeFilter, urgentOnly, sort]);

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: enquiries.length };
    STATUS_ORDER.forEach((status) => {
      base[status] = enquiries.filter((row) => row.status === status).length;
    });
    return base;
  }, [enquiries]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]));

  const allSelected = filtered.length > 0 && filtered.every((row) => selected.includes(row.id));

  const copySummary = async (enquiry: Enquiry) => {
    try {
      await navigator.clipboard.writeText(summaryText(enquiry));
      setCopied(true);
      toast(`Copied ${enquiry.ref} summary`);
    } catch {
      toast("Clipboard blocked by the browser", "warn");
    }
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if ("bulk" in pendingDelete) {
      deleteEnquiries(selected);
      toast(`${selected.length} enquiries deleted`, "warn");
      setSelected([]);
    } else {
      deleteEnquiry(pendingDelete.id);
      if (openId === pendingDelete.id) setOpenId(null);
      toast("Enquiry deleted", "warn");
    }
    setPendingDelete(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-mono text-ember">ENQUIRIES DESK</p>
          <h1 className="display-wide mt-2 text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink">
            Job scopes &amp; breakdowns
          </h1>
          <p className="mt-2 text-[13.5px] text-steel">
            Every enquiry submitted on the live site lands here with a reference, trade tags and priority flag.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              markAllRead();
              toast("All enquiries marked as read");
            }}
            disabled={enquiries.every((row) => row.read)}
          >
            <Eye className="w-4 h-4" />
            Mark all read
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              exportEnquiriesCsv(filtered);
              toast(`Exported ${filtered.length} rows to CSV`);
            }}
            disabled={filtered.length === 0}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </header>

      {/* Filters */}
      <Panel className="p-0">
        <div className="p-5 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mist" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search reference, client, town, job scope…"
                aria-label="Search enquiries"
                className="w-full h-10 pl-9 pr-3 bg-white border border-hairline rounded-[4px] text-[13.5px] text-ink placeholder:text-mist focus:outline-none focus:border-ink"
              />
            </div>
            <div className="flex flex-wrap gap-2.5">
              <SelectInput
                value={tradeFilter}
                onChange={(event) => setTradeFilter(event.target.value as "all" | TradeId)}
                aria-label="Filter by trade"
                className="lg:w-44"
              >
                <option value="all">All trades</option>
                {(Object.keys(TRADE_META) as TradeId[]).map((id) => (
                  <option key={id} value={id}>
                    {TRADE_META[id].label}
                  </option>
                ))}
              </SelectInput>
              <SelectInput
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                aria-label="Sort enquiries"
                className="lg:w-44"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="priority">Priority first</option>
              </SelectInput>
              <Button
                variant={urgentOnly ? "accent" : "outline"}
                onClick={() => setUrgentOnly((prev) => !prev)}
              >
                <TriangleAlert className="w-4 h-4" />
                Urgent
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-mist" />
            {(["all", ...STATUS_ORDER] as ("all" | EnquiryStatus)[]).map((status) => {
              const isActive = statusFilter === status;
              const label = status === "all" ? "All" : STATUS_META[status].label;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] border text-[12.5px] font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? "bg-ink text-white border-ink"
                      : "bg-white text-graphite border-hairline hover:border-ink"
                  }`}
                >
                  {status !== "all" && (
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[status].dot}`} />
                  )}
                  {label}
                  <span className={`label-mono ${isActive ? "text-white/70" : "text-mist"}`}>
                    {counts[status] ?? 0}
                  </span>
                </button>
              );
            })}
            {(query || statusFilter !== "all" || tradeFilter !== "all" || urgentOnly) && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                  setTradeFilter("all");
                  setUrgentOnly(false);
                }}
                className="inline-flex items-center gap-1 h-8 px-2.5 text-[12.5px] font-semibold text-steel hover:text-ink cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Clear filters
              </button>
            )}
          </div>

          {selected.length > 0 && (
            <div className="rise flex flex-wrap items-center gap-2 px-3.5 py-2.5 rounded-[5px] bg-chalk border border-hairline">
              <span className="text-[13px] font-semibold text-ink">{selected.length} selected</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  selected.forEach((id) => updateEnquiry(id, { read: true }));
                  toast("Marked as read");
                }}
              >
                <Eye className="w-3.5 h-3.5" />
                Mark read
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  selected.forEach((id) => updateEnquiry(id, { status: "quoted" }));
                  toast("Status set to Quoted");
                }}
              >
                Set quoted
              </Button>
              <Button size="sm" variant="danger" onClick={() => setPendingDelete({ bulk: true })}>
                <Trash className="w-3.5 h-3.5" />
                Delete
              </Button>
              <button
                type="button"
                onClick={() => setSelected([])}
                className="ml-auto text-[12.5px] font-semibold text-steel hover:text-ink cursor-pointer"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      </Panel>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-5 h-5" />}
          title={enquiries.length === 0 ? "No enquiries yet" : "Nothing matches those filters"}
          message={
            enquiries.length === 0
              ? "Submit the job scope form on the live site, or load sample enquiries from Data & backup to explore the desk."
              : "Try widening the status, trade or search filters."
          }
          action={
            enquiries.length === 0 ? (
              <Button variant="primary" onClick={() => window.location.assign("#/admin/data")}>
                Go to Data &amp; backup
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Panel className="p-0 overflow-hidden">
          <div className="hidden lg:block overflow-x-auto scroll-slim">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-chalk border-b border-hairline">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() =>
                        setSelected(allSelected ? [] : filtered.map((row) => row.id))
                      }
                      aria-label="Select all filtered enquiries"
                      className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
                    />
                  </th>
                  <th className="label-mono px-3 py-3 text-steel font-medium">Ref</th>
                  <th className="label-mono px-3 py-3 text-steel font-medium">Received</th>
                  <th className="label-mono px-3 py-3 text-steel font-medium">Client &amp; site</th>
                  <th className="label-mono px-3 py-3 text-steel font-medium">Trades</th>
                  <th className="label-mono px-3 py-3 text-steel font-medium">Job</th>
                  <th className="label-mono px-3 py-3 text-steel font-medium">Status</th>
                  <th className="w-24 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className={`group transition-colors hover:bg-chalk/70 ${
                      row.read ? "" : "bg-ember-wash"
                    }`}
                  >
                    <td className="px-4 py-3 align-top">
                      <input
                        type="checkbox"
                        checked={selected.includes(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        aria-label={`Select ${row.ref}`}
                        className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <span className="font-mono text-[12px] text-ink">{row.ref}</span>
                      <span className="mt-1 flex items-center gap-1.5">
                        {row.priority === "urgent" && <Chip tone="accent">urgent</Chip>}
                        {!row.read && <Chip>new</Chip>}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top text-[12.5px] text-steel whitespace-nowrap">
                      {formatRelative(row.createdAt)}
                      <span className="block text-[11px] text-mist mt-0.5">
                        {formatDateTime(row.createdAt)}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top max-w-[240px]">
                      <p className="text-[13.5px] font-semibold text-ink truncate">{row.name}</p>
                      <p className="text-[12px] text-steel truncate">{row.location || "—"}</p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <span className="flex flex-wrap gap-1">
                        {row.trades.length ? (
                          row.trades.map((id) => <Chip key={id}>{TRADE_META[id].short}</Chip>)
                        ) : (
                          <Chip>GENERAL</Chip>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top text-[12.5px] text-graphite max-w-[180px]">
                      <p className="truncate font-medium">{row.jobType}</p>
                      <p className="truncate text-[11.5px] text-mist">{row.siteMode}</p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[3px] border label-mono ${STATUS_META[row.status].chip}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[row.status].dot}`} />
                        {STATUS_META[row.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Button size="sm" variant="outline" onClick={() => setOpenId(row.id)}>
                        Open
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="lg:hidden divide-y divide-hairline">
            {filtered.map((row) => (
              <li key={row.id} className={`p-4 ${row.read ? "" : "bg-ember-wash"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[12px] text-ember">{row.ref}</p>
                    <p className="mt-1 text-[14px] font-semibold text-ink truncate">{row.name}</p>
                    <p className="text-[12px] text-steel truncate">
                      {row.location || "—"} · {formatRelative(row.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-[3px] border label-mono ${STATUS_META[row.status].chip}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[row.status].dot}`} />
                    {STATUS_META[row.status].label}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {row.priority === "urgent" && <Chip tone="accent">urgent</Chip>}
                  {row.trades.map((id) => (
                    <Chip key={id}>{TRADE_META[id].short}</Chip>
                  ))}
                  <span className="text-[12px] text-steel">{row.jobType}</span>
                  <Button size="sm" variant="outline" className="ml-auto" onClick={() => setOpenId(row.id)}>
                    Open
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* Detail slide-over */}
      {active && (
        <div className="fixed inset-0 z-[95]">
          <div className="absolute inset-0 bg-carbon/50 backdrop-blur-[2px]" onClick={() => setOpenId(null)} />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`Enquiry ${active.ref}`}
            className="absolute inset-y-0 right-0 w-full max-w-xl bg-white border-l border-hairline shadow-2xl flex flex-col rise"
          >
            <header className="px-5 py-4 border-b border-hairline bg-chalk">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2">
                    <span className="font-mono text-[12.5px] text-ember">{active.ref}</span>
                    {active.priority === "urgent" && <Chip tone="accent">urgent</Chip>}
                  </p>
                  <h2 className="display-mid mt-1.5 text-[19px] text-ink truncate">{active.name}</h2>
                  <p className="mt-1 text-[12px] text-steel">
                    Received {formatDateTime(active.createdAt)} · {formatRelative(active.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateEnquiry(active.id, { read: !active.read })}
                    title={active.read ? "Mark unread" : "Mark read"}
                  >
                    {active.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setOpenId(null)} title="Close">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {STATUS_ORDER.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      updateEnquiry(active.id, { status });
                      toast(`${active.ref} → ${STATUS_META[status].label}`);
                    }}
                    className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] border text-[12.5px] font-semibold transition-colors cursor-pointer ${
                      active.status === status
                        ? "bg-ink text-white border-ink"
                        : "bg-white text-graphite border-hairline hover:border-ink"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[status].dot}`} />
                    {STATUS_META[status].label}
                  </button>
                ))}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto scroll-slim p-5 space-y-6">
              <dl className="grid grid-cols-2 gap-px bg-hairline border border-hairline rounded-[5px] overflow-hidden">
                {[
                  { label: "Job type", value: active.jobType },
                  { label: "Work location", value: active.siteMode },
                  { label: "Site / town", value: active.location || "Not specified" },
                  {
                    label: "Trades",
                    value: active.trades.length
                      ? active.trades.map((id) => TRADE_META[id].label).join(" + ")
                      : "General / multi-trade",
                  },
                ].map((cell) => (
                  <div key={cell.label} className="bg-white px-3.5 py-3">
                    <dt className="label-mono text-mist">{cell.label}</dt>
                    <dd className="mt-1 text-[13.5px] font-semibold text-ink">{cell.value}</dd>
                  </div>
                ))}
              </dl>

              <div>
                <p className="label-mono text-steel mb-2">Job scope &amp; details</p>
                <p className="text-[14px] leading-[1.7] text-graphite whitespace-pre-wrap bg-chalk border border-hairline rounded-[5px] p-4">
                  {active.details}
                </p>
              </div>

              <div>
                <p className="label-mono text-steel mb-2">Client contact</p>
                <div className="flex flex-wrap gap-2">
                  <span className="font-mono text-[13px] px-3 py-2 rounded-[4px] bg-white border border-hairline text-ink">
                    {active.contact}
                  </span>
                  {active.contact.includes("@") ? (
                    <a
                      href={`mailto:${active.contact}?subject=${encodeURIComponent(
                        `Re: your ${active.jobType.toLowerCase()} enquiry (${active.ref}) — ${content.brand.name}`
                      )}`}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-[4px] border border-hairline bg-white text-[13px] font-semibold text-ink hover:border-ink transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Reply by email
                    </a>
                  ) : (
                    <a
                      href={`tel:${active.contact.replace(/[^+\d]/g, "")}`}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-[4px] border border-hairline bg-white text-[13px] font-semibold text-ink hover:border-ink transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Call client
                    </a>
                  )}
                  <a
                    href={content.contact.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-[4px] border border-hairline bg-white text-[13px] font-semibold text-ink hover:border-ink transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Facebook
                  </a>
                </div>
              </div>

              <div>
                <label htmlFor="internal-notes" className="label-mono text-steel block mb-2">
                  Internal notes (saved automatically)
                </label>
                <TextArea
                  id="internal-notes"
                  rows={4}
                  value={active.notes}
                  onChange={(event) => updateEnquiry(active.id, { notes: event.target.value })}
                  placeholder="Quotes sent, parts ordered, site access notes, scheduled date…"
                />
              </div>

              <div>
                <p className="label-mono text-steel mb-2">Priority</p>
                <div className="flex gap-2">
                  {(["standard", "urgent"] as const).map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => updateEnquiry(active.id, { priority })}
                      className={`h-9 px-3.5 rounded-[4px] border text-[13px] font-semibold capitalize transition-colors cursor-pointer ${
                        active.priority === priority
                          ? priority === "urgent"
                            ? "bg-ember text-white border-ember"
                            : "bg-ink text-white border-ink"
                          : "bg-white text-graphite border-hairline hover:border-ink"
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <footer className="px-5 py-4 border-t border-hairline bg-chalk flex flex-wrap items-center gap-2">
              <a
                href={buildEnquiryEmail(active, content.contact.email)}
                className="inline-flex items-center gap-2 h-9 px-3.5 rounded-[4px] bg-ink text-white text-[12.5px] font-semibold hover:bg-ember transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Email job sheet
              </a>
              <Button size="sm" variant="outline" onClick={() => copySummary(active)}>
                {copied ? <Check className="w-3.5 h-3.5 text-ember" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy summary"}
              </Button>
              <Button
                size="sm"
                variant="danger"
                className="ml-auto"
                onClick={() => setPendingDelete({ id: active.id })}
              >
                <Trash className="w-3.5 h-3.5" />
                Delete
              </Button>
            </footer>
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete && "bulk" in pendingDelete ? "Delete selected enquiries?" : "Delete this enquiry?"}
        message={
          pendingDelete && "bulk" in pendingDelete
            ? `${selected.length} enquiries will be permanently removed from the desk. Export a CSV first if you need a record.`
            : "This enquiry and its notes will be permanently removed. Export a CSV first if you need a record."
        }
        confirmLabel="Delete permanently"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};
