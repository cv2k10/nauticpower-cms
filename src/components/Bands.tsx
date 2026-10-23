import { useCms } from "../cms/store";
import { CountUp, Reveal } from "./motion";

/** White engineering band: oversized display numerals that count up on reveal. */
export const StatsBand = () => {
  const { content } = useCms();

  return (
    <section className="relative bg-white border-b border-hairline overflow-hidden">
      <div className="absolute inset-0 blueprint opacity-70 pointer-events-none" />
      <div
        className="absolute -top-24 -left-24 w-[420px] h-[420px] ember-glow drift opacity-40 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-14 lg:py-16">
        <Reveal className="flex items-center gap-3 mb-9">
          <span className="h-px w-10 bg-ember" />
          <p className="label-mono text-steel">
            One crew · three trades · {content.brand.name} capability
          </p>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-hairline">
          {content.stats.map((stat, i) => (
            <Reveal
              key={stat.id}
              delay={i * 90}
              className={`px-5 lg:px-7 py-6 lg:py-2 first:pl-0 lg:first:pl-7 ${
                i % 2 === 0 ? "lg:border-l-0" : ""
              }`}
            >
              <p className="display-tight text-[42px] sm:text-[52px] lg:text-[60px] text-ink tabular-nums">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-[14px] font-semibold text-ink">{stat.label}</p>
              <p className="mt-1 text-[12.5px] text-steel leading-snug">{stat.note}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

/** Carbon marquee strip with hazard edge — a living capability ticker. */
export const TickerBand = () => {
  const { content } = useCms();
  const items = content.ticker.map((item) => item.text).filter(Boolean);
  if (items.length === 0) return null;

  const loop = [...items, ...items];

  return (
    <div className="relative bg-carbon text-white overflow-hidden border-y border-black/40">
      <div className="hazard h-[5px] w-full opacity-85" aria-hidden="true" />
      <div className="relative flex items-center">
        <span className="hidden sm:flex shrink-0 items-center gap-2 h-full px-5 py-3 bg-ember text-white label-mono z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-white pulse-ring" />
          Live scope
        </span>
        <div className="relative flex-1 overflow-hidden py-3">
          <div className="ticker-track flex w-max items-center gap-8 will-change-transform">
            {loop.map((text, i) => (
              <span key={`${text}-${i}`} className="flex items-center gap-8 shrink-0">
                <span className="label-mono text-white/75 whitespace-nowrap">{text}</span>
                <span className="w-1.5 h-1.5 rotate-45 bg-ember shrink-0" aria-hidden="true" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
