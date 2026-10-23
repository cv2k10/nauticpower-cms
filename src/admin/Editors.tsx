import { useCallback, useRef, useState } from "react";
import { Download, Eye, KeyRound, Palette, RotateCcw, Save, Trash, Upload } from "lucide-react";
import { useCms } from "../cms/store";
import {
  ACCENT_PRESETS,
  uid,
  type Mode,
  type Sector,
  type ServiceItem,
  type SiteContent,
  type Stat,
  type TextItem,
  type TradeId,
} from "../cms/content";
import { Button, Chip, ConfirmDialog, Field, Panel, SortableList, TextArea, TextInput, Toggle, useToast } from "./ui";
import { NauticLogoMark } from "../components/Navbar";
import { scrollToId } from "../components/motion";

type ObjectSection = "brand" | "hero" | "overview" | "coverage" | "ctaBand" | "contact" | "footer";

const useSectionPatch = () => {
  const { setContent } = useCms();
  return useCallback(
    <K extends ObjectSection>(key: K, value: Partial<SiteContent[K]>) => {
      setContent((prev) => ({ ...prev, [key]: { ...prev[key], ...value } }));
    },
    [setContent]
  );
};

const ImagePreview = ({ src, alt }: { src: string; alt: string }) => (
  <div className="mt-3 overflow-hidden rounded-[5px] border border-hairline bg-chalk aspect-[16/9]">
    {src ? (
      <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
    ) : (
      <p className="h-full flex items-center justify-center text-[12.5px] text-mist">No image URL set</p>
    )}
  </div>
);

/* ------------------------------------------------------------ hero editor */

