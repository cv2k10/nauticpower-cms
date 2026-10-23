import { useEffect, useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { useCms } from "../cms/store";
import { prefersReducedMotion, Reveal, scrollToId } from "./motion";

export const CtaBand = () => {
  const { content } = useCms();
  const { ctaBand } = content;
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        const node = document.getElementById("cta-band");
        if (node) {
          const rect = node.getBoundingClientRect();
          const delta = window.innerHeight / 2 - rect.top - rect.height / 2;
          setOffset(Math.max(-120, Math.min(120, delta * 0.12)));
        }
        raf = 0;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="cta-band"
      className="relative isolate overflow-hidden bg-carbon noise border-y border-black/40"
    >
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={ctaBand.image}
          alt={ctaBand.imageAlt}
          loading="lazy"
          className="w-full h-[126%] -mt-[8%] object-cover object-center will-change-transform"
          style={{ transform: `translate3d(0, ${offset}px, 0) scale(1.05)` }}
        />
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(10,12,14,0.94) 0%, rgba(10,12,14,0.82) 46%, rgba(10,12,14,0.5) 100%)",
        }}
      />
      <div
        className="absolute -left-20 top-1/2 -translate-y-1/2 w-[560px] h-[420px] ember-glow drift pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-20 lg:py-28">
        <div className="max-w-2xl">
          <Reveal className="flex items-center gap-3">
            <span className="h-px w-10 bg-ember-bright" />
            <p className="label-mono text-ember-bright">{ctaBand.eyebrow}</p>
          </Reveal>

          <Reveal delay={70}>
            <h2 className="display-wide mt-5 text-[clamp(1.9rem,4.4vw,3.2rem)] text-white text-balance">
              {ctaBand.headline}
            </h2>
            <p className="mt-5 text-[16px] leading-[1.68] text-white/80 max-w-xl">{ctaBand.body}</p>
          </Reveal>

          <Reveal delay={140} className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => scrollToId("contact")}
              className="sweep group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-[4px] bg-ember text-white text-[14px] font-semibold hover:bg-white hover:text-ink transition-colors cursor-pointer"
            >
              {ctaBand.primaryCta}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href={`mailto:${content.contact.email}`}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-[4px] border border-white/35 text-white text-[14px] font-medium hover:bg-white/10 transition-colors"
            >
              <Mail className="w-4 h-4" />
              {ctaBand.secondaryLabel}
            </a>
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-7 label-mono text-white/55 font-mono">{content.contact.email}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
