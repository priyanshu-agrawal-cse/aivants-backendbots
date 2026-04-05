"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";

const FAQS = [
  {
    q: "Is this just another AI tool?",
    a: "No. AIVANTS executes tasks, not just generates outputs. It acts on your behalf — contacting leads, running campaigns, updating clients — without you lifting a finger.",
  },
  {
    q: "How does it access my business data?",
    a: "AIVANTS connects to your existing tools via native integrations and APIs. It reads only what it needs to execute each task, and every action is logged.",
  },
  {
    q: "Is my data secure?",
    a: "Every command requires authentication via a unique secure code. No action is taken without verification. Your data is never used to train models.",
  },
  {
    q: "Can I control what it does?",
    a: "Completely. You define the scope, set permissions, and can pause, override, or redirect AIVANTS at any moment from any channel.",
  },
  {
    q: "Do I need to set up anything complex?",
    a: "No. Onboarding is designed to be fast. Connect your tools, define your business context, and AIVANTS begins operating within minutes.",
  },
];

function FAQItem({ q, a, index, inView }: { q: string; a: string; index: number; inView: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 + index * 0.06 }}
      className="border-b border-black/[0.07] last:border-none"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className="text-[14.5px] font-semibold text-[#0a0a0a] tracking-[-0.02em] group-hover:text-[#333] transition-colors">
          {q}
        </span>
        <div
          className={`flex-shrink-0 w-5 h-5 rounded-full border border-black/15 flex items-center justify-center transition-all duration-300 ${
            open ? "bg-[#0a0a0a] border-[#0a0a0a] rotate-45" : ""
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke={open ? "white" : "currentColor"}
            strokeWidth="2.5"
            width="10"
            height="10"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-[13.5px] text-[#7a7a7a] leading-relaxed max-w-lg">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-32 px-6 bg-[#f5f5f5]">
      <div className="max-w-2xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14"
        >
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#9a9a9a] uppercase mb-4">FAQ</p>
          <h2 className="text-[36px] sm:text-[44px] font-semibold tracking-[-0.03em] text-[#0a0a0a] leading-[1.1]">
            Common questions
          </h2>
        </motion.div>

        <div>
          {FAQS.map((item, i) => (
            <FAQItem key={i} {...item} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
