import { ArrowRight, Mail } from "lucide-react";
import { useCms } from "../cms/store";
import type { TradeId } from "../cms/content";
import { Reveal } from "./motion";

export const Trades = ({ onEnquireTrade }: { onEnquireTrade: (trade: TradeId) => void }) => {
  const { content } = useCms();

  return (
    <>
      {content.trades.map((trade, idx) => {
        const reversed = idx % 2 === 1;
        const tone = reversed ? "bg-white" : "bg-chalk";

        return (
          <section
            key={trade.id}
            id={trade.id}
            className={`relative ${tone} border-t border-hairline py-24 lg:py-32 overflow-hidden scroll-mt-20`}
          >
            {/* Ghost trade numeral */}
            <span
              className={`pointer-events-none absolute select-none display-tight text-[clamp(9rem,22vw,17rem)] leading-none ${
                reversed ? "right-[-2%] top-6" : "left-[-2%] top-6"
              } text-ink/[0.045]`}
              aria-hidden="true"
            >
              {trade.index}
            </span>

            <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
                <Reveal className={`lg:col-span-6 ${reversed ? "lg:order-2" : "lg:order-1"}`}>
                  <div className="relative overflow-hidden rounded-[6px] border border-hairline bg-ink aspect-[5/4] img-zoom">
                    <img
                      src={trade.image}
                      alt={trade.imageAlt}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 h-28"
                      style={{ background: "linear-gradient(to top, rgba(10,12,14,0.82), transparent)" }}
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4 flex items-center justify-between gap-3">
                      <span className="label-mono text-white/90">{trade.deliveryMode}</span>
                      <span className="label-mono px-2 py-1 rounded-[3px] bg-ember text-white">
                        {trade.items.length} services
                      </span>
                    </div>
                  </div>
                </Reveal>

                <div className={`lg:col-span-6 ${reversed ? "lg:order-1" : "lg:order-2"}`}>
                  <Reveal className="flex items-center gap-3">
                    <span className="display-tight text-[34px] text-ember leading-none">{trade.index}</span>
                    <span className="h-px flex-1 bg-hairline" />
                    <p className="label-mono text-steel">{trade.eyebrow}</p>
                  </Reveal>

                  <Reveal delay={60}>
                    <h2 className="display-wide mt-4 text-[clamp(2rem,4.2vw,3.1rem)] text-ink">
                      {trade.title}
                    </h2>
                    <p className="display-mid mt-3 text-[19px] sm:text-[22px] text-graphite leading-snug max-w-xl">
                      {trade.headline}
                    </p>
                    <p className="mt-5 text-[15.5px] leading-[1.68] text-steel max-w-xl">{trade.summary}</p>
                  </Reveal>

                  <Reveal delay={120} className="mt-9 border-t border-hairline">
                    <ul className="divide-y divide-hairline">
                      {trade.items.map((item, i) => (
                        <li
                          key={item.id}
                          className="group relative py-4 pl-5 pr-2 -ml-5 transition-colors hover:bg-white/70"
                        >
                          <span className="absolute left-0 top-4 bottom-4 w-[2px] bg-hairline transition-colors group-hover:bg-ember" />
                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-5">
                            <h3 className="sm:w-[46%] shrink-0 flex items-baseline gap-2.5">
                              <span className="label-mono text-mist tabular-nums">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <span className="text-[15px] font-semibold text-ink leading-snug">
                                {item.name}
                              </span>
                            </h3>
                            <p className="text-[14px] leading-[1.55] text-steel">{item.detail}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Reveal>

                  <Reveal delay={180} className="mt-8 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onEnquireTrade(trade.id)}
                      className="group inline-flex items-center gap-2 px-5 py-3 rounded-[4px] bg-ink text-white text-[13.5px] font-semibold hover:bg-ember transition-colors cursor-pointer"
                    >
                      Enquire about {trade.title.toLowerCase()}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                    <a
                      href={`mailto:${content.contact.email}?subject=${encodeURIComponent(
                        `${trade.title} enquiry — ${content.brand.name}`
                      )}`}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-[4px] border border-hairline bg-white text-[13.5px] font-semibold text-ink hover:border-ink transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Email the team
                    </a>
                  </Reveal>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
};
