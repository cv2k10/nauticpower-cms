import { ArrowUpRight, Lock, Mail, MessageSquare } from "lucide-react";
import { useCms } from "../cms/store";
import { scrollToId } from "./motion";
import { NauticLogoMark } from "./Navbar";

export const Footer = () => {
  const { content } = useCms();
  const { brand, footer, contact } = content;
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-carbon text-white overflow-hidden noise">
      <div className="absolute inset-0 blueprint-light pointer-events-none" aria-hidden="true" />
      <div
        className="absolute -bottom-40 -left-24 w-[520px] h-[380px] ember-glow opacity-45 pointer-events-none"
        aria-hidden="true"
      />
      <div className="hazard relative h-[5px] w-full opacity-80" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/15">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <NauticLogoMark inverted />
              <span className="display-mid text-[16px] uppercase tracking-[0.02em]">{brand.name}</span>
            </div>
            <p className="mt-4 text-[14px] leading-[1.65] text-white/65 max-w-sm">{footer.blurb}</p>
            <p className="mt-4 inline-flex items-center gap-2 label-mono text-ember-bright">
              <span className="w-1.5 h-1.5 rotate-45 bg-ember-bright" />
              {footer.badge}
            </p>
          </div>

          <div className="md:col-span-3">
            <h3 className="label-mono text-white/50">Three trades</h3>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {content.trades.map((trade) => (
                <li key={trade.id}>
                  <button
                    type="button"
                    onClick={() => scrollToId(trade.id)}
                    className="text-left text-white/80 hover:text-white underline-sweep transition-colors cursor-pointer"
                  >
                    <span className="label-mono text-ember-bright mr-2">{trade.index}</span>
                    {trade.title}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => scrollToId("coverage")}
                  className="text-left text-white/80 hover:text-white underline-sweep transition-colors cursor-pointer"
                >
                  Sectors &amp; remote coverage
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h3 className="label-mono text-white/50">Direct contact</h3>
            <ul className="mt-4 space-y-3 text-[14px]">
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="group inline-flex items-center gap-2 font-mono text-white/85 hover:text-white break-all transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-ember-bright shrink-0" />
                  {contact.email}
                </a>
              </li>
              <li>
                <a
                  href={contact.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 text-white/85 hover:text-white transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-ember-bright shrink-0" />
                  {contact.facebookLabel}
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </a>
              </li>
              <li className="text-white/60 text-[13px] pt-1">On-site or in the workshop — day or night.</li>
              <li className="pt-2">
                <a
                  href="#/admin"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[4px] border border-white/20 text-[12.5px] font-semibold text-white/80 hover:text-white hover:border-white/60 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {footer.adminNote}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[13px] text-white/55">
          <p>
            © {year} {brand.name}. All rights reserved.
          </p>
          <p className="display-mid text-[13.5px] text-white/85">{footer.promise}</p>
        </div>
      </div>
    </footer>
  );
};
