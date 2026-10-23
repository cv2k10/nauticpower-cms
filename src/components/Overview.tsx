import { useState } from "react";
import { ArrowRight, Check, CornerDownRight } from "lucide-react";
import { useCms } from "../cms/store";
import type { TradeId } from "../cms/content";
import { Reveal, scrollToId } from "./motion";

export const Overview = ({ onEnquireTrade }: { onEnquireTrade: (trade: TradeId) => void }) => {
  const { content } = useCms();
  const { overview } = content;
  const [active, setActive] = useState<TradeId>("fabrication");
  const current = content.trades.find((trade) => trade.id === active) ?? content.trades[0];

  return (
    <section id="trades-overview" className="relative bg-white py-24 lg:py-32 overflow-hidden">
      <div
        className="absolute right-[-10%] top-16 w-[520px] h-[520px] ember-glow opacity-25 pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <Reveal className="flex items-center gap-3">
              <span className="h-px w-10 bg-ember" />
              <p className="label-mono text-ember">{overview.eyebrow}</p>
            </Reveal>

            <Reveal delay={70}>
              <h2 className="display-wide mt-5 text-[clamp(1.9rem,3.6vw,2.9rem)] text-ink text-balance">
                {overview.headline}
              </h2>
            </Reveal>

            <Reveal delay={140}>
              <p className="mt-6 text-[16px] leading-[1.68] text-steel">{overview.bodyA}</p>
              <p className="mt-4 text-[16px] leading-[1.68] text-steel">{overview.bodyB}</p>
            </Reveal>

            <Reveal delay={210} className="mt-9 pt-7 border-t border-hairline">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <dt className="label-mono text-mist">{overview.factALabel}</dt>
                  <dd className="mt-1.5 text-[15px] font-semibold text-ink">{overview.factAValue}</dd>
                </div>
                <div>
                  <dt className="label-mono text-mist">{overview.factBLabel}</dt>
                  <dd className="mt-1.5 text-[15px] font-semibold text-ink">{overview.factBValue}</dd>
                </div>
              </dl>
              <p className="mt-7 inline-flex items-center gap-2 text-[14px] font-semibold text-ink">
                <CornerDownRight className="w-4 h-4 text-ember" />
                {overview.closingLine}
              </p>
            </Reveal>
          </div>

          {/* Interactive trade switcher */}
          <Reveal delay={120} className="lg:col-span-7">
            <div className="relative bg-chalk border border-hairline rounded-[6px] p-5 sm:p-7 lg:p-8 lift">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-hairline">
                <p className="label-mono text-steel">{overview.switcherNote}</p>
                <span className="label-mono text-mist tabular-nums">
                  {current.index} / {String(content.trades.length).padStart(2, "0")}
                </span>
              </div>

              <div role="tablist" aria-label="Nautic Power trades" className="mt-5 grid grid-cols-3 gap-2">
                {content.trades.map((trade) => {
                  const selected = trade.id === active;
                  return (
                    <button
                      key={trade.id}
                      role="tab"
                      type="button"
                      aria-selected={selected}
                      onClick={() => setActive(trade.id)}
                      className={`relative px-3 py-3 rounded-[4px] text-[13.5px] font-semibold transition-all cursor-pointer border ${
                        selected
                          ? "bg-ink text-white border-ink"
                          : "bg-white text-graphite border-hairline hover:border-ink hover:text-ink"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <span
                          className={`label-mono text-[10px] ${selected ? "text-ember-bright" : "text-mist"}`}
                        >
                          {trade.index}
                        </span>
                        {trade.title}
                      </span>
                      {selected && (
                        <span className="absolute inset-x-3 -bottom-px h-[2px] bg-ember" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div key={current.id} className="rise mt-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="label-mono text-ember">{current.eyebrow}</p>
                    <h3 className="display-mid mt-2.5 text-[22px] sm:text-[26px] text-ink max-w-md">
                      {current.headline}
                    </h3>
                  </div>
                  <span className="shrink-0 label-mono px-2.5 py-1.5 rounded-[3px] bg-white border border-hairline text-ink">
                    {current.deliveryMode}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-5 gap-5">
                  <div className="sm:col-span-2 overflow-hidden rounded-[5px] border border-hairline img-zoom bg-ink aspect-[4/3]">
                    <img
                      src={current.image}
                      alt={current.imageAlt}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <ul className="sm:col-span-3 divide-y divide-hairline border-y border-hairline">
                    {current.items.map((item) => (
                      <li key={item.id} className="group py-2.5 flex items-start gap-2.5">
                        <Check className="w-3.5 h-3.5 mt-1 text-ember shrink-0 transition-transform group-hover:scale-125" />
                        <span className="text-[14px] font-medium text-ink leading-snug">{item.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onEnquireTrade(current.id)}
                    className="group inline-flex items-center gap-2 px-5 py-3 rounded-[4px] bg-ink text-white text-[13.5px] font-semibold hover:bg-ember transition-colors cursor-pointer"
                  >
                    Book {current.title.toLowerCase()} work
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToId(current.id)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-[4px] border border-hairline bg-white text-[13.5px] font-semibold text-ink hover:border-ink transition-colors cursor-pointer"
                  >
                    Full {current.title.toLowerCase()} scope
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
