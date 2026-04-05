"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function FinalCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-32 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl bg-[#0a0a0a] px-8 py-20 overflow-hidden"
        >
          {/* Subtle background dots */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-white/[0.04] rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-white/30 uppercase mb-6">
              Get Started
            </p>
            <h2 className="text-[38px] sm:text-[50px] font-semibold tracking-[-0.04em] text-white leading-[1.05] mb-6">
              Start operating your business on AI
            </h2>
            <p className="text-[15.5px] text-white/40 max-w-sm mx-auto mb-10 leading-relaxed">
              Join the companies already running on AIVANTS. No setup complexity. No learning curve.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 bg-white text-[#0a0a0a] text-[14px] font-semibold px-8 py-3.5 rounded-full hover:bg-white/90 transition-all duration-200 tracking-[-0.01em] shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
            >
              Sign Up — it&apos;s free
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
