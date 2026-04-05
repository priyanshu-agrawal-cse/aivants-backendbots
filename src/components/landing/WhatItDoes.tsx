"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Generates & manages leads",
    desc: "Identifies, qualifies, and nurtures prospects autonomously across every channel.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "Communicates across channels",
    desc: "Sends, receives, and responds via email, WhatsApp, Telegram, and calls.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: "Runs campaigns automatically",
    desc: "Plans, launches, and optimizes marketing campaigns without human input.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: "Manages clients & projects",
    desc: "Tracks deliverables, updates clients, and coordinates project timelines.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    ),
    title: "Executes follow-ups intelligently",
    desc: "Times and personalizes follow-ups based on context, behavior, and history.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    title: "Monitors & self-corrects",
    desc: "Continuously evaluates outcomes and adjusts its own execution strategy.",
  },
];

function FeatureCard({ icon, title, desc, index }: { icon: React.ReactNode; title: string; desc: string; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 }}
      className="group p-6 rounded-2xl border border-black/[0.07] bg-white/50 hover:bg-white/80 hover:border-black/[0.12] hover:shadow-[0_4px_24px_rgba(0,0,0,0.05)] transition-all duration-300"
    >
      <div className="w-9 h-9 rounded-xl bg-[#0a0a0a]/[0.05] flex items-center justify-center text-[#0a0a0a] mb-4 group-hover:bg-[#0a0a0a] group-hover:text-white transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-[14.5px] font-semibold text-[#0a0a0a] tracking-[-0.02em] mb-1.5">
        {title}
      </h3>
      <p className="text-[13px] text-[#7a7a7a] leading-relaxed">{desc}</p>
    </motion.div>
  );
}

export default function WhatItDoes() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="product" className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#9a9a9a] uppercase mb-4">
            Capabilities
          </p>
          <h2 className="text-[36px] sm:text-[44px] font-semibold tracking-[-0.03em] text-[#0a0a0a] leading-[1.1] mb-4">
            Everything it executes for you
          </h2>
          <p className="text-[15.5px] text-[#6a6a6a] max-w-md mx-auto">
            Not a copilot. Not a chatbot. A system that operates your business end-to-end.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} {...f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
