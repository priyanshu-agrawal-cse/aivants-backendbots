"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const TOOLS = [
  { name: "CRM", sub: "HubSpot, Salesforce" },
  { name: "Email Tools", sub: "Mailchimp, Apollo" },
  { name: "Chat Tools", sub: "Intercom, Drift" },
  { name: "Automation", sub: "Zapier, Make" },
  { name: "Call Systems", sub: "Air AI, JustCall" },
  { name: "Outreach", sub: "Lemlist, Instantly" },
];

export default function ReplaceTools() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-32 px-6 bg-[#f5f5f5]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#9a9a9a] uppercase mb-4">
            Consolidation
          </p>
          <h2 className="text-[36px] sm:text-[44px] font-semibold tracking-[-0.03em] text-[#0a0a0a] leading-[1.1] mb-4">
            You don&apos;t need anything else
          </h2>
          <p className="text-[15.5px] text-[#6a6a6a] max-w-sm mx-auto">
            One system replaces the entire stack you&apos;re paying for right now.
          </p>
        </motion.div>

        {/* Tool grid flowing into AIVANTS */}
        <div className="relative">
          {/* Tools grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {TOOLS.map((tool, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.05 }}
                className="relative flex flex-col items-center justify-center p-5 rounded-2xl border border-black/[0.08] bg-white/60 text-center"
              >
                <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[#d0d0d0]" />
                <span className="text-[13.5px] font-semibold text-[#4a4a4a] tracking-[-0.01em]">
                  {tool.name}
                </span>
                <span className="text-[11px] text-[#aaa] mt-1">{tool.sub}</span>
                {/* Connector line down */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-px h-4 bg-gradient-to-b from-black/10 to-transparent" />
              </motion.div>
            ))}
          </div>

          {/* Arrow down */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col items-center py-4 gap-1"
          >
            <div className="flex gap-1 text-[#bbb]">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-px h-6 bg-black/10" />
              ))}
            </div>
            <svg className="text-[#bbb]" width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d="M1 1L6 7L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>

          {/* AIVANTS unified layer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
            className="relative flex flex-col items-center justify-center py-10 px-8 rounded-2xl bg-[#0a0a0a] text-white text-center overflow-hidden"
          >
            {/* Subtle pattern */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="relative z-10">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-white/40 uppercase mb-2">
                Unified Intelligence Layer
              </p>
              <p className="text-[28px] font-semibold tracking-[-0.03em]">AIVANTS</p>
              <p className="text-[13.5px] text-white/50 mt-2 max-w-xs">
                One system. Zero redundancy. Complete execution.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
