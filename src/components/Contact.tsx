import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  Mail,
  MessageSquare,
  Send,
  TriangleAlert,
} from "lucide-react";
import { buildEnquiryEmail, useCms } from "../cms/store";
import type { Enquiry, TradeId } from "../cms/content";
import { Reveal } from "./motion";

interface ContactProps {
  selectedTrades: TradeId[];
  onToggleTrade: (trade: TradeId) => void;
}

const summaryText = (enquiry: Enquiry): string =>
  [
    `NAUTIC POWER — ENQUIRY ${enquiry.ref}`,
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
  ].join("\n");

export const Contact = ({ selectedTrades, onToggleTrade }: ContactProps) => {
  const { content, settings, addEnquiry } = useCms();
  const { contact } = content;

  const [jobType, setJobType] = useState(contact.jobTypes[0]?.text ?? "Repairs");
  const [siteMode, setSiteMode] = useState(contact.siteModes[0]?.text ?? "On-Site — Rural / Farm");
  const [urgent, setUrgent] = useState(false);
  const [name, setName] = useState("");
  const [contactDetail, setContactDetail] = useState("");
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState<Enquiry | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  useEffect(() => {
    if (!contact.jobTypes.some((item) => item.text === jobType)) {
      setJobType(contact.jobTypes[0]?.text ?? "Repairs");
    }
  }, [contact.jobTypes, jobType]);

  useEffect(() => {
    if (!contact.siteModes.some((item) => item.text === siteMode)) {
      setSiteMode(contact.siteModes[0]?.text ?? "On-Site — Rural / Farm");
    }
  }, [contact.siteModes, siteMode]);

  useEffect(() => {
    if (!copiedEmail && !copiedSummary) return;
    const timer = window.setTimeout(() => {
      setCopiedEmail(false);
      setCopiedSummary(false);
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [copiedEmail, copiedSummary]);

  const copy = async (value: string, which: "email" | "summary") => {
    try {
      await navigator.clipboard.writeText(value);
      if (which === "email") setCopiedEmail(true);
      else setCopiedSummary(true);
    } catch {
      /* clipboard blocked — user can still select manually */
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const enquiry = addEnquiry({
      trades: selectedTrades,
      jobType,
      siteMode,
      name: name.trim(),
      contact: contactDetail.trim(),
      location: location.trim(),
      details: details.trim(),
      priority: urgent || jobType === "Breakdown / Urgent" ? "urgent" : "standard",
    });
    setSubmitted(enquiry);
    if (settings.enquiriesEmailForward) {
      window.location.href = buildEnquiryEmail(enquiry, contact.email);
    }
  };

  const resetForm = () => {
    setSubmitted(null);
    setName("");
    setContactDetail("");
    setLocation("");
    setDetails("");
    setUrgent(false);
  };

  return (
    <section id="contact" className="relative bg-white py-24 lg:py-32 overflow-hidden scroll-mt-20">
      <div className="absolute inset-0 blueprint opacity-60 pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Channels */}
          <div className="lg:col-span-5">
            <Reveal className="flex items-center gap-3">
              <span className="h-px w-10 bg-ember" />
              <p className="label-mono text-ember">{contact.eyebrow}</p>
            </Reveal>

            <Reveal delay={70}>
              <h2 className="display-wide mt-5 text-[clamp(2rem,4.2vw,3rem)] text-ink">
                {contact.headline}
              </h2>
              <p className="mt-5 text-[16px] leading-[1.68] text-steel">{contact.body}</p>
            </Reveal>

            <Reveal delay={140} className="mt-9 space-y-4">
              <div className="group relative p-5 rounded-[6px] bg-chalk border border-hairline lift overflow-hidden">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex items-center gap-2 label-mono text-steel">
                    <Mail className="w-3.5 h-3.5 text-ember" />
                    Direct email
                  </span>
                  <button
                    type="button"
                    onClick={() => copy(contact.email, "email")}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink hover:text-ember transition-colors cursor-pointer"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-ember" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <a
                  href={`mailto:${contact.email}`}
                  className="mt-2.5 block font-mono text-[16px] sm:text-[17px] font-semibold text-ink hover:text-ember transition-colors break-all"
                >
                  {contact.email}
                </a>
                <p className="mt-1.5 text-[13px] text-steel">{contact.emailNote}</p>
              </div>

              <a
                href={contact.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-5 rounded-[6px] bg-chalk border border-hairline hover:border-ink transition-colors lift"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 label-mono text-steel">
                    <MessageSquare className="w-3.5 h-3.5 text-ember" />
                    Facebook messenger
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-mist group-hover:text-ink transition-colors" />
                </div>
                <p className="mt-2.5 text-[16.5px] font-semibold text-ink">{contact.facebookLabel}</p>
                <p className="mt-1.5 text-[13px] text-steel">{contact.facebookNote}</p>
              </a>
            </Reveal>

            <Reveal delay={200} className="mt-9 pt-7 border-t border-hairline">
              <p className="display-mid text-[16.5px] text-ink leading-snug">{contact.promiseTitle}</p>
              <p className="mt-2 text-[13.5px] text-steel">{contact.promiseNote}</p>
            </Reveal>
          </div>

          {/* Enquiry desk form */}
          <Reveal delay={110} className="lg:col-span-7">
            <div className="relative bg-chalk border border-hairline rounded-[6px] overflow-hidden">
              <div className="hazard h-[5px] w-full opacity-80" aria-hidden="true" />

              <div className="p-6 sm:p-8 lg:p-9">
                {!submitted ? (
                  <form onSubmit={handleSubmit} noValidate={false}>
                    <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-hairline">
                      <div>
                        <h3 className="display-mid text-[21px] text-ink">{contact.formTitle}</h3>
                        <p className="mt-1.5 text-[13.5px] text-steel">{contact.formNote}</p>
                      </div>
                      <span className="label-mono px-2.5 py-1.5 rounded-[3px] bg-white border border-hairline text-steel">
                        Logged to enquiries desk
                      </span>
                    </div>

                    <div className="mt-6 space-y-6">
                      {/* Trade selector */}
                      <fieldset>
                        <legend className="label-mono text-steel mb-2.5">
                          01 — Trades needed (select all that apply)
                        </legend>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {content.trades.map((trade) => {
                            const active = selectedTrades.includes(trade.id);
                            return (
                              <button
                                key={trade.id}
                                type="button"
                                aria-pressed={active}
                                onClick={() => onToggleTrade(trade.id)}
                                className={`px-3.5 py-3 rounded-[4px] border text-[14px] font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                  active
                                    ? "bg-ink text-white border-ink"
                                    : "bg-white text-ink border-hairline hover:border-ink"
                                }`}
                              >
                                <span className="flex items-baseline gap-2">
                                  <span
                                    className={`label-mono text-[10px] ${
                                      active ? "text-ember-bright" : "text-mist"
                                    }`}
                                  >
                                    {trade.index}
                                  </span>
                                  {trade.title}
                                </span>
                                <span
                                  className={`w-4 h-4 rounded-[3px] flex items-center justify-center shrink-0 ${
                                    active ? "bg-ember text-white" : "border border-hairline"
                                  }`}
                                >
                                  {active && <Check className="w-3 h-3" />}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>

                      {/* Job type + site */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="job-type" className="label-mono text-steel block mb-2">
                            02 — Job type
                          </label>
                          <select
                            id="job-type"
                            value={jobType}
                            onChange={(event) => setJobType(event.target.value)}
                            className="w-full h-11 px-3 bg-white border border-hairline rounded-[4px] text-[14px] text-ink focus:outline-none focus:border-ink"
                          >
                            {contact.jobTypes.map((item) => (
                              <option key={item.id} value={item.text}>
                                {item.text}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="site-mode" className="label-mono text-steel block mb-2">
                            03 — Where is work required?
                          </label>
                          <select
                            id="site-mode"
                            value={siteMode}
                            onChange={(event) => setSiteMode(event.target.value)}
                            className="w-full h-11 px-3 bg-white border border-hairline rounded-[4px] text-[14px] text-ink focus:outline-none focus:border-ink"
                          >
                            {contact.siteModes.map((item) => (
                              <option key={item.id} value={item.text}>
                                {item.text}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Urgent toggle */}
                      <button
                        type="button"
                        aria-pressed={urgent}
                        onClick={() => setUrgent((prev) => !prev)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-[4px] border text-left transition-colors cursor-pointer ${
                          urgent
                            ? "border-ember bg-ember-soft"
                            : "border-hairline bg-white hover:border-ink"
                        }`}
                      >
                        <TriangleAlert className={`w-4 h-4 shrink-0 ${urgent ? "text-ember" : "text-mist"}`} />
                        <span className="flex-1">
                          <span className="block text-[14px] font-semibold text-ink">
                            This is an urgent breakdown
                          </span>
                          <span className="block text-[12.5px] text-steel">
                            Flags the enquiry as priority on the Nautic Power desk.
                          </span>
                        </span>
                        <span
                          className={`relative w-10 rounded-full transition-colors shrink-0 ${
                            urgent ? "bg-ember" : "bg-hairline"
                          }`}
                          style={{ height: "22px" }}
                        >
                          <span
                            className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all ${
                              urgent ? "left-[21px]" : "left-[3px]"
                            }`}
                          />
                        </span>
                      </button>

                      {/* Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="client-name" className="block text-[13px] font-semibold text-ink mb-1.5">
                            Your name / business <span className="text-ember">*</span>
                          </label>
                          <input
                            id="client-name"
                            type="text"
                            required
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="e.g. J. Mitchell — Mitchell Pastoral"
                            className="w-full h-11 px-3 bg-white border border-hairline rounded-[4px] text-[14px] text-ink placeholder:text-mist focus:outline-none focus:border-ink"
                          />
                        </div>
                        <div>
                          <label htmlFor="client-contact" className="block text-[13px] font-semibold text-ink mb-1.5">
                            Phone or email <span className="text-ember">*</span>
                          </label>
                          <input
                            id="client-contact"
                            type="text"
                            required
                            value={contactDetail}
                            onChange={(event) => setContactDetail(event.target.value)}
                            placeholder="Best number or email for a callback"
                            className="w-full h-11 px-3 bg-white border border-hairline rounded-[4px] text-[14px] text-ink placeholder:text-mist focus:outline-none focus:border-ink"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="site-location" className="block text-[13px] font-semibold text-ink mb-1.5">
                          Site location / town / property
                        </label>
                        <input
                          id="site-location"
                          type="text"
                          value={location}
                          onChange={(event) => setLocation(event.target.value)}
                          placeholder="Town, property name, site or workshop drop-off"
                          className="w-full h-11 px-3 bg-white border border-hairline rounded-[4px] text-[14px] text-ink placeholder:text-mist focus:outline-none focus:border-ink"
                        />
                      </div>

                      <div>
                        <label htmlFor="job-details" className="block text-[13px] font-semibold text-ink mb-1.5">
                          Job details <span className="text-ember">*</span>
                        </label>
                        <textarea
                          id="job-details"
                          rows={4}
                          required
                          value={details}
                          onChange={(event) => setDetails(event.target.value)}
                          placeholder="Describe the equipment, repair, custom fabrication, electrical fault or timeframe…"
                          className="w-full p-3 bg-white border border-hairline rounded-[4px] text-[14px] leading-relaxed text-ink placeholder:text-mist focus:outline-none focus:border-ink resize-y"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button
                          type="submit"
                          className="sweep group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-[4px] bg-ink text-white text-[14px] font-semibold hover:bg-ember transition-colors cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                          Log enquiry with the team
                        </button>
                        <p className="text-[12.5px] text-steel max-w-xs leading-snug">
                          Saved instantly to the Nautic Power enquiries desk
                          {settings.enquiriesEmailForward ? ` and drafted to ${contact.email}` : ""}.
                        </p>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="rise">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 w-8 h-8 rounded-[4px] bg-ember text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </span>
                      <div>
                        <h3 className="display-mid text-[21px] text-ink">{contact.successHeadline}</h3>
                        <p className="mt-1.5 text-[13.5px] text-steel max-w-lg">{contact.successNote}</p>
                      </div>
                    </div>

                    <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-px bg-hairline border border-hairline rounded-[5px] overflow-hidden">
                      {[
                        { label: "Reference", value: submitted.ref },
                        {
                          label: "Trades",
                          value: submitted.trades.length ? submitted.trades.join(" + ") : "Multi-trade",
                        },
                        { label: "Job type", value: submitted.jobType },
                        { label: "Priority", value: submitted.priority === "urgent" ? "Urgent" : "Standard" },
                      ].map((cell) => (
                        <div key={cell.label} className="bg-white px-3.5 py-3">
                          <dt className="label-mono text-mist">{cell.label}</dt>
                          <dd className="mt-1 text-[13.5px] font-semibold text-ink break-words">{cell.value}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <a
                        href={buildEnquiryEmail(submitted, contact.email)}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-[4px] bg-ink text-white text-[13.5px] font-semibold hover:bg-ember transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Email this to {contact.email}
                      </a>
                      <button
                        type="button"
                        onClick={() => copy(summaryText(submitted), "summary")}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-[4px] border border-hairline bg-white text-[13.5px] font-semibold text-ink hover:border-ink transition-colors cursor-pointer"
                      >
                        {copiedSummary ? (
                          <>
                            <Check className="w-4 h-4 text-ember" /> Copied summary
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" /> Copy summary
                          </>
                        )}
                      </button>
                      <a
                        href={contact.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-[4px] border border-hairline bg-white text-[13.5px] font-semibold text-ink hover:border-ink transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Message on Facebook
                      </a>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-[4px] text-[13.5px] font-semibold text-steel hover:text-ink transition-colors cursor-pointer"
                      >
                        Log another enquiry
                      </button>
                    </div>

                    <p className="mt-5 text-[12.5px] text-steel">
                      Team members can review and action this job at{" "}
                      <a href="#/admin/enquiries" className="font-semibold text-ink underline-sweep">
                        the admin enquiries desk
                      </a>
                      .
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
