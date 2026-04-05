"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const STEPS = [
  { label: "Receive input", desc: "Command arrives via any channel" },
  { label: "Authenticate", desc: "Identity verified via secure code" },
  { label: "Understand context", desc: "Intent parsed against your business data" },
  { label: "Evaluate options", desc: "Multiple execution paths considered" },
  { label: "Select optimal action", desc: "Best path chosen based on outcome probability" },
  { label: "Execute & report", desc: "Action runs, result returned to you" },
];

export default function Intelligence() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#9a9a9a] uppercase mb-4">
            Intelligence Layer
          </p>
          <h2 className="text-[36px] sm:text-[44px] font-semibold tracking-[-0.03em] text-[#0a0a0a] leading-[1.1] mb-4">
            Every action is deliberate
          </h2>
          <p className="text-[15.5px] text-[#6a6a6a] max-w-md mx-auto">
            Every action goes through multiple decision layers before execution. Nothing runs on guesswork.
          </p>
        </motion.div>

        {/* Flow diagram */}
        <div className="flex flex-col items-center gap-0">
          {STEPS.map((step, i) => (
            <div key={i} className="flex flex-col items-center w-full max-w-sm">
              <motion.div
                initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.08 }}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border border-black/[0.07] bg-white/70 hover:bg-white hover:border-black/[0.12] transition-all duration-300"
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#0a0a0a] text-white flex items-center justify-center text-[11px] font-semibold">
                  {i + 1}
                </div>
                <div>
                  <p className="text-[13.5px] font-semibold text-[#0a0a0a] tracking-[-0.02em]">{step.label}</p>
                  <p className="text-[12px] text-[#8a8a8a] mt-0.5">{step.desc}</p>
                </div>
              </motion.div>
              {i < STEPS.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={inView ? { opacity: 1, scaleY: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                  className="w-px h-6 bg-gradient-to-b from-black/15 to-transparent origin-top"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