export const HeroEditor = () => {
  const { content, setContent } = useCms();
  const patch = useSectionPatch();
  const { hero, overview, ctaBand, stats, ticker } = content;

  const updateList = <T extends { id: string }>(key: "stats" | "ticker", items: T[]) =>
    setContent((prev) => ({ ...prev, [key]: items }) as SiteContent);

  return (
    <div className="space-y-6">
      <header>
        <p className="label-mono text-ember">CONTENT · ABOVE THE FOLD</p>
        <h1 className="display-wide mt-2 text-[clamp(1.7rem,3.2vw,2.4rem)] text-ink">Hero, stats &amp; ticker</h1>
        <p className="mt-2 text-[13.5px] text-steel">
          The first thing every visitor sees — plus the capability counters, scrolling scope ticker and the
          night-shift call band.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 space-y-6">
          <Panel eyebrow="HERO" title="Headline &amp; calls to action">
            <div className="space-y-4">
              <Field label="Badge line" htmlFor="hero-badge">
                <TextInput
                  id="hero-badge"
                  value={hero.badge}
                  onChange={(event) => patch("hero", { badge: event.target.value })}
                />
              </Field>
              <Field label="Headline" htmlFor="hero-headline" hint="Displays in the wide industrial face.">
                <TextArea
                  id="hero-headline"
                  rows={3}
                  value={hero.headline}
                  onChange={(event) => patch("hero", { headline: event.target.value })}
                />
              </Field>
              <Field label="Intro paragraph" htmlFor="hero-body">
                <TextArea
                  id="hero-body"
                  rows={4}
                  value={hero.body}
                  onChange={(event) => patch("hero", { body: event.target.value })}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Primary button" htmlFor="hero-cta1">
                  <TextInput
                    id="hero-cta1"
                    value={hero.primaryCta}
                    onChange={(event) => patch("hero", { primaryCta: event.target.value })}
                  />
                </Field>
                <Field label="Secondary button" htmlFor="hero-cta2">
                  <TextInput
                    id="hero-cta2"
                    value={hero.secondaryCta}
                    onChange={(event) => patch("hero", { secondaryCta: event.target.value })}
                  />
                </Field>
              </div>
              <Field label="Footer note" htmlFor="hero-note">
                <TextInput
                  id="hero-note"
                  value={hero.footerNote}
                  onChange={(event) => patch("hero", { footerNote: event.target.value })}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Background image URL" htmlFor="hero-image">
                  <TextInput
                    id="hero-image"
                    value={hero.image}
                    onChange={(event) => patch("hero", { image: event.target.value })}
                  />
                </Field>
                <Field label="Image alt text" htmlFor="hero-alt">
                  <TextInput
                    id="hero-alt"
                    value={hero.imageAlt}
                    onChange={(event) => patch("hero", { imageAlt: event.target.value })}
                  />
                </Field>
              </div>
              <ImagePreview src={hero.image} alt={hero.imageAlt} />
            </div>
          </Panel>

          <Panel eyebrow="OVERVIEW" title="One-team capability copy">
            <div className="space-y-4">
              <Field label="Eyebrow" htmlFor="ov-eyebrow">
                <TextInput
                  id="ov-eyebrow"
                  value={overview.eyebrow}
                  onChange={(event) => patch("overview", { eyebrow: event.target.value })}
                />
              </Field>
              <Field label="Headline" htmlFor="ov-headline">
                <TextArea
                  id="ov-headline"
                  rows={2}
                  value={overview.headline}
                  onChange={(event) => patch("overview", { headline: event.target.value })}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Paragraph one" htmlFor="ov-a">
                  <TextArea
                    id="ov-a"
                    rows={5}
                    value={overview.bodyA}
                    onChange={(event) => patch("overview", { bodyA: event.target.value })}
                  />
                </Field>
                <Field label="Paragraph two" htmlFor="ov-b">
                  <TextArea
                    id="ov-b"
                    rows={5}
                    value={overview.bodyB}
                    onChange={(event) => patch("overview", { bodyB: event.target.value })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Fact A label" htmlFor="ov-fa-l">
                  <TextInput
                    id="ov-fa-l"
                    value={overview.factALabel}
                    onChange={(event) => patch("overview", { factALabel: event.target.value })}
                  />
                </Field>
                <Field label="Fact A value" htmlFor="ov-fa-v">
                  <TextInput
                    id="ov-fa-v"
                    value={overview.factAValue}
                    onChange={(event) => patch("overview", { factAValue: event.target.value })}
                  />
                </Field>
                <Field label="Fact B label" htmlFor="ov-fb-l">
                  <TextInput
                    id="ov-fb-l"
                    value={overview.factBLabel}
                    onChange={(event) => patch("overview", { factBLabel: event.target.value })}
                  />
                </Field>
                <Field label="Fact B value" htmlFor="ov-fb-v">
                  <TextInput
                    id="ov-fb-v"
                    value={overview.factBValue}
                    onChange={(event) => patch("overview", { factBValue: event.target.value })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Closing line" htmlFor="ov-close">
                  <TextInput
                    id="ov-close"
                    value={overview.closingLine}
                    onChange={(event) => patch("overview", { closingLine: event.target.value })}
                  />
                </Field>
                <Field label="Switcher note" htmlFor="ov-switch">
                  <TextInput
                    id="ov-switch"
                    value={overview.switcherNote}
                    onChange={(event) => patch("overview", { switcherNote: event.target.value })}
                  />
                </Field>
              </div>
            </div>
          </Panel>

          <Panel eyebrow="CALL BAND" title="Night-shift call to action">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Eyebrow" htmlFor="cta-eyebrow">
                  <TextInput
                    id="cta-eyebrow"
                    value={ctaBand.eyebrow}
                    onChange={(event) => patch("ctaBand", { eyebrow: event.target.value })}
                  />
                </Field>
                <Field label="Primary button" htmlFor="cta-cta">
                  <TextInput
                    id="cta-cta"
                    value={ctaBand.primaryCta}
                    onChange={(event) => patch("ctaBand", { primaryCta: event.target.value })}
                  />
                </Field>
              </div>
              <Field label="Headline" htmlFor="cta-headline">
                <TextArea
                  id="cta-headline"
                  rows={2}
                  value={ctaBand.headline}
                  onChange={(event) => patch("ctaBand", { headline: event.target.value })}
                />
              </Field>
              <Field label="Body" htmlFor="cta-body">
                <TextArea
                  id="cta-body"
                  rows={3}
                  value={ctaBand.body}
                  onChange={(event) => patch("ctaBand", { body: event.target.value })}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Image URL" htmlFor="cta-image">
                  <TextInput
                    id="cta-image"
                    value={ctaBand.image}
                    onChange={(event) => patch("ctaBand", { image: event.target.value })}
                  />
                </Field>
                <Field label="Secondary label" htmlFor="cta-secondary">
                  <TextInput
                    id="cta-secondary"
                    value={ctaBand.secondaryLabel}
                    onChange={(event) => patch("ctaBand", { secondaryLabel: event.target.value })}
                  />
                </Field>
              </div>
              <Field label="Image alt text" htmlFor="cta-alt">
                <TextInput
                  id="cta-alt"
                  value={ctaBand.imageAlt}
                  onChange={(event) => patch("ctaBand", { imageAlt: event.target.value })}
                />
              </Field>
              <ImagePreview src={ctaBand.image} alt={ctaBand.imageAlt} />
            </div>
          </Panel>
        </div>

        <div className="xl:col-span-5 space-y-6 xl:sticky xl:top-24">
          <Panel eyebrow="LIVE PREVIEW" title="How the hero reads">
            <div className="relative overflow-hidden rounded-[5px] bg-carbon p-5 border border-black/30">
              <span className="inline-flex items-center gap-2 label-mono text-white/85 border border-white/25 rounded-[3px] px-2 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-ember-bright" />
                {hero.badge}
              </span>
              <p className="display-wide mt-4 text-[clamp(1.4rem,3.4vw,2rem)] text-white text-balance">
                {hero.headline}
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-white/75">{hero.body}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3.5 py-2 rounded-[4px] bg-white text-ink text-[12.5px] font-semibold">
                  {hero.primaryCta}
                </span>
                <span className="px-3.5 py-2 rounded-[4px] border border-white/35 text-white text-[12.5px] font-medium">
                  {hero.secondaryCta}
                </span>
              </div>
            </div>
            <p className="mt-3 text-[12px] text-mist">
              Preview updates as you type. Publish is instant — there is no draft state.
            </p>
          </Panel>

          <Panel
            eyebrow="COUNTERS"
            title="Capability stats"
            description="Animated count-up figures shown under the hero."
          >
            <SortableList<Stat>
              items={stats}
              addLabel="Add stat"
              itemTitle={(item) => `${item.value}${item.suffix} — ${item.label}`}
              onReorder={(items) => updateList("stats", items)}
              onRemove={(id) => updateList("stats", stats.filter((item) => item.id !== id))}
              onAdd={() =>
                updateList("stats", [
                  ...stats,
                  { id: uid("s"), value: 1, suffix: "", label: "New stat", note: "Supporting detail" },
                ])
              }
            >
              {(item) => (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Field label="Value" htmlFor={`stat-v-${item.id}`}>
                    <TextInput
                      id={`stat-v-${item.id}`}
                      type="number"
                      min={0}
                      value={item.value}
                      onChange={(event) =>
                        updateList(
                          "stats",
                          stats.map((row) =>
                            row.id === item.id ? { ...row, value: Number(event.target.value) || 0 } : row
                          )
                        )
                      }
                    />
                  </Field>
                  <Field label="Suffix" htmlFor={`stat-s-${item.id}`}>
                    <TextInput
                      id={`stat-s-${item.id}`}
                      value={item.suffix}
                      onChange={(event) =>
                        updateList(
                          "stats",
                          stats.map((row) =>
                            row.id === item.id ? { ...row, suffix: event.target.value } : row
                          )
                        )
                      }
                    />
                  </Field>
                  <Field label="Label" htmlFor={`stat-l-${item.id}`} className="col-span-2 sm:col-span-1">
                    <TextInput
                      id={`stat-l-${item.id}`}
                      value={item.label}
                      onChange={(event) =>
                        updateList(
                          "stats",
                          stats.map((row) =>
                            row.id === item.id ? { ...row, label: event.target.value } : row
                          )
                        )
                      }
                    />
                  </Field>
                  <Field label="Note" htmlFor={`stat-n-${item.id}`}>
                    <TextInput
                      id={`stat-n-${item.id}`}
                      value={item.note}
                      onChange={(event) =>
                        updateList(
                          "stats",
                          stats.map((row) =>
                            row.id === item.id ? { ...row, note: event.target.value } : row
                          )
                        )
                      }
                    />
                  </Field>
                </div>
              )}
            </SortableList>
          </Panel>

          <Panel eyebrow="MARQUEE" title="Ticker items" description="Scrolling scope strip under the stats.">
            <SortableList<TextItem>
              items={ticker}
              addLabel="Add ticker item"
              itemTitle={(item) => item.text}
              onReorder={(items) => updateList("ticker", items)}
              onRemove={(id) => updateList("ticker", ticker.filter((item) => item.id !== id))}
              onAdd={() => updateList("ticker", [...ticker, { id: uid("t"), text: "NEW SCOPE ITEM" }])}
            >
              {(item) => (
                <TextInput
                  value={item.text}
                  aria-label="Ticker text"
                  onChange={(event) =>
                    updateList(
                      "ticker",
                      ticker.map((row) => (row.id === item.id ? { ...row, text: event.target.value } : row))
                    )
                  }
                />
              )}
            </SortableList>
          </Panel>

          <div className="flex items-center gap-2.5 px-4 py-3 rounded-[5px] bg-white border border-hairline">
            <span className="w-2 h-2 rounded-full bg-[#1f7a4d] pulse-ring shrink-0" />
            <p className="text-[12.5px] text-steel">
              <span className="font-semibold text-ink">Autosave on.</span> Every keystroke publishes to the
              live site and is stored in this browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------- trades editor */

export const TradesEditor = () => {
  const { content, setContent } = useCms();
  const [activeId, setActiveId] = useState<TradeId>(content.trades[0]?.id ?? "fabrication");
  const trade = content.trades.find((item) => item.id === activeId) ?? content.trades[0];

  const updateTrade = (patchValues: Partial<typeof trade>) =>
    setContent((prev) => ({
      ...prev,
      trades: prev.trades.map((row) => (row.id === trade.id ? { ...row, ...patchValues } : row)),
    }));

  const updateItems = (items: ServiceItem[]) => updateTrade({ items });

  if (!trade) return null;

  return (
    <div className="space-y-6">
      <header>
        <p className="label-mono text-ember">CONTENT · TRADES</p>
        <h1 className="display-wide mt-2 text-[clamp(1.7rem,3.2vw,2.4rem)] text-ink">Trades &amp; services</h1>
        <p className="mt-2 text-[13.5px] text-steel">
          Each trade drives both the switcher preview and its own full section, including every numbered
          service line.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {content.trades.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveId(item.id)}
            className={`inline-flex items-center gap-2 h-10 px-4 rounded-[4px] border text-[13.5px] font-semibold transition-colors cursor-pointer ${
              item.id === trade.id
                ? "bg-ink text-white border-ink"
                : "bg-white text-graphite border-hairline hover:border-ink"
            }`}
          >
            <span className={`label-mono ${item.id === trade.id ? "text-ember-bright" : "text-mist"}`}>
              {item.index}
            </span>
            {item.title}
            <Chip>{item.items.length}</Chip>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 space-y-6">
          <Panel eyebrow={`TRADE ${trade.index}`} title={`${trade.title} copy`}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Index" htmlFor="tr-index">
                  <TextInput
                    id="tr-index"
                    value={trade.index}
                    onChange={(event) => updateTrade({ index: event.target.value })}
                  />
                </Field>
                <Field label="Title" htmlFor="tr-title">
                  <TextInput
                    id="tr-title"
                    value={trade.title}
                    onChange={(event) => updateTrade({ title: event.target.value })}
                  />
                </Field>
                <Field label="Delivery mode" htmlFor="tr-mode">
                  <TextInput
                    id="tr-mode"
                    value={trade.deliveryMode}
                    onChange={(event) => updateTrade({ deliveryMode: event.target.value })}
                  />
                </Field>
              </div>
              <Field label="Eyebrow" htmlFor="tr-eyebrow">
                <TextInput
                  id="tr-eyebrow"
                  value={trade.eyebrow}
                  onChange={(event) => updateTrade({ eyebrow: event.target.value })}
                />
              </Field>
              <Field label="Headline" htmlFor="tr-headline">
                <TextArea
                  id="tr-headline"
                  rows={2}
                  value={trade.headline}
                  onChange={(event) => updateTrade({ headline: event.target.value })}
                />
              </Field>
              <Field label="Summary" htmlFor="tr-summary">
                <TextArea
                  id="tr-summary"
                  rows={4}
                  value={trade.summary}
                  onChange={(event) => updateTrade({ summary: event.target.value })}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Image URL" htmlFor="tr-image">
                  <TextInput
                    id="tr-image"
                    value={trade.image}
                    onChange={(event) => updateTrade({ image: event.target.value })}
                  />
                </Field>
                <Field label="Image alt text" htmlFor="tr-alt">
                  <TextInput
                    id="tr-alt"
                    value={trade.imageAlt}
                    onChange={(event) => updateTrade({ imageAlt: event.target.value })}
                  />
                </Field>
              </div>
              <ImagePreview src={trade.image} alt={trade.imageAlt} />
            </div>
          </Panel>
        </div>

        <div className="xl:col-span-5 space-y-6">
          <Panel
            eyebrow="SCOPE OF WORK"
            title={`${trade.title} services`}
            description="Reorder with the arrows — this order is used on the live site."
          >
            <SortableList<ServiceItem>
              items={trade.items}
              addLabel="Add service"
              itemTitle={(item) => item.name}
              onReorder={updateItems}
              onRemove={(id) => updateItems(trade.items.filter((item) => item.id !== id))}
              onAdd={() =>
                updateItems([...trade.items, { id: uid("svc"), name: "New service", detail: "What this covers." }])
              }
            >
              {(item) => (
                <div className="space-y-3">
                  <Field label="Service name" htmlFor={`svc-n-${item.id}`}>
                    <TextInput
                      id={`svc-n-${item.id}`}
                      value={item.name}
                      onChange={(event) =>
                        updateItems(
                          trade.items.map((row) =>
                            row.id === item.id ? { ...row, name: event.target.value } : row
                          )
                        )
                      }
                    />
                  </Field>
                  <Field label="Detail" htmlFor={`svc-d-${item.id}`}>
                    <TextArea
                      id={`svc-d-${item.id}`}
                      rows={2}
                      value={item.detail}
                      onChange={(event) =>
                        updateItems(
                          trade.items.map((row) =>
                            row.id === item.id ? { ...row, detail: event.target.value } : row
                          )
                        )
                      }
                    />
                  </Field>
                </div>
              )}
            </SortableList>
            <div className="mt-4 pt-4 border-t border-hairline flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  window.location.hash = "#/";
                  window.setTimeout(() => scrollToId(trade.id), 140);
                }}
              >
                <Eye className="w-4 h-4" />
                Preview on live site
              </Button>
              <span className="text-[12px] text-mist">
                Opens the public page and scrolls to {trade.title.toLowerCase()}.
              </span>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------- coverage editor */

export const CoverageEditor = () => {
  const { content } = useCms();
  const patch = useSectionPatch();
  const { coverage } = content;

  const updateModes = (modes: Mode[]) => patch("coverage", { modes });
  const updateSectors = (sectors: Sector[]) => patch("coverage", { sectors });

  return (
    <div className="space-y-6">
      <header>
        <p className="label-mono text-ember">CONTENT · REACH</p>
        <h1 className="display-wide mt-2 text-[clamp(1.7rem,3.2vw,2.4rem)] text-ink">Coverage &amp; sectors</h1>
        <p className="mt-2 text-[13.5px] text-steel">
          The dark band that answers “do they come out to us?” — plus the sector grid.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-6 space-y-6">
          <Panel eyebrow="BAND COPY" title="Coverage statement">
            <div className="space-y-4">
              <Field label="Eyebrow" htmlFor="cv-eyebrow">
                <TextInput
                  id="cv-eyebrow"
                  value={coverage.eyebrow}
                  onChange={(event) => patch("coverage", { eyebrow: event.target.value })}
                />
              </Field>
              <Field label="Headline" htmlFor="cv-headline">
                <TextArea
                  id="cv-headline"
                  rows={2}
                  value={coverage.headline}
                  onChange={(event) => patch("coverage", { headline: event.target.value })}
                />
              </Field>
              <Field label="Body" htmlFor="cv-body">
                <TextArea
                  id="cv-body"
                  rows={5}
                  value={coverage.body}
                  onChange={(event) => patch("coverage", { body: event.target.value })}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Image URL" htmlFor="cv-image">
                  <TextInput
                    id="cv-image"
                    value={coverage.image}
                    onChange={(event) => patch("coverage", { image: event.target.value })}
                  />
                </Field>
                <Field label="Image alt text" htmlFor="cv-alt">
                  <TextInput
                    id="cv-alt"
                    value={coverage.imageAlt}
                    onChange={(event) => patch("coverage", { imageAlt: event.target.value })}
                  />
                </Field>
              </div>
              <ImagePreview src={coverage.image} alt={coverage.imageAlt} />
            </div>
          </Panel>

          <Panel eyebrow="MODES" title="How the team is engaged" description="Four tiles under the statement.">
            <SortableList<Mode>
              items={coverage.modes}
              addLabel="Add mode"
              itemTitle={(item) => item.title}
              onReorder={updateModes}
              onRemove={(id) => updateModes(coverage.modes.filter((item) => item.id !== id))}
              onAdd={() =>
                updateModes([...coverage.modes, { id: uid("md"), title: "New mode", note: "Short note" }])
              }
            >
              {(item) => (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Title" htmlFor={`md-t-${item.id}`}>
                    <TextInput
                      id={`md-t-${item.id}`}
                      value={item.title}
                      onChange={(event) =>
                        updateModes(
                          coverage.modes.map((row) =>
                            row.id === item.id ? { ...row, title: event.target.value } : row
                          )
                        )
                      }
                    />
                  </Field>
                  <Field label="Note" htmlFor={`md-n-${item.id}`}>
                    <TextInput
                      id={`md-n-${item.id}`}
                      value={item.note}
                      onChange={(event) =>
                        updateModes(
                          coverage.modes.map((row) =>
                            row.id === item.id ? { ...row, note: event.target.value } : row
                          )
                        )
                      }
                    />
                  </Field>
                </div>
              )}
            </SortableList>
          </Panel>
        </div>

        <div className="xl:col-span-6 space-y-6">
          <Panel
            eyebrow="SECTORS"
            title="Sectors served"
            actions={
              <Chip tone="accent">
                {String(coverage.sectors.length).padStart(2, "0")} live
              </Chip>
            }
          >
            <Field label="Section heading" htmlFor="cv-sectors-heading" className="mb-4">
              <TextInput
                id="cv-sectors-heading"
                value={coverage.sectorsHeading}
                onChange={(event) => patch("coverage", { sectorsHeading: event.target.value })}
              />
            </Field>
            <SortableList<Sector>
              items={coverage.sectors}
              addLabel="Add sector"
              itemTitle={(item) => `${item.code} — ${item.name}`}
              onReorder={updateSectors}
              onRemove={(id) => updateSectors(coverage.sectors.filter((item) => item.id !== id))}
              onAdd={() =>
                updateSectors([
                  ...coverage.sectors,
                  {
                    id: uid("sec"),
                    code: String(coverage.sectors.length + 1).padStart(2, "0"),
                    name: "New sector",
                    description: "What Nautic Power does for this sector.",
                  },
                ])
              }
            >
              {(item) => (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-3">
                    <Field label="Code" htmlFor={`sec-c-${item.id}`}>
                      <TextInput
                        id={`sec-c-${item.id}`}
                        value={item.code}
                        onChange={(event) =>
                          updateSectors(
                            coverage.sectors.map((row) =>
                              row.id === item.id ? { ...row, code: event.target.value } : row
                            )
                          )
                        }
                      />
                    </Field>
                    <Field label="Name" htmlFor={`sec-n-${item.id}`} className="col-span-3">
                      <TextInput
                        id={`sec-n-${item.id}`}
                        value={item.name}
                        onChange={(event) =>
                          updateSectors(
                            coverage.sectors.map((row) =>
                              row.id === item.id ? { ...row, name: event.target.value } : row
                            )
                          )
                        }
                      />
                    </Field>
                  </div>
                  <Field label="Description" htmlFor={`sec-d-${item.id}`}>
                    <TextArea
                      id={`sec-d-${item.id}`}
                      rows={3}
                      value={item.description}
                      onChange={(event) =>
                        updateSectors(
                          coverage.sectors.map((row) =>
                            row.id === item.id ? { ...row, description: event.target.value } : row
                          )
                        )
                      }
                    />
                  </Field>
                </div>
              )}
            </SortableList>
          </Panel>
          <p className="text-[12px] text-mist px-1">
            Sector edits publish instantly and are stored in this browser.
          </p>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------------------------------- contact editor */

export const ContactEditor = () => {
  const { content } = useCms();
  const patch = useSectionPatch();
  const { contact } = content;

  const updateJobTypes = (jobTypes: TextItem[]) => patch("contact", { jobTypes });
  const updateSiteModes = (siteModes: TextItem[]) => patch("contact", { siteModes });

  return (
    <div className="space-y-6">
      <header>
        <p className="label-mono text-ember">CONTENT · CONTACT</p>
        <h1 className="display-wide mt-2 text-[clamp(1.7rem,3.2vw,2.4rem)] text-ink">Contact &amp; channels</h1>
        <p className="mt-2 text-[13.5px] text-steel">
          Email, Facebook and the enquiry form options. Submissions are logged to the enquiries desk.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-6 space-y-6">
          <Panel eyebrow="COPY" title="Contact section text">
            <div className="space-y-4">
              <Field label="Eyebrow" htmlFor="ct-eyebrow">
                <TextInput
                  id="ct-eyebrow"
                  value={contact.eyebrow}
                  onChange={(event) => patch("contact", { eyebrow: event.target.value })}
                />
              </Field>
              <Field label="Headline" htmlFor="ct-headline">
                <TextInput
                  id="ct-headline"
                  value={contact.headline}
                  onChange={(event) => patch("contact", { headline: event.target.value })}
                />
              </Field>
              <Field label="Body" htmlFor="ct-body">
                <TextArea
                  id="ct-body"
                  rows={4}
                  value={contact.body}
                  onChange={(event) => patch("contact", { body: event.target.value })}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Promise title" htmlFor="ct-promise">
                  <TextArea
                    id="ct-promise"
                    rows={2}
                    value={contact.promiseTitle}
                    onChange={(event) => patch("contact", { promiseTitle: event.target.value })}
                  />
                </Field>
                <Field label="Promise note" htmlFor="ct-promise-note">
                  <TextArea
                    id="ct-promise-note"
                    rows={2}
                    value={contact.promiseNote}
                    onChange={(event) => patch("contact", { promiseNote: event.target.value })}
                  />
                </Field>
              </div>
            </div>
          </Panel>

          <Panel eyebrow="CHANNELS" title="Email &amp; Facebook">
            <div className="space-y-4">
              <Field label="Business email" htmlFor="ct-email" hint="Used across the site, forms and admin job sheets.">
                <TextInput
                  id="ct-email"
                  type="email"
                  value={contact.email}
                  onChange={(event) => patch("contact", { email: event.target.value })}
                />
              </Field>
              <Field label="Email note" htmlFor="ct-email-note">
                <TextInput
                  id="ct-email-note"
                  value={contact.emailNote}
                  onChange={(event) => patch("contact", { emailNote: event.target.value })}
                />
              </Field>
              <Field label="Facebook link label" htmlFor="ct-fb-label">
                <TextInput
                  id="ct-fb-label"
                  value={contact.facebookLabel}
                  onChange={(event) => patch("contact", { facebookLabel: event.target.value })}
                />
              </Field>
              <Field label="Facebook URL" htmlFor="ct-fb-url">
                <TextInput
                  id="ct-fb-url"
                  value={contact.facebookUrl}
                  onChange={(event) => patch("contact", { facebookUrl: event.target.value })}
                />
              </Field>
              <Field label="Facebook note" htmlFor="ct-fb-note">
                <TextInput
                  id="ct-fb-note"
                  value={contact.facebookNote}
                  onChange={(event) => patch("contact", { facebookNote: event.target.value })}
                />
              </Field>
            </div>
          </Panel>
        </div>

        <div className="xl:col-span-6 space-y-6">
          <Panel eyebrow="FORM" title="Enquiry form copy">
            <div className="space-y-4">
              <Field label="Form title" htmlFor="ct-form-title">
                <TextInput
                  id="ct-form-title"
                  value={contact.formTitle}
                  onChange={(event) => patch("contact", { formTitle: event.target.value })}
                />
              </Field>
              <Field label="Form note" htmlFor="ct-form-note">
                <TextInput
                  id="ct-form-note"
                  value={contact.formNote}
                  onChange={(event) => patch("contact", { formNote: event.target.value })}
                />
              </Field>
              <Field label="Success headline" htmlFor="ct-success">
                <TextInput
                  id="ct-success"
                  value={contact.successHeadline}
                  onChange={(event) => patch("contact", { successHeadline: event.target.value })}
                />
              </Field>
              <Field label="Success note" htmlFor="ct-success-note">
                <TextArea
                  id="ct-success-note"
                  rows={3}
                  value={contact.successNote}
                  onChange={(event) => patch("contact", { successNote: event.target.value })}
                />
              </Field>
            </div>
          </Panel>

          <Panel eyebrow="OPTIONS" title="Job types">
            <SortableList<TextItem>
              items={contact.jobTypes}
              addLabel="Add job type"
              itemTitle={(item) => item.text}
              onReorder={updateJobTypes}
              onRemove={(id) => updateJobTypes(contact.jobTypes.filter((item) => item.id !== id))}
              onAdd={() => updateJobTypes([...contact.jobTypes, { id: uid("jt"), text: "New job type" }])}
            >
              {(item) => (
                <TextInput
                  value={item.text}
                  aria-label="Job type"
                  onChange={(event) =>
                    updateJobTypes(
                      contact.jobTypes.map((row) =>
                        row.id === item.id ? { ...row, text: event.target.value } : row
                      )
                    )
                  }
                />
              )}
            </SortableList>
          </Panel>

          <Panel eyebrow="OPTIONS" title="Site / delivery modes">
            <SortableList<TextItem>
              items={contact.siteModes}
              addLabel="Add site mode"
              itemTitle={(item) => item.text}
              onReorder={updateSiteModes}
              onRemove={(id) => updateSiteModes(contact.siteModes.filter((item) => item.id !== id))}
              onAdd={() => updateSiteModes([...contact.siteModes, { id: uid("sm"), text: "New site mode" }])}
            >
              {(item) => (
                <TextInput
                  value={item.text}
                  aria-label="Site mode"
                  onChange={(event) =>
                    updateSiteModes(
                      contact.siteModes.map((row) =>
                        row.id === item.id ? { ...row, text: event.target.value } : row
                      )
                    )
                  }
                />
              )}
            </SortableList>
            <p className="mt-3 text-[12px] text-mist">
              Form values are stored with each enquiry — {content.trades.length} trades available for tagging.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------- settings editor */

export const SettingsEditor = () => {
  const { content, settings, setSettings, resetContent } = useCms();
  const patch = useSectionPatch();
  const toast = useToast();
  const [passcodeDraft, setPasscodeDraft] = useState("");
  const [passcodeConfirm, setPasscodeConfirm] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const applyAccent = (accent: string, presetId: string) => {
    setSettings((prev) => ({ ...prev, accent, accentPreset: presetId }));
    toast("Theme accent updated across the site");
  };

  const savePasscode = () => {
    if (passcodeDraft.trim().length < 4) {
      toast("Passcode needs at least 4 characters", "warn");
      return;
    }
    if (passcodeDraft !== passcodeConfirm) {
      toast("Passcodes do not match", "warn");
      return;
    }
    setSettings((prev) => ({ ...prev, passcode: passcodeDraft.trim() }));
    setPasscodeDraft("");
    setPasscodeConfirm("");
    toast("Admin passcode updated");
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="label-mono text-ember">ADMIN · BRAND &amp; THEME</p>
        <h1 className="display-wide mt-2 text-[clamp(1.7rem,3.2vw,2.4rem)] text-ink">Brand, theme &amp; access</h1>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-6 space-y-6">
          <Panel eyebrow="BRAND" title="Wordmark &amp; footer copy">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 rounded-[5px] bg-chalk border border-hairline">
                <NauticLogoMark />
                <div className="min-w-0">
                  <p className="display-mid text-[15px] uppercase tracking-[0.02em] text-ink">
                    {content.brand.name}
                  </p>
                  <p className="label-mono text-steel mt-1">{content.brand.tagline}</p>
                </div>
              </div>
              <Field label="Brand name" htmlFor="br-name">
                <TextInput
                  id="br-name"
                  value={content.brand.name}
                  onChange={(event) => patch("brand", { name: event.target.value })}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Wordmark sub-label" htmlFor="br-tagline">
                  <TextInput
                    id="br-tagline"
                    value={content.brand.tagline}
                    onChange={(event) => patch("brand", { tagline: event.target.value })}
                  />
                </Field>
                <Field label="Descriptor" htmlFor="br-sub">
                  <TextInput
                    id="br-sub"
                    value={content.brand.subTagline}
                    onChange={(event) => patch("brand", { subTagline: event.target.value })}
                  />
                </Field>
              </div>
              <Field label="Footer blurb" htmlFor="ft-blurb">
                <TextArea
                  id="ft-blurb"
                  rows={3}
                  value={content.footer.blurb}
                  onChange={(event) => patch("footer", { blurb: event.target.value })}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Footer badge" htmlFor="ft-badge">
                  <TextInput
                    id="ft-badge"
                    value={content.footer.badge}
                    onChange={(event) => patch("footer", { badge: event.target.value })}
                  />
                </Field>
                <Field label="Admin link label" htmlFor="ft-admin">
                  <TextInput
                    id="ft-admin"
                    value={content.footer.adminNote}
                    onChange={(event) => patch("footer", { adminNote: event.target.value })}
                  />
                </Field>
              </div>
              <Field label="Footer promise" htmlFor="ft-promise">
                <TextInput
                  id="ft-promise"
                  value={content.footer.promise}
                  onChange={(event) => patch("footer", { promise: event.target.value })}
                />
              </Field>
            </div>
          </Panel>

          <Panel eyebrow="ACCESS" title="Admin passcode" description="Client-side lock for this demo CMS.">
            <div className="space-y-4">
              <Field label="New passcode" htmlFor="pw-new">
                <TextInput
                  id="pw-new"
                  type="password"
                  value={passcodeDraft}
                  onChange={(event) => setPasscodeDraft(event.target.value)}
                  placeholder="At least 4 characters"
                />
              </Field>
              <Field label="Confirm passcode" htmlFor="pw-confirm">
                <TextInput
                  id="pw-confirm"
                  type="password"
                  value={passcodeConfirm}
                  onChange={(event) => setPasscodeConfirm(event.target.value)}
                />
              </Field>
              <div className="flex items-center gap-2">
                <Button variant="primary" onClick={savePasscode}>
                  <KeyRound className="w-4 h-4" />
                  Update passcode
                </Button>
                <span className="text-[12px] text-mist">Current passcode is stored in this browser only.</span>
              </div>
            </div>
          </Panel>
        </div>

        <div className="xl:col-span-6 space-y-6">
          <Panel eyebrow="THEME" title="Accent colour" description="Drives buttons, rules, numerals and highlights site-wide.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyAccent(preset.accent, preset.id)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-[4px] border text-left transition-all cursor-pointer ${
                    settings.accentPreset === preset.id
                      ? "border-ink bg-chalk"
                      : "border-hairline bg-white hover:border-ink"
                  }`}
                >
                  <span
                    className="w-7 h-7 rounded-[4px] shrink-0 border border-black/10"
                    style={{ background: preset.accent }}
                  />
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-semibold text-ink">{preset.label}</span>
                    <span className="block font-mono text-[11.5px] text-mist">{preset.accent}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Custom hex" htmlFor="accent-custom" hint="Any hex value overrides the presets.">
                <div className="flex items-center gap-2">
                  <input
                    id="accent-custom"
                    type="color"
                    value={settings.accent}
                    onChange={(event) => applyAccent(event.target.value, "custom")}
                    className="w-11 h-10 rounded-[4px] border border-hairline bg-white cursor-pointer p-1"
                    aria-label="Pick custom accent colour"
                  />
                  <TextInput
                    value={settings.accent}
                    onChange={(event) => applyAccent(event.target.value, "custom")}
                    aria-label="Accent hex value"
                    className="font-mono"
                  />
                </div>
              </Field>
              <Field label="Preview">
                <div className="h-10 rounded-[4px] border border-hairline overflow-hidden flex">
                  <span className="flex-1 bg-ember" />
                  <span className="flex-1 bg-ember-soft" />
                  <span className="flex-1 bg-ink" />
                  <span className="flex-1 bg-chalk" />
                </div>
              </Field>
            </div>

            <div className="mt-5 flex items-center gap-2 label-mono text-steel">
              <Palette className="w-3.5 h-3.5" />
              Display face: Archivo · Body: Plus Jakarta Sans · Mono: JetBrains Mono
            </div>
          </Panel>

          <Panel eyebrow="BEHAVIOUR" title="Enquiries desk settings">
            <div className="space-y-3">
              <Toggle
                checked={settings.enquiriesEmailForward}
                onChange={(next) => setSettings((prev) => ({ ...prev, enquiriesEmailForward: next }))}
                label="Open an email draft after submission"
                hint={`Drafts the logged enquiry to ${content.contact.email} in the visitor's mail app.`}
              />
              <Toggle
                checked={settings.demoEnquiries}
                onChange={(next) => setSettings((prev) => ({ ...prev, demoEnquiries: next }))}
                label="Seed sample enquiries on a fresh browser"
                hint="Loads six realistic job scopes the first time the desk is opened."
              />
              <Button variant="ghost" onClick={() => toast("Every field publishes the moment you type")}>
                <Save className="w-4 h-4" />
                Publishing is instant
              </Button>
            </div>
          </Panel>

          <Panel eyebrow="RESET" title="Restore defaults">
            <p className="text-[13px] text-steel leading-relaxed">
              Resets brand copy, hero, trades, coverage, contact and accent back to the original Nautic Power
              content. Enquiries are kept.
            </p>
            <Button variant="danger" className="mt-4" onClick={() => setConfirmReset(true)}>
              <RotateCcw className="w-4 h-4" />
              Reset content
            </Button>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset all site content?"
        message="Every edit to copy, services, sectors and channels will be replaced with the original Nautic Power content. Enquiries are not affected."
        confirmLabel="Reset content"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetContent();
          setConfirmReset(false);
          toast("Site content reset to defaults", "warn");
        }}
      />
    </div>
  );
};

/* ------------------------------------------------------------ data editor */

export const DataEditor = () => {
  const {
    content,
    settings,
    enquiries,
    exportContentJson,
    exportEnquiriesCsv,
    importJson,
    loadSampleEnquiries,
    clearEnquiries,
    resetContent,
  } = useCms();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [confirm, setConfirm] = useState<null | "reset" | "clear">(null);

  const sizeKb = (value: unknown) => (JSON.stringify(value).length / 1024).toFixed(1);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = importJson(String(reader.result ?? ""));
      toast(result.message, result.ok ? "ok" : "warn");
    };
    reader.onerror = () => toast("Could not read that file", "warn");
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="label-mono text-ember">ADMIN · DATA &amp; BACKUP</p>
        <h1 className="display-wide mt-2 text-[clamp(1.7rem,3.2vw,2.4rem)] text-ink">Data &amp; backup</h1>
        <p className="mt-2 text-[13.5px] text-steel max-w-2xl">
          Content and enquiries live in this browser's local storage. Export a JSON snapshot before clearing
          data, or to move everything to another machine.
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Content payload", value: `${sizeKb(content)} KB` },
          { label: "Enquiries", value: `${enquiries.length}` },
          { label: "Enquiry payload", value: `${sizeKb(enquiries)} KB` },
          { label: "Settings", value: `${sizeKb(settings)} KB` },
        ].map((cell) => (
          <div key={cell.label} className="bg-white border border-hairline rounded-[6px] p-4">
            <p className="label-mono text-mist">{cell.label}</p>
            <p className="display-tight mt-2 text-[26px] text-ink tabular-nums">{cell.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Panel eyebrow="EXPORT" title="Download snapshots">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => {
                exportContentJson();
                toast("Content JSON downloaded");
              }}
            >
              <Download className="w-4 h-4" />
              Content JSON
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                exportEnquiriesCsv(enquiries);
                toast(`${enquiries.length} enquiries exported to CSV`);
              }}
              disabled={enquiries.length === 0}
            >
              <Download className="w-4 h-4" />
              Enquiries CSV
            </Button>
          </div>
          <p className="mt-3 text-[12.5px] text-mist">
            CSV opens in Excel, Numbers or Sheets and keeps references, statuses and internal notes.
          </p>
        </Panel>

        <Panel eyebrow="IMPORT" title="Restore a content snapshot">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
              event.target.value = "";
            }}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4" />
            Choose JSON file
          </Button>
          <p className="mt-3 text-[12.5px] text-mist">
            Imports replace site content and settings. Enquiries are never overwritten by an import.
          </p>
        </Panel>

        <Panel eyebrow="SAMPLE DATA" title="Enquiries desk fixtures">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const count = loadSampleEnquiries();
                toast(`${count} sample enquiries added`);
              }}
            >
              <Upload className="w-4 h-4" />
              Load sample enquiries
            </Button>
            <Button variant="danger" onClick={() => setConfirm("clear")} disabled={enquiries.length === 0}>
              <Trash className="w-4 h-4" />
              Clear all enquiries
            </Button>
          </div>
        </Panel>

        <Panel eyebrow="DANGER ZONE" title="Reset site content">
          <p className="text-[13px] text-steel leading-relaxed">
            Restores every published string, image reference and service line to the original Nautic Power
            content.
          </p>
          <Button variant="danger" className="mt-4" onClick={() => setConfirm("reset")}>
            <RotateCcw className="w-4 h-4" />
            Reset content to defaults
          </Button>
        </Panel>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === "clear" ? "Clear every enquiry?" : "Reset all site content?"}
        message={
          confirm === "clear"
            ? "All enquiries, statuses and internal notes will be permanently deleted from this browser."
            : "Every edit you have made to copy, services, sectors and channels will be replaced with the original content."
        }
        confirmLabel={confirm === "clear" ? "Clear enquiries" : "Reset content"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm === "clear") {
            clearEnquiries();
            toast("All enquiries cleared", "warn");
          } else {
            resetContent();
            toast("Site content reset to defaults", "warn");
          }
          setConfirm(null);
        }}
      />
    </div>
  );
};
