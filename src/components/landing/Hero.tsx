"use client";

import { motion } from "framer-motion";
import HeroNode from "./HeroNode";

const EASE = "easeOut" as const;

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 pb-24 px-6 overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,0,0,0.03)_0%,transparent_60%)] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto w-full flex flex-col items-center text-center">
        {/* Badge */}
        <FadeUp delay={0}>
          <div className="mb-8 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-black/[0.08] bg-white/60 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a] animate-pulse" />
            <span className="text-[11.5px] font-medium text-[#3a3a3a] tracking-[0.02em] uppercase">
              Autonomous Business AI
            </span>
          </div>
        </FadeUp>

        {/* Headline */}
        <FadeUp delay={0.1}>
          <h1 className="text-[52px] sm:text-[64px] lg:text-[76px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#0a0a0a] mb-6 max-w-3xl">
            Autonomous AI that{" "}
            <span className="text-[#3a3a3a]">runs your business</span>
          </h1>
        </FadeUp>

        {/* Subtext */}
        <FadeUp delay={0.2}>
          <p className="text-[17px] sm:text-[18px] text-[#6a6a6a] font-normal tracking-[-0.01em] max-w-xl leading-relaxed mb-10">
            AIVANTS researches, decides, and executes — across your entire company.
          </p>
        </FadeUp>

        {/* CTAs */}
        <FadeUp delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href="#"
              className="bg-[#0a0a0a] text-white text-[14px] font-semibold px-7 py-3.5 rounded-full hover:bg-[#1a1a1a] transition-all duration-200 tracking-[-0.01em] shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
            >
              Sign Up — it&apos;s free
            </a>
            <a
              href="#product"
              className="text-[14px] font-medium text-[#4a4a4a] px-7 py-3.5 rounded-full border border-black/10 hover:border-black/20 hover:bg-white/60 transition-all duration-200 tracking-[-0.01em]"
            >
              View Product
            </a>
          </div>
        </FadeUp>

        {/* Node visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.4 }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.04)_0%,transparent_70%)] pointer-events-none" />
          <HeroNode />
        </motion.div>
      </div>
    </section>
  );
}
