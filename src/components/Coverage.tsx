import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { MapPin } from "lucide-react";
import { useCms } from "../cms/store";
import { prefersReducedMotion, Reveal } from "./motion";

export const Coverage = () => {
  const { content } = useCms();
  const { coverage } = content;
  const ref = useRef<HTMLElement | null>(null);

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (prefersReducedMotion()) return;
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    node.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  return (
    <section
      id="coverage"
      ref={ref}
      onPointerMove={onPointerMove}
      className="relative bg-carbon text-white py-24 lg:py-32 overflow-hidden noise scroll-mt-20"
    >
      <div className="absolute inset-0 blueprint-light pointer-events-none" aria-hidden="true" />
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(460px circle at var(--mx, 22%) var(--my, 30%), color-mix(in oklab, var(--accent) 26%, transparent), transparent 72%)",
        }}
        aria-hidden="true"
      />
      <div className="hazard absolute inset-x-0 top-0 h-[5px] opacity-80" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-6">
            <Reveal className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-ember-bright" />
              <p className="label-mono text-ember-bright">{coverage.eyebrow}</p>
            </Reveal>

            <Reveal delay={70}>
              <h2 className="display-wide mt-4 text-[clamp(2rem,4.4vw,3.2rem)] text-white text-balance">
                {coverage.headline}
              </h2>
              <p className="mt-5 text-[16.5px] leading-[1.68] text-white/78 max-w-xl">{coverage.body}</p>
            </Reveal>

            <Reveal delay={140} className="mt-9 grid grid-cols-2 gap-px bg-white/15 border border-white/15 rounded-[5px] overflow-hidden">
              {coverage.modes.map((mode) => (
                <div key={mode.id} className="group bg-carbon px-4 py-4 hover:bg-carbon2 transition-colors">
                  <p className="text-[14px] font-semibold text-white group-hover:text-ember-bright transition-colors">
                    {mode.title}
                  </p>
                  <p className="mt-1 text-[12.5px] text-white/60">{mode.note}</p>
                </div>
              ))}
            </Reveal>
          </div>

          <Reveal delay={110} className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-[6px] border border-white/15 aspect-[16/11] bg-carbon2 img-zoom">
              <img
                src={coverage.image}
                alt={coverage.imageAlt}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(200deg, rgba(10,12,14,0.05), rgba(10,12,14,0.62))" }}
              />
              <p className="absolute bottom-4 left-4 label-mono text-white/85">
                We travel to site — rural, regional, CBD &amp; remote
              </p>
            </div>
          </Reveal>
        </div>

        <div className="mt-16 lg:mt-20 pt-12 border-t border-white/15">
          <Reveal className="flex flex-wrap items-center justify-between gap-3 mb-9">
            <p className="label-mono text-white/60">{coverage.sectorsHeading}</p>
            <span className="label-mono text-ember-bright">
              {String(coverage.sectors.length).padStart(2, "0")} sectors
            </span>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/12 border border-white/12 rounded-[5px] overflow-hidden">
            {coverage.sectors.map((sector, i) => (
              <Reveal key={sector.id} delay={i * 80} className="bg-carbon">
                <div className="group h-full px-5 py-6 hover:bg-carbon2 transition-colors border-l-2 border-transparent hover:border-ember">
                  <span className="label-mono text-ember-bright">{sector.code}</span>
                  <h3 className="display-mid mt-2.5 text-[17px] text-white leading-tight">{sector.name}</h3>
                  <p className="mt-2.5 text-[13.5px] leading-[1.6] text-white/65">{sector.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
