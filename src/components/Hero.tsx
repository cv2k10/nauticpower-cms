import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useCms } from "../cms/store";
import { prefersReducedMotion, scrollToId } from "./motion";

export const Hero = () => {
  const { content } = useCms();
  const [mounted, setMounted] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        setOffset(window.scrollY);
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const { hero, brand } = content;
  const stageClass = mounted ? "is-in" : "";

  return (
    <section
      className="relative min-h-[92svh] flex flex-col justify-end overflow-hidden bg-carbon noise"
      aria-label={`${brand.name} — ${brand.subTagline}`}
    >
      {/* Parallax field-rig photograph */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={hero.image}
          alt={hero.imageAlt}
          fetchPriority="high"
          className="w-full h-[112%] object-cover object-center will-change-transform"
          style={{ transform: `translate3d(0, ${Math.min(offset * 0.22, 160)}px, 0) scale(1.04)` }}
        />
      </div>

      {/* Directional scrim — keeps the left copy legible, leaves the rig lit */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(96deg, rgba(10,12,14,0.93) 0%, rgba(10,12,14,0.82) 38%, rgba(10,12,14,0.42) 68%, rgba(10,12,14,0.24) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-40"
        style={{ background: "linear-gradient(to bottom, rgba(10,12,14,0.72), transparent)" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-56"
        style={{ background: "linear-gradient(to top, rgba(10,12,14,0.88), transparent)" }}
      />
      <div
        className="absolute -bottom-32 left-1/4 w-[620px] h-[380px] ember-glow drift pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl w-full mx-auto px-5 sm:px-8 lg:px-10 pt-32 pb-10 lg:pb-14">
        <div className="max-w-3xl">
          <div
            className={`mask-line ${stageClass} inline-flex items-center gap-2.5 px-3 py-1.5 rounded-[3px] border border-white/25 bg-white/8 backdrop-blur-sm`}
            style={{ transitionDelay: "60ms" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-ember-bright flicker" />
            <span className="label-mono text-white/90">{hero.badge}</span>
          </div>

          <h1
            className={`mask-line ${stageClass} display-wide mt-6 text-[clamp(2.5rem,7.2vw,5.1rem)] text-white text-balance`}
            style={{ transitionDelay: "140ms" }}
          >
            {hero.headline}
          </h1>

          <p
            className={`reveal ${stageClass} mt-6 max-w-xl text-[16.5px] sm:text-[18px] leading-[1.62] text-white/82`}
            style={{ transitionDelay: "260ms" }}
          >
            {hero.body}
          </p>

          <div
            className={`reveal ${stageClass} mt-9 flex flex-wrap items-center gap-3`}
            style={{ transitionDelay: "360ms" }}
          >
            <button
              type="button"
              onClick={() => scrollToId("contact")}
              className="sweep group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-[4px] bg-white text-ink text-[14px] font-semibold hover:bg-ember hover:text-white transition-colors cursor-pointer"
            >
              {hero.primaryCta}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={() => scrollToId("trades-overview")}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-[4px] border border-white/35 text-white text-[14px] font-medium hover:bg-white/10 hover:border-white/60 transition-colors cursor-pointer"
            >
              {hero.secondaryCta}
            </button>
          </div>
        </div>

        {/* Trade index rail */}
        <div
          className={`reveal ${stageClass} mt-14 grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/15 border border-white/15 rounded-[4px] overflow-hidden`}
          style={{ transitionDelay: "460ms" }}
        >
          {content.trades.map((trade) => (
            <button
              key={trade.id}
              type="button"
              onClick={() => scrollToId(trade.id)}
              className="group flex items-center gap-3 bg-carbon/85 backdrop-blur-sm px-4 py-3.5 text-left hover:bg-carbon transition-colors cursor-pointer"
            >
              <span className="label-mono text-ember-bright">{trade.index}</span>
              <span className="text-[13.5px] font-semibold text-white/90 group-hover:text-white">
                {trade.title}
              </span>
              <ArrowRight className="ml-auto w-3.5 h-3.5 text-white/40 transition-all group-hover:text-white group-hover:translate-x-1" />
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="label-mono text-white/55">{hero.footerNote}</p>
          <button
            type="button"
            onClick={() => scrollToId("stats")}
            className="group inline-flex flex-col items-center gap-1 text-white/55 hover:text-white transition-colors cursor-pointer"
            aria-label="Scroll to capability overview"
          >
            <span className="label-mono text-[9.5px]">Scroll</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </button>
        </div>
      </div>
    </section>
  );
};
